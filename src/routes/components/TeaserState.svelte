<script>
  import { onMount, onDestroy } from "svelte";
  import { fade } from "svelte/transition";

  export let config = null;

  $: targetDateStr = config?.fecha_teaser || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  $: teaserTitle = config?.titulo_teaser || 'NEXT DESTINATION LOADING...';

  let timerInterval;
  let countdown = {
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00"
  };

  // Form states
  let email = "";
  let loading = false;
  let successMessage = "";
  let errorMessage = "";

  function updateCountdown() {
    const target = new Date(targetDateStr).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      countdown = {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00"
      };
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdown = {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0")
    };
  }

  async function handleSubmit() {
    if (!email) return;
    loading = true;
    successMessage = "";
    errorMessage = "";

    try {
      const response = await fetch("/api/lista-espera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        successMessage = "TE HAS REGISTRADO CON ÉXITO. TE ENVIAMOS UN CORREO DE BIENVENIDA.";
        email = "";
      } else {
        errorMessage = result.message || "ERROR AL REGISTRAR CORREO.";
      }
    } catch (err) {
      errorMessage = "ERROR DE CONEXIÓN CON EL SERVIDOR.";
    } finally {
      loading = false;
    }
  }



  onMount(() => {
    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });
</script>

<div class="teaser-wrapper" transition:fade>
  <div class="teaser-content">
    <!-- Header/Title -->
    <div class="teaser-header-section">
      <span class="teaser-tag">{teaserTitle.toUpperCase()}</span>
    </div>

    <!-- Countdown Display -->
    <div class="countdown-display">
      <div class="time-segment">
        <span class="time-num">{countdown.days}</span>
        <span class="time-lbl">DIAS</span>
      </div>
      <span class="divider-dot"></span>
      <div class="time-segment">
        <span class="time-num">{countdown.hours}</span>
        <span class="time-lbl">HORAS</span>
      </div>
      <span class="divider-dot"></span>
      <div class="time-segment">
        <span class="time-num">{countdown.minutes}</span>
        <span class="time-lbl">MINUTOS</span>
      </div>
      <span class="divider-dot"></span>
      <div class="time-segment">
        <span class="time-num highlighted">{countdown.seconds}</span>
        <span class="time-lbl highlighted-label">SEGUNDOS</span>
      </div>
    </div>

    <!-- Waitlist Section -->
    <div class="signup-section">
      <p class="signup-lead">Únete a nuestra lista prioritaria</p>
      <form on:submit|preventDefault={handleSubmit} class="signup-form">
        <input
          type="email"
          bind:value={email}
          placeholder="Tu correo electrónico"
          disabled={loading}
          required
          class="signup-input"
        />
        <button type="submit" disabled={loading} class="signup-btn">
          {#if loading}
            <span>ENVIANDO...</span>
          {:else}
            <span>SUSCRIBIRME</span>
          {/if}
        </button>
      </form>

      {#if successMessage}
        <div class="msg success-msg" transition:fade>
          <span class="icon">✓</span> {successMessage}
        </div>
      {/if}
      {#if errorMessage}
        <div class="msg error-msg" transition:fade>
          <span class="icon">×</span> {errorMessage}
        </div>
      {/if}
    </div>

    <!-- Minimalist Navigation Shortcuts -->
    <div class="teaser-nav">
      <a href="/eventos?past=true" class="nav-btn">
        <span>EVENTOS PASADOS</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </a>
      
      <a href="/vibe" class="nav-btn">
        <span>VIBES</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </a>

      <a href="/sounds" class="nav-btn">
        <span>SOUNDS</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </a>
    </div>
  </div>
</div>

<style>
  .teaser-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 4rem 1rem;
    box-sizing: border-box;
    /* Removed solid backgrounds so layout's animated club background takes over */
    background: transparent;
  }

  .teaser-content {
    text-align: center;
    max-width: 650px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
  }

  .teaser-header-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
  }

  .teaser-tag {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 5px;
    color: #56fdb8;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .teaser-title {
    font-family: "JockeyOne", "Outfit", "Inter", sans-serif;
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: 2px;
    color: #ffffff;
    margin: 0;
    text-transform: uppercase;
    text-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  }

  .countdown-display {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.8rem;
    width: 100%;
  }

  .time-segment {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 80px;
  }

  .time-num {
    font-family: "Inter", -apple-system, sans-serif;
    font-size: 4.5rem;
    font-weight: 200;
    color: #ffffff;
    line-height: 1;
    letter-spacing: -1px;
  }

  .time-num.highlighted {
    color: #56fdb8;
    font-weight: 300;
    text-shadow: 0 0 25px rgba(86, 253, 184, 0.25);
  }

  .time-lbl {
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 0.8rem;
    text-transform: uppercase;
  }

  .time-lbl.highlighted-label {
    color: rgba(86, 253, 184, 0.7);
  }

  .divider-dot {
    width: 4px;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    margin-top: -1.5rem;
  }

  .signup-section {
    width: 100%;
    max-width: 450px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
  }

  .signup-lead {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }

  .signup-form {
    display: flex;
    width: 100%;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.3rem 0;
    transition: border-color 0.3s ease;
  }

  .signup-form:focus-within {
    border-color: #56fdb8;
  }

  .signup-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #ffffff;
    font-family: inherit;
    font-size: 1rem;
    padding: 0.5rem 1rem 0.5rem 0;
  }

  .signup-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .signup-btn {
    background: transparent;
    border: none;
    color: #56fdb8;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 2px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .signup-btn:hover:not(:disabled) {
    color: #ffffff;
    text-shadow: 0 0 10px rgba(86, 253, 184, 0.5);
  }

  .signup-btn:disabled {
    color: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
  }

  .msg {
    margin-top: 1rem;
    font-size: 0.85rem;
    padding: 0.7rem 1.2rem;
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .success-msg {
    background-color: rgba(86, 253, 184, 0.05);
    border: 1px solid rgba(86, 253, 184, 0.15);
    color: #56fdb8;
  }

  .error-msg {
    background-color: rgba(255, 95, 86, 0.05);
    border: 1px solid rgba(255, 95, 86, 0.15);
    color: #ff5f56;
  }

  /* Minimalist Nav Link Buttons */
  .teaser-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
    width: 100%;
    margin-top: 1rem;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
    padding: 0.8rem 1.4rem;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 2px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .nav-btn:hover {
    color: #56fdb8;
    background: rgba(86, 253, 184, 0.05);
    border-color: rgba(86, 253, 184, 0.3);
    transform: translateY(-2px);
  }

  .nav-btn svg {
    opacity: 0.7;
    transition: transform 0.3s ease;
  }

  .nav-btn:hover svg {
    opacity: 1;
    transform: translateY(2px);
  }

  .nav-btn:hover svg {
    transform: translateX(2px);
  }

  /* Responsive styling */
  @media screen and (max-width: 600px) {
    .teaser-content {
      gap: 3rem;
    }

    .teaser-title {
      font-size: 2.2rem;
    }

    .countdown-display {
      gap: 0.8rem;
    }

    .time-segment {
      min-width: 60px;
    }

    .time-num {
      font-size: 2.8rem;
    }

    .divider-dot {
      display: none;
    }

    .signup-form {
      flex-direction: column;
      border-bottom: none;
      gap: 1rem;
    }

    .signup-input {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.8rem;
      text-align: center;
    }

    .signup-btn {
      border: 1px solid rgba(86, 253, 184, 0.2);
      padding: 0.8rem;
      text-align: center;
    }

    .teaser-nav {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .nav-btn {
      justify-content: center;
    }
  }
</style>
