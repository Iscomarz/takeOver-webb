<script>
  import { onNavigate } from '$app/navigation';
  import { navigating, page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import AnimatedBackground from "./components/AnimatedBackground.svelte";
  import MouseTrail from "./components/MouseTrail.svelte";
  import MiniPlayer from "$lib/components/MiniPlayer.svelte";
  import logoTakeOver from "$lib/images/takeover-logo.png";
  import "../app.css";

  export let data;
  $: sounds = data?.sounds ?? [];

  // Usar la View Transitions API nativa del navegador
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    return new Promise(resolve => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<div class="app">
  <AnimatedBackground />
  <MouseTrail />
  
  <!-- Loading indicator durante la navegación -->
  {#if $navigating}
    <div class="navigation-loading" transition:fade={{ duration: 200 }}>
      <div class="loading-content">
        <img src={logoTakeOver} alt="Loading" class="loading-logo" />
        <div class="loading-bar">
          <div class="loading-bar-fill"></div>
        </div>
        <p class="loading-text">LOADING...</p>
      </div>
    </div>
  {/if}

  <Header />

  <main>
    <div class="page-content">
      <slot />
    </div>
  </main>

  <Footer />
  <MiniPlayer {sounds} />
</div>

<style>
  .app {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .app::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: 260%;
    background-position: center;
    background-repeat: no-repeat;
    /* opacity: 0.06; Ajusta este valor para cambiar la transparencia */
    z-index: -1;
    /* Removido background-color para permitir que el gradiente del body sea visible */
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-bottom: 1rem;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  .page-content {
    width: 100%;
    view-transition-name: main-content;
  }

  /* Configuración de View Transitions - transición MUY lenta y suave */
  :global(::view-transition-old(main-content)) {
    animation: fade-out 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  :global(::view-transition-new(main-content)) {
    animation: fade-in 2500ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Loading indicator durante navegación */
  .navigation-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .loading-logo {
    width: 150px;
    height: auto;
    opacity: 0.9;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.9;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
  }

  .loading-bar {
    width: 200px;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .loading-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-theme-1), white);
    animation: loading 1.5s ease-in-out infinite;
    transform-origin: left;
  }

  @keyframes loading {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .loading-text {
    font-family: "JostRegular", sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.3em;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }

  main::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30%;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%, #000000 100%);
    pointer-events: none;
    z-index: -10;
  }


  @media screen and (max-width: 600px) {
    main {
      padding: 0rem;
    }
  }
</style>
