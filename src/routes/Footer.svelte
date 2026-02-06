<script>
    import logoTakeOver from "$lib/images/takeover-logo.png";
</script>
<footer class="text-whitesmoke">
  <div class="ft-content container mx-auto px-6 py-6 flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">

    <!-- Izquierda: redes y políticas -->
    <div id="redes-icons" class="flex flex-col items-center md:items-start md:flex-1 order-3 md:order-1">
      <div class="flex items-center gap-4">
        <a href="https://www.instagram.com/_takeeover?igshid=yjlo5sgvbxsh9" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-instagram">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
      </div>
      <a style="font-size: .5rem;" href="/politica" class="mt-3 underline font-bold">Políticas de privacidad</a>
    </div>

    <!-- Centro: logo -->
    <div class="md:flex-1 flex justify-center order-1 md:order-2">
      <img src={logoTakeOver} alt="TakeOver Logo" class="w-24 md:w-28" />
    </div>

    <!-- Derecha: slogan -->
    <div id="slogan" class="flex flex-col items-center md:items-end md:flex-1 text-center md:text-right md:text-2xl font-jockey uppercase tracking-wider order-2 md:order-3">
      <p>DANCE MUSIC</p>
      <p>EXPLORE FLAVORS</p>
      <p>FEEL THE BEAT</p>
    </div>

  </div>
</footer>

<style>
  footer {
    color: whitesmoke;
    background-color: transparent;
  }

  footer a {
    font-weight: bold;
    text-decoration: underline;
  }

  .ft-content{
        gap: 35px !important;
    }

  @media (min-width: 480px) {
    footer {
      padding: 12px 0;
    }
  }
</style>