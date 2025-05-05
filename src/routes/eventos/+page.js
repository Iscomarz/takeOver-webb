import { getEventosPasados, getEventosActivos } from "../api/eventoSupabase/consultaEvento.js";

export async function load() {
  const eventosPasados = await getEventosPasados();
  const eventosActivos = await getEventosActivos();

  return {
    eventosPasados,
    eventosActivos
  };
}