<script>
  import toast, { Toaster } from "svelte-french-toast";

  let name = "";
  let email = "";
  let djSetLink = "";
  let message = "";
  const styleToast = "border-radius: 200px; background: #333; color: #fff;";

  function validarFormulario() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name === "") {
      toast.error("Por favor, ingresa un nombre.", { style: styleToast });
      return false;
    }
    if (!emailRegex.test(email)) {
      toast.error("Por favor, ingresa un correo electrónico válido.", { style: styleToast });
      return false;
    }
    if (message === "") {
      toast.error("Por favor, ingresa un mensaje.", { style: styleToast });
      return false;
    }
    return true;
  }

  async function sendMessage() {
    if (!validarFormulario()) return;

    const sendEmailPromise = fetch("/api/emailContact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        djset: djSetLink,
        message,
      }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo enviar el correo.");
      }
      return result;
    });

    toast.promise(
      sendEmailPromise,
      {
        loading: "Enviando...",
        success: "Correo enviado correctamente, gracias por contactarnos!",
        error: "No se pudo enviar el correo.",
      },
      { duration: 5000 }
    );

    try {
      await sendEmailPromise;
      limpiarForm();
    } catch {
      // El toast ya presenta el error al usuario.
    }
  }

  function limpiarForm() {
    name = "";
    email = "";
    djSetLink = "";
    message = "";
  }
</script>

<Toaster />

<svelte:head>
  <title>Contact | Take Over</title>
  <meta name="description" content="Bookings, colaboraciones y contacto con Take Over." />
</svelte:head>

<main class="contact-page">
  <section class="contact-hero" aria-labelledby="contact-title">
    <div class="intro">
      <span class="eyebrow">05 / GET IN TOUCH</span>
      <h1 id="contact-title">SEND US<br />A SIGNAL.</h1>
      <p class="lead">
        Bookings, collaborations, ideas or a DJ set we need to hear.
        If it moves the culture, we want to know about it.
      </p>

      <div class="contact-notes">
        <div>
          <small>FOR</small>
          <p>BOOKINGS · COLLABS · DJ SUBMISSIONS</p>
        </div>
        <div>
          <small>BASED IN</small>
          <p>MEXICO · MOVING EVERYWHERE</p>
        </div>
      </div>

      <div class="signal" aria-hidden="true">
        <span></span><i></i><span></span>
      </div>
    </div>

    <form class="contact-form" on:submit|preventDefault={sendMessage}>
      <div class="form-heading">
        <span>START A CONVERSATION</span>
        <p>We usually reply as soon as the bass allows.</p>
      </div>

      <div class="field-row">
        <label>
          <span>01 / NAME</span>
          <input maxlength="15" type="text" bind:value={name} placeholder="Your name" autocomplete="name" />
        </label>
        <label>
          <span>02 / EMAIL</span>
          <input type="email" maxlength="100" bind:value={email} placeholder="you@email.com" autocomplete="email" />
        </label>
      </div>

      <label>
        <span>03 / DJ SET LINK <em>OPTIONAL</em></span>
        <input type="text" inputmode="url" maxlength="100" bind:value={djSetLink} placeholder="SoundCloud, Mixcloud, YouTube..." />
      </label>

      <label>
        <span>04 / MESSAGE</span>
        <textarea maxlength="300" bind:value={message} placeholder="Tell us what you have in mind..."></textarea>
        <small class="counter">{message.length} / 300</small>
      </label>

      <button type="submit" class="send-button">
        <span>SEND MESSAGE</span>
        <span class="arrow">↗</span>
      </button>
    </form>
  </section>

  <footer class="contact-footer">
    <span></span>
    <p>COME AS YOU ARE · LEAVE DIFFERENT</p>
    <span></span>
  </footer>
</main>

<style>
  .contact-page { width: min(1180px,calc(100% - 2rem)); min-height: 100vh; margin: 0 auto; padding: 8.5rem 0 3rem; color: #fff; }
  .contact-hero { display: grid; grid-template-columns: minmax(0,.9fr) minmax(420px,1.1fr); gap: clamp(3rem,8vw,8rem); align-items: start; }
  .eyebrow,.form-heading>span { color: #56fdb8; font-size: .64rem; letter-spacing: .25em; }
  h1 { margin: 1rem 0 1.25rem; font: 400 clamp(3.7rem,7.5vw,7rem)/.82 "JockeyOne",sans-serif; letter-spacing: -.015em; }
  .lead { max-width: 460px; margin: 0; color: rgba(255,255,255,.48); font-size: clamp(.9rem,1.3vw,1.02rem); line-height: 1.7; }
  .contact-notes { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: clamp(3rem,7vw,5rem); padding-top: 1.3rem; border-top: 1px solid rgba(255,255,255,.12); }
  .contact-notes small { color: rgba(255,255,255,.3); font-size: .55rem; letter-spacing: .22em; }
  .contact-notes p { margin: .45rem 0 0; color: rgba(255,255,255,.72); font-size: .64rem; letter-spacing: .12em; line-height: 1.55; }
  .signal { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: .75rem; margin-top: 2.5rem; opacity: .35; }
  .signal span { height: 1px; background: linear-gradient(90deg,rgba(255,255,255,.5),transparent); }
  .signal span:last-child { transform: scaleX(-1); }
  .signal i { width: 4px; height: 4px; border-radius: 50%; background: #fff; }
  .contact-form { position: relative; padding: clamp(1.5rem,4vw,3rem); border: 1px solid rgba(255,255,255,.12); background: rgba(7,7,7,.56); backdrop-filter: blur(12px); }
  .contact-form::before { content:""; position:absolute; inset:-1px auto auto -1px; width:42px; height:42px; border-top:1px solid #56fdb8; border-left:1px solid #56fdb8; pointer-events:none; }
  .form-heading { margin-bottom: 2.5rem; }
  .form-heading p { margin: .55rem 0 0; color: rgba(255,255,255,.38); font-size: .78rem; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  label { position: relative; display: block; margin-bottom: 1.6rem; }
  label>span { display: flex; justify-content: space-between; margin-bottom: .55rem; color: rgba(255,255,255,.4); font-size: .57rem; letter-spacing: .18em; }
  label em { color: rgba(255,255,255,.2); font-style: normal; }
  input,textarea { width: 100%; box-sizing: border-box; border: 0; border-bottom: 1px solid rgba(255,255,255,.16); border-radius: 0; padding: .7rem 0 .85rem; color: #fff; background: transparent; font: .92rem "Jost",sans-serif; outline: none; transition: border-color .25s ease; }
  input::placeholder,textarea::placeholder { color: rgba(255,255,255,.2); }
  input:focus,textarea:focus { border-color: rgba(255,255,255,.8); }
  textarea { min-height: 110px; resize: vertical; }
  .counter { position: absolute; right: 0; bottom: .4rem; color: rgba(255,255,255,.22); font-size: .55rem; letter-spacing: .1em; }
  .send-button { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: .75rem; border: 1px solid rgba(255,255,255,.22); padding: 1rem 1.15rem; color: #fff; background: transparent; font: 600 .66rem "Jost",sans-serif; letter-spacing: .2em; cursor: pointer; transition: color .25s,border-color .25s,background .25s; }
  .send-button:hover { color: #080808; border-color: #fff; background: #fff; }
  .arrow { font-size: 1rem; transition: transform .25s ease; }
  .send-button:hover .arrow { transform: translate(2px,-2px); }
  .contact-footer { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1.5rem; margin-top: clamp(5rem,10vw,8rem); color: rgba(255,255,255,.24); }
  .contact-footer span { height: 1px; background: linear-gradient(90deg,transparent,rgba(255,255,255,.18)); }
  .contact-footer span:last-child { transform: scaleX(-1); }
  .contact-footer p { margin: 0; font-size: .52rem; letter-spacing: .3em; text-align: center; }
  @media(max-width:850px){
    .contact-page{padding-top:7rem}
    .contact-hero{grid-template-columns:1fr;gap:3.5rem}
    .intro{max-width:680px}
    h1{font-size:clamp(3.6rem,14vw,6.5rem)}
  }
  @media(max-width:560px){
    .contact-page{width:min(100% - 1.5rem,1180px);padding-top:6rem}
    .contact-notes,.field-row{grid-template-columns:1fr}
    .contact-notes{gap:1rem}
    .contact-form{padding:1.4rem 1.1rem}
    .contact-footer{gap:.75rem}
    .contact-footer p{font-size:.45rem;letter-spacing:.18em}
  }
  @media(prefers-reduced-motion:reduce){.send-button,.arrow,input,textarea{transition:none}}
</style>
