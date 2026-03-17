import { createClient } from "@supabase/supabase-js";
import { json } from "@sveltejs/kit";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY
);

export async function POST({ request }) {
  try {
    const { codigo, correo } = await request.json();

    if (!codigo || !correo) {
      return json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // 1. Verificar si el código existe en mCliente (o promotor en el futuro)
    const { data: referidor } = await supabase
      .from("mCliente")
      .select("id, codigo")
      .eq("codigo", codigo)
      .maybeSingle();

    if (!referidor) {
      return json({ error: "El código de referido no existe." }, { status: 404 });
    }

    // 2. Verificar que no sea un auto-referido
    const { data: comprador } = await supabase
      .from("mCliente")
      .select("id, codigo")
      .eq("correo", correo)
      .maybeSingle();

    if (comprador && comprador.codigo === codigo) {
      return json(
        { error: "No puedes usar tu propio código." },
        { status: 403 }
      );
    }

    // Todo bien, el código es válido
    return json({ message: "Código válido", idReferidor: referidor.id });
  } catch (error) {
    console.error("Error validando referido:", error);
    return json({ error: "Error del servidor" }, { status: 500 });
  }
}
