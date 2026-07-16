import { getEventosPasados, getEventosActivos } from "../api/eventoSupabase/consultaEvento.js";
import { redirect } from "@sveltejs/kit";
import supabase from "$lib/supabase";

export async function load({ url }) {
  const eventosActivos = await getEventosActivos();
  const showPast = url.searchParams.get("past") === "true";

  // If there are no active events, check if teaser mode is enabled before redirecting
  if ((!eventosActivos || eventosActivos.length === 0) && !showPast) {
    const { data: teaserConfig } = await supabase
      .from("tTeaserConfig")
      .select("activo")
      .limit(1)
      .maybeSingle();

    if (teaserConfig?.activo) {
      throw redirect(307, "/teaser");
    }
  }

  const eventosPasados = await getEventosPasados();

  return {
    eventosPasados,
    eventosActivos
  };
}