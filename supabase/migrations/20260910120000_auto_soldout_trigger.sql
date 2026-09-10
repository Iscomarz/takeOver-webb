-- Migracion: Sincronizacion automatica de cantidadVendida y estado soldout en cFaseEvento
-- 1. Funcion para recalcular ventas y soldout ante cambios en mVenta
CREATE OR REPLACE FUNCTION public.actualizar_fase_soldout_y_vendidos()
RETURNS TRIGGER AS $$
DECLARE
  fase_id BIGINT;
  fases_a_actualizar BIGINT[];
  total_vendidos NUMERIC;
  limite_fase NUMERIC;
BEGIN
  -- Identificar fases afectadas segun la operacion
  IF TG_OP = 'INSERT' THEN
    fases_a_actualizar := ARRAY[NEW."idFaseEvento"];
  ELSIF TG_OP = 'DELETE' THEN
    fases_a_actualizar := ARRAY[OLD."idFaseEvento"];
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD."idFaseEvento" IS DISTINCT FROM NEW."idFaseEvento" THEN
      fases_a_actualizar := ARRAY[OLD."idFaseEvento", NEW."idFaseEvento"];
    ELSE
      fases_a_actualizar := ARRAY[NEW."idFaseEvento"];
    END IF;
  END IF;

  -- Recalcular metricas para cada fase involucrada
  FOREACH fase_id IN ARRAY fases_a_actualizar
  LOOP
    IF fase_id IS NOT NULL THEN
      -- Obtener total real vendido
      SELECT COALESCE(SUM("cantidadTickets"), 0)
      INTO total_vendidos
      FROM public."mVenta"
      WHERE "idFaseEvento" = fase_id;

      -- Obtener limite configurado
      SELECT "limite"
      INTO limite_fase
      FROM public."cFaseEvento"
      WHERE "idFase" = fase_id;

      -- Actualizar cFaseEvento
      UPDATE public."cFaseEvento"
      SET
        "cantidadVendida" = total_vendidos,
        "soldout" = CASE
          WHEN limite_fase IS NOT NULL AND limite_fase > 0 AND total_vendidos >= limite_fase THEN TRUE
          WHEN limite_fase IS NOT NULL AND limite_fase > 0 AND total_vendidos < limite_fase THEN FALSE
          ELSE soldout
        END
      WHERE "idFase" = fase_id;
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger sobre mVenta (ejecuta tras INSERT, UPDATE o DELETE)
DROP TRIGGER IF EXISTS trg_actualizar_fase_soldout ON public."mVenta";
CREATE TRIGGER trg_actualizar_fase_soldout
AFTER INSERT OR UPDATE OR DELETE ON public."mVenta"
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_fase_soldout_y_vendidos();

-- 3. Trigger sobre cFaseEvento cuando se modifica el limite
CREATE OR REPLACE FUNCTION public.actualizar_fase_soldout_al_cambiar_limite()
RETURNS TRIGGER AS $$
DECLARE
  total_vendidos NUMERIC;
BEGIN
  -- Calcular el total actual vendido
  SELECT COALESCE(SUM("cantidadTickets"), 0)
  INTO total_vendidos
  FROM public."mVenta"
  WHERE "idFaseEvento" = NEW."idFase";

  NEW."cantidadVendida" := total_vendidos;

  IF NEW."limite" IS NOT NULL AND NEW."limite" > 0 THEN
    IF total_vendidos >= NEW."limite" THEN
      NEW."soldout" := TRUE;
    ELSE
      NEW."soldout" := FALSE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_actualizar_fase_al_cambiar_limite ON public."cFaseEvento";
CREATE TRIGGER trg_actualizar_fase_al_cambiar_limite
BEFORE UPDATE OF "limite" ON public."cFaseEvento"
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_fase_soldout_al_cambiar_limite();

-- 4. Sincronizacion inicial (Backfill) para todas las fases existentes en base de datos
UPDATE public."cFaseEvento" cf
SET
  "cantidadVendida" = COALESCE((
    SELECT SUM(v."cantidadTickets")
    FROM public."mVenta" v
    WHERE v."idFaseEvento" = cf."idFase"
  ), 0),
  "soldout" = CASE
    WHEN cf.limite IS NOT NULL AND cf.limite > 0 AND COALESCE((
      SELECT SUM(v."cantidadTickets")
      FROM public."mVenta" v
      WHERE v."idFaseEvento" = cf."idFase"
    ), 0) >= cf.limite THEN TRUE
    ELSE cf.soldout
  END;
