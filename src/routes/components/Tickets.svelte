<script>
  import { inactivoState, tickets } from "./ticketStore.js";
  import Ticket from "./Ticket.svelte";
  import { derived } from "svelte/store";
  import Checkout from "../components/Checkout.svelte";
  import { onMount, tick } from "svelte";
  import supabase from "../../lib/supabase.js";

  export let ticketDataEve;
  export let eventoPasado = false;

  let idStripeSeleccionado = null;
  let cantidad = 0;
  
  // Variables para código de descuento
  let codigoDescuento = "";
  let descuentoAplicado = false;
  let mensajeDescuento = "";
  let idPrecioDescuento = null;
  let validandoCodigo = false;

  onMount(async () => {
    await tick();
    tickets.set(ticketDataEve);
    inactivoState.set(ticketDataEve.map((ticket) => !ticket.activo));
    console.log("Tickets iniciales:", ticketDataEve);
  });

  const totalPrice = derived(tickets, ($tickets) =>
    $tickets.reduce((sum, ticket) => sum + ticket.precio * ticket.cantidad, 0)
  );

  const totalCantidad = derived(tickets, ($tickets) =>
    $tickets.reduce((sum, ticket) => sum + ticket.cantidad, 0)
  );

  function handleQuantityChange(event) {
    idStripeSeleccionado = event.detail.idPrecioStripe;
    cantidad = event.detail.cantidad;
  }

  async function validarCodigoDescuento() {
    if (!codigoDescuento.trim()) {
      mensajeDescuento = "Por favor ingresa un código de descuento";
      return;
    }

    validandoCodigo = true;
    mensajeDescuento = "";

    try {
      const { data, error } = await supabase
        .from("codigosDescuento")
        .select("*")
        .eq("codigo", codigoDescuento.trim())
        .eq("acreditado", false)
        .single();

      if (error || !data) {
        mensajeDescuento = "Código de descuento inválido";
        descuentoAplicado = false;
        idPrecioDescuento = null;
      } else {

        mensajeDescuento = `¡Código aplicado! ${data.descripcion || 'Descuento válido'}`;
        descuentoAplicado = true;
        // Por el momento usamos un ID estático como mencionaste
        idPrecioDescuento = data.idPrecioStripeDescuento || "price_1SKUvo2KnoE6M9dvEHOmwBzR"; // ID estático de emergencia
      }
    } catch (error) {
      console.error("Error al validar código:", error);
      mensajeDescuento = "Error al validar el código, intenta de nuevo";
      descuentoAplicado = false;
      idPrecioDescuento = null;
    } finally {
      validandoCodigo = false;
    }
  }

  function limpiarDescuento() {
    codigoDescuento = "";
    descuentoAplicado = false;
    mensajeDescuento = "";
    idPrecioDescuento = null;
  }
</script>

  <h3>TICKETS</h3>
  <div class="tickets-container">
    {#each ticketDataEve as ticket, index}
      <Ticket
        nombreFace={ticket.nombreFace}
        vigencia={ticket.fechaExpira}
        precio={ticket.precio}
        activo={ticket.activo}
        idPrecioStripe={ticket.idPrecioStripe}
        idFase={ticket.idFase}
        idEvento={ticket.idEvento}
        fechaExpira={ticket.fechaExpira}
        soldout={ticket.soldout}
        descripcion={ticket.descripcion}
        oculto={ticket.oculto}
        {index}
        on:quantityChange={handleQuantityChange}
      />
    {/each}
    
    <!-- Sección de código de descuento -->
    <div class="discount-section">
      <h4>¿Tienes un código de descuento?</h4>
      <div class="discount-input-container">
        <input
          type="text"
          bind:value={codigoDescuento}
          placeholder="Ingresa tu código aquí"
          class="discount-input"
          disabled={descuentoAplicado || validandoCodigo}
        />
        {#if !descuentoAplicado}
          <button
            class="apply-discount-btn"
            on:click={validarCodigoDescuento}
            disabled={validandoCodigo || !codigoDescuento.trim()}
          >
            {validandoCodigo ? "Validando..." : "Aplicar"}
          </button>
        {:else}
          <button class="remove-discount-btn" on:click={limpiarDescuento}>
            Quitar
          </button>
        {/if}
      </div>
      {#if mensajeDescuento}
        <p class="discount-message" class:success={descuentoAplicado} class:error={!descuentoAplicado && mensajeDescuento}>
          {mensajeDescuento}
        </p>
      {/if}
    </div>

    <Checkout
      idPrecioStripe={descuentoAplicado ? idPrecioDescuento : idStripeSeleccionado}
      cantidad={descuentoAplicado ? 1 : $totalCantidad}
      {totalPrice}
      {eventoPasado}
      descuentoAplicado={descuentoAplicado}
      codigoDescuentoUsado={descuentoAplicado ? codigoDescuento : null}
    />
  </div>

<style>
  .border {
    border: 3px solid #4b4b4b;
    padding: 15px;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0);
  }
  h3 {
    font-family: "JockeyOne";
    color: whitesmoke;
    padding-bottom: 15px;
    font-size: 1.4em;
  }
  .tickets-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  /* Estilos para código de descuento */
  .discount-section {
    width: 100%;
    margin: 15px 0;
    padding: 15px;
    border-radius: 8px;
    background-color: rgba(75, 75, 75, 0.1);
    border: 1px solid #4b4b4b;
  }

  .discount-section h4 {
    font-family: "JockeyOne";
    color: whitesmoke;
    margin: 0 0 10px 0;
    font-size: 1.1em;
  }

  .discount-input-container {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .discount-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #666;
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0.1);
    color: whitesmoke;
    font-size: 14px;
  }

  .discount-input:focus {
    outline: none;
    border-color: #fff;
  }

  .discount-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .apply-discount-btn,
  .remove-discount-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: background-color 0.3s;
  }

  .apply-discount-btn {
    background-color: #28a745;
    color: white;
  }

  .apply-discount-btn:hover:not(:disabled) {
    background-color: #218838;
  }

  .apply-discount-btn:disabled {
    background-color: #666;
    cursor: not-allowed;
  }

  .remove-discount-btn {
    background-color: #dc3545;
    color: white;
  }

  .remove-discount-btn:hover {
    background-color: #c82333;
  }

  .discount-message {
    margin: 8px 0 0 0;
    font-size: 13px;
    font-weight: bold;
  }

  .discount-message.success {
    color: #28a745;
  }

  .discount-message.error {
    color: #dc3545;
  }
</style>
