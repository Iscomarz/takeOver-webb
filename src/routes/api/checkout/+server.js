import Stripe from 'stripe';
//import { eventoId } from '../../../lib/stores/eventoId.js';

export async function POST({ request }) {
    //test
    //const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY);
    //live
    const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);

    const { items, metadata } = await request.json();
    console.log('Items:', items);
    console.log('Metadata:', metadata);
    
    try {
        const sessionConfig = {
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: items,
            success_url: `${request.headers.get('origin')}/success`,
            cancel_url: `${request.headers.get('origin')}/eventos/`,
        };

        // Agregar metadata si existe código de descuento
        if (metadata?.codigoDescuento) {
            sessionConfig.metadata = {
                codigoDescuento: metadata.codigoDescuento
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

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
