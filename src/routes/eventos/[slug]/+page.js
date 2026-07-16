import { eventoId } from "../../../lib/stores/eventoId";
import { getEventoByIdOrSlug, getFasesByEvento, getImagenPublicUrl } from "$lib/services/dataService";

export async function load({ params }) {
    const { slug } = params; // Extraemos el id o slug de la URL
    
    let mEvento = {};
    let fases = [];
    let urlImagenPortada = null;
    let eventoActivo = true;

    // Obtener evento por ID o por Slug
    let { data: evento, error } = await getEventoByIdOrSlug(slug);
    
    if (evento && evento.length > 0) {
        mEvento = evento[0];
        urlImagenPortada = getImagenPublicUrl(mEvento.pathImage);
        
        eventoId.set(mEvento.idevento);

        // Obtener las fases o tickets del evento
        let { data: cFases, error: errorF } = await getFasesByEvento(mEvento.idevento);
        if (cFases && cFases.length > 0) {
            fases = cFases;
        } else if (errorF) {
            console.log("Error al traer las fases", errorF);
        }
    } else {
        eventoActivo = false;
        if (error) {
            console.log("Error al traer el evento activo");
        } else {
            console.log("No hay eventos activos en este momento o el evento no existe");
        }
    }

    return {
        id: mEvento.idevento || slug,
        slug,
        mEvento,
        fases,
        urlImagenPortada,
        eventoActivo
    };
}