<script>
    import { loadStripe } from '@stripe/stripe-js';

    let stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_KEY);

    console.log(import.meta.env.VITE_PUBLIC_STRIPE_KEY);

    async function handleCheckout() {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lineItems: [
                    { price: 'price_1Pv5ZD2KnoE6M9dvVv3IulNJ', quantity: 1 },
                ],
            }),
        });

        const { id } = await response.json();

        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId: id });
        if (error) {
            console.error(error);
        }
    }
</script>

<button on:click={handleCheckout}>Pay with Stripe</button>
