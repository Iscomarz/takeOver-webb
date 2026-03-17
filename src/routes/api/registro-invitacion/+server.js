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
            
            // Obtener URL del Flyer
            const { data: publicImgData } = supabase.storage
              .from("imageEventos")
              .getPublicUrl(mEventoFull.pathImage);
            const flyerUrl = publicImgData.publicUrl;

            // D) Enviar Correo Específico de Cortesía + Código de Referido
            await fetch(url.origin + "/api/resend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pdfBuffer: Array.from(new Uint8Array(pdfBuffer)),
                to: correo,
                subject: "🎫 ¡Tienes tu acceso cortesía para " + mEventoFull.nombreEvento + "! - Take Over",
                html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; padding: 40px 10px; color: #e5e5e5; display: flex; justify-content: center;">
                  <div style="max-width: 500px; width: 100%; margin: auto; background: linear-gradient(145deg, #161616 0%, #1e1e1e 100%); padding: 30px; border-radius: 12px; border: 1px solid rgba(86, 253, 184, 0.2); box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
                    
                    <div style="text-align: center; margin-bottom: 20px;">
                      <h1 style="color: #56fdb8; margin: 0; font-size: 32px; letter-spacing: 2px; text-transform: uppercase;">TAKE OVER</h1>
                      <p style="color: #888; margin-top: 5px; font-size: 14px; letter-spacing: 1px;">UNDERGROUND MUSIC EST. 2024</p>
                    </div>

                    <h2 style="color: #ffffff; text-align: center; margin-bottom: 25px; font-weight: normal;">¡ERES VIP, <strong style="color: #56fdb8;">${nombre.split(' ')[0]}</strong>!</h2>

                    <!-- Flyer del evento -->
                    ${flyerUrl ? `<div style="text-align: center; margin-bottom: 25px;">
                      <img src="${flyerUrl}" alt="${mEventoFull.nombreEvento}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); object-fit: cover;" />
                    </div>` : ''}

                    <p style="font-size: 16px; line-height: 1.6; text-align: center;">
                      Tuviste suerte, eres de los afortunados en alcanzar un acceso <strong>Cortesía</strong> para <strong>${mEventoFull.nombreEvento}</strong>. 
                    </p>

                    <div style="background-color: rgba(86, 253, 184, 0.05); border-left: 4px solid #56fdb8; padding: 15px; margin: 25px 0;">
                      <p style="margin: 0; font-size: 15px;">
                        🎟️ <strong>Tus accesos están adjuntos</strong> a este correo en formato PDF. Asegúrate de llevarlos en tu celular el día del evento y llegar temprano.
                      </p>
                    </div>

                    <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(86, 253, 184, 0.5); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                      <h3 style="margin-top: 0; color: #56fdb8; font-size: 16px;">💸 Invita a tus amigos</h3>
                      <p style="margin-bottom: 10px; font-size: 14px; color: #aaa;">Comparte tu código único de referido con tus amigos para que compren con precio especial:</p>
                      <p style="font-size: 26px; font-weight: bold; color: #fff; text-align: center; letter-spacing: 3px; margin: 0;">${cliente.codigo}</p>
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
