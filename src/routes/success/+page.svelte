<script>
  import { onMount } from "svelte";
  import toast, { Toaster } from "svelte-french-toast";
  import logo from "$lib/images/takeover-logo.png";
  import BotonComunidad from "../components/botonComunidad.svelte";

  export let data;
  const { codigoReferido, nombreCliente } = data;

  onMount(() => {
    toast.success("¡Compra completada con éxito!", {
      icon: "👏",
      style: "border-radius: 200px; background: #333; color: #fff;",
      duration: 5000,
    });
  });

  function copiarCodigo() {
    navigator.clipboard.writeText(codigoReferido);
    toast.success("¡Código copiado!", {
      style: "background: #333; color: #fff;",
    });
  }
</script>

<Toaster />
<section class="welcomeTO">
  <h2>BIENVENIDO A TAKEOVER</h2><br>
  <span>
    <img src={logo} alt="takeOver logo" />
  </span><br>
  <div class="parrafo">
    <p>
      ¡Felicidades {nombreCliente || ''}, completaste la compra con éxito! Enviaremos los tickets al
      correo electrónico proporcionado. Por mientras te puedes sumar a la
      comunidad Take Over en el siguiente enlace, ¡nos vemos en la rave! Gracias.
    </p>

    {#if codigoReferido}
      <div class="referral-box">
        <h3>Tu código de referido</h3>
        <div class="code-container">
          <span class="code">{codigoReferido}</span>
          <button on:click={copiarCodigo} class="copy-btn">Copiar</button>
        </div>
        <p class="referral-desc">
          ¡Comparte este código con tus amigos y obtengan beneficios especiales!
        </p>
      </div>
    {/if}
<br>
    <p>*Si no vez el correo en tu bandeja de entrada, revisa en las secciones de promoción y spam.</p>
    <br>
    <BotonComunidad />
  </div>
</section>

<style>
    span img{
        width: 350px;
    }
    h2 {
    font-family: "JockeyOne" !important;
    color: whitesmoke;
    font-size: 2em;
  }
  p{
    font-family: "JostRegular";
    color: whitesmoke;
    width: 80%;
  }
  .welcomeTO{
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .parrafo{
    text-align: center;
    width: 100%;
    display: contents;
  }
  button{
    margin-top: 20px;
  }

  .referral-box {
    margin: 30px 0;
    padding: 25px;
    background: rgba(86, 253, 184, 0.05);
    border: 1px dashed #56fdb8;
    border-radius: 15px;
    text-align: center;
    width: 90%;
    max-width: 450px;
  }

  .referral-box h3 {
    font-family: "JockeyOne";
    color: #56fdb8;
    margin-bottom: 15px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .code-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    background: rgba(0,0,0,0.3);
    padding: 10px 20px;
    border-radius: 8px;
    margin-bottom: 15px;
  }

  .code {
    font-size: 1.5em;
    font-weight: bold;
    color: white;
    letter-spacing: 2px;
  }

  .copy-btn {
    background: #56fdb8;
    color: black;
    padding: 5px 15px;
    border-radius: 5px;
    font-size: 0.9em;
    font-weight: bold;
    margin-top: 0 !important;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    background: #fff;
    transform: scale(1.05);
  }

  .referral-desc {
    font-size: 0.85em !important;
    opacity: 0.8;
    width: 100% !important;
  }
</style>
