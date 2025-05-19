<script>
  import { onMount } from "svelte";
  import toast, { Toaster } from "svelte-french-toast";
  import logo from "$lib/images/takeover-logo.png";
  import BotonComunidad from "../components/botonComunidad.svelte";

  onMount(() => {
    toast.success("Compra completada con exito!", {
      icon: "👏",
      style: "border-radius: 200px; background: #333; color: #fff;",
      duration: 5000,
    });
  });
</script>

<Toaster />
<section class="welcomeTO">
  <h2>BIENVENIDO A TAKEOVER</h2><br>
  <span>
    <img src={logo} alt="takeOver logo" />
  </span><br>
  <div class="parrafo">
    <p>
      Felicidades completaste la compra con exito!, enviaremos los tickets al
      correo electronico proporcionado, por mientras te puedes sumar a la
      comunidad Take Over en el siguiente enlace, nos vemos en la rave!, Gracias.
    </p><br>
    <p>*Si no vez el correo en tu bandeja de entrada, revisa en las secciones de promocion y spam.</p>
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
</style>
