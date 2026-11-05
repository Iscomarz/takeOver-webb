import supabase from "$lib/supabase";

export async function getEvento(idEvento) {
  const { data, error } = await supabase
    .from("mEventos")
    .select("*")
    .eq("idevento", idEvento)
    .single();

  if (error) {
    console.error("Error fetching event:", error);
    return null;
  }

  return data;
}

export async function getEventosActivos() {
  const { data, error } = await supabase
    .from("mEvento")
    .select("*")
    .eq("activo", 1);

  if (error) {
    console.error("Error fetching active events:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  for (let i = 0; i < data.length; i++) {
    if (data[i].pathImage) {
      const { data: imgData } = supabase.storage
        .from("imageEventos")
        .getPublicUrl(data[i].pathImage);
      data[i].pathImage = imgData?.publicUrl || data[i].pathImage;
    }
  }

  return data;
}

export async function getEventosPasados() {
  const fechaActual = new Date().toISOString();

  const { data, error } = await supabase
    .from("mEvento")
    .select("*")
    .eq("visibleProd", 1)
    .lt("fechaFin", fechaActual)
    .order("fechaInicio", { ascending: false });

  if (error) {
    console.error("Error fetching past events:", error);
    return null;
  }

  if (!data) return [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].pathImage) {
      const { data: imgData } = supabase.storage
        .from("imageEventos")
        .getPublicUrl(data[i].pathImage);
      data[i].pathImage = imgData?.publicUrl || data[i].pathImage;
    }
  }

  return data;
}
