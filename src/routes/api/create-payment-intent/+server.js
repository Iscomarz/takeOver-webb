import Stripe from 'stripe';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    //live
    const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);

    const { amount, tickets, metadata, nombreEvento, nombreFase } = await request.json();
    
    console.log('Creating Payment Intent:', { amount, tickets, metadata, nombreEvento, nombreFase });
    
    let amountInCents = 0;
    const realPrices = {};

    if (tickets && tickets.length > 0) {
        try {
            const resolvedPrices = await Promise.all(
                tickets.map(async (ticket) => {
                    if (ticket.idPrecioStripe && ticket.cantidad > 0) {
                        try {
                            const price = await stripe.prices.retrieve(ticket.idPrecioStripe);
                            if (price && price.unit_amount !== null && price.unit_amount !== undefined) {
                                return {
                                    idPrecioStripe: ticket.idPrecioStripe,
                                    unitAmount: price.unit_amount,
                                    cantidad: ticket.cantidad,
                                    realPrice: price.unit_amount / 100
                                };
                            }
                        } catch (stripeErr) {
                            console.error(`Error recuperando precio ${ticket.idPrecioStripe} de Stripe:`, stripeErr);
                        }
                    }
                    // Fallback al precio local si falla o no tiene idPrecioStripe
                    return {
                        idPrecioStripe: ticket.idPrecioStripe || null,
                        unitAmount: Math.round(ticket.precio * 100),
                        cantidad: ticket.cantidad,
                        realPrice: ticket.precio
                    };
                })
            );

            for (const item of resolvedPrices) {
                amountInCents += item.unitAmount * item.cantidad;
                if (item.idPrecioStripe) {
                    realPrices[item.idPrecioStripe] = item.realPrice;
                }
            }
        } catch (e) {
            console.error("Error al resolver precios reales de Stripe:", e);
            amountInCents = Math.round(amount * 100);
        }
    } else {
        amountInCents = Math.round(amount * 100);
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
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
            paymentIntentId: paymentIntent.id,
            realPrices,
            totalPriceReal: amountInCents / 100
        });
    } catch (err) {
        console.error('Error creating payment intent:', err);
        return json({ error: err.message }, { status: 500 });
    }
}

