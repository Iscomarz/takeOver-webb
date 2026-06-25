import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function load({ url }) {
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return { codigoReferido: null };

    const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);
    const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY
    );

    try {
        // 1. Obtener la sesión de Stripe para sacar el email
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const email = session.customer_details?.email;

        if (!email) return { codigoReferido: null };

        // 2. Buscar el código en mCliente
        // Podría ser que el webhook aún no termine, así que intentamos un par de veces si es necesario
        // o simplemente confiamos en que el usuario tardará un segundo en leer.
        let cliente = null;
        for (let i = 0; i < 3; i++) {
            const { data, error } = await supabase
                .from('mCliente')
                .select('codigo')
                .eq('correo', email)
                .maybeSingle();
            
            if (data?.codigo) {
                cliente = data;
                break;
            }
            // Esperar un poco si no lo encuentra (pizca de delay por el webhook)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return {
            codigoReferido: cliente?.codigo || null,
            nombreCliente: session.customer_details?.name
        };
    } catch (err) {
        console.error('Error recuperando código de referido:', err);
        return { codigoReferido: null };
    }
}
