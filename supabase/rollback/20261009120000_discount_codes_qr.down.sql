-- Manual rollback for 20261009120000_discount_codes_qr.sql
-- Not run by `supabase db push`. Revert the application first, then run this.
-- WARNING: dropping the columns discards all QR code data (event scope, percentage, holds).

-- 1. RPCs
DROP FUNCTION IF EXISTS public.canjear_codigo_descuento(text, uuid, text);
DROP FUNCTION IF EXISTS public.liberar_codigo_descuento(text, uuid);
DROP FUNCTION IF EXISTS public.extender_reserva_descuento(uuid, integer);
DROP FUNCTION IF EXISTS public.vincular_reserva_descuento(uuid, text);
DROP FUNCTION IF EXISTS public.reservar_codigo_descuento(text, integer, uuid, uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.validar_codigo_descuento(text, integer);

-- 2. Policies and grants back to the previous state
DROP POLICY IF EXISTS "Admin All Access codigosDescuento" ON public."codigosDescuento";
CREATE POLICY "Admin All Access codigosDescuento" ON public."codigosDescuento"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON public."codigosDescuento";
CREATE POLICY "Enable read access for all users" ON public."codigosDescuento"
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT ALL ON public."codigosDescuento" TO anon;

-- 3. Constraint and columns
ALTER TABLE public."codigosDescuento"
  DROP CONSTRAINT IF EXISTS "codigosDescuento_codigo_key",
  DROP COLUMN IF EXISTS reserva_expira,
  DROP COLUMN IF EXISTS reserva_pi,
  DROP COLUMN IF EXISTS reserva_token,
  DROP COLUMN IF EXISTS porcentaje,
  DROP COLUMN IF EXISTS "idEvento";
