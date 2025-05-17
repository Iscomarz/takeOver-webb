import nodemailer from 'nodemailer';

export async function POST({ request }) {
	const { pdfBuffer, nombre, correo } = await request.json();

	// Asegúrate de que pdfBuffer sea de tipo Buffer
	const bufferData = Buffer.from(pdfBuffer);

	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		service: 'gmail',
		auth: {
			user: process.env.GMAIL_ADDRESS,
			pass: process.env.GMAIL_APP_PASSWORD
		}
	});

	const mailOptions = {
		from: process.env.GMAIL_ADDRESS,
		to: correo,
		subject: 'Tu ticket para el evento',
		text: `Hola ${nombre}, adjunto encontrarás tus tickets para el evento.`,
		attachments: [
			{
				filename: `ticket_${nombre}.pdf`,
				content: bufferData, // Asegúrate de convertir correctamente el buffer
				contentType: 'application/pdf'
			}
		]
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		return new Response(JSON.stringify({ message: 'Correo enviado', info }), { status: 200 });
	} catch (error) {
		console.error('Error enviando el correo:', error);
		return new Response(JSON.stringify({ message: 'Error enviando el correo', error }), {
			status: 500
		});
	}
}
