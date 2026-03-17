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
    const { idEvento, nombre, correo, enterado, invitarProximos, formatoRave, comentarios } = await request.json();

    if (!nombre || !correo || !enterado || !formatoRave || !idEvento) {
      return json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // 1. Verificar si el usuario ya llenó el formulario para este evento en particular
    const { data: clienteExistente } = await supabase
      .from("mCliente")
      .select("cliente_id")
      .eq("correo", correo)
      .maybeSingle();

    if (clienteExistente) {
      const { data: registroPrevio } = await supabase
        .from("tFormularioInvitacion")
        .select("id")
        .eq("cliente_id", clienteExistente.cliente_id)
        .eq("idEvento", idEvento)
        .maybeSingle();

      if (registroPrevio) {
        return json({ error: "Este correo ya está registrado para este evento." }, { status: 400 });
      }
    }

    // 2. Obtener la info del evento (para límite dinámico de cortesías)
    const { data: eventoInfo, error: evError } = await supabase
      .from("mEvento")
      .select("max_cortesias_formulario, nombreEvento")
      .eq("idevento", idEvento)
      .single();

    if (evError) throw new Error("Evento no encontrado.");
    const limiteCortesia = eventoInfo.max_cortesias_formulario || 50;

    // 3. Insertar/Actualizar el cliente (Origen 3)
    const { data: cliente, error: insertError } = await supabase
      .from("mCliente")
      .upsert({
        nombre,
        correo,
        id_origen: 3,
      }, { onConflict: 'correo' })
      .select("cliente_id, codigo")
      .single();

    if (insertError) {
      console.error(insertError);
      return json({ error: "No se pudo registrar al cliente." }, { status: 400 });
    }

    // Guardar respuestas del formulario
    await supabase.from("tFormularioInvitacion").insert([{
      cliente_id: cliente.cliente_id,
      idEvento: idEvento,
      como_se_entero: enterado,
      formato_musical: formatoRave,
      acepta_promociones: invitarProximos,
      comentarios: comentarios || null
    }]);

    // 4. Contar cuántos usuarios de este formulario ya se registraron a este evento
    const { count, error: countError } = await supabase
      .from("tFormularioInvitacion")
      .select("*", { count: 'exact', head: true })
      .eq("idEvento", idEvento);

    let premio = "referido";
    let codigoAsignado = cliente.codigo;

    // Si está dentro del límite de cortesías, y logramos obtener el count correctamente
    if (!countError && count <= limiteCortesia) {
      premio = "gratis";

      // === FLUJO DE GENERACIÓN DE TICKET AUTOMÁTICO ===
      const dummyStripeId = `cortesia-form-${cliente.cliente_id}-${Date.now()}`;

      // A) Llamar a guardar_pago_venta con MONTO = 0 y FASE "Cortesía"
      const { data: pagoData, error: pagoError } = await supabase.rpc("guardar_pago_venta", {
        monto: 0,
        idtransstripe: dummyStripeId,
        cliente_id: cliente.cliente_id,
        cantidadt: 1,
        descripcionfase: "Cortesía", // Debe existir una fase llamada "Cortesía" en cFaseEvento
        checkout_session_stripe: dummyStripeId
      });

      if (!pagoError) {
        // B) Llamar a acredita_pago_function
        const { data: acreditaData, error: acreditaError } = await supabase.rpc(
          "acredita_pago_function",
          { idpagostripe: dummyStripeId }
        );

        if (!acreditaError && acreditaData && acreditaData.tickets) {
          // C) Generar QR y PDF
          try {
            await Promise.all(acreditaData.tickets.map(async (ticket) => {
              const qrBase64 = await QRCode.toDataURL(ticket.codigoQR);
              
              // Subir QR a Supabase
              const base64Data = qrBase64.split(",")[1];
              const byteCharacters = atob(base64Data);
              const byteArray = new Uint8Array(new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i)));
              const blob = new Blob([byteArray], { type: "image/png" });
              await supabase.storage.from("codigosQR").upload(`qr_${ticket.referencia}.png`, blob, { upsert: true });

              ticket.pathStorage = qrBase64;
            }));

            // Traer el evento de nuevo para la función de generarTicket, asumiendo que necesita el formato completo
            const { data: mEventoFull } = await supabase.from("mEvento").select("*").eq("idevento", idEvento).single();
            
            const pdfBuffer = await generarTicket(nombre, mEventoFull, acreditaData.tickets);
            
            // D) Enviar Correo Específico de Cortesía + Código de Referido
            await fetch(url.origin + "/api/resend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pdfBuffer: Array.from(new Uint8Array(pdfBuffer)),
                to: correo,
                subject: "🎫 ¡Tienes tu acceso cortesía! - Take Over",
                html: `
                <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 30px; color: #333;">
                  <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #111; text-align: center;">🎟️ ¡Felicidades, ${nombre}!</h2>
                    <p style="font-size: 16px; line-height: 1.6;">
                      Eres de los afortunados en alcanzar un acceso <strong>Cortesía</strong> para <strong>${eventoInfo.nombreEvento}</strong>. 
                      Adjuntamos tus tickets en formato PDF. Recuerda presentarlo en la entrada para validar tu acceso.
                    </p>
                    <div style="background-color: #f0fdf4; border-left: 4px solid #56fdb8; padding: 15px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #111;">💸 Invita a tus amigos y gana beneficios</h3>
                      <p style="margin-bottom: 5px;">Comparte tu código único de referido con tus amigos para que compren con precio especial:</p>
                      <p style="font-size: 24px; font-weight: bold; color: #56fdb8; text-align: center; letter-spacing: 2px;">${cliente.codigo}</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                      <p style="font-size: 14px; color: #777;">Nos vemos en la pista 🕺</p>
                      <p style="font-size: 18px; color: #000;"><strong>Equipo Take Over</strong></p>
                    </div>
                  </div>
                </div>
                `
              }),
            });
            console.log("Ticket cortesía enviado a", correo);
          } catch (qrErr) {
            console.error("Error al generar PDF o QR de Cortesía:", qrErr);
          }
        }
      } else {
        console.error("Error al guardar pago de Cortesía:", pagoError);
      }
    }

    // Listo
    return json({ 
      message: "Registro exitoso",
      premio: premio,
      codigo: codigoAsignado
    }, { status: 200 });

  } catch (error) {
    console.error("Error en registro:", error);
    return json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
