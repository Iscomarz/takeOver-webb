import Stripe from "stripe";
import { json } from "@sveltejs/kit";
import supabase from "$lib/supabase";
import { generarTicket } from "$lib/utils/generarTicket";
import { enviarCorreoConTicket } from "../enviarCorreo/enviarTicket.js";
import QRCode from "qrcode";
import { Queue } from "bull";

let pago = {
  idFormaPago: 3, //id forma de pago stripe/tarjeta
  cantidad: 0,
  fechaPago: new Date(),
  acreditado: false,
  fechaAcreditacion: null,
  idTransaccionStripe: "",
};

let venta = {
  idEvento: 0,
  idUsuario: 0,
  nombre: "",
  correo: "",
  fechaVenta: new Date(),
  cantidadTickets: 0,
  idPago: 0,
  idFaseEvento: 0,
};

let idSupabase = "";
let tickets = [];
//test
const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY);
//live
//const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);

export async function POST(event) {
  const sig = event.request.headers.get("stripe-signature");
  const body = await event.request.arrayBuffer();
  const rawBody = Buffer.from(body);

  //test
  const endpointSecret = import.meta.env.VITE_STRIPE_WEBHOOK_TEST;
  //live
  //const endpointSecret = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;

  let eventStripe;
  try {
    eventStripe = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return json(
      { error: "Webhook signature verification failed." },
      { status: 400 }
    );
  }

  // Solo procesamos pagos completados
  if (eventStripe.type === "checkout.session.completed") {
    const session = eventStripe.data.object;
    const email = session.customer_details.email;
    const name = session.customer_details.name;
    const amount = session.amount_total / 100;

    console.log(`Pago recibido: ${email}, ${amount} ${session.currency}`);

    // **Responde inmediatamente a Stripe para evitar reintentos**
    const response = json({ received: true }, { status: 200 });

    // **Obtener el ID del evento**
    const stripeEventId = eventStripe.id;
    console.log("Stripe Event ID:", stripeEventId);

    if (await eventoYaProcesado(stripeEventId)) {
      console.log("Evento ya procesado, omitiendo...");
      return response;
    } else {
      console.log("Antes de llamar procesarPago...");
      await procesarPago(session, email, name, amount, stripeEventId).catch(
        (error) => {
          console.error("Error procesando el pago en segundo plano:", error);
        }
      );
      console.log("Después de llamar procesarPago (terminó bien)");

      return response;
    }
    // **Stripe recibirá 200 OK y no reintentará**
  }

  return json({ message: "Evento no manejado" }, { status: 400 });
}

async function guardaPago(pago) {
  const { data, error } = await supabase.from("mPago").insert([pago]).select();

  if (error) {
    console.error("No se pudo guardar el pago ", error.message);
    return;
  } else {
    console.log("Pago guardado correctamente");
    return data[0].idpago;
  }
}

async function eventoYaProcesado(stripeEventId) {
  const { data, error } = await supabase
    .from("mPago")
    .select("idTransaccionStripe")
    .eq("idTransaccionStripe", stripeEventId);

    //console.log("data", data);
  return data && data.length > 0; // Devuelve `true` si ya existe
}

async function guardaVenta(venta) {
  const { data, error } = await supabase
    .from("mVenta")
    .insert([venta])
    .select();

  if (error) {
    console.error("No se pudo guardar la venta", error.message);
    await cerrarSesion();
    return;
  } else {
    console.log("Venta guardada");
    return data[0];
  }
}

async function obtenerEventoActivo() {
  let { data: mEvento, error } = await supabase
    .from("mEvento")
    .select("*")
    .eq("activo", true);

  if (error) {
    console.error("Error obteniendo los eventos activos:", error.message);
    return;
  }
  return mEvento.length > 0 ? mEvento[0] : null;
}

async function login() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "franmtz96@gmail.com",
      password: process.env.SUPABASE_PASSWORD,
    });

    if (error) {
      throw new Error(error.message);
    } else {
      //console.log("Inicio de sesión correcto", data);
      return data.user.id;
    }
  } catch (error) {
    // Manejar cualquier error durante el inicio de sesión
    console.error("Error de inicio de sesión:", error.message);
  }
}

async function cerrarSesion() {
  await supabase.auth.signOut();
}

async function obtenerFaseEvento(idEvento, descripcion) {
  let { data: cFaseEvento, error } = await supabase
    .from("cFaseEvento")
    .select("*")
    .eq("idEvento", idEvento)
    .eq("nombreFace", descripcion);

  if (error) {
    console.error("No se pudo traer la fase", error.message);
    cerrarSesion();
  } else {
    return cFaseEvento[0];
  }
}

async function generarQRCode(texto) {
  try {
    const qrBase64 = await QRCode.toDataURL(texto);
    return qrBase64; // Este es el string base64 de la imagen
  } catch (err) {
    console.error("Error generando el QR:", err);
  }
}

async function subirQRASupabase(base64Image, referencia) {
  // Convertir la imagen base64 a un Blob
  const base64Data = base64Image.split(",")[1]; // Eliminar el prefijo "data:image/png;base64,"
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/png" });

  // Subir el archivo a Supabase Storage
  const { data, error } = await supabase.storage
    .from("codigosQR")
    .upload(`qr_${referencia}.png`, blob);

  if (error) {
    console.log("Error subiendo el QR a Supabase:", error);
  } else {
    console.log("QR subido correctamente:", data);
    return data.path; // Devolver la ruta del archivo
  }
}

async function procesarPago(session, email, name, amount, idEventoStripe) {
  console.log("🔹 Iniciando procesarPago()...");
  idSupabase = await login();
  pago.acreditado = true;
  pago.fechaAcreditacion = new Date();
  pago.cantidad = amount;
  pago.idTransaccionStripe = idEventoStripe;

  const idPagoVenta = await guardaPago(pago);
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  let evento = await obtenerEventoActivo();

  let descripcion = "";
  let cantidad = 0;
  lineItems.data.forEach((item) => {
    descripcion = item.description;
    cantidad = item.quantity;
    console.log(`Producto: ${descripcion}, Cantidad: ${cantidad}`);
  });

  let faseEvento = await obtenerFaseEvento(evento.idevento, descripcion);

  venta.idEvento = evento.idevento;
  venta.nombre = name;
  venta.correo = email;
  venta.cantidadTickets = cantidad;
  venta.idPago = idPagoVenta;
  venta.idFaseEvento = faseEvento.idFase;
  venta.idUsuario = idSupabase;

  const mVenta = await guardaVenta(venta);
  if (mVenta) {
    //Generar qr, tickets y guardar en supabase
    for (let i = 0; i < mVenta.cantidadTickets; i++) {
      //Generar referencia aleatoria de 8 digitos
      let referencia = Math.floor(10000000 + Math.random() * 90000000);
      //Crear un salt unico
      let salt = crypto.randomUUID();
      //Combinar la referencia con el salt y aplicar una funcion hash (SHA-256)
      let codigoQR = await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(referencia + salt))
        .then((hash) => {
          return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        });

      let base64QR = await generarQRCode(codigoQR);
      let pathQR = await subirQRASupabase(base64QR, referencia);

      //Guardar en tabla ticket de supabase
      const { data: dataTicket, error: errorTicket } = await supabase
        .from("ticket")
        .insert([
          {
            codigoQR: codigoQR,
            validado: false,
            pathStorage: pathQR,
            idVenta: mVenta.idventa,
            referencia: referencia,
            idFase: mVenta.idFaseEvento,
            fechaValidacion: null,
          },
        ])
        .select();
      if (errorTicket) {
        console.error("No se pudo guardar el ticket ", errorTicket.message);
      } else {
        console.log("Ticket guardado correctamente");
        tickets.push(dataTicket[0]);
      }
    }
  }

  //Guardar tickets en supabase
  await agregarVendidosaInventario(faseEvento, venta);
  const pdfBuffer = await generarTicket(venta, evento, tickets);
  console.log(venta);
  await enviarCorreoConTicket(pdfBuffer, venta);
  console.log("correo enviado");
  
  await cerrarSesion();
}

async function agregarVendidosaInventario(faseEvento, idVenta) {
  // Obtener la cantidad actual vendida
  const nuevaCantidadVendida = faseEvento.cantidadVendida + idVenta.cantidadTickets;

  // Verificar si se alcanzó o superó el límite
  const activo = nuevaCantidadVendida >= faseEvento.limite ? false : true;

  // Actualizar la cantidadVendida y el estado activo en la tabla
  const { data, error } = await supabase
    .from("cFaseEvento")
    .update({
      cantidadVendida: nuevaCantidadVendida,
      activo: activo,
    })
    .eq("idFase", faseEvento.idFase)
    .select();

  if (error) {
    console.error("No se pudo guardar los tickets vendidos ", error.message);
    return null;
  } else {
    console.log("Tickets vendidos guardados correctamente", data);
    return data;
  }
}
