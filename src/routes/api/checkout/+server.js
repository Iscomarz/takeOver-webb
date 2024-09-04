import Stripe from 'stripe';

export async function post({ request }) {
    const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY);
    console.log(import.meta.env.VITE_SECRET_STRIPE_KEY);
    const { lineItems } = await request.json();

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            success_url: `${request.headers.get('origin')}/success`,
            cancel_url: `${request.headers.get('origin')}/cancelled`,
        });

        return {
            status: 200,
            body: { id: session.id },
        };
    } catch (err) {
        return {
            status: 500,
            body: { error: err.message },
        };
    }
}
