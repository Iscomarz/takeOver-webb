import { eventoId } from "../../../lib/stores/eventoId";
import { getEventoByIdOrSlug, getFasesByEvento, getImagenPublicUrl, getMediaByEvento } from "$lib/services/dataService";

export async function load({ params }) {
    const { slug } = params; // Extraemos el id o slug de la URL
    
    let mEvento = {};
    let fases = [];
    let media = [];
    let urlImagenPortada = null;
    let eventoActivo = true;

    // Obtener evento por ID o por Slug
    let { data: evento, error } = await getEventoByIdOrSlug(slug);
    
    if (evento && evento.length > 0) {
        mEvento = evento[0];
        urlImagenPortada = getImagenPublicUrl(mEvento.pathImage);
        
        eventoId.set(mEvento.idevento);

        // Obtener las fases y media del evento en paralelo
        const [fasesRes, mediaRes] = await Promise.all([
            getFasesByEvento(mEvento.idevento),
            getMediaByEvento(mEvento.idevento)
        ]);

        if (fasesRes.data && fasesRes.data.length > 0) {
            fases = fasesRes.data;
        } else if (fasesRes.error) {
            console.log("Error al traer las fases", fasesRes.error);
        }

        if (mediaRes.data && mediaRes.data.length > 0) {
            media = mediaRes.data;
        } else if (mediaRes.error) {
            console.log("Error al traer media del evento", mediaRes.error);
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
        media,
        urlImagenPortada,
        eventoActivo
    };
}