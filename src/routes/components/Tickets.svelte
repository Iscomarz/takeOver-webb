<script>
    import { inactivoState, tickets } from './ticketStore.js';
    import Ticket from './Ticket.svelte';
    import { derived } from 'svelte/store';
    import Checkout from "../components/Checkout.svelte";
    import { onMount, tick } from 'svelte';
    export let ticketDataEve;

    let idStripeSeleccionado = null;
    let cantidad = 0;

    onMount(async () => {
        await tick();
        tickets.set(ticketDataEve);
        inactivoState.set(ticketDataEve.map((ticket) => !ticket.activo));
    });

    const totalPrice = derived(tickets, $tickets =>
        $tickets.reduce((sum, ticket) => sum + (ticket.precio * ticket.cantidad), 0)
    );

    const totalCantidad = derived(tickets, $tickets =>
    $tickets.reduce((sum, ticket) => sum + ticket.cantidad, 0)
    );

    function handleQuantityChange(event) {
        idStripeSeleccionado = event.detail.idPrecioStripe;
        cantidad = event.detail.cantidad;
    }
</script>

<h3>TICKETS</h3>
<div class="tickets-container">
    {#each ticketDataEve as ticket, index}
        <Ticket nombreFace={ticket.nombreFace} vigencia={ticket.fechaExpira} precio={ticket.precio} 
        activo={ticket.activo} idPrecioStripe={ticket.idPrecioStripe} idFase={ticket.idFase} 
        idEvento={ticket.idEvento} fechaExpira={ticket.fechaExpira}
        {index} on:quantityChange={handleQuantityChange}/>
    {/each}
    <Checkout idPrecioStripe={idStripeSeleccionado} cantidad={$totalCantidad} totalPrice={totalPrice}/>
</div>

<style>
     h3{
        font-family: "JockeyOne";
        color: whitesmoke;
    }
    .tickets-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }
</style>
