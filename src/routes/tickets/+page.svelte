<script>
  import Title from "../components/Title.svelte";
  import DateComponent from "../components/Date.svelte";
  import Location from "../components/Location.svelte";
  import AboutEvent from "../components/AboutEvent.svelte";
  import Tickets from "../components/Tickets.svelte";
  import { onMount, tick } from "svelte";
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import BotonComunidad from "../components/botonComunidad.svelte";
  import { eventoStore } from "$lib/stores/eventoStore";
  import { getFasesByEvento, getImagenPublicUrl } from "$lib/services/dataService";

  let loading = true;
  let eventoActivo = true;

  let mEvento = {};
  let fases = [];
  let urlImagenPortada;

  // Reactividad con el store
  $: if (!$eventoStore.loading) {
      if ($eventoStore.error || !$eventoStore.evento) {
          eventoActivo = false;
          loading = false;
          if ($eventoStore.error) {
              console.log("Error al traer el evento activo", $eventoStore.error);
          } else {
              console.log("No hay eventos activos en este momento");
          }
      } else {
          mEvento = $eventoStore.evento;
          loadEventDetails();
      }
  }

  async function loadEventDetails() {
      eventoActivo = true;
      urlImagenPortada = getImagenPublicUrl(mEvento.pathImage);

      const { data: cFases, error: errorF } = await getFasesByEvento(mEvento.idevento);

      if (cFases && cFases.length > 0) {
        fases = cFases;
      } else if (errorF) {
        console.log("Error al traer las fases", errorF);
      }

      await tick();
      loading = false;
  }

  onMount(() => {
    eventoStore.loadEvento();
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
  <title>Next Event</title>
  <meta
    name="description"
    content="Compra tus accesos para el proximo Take Over"
  />
</svelte:head>

{#if loading}
  <div class="loading-container" transition:fade={{ duration: 200 }}>
    <p class="loading-message">Cargando tickets...</p>
  </div>
{:else if !eventoActivo}
    <div class="seccion-no-evento">
      <h1>Por el momento no tenemos eventos disponibles</h1>
      <BotonComunidad />
      <button on:click={() => goto("/")}>Volver al inicio</button>
    </div>
{:else}
  {#if urlImagenPortada}
    <div class="img-event">
      <span>
        <div class="background-blur" style="background-image: url({urlImagenPortada});"></div>
        <img src={urlImagenPortada} alt="portada" />
      </span>
    </div>
  {/if}

  <section class="info-event-short">
    <Title titulo={mEvento.nombreEvento} 
    descripcion={mEvento.descripcionCorta}
    fecha="Domingo, 16 de Marzo 2025" />
  </section>

  <section class="info-event">
    <div class="components">
      <DateComponent fecha="Dom, 16 Mar 2025 17:00 - 2:00" />
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

  .loading-message {
    font-family: "JostRegular", sans-serif;
    font-size: 1.2rem;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.7);
    animation: pulse-text 2s ease-in-out infinite;
  }

  @keyframes pulse-text {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }
  .img-event {
    margin-top: 20px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  span {
    position: relative;
    width: 70%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .background-blur {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    filter: blur(10px); /* Ajusta este valor para cambiar el nivel de desenfoque */
    z-index: -1;
  }
  img {
    border-radius: 40px;
    width: 70%;
    z-index: 1;
  }
  .info-event-short {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
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
    display: flex;
    flex-direction: column;
    gap: 30px;
    margin-top: 20px;
  }

  .seccion-no-evento{
    color:whitesmoke
  }
  @media screen and (max-width: 600px) {
    img {
      border-radius: 0px;
      width: 70%;
    }
    span{
      width: 100%;
    }
    .img-event{
      margin-top: 40px;
    }
  }
</style>
