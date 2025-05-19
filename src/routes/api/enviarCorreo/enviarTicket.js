import nodemailer from 'nodemailer';

export async function enviarCorreoConTicket(pdfBuffer, nombre, correo) {
  try {
    // Crear el transportador de nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,// true for 465, false for other ports
      service:'gmail', 
      auth: {
        user: process.env.GMAIL_ADDRESS,    // Tu correo
        pass: process.env.GMAIL_APP_PASSWORD  // Tu contraseña de aplicación
      }
    });

    // Configurar el correo
    const mailOptions = {
      from: process.env.GMAIL_ADDRESS,
      to: correo,
      subject: 'Tu ticket para el evento',
      text: `Hola ${nombre}, adjunto encontrarás tu ticket para el evento.`,
      attachments: [
        {
          filename: `ticket_${nombre}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    console.log("📧 Enviando correo...");
    const info = await transporter.sendMail(mailOptions); // Espera correctamente la promesa
    console.log("✅ Correo enviado con éxito: " + info.response);

  } catch (error) {
    console.error("❌ Error enviando el correo: ", error);
  }
}

	export async function enviarTicketAlServidor(event,pdfBufferCorreo, nombreComprador, correoComprador) {
		const response = await event.fetch('/api/resend', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				pdfBuffer: Array.from(new Uint8Array(pdfBufferCorreo)),
        to: correoComprador,
        subject: 'Tickets Take Over',
        html: '<p>Hola '+nombreComprador+', adjunto encontrarás tus tickets para el evento.</p>'
			})
		});

		const data = await response.json();
		if (response.ok) {
			console.log('Correo enviado con éxito:', data);
		} else {
			console.error('Error al enviar el correo:', data);
		}
	}