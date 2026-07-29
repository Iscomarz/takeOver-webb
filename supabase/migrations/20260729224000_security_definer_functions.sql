-- ========================================================
-- CONFIGURACIÓN DE SECURITY DEFINER EN FUNCIONES DE PAGOS Y TICKETS
-- ========================================================

-- 1. ACREDITA PAGO FUNCTION (Generación de tickets y acreditación)
ALTER FUNCTION public.acredita_pago_function(text) SECURITY DEFINER;

-- 2. ACREDITA PAGO PROCEDURE
ALTER PROCEDURE public.acredita_pago(text) SECURITY DEFINER;
