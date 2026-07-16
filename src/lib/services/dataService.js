import supabase from "$lib/supabase";
import { slugify } from "$lib/utils/slugify";

export async function getEventoActivo() {
  const { data, error } = await supabase
    .from("mEvento")
    .select("*")
    .eq("activo", 1)
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") { // Ignorar error de "0 rows" si no hay evento activo
    console.error("Error fetching active event:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function getEventoById(idEvento) {
  const { data, error } = await supabase
    .from("mEvento")
    .select("*")
    .eq("idevento", idEvento);

  if (error) {
    console.error("Error fetching event by ID:", error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function getEventoByIdOrSlug(idOrSlug) {
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug) || /^\d+$/.test(idOrSlug);

  if (isId) {
    return getEventoById(idOrSlug);
  }

  const { data: events, error } = await supabase
    .from("mEvento")
    .select("*");

  if (error) {
    console.error("Error fetching events for slug match:", error);
    return { data: null, error };
  }

  const matched = events.filter(e => slugify(e.nombreEvento) === idOrSlug);
  return { data: matched, error: null };
}

export async function getFasesByEvento(idEvento) {
  const { data, error } = await supabase
    .from("cFaseEvento")
    .select("*")
    .eq("idEvento", idEvento);

  if (error) {
    console.error("Error fetching event phases:", error);
    return { data: [], error };
  }
  return { data, error: null };
}

export function getImagenPublicUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage
    .from("imageEventos")
    .getPublicUrl(path);

  return data ? data.publicUrl : null;
}

export async function validarCodigoDescuentoSupabase(codigo) {
    const { data, error } = await supabase
        .from("codigosDescuento")
        .select("*")
        .eq("codigo", codigo)
        .eq("acreditado", false)
        .single();

    return { data, error };
}
