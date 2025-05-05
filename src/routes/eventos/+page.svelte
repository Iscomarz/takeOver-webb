<script>
  import fondoEvents from "$lib/images/covers/fondo-events.jpg";
  import BotonComunidad from "../components/botonComunidad.svelte";
  import CardEventoPasado from "../components/cardEventoPasado.svelte";

  export let data;
  let eventosPasados = data.eventosPasados;
  let eventosActivos = data.eventosActivos;
</script>

<div class="banner">
  <img src={fondoEvents} alt="fondo-events-takeover" />
  <h1>PRÓXIMOS EVENTOS</h1>
</div>

<div class="eventos-disponibles">
  <h2>EVENTOS DISPONIBLES</h2>
  <div class="eventos-container">
    {#if eventosActivos.length === 0}
      <section class="no-eventos">
        <p class="no-eventos">
          Estamos trabajando para traerte los mejores eventos.
        </p>
        <BotonComunidad />
      </section>
    {:else}
      {#each eventosActivos as evento}
        <div class="evento-card">
          <div>
            <img class="image-eve" src={evento.pathImage} alt="" />
          </div>
          <div>
            <h3>{evento.nombreEvento}</h3>
            <p>{evento.venue}</p>
            <p>{evento.fechaInicio}</p>
          </div>
        </div>
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

<style>
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
    left: 50%;
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
  }
</style>
