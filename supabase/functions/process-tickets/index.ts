import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"
import QRCode from "https://esm.sh/qrcode@1.5.3"
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

serve(async (req) => {
  // Manejo de peticiones CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { idPago } = await req.json()
    console.log(`🔹 Procesando tickets asíncronamente para idPago: ${idPago}`)

    // Inicializar cliente admin de Supabase con Service Role Key (salta RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Obtener la venta asociada al pago
    const { data: venta, error: ventaError } = await supabase
      .from('mVenta')
      .select('idventa, cliente_id, idEvento, idFaseEvento, cantidadTickets')
      .eq('idPago', idPago)
      .maybeSingle()

    if (ventaError || !venta) {
      throw new Error(`Error obteniendo venta para idPago ${idPago}: ${ventaError?.message || 'No encontrada'}`)
    }

    // 2. Obtener los datos del cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('mCliente')
      .select('nombre, correo, codigo')
      .eq('cliente_id', venta.cliente_id)
      .maybeSingle()

    if (clienteError || !cliente) {
      throw new Error(`Error obteniendo cliente con ID ${venta.cliente_id}: ${clienteError?.message}`)
    }

    // 3. Obtener datos del evento
    const { data: evento, error: eventoError } = await supabase
      .from('mEvento')
      .select('nombreEvento, descripcion, fechaInicio, fechaFin, venue, direccion, pathImage')
      .eq('idevento', venta.idEvento)
      .maybeSingle()

    if (eventoError || !evento) {
      throw new Error(`Error obteniendo evento con ID ${venta.idEvento}: ${eventoError?.message}`)
    }

    // 4. Obtener la fase del evento
    const { data: fase, error: faseError } = await supabase
      .from('cFaseEvento')
      .select('nombreFace')
      .eq('idFase', venta.idFaseEvento)
      .maybeSingle()

    const nombreFase = fase?.nombreFace || "General"

    // 5. Obtener los tickets generados para esta venta
    const { data: dbTickets, error: ticketsError } = await supabase
      .from('ticket')
      .select('codigoQR, referencia')
      .eq('idVenta', venta.idventa)

    if (ticketsError || !dbTickets || dbTickets.length === 0) {
      throw new Error(`No se encontraron tickets generados para la venta ${venta.idventa}: ${ticketsError?.message}`)
    }

    console.log(`🔹 Tickets encontrados en BD: ${dbTickets.length}. Generando códigos QR...`)

    // 6. Generar e integrar códigos QR en paralelo
    const tickets = await Promise.all(
      dbTickets.map(async (t: any) => {
        const base64QR = await QRCode.toDataURL(t.codigoQR)
        await subirQRASupabase(supabase, base64QR, t.referencia)
        return {
          codigoQR: t.codigoQR,
          referencia: t.referencia,
          nombreFase: nombreFase,
          pathStorage: base64QR // Guardamos el base64 en memoria para inyectarlo en el PDF
        }
      })
    )

    // 7. Generar el PDF en memoria
    console.log("🔹 Compilando PDF...")
    const flyerUrl = await obtenerFlyerUrl(supabase, evento.pathImage)
    const pdfArrayBuffer = await generarTicketPDF(cliente.nombre, evento, tickets, flyerUrl)
    
    // Convertir ArrayBuffer a Base64 usando la librería de codificación nativa de Deno
    const pdfBase64 = encodeBase64(new Uint8Array(pdfArrayBuffer))

    // 8. Obtener la URL pública del flyer para el cuerpo del correo
    const { data: publicImgData } = supabase.storage
      .from("imageEventos")
      .getPublicUrl(evento.pathImage)
    const flyerPublicUrl = publicImgData?.publicUrl || ""

    // 9. Enviar el correo usando la API de Resend
    console.log(`🔹 Enviando correo de tickets a ${cliente.correo}...`)
    const responseMail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Take Over Presenta <tickets@takeover.mx>',
        to: cliente.correo,
        subject: `🎫 Tus tickets para ${evento.nombreEvento}`,
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; padding: 40px 10px; color: #e5e5e5; display: flex; justify-content: center;">
          <div style="max-width: 500px; width: 100%; margin: auto; background: linear-gradient(145deg, #161616 0%, #1e1e1e 100%); padding: 30px; border-radius: 12px; border: 1px solid rgba(86, 253, 184, 0.2); box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
            
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #56fdb8; margin: 0; font-size: 32px; letter-spacing: 2px; text-transform: uppercase;">TAKE OVER</h1>
              <p style="color: #888; margin-top: 5px; font-size: 14px; letter-spacing: 1px;">UNDERGROUND MUSIC EST. 2024</p>
            </div>

            <h2 style="color: #ffffff; text-align: center; margin-bottom: 25px; font-weight: normal;">¡ESTÁS ADENTRO, <strong style="color: #56fdb8;">${cliente.nombre.split(" ")[0]}</strong>!</h2>

            ${
              flyerPublicUrl
                ? `<div style="text-align: center; margin-bottom: 25px;">
              <img src="${flyerPublicUrl}" alt="${evento.nombreEvento}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); object-fit: cover;" />
            </div>`
                : ""
            }

            <p style="font-size: 16px; line-height: 1.6; text-align: center;">
              Hemos procesado tu compra para el evento <strong>${evento.nombreEvento}</strong> con éxito. 
            </p>

            <div style="background-color: rgba(86, 253, 184, 0.05); border-left: 4px solid #56fdb8; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; font-size: 15px;">
                🎟️ <strong>Tus accesos están adjuntos</strong> a este correo en formato PDF. Asegúrate de llevarlos en tu celular el día del evento.
              </p>
            </div>

            ${
              cliente.codigo
                ? `
            <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(86, 253, 184, 0.5); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <h3 style="margin-top: 0; color: #56fdb8; font-size: 16px;">💸 Invita a tus amigos</h3>
              <p style="margin-bottom: 10px; font-size: 14px; color: #aaa;">Comparte tu código único de referido con tus amigos para que compren con precio especial:</p>
              <p style="font-size: 26px; font-weight: bold; color: #fff; text-align: center; letter-spacing: 3px; margin: 0;">${cliente.codigo}</p>
            </div>
            `
                : ""
            }

            <div style="text-align: center; margin: 35px 0 20px 0;">
              <a href="https://chat.whatsapp.com/GeVsOcSVbteDq4S8wy72rk" target="_blank" style="text-decoration: none;">
                <div style="display: inline-block; background-color: transparent; color: #56fdb8; border: 1px solid #56fdb8; padding: 12px 20px; border-radius: 6px; font-size: 15px; font-weight: bold;">
                  📱 Únete a la comunidad en WhatsApp
                </div>
              </a>
            </div>
          </div>
        </div>
        `,
        attachments: [
          {
            filename: `Tickets_${evento.nombreEvento.replace(/\s+/g, '_')}.pdf`,
            content: pdfBase64
          }
        ]
      })
    })

    if (!responseMail.ok) {
      const mailError = await responseMail.text()
      throw new Error(`Error de envío de correo de Resend: ${mailError}`)
    }

    console.log(`✅ Proceso finalizado y correo enviado exitosamente a ${cliente.correo}`)
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200
    })

  } catch (error) {
    console.error("❌ Error en Edge Function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500
    })
  }
})

// Función auxiliar para subir el código QR a Supabase Storage
async function subirQRASupabase(supabaseClient: any, base64Image: string, referencia: number) {
  const base64Data = base64Image.split(",")[1]
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: "image/png" })

  const { error } = await supabaseClient.storage
    .from("codigosQR")
    .upload(`qr_${referencia}.png`, blob, {
      contentType: "image/png",
      upsert: true,
    })

  if (error) {
    console.error(`Error al subir el QR_${referencia} a Storage:`, error.message)
  }
}

// Función auxiliar para traer la imagen del evento en Base64 para el PDF
async function obtenerFlyerUrl(supabaseClient: any, path: string) {
  const { data, error } = await supabaseClient.storage
    .from("imageEventos")
    .createSignedUrl(path, 60 * 60)

  if (error || !data) {
    console.error("Error al generar Signed URL para el flyer:", error?.message)
    return null
  }

  try {
    const response = await fetch(data.signedUrl)
    const arrayBuffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)
    // Usar codificación nativa eficiente en memoria de Deno
    const base64 = encodeBase64(uint8)
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error("Error convirtiendo flyer a Base64:", error.message)
    return null
  }
}

// Función para compilar el PDF de tickets en memoria (idéntica a generarTicket.js)
async function generarTicketPDF(nombre: string, evento: any, tickets: any[], eventoImageDataUrl: string | null) {
  const doc = new jsPDF()
  let altura = 0
  const ticketsPorPagina = 2
  let contadorTickets = 0

  let flyerW = 45
  let flyerH = 45

  if (eventoImageDataUrl) {
    try {
      const imgProps = doc.getImageProperties(eventoImageDataUrl)
      const ratio = imgProps.width / imgProps.height
      flyerW = 45
      flyerH = flyerW / ratio
      if (flyerH > 50) {
        flyerH = 50
        flyerW = flyerH * ratio
      }
    } catch {
      console.log("No se pudo obtener ratio de la imagen en Edge Function")
    }
  }

  for (let i = 0; i < tickets.length; i++) {
    const qrImageDataUrl = tickets[i].pathStorage

    if (contadorTickets === ticketsPorPagina) {
      doc.addPage()
      altura = 0
      contadorTickets = 0
    }

    if (contadorTickets === 0) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("TAKE OVER TICKETS", 10, 20 + altura)

      const options: any = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      const fechaActual = new Date().toLocaleDateString("es-ES", options)

      doc.setFontSize(10)
      doc.text(fechaActual.toUpperCase(), 10, 27 + altura)
      doc.text("Receipt for: " + nombre, 10, 32 + altura)

      doc.setLineWidth(0.5)
      doc.line(10, 36 + altura, 200, 36 + altura)
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    let tituloTicket = evento.nombreEvento + " - " + tickets[i].nombreFase
    if (tituloTicket.length > 55) tituloTicket = tituloTicket.substring(0, 52) + "..."
    doc.text(tituloTicket, 10, 43 + altura)
    
    doc.setFont("helvetica", "normal")
    doc.text("TICKET N. " + (i + 1) + " / " + tickets.length, 160, 43 + altura)

    doc.setFontSize(10)
    doc.setFillColor(230, 230, 230)
    doc.rect(10, 48 + altura, 85, 7, "F")
    doc.rect(100, 48 + altura, 100, 7, "F")
    
    doc.setFont("helvetica", "bold")
    doc.text("Descripción:", 12, 53 + altura)
    doc.text("Referencia: " + tickets[i].referencia, 102, 53 + altura)

    const maxWidth = 125
    doc.setFont("helvetica", "normal")
    let lineasDesc = doc.splitTextToSize(evento.descripcion || "", maxWidth)
    if (lineasDesc.length > 5) {
      lineasDesc = lineasDesc.slice(0, 5)
      lineasDesc[4] = lineasDesc[4].substring(0, lineasDesc[4].length - 3) + "..."
    }
    doc.text(lineasDesc, 10, 62 + altura)

    const fechaEvento = new Date(evento.fechaInicio)
    const optionsFecha: any = { day: "2-digit", month: "2-digit", year: "numeric" }
    const optionsHora: any = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }
    const fechaFormateada = fechaEvento.toLocaleDateString("es-ES", optionsFecha)
    const horaFormateada = fechaEvento.toLocaleTimeString("es-MX", optionsHora) 

    const infoY = 105
    doc.setFont("helvetica", "bold")
    doc.text("Día: ", 10, infoY + altura)
    doc.setFont("helvetica", "normal")
    doc.text(fechaFormateada, 20, infoY + altura)

    doc.setFont("helvetica", "bold")
    doc.text("Hora: ", 10, infoY + 6 + altura)
    doc.setFont("helvetica", "normal")
    doc.text(horaFormateada, 22, infoY + 6 + altura)

    doc.setFont("helvetica", "bold")
    doc.text("Lugar: ", 10, infoY + 12 + altura)
    doc.setFont("helvetica", "normal")
    
    let dLines = doc.splitTextToSize(evento.venue + " - " + evento.direccion, maxWidth)
    if (dLines.length > 2) {
      dLines = dLines.slice(0, 2)
      dLines[1] = dLines[1].substring(0, dLines[1].length - 3) + "..."
    }
    doc.text(dLines, 24, infoY + 12 + altura)

    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.text("*Este evento es exclusivo para personas mayores de 18 años.", 10, infoY + 28 + altura)

    if (eventoImageDataUrl) {
      const fX = 150 + (45 - flyerW) / 2
      doc.addImage(eventoImageDataUrl, "PNG", fX, 60 + altura, flyerW, flyerH) 
    }
    if (qrImageDataUrl) {
      doc.addImage(qrImageDataUrl, "PNG", 152, 110 + altura, 40, 40)
    }

    if (contadorTickets === 0 && i < tickets.length - 1) {
       doc.setDrawColor(180, 180, 180)
       doc.setLineDashPattern([2, 2], 0)
       doc.line(10, 148.5 + altura, 200, 148.5 + altura)
       doc.setLineDashPattern([], 0)
       doc.setDrawColor(0, 0, 0)
    }

    contadorTickets++
    altura += 148.5
  }

  return doc.output("arraybuffer")
}
