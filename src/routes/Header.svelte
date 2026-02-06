<script>
  import { page } from "$app/stores";
  import logo from "$lib/images/takeover-logo.png";
  import { goto } from "$app/navigation";
  import AnimatedText from "./components/AnimatedText.svelte";
  import { onMount } from "svelte";
  import supabase from "$lib/supabase";

  let showHeader = false;
  let showMenuIcon = false;
  let titleHeader = "titulo";
  let backBlack = false;
  let menuOpen = false;
  let scrolled = false;
  let eventoActivoId = null;

  $: currentPath = $page.url.pathname;
  $: showHeader = currentPath !== "/";
  $: showMenuIcon = currentPath !== "/";
  $: backBlack = currentPath !== "/";
  $: titleHeader = currentPath;

  onMount(async () => {
    const handleScroll = () => {
      scrolled = window.scrollY > 50;
    };

    window.addEventListener("scroll", handleScroll);

    // Obtener el evento activo
    const { data, error } = await supabase
      .from("mEvento")
      .select("idevento")
      .eq("activo", 1)
      .limit(1)
      .single();

    if (!error && data) {
      eventoActivoId = data.idevento;
    }

    return () => window.removeEventListener("scroll", handleScroll);
  });

  function handleGetTickets() {
    if (eventoActivoId) {
      goto(`/eventos/${eventoActivoId}`);
    } else {
      goto("/eventos");
    }
  }
</script>

<header class:scrolled style={backBlack && !scrolled ? "background-color: black;" : ""}>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="menu-icon" on:click={() => (menuOpen = !menuOpen)}>
    <div class="menu-button {menuOpen ? 'open' : ''}">
      <div class="line top"></div>
      <div class="line bottom"></div>
    </div>
  </div>
  <div class="corner">
    <a href="/">
      <img src={logo} alt="Take Over Logo" />
      <!-- <p style="color: white;">_TAKE OVER</p> -->
    </a>
  </div>

  <!-- Menú lateral -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="side-menu {menuOpen ? 'open' : ''}"
    on:click={() => (menuOpen = false)}
  >
    <div class="side-menu-content" on:click|stopPropagation>
      <ul>
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li
          on:click={() => {
            menuOpen = false;
            goto("/eventos");
          }}
        >
          _EVENTS
        </li>
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li
          on:click={() => {
            menuOpen = false;
            goto("/about");
          }}
        >
          _ABOUT TAKE OVER
        </li>
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
         <li
          on:click={() => {
            menuOpen = false;
            goto("/crew");
          }}
        >
          _CREW
        </li>
       <!-- <li
          on:click={() => {
            menuOpen = false;
            goto("/merch");
          }}
        >
          _MERCH
        </li> -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li
          on:click={() => {
            menuOpen = false;
            goto("/contact");
          }}
        >
          _CONTACT
        </li>
      </ul>
    </div>
  </div>

  <AnimatedText />

  {#if showHeader}
    <nav>
      <ul>
        <li
          aria-current={$page.url.pathname === "/eventos" ? "page" : undefined}
        >
          <a href="/eventos">EVENTS</a>
        </li>
        <li aria-current={$page.url.pathname === "/about" ? "page" : undefined}>
          <a href="/about">ABOUT TAKE OVER</a>
        </li>
         <li aria-current={$page.url.pathname === "/crew" ? "page" : undefined}>
          <a href="/crew">CREW</a>
        </li>
      <!--  <li aria-current={$page.url.pathname === "/merch" ? "page" : undefined}>
          <a href="/merch">MERCH</a>
        </li> -->
        <li
          aria-current={$page.url.pathname === "/contact" ? "page" : undefined}
        >
          <a href="/contact">CONTACT</a>
        </li>
      </ul>
      
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="cta-button" on:click={handleGetTickets}>
        <span class="cta-text">GET TICKETS</span>
      </div>
    </nav>
  {/if}
</header>

<style>
  * {
    box-sizing: border-box;
  }
  header {
    position: fixed;
    z-index: 1000;
    padding-left: 20px;
    padding-right: 20px;
    height: 4.5em;
    align-items: center;
    display: flex;
    justify-content: flex-start;
    width: 100%;
    background-color: rgba(0, 0, 0, 0);
    transition: background-color 0.3s ease, height 0.3s ease;
  }

  header.scrolled {
    background-color: rgba(0, 0, 0, 0) !important;
    backdrop-filter: blur(10px);
  }

  .corner {
    width: auto;
    padding: 10px;
    height: 3.5em;
    margin-right: 20px;
  }

  .corner a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .corner img {
    width: 3.5em;
    height: 3.5em;
    object-fit: contain;
  }

  nav {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 30px;
    --background: rgba(255, 255, 255, 0);
    width: 100%;
  }

  ul {
    position: relative;
    padding: 0;
    margin: 0;
    height: 3.5em;
    display: flex;
    gap: 20px;
    align-items: center;
    list-style: none;
    background: var(--background);
    background-size: contain;
    border-radius: 0 0 40px 40px;
  }

  /* Botón CTA */
  .cta-button {
    position: relative;
    padding: 10px 24px;
    background: rgba(255, 80, 40, 0.08);
    border: 2px solid #ff5722;
    border-radius: 25px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
  }

  .cta-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 87, 34, 0.2) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: width 0.5s ease, height 0.5s ease;
  }

  .cta-button:hover::before {
    width: 200%;
    height: 200%;
  }

  .cta-button:hover {
    background: rgba(255, 80, 40, 0.15);
    box-shadow: 0 0 20px rgba(255, 87, 34, 0.4);
    border-color: #ff6b3d;
  }

  .cta-text {
    position: relative;
    color: #e0e0e0;
    font-weight: 600;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    z-index: 1;
    transition: color 0.3s ease;
  }

  .cta-button:hover .cta-text {
    color: #ffffff;
  }

  li {
    position: relative;
    height: 100%;
  }

  li[aria-current="page"]::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3%;
    width: 100%;
    background: var(--color-theme-1);
  }
  li::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    width: 0;
    background-color: var(--color-theme-1);
    transition: width 0.3s ease;
  }

  li[aria-current="page"]::after,
  li:hover::after {
    width: 100%;
  }

  nav a {
    display: flex;
    height: 100%;
    align-items: center;
    padding: 0 0.5rem;
    color: rgb(255, 255, 255);
    font-weight: 500;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
    transition: color 0.2s linear;
  }

  nav a:hover {
    color: var(--color-theme-1);
  }

  /* Ocultar el icono de menú por defecto */
  .menu-icon {
    display: none !important;
  }
  .corner{
    display: flex;
  }

  .menu-button {
    width: 32px;
    height: 32px;
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .line {
    position: absolute;
    width: 100%;
    height: 3px;
    background-color: white;
    border-radius: 2px;
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
  }

  .line.top {
    top: 10px;
  }

  .line.bottom {
    bottom: 10px;
  }

  .menu-button.open .top {
    transform: rotate(45deg) translateY(6px);
  }

  .menu-button.open .bottom {
    transform: rotate(-45deg) translateY(-6px);
  }

  .side-menu {
    position: fixed;
    top: 0;
    left: -100%;
    width: 100%;
    max-width: 300px;
    height: 100vh;
    background-color: black;
    color: white;
    z-index: 2000;
    transition: left 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: start;
    padding: 60px 20px 20px;
    margin-top: 50px;
  }

  .side-menu.open {
    left: 0;
  }

  .side-menu-content ul {
    list-style: none;
    padding: 0;
    margin: 0;
    flex-direction: column;
    gap: 5px;
    align-items: start;
  }

  .side-menu-content li {
    margin: 20px 0;
    cursor: pointer;
  }

  .side-menu-content li {
    color: white;
    font-size: 1rem;
    text-decoration: none;
    text-transform: uppercase;
    font-weight: 500;
  }

  .side-menu-content li:hover {
    color: var(
      --color-theme-1
    ); /* asegúrate de tener esta variable en tu CSS */
  }

  /* Mostrar el icono de menú y ocultar el logo de Instagram en pantallas pequeñas */
  @media screen and (max-width: 600px) {
    header {
      background-color: black;
      height: 60px;
    }
    .menu-icon {
      display: flex !important;
    }

    .corner{
      display: none !important;
    }
    nav {
      display: none;
    }
    .corner {
      position: static;
      left: auto;
      transform: none;
      margin: 0;
    }
    .corner img {
      width: 100%;
      height: auto;
    }
    
    .cta-button {
      display: none;
    }
  }
</style>
