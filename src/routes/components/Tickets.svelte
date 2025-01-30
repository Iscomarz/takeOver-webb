<script>
    import { inactivoState, tickets } from './ticketStore.js';
    import Ticket from './Ticket.svelte';
    import { derived } from 'svelte/store';
    import Checkout from "../components/Checkout.svelte";
    import { onMount, tick } from 'svelte';
    export let ticketDataEve;

    let cantidad = 0;
    let idStripeSeleccionado;

    onMount(async () => {
        await tick();
        tickets.set(ticketDataEve);
        inactivoState.set(ticketDataEve.map((ticket) => !ticket.activo));
    });

    const totalPrice = derived(tickets, $tickets =>
        $tickets.reduce((sum, ticket) => sum + (ticket.precio * ticket.cantidad), 0)
    );
</script>

<h3>TICKETS</h3>
<div class="tickets-container">
    {#each ticketDataEve as ticket, index}
        <Ticket nombre={ticket.nombreFace} vigencia={ticket.fechaExpira} precio={ticket.precio} {index}/>
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
