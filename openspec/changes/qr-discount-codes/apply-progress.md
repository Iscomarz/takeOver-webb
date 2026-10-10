# Apply Progress: qr-discount-codes

**Mode**: Standard (no test runner). **Delivery**: local chained slice 1 of 3 (db -> server -> client/generator), no PR.
**Branch**: feat/qr-discount-db

## Phase 1: Database

- [ ] 1.1 Drift check: PENDING (no live access used; nothing applied remotely)
- [x] 1.2 Columns + UNIQUE(codigo)
- [x] 1.3 DROP read policy + REVOKE ALL FROM anon
- [x] 1.4 Admin policy bound to uid (placeholder guarded, uuid PENDING)
- [x] 1.5 validar
- [x] 1.6 reservar
- [x] 1.7 vincular / extender / liberar
- [x] 1.8 canjear
- [x] 1.9 SECURITY DEFINER, search_path, grants to service_role only
- [x] 1.10 Rollback script
- [x] 1.11 scripts/verify-discount-db.sql (validated by an independent reviewer on local PG 15.8 before the review fixes; re-validated after fixes on local PG 15.8.1.073)

## Files
- supabase/migrations/20261009120000_discount_codes_qr.sql
- supabase/rollback/20261009120000_discount_codes_qr.down.sql
- scripts/verify-discount-db.sql

## PENDING items for the user

1. Admin uuid: the migration contains `v_admin_uid := '__ADMIN_UUID_PLACEHOLDER__'` and RAISEs EXCEPTION if not replaced. Get it with:
   `select id from auth.users where email = 'franmtz96@gmail.com';`
2. Drift check queries (run read-only against the hosted DB; results not recorded):
   - `npx supabase migration list`
   - `select * from pg_policies where tablename = 'codigosDescuento';`
   - `select grantee, privilege_type from information_schema.role_table_grants where table_name = 'codigosDescuento';`
   - `select grantee, routine_name from information_schema.routine_privileges where routine_schema = 'public' and routine_name like '%descuento%';`
   - `select codigo, count(*) from "codigosDescuento" group by codigo having count(*) > 1;` (must be empty or UNIQUE fails)
   - Signup setting: Dashboard > Auth > "Allow new users to sign up" (or Management API `config/auth.disable_signup`); flag if enabled.
3. Run `scripts/verify-discount-db.sql` on a local/staging DB and the manual two-session race at its end (the race is still manual).
4. Validation: the original SQL was validated by an independent reviewer on local PG 15.8 BEFORE the review fixes below. Re-validated after the fixes on a throwaway local supabase/postgres 15.8.1.073 container (stub schema): guard aborts with no partial change, migration applies, verify script passes, rollback runs.
5. Deploy coupling: the migration must be applied together with the app deploy (design Rollout step 3); it is not standalone (REVOKE ALL FROM anon breaks the deployed legacy anon code check and the legacy webhook update).

## Review fixes applied (post-review)
- W1: placeholder guard is now the FIRST statement of the migration (stores the uid in a session setting `qr_discount.admin_uid`; section 3 reads it), so a non-transactional run aborts before any change.
- W2: rollback voids QR rows (`acreditado = true WHERE "idEvento" IS NOT NULL`) before restoring anon SELECT / GRANT ALL and dropping the columns.
- W3: tasks.md note corrected (not standalone).
- S1: `COALESCE(p_ttl_min, 30)` in reservar/extender.
- S2: vincular requires `reserva_pi IS NULL OR reserva_pi = p_payment_intent`.
- S3: `SET search_path = public, pg_temp` on all functions.
- S6: verify script raises a clear error when `mEvento` is empty.
- DEFERRED: S4, S5 (not applied in this slice).

## Notes / decisions
- Local-only drift evidence: repo migrations end at 20260910120000; table defined in 20260729215327_remote_schema.sql; policy "Enable read access for all users" (line 727) and admin `USING (true)` policy (20260729220000:67) are the ones replaced. Remote state unverified.
- Code lookup is `codigo = upper(trim(p_codigo))` (uses the UNIQUE index). Legacy lowercase codes would not match, which is fine since they are inert; generator must emit uppercase codes.
- `canjear` returns `double_spend` (writes nothing) also for unknown or legacy codes.
- `reservar` with `p_token_esperado` set that does not match the current token returns `unavailable` (CAS miss) even if the hold is expired, to avoid takeover loops.
- `reservar` with a free code and a non-null `p_token_esperado` just reserves it.
- `canjear` redeems when `reserva_pi = p_payment_intent`, or `reserva_pi IS NULL AND reserva_token = p_token` (secondary match).
- Dedicated warning log lines `DISCOUNT_DOUBLE_SPEND` are emitted via RAISE WARNING.
- Admin policy is created through a DO block with `format(%L)` so the uuid is replaced in a single place.

## Deviations from design
None material.

---

# Phase 2: Server (slice 2 of 3)

**Branch**: feat/qr-discount-server (from feat/qr-discount-db). **Mode**: Standard (no test runner).

- [x] 2.1 src/lib/server/supabaseAdmin.js (service-role client; logs an error if SUPABASE_SERVICE_ROLE_KEY is missing)
- [x] 2.2 src/routes/api/validate-discount/+server.js (token-less `validar`; any failure returns `{ valid: false }`)
- [x] 2.3 hooks.server.js: `/api/validate-discount` and `/api/create-payment-intent` added to CRITICAL_ROUTES
- [x] 2.4 src/lib/server/discount.js + scripts/verify-discount-amount.mjs (passes: 1-10 tickets at 35000, exact 85%)
- [x] 2.5 create-payment-intent: split fields, 400 if both, allowlist, fail-closed pricing (event ownership via cFaseEvento, Stripe prices, mxn, integer qty 1-10)
- [x] 2.6 reserve flow with takeover (cancel -> CAS, processing/failed cancel -> extender + 409 CODE_PENDING, succeeded -> canjear + 409)
- [x] 2.7 no-PI hold goes straight to CAS; never retrieve(null)
- [x] 2.8 create failure -> liberar; vincular error/false -> cancel PI + liberar + 500; totalPriceReal is the discounted amount; legacy codes -> 409 (documented in code)
- [x] 2.9 update-payment-intent allowlist (`nombre`, `correo`)
- [x] 2.10 webhook: `acreditarCodigoDescuentoDesdeMetadata` deleted; `canjear` via supabaseAdmin only when `metadata.reservaDescuento` is present, 2 retries, `DISCOUNT_REDEEM_FAILED`, best-effort cancel of `pi_desplazado`, always 200
- [x] 2.11 `payment_intent.canceled` -> `liberar`; legacy `acreditarCodigoDescuento` guarded with `.is("idEvento", null)`. Fall-through at the old lines 88-94 untouched.

## Commits
- f886ea0 feat(server): service-role client, validate endpoint, amount helper (2.1-2.4)
- baa9b94 feat(payments): create-payment-intent (2.5-2.8)
- cab187d fix(payments): update-payment-intent allowlist (2.9)
- 97f0f69 feat(webhook): canjear/liberar (2.10-2.11)

## Verification performed (no real Stripe/Supabase touched)
- `node scripts/verify-discount-amount.mjs`: OK
- `node --check` on all touched files; `npx vite build`: OK
- Throwaway node harness (Node loader stubbing Stripe + supabaseAdmin, kept outside the repo): create-payment-intent (no-code legacy path + allowlist, 400 both fields, happy path with 85%-style amount and server metadata, unavailable, takeover requires_* -> cancel -> CAS, failed cancel -> extender/CODE_PENDING, processing own -> alreadyPaid, succeeded -> canjear + 409, vincular false -> cancel+liberar+500, Stripe create failure -> liberar, no-PI CAS without retrieve, ownership failure 400, qty 11 / 1.5 -> 400, legacy code via metadata -> 409) and webhook (canceled -> liberar, no canjear without reservaDescuento, 3 attempts then DISCOUNT_REDEEM_FAILED without 5xx, retry success, superseded -> cancel displaced PI). All pass. The harness is not committed.

## Decisions / deviations
- `canjear` runs at the START of `payment_intent.succeeded` (design data flow says "canjear FIRST"), before existePago/tickets; it is idempotent (`already_same_pi`) so Stripe retries are safe. Because `checkout.session.completed` falls through into this case (existing behavior), canjear is a no-op there since checkout sessions never carry `reservaDescuento`.
- A discount code sent in the legacy `metadata.codigoDescuento` is still treated as a discount code (so a client cannot bypass server validation); legacy codes therefore get 409 CODE_UNAVAILABLE.
- Referral code accepted from `codigoReferido` or `metadata.codigoReferido`; both a discount and a referral => 400.
- Own hold in `processing` returns 409 `CODE_PENDING` with `alreadyPaid: true` (design "paid-buyer return"); the client slice must handle both flags.
- `reservar` result `reserved` on the first call sets reserva_pi NULL; `vincular` attaches the PI after Stripe create. Extra response fields: `reservaDescuento`, `porcentajeDescuento`.
- Rate limiter is a single per-IP counter (15/min) shared across all CRITICAL_ROUTES, so create-payment-intent now counts against the same budget as `/checkout`; no change to thresholds.
- The Stripe `payment_intent.canceled` in turn fires when the server itself cancels a displaced PI; `liberar` is token-matched, so it cannot release the new holder.

## PENDING items for the user (Phase 2)
1. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel (server-side only, no VITE_ prefix) and to local `.env` for dev. `supabaseAdmin.js` reads URL from `SUPABASE_PROJECT_URL` (fallback `VITE_SUPABASE_URL`).
2. Stripe Dashboard: subscribe the webhook endpoint to `payment_intent.canceled` (currently unhandled events return 400).
3. Apply the Phase 1 migration together with this deploy (RPCs must exist; REVOKE from anon).
4. Phase 4 manual E2E in Stripe test mode (task 4.x): none of the Stripe/DB behavior was exercised against real services.
5. After deploy, grep logs for `DISCOUNT_REDEEM_FAILED` / `DISCOUNT_DOUBLE_SPEND`.

## Post-review fixes (Phase 2)
Applied to `src/routes/api/create-payment-intent/+server.js` after an independent review.
- W1: `pending(status)` now sets `alreadyPaid: true` only when the buyer's own hold has PI status `processing` or `requires_capture`. A failed Stripe retrieve (status null) or a failed cancel leaving `requires_*` returns plain 409 `CODE_PENDING`. The `succeeded` branch (`paid()`) keeps `alreadyPaid` for own holds as designed.
- W3: on the discount path the PI metadata `cantidad` is forced to the server-computed total quantity and `nombreFase` is derived from the server-side `cFaseEvento.nombreFace` of the first requested ticket (query now selects `idPrecioStripe, nombreFace`), so the webhook cannot issue more tickets or a pricier phase than paid. The no-code path is unchanged.
- S2: `callReservar` calls `liberar(codigo, token)` when the `reservar` RPC returns an error (token-matched, so a no-op if our hold was not committed).
- S3: Stripe PI create failure on the discount path returns a generic message (`No se pudo crear el pago.`); detail is logged server-side only. (The legacy no-code path still returns `err.message`; left unchanged on purpose.)
- S6: removed the unused `items` variable.
- Deferred / out of scope: S1, S4, S5 (not addressed in this pass).
- Verification: `node --check` OK, `node scripts/verify-discount-amount.mjs` OK, `npx vite build` OK. New stub harness (kept outside the repo) passes: alreadyPaid true for own processing / requires_capture / succeeded, false for failed cancel (requires_*) and failed retrieve; `cantidad`/`nombreFase` forced from server; `reservar` error -> `liberar`; no raw Stripe message.

### DEPLOY COUPLING (W2) - PENDING, prominent
PR 2 (server) CANNOT be deployed without PR 3 (client) and the Phase 1 migration. The current client still sends referral codes in `metadata.codigoDescuento` and sends no `idEvento`, so the new server treats them as discount codes and returns 400/409. Ship PR 1 + PR 2 + PR 3 together. No code change made for this.

---

# Phase 3: Client and Generator (slice 3 of 3)

**Branch**: feat/qr-discount-client (from feat/qr-discount-server). **Mode**: Standard (no test runner).

- [x] 3.1 Tickets.svelte: `codigoInicial` prop, `/api/validate-discount` call, hardcoded price and dead columns removed, discount and referral mutually exclusive, discounted total store (`totalConDescuento`) + percentage badge, `idEvento` passed down
- [x] 3.2 eventos/[slug]/+page.svelte: reads `?code=`, passes it as `codigoInicial`; invalid code shows an error and keeps the full price
- [x] 3.3 CheckoutEmbedded + checkout/+page.svelte: `tipoCodigo`, `porcentajeDescuento`, `idEvento` carried via sessionStorage; request sends exactly one of `codigoDescuento` / `codigoReferido` plus `idEvento`; `reservaPrevia` read from sessionStorage and `reservaDescuento` stored from the response; 409 `CODE_PENDING` / `CODE_UNAVAILABLE` / `alreadyPaid` handled; `reservaPrevia` cleared on alreadyPaid, on CODE_UNAVAILABLE and after a successful `confirmPayment`
- [x] 3.4 dataService.js: `validarCodigoDescuentoSupabase` removed
- [x] 3.5 scripts/generate-discount-qr.mjs (40 unique 10-char codes, safe uppercase alphabet, PNGs, CSV, insert SQL; `--base-url` required, https origin only, no default)
- [x] 3.6 .gitignore: `scripts/output/`

## Verification performed
- `node --check` on the generator; `npx vite build` OK
- Generator run with a dummy base (https://example.com): 40 PNGs, 40 unique codes matching the alphabet/length, URL `<base>/eventos/101?code=<CODE>`, trailing slash normalized; missing, http:// and path-bearing `--base-url` all rejected. Output deleted afterwards and confirmed ignored by git.
- No browser/Stripe/DB exercised.

## Decisions / deviations
- `Checkout.svelte` was NOT modified: it has no importers, targets the legacy `/api/checkout` Checkout Session flow and already routes referral codes to `metadata.codigoReferido` via `isReferral`. Only the embedded flow reaches `create-payment-intent`.
- The checkout page does not trust the displayed percentage: charged amount comes from `totalPriceReal` in the response.
- Old sessionStorage payloads without `tipoCodigo` send no code (fail safe).
- `reservaPrevia` is kept after a `confirmPayment` error so the buyer can retake their own hold.

## PENDING items for the user (Phase 3)
1. Production origin for `--base-url` (e.g. `node scripts/generate-discount-qr.mjs --base-url https://<prod-origin>`); then review `scripts/output/insert-codes.sql` and run it manually. Nothing was generated into tracked files or inserted into any DB.
2. Phase 4 E2E in Stripe test mode (scan QR, 85% for 1 and 10 tickets, reuse rejected, cancel releases, takeover, alreadyPaid return, referral still works, discount+referral 400).
3. Deploy PR 1 + 2 + 3 together (see DEPLOY COUPLING above).
4. Copy review: Spanish strings added in Tickets/checkout (conflict messages, "N% de descuento").
