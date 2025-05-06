<script>
  import { page } from "$app/stores";
  import logo from "$lib/images/takeover-logo.png";

  let showHeader = false;
  let showMenuIcon = false;
  let titleHeader = "titulo";
  let backBlack = false;

  let menuOpen = false;

  $: currentPath = $page.url.pathname;
  $: showHeader = currentPath !== "/";
  $: showMenuIcon = currentPath !== "/";
  $: backBlack = currentPath !== "/";
  $: titleHeader = currentPath;
</script>

<header style={backBlack ? "background-color: black;" : ""}>
  <div
    class="side-menu {menuOpen ? 'open' : ''}"
    on:click={() => (menuOpen = false)}
  >
    <div class="side-menu-content" on:click|stopPropagation>
      <ul>
        <li on:click={() => menuOpen = false}><a href="/eventos">_EVENTS</a></li>
        <li on:click={() => menuOpen = false}><a href="/about">_ABOUT TAKE OVER</a></li>
        <li on:click={() => menuOpen = false}><a href="/crew">_CREW</a></li>
        <li on:click={() => menuOpen = false}><a href="/merch">_MERCH</a></li>
        <li on:click={() => menuOpen = false}><a href="/contact">_CONTACT</a></li>
      </ul>
    </div>
  </div>

  <div class="menu-icon" on:click={() => (menuOpen = !menuOpen)}>
    <div class="menu-button {menuOpen ? 'open' : ''}">
      <div class="line top"></div>
      <div class="line bottom"></div>
    </div>
  </div>

  <div class="corner">
    <a href="/">
      <img src={logo} alt="TakeOver" />
    </a>
  </div>

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
        <li aria-current={$page.url.pathname === "/merch" ? "page" : undefined}>
          <a href="/merch">MERCH</a>
        </li>
        <li
          aria-current={$page.url.pathname === "/contact" ? "page" : undefined}
        >
          <a href="/contact">CONTACT</a>
        </li>
      </ul>
    </nav>
  {/if}
</header>

<style>
  * {
    box-sizing: border-box;
  }
  header {
    display: flex;
    justify-content: space-between;
    position: fixed;
    width: 100%;
    z-index: 1000;
    padding-left: 40px;
    padding-right: 40px;
    height: 6em;
    align-items: center;
  }

  .corner {
    width: 4em;
    height: 4em;
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
    width: 4em;
    height: 4em;
    object-fit: contain;
  }

  nav {
    display: flex;
    justify-content: end;
    --background: rgba(255, 255, 255, 0);
    width: 100%;
  }

  ul {
    position: relative;
    padding: 0;
    margin: 0;
    height: 4em;
    display: flex;
    gap: 20px;
    align-items: center;
    list-style: none;
    background: var(--background);
    background-size: contain;
    border-radius: 0 0 40px 40px;
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
  }

  .side-menu-content a {
    color: white;
    font-size: 1rem;
    text-decoration: none;
    text-transform: uppercase;
    font-weight: 500;
  }

  .side-menu-content a:hover {
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

    nav {
      display: none;
    }

    .corner {
      margin-left: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }

    .corner img {
      width: 3em;
      height: 3em;
    }
  }
</style>
