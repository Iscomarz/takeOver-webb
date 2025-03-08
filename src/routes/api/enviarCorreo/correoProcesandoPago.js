import nodemailer from 'nodemailer';

export async function enviarCorreoConTicket(nombre, correo) {
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
      to: correo,
      subject: 'Confirmación de pago',
      text: `Hola ${nombre}, Gracias por comprar en takeover tickets estamos procesando tu pago...
      Te enviaremos tus tickets en cuanto se haya completado el proceso de pago.`
    };

    console.log("📧 Enviando correo...");
    const info = await transporter.sendMail(mailOptions); // Espera correctamente la promesa
    console.log("✅ Correo enviado con éxito: " + info.response);

  } catch (error) {
    console.error("❌ Error enviando el correo: ", error);
  }
}
