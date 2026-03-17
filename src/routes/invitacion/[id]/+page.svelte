<script>
  import Title from "../../components/Title.svelte";
  import toast, { Toaster } from "svelte-french-toast";
  import supabase from "$lib/supabase";
  import { onMount, tick } from "svelte";
  import { page } from "$app/stores";
  import logo from "$lib/images/takeover-logo.png";
  import BotonComunidad from "../../components/botonComunidad.svelte";

  let loading = true;
  let mEvento = {};
  let eventoActivo = true;

  // Datos del formulario
  let nombre = "";
  let correo = "";
  let enterado = "";
  let invitarProximos = "";
  let formatoRave = ""; // Sugerencia de pregunta
  let comentarios = "";
  
  let enviando = false;
  let formularioCompletado = false;
  let premioObtenido = null; // "gratis" o "descuento"
  let codigoPremio = "";

  const idEvento = $page.params.id;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    let { data: evento, error } = await supabase
      .from("mEvento")
      .select("*")
      .eq("idevento", idEvento)
      .single();

    if (error || !evento) {
      eventoActivo = false;
      console.log("Error al traer el evento o no existe.");
    } else {
      mEvento = evento;
    }
    await tick();
    loading = false;
  }

  async function handleSubmit() {
    if (!nombre.trim() || !correo.trim() || !enterado || !invitarProximos || !formatoRave) {
      toast.error("Por favor completa todos los campos requeridos.", {
        style: 'background: #333; color: #fff;',
      });
      return;
    }

    enviando = true;

    try {
      // 1. Enviar los datos a nuestra nueva API
      const response = await fetch("/api/registro-invitacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idEvento,
          nombre: nombre.trim(),
          correo: correo.trim(),
          enterado,
          invitarProximos: invitarProximos === "si",
          formatoRave,
          comentarios: comentarios.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al enviar el formulario.");
      }

      // 2. Mostrar el resultado
      premioObtenido = result.premio;
      codigoPremio = result.codigo;
      formularioCompletado = true;

      toast.success("¡Registro exitoso!", {
        style: 'background: #333; color: #fff;',
      });

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Ocurrió un error. Intenta de nuevo.", {
        style: 'background: #333; color: #fff;',
      });
    } finally {
      enviando = false;
    }
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(codigoPremio);
    toast.success("¡Código copiado al portapapeles!", {
      style: "background: #333; color: #fff;",
    });
  }
</script>

<svelte:head>
  <title>Invitación Especial | {mEvento?.nombreEvento || "Take Over"}</title>
</svelte:head>

<Toaster />

<section class="max-w-3xl mx-auto px-4 mt-[100px] mb-20">
  {#if loading}
    <div class="flex justify-center items-center min-h-[50vh]">
      <p class="text-white/70 text-xl tracking-wider animate-pulse">Cargando...</p>
    </div>
  {:else if !eventoActivo}
    <div class="text-center text-gray-100 min-h-[50vh] flex flex-col items-center justify-center gap-6">
      <h1 class="text-3xl font-jockey">Este evento ya no está disponible</h1>
      <BotonComunidad />
      <a href="/" class="return-btn">Volver al inicio</a>
    </div>
  {:else if formularioCompletado}
    <div class="success-container glass-panel">
      <img src={logo} alt="Take Over Logo" class="w-48 mx-auto mb-8" />
      <h2 class="text-4xl font-jockey text-primary mb-4">¡ESTÁS DENTRO!</h2>
      
      {#if premioObtenido === "gratis"}
        <p class="text-xl text-white mb-6 font-jost">
          ¡Felicidades {nombre}! Eres de los primeros en registrarte. <br/>
          <strong class="text-primary">Te has ganado un ACCESO GRATIS de Cortesía.</strong><br/>
          <span class="text-sm text-gray-300">Hemos enviado tus tickets en PDF directamente a tu correo.</span>
        </p>
      {:else}
        <p class="text-xl text-white mb-6 font-jost">
          ¡Gracias por registrarte, {nombre}! <br/>
          <strong>Desafortunadamente las cortesías para este evento se han agotado.</strong>
        </p>
      {/if}

      <div class="reward-box mt-4">
        <p class="text-sm text-gray-400 uppercase tracking-widest mb-2">BENEFICIO EXTRA: INVITA A TUS AMIGOS</p>
        <p class="text-xs text-gray-300 mb-4">Comparte tu código personal de referido con tus amigos para que puedan comprar boletos con precio especial usando este código:</p>
        <div class="code-flex">
          <span class="code text-primary">{codigoPremio}</span>
          <button on:click={copiarCodigo} class="copy-btn">Copiar</button>
        </div>
      </div>

      <div class="mt-8 flex justify-center gap-4">
        <a href="/eventos/{idEvento}" class="action-btn primary">Ir al Evento</a>
      </div>
    </div>
  {:else}
    <div class="form-container glass-panel">
      <div class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-jockey text-white tracking-wider uppercase mb-2">
          {mEvento.nombreEvento}
        </h1>
        <h2 class="text-xl text-primary font-jost opacity-90">Lista de Invitado Especial</h2>
        <p class="text-gray-300 mt-4 text-base font-jost leading-relaxed text-justify">
          <strong class="text-white text-lg">{mEvento.nombreEvento} toma la ciudad.</strong><br/>
          Un espacio para desconectarte de todo y dejar que la música haga lo suyo. Sé de los primeros en registrarte y obtén tu acceso al evento acompañado de un código único para regalarle a tus amigos un precio especial. Comparte tu código, suma a los tuyos y asegura tu lugar.<br/><br/>
          <span class="text-primary font-bold">Nos vemos en la pista. 🕺</span>
        </p>

        <p class="text-gray-400 mt-5 text-xs font-jost bg-gray-900/60 p-3 rounded-lg border border-gray-800 text-left">
          *Tus datos solo son recolectados para la mejora de nuestros eventos. Si te es posible, ayúdanos a compartir el evento en tus redes sociales junto a tu código de referido. ¡Habrá recompensas exclusivas para quienes nos ayuden a llegar a más personas!
        </p>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-6">
        
        <!-- Info Básica -->
        <fieldset class="input-group">
          <label for="nombre">Nombre Completo *</label>
          <input type="text" id="nombre" bind:value={nombre} placeholder="Ej. Juan Pérez" required />
        </fieldset>

        <fieldset class="input-group">
          <label for="correo">Correo Electrónico *</label>
          <input type="email" id="correo" bind:value={correo} placeholder="tu@correo.com" required />
        </fieldset>

        <!-- Preguntas de Opción Múltiple -->
        <fieldset class="select-group">
          <label>¿Cómo te has enterado de este evento? *</label>
          <select bind:value={enterado} required>
            <option value="" disabled selected>Selecciona una opción</option>
            <option value="instagram">Instagram de Take Over</option>
            <option value="amigo">Por un amigo / Promotor</option>
            <option value="comunidad_whatsapp">Comunidad de WhatsApp</option>
            <option value="dj">A través de un DJ del LineUp</option>
            <option value="otro">Otro</option>
          </select>
        </fieldset>

        <!-- Sugerencia de pregunta extra -->
        <fieldset class="select-group">
          <label>¿Qué estilo musical te atrae más para una rave? *</label>
          <select bind:value={formatoRave} required>
            <option value="" disabled selected>Selecciona una opción</option>
            <option value="house_disco">House / Disco (Groove)</option>
            <option value="techno_hard">Techno / Hard Techno (Oscuro y rápido)</option>
            <option value="melodic">Melodic / Progressive (Viaje musical)</option>
            <option value="indie_dance">Indie Dance / Dark Disco</option>
          </select>
        </fieldset>

        <fieldset class="radio-group">
          <label>¿Te podemos invitar a próximos eventos y promociones? *</label>
          <div class="radio-options">
            <label class="radio-label">
              <input type="radio" bind:group={invitarProximos} value="si" />
              <span class="radio-custom"></span>
              Sí, me encantaría
            </label>
            <label class="radio-label">
              <input type="radio" bind:group={invitarProximos} value="no" />
              <span class="radio-custom"></span>
              No, prefiero no recibir info
            </label>
          </div>
        </fieldset>

        <!-- Abierta -->
        <fieldset class="input-group">
          <label for="comentarios">¿Tienes alguna duda o sugerencia para nosotros? (Opcional)</label>
          <textarea 
            id="comentarios" 
            bind:value={comentarios} 
            placeholder="Dinos lo que piensas..."
            rows="3"
          ></textarea>
        </fieldset>

        <button 
          type="submit" 
          class="submit-btn mt-4" 
          disabled={enviando}
        >
          {enviando ? "PROCESANDO..." : "OBTENER BENEFICIO"}
        </button>

        <div class="mt-6 text-center border-t border-gray-800 pt-6">
          <p class="text-gray-400 font-jost text-sm mb-3">Síguenos para no perderte de nada</p>
          <a href="https://www.instagram.com/_takeeover/" target="_blank" rel="noopener noreferrer" class="instagram-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            @_takeeover
          </a>
        </div>

      </form>
    </div>
  {/if}
</section>

<style>
  .font-jockey { font-family: "JockeyOne", sans-serif; }
  .font-jost { font-family: "JostRegular", sans-serif; }
  .text-primary { color: #56fdb8; }

  .glass-panel {
    background: linear-gradient(145deg, rgba(20,20,20,0.9) 0%, rgba(30,30,30,0.8) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 2rem 1.5rem;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  }

  @media (min-width: 768px) {
    .glass-panel { padding: 3rem 4rem; }
  }

  .input-group, .select-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: none;
    padding: 0;
    margin: 0;
  }

  label {
    font-family: "JostRegular";
    color: #e5e5e5;
    font-size: 0.95rem;
  }

  input[type="text"],
  input[type="email"],
  select,
  textarea {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #56fdb8;
    background: rgba(0, 0, 0, 0.5);
  }

  select option {
    background-color: #1a1a1a;
    color: white;
  }

  /* Custom Radio Buttons */
  .radio-group {
    border: none;
    padding: 0;
    margin: 0;
  }

  .radio-options {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 0.5rem;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    font-size: 0.95rem;
    color: #cbd5e1;
  }

  .radio-label input {
    display: none;
  }

  .radio-custom {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    position: relative;
    transition: all 0.2s ease;
  }

  .radio-label input:checked + .radio-custom {
    border-color: #56fdb8;
  }

  .radio-label input:checked + .radio-custom::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    background: #56fdb8;
    border-radius: 50%;
  }

  .submit-btn {
    background: #56fdb8;
    color: black;
    font-family: "JockeyOne";
    font-size: 1.2rem;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: 2px;
  }

  .submit-btn:hover:not(:disabled) {
    background: white;
    transform: translateY(-2px);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Success Screen Styles */
  .success-container {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .reward-box {
    background: rgba(86, 253, 184, 0.05);
    border: 1px dashed #56fdb8;
    border-radius: 12px;
    padding: 1.5rem;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .code-flex {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: rgba(0,0,0,0.5);
    padding: 0.8rem;
    border-radius: 8px;
  }

  .code {
    font-family: monospace;
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 3px;
  }

  .copy-btn {
    background: #56fdb8;
    color: black;
    padding: 0.4rem 1rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    background: white;
  }

  .action-btn {
    padding: 0.8rem 2rem;
    border-radius: 8px;
    font-family: "JostRegular";
    text-decoration: none;
    font-weight: bold;
    transition: all 0.3s;
  }

  .action-btn.primary {
    background: #56fdb8;
    color: black;
  }

  .action-btn.primary:hover {
    background: white;
  }

  .return-btn {
    color: #56fdb8;
    text-decoration: underline;
    font-family: "JostRegular";
  }

  .instagram-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: "JostRegular";
    font-weight: bold;
    font-size: 1.1rem;
    text-decoration: none;
    transition: transform 0.2s ease;
  }

  .instagram-link:hover {
    transform: scale(1.05);
  }

  .instagram-link svg {
    stroke: #dc2743;
  }
</style>
