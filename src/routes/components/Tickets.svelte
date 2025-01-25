<script>
    import { tickets } from './ticketStore.js';
    import Ticket from './Ticket.svelte';
    import { derived } from 'svelte/store';
    import Checkout from "../components/Checkout.svelte";
    import { onMount } from 'svelte';
    export let ticketDataEve;

    let cantidad = 0;
    let idStripeSeleccionado;

    const totalPrice = derived(tickets, $tickets =>
        $tickets.reduce((sum, ticket) => sum + (ticket.precio * ticket.cantidad), 0)
    );
</script>

<h3>TICKETS</h3>
<div class="tickets-container">
    {#each ticketDataEve as {nombreFace, fechaExpira, precio, activo, idPrecioStripe}, index}
        <Ticket inactivo={activo} nombre={nombreFace} vigencia={fechaExpira} precio={precio} {index}/>
    {/each}
    <Checkout idPrecioStripe={idStripeSeleccionado} cantidad={cantidad} totalPrice={totalPrice}/>
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
