<script>
  import { page } from "$app/stores";
  import logo from "$lib/images/takeover-logo.png";

  let showHeader = false;
  let showMenuIcon = false;
  let titleHeader = "titulo";
  let backBlack = false;

  $: currentPath = $page.url.pathname;
  $: showHeader = currentPath !== "/";
  $: showMenuIcon = currentPath !== "/";
  $: backBlack = currentPath !== "/";
  $: titleHeader = currentPath;
</script>

<header style={backBlack}>
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
  <div class="title-header">
    <h3>
      {titleHeader.slice(1).toUpperCase() == "TICKETS"
        ? "Next Event"
        : titleHeader.slice(1).toUpperCase()}
    </h3>
  </div>
</header>

<style>
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

  .menu-icon img {
    width: 2.2em;
    height: 2.2em;
    object-fit: contain;
  }

  .title-header {
    display: none !important;
  }

  /* Mostrar el icono de menú y ocultar el logo de Instagram en pantallas pequeñas */
  @media screen and (max-width: 600px) {
    .menu-icon {
      display: flex !important;
    }

    .title-header {
      display: flex !important;
      justify-content: center;
      align-items: center;
      width: 70%;
      color: whitesmoke;
      font-family: "JockeyOne";
      font-size: 1.6em;
    }

    nav {
      display: none;
    }

    .corner {
      margin-left: 20px;
    }
  }
</style>
