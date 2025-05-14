import Stripe from "stripe";
import { json } from "@sveltejs/kit";
import supabase from "$lib/supabase";
import { generarTicket } from "$lib/utils/generarTicket";
import { enviarCorreoConTicket } from "../enviarCorreo/enviarTicket.js";
import { enviarCorreoProcesoPago } from "../enviarCorreo/correoProcesandoPago.js";
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

  //CLI
  //const endpointSecret = "whsec_2aaca38b6e9b930fd85683bdee5b8c148096a3107852aa1f3e2d156f99d056aa";
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
  const stripeEventId = eventStripe.id;

  tipoEventoStripe = eventStripe.type;
  const session = eventStripe.data.object;
  idSupabase = await login();

  switch (tipoEventoStripe) {
    case "checkout.session.completed":
      if (await existePago(session.payment_intent)) {
        console.log("existe pago");
        await insertaVenta(session);

        if (await acreditaPagoYGeneraTickets(session.payment_intent)) {
          return json({ message: "Pago guardado exitoso" }, { status: 200 });
        }
      } else {
        if (await capturarCheckOut(session, stripeEventId)) {
          // Enviar correo de confirmacion y proceso de pago
          enviarCorreoProcesoPago(
            session.customer_details.name,
            session.customer_details.email
          );
          return json({ message: "Pago guardado exitoso" }, { status: 200 });
        } else {
          return json({ message: "Error guardando el pago" }, { status: 400 });
        }
      }
    case "payment_intent.succeeded":
      console.log("Pago exitoso, procesando...");
      if (await existePago(session.id)) {
        console.log("existe pago");
        //Este prodecediemiento acredita el pago en mPago y genera los tickets en la tabla ticket
        if (await acreditaPagoYGeneraTickets(session.id)) {
          return json({ message: "Pago acreditado" }, { status: 200 });
        }
      } else {
        console.log("no existe pago");
        await insertaPago(session);
        return json({ message: "Pago guardado exitoso" }, { status: 200 });
      }
    case "checkout.session.async_payment_succeeded":
      console.log("Pago exitoso, procesando...");

      return json({ message: "Pago acreditado" }, { status: 200 });
    case "checkout.session.async_payment_failed":
      console.log("Pago fallido, no se procesa el pago");
      return json({ message: "Pago fallido" }, { status: 200 });
    case "checkout.session.expired":
      console.log("Sesión expirada, no se procesa el pago");

      return json({ message: "Sesión expirada" }, { status: 200 });
    default:
      return json({ message: "Evento no manejado" }, { status: 400 });
  }
}

async function capturarCheckOut(sessionCheckout, stripeEventId) {
  console.log("Evento no procesado, continuando...");
  const email = sessionCheckout.customer_details.email;
  const name = sessionCheckout.customer_details.name;
  const amount = sessionCheckout.amount_total / 100;
  const lineItems = await stripe.checkout.sessions.listLineItems(
    sessionCheckout.id
  );
  let cantidadT = 0;
  let descripcionFase = "";
  lineItems.data.forEach((item) => {
    descripcionFase = item.description;
    cantidadT = item.quantity;
    console.log(`Producto: ${descripcionFase}, Cantidad: ${cantidadT}`);
  });
  console.log("checkout_session_stripe", stripeEventId);
  // Llamada al procedimiento almacenado
  const { data, error } = await supabase.rpc("guardar_pago_venta", {
    cantidadt: cantidadT,
    correov: email,
    descripcionfase: descripcionFase,
    idtransstripe: sessionCheckout.payment_intent,
    monto: amount,
    nombrev: name,
    checkout_session_stripe: stripeEventId,
  });

  if (error) {
    console.error("Error al ejecutar el procedimiento:", error);
    return false;
  } else {
    console.log("Pago y venta guardados exitosamente:", data);
    return true;
  }
}

async function existePago(paymentIntent) {
  console.log("Verificando si el pago ya existe...", paymentIntent);
  const { data, error } = await supabase
    .from("mPago")
    .select("idTransaccionStripe")
    .eq("idTransaccionStripe", paymentIntent);

  console.log("data", data);
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

async function acreditaPagoYGeneraTickets(paymentIntent) {
  let { data: acreditaData, error: acreditaError } = await supabase.rpc(
    "acredita_pago_function",
    { idpagostripe: paymentIntent }
  );

  if (acreditaError) {
    console.error("Error llamando la función:", error);
    return false;
  } else {
    console.log("stp ejectuado correctamente");

    generarCorreoYTicket(
      acreditaData.tickets,
      acreditaData.nombreComprador,
      acreditaData.correoComprador
    );
    return true;
  }
}

async function insertaVenta(sessionCheckout) {
  const email = sessionCheckout.customer_details.email;
  const name = sessionCheckout.customer_details.name;
  const lineItems = await stripe.checkout.sessions.listLineItems(
    sessionCheckout.id
  );
  let cantidadT = 0;
  let descripcionFase = "";
  lineItems.data.forEach((item) => {
    descripcionFase = item.description;
    cantidadT = item.quantity;
  });

  const { data, error } = await supabase.rpc("insertaventa", {
    nombrev: name,
    correov: email,
    cantidad: cantidadT,
    idpagostripe: sessionCheckout.payment_intent,
    descripcionfase: descripcionFase,
  });

  if (error) {
    console.error("Error al ejecutar el procedimiento:", error);
    return false;
  } else {
    console.log("Pago y venta guardados exitosamente:", data);
    return true;
  }
}

async function insertaPago(session) {
  const { data, error } = await supabase.from("mPago").insert([
    {
      idFormaPago: 3,
      cantidad: session.amount / 100,
      fechaPago: new Date(),
      acreditado: false,
      idTransaccionStripe: session.id,
    },
  ]);

  if (error) {
    console.error("Error al insertar el pago:", error);
    return false;
  } else {
    console.log("Pago guardado exitosamente:", data);
    return true;
  }
}
