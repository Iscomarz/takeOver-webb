-- Migration: Event-scoped QR discount codes (schema, RLS, grants, RPCs)
-- Change: qr-discount-codes (Phase 1, database slice)
--
-- BEFORE APPLYING: replace the admin uuid placeholder in section 3 below
-- (v_admin_uid). The migration aborts if the placeholder is still present.
-- Rollback: supabase/rollback/20261009120000_discount_codes_qr.down.sql

-- 1. Columns and uniqueness ---------------------------------------------------
-- Legacy rows keep idEvento / porcentaje NULL, so the RPCs treat them as inert.
ALTER TABLE public."codigosDescuento"
  ADD COLUMN "idEvento"       integer REFERENCES public."mEvento"(idevento),
  ADD COLUMN porcentaje       numeric(5,2) CHECK (porcentaje > 0 AND porcentaje < 100),
  ADD COLUMN reserva_token    uuid,
  ADD COLUMN reserva_pi       text,
  ADD COLUMN reserva_expira   timestamptz,
  ADD CONSTRAINT "codigosDescuento_codigo_key" UNIQUE (codigo);

-- 2. Stop anonymous enumeration of codes --------------------------------------
DROP POLICY IF EXISTS "Enable read access for all users" ON public."codigosDescuento";
REVOKE ALL ON public."codigosDescuento" FROM anon;

-- 3. Admin policy bound to a single auth uid ----------------------------------
-- Replaces the permissive USING (true) policy from 20260729220000.
DO $$
DECLARE
  -- PENDING: set to the auth.users.id of franmtz96@gmail.com before applying.
  v_admin_uid text := '__ADMIN_UUID_PLACEHOLDER__';
BEGIN
  IF v_admin_uid !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Admin uuid placeholder not replaced in migration 20261009120000';
  END IF;

  DROP POLICY IF EXISTS "Admin All Access codigosDescuento" ON public."codigosDescuento";
  EXECUTE format(
    'CREATE POLICY "Admin All Access codigosDescuento" ON public."codigosDescuento" '
    'FOR ALL TO authenticated '
    'USING (auth.uid() = %L::uuid) WITH CHECK (auth.uid() = %L::uuid)',
    v_admin_uid, v_admin_uid
  );
END
$$;

-- 4. RPCs ---------------------------------------------------------------------
-- All functions: SECURITY DEFINER, fixed search_path, codes normalised with
-- upper(trim()). Execute is restricted to service_role (section 5).

-- 4.1 validar: read-only check. Holds are intentionally ignored (reservar decides).
CREATE OR REPLACE FUNCTION public.validar_codigo_descuento(
  p_codigo text,
  p_id_evento integer
)
RETURNS TABLE(valido boolean, porcentaje numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_pct numeric;
BEGIN
  SELECT c.porcentaje INTO v_pct
  FROM "codigosDescuento" c
  WHERE c.codigo = upper(trim(p_codigo))
    AND c."idEvento" IS NOT NULL
    AND c."idEvento" = p_id_evento
    AND c.porcentaje IS NOT NULL
    AND c.acreditado IS NOT TRUE;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_pct;
  ELSE
    RETURN QUERY SELECT false, NULL::numeric;
  END IF;
END;
$$;

-- 4.2 reservar: lock the row, read, then branch. Never overwrites a hold that
-- has a PI unless the caller proves the old PI is dead (CAS on p_token_esperado).
CREATE OR REPLACE FUNCTION public.reservar_codigo_descuento(
  p_codigo text,
  p_id_evento integer,
  p_token uuid,
  p_token_previo uuid,
  p_token_esperado uuid,
  p_ttl_min integer
)
RETURNS TABLE(resultado text, porcentaje numeric, token_actual uuid, pi_actual text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_row "codigosDescuento"%ROWTYPE;
  v_live boolean;
BEGIN
  SELECT * INTO v_row
  FROM "codigosDescuento" c
  WHERE c.codigo = upper(trim(p_codigo))
  FOR UPDATE;

  -- Not found, redeemed, legacy (not event-scoped) or other event.
  IF NOT FOUND
     OR v_row.acreditado IS TRUE
     OR v_row."idEvento" IS NULL
     OR v_row.porcentaje IS NULL
     OR v_row."idEvento" <> p_id_evento THEN
    RETURN QUERY SELECT 'unavailable'::text, NULL::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  v_live := v_row.reserva_expira IS NOT NULL AND v_row.reserva_expira > now();

  -- Free code, or compare-and-set on the expected current token.
  IF v_row.reserva_token IS NULL
     OR (p_token_esperado IS NOT NULL AND v_row.reserva_token = p_token_esperado) THEN
    UPDATE "codigosDescuento" c
    SET reserva_token = p_token,
        reserva_pi = NULL,
        reserva_expira = now() + make_interval(mins => p_ttl_min)
    WHERE c.id = v_row.id;
    RETURN QUERY SELECT 'reserved'::text, v_row.porcentaje, p_token, NULL::text;
    RETURN;
  END IF;

  -- CAS requested but the holder changed in the meantime.
  IF p_token_esperado IS NOT NULL THEN
    RETURN QUERY SELECT 'unavailable'::text, NULL::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  -- Live hold from somebody else.
  IF v_live AND v_row.reserva_token IS DISTINCT FROM p_token_previo THEN
    RETURN QUERY SELECT 'unavailable'::text, NULL::numeric, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  -- Expired hold, or the buyer's own previous hold: the server must check the
  -- earlier PI in Stripe. Nothing is written here.
  RETURN QUERY SELECT 'takeover_required'::text, v_row.porcentaje,
                      v_row.reserva_token, v_row.reserva_pi;
END;
$$;

-- 4.3 vincular: attach the PaymentIntent id to the buyer's hold.
CREATE OR REPLACE FUNCTION public.vincular_reserva_descuento(
  p_token uuid,
  p_payment_intent text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE "codigosDescuento" c
  SET reserva_pi = p_payment_intent
  WHERE c.reserva_token = p_token
    AND c.acreditado IS NOT TRUE;
  RETURN FOUND;
END;
$$;

-- 4.4 extender: keep an earlier hold alive while its PI may still complete.
CREATE OR REPLACE FUNCTION public.extender_reserva_descuento(
  p_token uuid,
  p_ttl_min integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE "codigosDescuento" c
  SET reserva_expira = now() + make_interval(mins => p_ttl_min)
  WHERE c.reserva_token = p_token
    AND c.acreditado IS NOT TRUE;
  RETURN FOUND;
END;
$$;

-- 4.5 liberar: drop the hold if the token still matches and the code is unredeemed.
CREATE OR REPLACE FUNCTION public.liberar_codigo_descuento(
  p_codigo text,
  p_token uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE "codigosDescuento" c
  SET reserva_token = NULL,
      reserva_pi = NULL,
      reserva_expira = NULL
  WHERE c.codigo = upper(trim(p_codigo))
    AND c.reserva_token = p_token
    AND c.acreditado IS NOT TRUE;
  RETURN FOUND;
END;
$$;

-- 4.6 canjear: permanent redemption, matched on the PI id reported by Stripe.
--   redeemed             hold belonged to p_payment_intent
--   already_same_pi      code already redeemed by this same PI (idempotent)
--   superseded_redeemed  PI paid but the hold now belongs to another holder;
--                        redeemed anyway, other holder's PI returned for cancel
--   double_spend         already redeemed by a different PI, or code unknown /
--                        legacy; writes nothing
CREATE OR REPLACE FUNCTION public.canjear_codigo_descuento(
  p_codigo text,
  p_token uuid,
  p_payment_intent text
)
RETURNS TABLE(resultado text, pi_desplazado text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row "codigosDescuento"%ROWTYPE;
  v_codigo text := upper(trim(p_codigo));
BEGIN
  SELECT * INTO v_row
  FROM "codigosDescuento" c
  WHERE c.codigo = v_codigo
  FOR UPDATE;

  IF NOT FOUND OR v_row."idEvento" IS NULL THEN
    RAISE WARNING 'DISCOUNT_DOUBLE_SPEND codigo=% pi=% (unknown or legacy code)', v_codigo, p_payment_intent;
    RETURN QUERY SELECT 'double_spend'::text, NULL::text;
    RETURN;
  END IF;

  IF v_row.acreditado IS TRUE THEN
    IF v_row.session_id = p_payment_intent THEN
      RETURN QUERY SELECT 'already_same_pi'::text, NULL::text;
    ELSE
      RAISE WARNING 'DISCOUNT_DOUBLE_SPEND codigo=% pi=% redeemed_by=%', v_codigo, p_payment_intent, v_row.session_id;
      RETURN QUERY SELECT 'double_spend'::text, NULL::text;
    END IF;
    RETURN;
  END IF;

  IF v_row.reserva_pi = p_payment_intent
     OR (v_row.reserva_pi IS NULL AND v_row.reserva_token = p_token) THEN
    UPDATE "codigosDescuento" c
    SET acreditado = true,
        fecha_acreditado = current_date,
        session_id = p_payment_intent,
        reserva_token = NULL,
        reserva_pi = NULL,
        reserva_expira = NULL
    WHERE c.id = v_row.id;
    RETURN QUERY SELECT 'redeemed'::text, NULL::text;
    RETURN;
  END IF;

  -- The paid PI lost its hold to someone else (or the hold was released).
  UPDATE "codigosDescuento" c
  SET acreditado = true,
      fecha_acreditado = current_date,
      session_id = p_payment_intent,
      reserva_token = NULL,
      reserva_pi = NULL,
      reserva_expira = NULL
  WHERE c.id = v_row.id;
  RETURN QUERY SELECT 'superseded_redeemed'::text, v_row.reserva_pi;
END;
$$;

-- 5. Privileges: service_role only ----------------------------------------------
REVOKE ALL ON FUNCTION public.validar_codigo_descuento(text, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reservar_codigo_descuento(text, integer, uuid, uuid, uuid, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vincular_reserva_descuento(uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.extender_reserva_descuento(uuid, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.liberar_codigo_descuento(text, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.canjear_codigo_descuento(text, uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.validar_codigo_descuento(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.reservar_codigo_descuento(text, integer, uuid, uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.vincular_reserva_descuento(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.extender_reserva_descuento(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.liberar_codigo_descuento(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.canjear_codigo_descuento(text, uuid, text) TO service_role;
