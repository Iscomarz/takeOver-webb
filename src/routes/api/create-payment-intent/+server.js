import Stripe from 'stripe';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    //live
    const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);

    const { amount, metadata, nombreEvento, nombreFase } = await request.json();
    
    console.log('Creating Payment Intent:', { amount, metadata, nombreEvento, nombreFase });
    
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe usa centavos
            currency: 'mxn',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                ...metadata,
                nombreEvento: nombreEvento || '',
                nombreFase: nombreFase || ''
            },
            description: `${nombreEvento} - ${nombreFase}`,
        });

        return json({ 
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (err) {
        console.error('Error creating payment intent:', err);
        return json({ error: err.message }, { status: 500 });
    }
}
