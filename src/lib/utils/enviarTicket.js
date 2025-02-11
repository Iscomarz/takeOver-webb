import nodemailer from 'nodemailer';
//import { generarTicket } from './generarTicket'; // Asegúrate de que está correctamente importado

export async function enviarCorreoConTicket(pdfBuffer, venta) {

  // Crear el transportador de nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail', // o usa otro servicio como 'hotmail', 'yahoo', etc.
    auth: {
      user: process.env.GMAIL_ADDRESS,   // Tu dirección de correo
      pass: process.env.GMAIL_APP_PASSWORD   // Tu contraseña de aplicación o clave
    }
  });

  // Configurar el correo
  const mailOptions = {
    from: process.env.GMAIL_ADDRESS,  // El remitente
    to: venta.correo,                 // Destinatario (correo del cliente)
    subject: 'Tu ticket para el evento',
    text: `Hola ${venta.nombre}, adjunto encontrarás tu ticket para el evento.`,
    attachments: [
      {
        filename: `ticket_${venta.nombre}.pdf`,   // Nombre del archivo adjunto
        content: pdfBuffer,                        // Contenido del PDF como Buffer
        contentType: 'application/pdf'             // Tipo MIME del archivo
      }
    ]
  };

  // Enviar el correo
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error("Error enviando el correo: ", error);
    }
    console.log('Correo enviado: ' + info.response);
  });
}

// Ejemplo de cómo usar la función con un objeto de venta
// const venta = {
//   idVenta: 123,
//   nombre: 'John Doe',
//   correo: 'john@example.com',
//   idEvento: 456
// };

// // Llamar a la función para enviar el correo con el ticket adjunto
// enviarCorreoConTicket(venta);
