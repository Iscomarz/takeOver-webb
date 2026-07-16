import { getEventosActivos } from "../api/eventoSupabase/consultaEvento.js";
import { redirect } from "@sveltejs/kit";
import supabase from "$lib/supabase";

export async function load() {
  const eventosActivos = await getEventosActivos();

  // If there are active events, redirect to /eventos
  if (eventosActivos && eventosActivos.length > 0) {
    throw redirect(307, "/eventos");
  }

  // Fetch teaser config
  let teaserConfig = null;
  const { data, error } = await supabase
    .from("tTeaserConfig")
    .select("*")
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching teaser config:", error);
  } else {
    teaserConfig = data;
  }

  return {
    teaserConfig
  };
}
