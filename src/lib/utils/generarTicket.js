import { jsPDF } from "jspdf";
import supabase from "$lib/supabase";
import { Buffer } from 'buffer';

//Variables de prueba

export async function generarTicket(venta, evento, tickets) {
  const doc = new jsPDF();
	let altura = 0;
	const ticketsPorPagina = 2; // Número de tickets por página
	let contadorTickets = 0;

	let eventoImageDataUrl = await obtenerImagenEvento(evento.pathImage);

	for (var i = 0; i < tickets.length; i++) {
		let qrImageDataUrl = await obtenerQR(tickets[i]);

		if (contadorTickets % 2 === 0) {
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(16);
			doc.text('TAKE OVER TICKETS', 10, 20 + altura);

			// Formatear la fecha actual en español (dd de mes de yyyy)
			const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
			const fechaActual = new Date().toLocaleDateString('es-ES', options);

			doc.setFontSize(10);
			doc.text(fechaActual.toUpperCase(), 10, 30 + altura);
			doc.text('Payment receipt for ' + venta.nombre, 10, 35 + altura);
		}

		// Título del evento
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text(
			evento.nombreEvento +
				' ' +
				evento.venue +
				' - ' +
				(await obtenerFase(tickets[i].idFase)) +
				' | TICKET N. ' +
				(i + 1) +
				'/' +
				venta.cantidadTickets,
			10,
			45 + altura
		);

		// Descripción y referencia en una tabla
		doc.setFontSize(10);
		doc.setFillColor(200, 200, 200); // Color de fondo gris
		doc.rect(10, 50 + altura, 90, 8, 'F'); // Rectángulo de descripción
		doc.rect(100, 50 + altura, 100, 8, 'F'); // Rectángulo de referencia
		doc.text('Descripción:', 12, 55 + altura);
		doc.text('Referencia: ' + tickets[i].referencia, 102, 55 + altura);

		const maxWidth = 125;
		// Descripción del ticket
		doc.setFont('helvetica', 'normal');
		doc.text(doc.splitTextToSize(evento.descripcion, maxWidth), 10, 65 + altura);

		// Información del evento
		const fechaEvento = new Date(evento.fechaInicio);
		const optionsFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
		const optionsHora = {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone: 'America/Mexico_City'
		};
		const fechaFormateada = fechaEvento.toLocaleDateString('es-ES', optionsFecha);
		const horaFormateada = fechaEvento.toLocaleTimeString('es-ES', optionsHora); // Formato 24 horas

		doc.setFont('helvetica', 'bold');
		doc.text('Día: ' + fechaFormateada, 10, 125 + altura);
		doc.text('Hora: 5:00 PM', 10, 130 + altura);
		doc.text('Venue: ' + evento.venue, 10, 135 + altura);
		doc.text('Dirección: ' + evento.direccion, 10, 140 + altura);
		doc.text('*Este evento es para personas mayores de 18 años.', 10, 150 + altura);
    console.log('informacion del evento agregada');
    
		if (eventoImageDataUrl) {
			doc.addImage(eventoImageDataUrl, 'PNG', 150, 60 + altura, 45, 45); // Ajusta el tamaño y la posición según sea necesario
      console.log('imagen del evento agregada');
		}

		doc.addImage(qrImageDataUrl, 'PNG', 150, 110 + altura, 45, 45);
    console.log('qr agregado');
		contadorTickets++;
		altura += 120;
    console.log('pagina generada');
		// Si se han añadido 2 tickets, crear una nueva página para los siguientes
		if (contadorTickets === ticketsPorPagina && i < tickets.length - 1) {
			doc.addPage(); // Agregar una nueva página
			altura = 0; // Reiniciar altura para la nueva página
			contadorTickets = 0; // Reiniciar contador
		}
	}
  console.log('generando pdf');
	// Generar el PDF como un array buffer
	const pdfArrayBuffer = doc.output('arraybuffer');
	const pdfBuffer = Buffer.from(pdfArrayBuffer); // Convertir a Buffer para enviar por correo
  console.log('pdf generado');
	return pdfBuffer; // Devolver el PDF en formato ArrayBuffer
}

async function obtenerQR(ticket) {
	const { data, error } = await supabase.storage
		.from('codigosQR')
		.createSignedUrl(ticket.pathStorage, 60 * 60);

	if (error) {
		console.log('Error al obtener imagen QR:', error);
	} else {
    console.log('Qr desde storage',data);
		return convertirImagenABase64(data.signedUrl);
	}
}

async function obtenerFase(idFase) {
	let { data: dataFase, error: errorFase } = await supabase
		.from('cFaseEvento')
		.select('*')
		.eq('idFase', idFase);

	if (errorFase) {
		console.log('Error al traer la fase');
	} else {
		return dataFase[0].nombreFace;
	}
}

async function obtenerImagenEvento(path) {
	let { data, error } = await supabase.storage.from('imageEventos').createSignedUrl(path, 60 * 60);

	if (error) {
		console.log('Error al traer imagen de evento', error);
	} else {
    console.log('Imagen del evento desde storage',data);
		return await convertirImagenABase64(data.signedUrl);
	}
}

async function convertirImagenABase64(url) {
	try {
	  const response = await fetch(url);
	  const buffer = await response.arrayBuffer();
	  const base64 = Buffer.from(buffer).toString('base64');
	  return `data:image/png;base64,${base64}`;
	} catch (error) {
	  console.error('Error convirtiendo imagen a Base64:', error);
	  throw error;
	}
  }
