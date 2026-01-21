<script>
  import fondoEvents from "$lib/images/covers/fondo-events.jpg";
  import BotonComunidad from "../components/botonComunidad.svelte";
  import CardEventoPasado from "../components/cardEventoPasado.svelte";
  import CardEventoActivo from "../components/cardEventoActivo.svelte";
  import logo from "$lib/images/takeover-logo.png";
  import { onMount } from "svelte";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { fade } from "svelte/transition";

  export let data;
  let loading = true;
  let eventosPasados = [];
  let eventosActivos = [];

  let scale = tweened(1, {
    duration: 400,
    easing: cubicOut,
  });

  onMount(async () => {
    //Obtener evento activo
    await loadData();
    // Animación de pulso
    const interval = setInterval(() => {
      if (loading) {
        scale.set(1.1);
        setTimeout(() => scale.set(1), 400);
      } else {
        clearInterval(interval);
      }
    }, 1500);
  });

  async function loadData() {
    // Simulación de carga de datos
    eventosPasados = data?.eventosPasados || [];
    eventosActivos = data?.eventosActivos || [];

    await waitForImagesToLoad();

    setTimeout(() => {
      loading = false;
    }, 1000);
  }

  function waitForImagesToLoad() {
    return new Promise((resolve) => {
      const images = Array.from(document.images);
      const total = images.length;
      let loaded = 0;

      if (total === 0) {
        resolve();
      }

      images.forEach((img) => {
        if (img.complete) {
          loaded++;
          if (loaded === total) resolve();
        } else {
          img.addEventListener("load", () => {
            loaded++;
            if (loaded === total) resolve();
          });
          img.addEventListener("error", () => {
            loaded++;
            if (loaded === total) resolve();
          });
        }
      });
    });
  }
</script>

<svelte:head>
  <title>Eventos Take Over</title>
  <meta name="description" content="Eventos Take Over" />
</svelte:head>

{#if loading}
  <div class="loading-container" transition:fade={{ duration: 200 }}>
    <img src={logo} style="transform: scale({$scale})" alt="loading" />
  </div>
{:else}
  <div class="banner">
    <img src={fondoEvents} alt="fondo-events-takeover" />
    <h1>_EVENTS</h1>
  </div>

  <div class="eventos-disponibles">
    <h2>EVENTOS DISPONIBLES</h2>
    <div class="eventos-container">
      {#if eventosActivos.length === 0}
        <section class="no-eventos">
          <p>Estamos trabajando para traerte los mejores eventos.</p>
          <BotonComunidad />
        </section>
      {:else}
        {#each eventosActivos as evento}
          <CardEventoActivo
            pathImage={evento.pathImage}
            titulo={evento.nombreEvento}
            fecha={evento.fechaInicio}
            diaYHora={evento.diaYHora}
            lugar={evento.venue}
            idEvento={evento.idevento}
          />
        {/each}
      {/if}
    </div>
  </div>
  <hr class="divider" />
  <div class="eventos-pasados">
    <h2>EVENTOS PASADOS</h2>
    <div class="eventos-container">
      {#each eventosPasados as evento}
        <CardEventoPasado
          pathImage={evento.pathImage}
          titulo={evento.nombreEvento}
          fecha={evento.fechaInicio}
          diaYHora={evento.diaYHora}
          lugar={evento.venue}
          idEvento={evento.idevento}
        />
      {/each}
    </div>
  </div>
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
  .banner {
    position: relative;
    height: 300px;
    width: 100%;
    overflow: hidden;
    z-index: 0;
  }

  .banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;

    /* Difuminado real con máscara */
    mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
  }

  .banner h1 {
    position: absolute;
    top: 50%;
    left: 40%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 3rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0;
    font-family: "JockeyOne", sans-serif;
    text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
    z-index: 2;
  }

  .divider {
    border: none;
    height: 1px;
    background-color: #717171; /* gris claro */
    margin: 2rem auto;
    width: 80%;
  }

  .eventos-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    width: 100%;
    padding: 0.8rem;
  }

  h2 {
    text-align: center;
    font-family: "JockeyOne", sans-serif;
    color: white;
    margin-bottom: 1rem;
  }

  .no-eventos {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: white;
    gap: 1rem;
    text-align: center;
  }
</style>
