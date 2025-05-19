
	export async function enviarTicketAlServidor(event, pdfBufferCorreo, nombreComprador, correoComprador) {
		const response = await event.fetch('/api/enviarCorreo', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				pdfBuffer: Array.from(new Uint8Array(pdfBufferCorreo)),
				nombre: nombreComprador,
        correo: correoComprador
			})
		});

		const data = await response.json();
		if (response.ok) {
			console.log('Correo enviado con éxito:', data);
		} else {
			console.error('Error al enviar el correo:', data);
		}
	}