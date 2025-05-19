export async function enviarTicketAlServidor(event,
  pdfBufferCorreo,
  nombreComprador,
  correoComprador
) {
  const response = await event.fetch("/api/resend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pdfBuffer: Array.from(new Uint8Array(pdfBufferCorreo)),
      to: correoComprador,
      subject: "Tickets Take Over",
      html:
        "<p>Hola " +
        nombreComprador +
        ", adjunto encontrarás tus tickets para el evento. take.oover.show@gmail.com</p>",
    }),
  });

  const data = await response.json();
  if (response.ok) {
    console.log("Correo enviado con éxito:", data);
  } else {
    console.error("Error al enviar el correo:", data);
  }
}
