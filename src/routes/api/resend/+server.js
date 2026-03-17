import { json } from '@sveltejs/kit';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_KEY || import.meta.env.VITE_RESESND_KEY || process.env.VITE_RESEND_KEY || process.env.VITE_RESESND_KEY);

export async function POST({ request }) {
	const { pdfBuffer,to,subject,html } = await request.json();
    console.log("✅ Endpoint de correo ejecutado");

	try {
		const data = await resend.emails.send({
			from: 'Take Over <eventos@takeovermx.com>',
			bcc: ['take.oover.show@gmail.com','franmtz96@gmail.com'],
			to,
			subject,
			html,
            attachments: [
                {
                    content: pdfBuffer,
                    type: 'application/pdf',
                    filename: 'ticket.pdf'
                }
            ]
		});

		return json({ success: true, data });
	} catch (error) {
		console.error(error);
		return json({ success: false, error });
	}
}