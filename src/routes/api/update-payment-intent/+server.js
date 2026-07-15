import Stripe from "stripe";
import { json } from "@sveltejs/kit";

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

    console.log("Updating Payment Intent metadata:", paymentIntentId, metadata);

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: metadata,
    });

    return json({ success: true });
  } catch (err) {
    console.error("Error updating payment intent:", err);
    return json({ error: err.message }, { status: 500 });
  }
}
