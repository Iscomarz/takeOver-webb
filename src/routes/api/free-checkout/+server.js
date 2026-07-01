import { createClient } from "@supabase/supabase-js";
import { json } from "@sveltejs/kit";
import { generarTicket } from "$lib/utils/generarTicket";
import QRCode from "qrcode";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY
);

export async function POST({ request, url, fetch }) {
  try {
    const { nombre, correo, cantidad, tickets, nombreEvento, idEvento } = await request.json();

    if (!nombre || !correo || !cantidad || !tickets || !idEvento) {
      return json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // 1. Obtener o crear el cliente
    const { data: cliente, error: searchError } = await supabase
      .from("mCliente")
      .select("cliente_id")
      .eq("correo", correo)
      .maybeSingle();

    let clienteId;
    if (cliente) {
      clienteId = cliente.cliente_id;
    } else {
      const { data: nuevoCliente, error: insertError } = await supabase
        .from("mCliente")
        .insert([{ nombre, correo, id_origen: 4 }])
        .select("cliente_id")
        .single();
        
      if (insertError) {
        console.error("Error al crear cliente:", insertError);
        throw new Error("No se pudo registrar al cliente.");
      }
      clienteId = nuevoCliente.cliente_id;
    }

    // 2. Generar un ID de transacción ficticio para el registro gratis
    const dummyStripeId = `free-checkout-${clienteId}-${Date.now()}`;
    const selectedTicket = tickets.find(t => t.cantidad > 0) || { nombreFace: "Ticket Gratis" };

    // 3. Registrar la venta en la base de datos (RPC)
    const { data: pagoData, error: pagoError } = await supabase.rpc("guardar_pago_venta", {
      monto: 0,
      idtransstripe: dummyStripeId,
      cliente_id: clienteId,
      cantidadt: cantidad,
      descripcionfase: selectedTicket.nombreFace || selectedTicket.nombreFase || "Cortesía",
      checkout_session_stripe: dummyStripeId
    });

    if (pagoError) {
      console.error("Error guardando pago de cortesía:", pagoError);
      return json({ error: "Error al registrar la transacción gratis" }, { status: 400 });
    }

    // 4. Acreditar y generar tickets
    const { data: acreditaData, error: acreditaError } = await supabase.rpc(
      "acredita_pago_function",
      { idpagostripe: dummyStripeId }
    );

    if (acreditaError) {
      console.error("Error al acreditar pago de cortesía:", acreditaError);
      return json({ error: "Error al acreditar tickets" }, { status: 400 });
    }

    // 5. Generar QRs e imágenes para enviar por correo
    if (acreditaData && acreditaData.tickets) {
      try {
        await Promise.all(acreditaData.tickets.map(async (ticket) => {
          const qrBase64 = await QRCode.toDataURL(ticket.codigoQR);
          const base64Data = qrBase64.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteArray = new Uint8Array(new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i)));
          const blob = new Blob([byteArray], { type: "image/png" });
          await supabase.storage.from("codigosQR").upload(`qr_${ticket.referencia}.png`, blob, { upsert: true });
          ticket.pathStorage = qrBase64;
        }));

        const { data: mEventoFull } = await supabase.from("mEvento").select("*").eq("idevento", idEvento).single();
        const pdfBuffer = await generarTicket(nombre, mEventoFull, acreditaData.tickets);

        // Obtener la URL pública del flyer del evento
        const { data: publicImgData } = supabase.storage
          .from("imageEventos")
          .getPublicUrl(mEventoFull.pathImage);
        const flyerUrl = publicImgData.publicUrl;

        // Enviar Correo
        await fetch(url.origin + "/api/resend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfBuffer: Array.from(new Uint8Array(pdfBuffer)),
            to: correo,
            subject: "🎫 Tus accesos gratis para " + (nombreEvento || mEventoFull.nombreEvento),
            html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; padding: 40px 10px; color: #e5e5e5; display: flex; justify-content: center;">
              <div style="max-width: 500px; width: 100%; margin: auto; background: linear-gradient(145deg, #161616 0%, #1e1e1e 100%); padding: 30px; border-radius: 12px; border: 1px solid rgba(86, 253, 184, 0.2); box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
                
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #56fdb8; margin: 0; font-size: 32px; letter-spacing: 2px; text-transform: uppercase;">TAKE OVER</h1>
                  <p style="color: #888; margin-top: 5px; font-size: 14px; letter-spacing: 1px;">UNDERGROUND MUSIC EST. 2024</p>
                </div>

                <h2 style="color: #ffffff; text-align: center; margin-bottom: 25px; font-weight: normal;">¡ESTÁS ADENTRO, <strong style="color: #56fdb8;">${nombre.split(' ')[0]}</strong>!</h2>

                ${flyerUrl ? `<div style="text-align: center; margin-bottom: 25px;">
                  <img src="${flyerUrl}" alt="${mEventoFull.nombreEvento}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); object-fit: cover;" />
                </div>` : ''}

                <p style="font-size: 16px; line-height: 1.6; text-align: center;">
                  Tus tickets cortesía para el evento <strong>${nombreEvento || mEventoFull.nombreEvento}</strong> han sido generados con éxito.
                </p>

                <div style="background-color: rgba(86, 253, 184, 0.05); border-left: 4px solid #56fdb8; padding: 15px; margin: 25px 0;">
                  <p style="margin: 0; font-size: 15px;">
                    🎟️ <strong>Tus accesos están adjuntos</strong> a este correo en formato PDF. Asegúrate de llevarlos en tu celular el día del evento.
                  </p>
                </div>

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
              </div>
            </div>
            `
          })
        });
      } catch (err) {
        console.error("Error al procesar el envío de tickets gratis:", err);
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error en free-checkout:", error);
    return json({ error: error.message }, { status: 500 });
  }
}
