import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export async function generarTicket(venta) {
  // Generar el código QR como una imagen Base64
  //`https://example.com/${venta.idVenta}`
  const qrImageDataUrl = await QRCode.toDataURL('12345678910');

  const doc = new jsPDF();
  doc.text(`Ticket para ${venta.nombre}`, 10, 10);
  doc.addImage(qrImageDataUrl, "PNG", 10, 40, 50, 50);

  return Buffer.from(doc.output("arraybuffer"));
}
