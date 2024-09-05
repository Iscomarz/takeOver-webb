<script>
    import { tickets } from './ticketStore.js';
    import Ticket from './Ticket.svelte';
    import { derived } from 'svelte/store';
    import Checkout from "../components/Checkout.svelte";

    let ticketData = [
        { nombre: "General Access", vigencia: "Expires August 16", precio: 150, tipo: 'general' },
        { nombre: "VIP Access", vigencia: "Expires August 16", precio: 300, tipo: 'vip' }
    ];

    let generalTickets = 0;
    let vipTickets = 0;

    // Actualizar la cantidad de boletos según el tipo
    function updateTicketQuantity({ index, cantidad }) {
        if (ticketData[index].tipo === 'general') {
            generalTickets = cantidad;
        } else if (ticketData[index].tipo === 'vip') {
            vipTickets = cantidad;
        }
    }

    const totalPrice = derived(tickets, $tickets =>
        $tickets.reduce((sum, ticket) => sum + (ticket.precio * ticket.cantidad), 0)
    );
</script>

<h3>TICKETS</h3>
<div class="tickets-container">
    {#each ticketData as {nombre, vigencia, precio, tipo}, index}
        <Ticket {nombre} {vigencia} {precio} {index} on:quantityChange={(e) => updateTicketQuantity(e.detail)} />
    {/each}
    <Checkout cantidadGeneral={generalTickets} totalPrice={totalPrice}/>
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
