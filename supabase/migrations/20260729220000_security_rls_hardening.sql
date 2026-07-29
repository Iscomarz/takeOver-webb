-- ========================================================
-- MIGRACIÓN DE SEGURIDAD Y BLINDAJE DE RLS
-- ========================================================

-- 1. HABILITAR RLS EN TODAS LAS TABLAS EXISTENTES
ALTER TABLE IF EXISTS public."mEvento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."cFaseEvento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."tGaleria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."tSoundsTakeOver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_member ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public."mCliente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."mVenta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."mPago" ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public."codigosDescuento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."tListaEspera" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."tFormularioInvitacion" ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.generos_musicales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.r_evento_genero ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."cFormaPago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.venue ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.mcampania ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mcampaniadestinatario ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."mRecordatorioTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."mRecordatorioEvento" ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLÍTICAS PERMISIVAS ANTERIORES EN TICKET Y TABLAS PÚBLICAS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ticket;
DROP POLICY IF EXISTS "Policy with security definer functions" ON public.ticket;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.ticket;
DROP POLICY IF EXISTS "Policy with security definer functions" ON public.r_evento_genero;
DROP POLICY IF EXISTS "Policy with security definer functions" ON public.venue;

-- 3. POLÍTICAS DE ACCESO TOTAL PARA USUARIOS AUTENTICADOS (ADMIN)
DROP POLICY IF EXISTS "Admin All Access mEvento" ON public."mEvento";
CREATE POLICY "Admin All Access mEvento" ON public."mEvento" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access cFaseEvento" ON public."cFaseEvento";
CREATE POLICY "Admin All Access cFaseEvento" ON public."cFaseEvento" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access tGaleria" ON public."tGaleria";
CREATE POLICY "Admin All Access tGaleria" ON public."tGaleria" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access tSoundsTakeOver" ON public."tSoundsTakeOver";
CREATE POLICY "Admin All Access tSoundsTakeOver" ON public."tSoundsTakeOver" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access team_member" ON public.team_member;
CREATE POLICY "Admin All Access team_member" ON public.team_member FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access mCliente" ON public."mCliente";
CREATE POLICY "Admin All Access mCliente" ON public."mCliente" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access mVenta" ON public."mVenta";
CREATE POLICY "Admin All Access mVenta" ON public."mVenta" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access ticket" ON public.ticket;
CREATE POLICY "Admin All Access ticket" ON public.ticket FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access mPago" ON public."mPago";
CREATE POLICY "Admin All Access mPago" ON public."mPago" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access codigosDescuento" ON public."codigosDescuento";
CREATE POLICY "Admin All Access codigosDescuento" ON public."codigosDescuento" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access tListaEspera" ON public."tListaEspera";
CREATE POLICY "Admin All Access tListaEspera" ON public."tListaEspera" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access tFormularioInvitacion" ON public."tFormularioInvitacion";
CREATE POLICY "Admin All Access tFormularioInvitacion" ON public."tFormularioInvitacion" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access generos_musicales" ON public.generos_musicales;
CREATE POLICY "Admin All Access generos_musicales" ON public.generos_musicales FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access r_evento_genero" ON public.r_evento_genero;
CREATE POLICY "Admin All Access r_evento_genero" ON public.r_evento_genero FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access cFormaPago" ON public."cFormaPago";
CREATE POLICY "Admin All Access cFormaPago" ON public."cFormaPago" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access venue" ON public.venue;
CREATE POLICY "Admin All Access venue" ON public.venue FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access mcampania" ON public.mcampania;
CREATE POLICY "Admin All Access mcampania" ON public.mcampania FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access mcampaniadestinatario" ON public.mcampaniadestinatario;
CREATE POLICY "Admin All Access mcampaniadestinatario" ON public.mcampaniadestinatario FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access mRecordatorioTemplate" ON public."mRecordatorioTemplate";
CREATE POLICY "Admin All Access mRecordatorioTemplate" ON public."mRecordatorioTemplate" FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access mRecordatorioEvento" ON public."mRecordatorioEvento";
CREATE POLICY "Admin All Access mRecordatorioEvento" ON public."mRecordatorioEvento" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. POLÍTICAS DE LECTURA PÚBLICA PARA EL FRONT (ANON)
DROP POLICY IF EXISTS "Public Read mEvento" ON public."mEvento";
CREATE POLICY "Public Read mEvento" ON public."mEvento" FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read cFaseEvento" ON public."cFaseEvento";
CREATE POLICY "Public Read cFaseEvento" ON public."cFaseEvento" FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read tGaleria" ON public."tGaleria";
CREATE POLICY "Public Read tGaleria" ON public."tGaleria" FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read tSoundsTakeOver" ON public."tSoundsTakeOver";
CREATE POLICY "Public Read tSoundsTakeOver" ON public."tSoundsTakeOver" FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read team_member" ON public.team_member;
CREATE POLICY "Public Read team_member" ON public.team_member FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read generos_musicales" ON public.generos_musicales;
CREATE POLICY "Public Read generos_musicales" ON public.generos_musicales FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read r_evento_genero" ON public.r_evento_genero;
CREATE POLICY "Public Read r_evento_genero" ON public.r_evento_genero FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read cFormaPago" ON public."cFormaPago";
CREATE POLICY "Public Read cFormaPago" ON public."cFormaPago" FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public Read venue" ON public.venue;
CREATE POLICY "Public Read venue" ON public.venue FOR SELECT TO anon USING (true);

-- Permitir envíos de formularios desde el front sin exponer lectura
DROP POLICY IF EXISTS "Anon Insert Lista Espera" ON public."tListaEspera";
CREATE POLICY "Anon Insert Lista Espera" ON public."tListaEspera" FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Insert Formulario Invitacion" ON public."tFormularioInvitacion";
CREATE POLICY "Anon Insert Formulario Invitacion" ON public."tFormularioInvitacion" FOR INSERT TO anon WITH CHECK (true);
