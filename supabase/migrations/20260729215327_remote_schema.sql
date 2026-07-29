-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_graphql;

CREATE ROLE supabase_privileged_role;

GRANT supabase_privileged_role TO postgres;

CREATE EXTENSION wrappers WITH SCHEMA extensions;

CREATE FOREIGN DATA WRAPPER stripe
  HANDLER extensions.stripe_fdw_handler
  VALIDATOR extensions.stripe_fdw_validator;

CREATE SERVER stripe_server
  FOREIGN DATA WRAPPER stripe
  OPTIONS (
    api_key_id '__OPTION_API_KEY_ID__',
    api_url '__OPTION_API_URL__'
  );

CREATE EXTENSION pg_cron WITH SCHEMA pg_catalog;

CREATE EXTENSION pgsodium;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE SEQUENCE public."tFormularioInvitacion_id_seq" AS integer;

CREATE SEQUENCE public.team_member_id_seq;

CREATE FUNCTION public.acredita_pago_function (
  idpagostripe text
)
  RETURNS json
  LANGUAGE plpgsql
  AS $function$
DECLARE 
  idPagoRealizado INT;
  salt UUID;
  hash BYTEA;
  cantidad INT;
  idVentaRealizada INT;
  idFaseEve INT;
  referenciaT INT;
  codigoQRT TEXT;
  nombreComprador TEXT;
  correoComprador TEXT;
  nombreFase TEXT;
  tickets JSONB := '[]'::JSONB; -- Array JSON para los tickets
  ticketObj JSONB;
  idEvento INT;
BEGIN
  -- Obtener idPagoRealizado
  SELECT idpago INTO idPagoRealizado FROM (
    SELECT idpago
    FROM "mPago"
    WHERE "idTransaccionStripe" = idPagoStripe
    UNION ALL
    SELECT idpago
    FROM "mPago"
    WHERE checkout_session = idPagoStripe
    ) t
  LIMIT 1;
  
  IF idPagoRealizado IS NULL THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', 'Pago no encontrado');
  END IF;
  -- Acreditar el pago
  UPDATE "mPago" SET acreditado = TRUE, "fechaAcreditacion" = NOW() WHERE idpago = idPagoRealizado;
  -- CAMBIO AQUÍ: JOIN con mCliente para obtener nombre y correo
  SELECT v."cantidadTickets", v.idventa, v."idFaseEvento", c.nombre, c.correo
  INTO cantidad, idVentaRealizada, idFaseEve, nombreComprador, correoComprador
  FROM "mVenta" v
  JOIN "mCliente" c ON v.cliente_id = c.cliente_id  -- <-- Unión con la tabla de clientes
  WHERE v."idPago" = idPagoRealizado;
  -- Obtener el nombre de la fase del evento
  SELECT "nombreFace", "idEvento" INTO nombreFase, idEvento FROM "cFaseEvento" WHERE "idFase" = idFaseEve;
  -- Validar si hay tickets disponibles
  IF cantidad IS NULL OR cantidad = 0 THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', 'No hay tickets disponibles');
  END IF;
  -- Generar tickets según la cantidad obtenida
  FOR i IN 1..cantidad LOOP
    referenciaT := FLOOR(RANDOM() * 90000000 + 10000000);
    salt := gen_random_uuid();
    hash := digest(referenciaT::TEXT || salt::TEXT, 'sha256');
    codigoQRT := ENCODE(hash, 'hex');
    -- Insertar el ticket y obtener sus datos
    INSERT INTO ticket ("codigoQR", validado, "idVenta", "idFase", referencia, "pathStorage")
    VALUES (codigoQRT, FALSE, idVentaRealizada, idFaseEve, referenciaT, CONCAT('qr_', referenciaT, '.png'))
    RETURNING "codigoQR", referencia INTO codigoQRT, referenciaT;
    -- Construir objeto JSON del ticket con el nombre de la fase
    ticketObj := JSONB_BUILD_OBJECT(
      'codigoQR', codigoQRT, 
      'referencia', referenciaT, 
      'idFase', idFaseEve, 
      'nombreFase', nombreFase
    );
    
    tickets := tickets || ticketObj; -- Agregar al array JSON
  END LOOP;
  -- Retornar la respuesta con los códigos QR, referencias, nombre y correo (ahora vienen de mCliente)
  RETURN JSON_BUILD_OBJECT(
    'codigo', 0,
    'mensaje', 'Pago acreditado exitosamente',
    'nombreComprador', nombreComprador,
    'correoComprador', correoComprador,
    'tickets', tickets,
    'idEvento', idEvento
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', SQLERRM);
END;
$function$;

GRANT ALL ON FUNCTION public.acredita_pago_function(text) TO anon;

GRANT ALL ON FUNCTION public.acredita_pago_function(text) TO authenticated;

GRANT ALL ON FUNCTION public.acredita_pago_function(text) TO service_role;

CREATE PROCEDURE public.acredita_pago (
  IN idpagostripe text
)
  LANGUAGE plpgsql
  AS $procedure$
DECLARE 
idPagoRealizado INT;
salt UUID;
hash BYTEA;
cantidad numeric;
idVentaRealizada INT;
idFaseEve INT;
referenciaT INT;
codigoQRT TEXT;

BEGIN
  -- Obtener idPagoRealizado
  select idpago into idPagoRealizado
  from "mPago" 
  where "idTransaccionStripe" = idPagoStripe;
  --Acreditar "mPago"
  update "mPago" set acreditado = true, "fechaAcreditacion" = now() where idpago = idPagoRealizado;

  SELECT "cantidadTickets", idventa, "idFaseEvento"
  INTO cantidad, idVentaRealizada, idFaseEve
  FROM "mVenta"
  WHERE "idPago" = idPagoRealizado;

  -- Generar tickets según la cantidad obtenida
  FOR i IN 1..cantidad LOOP
    -- Generar referencia aleatoria de 8 dígitos
    referenciaT := FLOOR(RANDOM() * 90000000 + 10000000);
    -- Generar un UUID como salt
    salt := gen_random_uuid();
    -- Generar hash SHA-256 combinando la referencia y el salt
    hash := digest(referenciaT::TEXT || salt::TEXT, 'sha256');
    -- Convertir hash a hexadecimal
    codigoQRT := ENCODE(hash, 'hex');

    -- Insertar el ticket en la tabla
    INSERT INTO ticket ("codigoQR", validado, "idVenta", "idFase", referencia, "pathStorage")
    VALUES (codigoQRT, FALSE, idVentaRealizada, idFaseEve, referenciaT, CONCAT('qr_', referenciaT,'.png'));
  END LOOP;
  
  COMMIT;
  
END;
$procedure$;

GRANT ALL ON PROCEDURE public.acredita_pago(text) TO anon;

GRANT ALL ON PROCEDURE public.acredita_pago(text) TO authenticated;

GRANT ALL ON PROCEDURE public.acredita_pago(text) TO service_role;

CREATE FUNCTION public.generar_codigo_unico_cliente()
  RETURNS text
  LANGUAGE plpgsql
  AS $function$
DECLARE
  nuevo_codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Genera un código de 6 caracteres (Mayúsculas y Números)
    nuevo_codigo := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Verifica que no exista en mCliente
    SELECT EXISTS (SELECT 1 FROM "mCliente" WHERE codigo = nuevo_codigo) INTO existe;
    
    -- Si no existe, sal del bucle
    IF NOT existe THEN
      RETURN nuevo_codigo;
    END IF;
  END LOOP;
END;
$function$;

GRANT ALL ON FUNCTION public.generar_codigo_unico_cliente() TO anon;

GRANT ALL ON FUNCTION public.generar_codigo_unico_cliente() TO authenticated;

GRANT ALL ON FUNCTION public.generar_codigo_unico_cliente() TO service_role;

CREATE FUNCTION public.get_teams_for_user (
  user_id uuid
)
  RETURNS TABLE (
    team_id uuid
  )
  LANGUAGE plpgsql
  AS $function$BEGIN
  RETURN QUERY
  SELECT team_id
  FROM teams
  WHERE user_id = user_id;
END;$function$;

GRANT ALL ON FUNCTION public.get_teams_for_user(uuid) TO anon;

GRANT ALL ON FUNCTION public.get_teams_for_user(uuid) TO authenticated;

GRANT ALL ON FUNCTION public.get_teams_for_user(uuid) TO service_role;

CREATE FUNCTION public.guardar_pago_venta (
  monto           numeric,
  idtransstripe   text,
  nombrev         character varying,
  correov         character varying,
  cantidadt       numeric,
  descripcionfase text
)
  RETURNS json
  LANGUAGE plpgsql
  AS $function$
DECLARE 
  idPagoRealizado INT;
  idEventoActivo INT;
  idFaseCompra INT;
BEGIN
  -- Insertar pago
  INSERT INTO "mPago" ("cantidad", "fechaPago", "idFormaPago", "acreditado", "idTransaccionStripe") 
  VALUES (monto, now(), 3, false, idTransStripe)
  RETURNING idPago INTO idPagoRealizado;

  -- Verificar si se obtuvo idPago
  IF idPagoRealizado IS NULL THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', 'No se pudo obtener el ID del pago.');
  END IF;

  -- Obtener id del evento activo
  SELECT me.idevento INTO idEventoActivo
  FROM "mEvento" me
  WHERE me.activo = true
  ORDER BY me.idevento LIMIT 1;

  IF idEventoActivo IS NULL THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', 'No se pudo obtener el ID del evento activo.');
  END IF;

  -- Obtener idFase de la compra
  SELECT "idFase" INTO idFaseCompra
  FROM "cFaseEvento" cf
  WHERE "idEvento" = idEventoActivo AND "nombreFace" = descripcionFase
  ORDER BY "idFase" LIMIT 1;

  IF idFaseCompra IS NULL THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', 'No se pudo obtener el ID de la fase de la compra.');
  END IF;

  -- Insertar en "mVenta"
  INSERT INTO "mVenta" (nombre, correo, "idEvento", "fechaVenta", "cantidadTickets", "idPago", "idFaseEvento", "idUsuario")
  VALUES (nombreV, correoV, idEventoActivo, now(), cantidadT, idPagoRealizado, idFaseCompra, 'b2e2464a-cadf-4e5c-8ac9-851d6261f90c');

  -- Retornar éxito
  RETURN JSON_BUILD_OBJECT('codigo', 0, 'mensaje', 'Pago y venta guardados exitosamente', 'idPago', idPagoRealizado);

EXCEPTION
  WHEN OTHERS THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', SQLERRM);
END;
$function$;

GRANT ALL ON FUNCTION public.guardar_pago_venta(numeric, text, character varying, character varying, numeric, text) TO anon;

GRANT ALL ON FUNCTION public.guardar_pago_venta(numeric, text, character varying, character varying, numeric, text) TO authenticated;

GRANT ALL ON FUNCTION public.guardar_pago_venta(numeric, text, character varying, character varying, numeric, text) TO service_role;

CREATE FUNCTION public.guardar_pago_venta (
  monto                   numeric,
  idtransstripe           text,
  cliente_id              integer,
  cantidadt               numeric,
  descripcionfase         text,
  checkout_session_stripe text
)
  RETURNS json
  LANGUAGE plpgsql
  AS $function$
DECLARE 
  idPagoRealizado INT;
  idEventoActivo INT;
  idFaseCompra INT;
BEGIN
  -- Insertar pago
  INSERT INTO "mPago" ("cantidad", "fechaPago", "idFormaPago", "acreditado", "idTransaccionStripe", checkout_session) 
  VALUES (monto, now(), 3, false, idTransStripe, checkout_session_stripe)
  RETURNING idPago INTO idPagoRealizado;
  -- Verificar si se obtuvo idPago
  IF idPagoRealizado IS NULL THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', 'No se pudo obtener el ID del pago.');
  END IF;
  -- Obtener id del evento activo
  SELECT me.idevento INTO idEventoActivo
  FROM "mEvento" me
  WHERE me.activo = true
  ORDER BY me.idevento LIMIT 1;
  IF idEventoActivo IS NULL THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', 'No se pudo obtener el ID del evento activo.');
  END IF;
  -- Obtener idFase de la compra
  SELECT "idFase" INTO idFaseCompra
  FROM "cFaseEvento" cf
  WHERE "idEvento" = idEventoActivo AND "nombreFace" = descripcionFase
  ORDER BY "idFase" LIMIT 1;
  IF idFaseCompra IS NULL THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', 'No se pudo obtener el ID de la fase de la compra.');
  END IF;
  -- Insertar en "mVenta"
  INSERT INTO "mVenta" (cliente_id, "idEvento", "fechaVenta", "cantidadTickets", "idPago", "idFaseEvento", "idUsuario") -- <-- Cambio: cliente_id
  VALUES (cliente_id, idEventoActivo, now(), cantidadT, idPagoRealizado, idFaseCompra, 'b2e2464a-cadf-4e5c-8ac9-851d6261f90c');
  -- Retornar éxito
  RETURN JSON_BUILD_OBJECT('codigo', 0, 'mensaje', 'Pago y venta guardados exitosamente', 'idPago', idPagoRealizado);
EXCEPTION
  WHEN OTHERS THEN
    RETURN JSON_BUILD_OBJECT('codigo', 1, 'mensaje', SQLERRM);
END;
$function$;

GRANT ALL ON FUNCTION public.guardar_pago_venta(numeric, text, integer, numeric, text, text) TO anon;

GRANT ALL ON FUNCTION public.guardar_pago_venta(numeric, text, integer, numeric, text, text) TO authenticated;

GRANT ALL ON FUNCTION public.guardar_pago_venta(numeric, text, integer, numeric, text, text) TO service_role;

CREATE FUNCTION public.insertaventa (
  cliente_id      integer,
  cantidad        integer,
  idpagostripe    text,
  descripcionfase text
)
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
DECLARE 
  idPagoRealizado INT;
  idFaseEve INT;
  idEventoActivo INT;
BEGIN
  SET TIME ZONE 'America/Chihuahua';

  -- Buscamos el ID del pago
  SELECT idpago INTO idPagoRealizado
  FROM "mPago"
  WHERE "idTransaccionStripe" = idpagostripe;

  -- Buscamos el evento activo (usamos LIMIT 1 por seguridad)
  SELECT idevento INTO idEventoActivo
  FROM "mEvento"
  WHERE activo = true
  ORDER BY idevento DESC LIMIT 1; 

  -- Buscamos la fase
  SELECT "idFase" INTO idFaseEve
  FROM "cFaseEvento"
  WHERE "idEvento" = idEventoActivo AND "nombreFace" = descripcionfase;

  -- Insertamos la venta con la relación al cliente
  INSERT INTO "mVenta" (
    cliente_id, 
    "idEvento", 
    "fechaVenta",
    "cantidadTickets", 
    "idPago", 
    "idFaseEvento", 
    "idUsuario"
  )
  VALUES (
    cliente_id, 
    idEventoActivo, 
    now(),
    cantidad, 
    idPagoRealizado, 
    idFaseEve, 
    'b2e2464a-cadf-4e5c-8ac9-851d6261f90c' -- ID de usuario constante
  );
END;
$function$;

GRANT ALL ON FUNCTION public.insertaventa(integer, integer, text, text) TO anon;

GRANT ALL ON FUNCTION public.insertaventa(integer, integer, text, text) TO authenticated;

GRANT ALL ON FUNCTION public.insertaventa(integer, integer, text, text) TO service_role;

CREATE FUNCTION public.insertaventa (
  nombrev         text,
  correov         text,
  cantidad        integer,
  idpagostripe    text,
  descripcionfase text
)
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
DECLARE 
  idPagoRealizado INT;
  idFaseEve INT;
  idEventoActivo INT;
BEGIN
  SET TIME ZONE 'America/Chihuahua';

  SELECT idpago INTO idPagoRealizado
  FROM "mPago"
  WHERE "idTransaccionStripe" = idPagoStripe;

  SELECT idevento INTO idEventoActivo
  FROM "mEvento"
  WHERE activo = true;

  SELECT "idFase" INTO idFaseEve
  FROM "cFaseEvento"
  WHERE "idEvento" = idEventoActivo AND "nombreFace" = descripcionFase;

  INSERT INTO "mVenta" (
    nombre, correo, "idEvento", "fechaVenta",
    "cantidadTickets", "idPago", "idFaseEvento", "idUsuario"
  )
  VALUES (
    nombreV, correoV, idEventoActivo, now(),
    cantidad, idPagoRealizado, idFaseEve, 'b2e2464a-cadf-4e5c-8ac9-851d6261f90c'
  );
END;
$function$;

GRANT ALL ON FUNCTION public.insertaventa(text, text, integer, text, text) TO anon;

GRANT ALL ON FUNCTION public.insertaventa(text, text, integer, text, text) TO authenticated;

GRANT ALL ON FUNCTION public.insertaventa(text, text, integer, text, text) TO service_role;

CREATE FUNCTION public.set_sounds_take_over_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  new.actualizado_en = now();
  return new;
end;
$function$;

GRANT ALL ON FUNCTION public.set_sounds_take_over_updated_at() TO anon;

GRANT ALL ON FUNCTION public.set_sounds_take_over_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.set_sounds_take_over_updated_at() TO service_role;

CREATE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;

GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;

CREATE FUNCTION public.tr_asignar_codigo_cliente()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  -- Si el cliente ya trae un código (ej. carga manual), lo respetamos
  -- Si no, generamos uno nuevo usando la función anterior
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generar_codigo_unico_cliente();
  END IF;
  
  RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.tr_asignar_codigo_cliente() TO anon;

GRANT ALL ON FUNCTION public.tr_asignar_codigo_cliente() TO authenticated;

GRANT ALL ON FUNCTION public.tr_asignar_codigo_cliente() TO service_role;

CREATE FUNCTION public.trigger_notify_payment_accredited()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
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
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWJqZG5oYXpqdHlra21hbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MjA2NTYsImV4cCI6MjA0MTQ5NjY1Nn0.oWcXG_M4EC5_nw6gchqN6LHujrxIn-nzPvpPsdEGsDc"}'::jsonb,
      body := payload
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.trigger_notify_payment_accredited() TO anon;

GRANT ALL ON FUNCTION public.trigger_notify_payment_accredited() TO authenticated;

GRANT ALL ON FUNCTION public.trigger_notify_payment_accredited() TO service_role;

CREATE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $function$;

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;

GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;

GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;

CREATE FUNCTION public.ventas_por_fase (
  evento_id integer
)
  RETURNS TABLE (
    nombre_fase text,
    cantidad    bigint,
    monto       numeric
  )
  LANGUAGE sql
  AS $function$
  select 
    f."nombreFace" as nombre_fase,
    sum(v."cantidadTickets") as cantidad,
    sum(v."cantidadTickets" * f.precio) as monto
  from "mVenta" v
  join "cFaseEvento" f on f."idFase" = v."idFaseEvento"
  join "mEvento" e on e.idevento = v."idEvento"
  where v."idEvento" = evento_id
  group by f."nombreFace";
$function$;

GRANT ALL ON FUNCTION public.ventas_por_fase(integer) TO anon;

GRANT ALL ON FUNCTION public.ventas_por_fase(integer) TO authenticated;

GRANT ALL ON FUNCTION public.ventas_por_fase(integer) TO service_role;

CREATE TABLE public."cFaseEvento" (
  "idFase"          bigint                      GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "idEvento"        integer                     NOT NULL,
  "nombreFace"      character varying,
  precio            numeric,
  "fechaExpira"     timestamp without time zone,
  limite            numeric,
  activo            boolean                     DEFAULT false,
  "idPrecioStripe"  text,
  cantidad          numeric                     DEFAULT '0'::numeric,
  "cantidadVendida" numeric                     DEFAULT '0'::numeric,
  soldout           boolean,
  descripcion       text                        DEFAULT ''::text,
  oculto            boolean                     DEFAULT false
);

COMMENT ON TABLE public."cFaseEvento" IS 'face del ticket del evento';

COMMENT ON COLUMN public."cFaseEvento".limite IS 'Para limitar la cantidad de boletos disponibles en esta fase';

COMMENT ON COLUMN public."cFaseEvento".activo IS 'si la face esta activa o desactivada';

COMMENT ON COLUMN public."cFaseEvento"."idPrecioStripe" IS 'idetificador para cobrar con stripe';

COMMENT ON COLUMN public."cFaseEvento".cantidad IS 'Sirve para ayudar al frontend que cantidad de tickets van a comprar';

COMMENT ON COLUMN public."cFaseEvento"."cantidadVendida" IS 'numero de boletos vendidos';

COMMENT ON COLUMN public."cFaseEvento".soldout IS 'marca si estan todos los boletos vendidos';

COMMENT ON COLUMN public."cFaseEvento".descripcion IS 'descripcion';

COMMENT ON COLUMN public."cFaseEvento".oculto IS 'bool para ocultar vista';

ALTER TABLE public."cFaseEvento"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."cFaseEvento"
  ADD CONSTRAINT "cFaseEvento_pkey" PRIMARY KEY ("idFase");

GRANT REFERENCES, SELECT, TRIGGER, TRUNCATE ON public."cFaseEvento" TO anon;

GRANT ALL ON public."cFaseEvento" TO authenticated;

GRANT ALL ON public."cFaseEvento" TO service_role;

CREATE POLICY "cFaseEvento authenticated delete" ON public."cFaseEvento"
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "cFaseEvento authenticated insert" ON public."cFaseEvento"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "cFaseEvento authenticated select" ON public."cFaseEvento"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cFaseEvento authenticated update" ON public."cFaseEvento"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "cFaseEvento public select" ON public."cFaseEvento"
  FOR SELECT
  TO anon
  USING (true);

CREATE TABLE public."cFormaPago" (
  idformapago   integer           GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  nombre        character varying NOT NULL,
  "descripción" character varying NOT NULL,
  activo        boolean           NOT NULL
);

ALTER TABLE public."cFormaPago"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."cFormaPago"
  ADD CONSTRAINT cformapago_pkey PRIMARY KEY (idformapago);

GRANT ALL ON public."cFormaPago" TO anon;

GRANT ALL ON public."cFormaPago" TO authenticated;

GRANT ALL ON public."cFormaPago" TO service_role;

CREATE POLICY "Policy with security definer functions" ON public."cFormaPago"
  USING (true);

CREATE TABLE public."codigosDescuento" (
  id               integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  codigo           text    NOT NULL,
  acreditado       boolean,
  fecha_acreditado date,
  session_id       text
);

ALTER TABLE public."codigosDescuento"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."codigosDescuento"
  ADD CONSTRAINT "codigosDescuento_pkey" PRIMARY KEY (id);

GRANT ALL ON public."codigosDescuento" TO anon;

GRANT ALL ON public."codigosDescuento" TO authenticated;

GRANT ALL ON public."codigosDescuento" TO service_role;

CREATE POLICY "Enable read access for all users" ON public."codigosDescuento"
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public."mCliente" (
  cliente_id     integer                     GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  nombre         character varying           NOT NULL,
  correo         character varying           NOT NULL,
  telefono       character varying,
  desuscrito     boolean                     DEFAULT false,
  fecha_registro timestamp without time zone DEFAULT now(),
  ultima_compra  timestamp without time zone,
  created_at     timestamp with time zone    DEFAULT now() NOT NULL,
  updated_at     timestamp without time zone DEFAULT now(),
  codigo         text,
  id_origen      integer,
  id_referidor   integer
);

COMMENT ON TABLE public."mCliente" IS 'Tabla maestra de clientes únicos';

COMMENT ON COLUMN public."mCliente".cliente_id IS 'ID único del cliente';

COMMENT ON COLUMN public."mCliente".correo IS 'Email único del cliente';

COMMENT ON COLUMN public."mCliente".desuscrito IS 'Indica si el cliente se desuscribió de correos promocionales';

COMMENT ON COLUMN public."mCliente".fecha_registro IS 'Fecha de primera compra/registro';

COMMENT ON COLUMN public."mCliente".ultima_compra IS 'Fecha de última compra';

COMMENT ON COLUMN public."mCliente".codigo IS 'Codigo de referidos';

COMMENT ON COLUMN public."mCliente".id_origen IS 'El origen de donde llego el cliente';

COMMENT ON COLUMN public."mCliente".id_referidor IS 'Id del cliente o promotor que lo refirio';

ALTER TABLE public."mCliente"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."mCliente"
  ADD CONSTRAINT "mCliente_cliente_id_key" UNIQUE (cliente_id);

ALTER TABLE public."mCliente"
  ADD CONSTRAINT "mCliente_correo_key" UNIQUE (correo);

ALTER TABLE public."mCliente"
  ADD CONSTRAINT "mCliente_pkey" PRIMARY KEY (cliente_id);

GRANT ALL ON public."mCliente" TO anon;

GRANT ALL ON public."mCliente" TO authenticated;

GRANT ALL ON public."mCliente" TO service_role;

CREATE INDEX idx_cliente_correo ON public."mCliente" (correo);

CREATE INDEX idx_cliente_desuscrito ON public."mCliente" (desuscrito);

CREATE INDEX idx_cliente_nombre ON public."mCliente" (nombre);

CREATE TRIGGER trigger_codigo_cliente_nuevo
  BEFORE INSERT ON public."mCliente"
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_asignar_codigo_cliente();

CREATE TRIGGER update_mcliente_updated_at
  BEFORE UPDATE ON public."mCliente"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Enable insert for authenticated users only" ON public."mCliente"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read " ON public."mCliente"
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Policy with security definer functions" ON public."mCliente"
  TO anon, authenticated
  USING (true);

CREATE TABLE public."mEvento" (
  idevento                 integer                  GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "nombreEvento"           character varying        NOT NULL,
  venue                    character varying        NOT NULL,
  "fechaInicio"            timestamp with time zone,
  direccion                character varying        NOT NULL,
  "fechaFin"               timestamp with time zone,
  usuario                  uuid,
  activo                   boolean,
  descripcion              text,
  "pathImage"              character varying,
  "direccionURL"           text,
  "descripcionCorta"       text,
  "visibleProd"            boolean                  DEFAULT false,
  id_venue                 integer,
  referidos                boolean                  DEFAULT false,
  max_cortesias_formulario integer                  DEFAULT 50
);

COMMENT ON COLUMN public."mEvento".activo IS 'Es el evento activo actualmente y el que se muestra en pantalla tickets';

COMMENT ON COLUMN public."mEvento".descripcion IS 'Descripcion larga del evento';

COMMENT ON COLUMN public."mEvento"."pathImage" IS 'ruta para la imagen de cabecera';

COMMENT ON COLUMN public."mEvento"."direccionURL" IS 'link para la direccion de maps';

COMMENT ON COLUMN public."mEvento"."descripcionCorta" IS 'Una descripcion breve antes de toda la informacion del evento';

COMMENT ON COLUMN public."mEvento".id_venue IS 'relacion con la tabla venue';

COMMENT ON COLUMN public."mEvento".referidos IS 'Para saber si vamos aceptar un precio especial por referidos';

ALTER TABLE public."mEvento"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."mEvento"
  ADD CONSTRAINT "mEvento_usuario_fkey" FOREIGN KEY (usuario) REFERENCES auth.users(id);

ALTER TABLE public."mEvento"
  ADD CONSTRAINT mevento_pkey PRIMARY KEY (idevento);

ALTER TABLE public."cFaseEvento"
  ADD CONSTRAINT "cFaceEvento_idEvento_fkey" FOREIGN KEY ("idEvento") REFERENCES public."mEvento"(idevento);

GRANT REFERENCES, SELECT, TRIGGER, TRUNCATE ON public."mEvento" TO anon;

GRANT ALL ON public."mEvento" TO authenticated;

GRANT ALL ON public."mEvento" TO service_role;

CREATE POLICY "mEvento authenticated delete" ON public."mEvento"
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "mEvento authenticated insert" ON public."mEvento"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "mEvento authenticated select" ON public."mEvento"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "mEvento authenticated update" ON public."mEvento"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "mEvento public select" ON public."mEvento"
  FOR SELECT
  TO anon
  USING (true);

CREATE TABLE public."mPago" (
  idpago                integer                     GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "idFormaPago"         integer                     NOT NULL,
  cantidad              money                       NOT NULL,
  acreditado            boolean                     NOT NULL,
  "fechaAcreditacion"   timestamp without time zone,
  "fechaPago"           timestamp with time zone,
  "idTransaccionStripe" text,
  checkout_session      text
);

COMMENT ON COLUMN public."mPago"."idTransaccionStripe" IS 'id del webhook recibida por stripe';

COMMENT ON COLUMN public."mPago".checkout_session IS 'id del checkout de stripe';

ALTER TABLE public."mPago"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."mPago"
  ADD CONSTRAINT mpago_idformapago_cformapago_idformapago FOREIGN KEY ("idFormaPago") REFERENCES public."cFormaPago"(idformapago);

ALTER TABLE public."mPago"
  ADD CONSTRAINT mpago_pkey PRIMARY KEY (idpago);

GRANT ALL ON public."mPago" TO anon;

GRANT ALL ON public."mPago" TO authenticated;

GRANT ALL ON public."mPago" TO service_role;

CREATE TRIGGER tr_payment_accredited
  AFTER UPDATE ON public."mPago"
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_payment_accredited();

CREATE POLICY "Policy with security definer functions" ON public."mPago"
  USING (true);

CREATE TABLE public."mRecordatorioEnvio" (
  id                     uuid                     DEFAULT gen_random_uuid() NOT NULL,
  recordatorio_evento_id uuid                     NOT NULL,
  cliente_id             integer                  NOT NULL,
  enviado                boolean                  DEFAULT false NOT NULL,
  fecha_envio            timestamp with time zone,
  error                  text,
  created_at             timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public."mRecordatorioEnvio" IS 'Bitácora de envíos de recordatorios a los clientes para evitar duplicados';

COMMENT ON COLUMN public."mRecordatorioEnvio".id IS 'ID único del registro de envío';

COMMENT ON COLUMN public."mRecordatorioEnvio".recordatorio_evento_id IS 'Referencia a la configuración del recordatorio del evento';

COMMENT ON COLUMN public."mRecordatorioEnvio".cliente_id IS 'Referencia al cliente en mCliente';

COMMENT ON COLUMN public."mRecordatorioEnvio".enviado IS 'Indica si el recordatorio fue enviado exitosamente';

COMMENT ON COLUMN public."mRecordatorioEnvio".fecha_envio IS 'Fecha y hora en que se realizó el envío';

COMMENT ON COLUMN public."mRecordatorioEnvio".error IS 'Detalle del error si el envío falló';

ALTER TABLE public."mRecordatorioEnvio"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."mRecordatorioEnvio"
  ADD CONSTRAINT "mRecordatorioEnvio_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public."mCliente"(cliente_id) ON DELETE CASCADE;

ALTER TABLE public."mRecordatorioEnvio"
  ADD CONSTRAINT "mRecordatorioEnvio_pkey" PRIMARY KEY (id);

ALTER TABLE public."mRecordatorioEnvio"
  ADD CONSTRAINT unique_recordatorio_cliente UNIQUE (recordatorio_evento_id, cliente_id);

GRANT ALL ON public."mRecordatorioEnvio" TO anon;

GRANT ALL ON public."mRecordatorioEnvio" TO authenticated;

GRANT ALL ON public."mRecordatorioEnvio" TO service_role;

CREATE INDEX idx_recordatorio_envio_event_client ON public."mRecordatorioEnvio" (recordatorio_evento_id, cliente_id);

CREATE POLICY "Policy with security definer functions" ON public."mRecordatorioEnvio"
  USING (true);

CREATE TABLE public."mRecordatorioEvento" (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  evento_id   integer                  NOT NULL,
  template_id uuid                     NOT NULL,
  activo      boolean                  DEFAULT true NOT NULL,
  created_at  timestamp with time zone DEFAULT now(),
  updated_at  timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public."mRecordatorioEvento" IS 'Configuración de asociación entre eventos y plantillas de recordatorio';

COMMENT ON COLUMN public."mRecordatorioEvento".id IS 'ID único de la configuración';

COMMENT ON COLUMN public."mRecordatorioEvento".evento_id IS 'Referencia al evento de la tabla mEvento';

COMMENT ON COLUMN public."mRecordatorioEvento".template_id IS 'Referencia a la plantilla en mRecordatorioTemplate';

COMMENT ON COLUMN public."mRecordatorioEvento".activo IS 'Indica si el recordatorio automático está activo para este evento';

ALTER TABLE public."mRecordatorioEvento"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."mRecordatorioEvento"
  ADD CONSTRAINT "mRecordatorioEvento_evento_id_fkey" FOREIGN KEY (evento_id) REFERENCES public."mEvento"(idevento) ON DELETE CASCADE;

ALTER TABLE public."mRecordatorioEvento"
  ADD CONSTRAINT "mRecordatorioEvento_pkey" PRIMARY KEY (id);

ALTER TABLE public."mRecordatorioEnvio"
  ADD CONSTRAINT "mRecordatorioEnvio_recordatorio_evento_id_fkey" FOREIGN KEY (recordatorio_evento_id) REFERENCES public."mRecordatorioEvento"(id) ON DELETE CASCADE;

GRANT ALL ON public."mRecordatorioEvento" TO anon;

GRANT ALL ON public."mRecordatorioEvento" TO authenticated;

GRANT ALL ON public."mRecordatorioEvento" TO service_role;

CREATE TRIGGER update_mrecordatorioevento_updated_at
  BEFORE UPDATE ON public."mRecordatorioEvento"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Policy with security definer functions" ON public."mRecordatorioEvento"
  USING (true);

CREATE TABLE public."mRecordatorioTemplate" (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  nombre      character varying(255)   NOT NULL,
  asunto      character varying(255)   NOT NULL,
  cuerpo_html text                     NOT NULL,
  created_at  timestamp with time zone DEFAULT now(),
  updated_at  timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public."mRecordatorioTemplate" IS 'Plantillas de correo para recordatorios automáticos de eventos';

COMMENT ON COLUMN public."mRecordatorioTemplate".id IS 'ID único de la plantilla';

COMMENT ON COLUMN public."mRecordatorioTemplate".nombre IS 'Nombre identificador interno de la plantilla';

COMMENT ON COLUMN public."mRecordatorioTemplate".asunto IS 'Asunto del correo electrónico';

COMMENT ON COLUMN public."mRecordatorioTemplate".cuerpo_html IS 'Cuerpo del mensaje en formato HTML con soporte para variables';

ALTER TABLE public."mRecordatorioTemplate"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."mRecordatorioTemplate"
  ADD CONSTRAINT "mRecordatorioTemplate_pkey" PRIMARY KEY (id);

ALTER TABLE public."mRecordatorioEvento"
  ADD CONSTRAINT "mRecordatorioEvento_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public."mRecordatorioTemplate"(id) ON DELETE RESTRICT;

GRANT ALL ON public."mRecordatorioTemplate" TO anon;

GRANT ALL ON public."mRecordatorioTemplate" TO authenticated;

GRANT ALL ON public."mRecordatorioTemplate" TO service_role;

CREATE TRIGGER update_mrecordatoriotemplate_updated_at
  BEFORE UPDATE ON public."mRecordatorioTemplate"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Policy with security definer functions" ON public."mRecordatorioTemplate"
  USING (true);

CREATE TABLE public."mVenta" (
  idventa           integer                     GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "idEvento"        integer,
  nombre            character varying,
  correo            character varying,
  "fechaVenta"      timestamp without time zone,
  "cantidadTickets" integer,
  "idPago"          integer,
  "idFaseEvento"    bigint,
  "idUsuario"       uuid                        DEFAULT gen_random_uuid(),
  cliente_id        integer
);

COMMENT ON COLUMN public."mVenta"."idPago" IS 'relacion con los datos del pago';

COMMENT ON COLUMN public."mVenta"."idFaseEvento" IS 'identificador de la fase de los tickets comprados';

ALTER TABLE public."mVenta"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."mVenta"
  ADD CONSTRAINT fk_venta_cliente FOREIGN KEY (cliente_id) REFERENCES public."mCliente"(cliente_id) ON DELETE RESTRICT;

ALTER TABLE public."mVenta"
  ADD CONSTRAINT "mVenta_idFaseEvento_fkey" FOREIGN KEY ("idFaseEvento") REFERENCES public."cFaseEvento"("idFase");

ALTER TABLE public."mVenta"
  ADD CONSTRAINT "mVenta_idPago_fkey" FOREIGN KEY ("idPago") REFERENCES public."mPago"(idpago);

ALTER TABLE public."mVenta"
  ADD CONSTRAINT "mVenta_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES auth.users(id);

ALTER TABLE public."mVenta"
  ADD CONSTRAINT mventa_idevento_mevento_idevento FOREIGN KEY ("idEvento") REFERENCES public."mEvento"(idevento);

ALTER TABLE public."mVenta"
  ADD CONSTRAINT mventa_pkey PRIMARY KEY (idventa);

GRANT ALL ON public."mVenta" TO anon;

GRANT ALL ON public."mVenta" TO authenticated;

GRANT ALL ON public."mVenta" TO service_role;

CREATE INDEX idx_venta_cliente ON public."mVenta" (cliente_id);

CREATE POLICY "Policy with security definer functions" ON public."mVenta"
  USING (true);

CREATE TABLE public."tFormularioInvitacion" (
  id                 integer                  DEFAULT nextval('public."tFormularioInvitacion_id_seq"'::regclass) NOT NULL,
  cliente_id         integer                  NOT NULL,
  "idEvento"         integer                  NOT NULL,
  como_se_entero     text                     NOT NULL,
  formato_musical    text                     NOT NULL,
  acepta_promociones boolean                  DEFAULT false,
  comentarios        text,
  fecha_registro     timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER SEQUENCE public."tFormularioInvitacion_id_seq" OWNED BY public."tFormularioInvitacion".id;

GRANT ALL ON SEQUENCE public."tFormularioInvitacion_id_seq" TO anon;

GRANT ALL ON SEQUENCE public."tFormularioInvitacion_id_seq" TO authenticated;

GRANT ALL ON SEQUENCE public."tFormularioInvitacion_id_seq" TO service_role;

ALTER TABLE public."tFormularioInvitacion"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."tFormularioInvitacion"
  ADD CONSTRAINT fk_cliente FOREIGN KEY (cliente_id) REFERENCES public."mCliente"(cliente_id) ON DELETE CASCADE;

ALTER TABLE public."tFormularioInvitacion"
  ADD CONSTRAINT fk_evento FOREIGN KEY ("idEvento") REFERENCES public."mEvento"(idevento) ON DELETE CASCADE;

ALTER TABLE public."tFormularioInvitacion"
  ADD CONSTRAINT "tFormularioInvitacion_pkey" PRIMARY KEY (id);

ALTER TABLE public."tFormularioInvitacion"
  ADD CONSTRAINT uq_cliente_evento UNIQUE (cliente_id, "idEvento");

GRANT ALL ON public."tFormularioInvitacion" TO anon;

GRANT ALL ON public."tFormularioInvitacion" TO authenticated;

GRANT ALL ON public."tFormularioInvitacion" TO service_role;

CREATE POLICY "Anon Insert Formulario Invitacion" ON public."tFormularioInvitacion"
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Policy with security definer functions" ON public."tFormularioInvitacion"
  TO anon, authenticated
  USING (true);

CREATE TABLE public."tGaleria" (
  id              bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  evento_id       bigint                   NOT NULL,
  tipo            text                     DEFAULT 'imagen'::text NOT NULL,
  storage_path    text                     NOT NULL,
  url_publica     text,
  descripcion     text,
  fecha_contenido date                     NOT NULL,
  orden           integer                  DEFAULT 0 NOT NULL,
  activo          boolean                  DEFAULT true NOT NULL,
  creado_en       timestamp with time zone DEFAULT now() NOT NULL,
  actualizado_en  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."tGaleria"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."tGaleria"
  ADD CONSTRAINT galeria_evento_fk FOREIGN KEY (evento_id) REFERENCES public."mEvento"(idevento) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE public."tGaleria"
  ADD CONSTRAINT "tGaleria_pkey" PRIMARY KEY (id);

ALTER TABLE public."tGaleria"
  ADD CONSTRAINT "tGaleria_tipo_check" CHECK (tipo = ANY (ARRAY['imagen'::text, 'video'::text]));

GRANT REFERENCES, SELECT, TRIGGER, TRUNCATE ON public."tGaleria" TO anon;

GRANT ALL ON public."tGaleria" TO authenticated;

GRANT ALL ON public."tGaleria" TO service_role;

CREATE INDEX galeria_publicacion_idx ON public."tGaleria" (activo, fecha_contenido DESC, orden);

CREATE INDEX galeria_evento_idx ON public."tGaleria" (evento_id);

CREATE INDEX galeria_fecha_idx ON public."tGaleria" (fecha_contenido DESC);

CREATE INDEX galeria_evento_fecha_idx ON public."tGaleria" (evento_id, fecha_contenido DESC);

CREATE POLICY "Galeria activa es publica" ON public."tGaleria"
  FOR SELECT
  TO anon
  USING ((activo = true));

CREATE POLICY "Usuarios autenticados administran galeria" ON public."tGaleria"
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public."tListaEspera" (
  id        bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  correo    text                     NOT NULL,
  creado_en timestamp with time zone DEFAULT now()
);

ALTER TABLE public."tListaEspera"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."tListaEspera"
  ADD CONSTRAINT "tListaEspera_correo_key" UNIQUE (correo);

ALTER TABLE public."tListaEspera"
  ADD CONSTRAINT "tListaEspera_pkey" PRIMARY KEY (id);

GRANT ALL ON public."tListaEspera" TO anon;

GRANT ALL ON public."tListaEspera" TO authenticated;

GRANT ALL ON public."tListaEspera" TO service_role;

CREATE POLICY "Anon Insert Lista Espera" ON public."tListaEspera"
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Policy with security definer functions" ON public."tListaEspera"
  USING (true);

CREATE TABLE public."tSoundsTakeOver" (
  id             bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  titulo         text                     NOT NULL,
  artista        text,
  soundcloud_url text                     NOT NULL,
  artwork_url    text,
  orden          integer                  DEFAULT 0 NOT NULL,
  activo         boolean                  DEFAULT true NOT NULL,
  creado_en      timestamp with time zone DEFAULT now() NOT NULL,
  actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."tSoundsTakeOver"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."tSoundsTakeOver"
  ADD CONSTRAINT sounds_take_over_soundcloud_url_check CHECK (soundcloud_url ~* '^https://(www\.)?(soundcloud\.com|on\.soundcloud\.com)/'::text);

ALTER TABLE public."tSoundsTakeOver"
  ADD CONSTRAINT "tSoundsTakeOver_orden_check" CHECK (orden >= 0);

ALTER TABLE public."tSoundsTakeOver"
  ADD CONSTRAINT "tSoundsTakeOver_pkey" PRIMARY KEY (id);

GRANT REFERENCES, SELECT, TRIGGER, TRUNCATE ON public."tSoundsTakeOver" TO anon;

GRANT ALL ON public."tSoundsTakeOver" TO authenticated;

GRANT ALL ON public."tSoundsTakeOver" TO service_role;

CREATE INDEX sounds_take_over_publicacion_idx ON public."tSoundsTakeOver" (activo, orden, creado_en);

CREATE TRIGGER set_sounds_take_over_updated_at
  BEFORE UPDATE ON public."tSoundsTakeOver"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sounds_take_over_updated_at();

CREATE POLICY "Authenticated users can delete sounds" ON public."tSoundsTakeOver"
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sounds" ON public."tSoundsTakeOver"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read sounds" ON public."tSoundsTakeOver"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update sounds" ON public."tSoundsTakeOver"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read active sounds" ON public."tSoundsTakeOver"
  FOR SELECT
  TO anon
  USING ((activo = true));

CREATE TABLE public."tTeaserConfig" (
  id            bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  fecha_teaser  timestamp with time zone NOT NULL,
  titulo_teaser text                     NOT NULL,
  activo        boolean                  DEFAULT true
);

ALTER TABLE public."tTeaserConfig"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."tTeaserConfig"
  ADD CONSTRAINT "tTeaserConfig_pkey" PRIMARY KEY (id);

GRANT ALL ON public."tTeaserConfig" TO anon;

GRANT ALL ON public."tTeaserConfig" TO authenticated;

GRANT ALL ON public."tTeaserConfig" TO service_role;

CREATE POLICY "Policy with security definer functions" ON public."tTeaserConfig"
  USING (true);

CREATE TABLE public.generos_musicales (
  id_genero     integer                  GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  created_at    timestamp with time zone DEFAULT now() NOT NULL,
  nombre_genero text,
  activo        boolean                  DEFAULT true NOT NULL
);

COMMENT ON TABLE public.generos_musicales IS 'Catalogo de generos musicales para eventos';

ALTER TABLE public.generos_musicales
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.generos_musicales
  ADD CONSTRAINT generos_musicales_id_genero_key UNIQUE (id_genero);

ALTER TABLE public.generos_musicales
  ADD CONSTRAINT generos_musicales_pkey PRIMARY KEY (id_genero);

GRANT ALL ON public.generos_musicales TO anon;

GRANT ALL ON public.generos_musicales TO authenticated;

GRANT ALL ON public.generos_musicales TO service_role;

CREATE POLICY "Policy with security definer functions" ON public.generos_musicales
  TO anon, authenticated
  USING (true);

CREATE TABLE public.mcampania (
  id                   uuid                     DEFAULT extensions.uuid_generate_v4() NOT NULL,
  titulo               character varying(100)   NOT NULL,
  asunto               character varying(200)   NOT NULL,
  cuerpo_html          text                     NOT NULL,
  usar_variable_nombre boolean                  DEFAULT true,
  todos_los_clientes   boolean                  DEFAULT false,
  estado               character varying(20)    DEFAULT 'borrador'::character varying,
  fecha_creacion       timestamp with time zone DEFAULT now(),
  fecha_envio          timestamp with time zone,
  total_enviados       integer                  DEFAULT 0,
  total_errores        integer                  DEFAULT 0,
  created_at           timestamp with time zone DEFAULT now(),
  updated_at           timestamp with time zone DEFAULT now()
);

ALTER TABLE public.mcampania
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mcampania
  ADD CONSTRAINT mcampania_pkey PRIMARY KEY (id);

GRANT ALL ON public.mcampania TO anon;

GRANT ALL ON public.mcampania TO authenticated;

GRANT ALL ON public.mcampania TO service_role;

CREATE POLICY "Policy with security definer functions" ON public.mcampania
  TO authenticated
  USING (true);

CREATE TABLE public.mcampaniadestinatario (
  id          uuid                     DEFAULT extensions.uuid_generate_v4() NOT NULL,
  campania_id uuid                     NOT NULL,
  enviado     boolean                  DEFAULT false,
  fecha_envio timestamp with time zone,
  error       text,
  created_at  timestamp with time zone DEFAULT now(),
  cliente_id  integer
);

ALTER TABLE public.mcampaniadestinatario
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mcampaniadestinatario
  ADD CONSTRAINT mcampaniadestinatario_campania_id_fkey FOREIGN KEY (campania_id) REFERENCES public.mcampania(id);

ALTER TABLE public.mcampaniadestinatario
  ADD CONSTRAINT mcampaniadestinatario_pkey PRIMARY KEY (id);

GRANT ALL ON public.mcampaniadestinatario TO anon;

GRANT ALL ON public.mcampaniadestinatario TO authenticated;

GRANT ALL ON public.mcampaniadestinatario TO service_role;

CREATE POLICY "Policy with security definer functions" ON public.mcampaniadestinatario
  TO anon, authenticated
  USING (true);

CREATE TABLE public.mcampaniaevento (
  id          uuid                     DEFAULT extensions.uuid_generate_v4() NOT NULL,
  campania_id uuid                     NOT NULL,
  evento_id   uuid                     NOT NULL,
  created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.mcampaniaevento
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mcampaniaevento
  ADD CONSTRAINT mcampaniaevento_campania_id_evento_id_key UNIQUE (campania_id, evento_id);

ALTER TABLE public.mcampaniaevento
  ADD CONSTRAINT mcampaniaevento_campania_id_fkey FOREIGN KEY (campania_id) REFERENCES public.mcampania(id) ON DELETE CASCADE;

ALTER TABLE public.mcampaniaevento
  ADD CONSTRAINT mcampaniaevento_pkey PRIMARY KEY (id);

GRANT ALL ON public.mcampaniaevento TO anon;

GRANT ALL ON public.mcampaniaevento TO authenticated;

GRANT ALL ON public.mcampaniaevento TO service_role;

CREATE POLICY "Policy with security definer functions" ON public.mcampaniaevento
  TO authenticated
  USING (true);

CREATE TABLE public.morigen (
  id_origen     integer                  GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  nombre_origen text,
  created_at    timestamp with time zone DEFAULT now() NOT NULL,
  activo        boolean
);

COMMENT ON TABLE public.morigen IS 'Origen de donde llego un cliente';

ALTER TABLE public.morigen
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.morigen
  ADD CONSTRAINT morigen_id_origen_key UNIQUE (id_origen);

ALTER TABLE public.morigen
  ADD CONSTRAINT morigen_pkey PRIMARY KEY (id_origen);

GRANT ALL ON public.morigen TO anon;

GRANT ALL ON public.morigen TO authenticated;

GRANT ALL ON public.morigen TO service_role;

CREATE POLICY "Policy with security definer functions" ON public.morigen
  TO anon, authenticated
  USING (true);

CREATE TABLE public.mpromotor (
  id_promotor     integer                  GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  nombre_promotor text,
  codigo_promotor text,
  ativo           boolean,
  created_at      timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.mpromotor IS 'Promotores de take over';

ALTER TABLE public.mpromotor
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mpromotor
  ADD CONSTRAINT mpromotor_id_promotor_key UNIQUE (id_promotor);

ALTER TABLE public.mpromotor
  ADD CONSTRAINT mpromotor_pkey PRIMARY KEY (id_promotor);

GRANT ALL ON public.mpromotor TO anon;

GRANT ALL ON public.mpromotor TO authenticated;

GRANT ALL ON public.mpromotor TO service_role;

CREATE TABLE public.r_evento_genero (
  id_genero_evento integer                  GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  created_at       timestamp with time zone DEFAULT now() NOT NULL,
  id_genero        integer                  NOT NULL,
  id_evento        integer                  NOT NULL
);

COMMENT ON TABLE public.r_evento_genero IS 'relacion entre generos y eventos';

ALTER TABLE public.r_evento_genero
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.r_evento_genero
  ADD CONSTRAINT r_evento_genero_id_evento_fkey FOREIGN KEY (id_evento) REFERENCES public."mEvento"(idevento);

ALTER TABLE public.r_evento_genero
  ADD CONSTRAINT r_evento_genero_id_genero_evento_key UNIQUE (id_genero_evento);

ALTER TABLE public.r_evento_genero
  ADD CONSTRAINT r_evento_genero_id_genero_fkey FOREIGN KEY (id_genero) REFERENCES public.generos_musicales(id_genero);

ALTER TABLE public.r_evento_genero
  ADD CONSTRAINT r_evento_genero_pkey PRIMARY KEY (id_genero_evento);

GRANT ALL ON public.r_evento_genero TO anon;

GRANT ALL ON public.r_evento_genero TO authenticated;

GRANT ALL ON public.r_evento_genero TO service_role;

CREATE POLICY "Policy with security definer functions" ON public.r_evento_genero
  TO anon, authenticated
  USING (true);

CREATE TABLE public.team_member (
  team_id      bigint                   DEFAULT nextval('public.team_member_id_seq'::regclass) NOT NULL,
  name         character varying(100)   NOT NULL,
  role         character varying(150)   NOT NULL,
  image        text,
  description  text,
  socials      jsonb,
  color        character varying(100),
  accent_color character varying(100),
  created_at   timestamp with time zone DEFAULT now() NOT NULL,
  updated_at   timestamp with time zone DEFAULT now() NOT NULL
);

ALTER SEQUENCE public.team_member_id_seq OWNED BY public.team_member.team_id;

GRANT ALL ON SEQUENCE public.team_member_id_seq TO anon;

GRANT ALL ON SEQUENCE public.team_member_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.team_member_id_seq TO service_role;

ALTER TABLE public.team_member
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.team_member
  ADD CONSTRAINT team_member_pkey PRIMARY KEY (team_id);

GRANT REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.team_member TO anon;

GRANT ALL ON public.team_member TO authenticated;

GRANT ALL ON public.team_member TO service_role;

CREATE TRIGGER trg_team_member_updated
  BEFORE UPDATE ON public.team_member
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Enable read access for all users" ON public.team_member
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "team_member authenticated delete" ON public.team_member
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "team_member authenticated insert" ON public.team_member
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "team_member authenticated update" ON public.team_member
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "team_member public select" ON public.team_member
  FOR SELECT
  TO anon
  USING (true);

CREATE TABLE public.ticket (
  "idTicket"        integer                     GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "codigoQR"        character varying           NOT NULL,
  validado          boolean                     NOT NULL,
  "fechaValidacion" timestamp without time zone,
  "idVenta"         integer                     NOT NULL,
  "idFase"          bigint,
  referencia        numeric,
  "pathStorage"     character varying
);

COMMENT ON COLUMN public.ticket.referencia IS 'referencia unica del ticket';

ALTER TABLE public.ticket
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ticket
  ADD CONSTRAINT "ticket_idFase_fkey" FOREIGN KEY ("idFase") REFERENCES public."cFaseEvento"("idFase");

ALTER TABLE public.ticket
  ADD CONSTRAINT ticket_idventa_mventa_idventa FOREIGN KEY ("idVenta") REFERENCES public."mVenta"(idventa);

ALTER TABLE public.ticket
  ADD CONSTRAINT ticket_pkey PRIMARY KEY ("idTicket");

ALTER TABLE public.ticket
  ADD CONSTRAINT ticket_referencia_key UNIQUE (referencia);

GRANT ALL ON public.ticket TO anon;

GRANT ALL ON public.ticket TO authenticated;

GRANT ALL ON public.ticket TO service_role;

CREATE POLICY "Enable insert for authenticated users only" ON public.ticket
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.ticket
  FOR SELECT
  USING (true);

CREATE POLICY "Policy with security definer functions" ON public.ticket
  USING (true);

CREATE TABLE public.venue (
  id_venue          bigint                   GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  nombre_venue      text,
  descripcion_venue text,
  direccion_venue   text,
  estado            text,
  ciudad            text,
  pais              text,
  codigo_postal     text,
  url_direccion     text,
  activo            boolean                  DEFAULT true NOT NULL,
  created_at        timestamp with time zone DEFAULT now() NOT NULL,
  updated_at        timestamp with time zone,
  capacidad_venue   numeric
);

COMMENT ON TABLE public.venue IS 'Catalogo para venues';

ALTER TABLE public.venue
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.venue
  ADD CONSTRAINT venue_pkey PRIMARY KEY (id_venue);

ALTER TABLE public."mEvento"
  ADD CONSTRAINT "mEvento_id_venue_fkey" FOREIGN KEY (id_venue) REFERENCES public.venue(id_venue);

GRANT ALL ON public.venue TO anon;

GRANT ALL ON public.venue TO authenticated;

GRANT ALL ON public.venue TO service_role;

CREATE POLICY "Policy with security definer functions" ON public.venue
  TO anon, authenticated
  USING (true);

CREATE SCHEMA stripe AUTHORIZATION postgres;

CREATE FOREIGN TABLE stripe."balanceStripe" (
  balance_type text,
  amount       bigint,
  currency     text,
  attrs        jsonb
) SERVER stripe_server OPTIONS (object '__OPTION_OBJECT__', schema 'stripe', id '__OPTION_ID__');

CREATE FOREIGN TABLE stripe."balanceTransacStripe" (
  id          text,
  amount      bigint,
  currency    text,
  description text,
  fee         bigint,
  net         bigint,
  status      text,
  type        text,
  created     timestamp without time zone,
  attrs       jsonb
) SERVER stripe_server OPTIONS (object '__OPTION_OBJECT__', schema 'stripe', id '__OPTION_ID__');

CREATE FOREIGN TABLE stripe."chargesStripe" (
  id             text,
  amount         bigint,
  currency       text,
  customer       text,
  description    text,
  invoice        text,
  payment_intent text,
  status         text,
  created        timestamp without time zone,
  attrs          jsonb
) SERVER stripe_server OPTIONS (object '__OPTION_OBJECT__', schema 'stripe', id '__OPTION_ID__');
