import { json } from '@sveltejs/kit';
import { Resend } from 'resend';

const resendApiKey =
	process.env.RESEND_API_KEY ||
	process.env.VITE_RESEND_KEY ||
	process.env.VITE_RESESND_KEY;

const contactEmail = process.env.CONTACT_EMAIL || 'take.oover.show@gmail.com';
const contactCcEmail = process.env.CONTACT_CC_EMAIL || 'franmtz96@gmail.com';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Take Over <eventos@takeovermx.com>';

function escapeHtml(value = '') {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

export async function POST({ request }) {
	if (!resendApiKey) {
		console.error('Contact email: missing RESEND_API_KEY');
		return json({ success: false, error: 'Email service is not configured.' }, { status: 500 });
	}

	const { name, email, djset = '', message } = await request.json();
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!name?.trim() || !emailPattern.test(email || '') || !message?.trim()) {
		return json({ success: false, error: 'Invalid contact form data.' }, { status: 400 });
	}

	const safeName = escapeHtml(name.trim());
	const safeEmail = escapeHtml(email.trim());
	const safeDjSet = escapeHtml(djset.trim());
	const safeMessage = escapeHtml(message.trim()).replaceAll('\n', '<br>');
	const resend = new Resend(resendApiKey);

	try {
		const { data, error } = await resend.emails.send({
			from: fromEmail,
			to: [contactEmail],
			cc: [contactCcEmail],
			replyTo: email.trim(),
			subject: `Nuevo mensaje web de ${name.trim()}`,
			html: `
				<div style="background:#080808;color:#f5f5f5;padding:32px;font-family:Arial,sans-serif">
					<p style="color:#56fdb8;font-size:11px;letter-spacing:2px;margin:0 0 18px">TAKE OVER · CONTACT</p>
					<h1 style="font-size:28px;margin:0 0 28px">Nuevo mensaje desde la web</h1>
					<p><strong>Nombre:</strong> ${safeName}</p>
					<p><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color:#f5f5f5">${safeEmail}</a></p>
					<p><strong>DJ Set:</strong> ${safeDjSet || 'No proporcionado'}</p>
					<hr style="border:0;border-top:1px solid #333;margin:26px 0">
					<p style="color:#aaa;font-size:12px;letter-spacing:1px">MENSAJE</p>
					<p style="font-size:16px;line-height:1.65">${safeMessage}</p>
				</div>
			`
		});

		if (error) {
			console.error('Contact email: Resend rejected the message', error);
			return json({ success: false, error: error.message }, { status: 502 });
		}

		return json({ success: true, id: data?.id });
	} catch (error) {
		console.error('Contact email: unexpected error', error);
		return json({ success: false, error: 'Could not send contact email.' }, { status: 500 });
	}
}
