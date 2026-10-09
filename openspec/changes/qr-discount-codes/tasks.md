# Tasks: QR Discount Codes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 900-1200 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (DB) -> PR 2 (server) -> PR 3 (client + generator) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema, RLS, grants, 6 RPCs, rollback, SQL race script | PR 1 | Base: main/tracker. NOT standalone: REVOKE ALL FROM anon breaks the deployed app's legacy anon code check and turns the legacy webhook update into permission-denied, so apply the migration together with the app deploy (design Rollout step 3) |
| 2 | supabaseAdmin, validate endpoint, create/update PI, webhook, hooks | PR 2 | Base: PR 1. Needs the service-role key in env |
| 3 | UI, QR deep link, generator, `.gitignore` | PR 3 | Base: PR 2 |

## Phase 1: Database (PR 1)
- [ ] 1.1 Drift check (design Rollout 1): migrations, policies, grants, duplicate `codigo`, admin uuid, signup setting. Record in apply-progress. (PENDING: needs live DB access; queries recorded in apply-progress)
- [x] 1.2 Create `supabase/migrations/20261009120000_discount_codes_qr.sql`: add columns `idEvento`, `porcentaje`, `reserva_*`; UNIQUE(`codigo`).
- [x] 1.3 Same file: `DROP POLICY IF EXISTS "Enable read access for all users"` (remote_schema.sql:727) and `REVOKE ALL ON "codigosDescuento" FROM anon` (spec: Enumeration).
- [x] 1.4 Same file: replace "Admin All Access codigosDescuento" with `auth.uid() = '<admin uuid>'` USING/WITH CHECK. (written with a guarded placeholder; admin uuid PENDING, see apply-progress)
- [x] 1.5 Same file: `validar_codigo_descuento(p_codigo, p_id_evento)`; checks only existence, event, legacy status and `acreditado`, takes no token; holds are left to `reservar`.
- [x] 1.6 Same file: `reservar_codigo_descuento` with the design branches (FOR UPDATE, read before write, CAS, `takeover_required`, writes nothing on takeover).
- [x] 1.7 Same file: `vincular_reserva_descuento`, `extender_reserva_descuento` (token match AND `acreditado=false`), `liberar_codigo_descuento` (token match, `acreditado=false`).
- [x] 1.8 Same file: `canjear_codigo_descuento` (match on `reserva_pi`; `redeemed|already_same_pi|superseded_redeemed|double_spend`; `double_spend` writes nothing).
- [x] 1.9 Same file: all RPCs `SECURITY DEFINER`, `SET search_path = public`, `upper(trim())`; `REVOKE` from `PUBLIC, anon, authenticated`, `GRANT` to `service_role`.
- [x] 1.10 Create `supabase/rollback/20261009120000_discount_codes_qr.down.sql`: drop RPCs and columns, restore the admin policy, the anon SELECT policy and `GRANT ALL ... TO anon`.
- [x] 1.11 Create `scripts/verify-discount-db.sql`: race (two `psql` sessions), CAS miss, takeover branches, release, idempotent redeem, anon read returns 0 rows, anon/non-admin RPC denied.

## Phase 2: Server (PR 2)
- [x] 2.1 Create `src/lib/server/supabaseAdmin.js` (service-role client, server only); document `SUPABASE_SERVICE_ROLE_KEY`.
- [x] 2.2 Create `src/routes/api/validate-discount/+server.js` calling `validar`; generic invalid response.
- [x] 2.3 Modify `src/hooks.server.js`: add both endpoints to `CRITICAL_ROUTES`.
- [x] 2.4 Create `src/lib/server/discount.js` with `computeDiscountedAmount`, plus `scripts/verify-discount-amount.mjs` (Node assert, 1-10 tickets at 35000).
- [x] 2.5 Modify `src/routes/api/create-payment-intent/+server.js`: split `codigoDescuento`/`codigoReferido` (400 if both), metadata allowlist, fail-closed price resolution (event ownership, integer quantities 1-10).
- [x] 2.6 Same file: reserve flow with takeover. Retrieved `canceled` goes to CAS. `requires_*` is cancelled, then CAS. `processing` or failed cancel goes to `extender`, then 409 `CODE_PENDING`. `succeeded` goes to `canjear`, then 409 (`alreadyPaid` if own token).
- [x] 2.7 Same file: expired hold with no PI that is not the buyer's own goes straight to CAS (no clientSecret was ever returned); never call `stripe.retrieve(null)`.
- [x] 2.8 Same file: Stripe create failure calls `liberar`. `vincular` failure or false cancels the PI and calls `liberar`, then 500. `totalPriceReal` (line 77) returns the discounted amount. Legacy codes now get 409 (intended; document in a code comment).
- [x] 2.9 Modify `src/routes/api/update-payment-intent/+server.js`: allowlist `nombre, correo`.
- [x] 2.10 Modify `src/routes/api/webhook/+server.js`: delete `acreditarCodigoDescuentoDesdeMetadata`. On `succeeded`, call `canjear` through `supabaseAdmin` only when `metadata.reservaDescuento` is present, with 2 retries, `DISCOUNT_REDEEM_FAILED` error log, and a best-effort cancel of `pi_desplazado`.
- [x] 2.11 Same file: add a `payment_intent.canceled` case calling `liberar`; guard the legacy `checkout.session` path with `"idEvento" IS NULL`. Do NOT touch the fall-through at lines 88-94.

## Phase 3: Client and Generator (PR 3)
- [ ] 3.1 Modify `src/routes/components/Tickets.svelte`: `codigoInicial` prop, split fields (mutually exclusive), call `/api/validate-discount`, remove the hardcoded price (line 85).
- [ ] 3.2 Modify `src/routes/eventos/[slug]/+page.svelte`: read `?code=`; show an error and the full price on an invalid code.
- [ ] 3.3 Modify `src/routes/components/CheckoutEmbedded.svelte` and `src/routes/checkout/+page.svelte`: carry `idEvento`/`reservaDescuento`; handle `alreadyPaid` and `CODE_PENDING`; `sessionStorage.reservaPrevia` cleared after `confirmPayment`.
- [ ] 3.4 Modify `src/lib/services/dataService.js`: remove `validarCodigoDescuentoSupabase`.
- [ ] 3.5 Create `scripts/generate-discount-qr.mjs` (40 codes, 10 chars, safe alphabet, PNGs, CSV, insert SQL; required `--base-url` https, no default).
- [ ] 3.6 Modify `.gitignore`: add `scripts/output/`.

## Phase 4: Verification (manual, Stripe test mode + CLI)
- [ ] 4.1 Run 1.11 and 2.4 scripts. Query anon `/rest/v1/codigosDescuento` and expect no rows.
- [ ] 4.2 Scan the QR link: 15% shown, exact 85% charge for 1 and 10 tickets. Reuse is rejected.
- [ ] 4.3 Cancel releases the code. Takeover of an expired `requires_payment_method` PI. Paid-buyer return gets `alreadyPaid`.
- [ ] 4.4 Referral checkout still works. Discount plus referral gives 400. Legacy code gives 409. Validate/create-PI return 429 after the threshold.
- [ ] 4.5 Rollout: add the Vercel key, subscribe `payment_intent.canceled`, apply the migration, confirm the production origin, run the generator, run the insert SQL, grep for `DISCOUNT_REDEEM_FAILED`.

> DEPLOY COUPLING (W2): PR 2 (Phase 2 server) must NOT be deployed without PR 3 (client) and the Phase 1 migration. The current client sends referral codes in `metadata.codigoDescuento` and no `idEvento`, so the new server returns 400. Deploy PR 1 + 2 + 3 together.
