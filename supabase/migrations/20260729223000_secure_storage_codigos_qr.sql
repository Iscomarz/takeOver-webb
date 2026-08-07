-- ========================================================
-- MIGRACIÓN DE SEGURIDAD EN SUPABASE STORAGE (codigosQR)
-- ========================================================

-- 1. ASEGURAR QUE EL BUCKET 'codigosQR' SEA PRIVADO (NO ACCESIBLE PÚBLICAMENTE SIN ACCESO AUTENTICADO O SERVICE ROLE)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'codigosQR';

-- 2. LIMPIAR POLÍTICAS PREVIAS EN EL BUCKET 'codigosQR'
DROP POLICY IF EXISTS "Public Read codigosQR" ON storage.objects;
DROP POLICY IF EXISTS "Anon Read codigosQR" ON storage.objects;
DROP POLICY IF EXISTS "Anon Insert codigosQR" ON storage.objects;
DROP POLICY IF EXISTS "Admin All codigosQR" ON storage.objects;

-- 3. OTORGAR PERMISOS COMPLETOS AL ROL AUTENTICADO (ADMINISTRADORES EN PANEL ADMIN)
CREATE POLICY "Admin All codigosQR" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'codigosQR') 
WITH CHECK (bucket_id = 'codigosQR');
