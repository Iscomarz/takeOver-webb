<script>
  import { inactivoState, tickets } from "./ticketStore.js";
  import Ticket from "./Ticket.svelte";
  import { derived } from "svelte/store";
  import Checkout from "../components/Checkout.svelte";
  import { onMount, tick } from "svelte";
  import supabase from "../../lib/supabase.js";

  export let ticketDataEve;
  export let eventoPasado = false;
  export let eventoReferidos = false;

  let ticketsPublicos = [];
  let ticketReferidoInfo = null;
  let idStripeSeleccionado = null;
  let cantidad = 0;
  
  // Variables para código de descuento
  let codigoDescuento = "";
  let descuentoAplicado = false;
  let mensajeDescuento = "";
  let idPrecioDescuento = null;
  let validandoCodigo = false;

  // Variables para código de referido
  let codigoReferido = "";
  let correoValidacion = "";
  let referidoAplicado = false;
  let mensajeReferido = "";
  let idPrecioReferido = null;
  let validandoReferido = false;

  let showDescuento = false;
  let showReferido = false;

  onMount(async () => {
    await tick();
    // Filtramos el ticket especial para que no aparezca en la lista normal
    ticketsPublicos = ticketDataEve.filter(t => t.nombreFace !== 'Referido Especial');
    ticketReferidoInfo = ticketDataEve.find(t => t.nombreFace === 'Referido Especial');

    tickets.set(ticketsPublicos);
    inactivoState.set(ticketsPublicos.map((ticket) => !ticket.activo));
    //console.log("Tickets iniciales:", ticketsPublicos);
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

  async function validarCodigoReferido() {
    if (!codigoReferido.trim()) {
      mensajeReferido = "Por favor ingresa un código de referido";
      return;
    }
    if (!correoValidacion.trim() || !correoValidacion.includes('@')) {
      mensajeReferido = "Ingresa tu correo para validar";
      return;
    }

    validandoReferido = true;
    mensajeReferido = "";

    try {
      const response = await fetch("/api/validate-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          codigo: codigoReferido.trim(), 
          correo: correoValidacion.trim() 
        })
      });
      const data = await response.json();

      if (!response.ok) {
        mensajeReferido = data.error || "Código de referido inválido";
        referidoAplicado = false;
        idPrecioReferido = null;
      } else {
        mensajeReferido = "¡Código verificado!. Continúa al checkout.";
        referidoAplicado = true;
        
        if (ticketReferidoInfo) {
          idPrecioReferido = ticketReferidoInfo.idPrecioStripe;
        } else {
          mensajeReferido = "Ticket de referido no configurado";
          referidoAplicado = false;
        }
      }
    } catch (error) {
      console.error("Error validando referido:", error);
      mensajeReferido = "Error al validar tu código, intenta de nuevo";
      referidoAplicado = false;
      idPrecioReferido = null;
    } finally {
      validandoReferido = false;
    }
  }

  function limpiarReferido() {
    codigoReferido = "";
    correoValidacion = "";
    referidoAplicado = false;
    mensajeReferido = "";
    idPrecioReferido = null;
  }
</script>

  <h3>TICKETS</h3>
  <div class="tickets-container">
    {#each ticketsPublicos as ticket, index}
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
        isFirst={index === 0}
        isLast={index === ticketsPublicos.length - 1}
        on:quantityChange={handleQuantityChange}
      />
    {/each}
    
    <!-- Sección de código de descuento -->
    <div class="discount-section">
      <div class="discount-header" on:click={() => showDescuento = !showDescuento} on:keydown={(e) => e.key === 'Enter' && (showDescuento = !showDescuento)} tabindex="0" role="button">
        <h4>¿Tienes un código de descuento?</h4>
        <span class="toggle-icon">{showDescuento ? '−' : '+'}</span>
      </div>
      {#if showDescuento}
        <div class="discount-content">
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
      {/if}
    </div>

    <!-- Sección de código de referido -->
    {#if eventoReferidos}
      <div class="discount-section">
        <div class="discount-header" on:click={() => showReferido = !showReferido} on:keydown={(e) => e.key === 'Enter' && (showReferido = !showReferido)} tabindex="0" role="button">
          <h4>¿Fuiste referido por un amigo?</h4>
          <span class="toggle-icon">{showReferido ? '−' : '+'}</span>
        </div>
        {#if showReferido}
          <div class="discount-content">
            <p class="nota-referido" style="font-size: 13px; color: whitesmoke; margin-bottom: 8px;">
              Ingresa el código proporcionado por tu amigo y tu correo electrónico para obtener un precio especial.
            </p>
            <div class="discount-input-container">
              <input
                type="text"
                bind:value={codigoReferido}
                placeholder="Código"
                class="discount-input input-referido"
                disabled={referidoAplicado || validandoReferido}
              />
              <input
                type="email"
                bind:value={correoValidacion}
                placeholder="Tu email de compra"
                class="discount-input input-referido"
                disabled={referidoAplicado || validandoReferido}
              />
            </div>
            <div class="discount-input-container" style="justify-content: flex-end;">
              {#if !referidoAplicado}
                <button
                  class="apply-discount-btn"
                  on:click={validarCodigoReferido}
                  disabled={validandoReferido || !codigoReferido.trim() || !correoValidacion.trim()}
                >
                  {validandoReferido ? "Validando..." : "Aplicar"}
                </button>
              {:else}
                <button class="remove-discount-btn" on:click={limpiarReferido}>
                  Quitar
                </button>
              {/if}
            </div>
            {#if mensajeReferido}
              <p class="discount-message" class:success={referidoAplicado} class:error={!referidoAplicado && mensajeReferido}>
                {mensajeReferido}
              </p>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <Checkout
      idPrecioStripe={referidoAplicado ? idPrecioReferido : (descuentoAplicado ? idPrecioDescuento : idStripeSeleccionado)}
      cantidad={referidoAplicado ? 1 : (descuentoAplicado ? 1 : $totalCantidad)}
      {totalPrice}
      {eventoPasado}
      descuentoAplicado={descuentoAplicado || referidoAplicado}
      codigoDescuentoUsado={referidoAplicado ? codigoReferido : (descuentoAplicado ? codigoDescuento : null)}
      isReferral={referidoAplicado}
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
    gap: 0;
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
    margin: 0;
    font-size: 1.1em;
  }

  .discount-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }

  .toggle-icon {
    color: #56fdb8;
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1;
    transition: transform 0.3s ease;
  }

  .discount-content {
    margin-top: 15px;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
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
