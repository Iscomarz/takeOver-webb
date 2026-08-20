<script>
  import { onMount } from "svelte";
  import { gsap } from "gsap";
  import insta from "$lib/images/instagram-logo.svg";
  import logoTakeOver from "$lib/images/takeover-logo.png";
  import SoundsSection from "$lib/components/SoundsSection.svelte";

  export let data;

  const taglineTarget = "ELECTRONIC MUSIC EVENTS";
  const sloganTarget = "WHERE THE NIGHT COMES ALIVE";
  const scrambleChars = "!/<>[]_{}—=+*^?#01XYZ";

  let displayedSlogan = "\u00A0";

  function createScrambleTween(finalText, onUpdateCallback, duration = 2.8) {
    const proxy = { progress: 0 };
    return gsap.to(proxy, {
      progress: 1,
      duration,
      ease: "power1.inOut",
      onUpdate: () => {
        const resolvedCount = Math.floor(proxy.progress * finalText.length);
        const scrambled = finalText
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < resolvedCount) return char;
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          })
          .join("");
        onUpdateCallback(scrambled);
      },
      onComplete: () => {
        onUpdateCallback(finalText);
      }
    });
  }

  onMount(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // 1. Línea decorativa
    tl.from(".line-top", {
      scaleX: 0,
      opacity: 0,
      duration: 0.8
    })
    // 2. Logo aparece lentamente
    .from(
      ".logo-takeover",
      {
        opacity: 0,
        scale: 0.85,
        duration: 1.8,
        ease: "power2.out"
      },
      "-=0.4"
    )
    // 3. Tagline superior se escribe letra por letra
    .from(
      ".tagline-top .char",
      {
        opacity: 0,
        y: 5,
        duration: 0.05,
        stagger: 0.04,
        ease: "none"
      },
      "-=1.2"
    )
    // 4. Slogan con efecto Decoder / Scramble más lento
    .add(
      createScrambleTween(sloganTarget, (text) => (displayedSlogan = text), 2.8),
      "-=0.8"
    )
    // 5. Info inferior
    .from(
      ".info-bottom",
      {
        opacity: 0,
        y: 8,
        duration: 0.8
      },
      "-=0.4"
    )
    // 6. Links hacen POP en cascada pausada
    .from(
      ".nav-links .link",
      {
        scale: 0,
        opacity: 0,
        duration: 0.7,
        stagger: 0.16,
        ease: "back.out(1.8)"
      },
      "-=1.2"
    );

    return () => {
      tl.kill();
    };
  });
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
      <p class="tagline-top">
        {#each taglineTarget.split("") as char}
          <span class="char">{char}</span>
        {/each}
      </p>
      
      <!-- Logo principal -->
      <img src={logoTakeOver} alt="Take Over Logo" class="logo-takeover" />
      
      <!-- Slogan -->
      <p class="slogan">{displayedSlogan}</p>
      
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
    <a class="link" href="/about">
      <span class="link-number">02</span>
      <span class="link-text">ABOUT</span>
    </a>
    <a class="link" href="/crew">
      <span class="link-number">03</span>
      <span class="link-text">CREW</span>
    </a>
    <a class="link" href="/sounds">
      <span class="link-number">04</span>
      <span class="link-text">SOUNDS</span>
    </a>
    <a class="link" href="/vibe">
      <span class="link-number">05</span>
      <span class="link-text">VIBE WALL</span>
    </a>
    <a class="link" href="/contact">
      <span class="link-number">06</span>
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

  .char {
    display: inline-block;
    white-space: pre;
  }

  .logo-takeover {
    width: clamp(250px, 40vw, 400px);
    height: auto;
    opacity: 0.65;
    filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.15));
    transition: filter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
    gap: 1.8rem;
    z-index: 10;
  }

  .link {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.6);
    font-family: "JostRegular", sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    transition: color 0.3s ease;
    position: relative;
    transform-origin: center right;
  }

  .link-number {
    font-size: 0.7rem;
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
      gap: 1.5rem;
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
      gap: 1.2rem;
    }

    .link {
      font-size: 0.95rem;
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
      gap: 1rem;
    }

    .link {
      font-size: 0.85rem;
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
