import Stripe from "stripe";
import { json } from "@sveltejs/kit";
import supabase from "$lib/supabase";
import { generarTicket } from "../utils/generarTicket.js";

let pago = {
  idFormaPago: 3,
  cantidad: 0,
  fechaPago: new Date(),
  acreditado: false,
  fechaAcreditacion: null,
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

const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY);

export async function POST({ request }) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  const endpointSecret = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verificar que el webhook proviene de Stripe
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return json(
      { error: "Webhook signature verification failed." },
      { status: 400 }
    );
  }

  // Manejar el evento de pago completado
  if (event.type === "checkout.session.completed") {
    await login();
    const session = event.data.object;

    // Obtener detalles como el email del comprador
    const email = session.customer_details.email;
    const name = session.customer_details.name;
    const amount = session.amount_total / 100; // Cantidad pagada en la moneda menor (p. ej., centavos)
    const currency = session.currency;
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    console.log("Line items: ", lineItems);

    console.log(
      `Pago completado. Email: ${email}, Monto: ${amount} ${currency}`
    );

    pago.acreditado = true;
    pago.fechaAcreditacion = new Date();
    pago.cantidad = amount;
    const idPagoVenta = await guardaPago(pago);

    let descripcion = "";
    let cantidad = 0;
    lineItems.data.forEach((item) => {
      descripcion = item.description;
      cantidad = item.quantity;
      console.log(`Producto: ${descripcion}, Cantidad: ${cantidad}`);
    });

    venta.idEvento = await obtenerEventoActivo();
    venta.nombre = name;
    venta.correo = email;
    venta.cantidadTickets = cantidad;
    venta.idPago = idPagoVenta;
    venta.idFaseEvento = await obtenerFaseEvento(venta.idEvento, descripcion);
    guardaVenta(venta);

    await generarTicket(venta);

  }
  await cerrarSesion();
  return json({ received: true });
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
  }
}

async function obtenerEventoActivo() {
  let { data: mEvento, error } = await supabase
    .from("mEvento")
    .select("idevento")
    .eq("activo", true);

  if (error) {
    console.error("Error obteniendo los eventos activos:", error.message);
    return;
  }
  return mEvento.length > 0 ? mEvento[0].idevento : null;
}

async function login() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.GMAIL_ADDRESS,
      password: process.env.SUPABASE_PASSWORD,
    });

    if (error) {
      throw new Error(error.message);
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
    .select("idFase")
    .eq("idEvento", idEvento)
    .eq("nombreFace", descripcion);

  if (error) {
    console.error("No se pudo traer la fase", error.message);
    cerrarSesion();
  } else {
    return cFaseEvento[0].idFase;
  }
}
