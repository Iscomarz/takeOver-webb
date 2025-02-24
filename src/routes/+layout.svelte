<script>
  import Header from "./Header.svelte";
  import logo from "$lib/images/takeover-logo.png";
  import "../app.css";
</script>

<div class="app" style="--background-image: url({logo});">
  <Header />

  <main>
    <slot />
  </main>

  <footer>
    <p>Send a message to take.oover.show@gmail.com to contact me</p>
    <a href="/politica">Politicas de privacidad</a>
  </footer>
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
    background-image: var(--background-image);
    background-size: 260%;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.06; /* Ajusta este valor para cambiar la transparencia */
    z-index: -1;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    width: 100%;
    max-width: 64rem;
    margin: 0 auto;
    box-sizing: border-box;
    margin-top: 50px;
    position: relative;
    overflow: hidden;
  }

  footer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 12px;
	color: whitesmoke;
  }

  footer a {
    font-weight: bold;
  }

  @media (min-width: 480px) {
    footer {
      padding: 12px 0;
    }
  }

  @media screen and (max-width: 600px) {
    main {
      padding: 0rem;
    }
  }
</style>
