<script>
  import { onMount } from "svelte";
  import toast, { Toaster } from "svelte-french-toast";

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
    <img src="src\lib\images\takeover-logo.png" alt="takeOver logo" />
  </span><br>
  <div class="parrafo">
    <p>
      Felicidades completaste la compra con exito!, enviaremos los tickets al
      correo electronico proporcionado, por mientras te puedes sumar a la
      comunidad Take Over en el siguiente enlace, nos vemos en la rave!, Gracias.
    </p><br>
    <button
      class="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="#e6e6e6"
        viewBox="0 0 256 256"
        ><path
          d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"
        ></path></svg
      >
      <span
        class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
      >
        Comunidad TakeOver
      </span>
    </button>
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
