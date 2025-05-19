<script>
  import { tickets, inactivoState } from "./ticketStore.js";
  import Counter from "./Counter.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import { get } from "svelte/store";

  export let vigencia;
  export let precio;
  export let index;
  export let inactivo;
  export let nombreFace;
  export let activo;
  export let idPrecioStripe;
  export let idFase;
  export let idEvento;
  export let soldout = false;
  export let descripcion = "";

  let cantidad = 0;
  let mostrarDescripcion = false;

  const dispatch = createEventDispatcher();

  // Suscribirse al store inactivoState
  $: inactivoState.subscribe((state) => {
    inactivo = state[index];
  });

  function toggleDescripcion() {
    mostrarDescripcion = !mostrarDescripcion;
  }

  function formatearFechas(dateString) {
    const date = new Date(dateString);
    const options = { month: "long", day: "numeric" };
    const formattedDate = date.toLocaleDateString("en-Us", options);
    return `Expires ${formattedDate}`;
  }

  function updateTickets(newCantidad) {
    cantidad = newCantidad;
    tickets.update((currentTickets) => {
      const updatedTickets = [...currentTickets];
      updatedTickets[index] = {
        precio: precio,
        cantidad: cantidad,
        nombreFace: nombreFace,
        activo: activo,
        idPrecioStripe: idPrecioStripe,
        idFase: idFase,
        idEvento: idEvento,
        fechaExpira: vigencia,
      };
      return updatedTickets;
    });

    // Emitir evento con la nueva cantidad
    dispatch("quantityChange", { index, cantidad, idPrecioStripe });

    // Obtener el estado actual de los tickets
    const currentTickets = get(tickets);
    // Validar si todas las cantidades son 0
    const allZero = currentTickets.every((ticket) => ticket.cantidad === 0);

    // Actualizar el estado de inactivoState
    inactivoState.update((state) => {
      if (allZero) {
        const updatedTickets = [...currentTickets];
        inactivoState.update(() =>
          updatedTickets.map((ticket) => !ticket.activo)
        );
        return state;
      } else {
        const updatedState = state.map((_, i) => i !== index);
        updatedState[index] = cantidad === 0;
        return updatedState;
      }
    });
  }

  onMount(() => {
    //updateTickets(0);
    //console.log(descripcion);
  });
</script>

<div class="rounded" class:inactivo>
  <div class="grid-container">
    <div class="nombre">
      <h4>{nombreFace}</h4>
    </div>
    <div class="precio">
      <p>Mex${precio}</p>
    </div>
    <div class="vigencia">
      <p>{formatearFechas(vigencia)}</p>
    </div>
    <div class="contador">
      {#if soldout}
        <p class="soldout">Sold Out</p>
      {:else}
        <Counter {cantidad} on:countChange={(e) => updateTickets(e.detail)} />
      {/if}
    </div>
  </div>
</div>
    {#if descripcion}
    <div class="descripcion-toggle" on:click={toggleDescripcion}>
      <span>{mostrarDescripcion ? "▲" : "▼"} Descripción Early Access</span>
    </div>

    {#if mostrarDescripcion}
      <div class="descripcion-box">
        <p>{descripcion}</p>
      </div>
    {/if}
  {/if}

<style>
  .rounded {
    border: 3px solid #4b4b4b;
    border-radius: 10px;
    color: whitesmoke;
    padding: 10px;
    display: flex;
    justify-content: center;
    align-items: start;
    width: 100%;
  }

    .descripcion-toggle {
    cursor: pointer;
    margin-top: 10px;
    text-align: center;
    font-size: 0.9em;
    color: #ccc;
  }

  .descripcion-toggle:hover {
    color: rgb(255, 0, 0);
  }

  .descripcion-box {
    margin-top: 8px;
    padding: 10px;
    border-top: 1px solid #666;
    font-size: 0.85em;
    color: #ddd;
  }

  .soldout {
    color: #ff0000;
  }

  .inactivo {
    opacity: 0.5;
    pointer-events: none;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    width: 100%;
    text-align: start;
  }

  .nombre,
  .vigencia,
  .precio,
  .contador {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: "JostRegular";
  }

  .vigencia {
    color: #848484;
    font-size: 0.8em;
  }

  h4,
  p {
    font-size: clamp(0.8em, 3vw, 1em);
  }
</style>
