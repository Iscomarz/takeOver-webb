import { jsPDF } from "jspdf";
import supabase from "$lib/supabase";
import { Buffer } from "buffer";

export async function generarTicket(nombre, evento, tickets) {
  const doc = new jsPDF();
  let altura = 0;
  const ticketsPorPagina = 2; // Número de tickets por página
  let contadorTickets = 0;

  let eventoImageDataUrl = await obtenerImagenEvento(evento.pathImage);

  // Calcular proporciones del flyer para no distorsionarlo
  let flyerW = 45;
  let flyerH = 45;
  if (eventoImageDataUrl) {
    try {
      const imgProps = doc.getImageProperties(eventoImageDataUrl);
      const ratio = imgProps.width / imgProps.height;
      flyerW = 45;
      flyerH = flyerW / ratio;
      // Limitar altura a 50 para que no choque con el QR
      if (flyerH > 50) {
        flyerH = 50;
        flyerW = flyerH * ratio;
      }
    } catch(e) {
      console.log("No se pudo obtener ratio de la imagen");
    }
  }

  for (var i = 0; i < tickets.length; i++) {
    let qrImageDataUrl = tickets[i].pathStorage;

    // Agregar página si ya hay 2 tickets
    if (contadorTickets === ticketsPorPagina) {
      doc.addPage();
      altura = 0;
      contadorTickets = 0;
    }

    // Encabezado del recibo (solo en la parte superior de la página)
    if (contadorTickets === 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("TAKE OVER TICKETS", 10, 20 + altura);

      // Formatear la fecha actual
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      const fechaActual = new Date().toLocaleDateString("es-ES", options);

      doc.setFontSize(10);
      doc.text(fechaActual.toUpperCase(), 10, 27 + altura);
      doc.text("Receipt for: " + nombre, 10, 32 + altura);

      // Línea separadora top
      doc.setLineWidth(0.5);
      doc.line(10, 36 + altura, 200, 36 + altura);
    }

    // Título del evento
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    let tituloTicket = evento.nombreEvento + " - " + tickets[i].nombreFase;
    
    // Si el nombre es muy largo, acortarlo
    if (tituloTicket.length > 55) tituloTicket = tituloTicket.substring(0, 52) + "...";
    doc.text(tituloTicket, 10, 43 + altura);
    
    doc.setFont("helvetica", "normal");
    doc.text("TICKET N. " + (i + 1) + " / " + tickets.length, 160, 43 + altura);

    // Descripción y referencia en una tabla
    doc.setFontSize(10);
    doc.setFillColor(230, 230, 230); // Color de fondo gris claro
    doc.rect(10, 48 + altura, 85, 7, "F"); // Rectángulo de descripción
    doc.rect(100, 48 + altura, 100, 7, "F"); // Rectángulo de referencia
    
    doc.setFont("helvetica", "bold");
    doc.text("Descripción:", 12, 53 + altura);
    doc.text("Referencia: " + tickets[i].referencia, 102, 53 + altura);

    const maxWidth = 125; // Limita el texto a que no invada las imágenes a la derecha
    // Descripción del ticket (Cortar para que no se traslape)
    doc.setFont("helvetica", "normal");
    let lineasDesc = doc.splitTextToSize(evento.descripcion || "", maxWidth);
    if (lineasDesc.length > 5) { // Máximo 5 líneas de descripción
      lineasDesc = lineasDesc.slice(0, 5);
      lineasDesc[4] = lineasDesc[4].substring(0, lineasDesc[4].length - 3) + "...";
    }
    doc.text(lineasDesc, 10, 62 + altura);

    // Información del evento (anclado más abajo para no chocar con desc)
    const fechaEvento = new Date(evento.fechaInicio);
    const optionsFecha = { day: "2-digit", month: "2-digit", year: "numeric" };
    const optionsHora = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    };
    const fechaFormateada = fechaEvento.toLocaleDateString("es-ES", optionsFecha);
    const horaFormateada = fechaEvento.toLocaleTimeString("es-MX", optionsHora); 

    let infoY = 105;
    doc.setFont("helvetica", "bold");
    doc.text("Día: ", 10, infoY + altura);
    doc.setFont("helvetica", "normal");
    doc.text(fechaFormateada, 20, infoY + altura);

    doc.setFont("helvetica", "bold");
    doc.text("Hora: ", 10, infoY + 6 + altura);
    doc.setFont("helvetica", "normal");
    doc.text(horaFormateada, 22, infoY + 6 + altura);

    doc.setFont("helvetica", "bold");
    doc.text("Lugar: ", 10, infoY + 12 + altura);
    doc.setFont("helvetica", "normal");
    
    // Dirección podría ser larga, truncamos si hace falta
    let dLines = doc.splitTextToSize(evento.venue + " - " + evento.direccion, maxWidth);
    if (dLines.length > 2) {
      dLines = dLines.slice(0, 2);
      dLines[1] = dLines[1].substring(0, dLines[1].length - 3) + "...";
    }
    doc.text(dLines, 24, infoY + 12 + altura);

    // Disclaimer final
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("*Este evento es exclusivo para personas mayores de 18 años.", 10, infoY + 28 + altura);

    // IMÁGENES DERECHA
    // Flyer
    if (eventoImageDataUrl) {
      // Centrar el flyer en su espacio asignado de 45px
      let fX = 150 + (45 - flyerW) / 2;
      doc.addImage(eventoImageDataUrl, "PNG", fX, 60 + altura, flyerW, flyerH); 
    }
    // QR Code
    if (qrImageDataUrl) {
      doc.addImage(qrImageDataUrl, "PNG", 152, 110 + altura, 40, 40);
    }

    // Línea punteada de corte en medio de la página (Solo si no es el único ticket de la hoja)
    if (contadorTickets === 0 && i < tickets.length - 1) {
       doc.setDrawColor(180, 180, 180);
       doc.setLineDashPattern([2, 2], 0);
       doc.line(10, 148.5 + altura, 200, 148.5 + altura);
       doc.setLineDashPattern([], 0); // reset
       doc.setDrawColor(0, 0, 0);
    }

    contadorTickets++;
    altura += 148.5; // Brinco exacto de media página A4 (297 / 2)
  }

  // Generar el PDF
  const pdfArrayBuffer = doc.output("arraybuffer");
  console.log("pdf generado con éxito");
  return pdfArrayBuffer;
}

async function obtenerImagenEvento(path) {
  let { data, error } = await supabase.storage
    .from("imageEventos")
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.log("Error al traer imagen de evento", error);
  } else {
    return await convertirImagenABase64(data.signedUrl);
  }
}

async function convertirImagenABase64(url) {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Error convirtiendo imagen a Base64:", error);
    throw error;
  }
}
