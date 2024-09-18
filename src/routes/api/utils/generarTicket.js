import jsPDF from "jspdf";
import QRCodeStyling from "qr-code-styling";

export async function generarTicket(venta) {
  // Generar el código QR
  const qrCode = new QRCodeStyling({
    width: 200,
    height: 200,
    data: `https://tuweb.com/validar-ticket/${venta.idVenta}`, // URL o datos que quieras en el QR
    image: "https://tuweb.com/logo.png",
    dotsOptions: {
      color: "#000000",
      type: "rounded"
    },
    backgroundOptions: {
      color: "#ffffff"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 5
    }
  });

  // Generar el canvas para el código QR
  const qrCanvas = document.createElement("canvas");
  await qrCode.update({ canvas: qrCanvas });
  const qrImageDataUrl = qrCanvas.toDataURL("image/png");

  // Crear el PDF con jsPDF
  const doc = new jsPDF();
  doc.text(`Ticket para ${venta.nombre}`, 10, 10);
  doc.text(`Evento ID: ${venta.idEvento}`, 10, 20);
  doc.text(`Correo: ${venta.correo}`, 10, 30);
  doc.addImage(qrImageDataUrl, "PNG", 10, 40, 50, 50); // Añadir el QR al PDF
  doc.save(`ticket_${venta.idVenta}.pdf`);
}