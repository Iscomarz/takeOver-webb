-- Verification script for the discount code RPCs (migration 20261009120000).
-- Run against a LOCAL or staging database AFTER the migration, as a superuser
-- (e.g. `psql "$DB_URL" -f scripts/verify-discount-db.sql`). Never run against
-- production. Everything runs in one transaction that is rolled back at the end.
-- Any failed check raises an exception and aborts the script.

BEGIN;

-- Fixtures: one event-scoped code (15%) on the first existing event.
INSERT INTO public."codigosDescuento" (codigo, acreditado, "idEvento", porcentaje)
SELECT 'VERIFYQR01', false, min(idevento), 15 FROM public."mEvento";

INSERT INTO public."codigosDescuento" (codigo, acreditado)
VALUES ('VERIFYLEGACY', false);

DO $$
DECLARE
  v_ev integer := (SELECT "idEvento" FROM public."codigosDescuento" WHERE codigo = 'VERIFYQR01');
  t1 uuid := gen_random_uuid();
  t2 uuid := gen_random_uuid();
  t3 uuid := gen_random_uuid();
  r record;
  b boolean;
BEGIN
  -- validar: valid, wrong event, unknown, legacy
  SELECT * INTO r FROM validar_codigo_descuento(' verifyqr01 ', v_ev);
  ASSERT r.valido AND r.porcentaje = 15, 'validar: valid code should return 15';
  SELECT * INTO r FROM validar_codigo_descuento('VERIFYQR01', v_ev + 9999);
  ASSERT NOT r.valido, 'validar: other event must be invalid';
  SELECT * INTO r FROM validar_codigo_descuento('NOPE', v_ev);
  ASSERT NOT r.valido, 'validar: unknown must be invalid';
  SELECT * INTO r FROM validar_codigo_descuento('VERIFYLEGACY', v_ev);
  ASSERT NOT r.valido, 'validar: legacy must be invalid';

  -- reservar: free code
  SELECT * INTO r FROM reservar_codigo_descuento('VERIFYQR01', v_ev, t1, NULL, NULL, 30);
  ASSERT r.resultado = 'reserved' AND r.porcentaje = 15, 'reservar: first hold';

  -- second buyer is rejected while the hold is live
  SELECT * INTO r FROM reservar_codigo_descuento('VERIFYQR01', v_ev, t2, NULL, NULL, 30);
  ASSERT r.resultado = 'unavailable', 'reservar: live hold must block others';

  -- vincular
  b := vincular_reserva_descuento(t1, 'pi_one');
  ASSERT b, 'vincular: should link PI';
  b := vincular_reserva_descuento(t2, 'pi_x');
  ASSERT NOT b, 'vincular: wrong token must not link';

  -- own previous hold -> takeover_required, nothing written
  SELECT * INTO r FROM reservar_codigo_descuento('VERIFYQR01', v_ev, t2, t1, NULL, 30);
  ASSERT r.resultado = 'takeover_required' AND r.token_actual = t1 AND r.pi_actual = 'pi_one',
    'reservar: own previous hold should require takeover';
  ASSERT (SELECT reserva_token FROM public."codigosDescuento" WHERE codigo = 'VERIFYQR01') = t1,
    'reservar: takeover_required must not write';

  -- CAS miss
  SELECT * INTO r FROM reservar_codigo_descuento('VERIFYQR01', v_ev, t2, t1, t3, 30);
  ASSERT r.resultado = 'unavailable', 'reservar: CAS miss must be unavailable';

  -- CAS hit
  SELECT * INTO r FROM reservar_codigo_descuento('VERIFYQR01', v_ev, t2, t1, t1, 30);
  ASSERT r.resultado = 'reserved', 'reservar: CAS hit swaps the hold';
  ASSERT (SELECT reserva_pi FROM public."codigosDescuento" WHERE codigo = 'VERIFYQR01') IS NULL,
    'reservar: CAS must clear reserva_pi';

  -- expired hold by someone else -> takeover_required
  UPDATE public."codigosDescuento" SET reserva_expira = now() - interval '1 minute'
  WHERE codigo = 'VERIFYQR01';
  SELECT * INTO r FROM reservar_codigo_descuento('VERIFYQR01', v_ev, t3, NULL, NULL, 30);
  ASSERT r.resultado = 'takeover_required' AND r.token_actual = t2, 'reservar: expired hold takeover';

  -- extender
  b := extender_reserva_descuento(t2, 30);
  ASSERT b, 'extender: token match extends';
  SELECT * INTO r FROM reservar_codigo_descuento('VERIFYQR01', v_ev, t3, NULL, NULL, 30);
  ASSERT r.resultado = 'unavailable', 'extender: extended hold is live again';

  -- liberar: wrong token no-op, right token releases
  b := liberar_codigo_descuento('VERIFYQR01', t3);
  ASSERT NOT b, 'liberar: wrong token is a no-op';
  b := liberar_codigo_descuento(' verifyqr01', t2);
  ASSERT b, 'liberar: matching token releases';
  SELECT * INTO r FROM reservar_codigo_descuento('VERIFYQR01', v_ev, t3, NULL, NULL, 30);
  ASSERT r.resultado = 'reserved', 'liberar: code usable again';

  -- canjear: redeemed, idempotent, double spend
  b := vincular_reserva_descuento(t3, 'pi_three');
  SELECT * INTO r FROM canjear_codigo_descuento('VERIFYQR01', t3, 'pi_three');
  ASSERT r.resultado = 'redeemed', 'canjear: redeemed';
  SELECT * INTO r FROM canjear_codigo_descuento('VERIFYQR01', t3, 'pi_three');
  ASSERT r.resultado = 'already_same_pi', 'canjear: idempotent';
  SELECT * INTO r FROM canjear_codigo_descuento('VERIFYQR01', t1, 'pi_other');
  ASSERT r.resultado = 'double_spend', 'canjear: different PI is double_spend';
  ASSERT (SELECT session_id FROM public."codigosDescuento" WHERE codigo = 'VERIFYQR01') = 'pi_three',
    'canjear: double_spend must not write';
  SELECT * INTO r FROM reservar_codigo_descuento('VERIFYQR01', v_ev, t1, NULL, NULL, 30);
  ASSERT r.resultado = 'unavailable', 'reservar: redeemed code is unavailable';
  SELECT * INTO r FROM validar_codigo_descuento('VERIFYQR01', v_ev);
  ASSERT NOT r.valido, 'validar: redeemed code is invalid';

  -- canjear superseded: hold now belongs to another PI
  INSERT INTO public."codigosDescuento" (codigo, acreditado, "idEvento", porcentaje)
  VALUES ('VERIFYQR02', false, v_ev, 15);
  PERFORM reservar_codigo_descuento('VERIFYQR02', v_ev, t1, NULL, NULL, 30);
  PERFORM vincular_reserva_descuento(t1, 'pi_holder');
  SELECT * INTO r FROM canjear_codigo_descuento('VERIFYQR02', t2, 'pi_paid');
  ASSERT r.resultado = 'superseded_redeemed' AND r.pi_desplazado = 'pi_holder',
    'canjear: superseded_redeemed returns the displaced PI';

  RAISE NOTICE 'RPC checks passed';
END
$$;

-- Privilege checks: anon and authenticated must not read rows or call RPCs.
SET LOCAL ROLE anon;
DO $$
DECLARE n integer;
BEGIN
  BEGIN
    SELECT count(*) INTO n FROM public."codigosDescuento";
    ASSERT n = 0, 'anon read must return 0 rows';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- table privileges revoked: also acceptable
  END;
  BEGIN
    PERFORM public.validar_codigo_descuento('VERIFYQR01', 1);
    RAISE EXCEPTION 'anon could call validar_codigo_descuento';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM public.reservar_codigo_descuento('VERIFYQR01', 1, gen_random_uuid(), NULL, NULL, 30);
    RAISE EXCEPTION 'anon could call reservar_codigo_descuento';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$$;
RESET ROLE;

SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM public.canjear_codigo_descuento('VERIFYQR01', gen_random_uuid(), 'pi_x');
    RAISE EXCEPTION 'authenticated could call canjear_codigo_descuento';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  -- Non-admin authenticated user must not see any code (RLS admin-uid policy).
  PERFORM set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  ASSERT (SELECT count(*) FROM public."codigosDescuento") = 0, 'non-admin authenticated must see 0 rows';
END
$$;
RESET ROLE;

-- Concurrency (manual, two psql sessions, against a disposable database):
--   Setup : INSERT a code 'RACE01' scoped to an event with porcentaje 15 (committed).
--   Sess A: BEGIN; SELECT * FROM reservar_codigo_descuento('RACE01', <ev>, '<uuidA>', NULL, NULL, 30);
--           (do not commit yet)
--   Sess B: SELECT * FROM reservar_codigo_descuento('RACE01', <ev>, '<uuidB>', NULL, NULL, 30);
--           -> blocks on the row lock until A commits.
--   Sess A: COMMIT;   -> A gets 'reserved'.
--   Sess B: unblocks  -> B gets 'unavailable'. Exactly one 'reserved' overall.
--   Cleanup: DELETE FROM "codigosDescuento" WHERE codigo = 'RACE01';

ROLLBACK;
