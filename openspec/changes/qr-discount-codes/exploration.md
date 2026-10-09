# Exploration: QR Discount Codes

## Goal
40 printed QR codes, each linking to the active event page (mEvento `idevento=101`, "Noche de Muertos III | Gespona", 2026-11-01) with a unique code pre-filled and applied: 15% off the purchase total, single use, never expires, scoped to event 101.

## Current State

### Data
- `public."codigosDescuento"` (`supabase/migrations/20260729215327_remote_schema.sql:707-727`): `id` identity PK, `codigo text NOT NULL`, `acreditado bool`, `fecha_acreditado date`, `session_id text`. No event scope, no percentage, no UNIQUE on `codigo`.
- Grants: `ALL` to `anon`, `authenticated`, `service_role` (:721-725). Policy "Enable read access for all users" (:727) makes every code enumerable by anyone.
- Hardening (`20260729220000_security_rls_hardening.sql:66-67`): `authenticated` has `FOR ALL USING (true)`; `anon` has no write policy.
- 10 legacy rows, 5-char codes, all `acreditado=false`.

### Client flow (cosmetic only)
- `src/lib/services/dataService.js:75-84` queries the table directly with the anon key.
- `src/routes/components/Tickets.svelte:64-95, 184-221` validates, reads nonexistent columns (`descripcion`, `idPrecioStripeDescuento`), falls back to hardcoded `price_1SKUvo2KnoE6M9dvEHOmwBzR` (:85).
- The code travels as a string: `Tickets.svelte:276-281` -> `CheckoutEmbedded.svelte:26-48` -> sessionStorage `takeover_checkout_data` -> `src/routes/checkout/+page.svelte:61,95` -> PI `metadata.codigoDescuento`. It never changes the charged amount.
- The same `codigoDescuentoUsado` prop also carries referral codes (`Tickets.svelte:281`, `Checkout.svelte:42-46`, `/api/validate-referral`). Any change must keep the referral path working.

### Server
- `POST /api/create-payment-intent` resolves Stripe Prices server-side (`stripe.prices.retrieve`) and sums `unit_amount * cantidad`, but falls back to client-supplied `precio`/`amount` on missing price or Stripe error (:34-40, :52, :55). `metadata` is a client-controlled spread (:65-68). `cantidad` is not validated server-side.
- `POST /api/update-payment-intent` (:8-21) overwrites PI metadata with arbitrary client data, unauthenticated.
- Webhook `src/routes/api/webhook/+server.js:508-576` sets `acreditado=true` by `codigo` using the anon key (:8-11). With no anon UPDATE policy this most likely matches 0 rows silently (unverified). No atomic claim; two buyers can pay with one code.
- Webhook records `monto = PI.amount/100`, so a server-computed discounted amount flows into records naturally.
- `hooks.server.js:52` rate limits `/api/checkout`, `/api/login`, `/api/registro-invitacion`, `/checkout` only; `/api/create-payment-intent` is not covered.

### Routing / event
- `src/routes/eventos/[slug]/+page.js` + `+page.svelte` render `<Tickets>`; slug is id or slugified name; `/eventos/101` works. No query-param handling.
- Active phase: `cFaseEvento` idFase 86 "Fase 1", $350 MXN, `price_1UNdGd2KnoE6M9dvvNtKnPYb`, expires 2026-10-31. Max 10 tickets per purchase.

### Stripe
- Stripe coupons do not apply to bare PaymentIntents. The discount must be computed server-side: `Math.round(subtotalCents * 0.85)`.

### Tooling / credentials
- Supabase CLI via `npx supabase` (v2.120.0), linked to project ref `koubjdnhazjtykkmalfw`. Not on PATH as `supabase`.
- Local `.env` holds only `SUPABASE_PROJECT_URL`, `SUPABASE_API_KEY`, `VITE_RESEND_KEY`, `VITE_SECRET_STRIPE_KEY_LIVE`, `VITE_PUBLIC_STRIPE_KEY_LIVE`. No service-role key locally; Vercel env unknown.

## Approaches Considered

| Approach | Pros | Cons |
|---|---|---|
| A. Server-side discount on PI amount + SECURITY DEFINER RPCs (validate / reserve / redeem) | No Stripe catalog changes; integrity enforced in DB; works with anon key | Needs careful RPC grants; reservation lifecycle to design |
| B. One discounted Stripe Price per phase | Stripe-native amounts | Breaks with any quantity mix; phase changes require new prices; still needs single-use enforcement |
| C. Stripe Promotion Codes | Stripe tracks redemption | Only works with Checkout Sessions, not the PaymentIntent flow in use |

Recommended: **A**.

## Open Design Decisions
1. Reserve-on-PI-create vs redeem-on-webhook (double-spend window), and reservation TTL / release on PI cancel or failure.
2. Service-role key on the server vs SECURITY DEFINER RPCs callable by anon.
3. Fate of the 10 legacy codes (leave untouched, mark legacy, or scope to no event).
4. Query param name (`?code=`) and whether the code persists after a page reload or event switch.
5. Whether to drop the client-amount fallback in `create-payment-intent` entirely when a code is applied (fail closed).

## Unknowns / Risks
- Live RLS/grants may have drifted from migration files.
- Whether anon webhook updates currently fail silently.
- `authenticated` FOR ALL policy: if sign-up is open, any logged-in user can rewrite codes.
- `VITE_`-prefixed Stripe secret is exposed to client bundles if ever imported client-side (pre-existing, out of scope).
