<script>
  import { onMount } from "svelte";
  import { loadStripe } from "@stripe/stripe-js";
  import toast, { Toaster } from 'svelte-french-toast';

  export let totalPrice = 0;
  export let cantidad;
  export let idPrecioStripe;
  export let eventoPasado = false; // Cambia a true si es un evento pasado

  let stripe;
  let acceptedTerms = false;

  onMount(async () => {
    //live
    stripe = await loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_KEY_LIVE);
    //test
    //stripe = await loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_KEY);
  });

  async function handleCheckout() {
    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones para continuar", {
        position: "bottom-center",
        style: 'background: #333; color: #fff;',
      });
      return;
    }
    // Se asegura de que totalPrice esté correctamente suscrito
    const finalPrice = $totalPrice;
    console.log('boton checkout',idPrecioStripe, cantidad);
    if (finalPrice !== 0 || idPrecioStripe != null) {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ price: idPrecioStripe, quantity: cantidad }],
        }),
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      const { id } = data;

      // Verifica si el id existe antes de redirigir
      if (id) {
        const { error } = await stripe.redirectToCheckout({ sessionId: id });

        if (error) {
          console.error("Error redirigiendo a Stripe Checkout:", error);
        }
      } else {
        console.error("Error: no se recibió sessionId.");
      }
    } else {
      toast.error("Selecciona un ticket para continuar la compra", {
        position: "bottom-center",
        style: 'background: #333; color: #fff;',
      });
      console.log("Sin tickets");
    }
  }
</script>

<Toaster />

<label>
  <input type="checkbox" bind:checked={acceptedTerms} />
  <p class="terminos">Acepto los <a href="/terminos" target="_blank">términos y condiciones</a></p>
</label>

<button
  on:click={handleCheckout}
  disabled={eventoPasado}
  style:cursor={eventoPasado ? 'not-allowed' : 'pointer'}
>
  {eventoPasado ? 'El evento ha terminado' : `Checkout`}
  {#if !eventoPasado}
    <p>Mex{$totalPrice}</p>
  {/if}
</button>

<style>
  button {
    background-color: #56fdb8;
    color: rgb(0, 0, 0);
    border: none;
    padding: 10px 20px;
    font-size: clamp(0.9em, 3vw, 1.2em);
    cursor: pointer;
    border-radius: 5px;
    font-family: "JostRegular";
    width: 100%;
    display: flex;
    justify-content: space-around;
    margin-top: 15px;
    height: 40px;
    align-items: center;
  }

  button:hover {
    background-color: #3a3a3a;
  }

  label {
    display: flex;
    align-items: center;
    margin-top: 15px;
  }

  input[type="checkbox"] {
    margin-right: 10px;
  }

  .terminos{
    font-family: "JostRegular";
    color: whitesmoke;
  }

  a {
    color: #56fdb8;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
