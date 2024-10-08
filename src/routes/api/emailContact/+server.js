// src/routes/api/send-email/+server.js
import nodemailer from 'nodemailer';

export async function POST({ request }) {
  const { name, email, djset, message } = await request.json();

  // Configuración del transportador SMTP usando Gmail
  const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:587,
    secure:false,
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_ADDRESS, // Correo de Gmail
      pass: process.env.GMAIL_APP_PASSWORD, // Contraseña de aplicación generada
    },
  });

  const mailOptions = {
    from: name, // Remitente
    to: 'franmtz96@gmail.com', // Destinatario
    subject: "Take Over Web App Message From: "+ name,
    text: message+ ' Dj set:'+ djset+ ' Email: ' +email ,
    html: `<p><b>From:</b> ${name} <br> <b>Email:</b> ${email} <br> <b>DJ Set:</b> ${djset} <br> <b>Message:</b> ${message}</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ success: true, info }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
