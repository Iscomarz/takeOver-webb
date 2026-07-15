-- 1. Habilitar la extensión de llamadas de red si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Función que se ejecutará en el trigger para disparar la Edge Function asíncronamente
CREATE OR REPLACE FUNCTION trigger_notify_payment_accredited()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  project_url TEXT;
  service_anon_key TEXT;
BEGIN
  -- Verificar si el pago pasó de no acreditado (FALSE o NULL) a acreditado (TRUE)
  IF (OLD.acreditado = FALSE OR OLD.acreditado IS NULL) AND NEW.acreditado = TRUE THEN
    
    -- Nota: Modifica 'YOUR_SUPABASE_PROJECT_REF' por la referencia real de tu proyecto
    -- Por ejemplo en este caso: 'koubjdnhazjtykkmalfw'
    -- Y cambia 'YOUR_SUPABASE_ANON_KEY' por tu clave anon de Supabase
    
    payload := JSONB_BUILD_OBJECT(
      'idPago', NEW.idpago,
      'idTransaccionStripe', NEW."idTransaccionStripe",
      'monto', NEW.cantidad
    );

    -- Realizar la llamada HTTP POST asíncrona no bloqueante a la Edge Function
    PERFORM net.http_post(
      url := 'https://koubjdnhazjtykkmalfw.supabase.co/functions/v1/process-tickets',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"}'::JSON,
      body := payload::TEXT
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el Trigger en la tabla mPago
DROP TRIGGER IF EXISTS tr_payment_accredited ON "mPago";
CREATE TRIGGER tr_payment_accredited
AFTER UPDATE ON "mPago"
FOR EACH ROW
EXECUTE FUNCTION trigger_notify_payment_accredited();
