import { json } from "@sveltejs/kit";
import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY);

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    //console.log('endpoint');
    try {
        const products = await stripe.products.list({ active: true, limit: 100 });
    
        // Traer los precios asociados a cada producto
        const productsWithPrices = await Promise.all(
          products.data.map(async (product) => {
            const prices = await stripe.prices.list({
              product: product.id,
              active: true
            });
    
            return { ...product, prices: prices.data };
          })
        );
    
        return json(productsWithPrices);
      } catch (error) {
        return json({ error: error.message }, { status: 500 });
      }
}