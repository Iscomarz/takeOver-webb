import { eventoId } from "../../../lib/stores/eventoId";
import { getEventoById, getFasesByEvento, getImagenPublicUrl } from "$lib/services/dataService";

export async function load({ params }) {
    const { id } = params; // Extraemos el id de la URL
    
    eventoId.set(id);

    let mEvento = {};
    let fases = [];
    let urlImagenPortada = null;
    let eventoActivo = true;

    // Obtener evento
    let { data: evento, error } = await getEventoById(id);
    
    if (evento && evento.length > 0) {
        mEvento = evento[0];
        urlImagenPortada = getImagenPublicUrl(mEvento.pathImage);

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
            console.log("No hay eventos activos en este momento");
        }
    }

    return {
        id,
        mEvento,
        fases,
        urlImagenPortada,
        eventoActivo
    };
}