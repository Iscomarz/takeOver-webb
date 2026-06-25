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
      //Esperamos a que se complete el pago antes de preguntar por el estado
    await new Promise(resolve => setTimeout(resolve, 2000));

      if (await existePago(session.payment_intent)) {
        console.log("existe pago");
        await insertaVenta(session);

        if (await acreditaPagoYGeneraTickets(event, session.payment_intent)) {
          // Acreditar código de descuento si existe
          await acreditarCodigoDescuento(session);
          return json({ message: "Pago guardado exitoso" }, { status: 200 });
        }
      } else {
        if (await capturarCheckOut(session, stripeEventId, event, session.payment_intent)) {
          // Acreditar código de descuento si existe
          await acreditarCodigoDescuento(session);
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
        //Este procedimiento acredita el pago en mPago y genera los tickets en la tabla ticket
        if (await acreditaPagoYGeneraTickets(event, session.id)) {
          // Acreditar código de descuento desde metadata del Payment Intent
          if (session.metadata?.codigoDescuento) {
            await acreditarCodigoDescuentoDesdeMetadata(session.metadata);
          }
          return json({ message: "Pago acreditado" }, { status: 200 });
        }
      } else {
        console.log("no existe pago");
        // Guardar pago desde Payment Intent (nuevo checkout embebido)
        await insertaPagoDesdePaymentIntent(session);
        return json({ message: "Pago guardado exitoso" }, { status: 200 });
      }
    case "payment_intent.created":
      console.log("Payment Intent creado, guardando información inicial...");
      // Cuando se crea un Payment Intent desde el nuevo checkout
      if (session.metadata?.nombre && session.metadata?.correo) {
        await guardarPaymentIntentInicial(session);
      }
      return json({ message: "Payment Intent registrado" }, { status: 200 });
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
  const phone = sessionCheckout.customer_details.phone;
  const amount = sessionCheckout.amount_total / 100;
  const codigoReferido = sessionCheckout.metadata?.codigoReferido;

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

  // Buscar o crear cliente
  const clienteId = await getOrCreateCliente(name || email, email, phone, codigoReferido);

  console.log("checkout_session_stripe", stripeEventId);
  // Llamada al procedimiento almacenado
  const { data, error } = await supabase.rpc("guardar_pago_venta", {
    cantidadt: cantidadT,
    cliente_id: clienteId,
    descripcionfase: descripcionFase,
    idtransstripe: sessionCheckout.payment_intent,
    monto: amount,
    checkout_session_stripe: stripeEventId,
  });

  if(amount == 0 && cantidadT != 0){
    console.log("Entro a acreditar y generar tickets")
    await acreditaPagoYGeneraTickets(event, stripeEventId);
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

async function obtenerEvento(idEvento) {
  let { data: mEvento, error } = await supabase
    .from("mEvento")
    .select("*")
    .eq("idevento", idEvento);

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
  correoComprador,
  idEvento
) {
  console.log("🔹 Iniciando...");
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

    const evento = await obtenerEvento(idEvento);
    //await agregarVendidosaInventario(faseEvento, venta); //hacer esto en el procedimiento almacenado
    console.log("generando ticket");
    const pdfBuffer = await generarTicket(nombreComprador, evento, tickets);
    console.log("ticket generado");
    await enviarTicketAlServidor(
      event,
      pdfBuffer,
      nombreComprador,
      correoComprador,
      evento
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
      acreditaData.correoComprador,
      acreditaData.idEvento
    );
    return true;
  }
}

async function insertaVenta(sessionCheckout) {
  const email = sessionCheckout.customer_details.email;
  const name = sessionCheckout.customer_details.name;
  const phone = sessionCheckout.customer_details.phone;
  const codigoReferido = sessionCheckout.metadata?.codigoReferido;

  const lineItems = await stripe.checkout.sessions.listLineItems(
    sessionCheckout.id
  );
  let cantidadT = 0;
  let descripcionFase = "";
  lineItems.data.forEach((item) => {
    descripcionFase = item.description;
    cantidadT = item.quantity;
  });

  // Buscar o crear cliente
  const clienteId = await getOrCreateCliente(name || email, email, phone, codigoReferido);

  const { data, error } = await supabase.rpc("insertaventa", {
    cliente_id: clienteId,
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
  evento
) {
  console.log("Enviando ticket al servidor...");

  // Buscar el código de referido del cliente
  const { data: cliente } = await supabase
    .from("mCliente")
    .select("codigo")
    .eq("correo", correoComprador)
    .maybeSingle();

  // Obtener la URL pública del flyer del evento
  const { data: publicImgData } = supabase.storage
    .from("imageEventos")
    .getPublicUrl(evento.pathImage);
  const flyerUrl = publicImgData.publicUrl;

  const response = await event.fetch("/api/resend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pdfBuffer: Array.from(new Uint8Array(pdfBufferCorreo)),
      to: correoComprador,
      subject: "🎫 Tus tickets para " + evento.nombreEvento,
      html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; padding: 40px 10px; color: #e5e5e5; display: flex; justify-content: center;">
        <div style="max-width: 500px; width: 100%; margin: auto; background: linear-gradient(145deg, #161616 0%, #1e1e1e 100%); padding: 30px; border-radius: 12px; border: 1px solid rgba(86, 253, 184, 0.2); box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
          
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #56fdb8; margin: 0; font-size: 32px; letter-spacing: 2px; text-transform: uppercase;">TAKE OVER</h1>
            <p style="color: #888; margin-top: 5px; font-size: 14px; letter-spacing: 1px;">UNDERGROUND MUSIC EST. 2024</p>
          </div>

          <h2 style="color: #ffffff; text-align: center; margin-bottom: 25px; font-weight: normal;">¡ESTÁS ADENTRO, <strong style="color: #56fdb8;">${nombreComprador.split(' ')[0]}</strong>!</h2>

          <!-- Flyer del evento -->
          ${flyerUrl ? `<div style="text-align: center; margin-bottom: 25px;">
            <img src="${flyerUrl}" alt="${evento.nombreEvento}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); object-fit: cover;" />
          </div>` : ''}

          <p style="font-size: 16px; line-height: 1.6; text-align: center;">
            Hemos procesado tu compra para el evento <strong>${evento.nombreEvento}</strong> con éxito. 
          </p>

          <div style="background-color: rgba(86, 253, 184, 0.05); border-left: 4px solid #56fdb8; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; font-size: 15px;">
              🎟️ <strong>Tus accesos están adjuntos</strong> a este correo en formato PDF. Asegúrate de llevarlos en tu celular el día del evento.
            </p>
          </div>

          ${cliente && cliente.codigo ? `
          <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(86, 253, 184, 0.5); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #56fdb8; font-size: 16px;">💸 Invita a tus amigos</h3>
            <p style="margin-bottom: 10px; font-size: 14px; color: #aaa;">Comparte tu código único de referido con tus amigos para que compren con precio especial:</p>
            <p style="font-size: 26px; font-weight: bold; color: #fff; text-align: center; letter-spacing: 3px; margin: 0;">${cliente.codigo}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 35px 0 20px 0;">
            <a href="https://chat.whatsapp.com/GeVsOcSVbteDq4S8wy72rk" target="_blank" style="text-decoration: none;">
              <div style="display: inline-block; background-color: transparent; color: #56fdb8; border: 1px solid #56fdb8; padding: 12px 20px; border-radius: 6px; font-size: 15px; font-weight: bold;">
                📱 Únete a la comunidad en WhatsApp
              </div>
            </a>
          </div>

          <div style="text-align: center; margin: 20px 0 30px 0;">
            <a href="https://www.instagram.com/_takeeover/" target="_blank" style="text-decoration: none; color: #aaa; font-size: 14px;">
              Síguenos en Instagram @_takeeover
            </a>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 14px; color: #666; margin: 0;">Nos vemos en la pista 🕺</p>
            <p style="font-size: 16px; color: #fff; margin-top: 5px;"><strong>Equipo Take Over</strong></p>
          </div>

          <hr style="margin-top: 30px; border: none; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="font-size: 11px; color: #555; text-align: center; margin-top: 15px;">
            Si tienes dudas, contáctanos a <a href="mailto:take.oover.show@gmail.com" style="color: #56fdb8;">take.oover.show@gmail.com</a>.<br/>
            Este correo fue enviado automáticamente.
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

// Función para acreditar código de descuento
async function acreditarCodigoDescuento(session) {
  try {
    const codigoDescuento = session.metadata?.codigoDescuento;
    
    if (codigoDescuento) {
      console.log(`Acreditando código de descuento: ${codigoDescuento}`);
      
      const { data, error } = await supabase
        .from("codigosDescuento")
        .update({ 
          acreditado: true, 
          fecha_acreditado: new Date().toISOString(),
          session_id: session.id 
        })
        .eq("codigo", codigoDescuento);

      if (error) {
        console.error("Error al acreditar código de descuento:", error);
        return false;
      } else {
        console.log("Código de descuento acreditado exitosamente:", codigoDescuento);
        return true;
      }
    }
    return true; // No hay código para acreditar
  } catch (error) {
    console.error("Error en acreditarCodigoDescuento:", error);
    return false;
  }
}

// Función para acreditar código de descuento desde metadata
async function acreditarCodigoDescuentoDesdeMetadata(metadata) {
  try {
    const codigoDescuento = metadata?.codigoDescuento;
    
    if (codigoDescuento) {
      console.log(`Acreditando código de descuento desde metadata: ${codigoDescuento}`);
      
      const { data, error } = await supabase
        .from("codigosDescuento")
        .update({ 
          acreditado: true, 
          fecha_acreditado: new Date().toISOString()
        })
        .eq("codigo", codigoDescuento);

      if (error) {
        console.error("Error al acreditar código de descuento:", error);
        return false;
      } else {
        console.log("Código de descuento acreditado exitosamente:", codigoDescuento);
        return true;
      }
    }
    return true;
  } catch (error) {
    console.error("Error en acreditarCodigoDescuentoDesdeMetadata:", error);
    return false;
  }
}

// Función para guardar Payment Intent inicial (del checkout embebido)
async function guardarPaymentIntentInicial(paymentIntent) {
  try {
    console.log("Guardando Payment Intent inicial:", paymentIntent.id);
    const metadata = paymentIntent.metadata || {};
    
    const { data, error } = await supabase.from("mPago").insert([
      {
        idFormaPago: 3,
        cantidad: paymentIntent.amount / 100,
        fechaPago: new Date(),
        acreditado: false,
        idTransaccionStripe: paymentIntent.id,
      },
    ]);

    if (error) {
      console.error("Error al guardar Payment Intent inicial:", error);
      return false;
    } else {
      console.log("Payment Intent inicial guardado exitosamente");
      return true;
    }
  } catch (error) {
    console.error("Error en guardarPaymentIntentInicial:", error);
    return false;
  }
}

// Función para insertar pago desde Payment Intent (checkout embebido)
async function insertaPagoDesdePaymentIntent(paymentIntent) {
  try {
    console.log("Insertando pago desde Payment Intent:", paymentIntent.id);
    const metadata = paymentIntent.metadata || {};
    const nombre = metadata.nombre || paymentIntent.charges?.data[0]?.billing_details?.name || "Cliente";
    const correo = metadata.correo || paymentIntent.charges?.data[0]?.billing_details?.email || "";
    const cantidad = parseInt(metadata.cantidad) || 1;
    const descripcionFase = metadata.ticketsDescripcion || metadata.nombreFase || "Tickets";
    const amount = paymentIntent.amount / 100;

    console.log("Datos extraídos del Payment Intent:", { nombre, correo, cantidad, descripcionFase, amount });

    // Para la integración con la base de datos de la nueva arquitectura, obtenemos o creamos el cliente
    const clienteId = await getOrCreateCliente(nombre || correo, correo, null, metadata.codigoReferido);

    // Llamada al procedimiento almacenado
    const { data, error } = await supabase.rpc("guardar_pago_venta", {
      cantidadt: cantidad,
      cliente_id: clienteId,
      descripcionfase: descripcionFase,
      idtransstripe: paymentIntent.id,
      monto: amount,
      checkout_session_stripe: paymentIntent.id, // Usamos el payment intent ID
    });

    if (error) {
      console.error("Error al ejecutar el procedimiento:", error);
      return false;
    } else {
      console.log("Pago desde Payment Intent guardado exitosamente:", data);
      return true;
    }
  } catch (error) {
    console.error("Error en insertaPagoDesdePaymentIntent:", error);
    return false;
  }
}

// Función auxiliar para obtener o crear un cliente
async function getOrCreateCliente(nombre, correo, telefono, codigoReferido) {
  console.log("Buscando o creando cliente:", correo);
  
  // 1. Intentar buscar el cliente por correo
  const { data: cliente, error: searchError } = await supabase
    .from("mCliente")
    .select("cliente_id, codigo")
    .eq("correo", correo)
    .maybeSingle();

  if (cliente) {
    console.log("Cliente encontrado con ID:", cliente.cliente_id);
    return cliente.cliente_id;
  }

  // 2. Si no existe, averiguar el origen a partir del código referido (si existe)
  let id_origen = 4; // Por defecto: Venta Directa
  let id_referidor = null;
  
  if (codigoReferido) {
    const { data: refCliente } = await supabase
      .from("mCliente")
      .select("cliente_id")
      .eq("codigo", codigoReferido)
      .maybeSingle();
      
    if (refCliente) {
      id_origen = 1; // 1 = Cliente
      id_referidor = refCliente.cliente_id;
    } else {
      // Podrías extender esto buscando en mpromotor, si no halló en mCliente:
      // const { data: promotor } = await supabase.from("mpromotor").select("id").eq("codigo", codigoReferido).maybeSingle();
      // if (promotor) { id_origen = 2; id_referidor = promotor.id; }
    }
  }

  // 3. Crearlo
  console.log("Cliente no encontrado, creando uno nuevo...");
  const { data: nuevoCliente, error: insertError } = await supabase
    .from("mCliente")
    .insert([{ 
      nombre: nombre || correo, 
      correo: correo, 
      telefono: telefono || null,
      id_origen: id_origen,
      id_referidor: id_referidor
    }])
    .select("cliente_id")
    .single();

  if (insertError) {
    console.error("Error al crear cliente:", insertError);
    // En caso de error, podrías lanzar una excepción o manejarlo según tu flujo
    throw new Error(`No se pudo crear o recuperar el cliente: ${insertError.message}`);
  }

  console.log("Nuevo cliente creado con ID:", nuevoCliente.cliente_id);
  return nuevoCliente.cliente_id;
}
