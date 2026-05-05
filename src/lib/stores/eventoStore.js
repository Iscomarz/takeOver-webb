import { writable } from 'svelte/store';
import { getEventoActivo } from '../services/dataService';

function createEventoStore() {
    const { subscribe, set, update } = writable({
        evento: null,
        loading: true,
        error: null
    });

    let hasLoaded = false;

    return {
        subscribe,
        loadEvento: async () => {
            if (hasLoaded) return; // Si ya se cargó, no volver a pedir

            update(state => ({ ...state, loading: true }));

            try {
                const { data, error } = await getEventoActivo();
                if (error) throw error;

                set({
                    evento: data,
                    loading: false,
                    error: null
                });
                hasLoaded = true;
            } catch (err) {
                set({
                    evento: null,
                    loading: false,
                    error: err.message
                });
            }
        },
        reset: () => {
            set({ evento: null, loading: true, error: null });
            hasLoaded = false;
        }
    };
}

export const eventoStore = createEventoStore();