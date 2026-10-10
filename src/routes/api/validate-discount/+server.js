import { json } from "@sveltejs/kit";
import { supabaseAdmin } from "$lib/server/supabaseAdmin";

// Token-less check: it reveals nothing beyond "valid + percentage" or "invalid".
// Holds are not considered here; reservation happens at create-payment-intent.
const INVALID = { valid: false };

export async function POST({ request }) {
  try {
    const { codigo, idEvento } = await request.json();

    if (
      typeof codigo !== "string" ||
      codigo.trim().length === 0 ||
      codigo.length > 64 ||
      !Number.isInteger(idEvento)
    ) {
      return json(INVALID);
    }

    const { data, error } = await supabaseAdmin.rpc("validar_codigo_descuento", {
      p_codigo: codigo,
      p_id_evento: idEvento,
    });

    if (error) {
      console.error("Error validando código de descuento:", error.message);
      return json(INVALID);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || row.valido !== true) {
      return json(INVALID);
    }

    return json({ valid: true, porcentaje: Number(row.porcentaje) });
  } catch (error) {
    console.error("Error en validate-discount:", error);
    return json(INVALID);
  }
}
