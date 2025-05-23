import Stripe from 'stripe';
//import { eventoId } from '../../../lib/stores/eventoId.js';

export async function POST({ request }) {
    //test
    //const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY);
    //live
    const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);

    const { items } = await request.json();
    console.log('Items:', items);
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: items,
            success_url: `${request.headers.get('origin')}/success`,
            cancel_url: `${request.headers.get('origin')}/eventos/`,
        });

        //console.log('Session creada:', session);
        // Devuelve una respuesta adecuada
        return new Response(JSON.stringify({ id: session.id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
