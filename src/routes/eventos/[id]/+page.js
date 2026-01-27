import { eventoId } from "../../../lib/stores/eventoId";

export async function load({ params }) {
    const { id } = params; // Extraemos el id de la URL
   // console.log("ID from URL:", id); 
    
    eventoId.set(id);

    return {
        prop: {
            id // Pasamos el id como prop
        }
    };
}