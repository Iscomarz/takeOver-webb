<script>
  import Title from "../components/Title.svelte";
  import Date from "../components/Date.svelte";
  import Location from "../components/Location.svelte";
  import AboutEvent from "../components/AboutEvent.svelte";
  import Tickets from "../components/Tickets.svelte";
  import supabase from "../../lib/supabase";
  import { onMount, tick } from "svelte";
  import { invalidateAll, goto  } from "$app/navigation";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import logo from "$lib/images/takeover-logo.png";
  import { fade } from "svelte/transition";

  let scale = tweened(1, {
    duration: 400,
    easing: cubicOut,
  });
  let loading = true;

  let mEvento = {};
  let fases = [];
  let productosStripe = [];
  let urlImagenPortada;

  async function loadData() {
    let { data: evento, error } = await supabase
      .from("mEvento")
      .select("*")
      .eq("activo", 1);
    if (evento) {
      mEvento = evento[0];
    }

    if (error) {
      console.log("Error al traer el evento activo");
    } else {
      //Traer portada del evento
      const { data } = supabase.storage
        .from("imageEventos")
        .getPublicUrl(mEvento.pathImage);

      urlImagenPortada = data.publicUrl;
      //Obtener las faces o tickets del evento selecionado
      let { data: cFases, errorF } = await supabase
        .from("cFaseEvento")
        .select("*")
        .eq("idEvento", mEvento.idevento);

      if (cFases.length > 0) {
        fases = cFases;
        // Llama a la función para obtener los productos
        //productosStripe = await getProducts();
        //enlazar identificador de precio con fase (Despues hay que hacerlo directamente al crear la fase en supabase y el producto en stripe)
        //for(const producto of productosStripe){
        //  for(const fase of fases){
        //    if(producto.name == fase.nombreFace){
        //      fase.idPrecioStripe = producto.default_price;
        //    }
        //  }
        //}
      } else if (errorF) {
        console.log("Error al traer las fases");
      }
    }
    await tick();
    loading = false;
  }

  onMount(async () => {
    invalidateAll();
    setTimeout(() => {
      goto(window.location.pathname, { replaceState: true });
    }, 500);
    //Obtener evento activo
    await loadData();
    let interval = setInterval(() => {
      if (loading) {
        scale.set(1.1);
        setTimeout(() => {
          scale.set(1);
        }, 400);
      } else {
        clearInterval(interval);
      }
    }, 1500);
  });

  async function getProducts() {
    try {
      // Llamada al endpoint
      const response = await fetch("/api/get-products-stripe", {
        method: "GET",
      });

      // Verifica si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.statusText}`);
      }

      // Parsear los datos de los productos
      const products = await response.json();

      return products;
    } catch (error) {
      console.error("Error en la llamada al endpoint:", error);
      return null;
    }
  }
</script>

<svelte:head>
  <title>Tickets</title>
  <meta name="description" content="About this app" />
</svelte:head>

{#if loading}
  <div class="loading-container" transition:fade={{ duration: 200 }}>
    <img src={logo} style="transform: scale({$scale})" alt="loading" />
  </div>
{:else}
  {#if urlImagenPortada}
    <div class="img-event">
      <span>
        <img src={urlImagenPortada} alt="portada" />
      </span>
    </div>
  {/if}

  <section class="info-event-short">
    <Title titulo={mEvento.nombreEvento} fecha="Domingo, 16 de Marzo 2025" />
  </section>

  <section class="info-event">
    <div class="components">
      <Date fecha="Dom, 16 Mar 2025 17:00 - 2:00" />
      <Location
        nombreLugar={mEvento.venue}
        direccion={mEvento.direccion}
        linkMaps={mEvento.direccionURL}
      />
      <AboutEvent descripcion={mEvento.descripcion} />
      {#if fases.length > 0}
        <Tickets ticketDataEve={fases} />
      {/if}
    </div>
  </section>
{/if}

<style>
  .loading-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .loading-container img {
    width: 150px;
    transition: transform 0.75s ease-in-out;
  }
  .img-event {
    padding: 20px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  span {
    width: 70%;
  }
  img {
    border-radius: 40px;
  }
  .info-event-short {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .info-event {
    width: 100%;
    display: flex;
    justify-content: start;
    align-items: center;
    flex-direction: column;
    gap: 20px;
  }
  .components {
    width: 85%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
</style>
