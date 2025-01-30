import { writable } from 'svelte/store';

export const tickets = writable([]);
export const inactivoState = writable([]);

// Suscribirse a cambios en tickets para actualizar inactivoState
tickets.subscribe((currentTickets) => {
    // Si los tickets cambian, inicializamos inactivoState según el estado activo de los tickets
    inactivoState.set(currentTickets.map(ticket => !ticket.activo));
});