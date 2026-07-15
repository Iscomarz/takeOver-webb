<script>
  import { onMount, tick } from "svelte";
  import { loadStripe } from "@stripe/stripe-js";
  import toast, { Toaster } from 'svelte-french-toast';
  import { goto } from "$app/navigation";

  let stripe;
  let elements;
  let acceptedTerms = false;
  let isProcessing = false;
  let showPaymentForm = false;
  let nombre = "";
  let correo = "";
  let clientSecret = "";
  let paymentIntentId = "";

  // Datos recuperados de sessionStorage
  let checkoutData = null;
  let finalPrice = 0;
  let cantidad = 0;
  let tickets = [];
  let nombreEvento = "";
  let mEvento = null;
  let urlImagenPortada = "";
  let descuentoAplicado = false;
  let codigoDescuentoUsado = null;

  onMount(async () => {
    const stored = sessionStorage.getItem("takeover_checkout_data");
    if (!stored) {
      toast.error("No hay datos de compra válidos. Redirigiendo...");
      setTimeout(() => {
        goto("/");
      }, 2000);
      return;
    }

    try {
      checkoutData = JSON.parse(stored);
      finalPrice = checkoutData.totalPrice;
      cantidad = checkoutData.cantidad;
      tickets = checkoutData.tickets || [];
      nombreEvento = checkoutData.nombreEvento || "";
      mEvento = checkoutData.mEvento || {};
      urlImagenPortada = checkoutData.urlImagenPortada || "";
      descuentoAplicado = checkoutData.descuentoAplicado || false;
      codigoDescuentoUsado = checkoutData.codigoDescuentoUsado || null;

      // Si es una compra (precio > 0), inicializamos Stripe
      if (finalPrice > 0) {
        stripe = await loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_KEY_LIVE);
        if (!stripe) {
          toast.error("Error al cargar la pasarela de pagos. Por favor, recarga la página.");
          return;
        }
        await inicializarStripeElements();
      }
    } catch (e) {
      console.error("Error al inicializar el checkout:", e);
      toast.error("Ocurrió un error al cargar tus datos.");
      setTimeout(() => goto("/"), 2000);
    }
  });

  async function inicializarStripeElements() {
    isProcessing = true;
    try {
      const ticketsDescripcion = tickets
        .map(t => `${t.nombreFace} (x${t.cantidad})`)
        .join(", ");

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: finalPrice,
          metadata: {
            codigoDescuento: codigoDescuentoUsado,
            nombre: nombre, 
            correo: correo,
            cantidad: cantidad,
            ticketsDescripcion: ticketsDescripcion
          },
          nombreEvento: nombreEvento,
          nombreFase: tickets.length > 0 ? tickets[0].nombreFace : ""
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      clientSecret = data.clientSecret;
      paymentIntentId = data.paymentIntentId;

      const appearance = {
        theme: 'night',
        variables: {
          colorPrimary: '#56fdb8',
          colorBackground: '#0a0a0a',
          colorText: '#ffffff',
          colorDanger: '#df1b41',
          fontFamily: 'JostRegular, system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        },
        rules: {
          '.Input': {
            border: '1px solid #4b4b4b',
            boxShadow: 'none',
          },
          '.Input:focus': {
            border: '1px solid #56fdb8',
            boxShadow: '0 0 0 1px #56fdb8',
          },
          '.Label': {
            color: '#ffffff',
            fontWeight: '500',
          }
        }
      };

      elements = stripe.elements({ 
        clientSecret,
        appearance 
      });

      showPaymentForm = true;
      await tick();

      const paymentElement = elements.create('payment');
      paymentElement.mount('#payment-element');
    } catch (error) {
      console.error("Error iniciando Stripe Elements:", error);
      toast.error("Error al inicializar el formulario de pago.");
    } finally {
      isProcessing = false;
    }
  }

  async function handleSubmit() {
    if (!stripe || !elements) {
      toast.error("La pasarela de pago no está lista. Por favor espera.");
      return;
    }

    if (!nombre.trim() || !correo.trim()) {
      toast.error("Por favor ingresa tu nombre y correo electrónico");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones para continuar");
      return;
    }

    isProcessing = true;

    try {
      // Actualizar metadatos en Stripe antes de confirmar el pago
      await fetch("/api/update-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId,
          metadata: {
            nombre: nombre,
            correo: correo
          }
        }),
      });
    } catch (err) {
      console.error("Error al actualizar metadatos del pago:", err);
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
        payment_method_data: {
          billing_details: {
            name: nombre,
            email: correo,
          }
        }
      },
    });

    if (error) {
      console.error("Error confirmando pago:", error);
      toast.error(error.message || "Error procesando el pago");
      isProcessing = false;
    }
  }

  async function confirmarRegistroGratis() {
    if (!nombre.trim() || !correo.trim()) {
      toast.error("Por favor ingresa tu nombre y correo electrónico");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones para continuar");
      return;
    }

    isProcessing = true;

    try {
      const selectedTicket = tickets[0];
      const idEvento = selectedTicket ? selectedTicket.idEvento : (mEvento ? mEvento.idevento : null);

      const response = await fetch("/api/free-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombre,
          correo: correo,
          cantidad: cantidad,
          tickets: tickets,
          nombreEvento: nombreEvento,
          idEvento: idEvento
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Registro completado exitosamente");
        window.location.href = `${window.location.origin}/success?free=true&nombre=${encodeURIComponent(nombre)}&correo=${encodeURIComponent(correo)}`;
      } else {
        throw new Error(data.error || "Error al procesar el registro");
      }
    } catch (error) {
      console.error("Error en registro gratis:", error);
      toast.error(error.message || "Error al procesar el registro");
    } finally {
      isProcessing = false;
    }
  }

  function formatearFechaLarga(fechaStr) {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    const str = fecha.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatearHora(fechaStr) {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString("es-MX", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  }

  function volverAtras() {
    if (mEvento && mEvento.idevento) {
      goto(`/eventos/${mEvento.idevento}`);
    } else {
      goto("/");
    }
  }
</script>

<svelte:head>
  <title>Finalizar Compra - {nombreEvento || "Take Over"}</title>
</svelte:head>

<Toaster />

<main class="checkout-page">
  <div class="checkout-wrapper">
    <!-- Botón Volver -->
    <button class="btn-back" on:click={volverAtras}>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Volver al evento
    </button>

    <h2 class="page-title">Finalizar Compra</h2>

    <div class="checkout-grid">
      <!-- Columna Izquierda: Detalle del evento y resumen -->
      <section class="summary-column">
        {#if mEvento}
          <!-- Tarjeta del Evento -->
          <div class="event-card-compact glass-card">
            {#if urlImagenPortada}
              <img src={urlImagenPortada} alt={nombreEvento} class="event-thumbnail" />
            {/if}
            <div class="event-details">
              <span class="event-category">Take Over Presenta:</span>
              <h3>{mEvento.nombreEvento}</h3>
              <p class="event-meta">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {formatearFechaLarga(mEvento.fechaInicio)} / {formatearHora(mEvento.fechaInicio)}
              </p>
              <p class="event-meta">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {mEvento.venue}
              </p>
            </div>
          </div>
        {/if}

        <!-- Resumen de Compra -->
        <div class="purchase-summary glass-card">
          <h4>Resumen de Compra</h4>
          <div class="ticket-list">
            {#each tickets as ticket}
              <div class="ticket-item">
                <div class="ticket-info">
                  <span class="ticket-name">{ticket.nombreFace}</span>
                  <span class="ticket-qty">x{ticket.cantidad}</span>
                </div>
                <span class="ticket-price">Mex${(ticket.precio * ticket.cantidad).toFixed(2)}</span>
              </div>
            {/each}
          </div>

          <div class="divider"></div>

          {#if descuentoAplicado && codigoDescuentoUsado}
            <div class="applied-discount">
              <span>Código aplicado: <strong>{codigoDescuentoUsado}</strong></span>
              <span class="discount-badge">¡Descuento Activo!</span>
            </div>
          {/if}

          <div class="summary-total">
            <span>Total</span>
            <span class="total-amount">Mex${finalPrice.toFixed(2)}</span>
          </div>
        </div>
      </section>

      <!-- Columna Derecha: Formulario de Registro y Pago -->
      <section class="form-column">
        <div class="checkout-form glass-card">
          <h4>Datos del comprador</h4>
          
          <div class="input-group">
            <label for="nombre">Nombre completo *</label>
            <input
              id="nombre"
              type="text"
              bind:value={nombre}
              placeholder="Juan Pérez"
              disabled={isProcessing}
            />
          </div>

          <div class="input-group">
            <label for="correo">Correo electrónico *</label>
            <input
              id="correo"
              type="email"
              bind:value={correo}
              placeholder="tu@email.com"
              disabled={isProcessing}
            />
          </div>

          <!-- Stripe Elements -->
          {#if finalPrice > 0}
            <div class="payment-method-section">
              <h4>Método de pago</h4>
              {#if showPaymentForm}
                <div id="payment-element" class="payment-element-container">
                  <!-- Stripe se montará aquí -->
                </div>
              {:else}
                <div class="stripe-loading">
                  <p class="animate-pulse">Cargando pasarela de pago...</p>
                </div>
              {/if}
            </div>
          {/if}

          <!-- Aceptación de términos -->
          <label class="terms-label">
            <input type="checkbox" bind:checked={acceptedTerms} disabled={isProcessing} />
            <p class="terminos">Acepto los <a href="/terminos" target="_blank">términos y condiciones</a></p>
          </label>

          {#if finalPrice > 0}
            <button
              class="btn-submit"
              on:click={handleSubmit}
              disabled={isProcessing || !showPaymentForm || !nombre.trim() || !correo.trim() || !acceptedTerms}
            >
              {#if isProcessing}
                Procesando pago...
              {:else}
                Pagar Mex${finalPrice.toFixed(2)}
              {/if}
            </button>
            <p class="secure-payment">
              🔒 Pago seguro procesado y encriptado por Stripe
            </p>
          {:else}
            <button
              class="btn-submit"
              on:click={confirmarRegistroGratis}
              disabled={isProcessing || !nombre.trim() || !correo.trim() || !acceptedTerms}
            >
              {#if isProcessing}
                Procesando registro...
              {:else}
                Confirmar Registro Gratis
              {/if}
            </button>
          {/if}
        </div>
      </section>
    </div>
  </div>
</main>

<style>
  .checkout-page {
    background-color: #050505;
    min-height: 100vh;
    color: #ffffff;
    font-family: 'JostRegular', system-ui, -apple-system, sans-serif;
    padding: 80px 20px 40px;
    box-sizing: border-box;
  }

  .checkout-wrapper {
    max-width: 1100px;
    margin: 0 auto;
  }

  .btn-back {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: #999;
    font-size: 0.95em;
    cursor: pointer;
    padding: 0;
    margin-bottom: 25px;
    transition: color 0.2s;
  }

  .btn-back:hover {
    color: #56fdb8;
  }

  .page-title {
    font-family: 'JockeyOne', sans-serif;
    font-size: clamp(1.8em, 4vw, 2.5em);
    margin: 0 0 30px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .checkout-grid {
    display: grid;
    grid-template-cols: 1fr;
    gap: 30px;
  }

  @media (min-width: 900px) {
    .checkout-grid {
      grid-template-cols: 5fr 6fr;
    }
  }

  /* Glassmorphism Card Style */
  .glass-card {
    background: linear-gradient(to bottom right, rgba(23, 23, 23, 0.95), rgba(38, 38, 38, 0.95));
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
    padding: 24px;
    margin-bottom: 20px;
  }

  /* Tarjeta de Evento Compacta */
  .event-card-compact {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .event-thumbnail {
    width: 80px;
    height: 100px;
    object-cover: cover;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
  }

  .event-details {
    flex: 1;
  }

  .event-category {
    color: #56fdb8;
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: block;
    margin-bottom: 4px;
  }

  .event-details h3 {
    margin: 0 0 8px;
    font-size: 1.25em;
    font-weight: 600;
    color: #fff;
  }

  .event-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #aaa;
    font-size: 0.85em;
    margin: 4px 0;
  }

  .event-meta svg {
    color: #666;
  }

  /* Resumen de Compra */
  .purchase-summary h4,
  .checkout-form h4,
  .payment-method-section h4 {
    font-family: 'JockeyOne', sans-serif;
    font-size: 1.25em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 0;
    margin-bottom: 20px;
    color: whitesmoke;
  }

  .ticket-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ticket-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95em;
  }

  .ticket-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ticket-name {
    color: #ddd;
  }

  .ticket-qty {
    color: #56fdb8;
    background-color: rgba(86, 253, 184, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85em;
    font-weight: 600;
  }

  .ticket-price {
    color: #fff;
    font-weight: 500;
  }

  .divider {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
    margin: 20px 0;
  }

  .applied-discount {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(86, 253, 184, 0.05);
    border: 1px dashed rgba(86, 253, 184, 0.2);
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-size: 0.9em;
  }

  .discount-badge {
    color: #56fdb8;
    font-weight: 600;
  }

  .summary-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.15em;
    font-weight: 600;
  }

  .total-amount {
    color: #56fdb8;
    font-size: 1.3em;
  }

  /* Formulario y Stripe */
  .input-group {
    margin-bottom: 20px;
  }

  .input-group label {
    display: block;
    font-size: 0.9em;
    color: #ccc;
    margin-bottom: 8px;
  }

  .input-group input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #4b4b4b;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.04);
    color: #fff;
    font-family: inherit;
    font-size: 1em;
    box-sizing: border-box;
    transition: all 0.2s;
  }

  .input-group input:focus {
    outline: none;
    border-color: #56fdb8;
    box-shadow: 0 0 0 1px #56fdb8;
    background-color: rgba(255, 255, 255, 0.07);
  }

  .input-group input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .payment-method-section {
    margin-top: 30px;
    margin-bottom: 20px;
  }

  .payment-element-container {
    padding: 16px;
    background-color: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    border: 1px solid #4b4b4b;
  }

  .stripe-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 150px;
    background-color: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    border: 1px dashed #4b4b4b;
    color: #777;
    font-size: 0.95em;
  }

  .terms-label {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 25px 0;
    cursor: pointer;
  }

  .terms-label input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #56fdb8;
  }

  .terminos {
    margin: 0;
    font-size: 0.9em;
    color: #ccc;
  }

  .terminos a {
    color: #56fdb8;
    text-decoration: none;
  }

  .terminos a:hover {
    text-decoration: underline;
  }

  .btn-submit {
    background-color: #56fdb8;
    color: #000;
    border: none;
    padding: 14px 24px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    border-radius: 8px;
    font-family: inherit;
    width: 100%;
    transition: background-color 0.2s, opacity 0.2s;
  }

  .btn-submit:hover:not(:disabled) {
    background-color: #45eca7;
  }

  .btn-submit:disabled {
    background-color: #333;
    color: #666;
    cursor: not-allowed;
  }

  .secure-payment {
    text-align: center;
    color: #666;
    font-size: 0.8em;
    margin-top: 15px;
    margin-bottom: 0;
  }
</style>
