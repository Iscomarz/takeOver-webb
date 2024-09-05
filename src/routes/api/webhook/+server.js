import Stripe from 'stripe';
import { json } from '@sveltejs/kit';

const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY);

export async function POST({ request }) {
    const sig = request.headers.get('stripe-signature');
    const body = await request.text();

    const endpointSecret = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verificar que el webhook proviene de Stripe
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return json({ error: 'Webhook signature verification failed.' }, { status: 400 });
    }

    // Manejar el evento de pago completado
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Obtener detalles como el email del comprador
        const email = session.customer_details.email;
        const amount = session.amount_total / 100;  // Cantidad pagada en la moneda menor (p. ej., centavos)
        const currency = session.currency;
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

        console.log('Line items: ', lineItems);

        console.log(`Pago completado. Email: ${email}, Monto: ${amount} ${currency}`);

        lineItems.data.forEach(item => {
            console.log(`Producto: ${item.description}, Cantidad: ${item.quantity}`);
        });
        
        // Mandar informacion a web service donde se guardara en base de datos
    }

    return json({ received: true });
}
