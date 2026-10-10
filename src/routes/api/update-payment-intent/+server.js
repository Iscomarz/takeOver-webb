import Stripe from "stripe";
import { json } from "@sveltejs/kit";

// Only buyer identity may be updated from the client. Discount and
// reservation fields are server-owned and must never be overwritten here.
const METADATA_ALLOWLIST = ["nombre", "correo"];

export async function POST({ request }) {
  const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);

  try {
    const { paymentIntentId, metadata } = await request.json();

    if (!paymentIntentId || !metadata) {
      return json(
        { error: "Faltan datos requeridos (paymentIntentId o metadata)" },
        { status: 400 },
      );
    }

    const allowedMetadata = {};
    for (const key of METADATA_ALLOWLIST) {
      const value = metadata[key];
      if (value === undefined || value === null) continue;
      allowedMetadata[key] = String(value).slice(0, 500);
    }

    console.log("Updating Payment Intent metadata:", paymentIntentId, allowedMetadata);

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: allowedMetadata,
    });

    return json({ success: true });
  } catch (err) {
    console.error("Error updating payment intent:", err);
    return json({ error: err.message }, { status: 500 });
  }
}
