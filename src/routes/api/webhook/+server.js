import Stripe from "stripe";
import { json } from "@sveltejs/kit";
//import supabase from "$lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { generarTicket } from "$lib/utils/generarTicket";
import QRCode from "qrcode";

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_API_KEY
);

let tickets = [];
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

  const session = eventStripe.data.object;
  await login();

  switch (eventStripe.type) {
    case "checkout.session.completed":
      if (await existePago(session.payment_intent)) {
        console.log("existe pago");
        await insertaVenta(session);

        if (await acreditaPagoYGeneraTickets(event, session.payment_intent)) {
          return json({ message: "Pago guardado exitoso" }, { status: 200 });
        }
      } else {
        if (await capturarCheckOut(session, stripeEventId, event, session.payment_intent)) {
          // Enviar correo de confirmacion y proceso de pago
          // enviarCorreoProcesoPago(
          //   session.customer_details.name,
          //   session.customer_details.email
          // );
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
        if (await acreditaPagoYGeneraTickets(event, session.id)) {
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

async function capturarCheckOut(sessionCheckout, stripeEventId, event, paymentIntent) {
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
    nombrev: name == null ? 'Cortesia':name,
    checkout_session_stripe: stripeEventId,
  });

  if(amount == 0 && cantidadT != 0){
    console.log("Entro a acreditar y generar tickets")
    acreditaPagoYGeneraTickets(event, stripeEventId);
  }

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
    .upload(`qr_${referencia}.png`, blob, {
      upsert: true, // Reemplaza el archivo si ya existe
    });

  if (error) {
    console.log("Error subiendo el QR a Supabase:", error);
  } else {
    console.log("QR subido correctamente:"); // Devolver la ruta del archivo
  }
}

async function generarCorreoYTicket(
  event,
  tickets,
  nombreComprador,
  correoComprador
) {
  console.log("🔹 Iniciando...",event,tickets,nombreComprador,correoComprador);
  try {
    await Promise.all(
      tickets.map(async (ticket) => {
        try {
          const base64QR = await generarQRCode(ticket.codigoQR);
          await subirQRASupabase(base64QR, ticket.referencia);
          ticket.pathStorage = base64QR;
        } catch (err) {
          console.error(`❌ Error con el ticket ${ticket.referencia}:`, err);
          // Podrías marcar un estado de error o registrar algo en la base
        }
      })
    );

    const evento = await obtenerEventoActivo();
    //await agregarVendidosaInventario(faseEvento, venta); //hacer esto en el procedimiento almacenado
    console.log("generando ticket");
    const pdfBuffer = await generarTicket(nombreComprador, evento, tickets);
    console.log("ticket generado");
    await enviarTicketAlServidor(
      event,
      pdfBuffer,
      nombreComprador,
      correoComprador,
      evento.nombreEvento
    );
    console.log("correo enviado");

    await cerrarSesion();
  } catch (err) {
    console.error("Error al generar el ticket:", err);
    // Manejar el error según sea necesario
  }
}

async function acreditaPagoYGeneraTickets(event, paymentIntent) {
  let { data: acreditaData, error: acreditaError } = await supabase.rpc(
    "acredita_pago_function",
    { idpagostripe: paymentIntent }
  );

  if (acreditaError) {
    console.error("Error llamando la función:", error);
    return false;
  } else {
    console.log("stp ejectuado correctamente", acreditaData);

    await generarCorreoYTicket(
      event,
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

async function enviarTicketAlServidor(
  event,
  pdfBufferCorreo,
  nombreComprador,
  correoComprador,
  nombreEvento
) {
  console.log("Enviando ticket al servidor...");
  const response = await event.fetch("/api/resend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pdfBuffer: Array.from(new Uint8Array(pdfBufferCorreo)),
      to: correoComprador,
      subject: "Tickets Take Over",
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 30px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #111; text-align: center;">🎟️ ¡Gracias por tu compra, ${nombreComprador}!</h2>

          <p style="font-size: 16px; line-height: 1.6;">
            Adjuntamos tus tickets para el evento <strong>${nombreEvento}</strong> en formato PDF. 
            Recuerda presentarlo en la entrada para validar tu acceso.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Si tienes dudas, contáctanos a <a href="mailto:take.oover.show@gmail.com" style="color: #0077cc;">take.oover.show@gmail.com</a>.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://chat.whatsapp.com/GeVsOcSVbteDq4S8wy72rk" target="_blank" style="text-decoration: none;">
              <div style="display: inline-block; background-color: #25D366; color: white; padding: 12px 20px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                <img src="https://cdn-icons-png.flaticon.com/512/124/124034.png" alt="WhatsApp" style="width: 20px; vertical-align: middle; margin-right: 8px;">
                Únete a la comunidad en WhatsApp
              </div>
            </a>
          </div>

          <div style="text-align: center; margin: 10px 0;">
            <a href="https://www.instagram.com/_takeeover/" target="_blank" style="text-decoration: none;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" style="width: 28px; height: 28px;">
              <p style="margin-top: 5px; font-size: 14px; color: #333;">Síguenos en Instagram</p>
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 14px; color: #777;">Nos vemos en la pista 🕺</p>
            <p style="font-size: 18px; color: #000;"><strong>Equipo Take Over</strong></p>
          </div>

          <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            Este correo fue enviado automáticamente, favor de no responder.
          </p>
        </div>
      </div>
    `,
    }),
  });

  const data = await response.json();
  if (response.ok) {
    console.log("Correo enviado con éxito:", data);
  } else {
    console.error("Error al enviar el correo:", data);
  }
}
