<script>
  import insta from "$lib/images/instagram-logo.svg";
  import logoTakeOver from "$lib/images/takeover-logo.png";
  import SoundsSection from "$lib/components/SoundsSection.svelte";

  export let data;
</script>

<svelte:head>
  <title>Take Over HOME</title>
  <meta name="description" content="Take Over Show Official Website" />
</svelte:head>

<div class="home-container">
  <!-- Logo centrado con elementos complementarios -->
  <div class="logo-center">
    <div class="content-wrapper">
      <!-- Línea superior decorativa -->
      <div class="line-top"></div>
      
      <!-- Texto superior -->
      <p class="tagline-top">ELECTRONIC MUSIC EVENTS</p>
      
      <!-- Logo principal -->
      <img src={logoTakeOver} alt="Take Over Logo" class="logo-takeover" />
      
      <!-- Slogan -->
      <p class="slogan">WHERE THE NIGHT COMES ALIVE</p>
      
      <!-- Ubicación o info -->
      <div class="info-bottom">
        <span class="info-item">CHIHUAHUA, MX</span>
        <span class="separator">•</span>
        <span class="info-item">EST. 2024</span>
      </div>
    </div>
  </div>

  <!-- Links en el costado derecho -->
  <nav class="nav-links">
    <a class="link" href="/eventos">
      <span class="link-number">01</span>
      <span class="link-text">EVENTS</span>
    </a>
    <a class="link" href="about">
      <span class="link-number">02</span>
      <span class="link-text">ABOUT</span>
    </a>
    <a class="link" href="crew">
      <span class="link-number">03</span>
      <span class="link-text">CREW</span>
    </a>
    <a class="link" href="/sounds">
      <span class="link-number">04</span>
      <span class="link-text">SOUNDS</span>
    </a>
    <a class="link" href="contact">
      <span class="link-number">05</span>
      <span class="link-text">CONTACT</span>
    </a>
  </nav>
</div>

<SoundsSection sounds={data?.sounds ?? []} limit={3} />

<style>
  .home-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 2rem;
  }

  /* Logo centrado */
  .logo-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .line-top {
    width: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  }

  .tagline-top {
    font-family: "JostRegular", sans-serif;
    font-size: 0.75rem;
    letter-spacing: 0.25em;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
    font-weight: 300;
  }

  .logo-takeover {
    width: clamp(250px, 40vw, 400px);
    height: auto;
    opacity: 0.65;
    filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.15));
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    margin: 1rem 0;
  }

  .logo-takeover:hover {
    opacity: 1;
    filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.25));
    transform: scale(1.02);
  }

  .slogan {
    font-family: "JockeyOne", sans-serif;
    font-size: clamp(0.9rem, 2vw, 1.1rem);
    letter-spacing: 0.15em;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    text-align: center;
  }

  .info-bottom {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-family: "JostRegular", sans-serif;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 0.5rem;
  }

  .separator {
    color: rgba(255, 255, 255, 0.2);
  }

  /* Navegación en el costado */
  .nav-links {
    position: fixed;
    right: 4rem;
    top: calc(50% - 40px);
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    z-index: 10;
  }

  .link {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.6);
    font-family: "JostRegular", sans-serif;
    font-size: 0.95rem;
    letter-spacing: 0.1em;
    transition: all 0.3s ease;
    position: relative;
  }

  .link-number {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
    font-weight: 300;
    transition: all 0.3s ease;
  }

  .link-text {
    position: relative;
    transition: all 0.3s ease;
  }

  .link-text::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 1px;
    background: white;
    transition: width 0.3s ease;
  }

  .link:hover {
    color: white;
  }

  .link:hover .link-number {
    color: var(--color-theme-1);
  }

  .link:hover .link-text::after {
    width: 100%;
  }

  /* Responsive */
  @media screen and (max-width: 1024px) {
    .nav-links {
      right: 2rem;
      gap: 2rem;
    }
  }

  @media screen and (max-width: 768px) {
    .home-container {
      flex-direction: column;
      gap: 4rem;
      min-height: 70vh;
    }

    .nav-links {
      position: relative;
      right: auto;
      top: auto;
      transform: none;
      align-items: center;
      gap: 1.5rem;
    }

    .link {
      font-size: 1.1rem;
    }

    .logo-takeover {
      width: clamp(200px, 60vw, 350px);
    }

    .content-wrapper {
      gap: 1.2rem;
    }

    .slogan {
      font-size: 0.95rem;
      padding: 0 1rem;
    }
  }

  @media screen and (max-width: 600px) {
    .home-container {
      padding: 1rem;
      gap: 3rem;
    }

    .nav-links {
      gap: 1.2rem;
    }

    .link {
      font-size: 1rem;
    }

    .content-wrapper {
      gap: 1rem;
    }

    .tagline-top {
      font-size: 0.65rem;
    }

    .slogan {
      font-size: 0.85rem;
    }

    .info-bottom {
      font-size: 0.65rem;
      gap: 0.6rem;
    }
  }
</style>
