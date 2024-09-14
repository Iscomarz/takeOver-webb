<script>
  import { onMount } from "svelte";
  import { loadStripe } from "@stripe/stripe-js";
  import toast, { Toaster } from 'svelte-french-toast';

  export let totalPrice = 0;
  export let cantidadGeneral;
  //export let cantidadVIP;

  const ticketGeneral = import.meta.env.VITE_PRICE_TICKET_G;
  const ticketVIP = import.meta.env.VITE_PRICE_TICKET_V;

  let stripe;
  onMount(async () => {
    stripe = await loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_KEY);
  });

  async function handleCheckout() {
    if ($totalPrice !== 0) {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ price: ticketGeneral, quantity: cantidadGeneral }],
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
    }else{
        toast.error("Selecciona un ticket para continuar la compra",{
            position:"bottom-center",
            style: 'background: #333; color: #fff;'
        });
        console.log("Sin tickets");
    }
  }
</script>
<Toaster />

<button on:click={handleCheckout}
  >Checkout <p>Mex${$totalPrice}</p></button
>

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
    width: 250px;
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
  }

  button:hover {
    background-color: #3a3a3a;
  }
</style>
