<script>
  import { onMount } from "svelte";
  import { loadStripe } from "@stripe/stripe-js";
  import toast, { Toaster } from 'svelte-french-toast';

  export let totalPrice = 0;
  export let cantidad;
  export let eventoPasado = false;
  export let descuentoAplicado = false;
  export let codigoDescuentoUsado = null;
  export let nombreEvento = "";
  export let nombreFase = "";
  export let tickets = []; // Array de tickets seleccionados

  let stripe;
  let elements;
  let acceptedTerms = false;
  let isProcessing = false;
  let showPaymentForm = false;
  let nombre = "";
  let correo = "";
  let clientSecret = "";

  onMount(async () => {
    //live
    stripe = await loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_KEY_LIVE);
  });

  async function iniciarCheckout() {
    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones para continuar", {
        position: "bottom-center",
        style: 'background: #333; color: #fff;',
      });
      return;
    }

    const finalPrice = $totalPrice;
    
    if (finalPrice === 0 || cantidad === 0) {
      toast.error("Selecciona un ticket para continuar la compra", {
        position: "bottom-center",
        style: 'background: #333; color: #fff;',
      });
      return;
    }

    isProcessing = true;

    try {
      // Crear descripción de los tickets
      const ticketsDescripcion = tickets
        .filter(t => t.cantidad > 0)
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
      
      // Inicializar Stripe Elements
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

      const paymentElement = elements.create('payment');
      paymentElement.mount('#payment-element');

      showPaymentForm = true;
    } catch (error) {
      console.error("Error iniciando checkout:", error);
      toast.error("Error al iniciar el pago. Intenta de nuevo.", {
        position: "bottom-center",
        style: 'background: #333; color: #fff;',
      });
    } finally {
      isProcessing = false;
    }
  }

  async function handleSubmit() {
    if (!stripe || !elements) {
      return;
    }

    // Validar nombre y correo antes de procesar el pago
    if (!nombre.trim() || !correo.trim()) {
      toast.error("Por favor ingresa tu nombre y correo electrónico", {
        position: "bottom-center",
        style: 'background: #333; color: #fff;',
      });
      return;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      toast.error("Por favor ingresa un correo electrónico válido", {
        position: "bottom-center",
        style: 'background: #333; color: #fff;',
      });
      return;
    }

    isProcessing = true;

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
      toast.error(error.message || "Error procesando el pago", {
        position: "bottom-center",
        style: 'background: #333; color: #fff;',
      });
      isProcessing = false;
    }
    // Si no hay error, Stripe redirigirá automáticamente
  }

  function cancelarCheckout() {
    showPaymentForm = false;
    clientSecret = "";
    elements = null;
    const paymentElementContainer = document.getElementById('payment-element');
    if (paymentElementContainer) {
      paymentElementContainer.innerHTML = '';
    }
  }
</script>

<Toaster />

<div class="checkout-container">
  {#if !showPaymentForm}
    <!-- Botón para iniciar checkout -->
    <label class="terms-label">
      <input type="checkbox" bind:checked={acceptedTerms} disabled={isProcessing} />
      <p class="terminos">Acepto los <a href="/terminos" target="_blank">términos y condiciones</a></p>
    </label>

    <p class="nota">*Pueden aplicar cargos por servicio y procesamiento</p>

    <button
      class="btn-primary"
      on:click={iniciarCheckout}
      disabled={eventoPasado || isProcessing}
    >
      {#if isProcessing}
        Procesando...
      {:else if eventoPasado}
        El evento ha terminado
      {:else}
        Checkout - Mex${$totalPrice}
      {/if}
    </button>
  {:else}
    <!-- Formulario de pago con Stripe Elements -->
    <div class="payment-form">
      <div class="payment-header">
        <h4>Completa tu pago</h4>
      </div>

      <!-- Datos del comprador -->
      <div class="buyer-data">
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
      </div>

      <!-- Stripe Payment Element -->
      <div id="payment-element" class="payment-element-container">
        <!-- Stripe Elements se montará aquí -->
      </div>

      <div class="payment-actions">
        <button
          class="btn-cancel"
          on:click={cancelarCheckout}
          disabled={isProcessing}
        >
          Cancelar
        </button>

        <button
          class="btn-pay"
          on:click={handleSubmit}
          disabled={isProcessing}
        >
          {#if isProcessing}
            Procesando...
          {:else}
            Pagar Mex${$totalPrice}
          {/if}
        </button>
      </div>

      <p class="secure-payment">
        🔒 Pago seguro procesado por Stripe
      </p>
    </div>
  {/if}
</div>

<style>
  .checkout-container {
    width: 100%;
    margin-top: 15px;
  }

  .buyer-info,
  .payment-form {
    width: 100%;
  }
  
  .payment-form {
    width: 100%;
  }

  h4 {
    font-family: "JockeyOne";
    color: whitesmoke;
    font-size: 1.2em;
    margin-bottom: 15px;
  }

  .buyer-data {
    margin-bottom: 20px;
    padding: 15px;
    background-color: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    border: 1px solid #4b4b4b;
  }

  .input-group {
    margin-bottom: 15px;
  }

  .input-group:last-child {
    margin-bottom: 0;
    font-family: "JostRegular";
    color: whitesmoke;
    font-size: 0.9em;
    margin-bottom: 5px;
  }

  .input-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #4b4b4b;
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0.05);
    color: whitesmoke;
    font-family: "JostRegular";
    font-size: 1em;
    box-sizing: border-box;
  }

  .input-group input:focus {
    outline: none;
    border-color: #56fdb8;
    box-shadow: 0 0 0 1px #56fdb8;
  }

  .input-group input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input-group input::placeholder {
    color: #888;
  }

  .terms-label {
    display: flex;
    align-items: center;
    margin-top: 15px;
    margin-bottom: 10px;
  }

  .terms-label input[type="checkbox"] {
    margin-right: 10px;
    width: 18px;
    height: 18px;
  }

  .terminos {
    font-family: "JostRegular";
    color: whitesmoke;
    font-size: 0.9em;
    margin: 0;
  }

  .terminos a {
    color: #56fdb8;
    text-decoration: none;
  }

  .terminos a:hover {
    text-decoration: underline;
  }

  .nota {
    font-family: "JostRegular";
    color: #999;
    font-size: 0.75em;
    margin-bottom: 15px;
  }

  .btn-primary {
    background-color: #56fdb8;
    color: rgb(0, 0, 0);
    border: none;
    padding: 12px 20px;
    font-size: clamp(0.9em, 3vw, 1.1em);
    cursor: pointer;
    border-radius: 5px;
    font-family: "JostRegular";
    font-weight: 600;
    width: 100%;
    height: auto;
    transition: background-color 0.2s;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #45eca7;
  }

  .btn-primary:disabled {
    background-color: #3a3a3a;
    font-size: 0.9em;
    margin-top: 8px;
    line-height: 1.5;
  }

  .buyer-info-summary strong {
    color: whitesmoke;
  }

  .payment-element-container {
    margin-bottom: 20px;
    padding: 15px;
    background-color: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    border: 1px solid #4b4b4b;
  }

  .payment-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .btn-cancel {
    flex: 1;
    background-color: transparent;
    color: whitesmoke;
    border: 1px solid #4b4b4b;
    padding: 12px 20px;
    font-size: 1em;
    cursor: pointer;
    border-radius: 5px;
    font-family: "JostRegular";
    transition: all 0.2s;
  }

  .btn-cancel:hover:not(:disabled) {
    border-color: #fff;
    background-color: rgba(255, 255, 255, 0.05);
  }

  .btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-pay {
    flex: 2;
    background-color: #56fdb8;
    color: rgb(0, 0, 0);
    border: none;
    padding: 12px 20px;
    font-size: 1em;
    cursor: pointer;
    border-radius: 5px;
    font-family: "JostRegular";
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .btn-pay:hover:not(:disabled) {
    background-color: #45eca7;
  }

  .btn-pay:disabled {
    background-color: #3a3a3a;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .secure-payment {
    text-align: center;
    font-family: "JostRegular";
    color: #999;
    font-size: 0.8em;
    margin-top: 10px;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .payment-actions {
      flex-direction: column;
    }

    .btn-cancel,
    .btn-pay {
      width: 100%;
    }
  }
</style>
