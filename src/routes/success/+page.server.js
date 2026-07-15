import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function load({ url }) {
    const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY
    );

    const free = url.searchParams.get('free');
    const nombre = url.searchParams.get('nombre');
    const correo = url.searchParams.get('correo');
    const redirectStatus = url.searchParams.get('redirect_status');

    // 1. Si el estado de la redirección indica que falló
    if (redirectStatus === 'failed') {
        return {
            error: true,
            mensaje: "Lo sentimos, el pago no pudo completarse. Por favor, intenta de nuevo."
        };
    }

    if (free === 'true') {
        let codigoReferido = null;
        if (correo) {
            const { data } = await supabase
                .from('mCliente')
                .select('codigo')
                .eq('correo', correo)
                .maybeSingle();
            codigoReferido = data?.codigo || null;
        }
        return {
            codigoReferido,
            nombreCliente: nombre || ''
        };
    }

    const sessionId = url.searchParams.get('session_id');
    const paymentIntentId = url.searchParams.get('payment_intent');

    if (!sessionId && !paymentIntentId) {
        return { 
            error: true, 
            mensaje: "No se proporcionaron datos de transacción válidos." 
        };
    }

    const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);

    try {
        let email = null;
        let name = null;
        let paymentStatus = "";

        if (sessionId) {
            // Flujo tradicional: Stripe Checkout Session
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            email = session.customer_details?.email;
            name = session.customer_details?.name;
            paymentStatus = session.payment_status; // "paid" o "unpaid"

            if (paymentStatus === 'unpaid') {
                return {
                    error: true,
                    mensaje: "El pago no ha sido completado o fue rechazado."
                };
            }
        } else if (paymentIntentId) {
            // Flujo embebido: Stripe Payment Intent
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            email = paymentIntent.metadata?.correo || paymentIntent.charges?.data[0]?.billing_details?.email;
            name = paymentIntent.metadata?.nombre || paymentIntent.charges?.data[0]?.billing_details?.name;
            paymentStatus = paymentIntent.status; // "succeeded", "requires_payment_method", etc.

            if (paymentStatus !== 'succeeded') {
                return {
                    error: true,
                    mensaje: `El pago no pudo completarse. Estado actual: ${paymentStatus}`
                };
            }
        }

        if (!email) return { codigoReferido: null };

        // 3. Buscar el código en mCliente
        let cliente = null;
        for (let i = 0; i < 3; i++) {
            const { data } = await supabase
                .from('mCliente')
                .select('codigo')
                .eq('correo', email)
                .maybeSingle();
            
            if (data?.codigo) {
                cliente = data;
                break;
            }
            // Pequeña espera en caso de que el webhook aún se esté procesando
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return {
            codigoReferido: cliente?.codigo || null,
            nombreCliente: name
        };
    } catch (err) {
        console.error('Error recuperando datos del pago:', err);
        return { 
            error: true, 
            mensaje: "Ocurrió un problema verificando tu pago. Por favor contacta a soporte." 
        };
    }
}
