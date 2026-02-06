<script>
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import AnimatedBackground from "./components/AnimatedBackground.svelte";
  import "../app.css";
</script>

<div class="app">
  <AnimatedBackground />
  <Header />

  <main>
    <slot />
  </main>

  <Footer />
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
