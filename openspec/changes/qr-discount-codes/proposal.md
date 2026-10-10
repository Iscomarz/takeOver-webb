# Proposal: QR Discount Codes

## Intent
Distribute 40 printed QR codes for event 101 ("Noche de Muertos III"). Each opens the event page with a unique code applied: 15% off the purchase total, single use, never expires. Today discount codes are cosmetic: they never change the charged amount, are publicly enumerable, and redemption is not atomic (and likely fails silently).

## Scope

### In Scope
- Migration: extend `codigosDescuento` with `idEvento`, `porcentaje`; UNIQUE on `codigo`; remove public SELECT; atomic validate/reserve/redeem functions.
- Server validation endpoint replacing the direct client query.
- `create-payment-intent`: re-validate code, apply discount server-side (`Math.round(subtotal * (1 - pct))`), set code metadata server-side, fail closed on price-resolution errors when a code is present.
- Webhook: atomic redemption with working credentials.
- Harden `update-payment-intent` (no client overwrite of discount metadata).
- Event page: read `?code=`, auto-fill and validate; show discounted total.
- Rate-limit the validation and PI endpoints.
- Offline script: 40 codes (>=8 chars, unambiguous alphabet), 40 QR PNGs, CSV mapping; outside runtime code.

### Out of Scope
- New Stripe products/prices or coupons; referral flow changes; legacy Checkout Session path; expiry; admin UI; print layout.

## Capabilities

### New Capabilities
- `discount-codes`: event-scoped, single-use percentage codes validated and applied server-side, redeemed atomically, deliverable via QR deep link.

### Modified Capabilities
- `edge-security-shield`: rate-limited route list adds discount validation and `/api/create-payment-intent`.

## Approach
DB-enforced integrity via SECURITY DEFINER RPCs; Stripe only sees the final amount. Design must decide: reserve-on-PI-create vs redeem-on-webhook, reservation TTL/release, service-role key vs RPCs, legacy codes' fate.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` | New | Schema, RLS, RPCs |
| `src/routes/api/create-payment-intent/+server.js` | Modified | Discount + re-validation |
| `src/routes/api/update-payment-intent/+server.js` | Modified | Metadata whitelist |
| `src/routes/api/webhook/+server.js` | Modified | Atomic redeem |
| `src/routes/api/` (validation endpoint) | New | Server-side code check |
| `src/routes/components/Tickets.svelte`, `src/lib/services/dataService.js` | Modified | Use endpoint, drop dead columns/hardcoded price |
| `src/routes/eventos/[slug]/` | Modified | `?code=` handling |
| `src/hooks.server.js` | Modified | Rate limits |
| `scripts/` | New | Code + QR generator |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Double spend (two concurrent payments) | Med | Atomic reservation in DB |
| Live RLS drifted from migrations | Med | Inspect live policies before applying |
| Referral flow regression (shared prop) | Med | Keep referral path separate; manual test |
| Abandoned reservation locks a code | Med | TTL/release on PI cancel |
| Code leakage | Low | Single use; personal-use note on print |

## Rollback Plan
Revert app commits (old flow ignores new columns). Down migration drops RPCs and new columns, restores prior policies. Unredeemed codes can be voided via `acreditado=true`.

## Dependencies
- Supabase migration access (`npx supabase`); possibly service-role key in Vercel.

## Success Criteria
- [ ] QR opens `/eventos/101?code=...` with code applied and 15% shown.
- [ ] Stripe charges exactly 85% of subtotal for 1-10 tickets.
- [ ] Second use is rejected, including concurrent attempts.
- [ ] Codes not readable via anon key; metadata not client-overwritable.

## Proposal question round (automatic mode; assumptions for user review)
- Legacy 10 codes stay untouched and are not event-scoped.
- Combining with referral codes: not allowed.
- Failed/abandoned payment releases the code.
