import Stripe from 'stripe';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { computeDiscountedAmount } from '$lib/server/discount';

const HOLD_TTL_MIN = 30;
const MAX_TICKETS = 10;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Client metadata allowlist. Discount fields are NEVER taken from the client:
// they are set server-side after the code has been reserved.
const CLIENT_METADATA_ALLOWLIST = ['nombre', 'correo', 'cantidad', 'ticketsDescripcion', 'codigoReferido'];

function pickClientMetadata(metadata) {
    const picked = {};
    if (!metadata || typeof metadata !== 'object') return picked;
    for (const key of CLIENT_METADATA_ALLOWLIST) {
        const value = metadata[key];
        if (value === undefined || value === null || value === '') continue;
        picked[key] = String(value).slice(0, 500);
    }
    return picked;
}

function cleanCode(value) {
    if (typeof value !== 'string') return '';
    return value.trim();
}

class DiscountError extends Error {
    constructor(status, body) {
        super(body.error);
        this.status = status;
        this.body = body;
    }
}

export async function POST({ request }) {
    //live
    const stripe = new Stripe(import.meta.env.VITE_SECRET_STRIPE_KEY_LIVE);

    const {
        amount,
        tickets,
        metadata,
        nombreEvento,
        nombreFase,
        idEvento,
        codigoDescuento: codigoDescuentoBody,
        codigoReferido: codigoReferidoBody,
        reservaPrevia
    } = await request.json();

    // Discount codes and referral codes are mutually exclusive.
    // A discount code sent through the legacy metadata field is still treated as a
    // discount code so it cannot bypass server-side validation.
    const codigoDescuento = cleanCode(codigoDescuentoBody) || cleanCode(metadata?.codigoDescuento);
    const codigoReferido = cleanCode(codigoReferidoBody) || cleanCode(metadata?.codigoReferido);

    if (codigoDescuento && codigoReferido) {
        return json(
            { error: 'No puedes combinar un código de descuento con un código de referido.' },
            { status: 400 }
        );
    }

    const clientMetadata = pickClientMetadata(metadata);
    if (codigoReferido) clientMetadata.codigoReferido = codigoReferido.slice(0, 500);

    console.log('Creating Payment Intent:', {
        amount,
        tickets,
        nombreEvento,
        nombreFase,
        idEvento,
        conCodigoDescuento: Boolean(codigoDescuento)
    });

    if (codigoDescuento) {
        return createWithDiscount({
            stripe,
            codigoDescuento,
            idEvento,
            tickets,
            clientMetadata,
            nombreEvento,
            nombreFase,
            reservaPrevia
        });
    }

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
                ...clientMetadata,
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

/**
 * Discount flow: resolve prices server-side (fail closed), reserve the code,
 * charge the discounted amount, and link the PaymentIntent to the reservation.
 *
 * NOTE: legacy codes (idEvento/porcentaje NULL) are inert in the RPCs, so they
 * now get 409 CODE_UNAVAILABLE here. This is intended (see design: Legacy codes).
 */
async function createWithDiscount({
    stripe,
    codigoDescuento,
    idEvento,
    tickets,
    clientMetadata,
    nombreEvento,
    nombreFase,
    reservaPrevia
}) {
    let token = null;
    try {
        const { items, subtotalCents, realPrices } = await resolvePricesFailClosed(stripe, idEvento, tickets);

        const previo = typeof reservaPrevia === 'string' && UUID_REGEX.test(reservaPrevia) ? reservaPrevia : null;
        token = randomUUID();

        const porcentaje = await reserveCode({ stripe, codigoDescuento, idEvento, token, previo });

        const amountInCents = computeDiscountedAmount(subtotalCents, porcentaje);

        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: 'mxn',
                automatic_payment_methods: { enabled: true },
                metadata: {
                    ...clientMetadata,
                    nombreEvento: nombreEvento || '',
                    nombreFase: nombreFase || '',
                    codigoDescuento: codigoDescuento.trim().toUpperCase(),
                    porcentajeDescuento: String(porcentaje),
                    reservaDescuento: token,
                    idEvento: String(idEvento),
                    subtotalCentavos: String(subtotalCents)
                },
                description: `${nombreEvento} - ${nombreFase}`
            });
        } catch (err) {
            console.error('Error creating discounted payment intent:', err);
            await liberar(codigoDescuento, token);
            return json({ error: err.message }, { status: 500 });
        }

        let linked = false;
        try {
            const { data, error } = await supabaseAdmin.rpc('vincular_reserva_descuento', {
                p_token: token,
                p_payment_intent: paymentIntent.id
            });
            linked = !error && data === true;
            if (error) console.error('vincular_reserva_descuento error:', error.message);
        } catch (err) {
            console.error('vincular_reserva_descuento threw:', err);
        }

        if (!linked) {
            try {
                await stripe.paymentIntents.cancel(paymentIntent.id);
            } catch (cancelErr) {
                console.error('No se pudo cancelar el PaymentIntent tras fallo de vinculación:', cancelErr.message);
            }
            await liberar(codigoDescuento, token);
            return json({ error: 'No se pudo reservar el código de descuento.' }, { status: 500 });
        }

        return json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            realPrices,
            totalPriceReal: amountInCents / 100,
            reservaDescuento: token,
            porcentajeDescuento: porcentaje
        });
    } catch (err) {
        if (err instanceof DiscountError) {
            return json(err.body, { status: err.status });
        }
        console.error('Error en flujo de descuento:', err);
        // Reservation may or may not exist; liberar is a no-op unless the token still matches.
        if (token) await liberar(codigoDescuento, token);
        return json({ error: 'No se pudo procesar el código de descuento.' }, { status: 500 });
    }
}

async function liberar(codigo, token) {
    try {
        const { error } = await supabaseAdmin.rpc('liberar_codigo_descuento', {
            p_codigo: codigo,
            p_token: token
        });
        if (error) console.error('liberar_codigo_descuento error:', error.message);
    } catch (err) {
        console.error('liberar_codigo_descuento threw:', err);
    }
}

/**
 * Price integrity: every price must belong to the event, quantities must be
 * integers totalling 1-10, and amounts always come from Stripe. Any failure
 * throws DiscountError(400) instead of falling back to client-provided prices.
 */
async function resolvePricesFailClosed(stripe, idEvento, tickets) {
    const bad = (msg) => new DiscountError(400, { error: msg, code: 'INVALID_REQUEST' });

    if (!Number.isInteger(idEvento)) throw bad('Evento inválido.');
    if (!Array.isArray(tickets) || tickets.length === 0) throw bad('Tickets inválidos.');

    let totalQty = 0;
    const qtyByPrice = new Map();
    for (const t of tickets) {
        if (
            !t ||
            typeof t.idPrecioStripe !== 'string' ||
            !t.idPrecioStripe ||
            !Number.isInteger(t.cantidad) ||
            t.cantidad < 1
        ) {
            throw bad('Tickets inválidos.');
        }
        totalQty += t.cantidad;
        qtyByPrice.set(t.idPrecioStripe, (qtyByPrice.get(t.idPrecioStripe) || 0) + t.cantidad);
    }
    if (totalQty < 1 || totalQty > MAX_TICKETS) throw bad('Cantidad de tickets inválida.');

    const priceIds = [...qtyByPrice.keys()];
    const { data: fases, error: fasesError } = await supabaseAdmin
        .from('cFaseEvento')
        .select('idPrecioStripe')
        .eq('idEvento', idEvento)
        .in('idPrecioStripe', priceIds);

    if (fasesError) {
        console.error('Error verificando precios del evento:', fasesError.message);
        throw new DiscountError(500, { error: 'No se pudo verificar los precios.' });
    }
    const owned = new Set((fases || []).map((f) => f.idPrecioStripe));
    if (!priceIds.every((id) => owned.has(id))) throw bad('Los tickets no pertenecen al evento.');

    const realPrices = {};
    let subtotalCents = 0;
    const items = [];
    for (const [idPrecioStripe, cantidad] of qtyByPrice) {
        let price;
        try {
            price = await stripe.prices.retrieve(idPrecioStripe);
        } catch (err) {
            console.error(`Error recuperando precio ${idPrecioStripe} de Stripe:`, err.message);
            throw new DiscountError(500, { error: 'No se pudo verificar los precios.' });
        }
        if (
            !price ||
            price.currency !== 'mxn' ||
            !Number.isInteger(price.unit_amount) ||
            price.unit_amount <= 0
        ) {
            throw new DiscountError(500, { error: 'No se pudo verificar los precios.' });
        }
        subtotalCents += price.unit_amount * cantidad;
        realPrices[idPrecioStripe] = price.unit_amount / 100;
        items.push({ idPrecioStripe, cantidad, unitAmount: price.unit_amount });
    }

    return { items, subtotalCents, realPrices };
}

async function callReservar(args) {
    const { data, error } = await supabaseAdmin.rpc('reservar_codigo_descuento', {
        p_codigo: args.codigo,
        p_id_evento: args.idEvento,
        p_token: args.token,
        p_token_previo: args.previo,
        p_token_esperado: args.esperado,
        p_ttl_min: HOLD_TTL_MIN
    });
    if (error) {
        console.error('reservar_codigo_descuento error:', error.message);
        throw new DiscountError(500, { error: 'No se pudo reservar el código de descuento.' });
    }
    return Array.isArray(data) ? data[0] : data;
}

async function extender(tokenActual) {
    try {
        const { error } = await supabaseAdmin.rpc('extender_reserva_descuento', {
            p_token: tokenActual,
            p_ttl_min: HOLD_TTL_MIN
        });
        if (error) console.error('extender_reserva_descuento error:', error.message);
    } catch (err) {
        console.error('extender_reserva_descuento threw:', err);
    }
}

async function canjear(codigo, tokenActual, piActual) {
    try {
        const { data, error } = await supabaseAdmin.rpc('canjear_codigo_descuento', {
            p_codigo: codigo,
            p_token: tokenActual,
            p_payment_intent: piActual
        });
        if (error) console.error('canjear_codigo_descuento error:', error.message);
        return Array.isArray(data) ? data[0] : data;
    } catch (err) {
        console.error('canjear_codigo_descuento threw:', err);
        return null;
    }
}

/**
 * Reserves the code for `token`. Returns the discount percentage, or throws a
 * DiscountError (409 CODE_UNAVAILABLE / CODE_PENDING, 500).
 *
 * The earlier hold is never overwritten until Stripe confirms its PaymentIntent
 * can no longer be paid (check, then compare-and-set on the expected token).
 */
async function reserveCode({ stripe, codigoDescuento, idEvento, token, previo }) {
    const unavailable = (extra = {}) =>
        new DiscountError(409, {
            error: 'El código de descuento ya no está disponible.',
            code: 'CODE_UNAVAILABLE',
            ...extra
        });

    const first = await callReservar({
        codigo: codigoDescuento,
        idEvento,
        token,
        previo,
        esperado: null
    });

    if (!first || first.resultado === 'unavailable') throw unavailable();
    if (first.resultado === 'reserved') return Number(first.porcentaje);
    if (first.resultado !== 'takeover_required') throw unavailable();

    const tokenActual = first.token_actual;
    const piActual = first.pi_actual;
    const isOwn = previo !== null && tokenActual === previo;

    const takeOver = async () => {
        const cas = await callReservar({
            codigo: codigoDescuento,
            idEvento,
            token,
            previo,
            esperado: tokenActual
        });
        if (!cas || cas.resultado !== 'reserved') throw unavailable();
        return Number(cas.porcentaje);
    };

    const pending = async () => {
        await extender(tokenActual);
        throw new DiscountError(409, {
            error: 'Hay un pago en proceso con este código.',
            code: 'CODE_PENDING',
            ...(isOwn ? { alreadyPaid: true } : {})
        });
    };

    const paid = async () => {
        await canjear(codigoDescuento, tokenActual, piActual);
        throw unavailable(isOwn ? { alreadyPaid: true } : {});
    };

    // Expired hold (or the buyer's own hold) with no PI: no clientSecret was ever
    // returned for it, so there is nothing to check in Stripe. Never retrieve(null).
    if (!piActual) return takeOver();

    const retrieve = async () => {
        try {
            return await stripe.paymentIntents.retrieve(piActual);
        } catch (err) {
            if (err?.code === 'resource_missing') return { status: 'canceled' };
            console.error('No se pudo consultar el PaymentIntent anterior:', err.message);
            return null;
        }
    };

    let earlier = await retrieve();
    if (!earlier) return pending();

    if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(earlier.status)) {
        try {
            earlier = await stripe.paymentIntents.cancel(piActual);
        } catch (cancelErr) {
            console.error('No se pudo cancelar el PaymentIntent anterior:', cancelErr.message);
            earlier = await retrieve();
            if (!earlier) return pending();
        }
    }

    switch (earlier.status) {
        case 'canceled':
            return takeOver();
        case 'succeeded':
            return paid();
        default:
            // processing, requires_capture, or a PI that is still payable after a failed cancel
            return pending();
    }
}
