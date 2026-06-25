<script>
  import fondoEvents from "$lib/images/covers/fondo-events.jpg";
  import BotonComunidad from "../components/botonComunidad.svelte";
  import CardEventoPasado from "../components/cardEventoPasado.svelte";
  import CardEventoActivo from "../components/cardEventoActivo.svelte";

  export let data;
  $: ({ eventosPasados = [], eventosActivos = [] } = data);
  
  // Variables para paginación y búsqueda
  let searchQuery = "";
  let currentPage = 1;
  const itemsPerPage = 8; // 4x2 grid

  // Eventos pasados filtrados por búsqueda
  $: eventosPasadosFiltrados = eventosPasados.filter(evento =>
    evento.nombreEvento.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcular total de páginas
  $: totalPages = Math.ceil(eventosPasadosFiltrados.length / itemsPerPage);

  // Eventos pasados paginados
  $: eventosPasadosPaginados = eventosPasadosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reiniciar a página 1 cuando cambia la búsqueda
  $: if (searchQuery) {
    currentPage = 1;
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      // Scroll suave a la sección de eventos pasados
      document.querySelector('.eventos-pasados')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

</script>

<svelte:head>
  <title>Eventos Take Over</title>
  <meta name="description" content="Eventos Take Over" />
</svelte:head>

<div class="banner">
    <h1>_EVENTS</h1>
  </div>

  <div class="eventos-disponibles">
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
    
    <!-- Buscador -->
    <div class="search-container">
      <input 
        type="text" 
        placeholder="Buscar..." 
        bind:value={searchQuery}
        class="search-input"
      />
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    </div>

    {#if eventosPasadosFiltrados.length === 0}
      <p class="no-results">No se encontraron eventos</p>
    {:else}
      <div class="eventos-container-pasados">
        {#each eventosPasadosPaginados as evento}
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

      <!-- Paginación -->
      {#if totalPages > 1}
        <div class="pagination">
          <button 
            class="page-btn" 
            on:click={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>

          {#each Array(totalPages) as _, index}
            <button
              class="page-btn"
              class:active={currentPage === index + 1}
              on:click={() => goToPage(index + 1)}
            >
              {index + 1}
            </button>
          {/each}

          <button 
            class="page-btn" 
            on:click={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      {/if}
    {/if}
  </div>

<style>
  .banner {
    position: relative;
    height: 100px;
    width: 100%;
    overflow: hidden;
    z-index: 0;
    margin-top: 80px;
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

  /* Grid 4x2 para eventos pasados (más pequeños) */
  .eventos-container-pasados {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  /* Buscador */
  .search-container {
    position: relative;
    max-width: 500px;
    margin: 0 auto 2rem;
    padding: 0 1rem;
  }

  .search-input {
    width: 100%;
    padding: 12px 45px 12px 20px;
    border: 2px solid #444;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-size: 1rem;
    transition: all 0.3s ease;
    outline: none;
  }

  .search-input::placeholder {
    color: #888;
  }

  .search-input:focus {
    border-color: #888;
    background: rgba(255, 255, 255, 0.08);
  }

  .search-icon {
    position: absolute;
    right: 30px;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
    pointer-events: none;
  }

  /* Paginación */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin: 2rem 0;
    padding: 1rem;
  }

  .page-btn {
    padding: 8px 14px;
    border: 1px solid #444;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
    min-width: 40px;
  }

  .page-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    border-color: #888;
  }

  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-btn.active {
    background: white;
    color: black;
    border-color: white;
    font-weight: bold;
  }

  .no-results {
    text-align: center;
    color: #888;
    padding: 2rem;
    font-size: 1.1rem;
  }

  /* Responsive para eventos pasados */
  @media screen and (max-width: 1200px) {
    .eventos-container-pasados {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media screen and (max-width: 900px) {
    .eventos-container-pasados {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media screen and (max-width: 600px) {
    .eventos-container-pasados {
      grid-template-columns: 1fr;
      width: 95%;
    }
    
    .search-container {
      padding: 0 1.5rem;
    }
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
