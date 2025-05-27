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
  let eventos = []; // Inicializar el array de eventos
  const { data, error } = await supabase
    .from("mEvento")
    .select("*")
    .eq("activo", 1);

  if (error) {
    console.error("Error fetching active events:", error);
    return [];
  }else{
    if (data.length === 0) {
      console.log("No hay eventos activos en la base de datos.");
      return []; // Retornar un array vacío si no hay eventos activos
    }
    eventos = data; // Asignar los eventos obtenidos a la variable eventos
    for (let i = 0; i < eventos.length; i++) {
      eventos[i].loadingImage = true; // Estado de carga inicial

      let { data: image, error: errorImage } = await supabase.storage
        .from("imageEventos")
        .createSignedUrl(eventos[i].pathImage, 60 * 60);

      if (errorImage) {
        console.log("Error al traer imagen de evento", errorImage);
      } else {
        eventos[i].pathImage = image.signedUrl;
      }
    }
  }

  return data;
}

export async function getEventosPasados() {
    const fechaActual = new Date().toISOString();
    let eventos = []; // Inicializar el array de eventos
  
    const { data, error } = await supabase
      .from("mEvento")
      .select("*")
      .eq("visibleProd", 1) // eventos activos
      .lt("fechaFin", fechaActual)
      .order("fechaInicio", {ascending: false}); // eventos cuya fechaFin es anterior a ahora
  
    if (error) {
      console.error("Error fetching past events:", error);
      return null;
    }else{
        eventos = data; // Asignar los eventos obtenidos a la variable eventos
        for (let i = 0; i < eventos.length; i++) {
            eventos[i].loadingImage = true; // Estado de carga inicial

            let { data: image, error: errorImage } = await supabase.storage
                .from('imageEventos')
                .createSignedUrl(eventos[i].pathImage, 60 * 60);

            if (errorImage) {
                console.log('Error al traer imagen de evento', errorImage);
            } else {
                eventos[i].pathImage = image.signedUrl;
            }
        }
    }
    return data;
  }