<script>
    import { tickets } from './ticketStore.js';
    import Counter from "./Counter.svelte";
    import { createEventDispatcher, onMount } from 'svelte';

    export let nombre = "General Access";
    export let vigencia = "Expires August 16";
    export let precio = 150;
    export let index;

    let cantidad = 0;

    const dispatch = createEventDispatcher();

    function updateTickets(newCantidad) {
        cantidad = newCantidad;
        tickets.update((currentTickets) => {
            const updatedTickets = [...currentTickets];
            updatedTickets[index] = { precio, cantidad };
            return updatedTickets;
        });

        // Emitir evento con la nueva cantidad
        dispatch('quantityChange', { index, cantidad });
    }

    onMount(() => {
        updateTickets(0);
    });
</script>

<div class="rounded">
    <div class="grid-container">
        <div class="nombre">
            <h4>{nombre}</h4>
        </div>
        <div class="precio">
            <p>Mex${precio}</p>
        </div>
        <div class="vigencia">
            <p>{vigencia}</p>
        </div>
        <div class="contador">
            <Counter bind:count={cantidad} on:countChange={e => updateTickets(e.detail)} />
        </div>
    </div>
</div>

<style>
    .rounded {
        border: 3px solid #4b4b4b;
        border-radius: 10px;
        color: whitesmoke;
        padding: 15px;
        display: flex;
        justify-content: center;
        align-items: start;
        width: 100%;
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        width: 100%;
        text-align: start;
    }

    .nombre, .vigencia, .precio, .contador {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: "JostRegular";
    }

    .vigencia {
        color: #848484;
        font-size: .8em;
    }

    h4, p{
        font-size: clamp(.8em, 3vw, 1em);
    }
</style>
