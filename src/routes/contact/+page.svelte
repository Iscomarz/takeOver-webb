<script>
    import toast, { Toaster } from 'svelte-french-toast';

    let name = '';
    let email = '';
    let djSetLink = '';
    let message = '';
    let styleToast = 'border-radius: 200px; background: #333; color: #fff;';

    //validaciones
    function validarFormulario() {
        // Expresión regular para validar el correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Expresión regular para validar una URL
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        
        if(name===''){
            toast.error('Por favor, ingresa un nombre.',
                {
                    style: styleToast 
                }
            );
            return false;
        }
        // Validar el correo
        if (!emailRegex.test(email)) {
            toast.error('Por favor, ingresa un correo electrónico válido.',
                {
                    style: styleToast 
                }
            );
            return false;
        }
        // Validar el DJ Set link
        if(djSetLink !== ''){
            if (!urlRegex.test(djSetLink)) {
            toast.error('Por favor, ingresa un link válido para el DJ Set.',
                {
                    style: styleToast
                }
            );
            return false;
        }
        }

        if(message===''){
            toast.error('Por favor, ingresa un mensaje.',
                {
                    style: 'border-radius: 200px; background: #333; color: #fff;' 
                }
            );
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

        const sendEmailPromise = fetch('/api/emailContact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                email: email,
                djset: djSetLink,
                message: message,
            }),
        }).then(response => response.json());

        toast.promise(
            sendEmailPromise,
            {
                loading: 'Enviando...',
                success: 'Correo enviado correctamente, gracias por contactarnos!',
                error: 'No se pudo enviar el correo.',
            },
            {
                duration: 5000
            }
        );

        const result = await sendEmailPromise;

        if (result.success) {
            console.log('Correo enviado exitosamente', result.info);
            limpiarForm();
        } else {
            console.error('Error enviando el correo', result.error);
        }
    }

    function limpiarForm() {
        name = '';
        email = '';
        djSetLink = '';
        message = '';
    }
</script>

<Toaster />

<svelte:head>
    <title>Crew</title>
    <meta name="description" content="About this app" />
</svelte:head>

<div class="text-column">
    <h1>Send me a message... or a DJ set</h1>
    <br>
    <!-- Campo Name -->
    <div class="relative z-0">
        <input maxlength="15" type="text" id="floating_name" bind:value={name} class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
        <label for="floating_name" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Name</label>
    </div>
    <br>
    
    <!-- Campo Email -->
    <div class="relative z-0">
        <input type="email" maxlength="20" id="floating_email" bind:value={email} class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
        <label for="floating_email" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Email</label>
    </div>
    <br>
    
    <!-- Campo DJ Set link -->
    <div class="relative z-0">
        <input type="text" maxlength="100" id="floating_link" bind:value={djSetLink} class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
        <label for="floating_link" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">DJ Set link</label>
    </div>
    <br>
    
    <!-- Campo Message -->
    <div class="relative z-0">
        <textarea maxlength="300" id="floating_message" bind:value={message} class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer fixed-textarea" placeholder=" "></textarea>
        <label for="floating_message" class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Message</label>
    </div>
    <br><br>
    
    <!-- Botón de envío -->
    <button style="width: 100%; text-align: center;" on:click={sendMessage}>
        SEND
    </button>
</div>

<style>
	.text-column{
		padding: 15px;
	}
    button {
        color: var(--color-theme-1);
		font-family: 'JostRegular';
    }
    .fixed-textarea {
        resize: none;
        width: 100%; 
        height: 150px; 
    }

	h1{
		font-family: "JockeyOne";
		color: var(--color-text-white);
	}
	label{
		font-family: 'JostRegular';
	}
</style>
