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
  export let oculto = false;
  export let isFirst = false;
  export let isLast = false;

  let cantidad = 0;
  let mostrarPopup = false;

  const dispatch = createEventDispatcher();

  // Suscribirse al store inactivoState
  $: inactivoState.subscribe((state) => {
    inactivo = state[index];
  });

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
          updatedTickets.map((ticket) => !ticket.activo),
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
{#if !oculto}
<div class="rounded" class:inactivo class:first={isFirst} class:last={isLast} class:middle={!isFirst && !isLast}>
  {#if descripcion}
    <span 
      class="info-icon"
      on:mouseenter={() => mostrarPopup = true}
      on:mouseleave={() => mostrarPopup = false}
    >
      <img src="/src/lib/images/icons/info.svg" alt="info" class="icon-img" />
      {#if mostrarPopup}
        <div class="popup">
          {descripcion}
        </div>
      {/if}
    </span>
  {/if}
  
  <div style="display: flex; flex-direction: column; width: 100%; align-items: center; gap: 10px;">
    <div class="grid-container">
      <div class="nombre">
        <h4>
          {nombreFace}
        </h4>
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
</div>
{/if}

<style>
  .rounded {
    border: 1px solid #4b4b4b;
    border-radius: 0;
    color: whitesmoke;
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    width: 100%;
    position: relative;
  }

  /* Primer ticket - borde superior redondeado */
  .rounded.first {
    border-radius: 10px 10px 0 0;
  }

  /* Último ticket - borde inferior redondeado */
  .rounded.last {
    border-radius: 0 0 10px 10px;
    border-top: none;
  }

  /* Tickets del medio - sin bordes redondeados */
  .rounded.middle {
    border-radius: 0;
    border-top: none;
  }

  /* Si hay solo un ticket, mantener todos los bordes redondeados */
  .rounded.first.last {
    border-radius: 10px;
    border-top: 1px solid #4b4b4b;
  }

  .info-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: help;
    transition: opacity 0.2s;
    z-index: 10;
  }

  .info-icon:hover {
    opacity: 0.7;
  }

  .icon-img {
    width: 20px;
    height: 20px;
    display: block;
  }

  .popup {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background-color: #2a2a2a;
    color: #fff;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 0.85em;
    white-space: normal;
    min-width: 200px;
    max-width: 300px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    border: 1px solid #4b4b4b;
    text-align: center;
    pointer-events: none;
    font-family: "JostRegular";
  }

  .popup::after {
    content: "";
    position: absolute;
    bottom: 100%;
    right: 10px;
    border-width: 6px;
    border-style: solid;
    border-color: transparent transparent #2a2a2a transparent;
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

  .nombre h4 {
    display: flex;
    align-items: center;
    justify-content: center;
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
