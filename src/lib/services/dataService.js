import supabase from "$lib/supabase";

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
