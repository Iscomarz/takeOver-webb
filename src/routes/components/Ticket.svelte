<script>
  import { tickets, inactivoState } from "./ticketStore.js";
  import Counter from "./Counter.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import { get } from "svelte/store";

  export let nombre;
  export let vigencia;
  export let precio;
  export let index;
  export let inactivo;

  let cantidad = 0;

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
      };
      return updatedTickets;
    });

    // Emitir evento con la nueva cantidad
    dispatch("quantityChange", { index, cantidad });

    // Obtener el estado actual de los tickets
    const currentTickets = get(tickets);
    // Validar si todas las cantidades son 0
    const allZero = currentTickets.every((ticket) => ticket.cantidad === 0);
    console.log(currentTickets);
    console.log(allZero);

    // Actualizar el estado de inactivoState
    inactivoState.update((state) => {
      if (allZero) {
        const updatedTickets = [...currentTickets];
        return inactivoState.update(
          updatedTickets.map((ticket) => !ticket.activo)
        );
      } else {
        const updatedState = state.map((_, i) => i !== index);
        updatedState[index] = cantidad === 0;
        return updatedState;
      }
    });
  }

  onMount(() => {
    //updateTickets(0);
    console.log(index, nombre, precio, vigencia);
  });
</script>

<div class="rounded" class:inactivo>
  <div class="grid-container">
    <div class="nombre">
      <h4>{nombre}</h4>
    </div>
    <div class="precio">
      <p>Mex${precio}</p>
    </div>
    <div class="vigencia">
      <p>{formatearFechas(vigencia)}</p>
    </div>
    <div class="contador">
      <Counter {cantidad} on:countChange={(e) => updateTickets(e.detail)} />
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
