import { getEventosPasados, getEventosActivos } from "../api/eventoSupabase/consultaEvento.js";

let cachedEvents = null;

export async function load() {
  if (cachedEvents) {
    return cachedEvents;
  }

  const eventosPasados = await getEventosPasados();
  const eventosActivos = await getEventosActivos();

  cachedEvents = {
    eventosPasados,
    eventosActivos
  };

  return cachedEvents;
}