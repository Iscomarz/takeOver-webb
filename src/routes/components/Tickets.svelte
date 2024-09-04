<script>
    import { tickets } from './ticketStore.js';
    import Ticket from './Ticket.svelte';
    import { derived } from 'svelte/store';

    let ticketData = [
        { nombre: "General Access", vigencia: "Expires August 16", precio: 150 },
        { nombre: "VIP Access", vigencia: "Expires August 16", precio: 300 }
        // Puedes añadir más tickets aquí
    ];

    const totalPrice = derived(tickets, $tickets =>
        $tickets.reduce((sum, ticket) => sum + (ticket.precio * ticket.cantidad), 0)
    );
</script>

<h3>TICKETS</h3>
<div class="tickets-container">
    {#each ticketData as {nombre, vigencia, precio}, index}
        <Ticket {nombre} {vigencia} {precio} {index} />
    {/each}

    <div class="total-price">
        <button>
            <p>Buy</p> ${$totalPrice}
        </button>
    </div>
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

    .total-price {
        margin-top: 20px;
    }

    button {
        background-color: #56FDB8;
        color: rgb(0, 0, 0);
        border: none;
        padding: 10px 20px;
        font-size: clamp(.9em, 3vw, 1.2em);
        cursor: pointer;
        border-radius: 5px;
        font-family: "JostRegular";
        width: 200px;
        display: flex;
        justify-content: space-around;
    }

    button:hover {
        background-color: #3a3a3a;
    }
</style>
