<script>
  import { page } from "$app/stores";
  import logo from "$lib/images/takeover-logo.png";
  import insta from "$lib/images/instagram-logo.svg";
  import menu from "$lib/images/icons/list.svg";
  import { onMount } from "svelte";

  let showHeader = false;
  let titleHeader = 'titulo';

  $: currentPath = $page.url.pathname;

  $: showHeader = currentPath !== "/";

  $: titleHeader = currentPath;
</script>

<header>
  <div class="corner">
    <a href="/">
      <img src={logo} alt="TakeOver" />
    </a>
  </div>

  {#if showHeader}
    <nav>
      <ul>
        <li
          aria-current={$page.url.pathname === "/tickets" ? "page" : undefined}
        >
          <a href="/tickets">TICKETS</a>
        </li>
        <li aria-current={$page.url.pathname === "/about" ? "page" : undefined}>
          <a href="/about">ABOUT TAKE OVER</a>
        </li>
        <li aria-current={$page.url.pathname === "/crew" ? "page" : undefined}>
          <a href="/crew">CREW</a>
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
		<h3>{titleHeader.slice(1).toUpperCase()}</h3>
	</div>

  <div class="corner">
    <a class="instagram-icon" target="_blank" href="https://www.instagram.com/_takeeover?igsh=YjloNXNndmJ4c2g5">
      <img src={insta} alt="Instagram" />
    </a>
	<a class="menu-icon" href="/">
		<img src={menu} alt="menu" />
	</a>
  </div>
</header>

<style>

  header {
    display: flex;
    justify-content: space-around;
    position: fixed;
    width: 100%;
    z-index: 1000;
  }

  .corner {
    width: 4em;
    height: 4em;
  }

  .corner a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .corner img {
    width: 3em;
    height: 3em;
    object-fit: contain;
  }

  nav { 
    display: flex;
    justify-content: center;
    --background: rgba(255, 255, 255, 0);
    width: 70%;
  }

  ul {
    position: relative;
    padding: 0;
    margin: 0;
    width: 80%;
    height: 4em;
    display: flex;
    justify-content: space-evenly;
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
    --size: 6px;
    content: "";
    width: 0;
    height: 0;
    position: absolute;
    top: 0;
    left: calc(50% - var(--size));
    border: var(--size) solid transparent;
    border-top: var(--size) solid var(--color-theme-1);
  }

  nav a {
    display: flex;
    height: 100%;
    align-items: center;
    padding: 0 0.5rem;
    color: var(--color-text-white);
    font-weight: 700;
    font-size: 0.8rem;
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

  .title-header{
	display: none !important;
  }

  /* Mostrar el icono de menú y ocultar el logo de Instagram en pantallas pequeñas */
  @media screen and (max-width: 600px) {
    .instagram-icon {
      display: none !important;
    }

    .menu-icon {
      display: block !important;
    }

	.title-header{
		display: flex !important;
    	justify-content: center;
		align-items: center;
		width: 70%;
		color: whitesmoke;
		font-family: "JockeyOne";
		font-size: 1.6em;
	}

	nav{
		display: none;
	}
  }
</style>
