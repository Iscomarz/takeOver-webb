<script>
  import toast, { Toaster } from "svelte-french-toast";

  let name = "";
  let email = "";
  let djSetLink = "";
  let message = "";
  let styleToast = "border-radius: 200px; background: #333; color: #fff;";

  //validaciones
  function validarFormulario() {
    // Expresión regular para validar el correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Expresión regular para validar una URL
    const urlRegex =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

    if (name === "") {
      toast.error("Por favor, ingresa un nombre.", {
        style: styleToast,
      });
      return false;
    }
    // Validar el correo
    if (!emailRegex.test(email)) {
      toast.error("Por favor, ingresa un correo electrónico válido.", {
        style: styleToast,
      });
      return false;
    }

    if (message === "") {
      toast.error("Por favor, ingresa un mensaje.", {
        style: "border-radius: 200px; background: #333; color: #fff;",
      });
      return false;
    }

    return true;
  }

  // Función para enviar el email
  async function sendMessage() {
    // Primero validar el formulario
    if (!validarFormulario()) {
      return; // Si la validación falla, no continúa
    }

    const sendEmailPromise = fetch("/api/emailContact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        djset: djSetLink,
        message: message,
      }),
    }).then((response) => response.json());

    toast.promise(
      sendEmailPromise,
      {
        loading: "Enviando...",
        success: "Correo enviado correctamente, gracias por contactarnos!",
        error: "No se pudo enviar el correo.",
      },
      {
        duration: 5000,
      }
    );

    const result = await sendEmailPromise;

    if (result.success) {
      console.log("Correo enviado exitosamente", result.info);
      limpiarForm();
    } else {
      console.error("Error enviando el correo", result.error);
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
  <title>Contact</title>
  <meta name="description" content="Ponte en contacto con nosotros" />
</svelte:head>

<!-- Contenedor principal con glassmorphism -->
<section class="w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] xl:w-[75%] 2xl:w-[70%] max-w-[900px] mx-auto flex flex-col mt-[70px] md:mt-[80px] lg:mt-[100px] mb-12">
  <!-- Título principal -->
  <h1 class="px-14 font-jockey text-xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300 text-center uppercase tracking-wide">
    Send me a message... or a DJ set
  </h1>

  <!-- Card del formulario con glass effect -->
  <div class=" p-8 md:p-10 relative overflow-hidden">
    <!-- Efecto de brillo sutil -->
    <div class="absolute inset-0 bg-gradient-to-br from-black/[0.03] to-black/20 pointer-events-none"></div>
    
    <!-- Textura de ruido sutil -->
    <div class="absolute inset-0 opacity-[0.015] pointer-events-none" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>

    <div class="relative z-10 flex flex-col gap-6">
      <!-- Campo Name -->
      <div class="relative z-0">
        <input
          maxlength="15"
          type="text"
          id="floating_name"
          bind:value={name}
          class="block py-3 px-0 w-full text-base font-jost text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-white peer transition-colors duration-300"
          placeholder=" "
        />
        <label
          for="floating_name"
          class="absolute font-jost text-base text-gray-400 duration-300 transform -translate-y-7 scale-90 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-white peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-7"
          >Name</label
        >
      </div>

      <!-- Campo Email -->
      <div class="relative z-0">
        <input
          type="email"
          maxlength="100"
          id="floating_email"
          bind:value={email}
          class="block py-3 px-0 w-full text-base font-jost text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-white peer transition-colors duration-300"
          placeholder=" "
        />
        <label
          for="floating_email"
          class="absolute font-jost text-base text-gray-400 duration-300 transform -translate-y-7 scale-90 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-white peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-7"
          >Email</label
        >
      </div>

      <!-- Campo DJ Set link -->
      <div class="relative z-0">
        <input
          type="text"
          maxlength="100"
          id="floating_link"
          bind:value={djSetLink}
          class="block py-3 px-0 w-full text-base font-jost text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-white peer transition-colors duration-300"
          placeholder=" "
        />
        <label
          for="floating_link"
          class="absolute font-jost text-base text-gray-400 duration-300 transform -translate-y-7 scale-90 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-white peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-7"
          >DJ Set link</label
        >
      </div>

      <!-- Campo Message -->
      <div class="relative z-0">
        <textarea
          maxlength="300"
          id="floating_message"
          bind:value={message}
          class="block py-3 px-0 w-full text-base font-jost text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-white peer resize-none h-[150px] transition-colors duration-300"
          placeholder=" "
        ></textarea>
        <label
          for="floating_message"
          class="absolute font-jost text-base text-gray-400 duration-300 transform -translate-y-7 scale-90 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-white peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-7"
          >Message</label
        >
      </div>

      <!-- Botón de envío con estilo glassmorphism -->
      <div class="flex justify-center mt-4">
        <button
          on:click={sendMessage}
          class="px-10 py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-xl text-base font-semibold font-jost cursor-pointer transition-all duration-300 hover:bg-white hover:text-gray-900 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,255,255,0.3)] active:scale-95 uppercase tracking-wider w-full md:w-auto"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</section>

<style>
  .glass-card {
    /* background: linear-gradient(to bottom right, rgba(23, 23, 23, 0.95), rgba(38, 38, 38, 0.95), rgba(23, 23, 23, 0.95)); */
    backdrop-filter: blur(24px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }
</style>
