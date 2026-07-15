<script>
  import { goto } from "$app/navigation";
  import toast, { Toaster } from 'svelte-french-toast';

  export let totalPrice = 0; // Derived store
  export let cantidad = 0;
  export let eventoPasado = false;
  export let descuentoAplicado = false;
  export let codigoDescuentoUsado = null;
  export let nombreEvento = "";
  export let nombreFase = "";
  export let tickets = []; 
  export let mEvento = null;
  export let urlImagenPortada = null;

  function irAlCheckout() {
    if (cantidad === 0) {
      toast.error("Selecciona un ticket para continuar la compra", {
        position: "bottom-center",
        style: 'background: #333; color: #fff;',
      });
      return;
    }

    // Guardar los datos en sessionStorage para recuperarlos en la pantalla de checkout
    const checkoutData = {
      totalPrice: $totalPrice, // Valor desenrollado de la store derivada
      cantidad,
      descuentoAplicado,
      codigoDescuentoUsado,
      nombreEvento,
      nombreFase,
      tickets: tickets.filter(t => t.cantidad > 0).map(t => ({
        idFase: t.idFase,
        idEvento: t.idEvento,
        nombreFace: t.nombreFace,
        precio: t.precio,
        cantidad: t.cantidad,
        idPrecioStripe: t.idPrecioStripe
      })),
      mEvento,
      urlImagenPortada
    };

    sessionStorage.setItem("takeover_checkout_data", JSON.stringify(checkoutData));
    
    // Navegar a la página dedicada de checkout
    goto("/checkout");
  }
</script>

<Toaster />

<div class="checkout-container">
  {#if $totalPrice > 0}
    <p class="nota">*Pueden aplicar cargos por servicio y procesamiento</p>
  {/if}

  <button
    class="btn-primary"
    on:click={irAlCheckout}
    disabled={eventoPasado || cantidad === 0}
  >
    {#if eventoPasado}
      El evento ha terminado
    {:else if cantidad === 0}
      Selecciona un ticket
    {:else if $totalPrice === 0}
      Registrarse Gratis
    {:else}
      Comprar Accesos - Mex${$totalPrice}
    {/if}
  </button>
</div>

<style>
  .checkout-container {
    width: 100%;
    margin-top: 15px;
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
    color: #666;
    cursor: not-allowed;
  }
</style>
