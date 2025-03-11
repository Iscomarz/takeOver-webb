import Stripe from "stripe";
import { json } from "@sveltejs/kit";
import supabase from "$lib/supabase";
import { generarTicket } from "$lib/utils/generarTicket";
import { enviarCorreoConTicket } from "../enviarCorreo/enviarTicket.js";
import QRCode from "qrcode";

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
let tipoEventoStripe = "";
//test
//const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY);
//live
const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);

export async function POST(event) {
  const sig = event.request.headers.get("stripe-signature");
  const body = await event.request.arrayBuffer();
  const rawBody = Buffer.from(body);

  //test
  //const endpointSecret = import.meta.env.VITE_STRIPE_WEBHOOK_TEST;
  //live
  const endpointSecret = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;

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

  // **Obtener el ID del evento**
  const stripeEventId = eventStripe.data.object.id;

  if (await eventoYaProcesado(stripeEventId)) {
    console.log("Evento ya procesado, omitiendo...");
    return json({ message: "Evento ya procesado" }, { status: 200 });
  } 

  tipoEventoStripe = eventStripe.type;
  const session = eventStripe.data.object;
  idSupabase = await login();

  switch (tipoEventoStripe) {
    case "checkout.session.completed":
      console.log(
        "Sesion de pago completada, se manda correo de confirmacion y se guarda pago y venta..."
      );
      const email = session.customer_details.email;
      const name = session.customer_details.name;
      const amount = session.amount_total / 100;
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const cantidadT = "";
      const descripcionFase = 0;
      lineItems.data.forEach((item) => {
        descripcionFase = item.description;
        cantidadT = item.quantity;
        console.log(`Producto: ${descripcionFase}, Cantidad: ${cantidadT}`);
      });
      // Llamada al procedimiento almacenado
      const { data, error } = await supabase.rpc("guardar_pago_venta", {
        monto: amount,
        idTransStripe: session.payment_intent,
        nombreV: name,
        correoV: email,
        cantidadT: cantidadT,
        descripcionFase: descripcionFase,
      });

      if (error) {
        console.error("Error al ejecutar el procedimiento:", error);
      } else {
        console.log("Pago y venta guardados exitosamente:", data);
        return json({ message: "Pago guardado exitoso" }, { status: 200 });
      }

    case "checkout.session.expired":
      console.log("Sesión expirada, procesando...");

      return json({ message: "Sesión expirada" }, { status: 200 });
    case "payment_intent.succeeded":
      console.log("Pago exitoso, procesando...");

      let { data:acreditaData, error:acreditaError } = await supabase.rpc("acredita_pago_function", { idpagoStripe: session.id });

      if (acreditaError) {
        console.error("Error llamando la función:", error);
      } else {
        console.log("Respuesta:", acreditaData);
        generarCorreoYTicket(acreditaData.tickets, acreditaData.nombreComprador, acreditaData.correoComprador);
        return json({ message: "Pago acreditado" }, { status: 200 });
      }
      
    case "checkout.session.async_payment_succeeded":
      console.log("Pago exitoso, procesando...");
      return json({ message: "Pago exitoso" }, { status: 200 });
    case "checkout.session.async_payment_failed":
      console.log("Pago fallido, no se procesa el pago");
      return json({ message: "Pago fallido" }, { status: 200 });
    default:
      return json({ message: "Evento no manejado" }, { status: 400 });
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
  const { error } = await supabase.storage
    .from("codigosQR")
    .upload(`qr_${referencia}.png`, blob);

  if (error) {
    console.log("Error subiendo el QR a Supabase:", error);
  } else {
    console.log("QR subido correctamente:"); // Devolver la ruta del archivo
  }
}

async function generarCorreoYTicket(tickets, nombreComprador, correoComprador) {
  console.log("🔹 Iniciando...");

  for (let i = 0; i < tickets.length; i++) {
    let base64QR = await generarQRCode(tickets[i].codigoQR);
    await subirQRASupabase(base64QR, tickets[i].referencia);

    tickets[i].pathStorage = base64QR;
  }
      
    
  const evento = await obtenerEventoActivo();
  //await agregarVendidosaInventario(faseEvento, venta); //hacer esto en el procedimiento almacenado
  const pdfBuffer = await generarTicket(nombreComprador, evento, tickets);
  console.log(venta);
  await enviarCorreoConTicket(pdfBuffer, nombreComprador, correoComprador);
  console.log("correo enviado");

  await cerrarSesion();
}

async function agregarVendidosaInventario(faseEvento, idVenta) {
  // Obtener la cantidad actual vendida
  const nuevaCantidadVendida =
    faseEvento.cantidadVendida + idVenta.cantidadTickets;

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
