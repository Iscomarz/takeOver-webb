import nodemailer from 'nodemailer';

export async function enviarCorreoConTicket(pdfBuffer, venta) {
  try {
    // Crear el transportador de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ADDRESS,    // Tu correo
        pass: process.env.GMAIL_APP_PASSWORD  // Tu contraseña de aplicación
      }
    });

    // Configurar el correo
    const mailOptions = {
      from: process.env.GMAIL_ADDRESS,
      to: venta.correo,
      subject: 'Tu ticket para el evento',
      text: `Hola ${venta.nombre}, adjunto encontrarás tu ticket para el evento.`,
      attachments: [
        {
          filename: `ticket_${venta.nombre}.pdf`,
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
