import { createClient } from "@supabase/supabase-js";
import { json } from "@sveltejs/kit";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY
);

// Email validation helper
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export async function POST({ request, url, fetch }) {
  try {
    const { email } = await request.json();

    if (!email || !validateEmail(email)) {
      return json({ success: false, message: "Invalid email address" }, { status: 400 });
    }

    // Check duplicate in tListaEspera
    const { data: existing, error: checkError } = await supabase
      .from("tListaEspera")
      .select("correo")
      .eq("correo", email)
      .maybeSingle();

    if (checkError) {
      console.error("Database error checking duplicates:", checkError);
      return json({ success: false, message: "Internal server error" }, { status: 500 });
    }

    if (existing) {
      return json({ success: false, message: "Email already registered" }, { status: 409 });
    }

    // Insert new registration
    const { error: insertError } = await supabase
      .from("tListaEspera")
      .insert([{ correo: email }]);

    if (insertError) {
      console.error("Database error inserting waitlist record:", insertError);
      return json({ success: false, message: "Internal server error" }, { status: 500 });
    }

    // Send confirmation welcome email
    try {
      const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; padding: 40px 10px; color: #e5e5e5; display: flex; justify-content: center;">
        <div style="max-width: 500px; width: 100%; margin: auto; background: linear-gradient(145deg, #161616 0%, #1e1e1e 100%); padding: 30px; border-radius: 12px; border: 1px solid rgba(86, 253, 184, 0.2); box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
          
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #56fdb8; margin: 0; font-size: 32px; letter-spacing: 2px; text-transform: uppercase;">TAKE OVER</h1>
            <p style="color: #888; margin-top: 5px; font-size: 14px; letter-spacing: 1px;">UNDERGROUND MUSIC EST. 2024</p>
          </div>

          <h2 style="color: #ffffff; text-align: center; margin-bottom: 25px; font-weight: normal;">¡Te has unido a la lista de espera!</h2>

          <p style="font-size: 16px; line-height: 1.6; text-align: center;">
            Tu correo ha sido registrado en nuestro sistema. Te notificaremos de inmediato en cuanto anunciemos el próximo evento.
          </p>

          <div style="background-color: rgba(86, 253, 184, 0.05); border-left: 4px solid #56fdb8; padding: 15px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; font-size: 15px; color: #56fdb8;">
              🔊 Prepárate para lo que viene.
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
      `;

      await fetch(url.origin + "/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "🔊 Te has unido a la lista de espera - Take Over",
          html: emailHtml
        })
      });
    } catch (emailErr) {
      console.error("Failed to send waitlist email:", emailErr);
    }

    return json({ success: true, message: "Subscribed successfully" }, { status: 200 });
  } catch (err) {
    console.error("Waitlist API handler error:", err);
    return json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
