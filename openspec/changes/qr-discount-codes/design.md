# Design: QR Discount Codes

## Technical Approach
The DB owns code state through six `SECURITY DEFINER` RPCs that only `service_role` can execute. The server reserves a code atomically when it creates the PaymentIntent (PI) and computes the discounted amount itself. A reservation is never taken from an earlier PI until Stripe confirms that PI can no longer be paid. The webhook redeems the code on `payment_intent.succeeded`. The code is released on PI cancel, and the TTL covers abandoned PIs. Stripe only ever sees the final amount. This implements every requirement in `specs/discount-codes` and the `edge-security-shield` delta.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Claim timing | Reserve on PI create, redeem on webhook | Redeem-only on webhook | Redeem-only lets two buyers pay with one code. The row lock serializes concurrent creates. |
| TTL / release | 30 min TTL (`reserva_expira`); release on `payment_intent.canceled` and on PI-create/link failure; no release on `payment_failed` | Release on `payment_failed`; no TTL | A failed PI can still be retried, so releasing it would leave a discounted PI open on a free code. |
| Takeover | Check, then compare-and-set. `reservar` never overwrites a live or expired hold that has a PI. It returns `takeover_required`. The server retrieves the earlier PI. If it is `canceled`, swap the hold. If it is `requires_*`, cancel it, then swap with CAS on the expected token. If it is `processing`/`requires_capture`, or the cancel fails, extend the hold for the earlier PI and return 409. If it is `succeeded`, the server calls `canjear` itself and returns 409 | Overwrite first, then cancel, then `liberar` on failure (the previous design) | Overwriting first meant a failed cancel released a code that the earlier PI could still complete: a double spend. With check-then-CAS the earlier hold stays intact until its PI is provably dead, so a failed cancel only needs an expiry extension. It also self-heals a missed webhook redeem. |
| Redeem match | `canjear` matches on `reserva_pi = p_payment_intent` (token as a secondary match) | Token only | The PI id is what Stripe reports, so it is authoritative. |
| Webhook `canjear` error | Retry in-process twice. On error, log `DISCOUNT_REDEEM_FAILED {pi, codigo}` at error level, keep issuing tickets, return 200 | Return 5xx so Stripe retries | The buyer has already paid, so tickets must not depend on code bookkeeping. A 5xx re-runs `acreditaPagoYGeneraTickets`, which is not proven idempotent, and delays tickets. The code stays held by the succeeded PI, and the next takeover attempt sees `succeeded` and redeems it. A reconciliation query in the rollout catches the rest. |
| Credentials | New `SUPABASE_SERVICE_ROLE_KEY` (Vercel, server only) in `src/lib/server/supabaseAdmin.js`. RPCs `REVOKE`d from `PUBLIC, anon, authenticated`, granted to `service_role` | Anon-callable RPCs | Anyone holding the public anon key could reserve every code. Fallback if the key is refused: grant to `authenticated`, and each RPC body asserts `auth.uid() = <admin uuid>`. |
| Admin policy | Replace `"Admin All Access codigosDescuento"` (`20260729220000_security_rls_hardening.sql:67`, `USING (true)`) with `USING/WITH CHECK (auth.uid() = '<admin uuid>')`. The uuid of `franmtz96@gmail.com` is captured during the drift check | Keep `USING (true)` | If hosted signups are enabled, any signed-up user could read or update every code. |
| Legacy codes | Untouched (`idEvento`/`porcentaje` NULL), so the RPCs treat them as inert | Delete; make global | Matches the proposal. |
| Referral separation | Split fields `codigoDescuento` and `codigoReferido`. The UI makes them mutually exclusive, and the server returns 400 if both are sent | Shared prop | A fail-closed discount would break referral checkouts. |
| Reservation handle | Server-generated `uuid` token, stored in PI metadata and returned to the client (`sessionStorage.reservaPrevia`) | PI id | The PI does not exist yet when we reserve. The token lets the same buyer re-take their own hold. |
| Price integrity | When a code is present: resolve every `idPrecioStripe` via Stripe, check it belongs to `cFaseEvento.idEvento = idEvento`, require integer quantities totaling 1-10. Otherwise fail closed | Client-price fallback | Stops a client pairing a code with another event's prices or a fake price. |

## Data Flow

    QR -> {BASE}/eventos/101?code=X -> Tickets (auto-fill) -> POST /api/validate-discount -> rpc validar
    /checkout -> POST /api/create-payment-intent {tickets,idEvento,codigoDescuento,reservaPrevia}
      -> resolve prices (fail closed) -> rpc reservar(token, reservaPrevia, expected=null)
         reserved          -> continue
         unavailable       -> 409 CODE_UNAVAILABLE
         takeover_required -> stripe.retrieve(pi_actual)
            canceled                    -> rpc reservar(token, expected=token_actual) [CAS]
            requires_*                  -> stripe.cancel ok? CAS : re-retrieve, treat as below
            processing/requires_capture -> rpc extender(token_actual) -> 409 CODE_PENDING
            succeeded                   -> rpc canjear(pi_actual) -> 409 CODE_UNAVAILABLE
                                           (alreadyPaid:true if token_actual = reservaPrevia)
            CAS miss                    -> 409 CODE_UNAVAILABLE
      -> amount = computeDiscountedAmount(subtotal,pct) -> stripe.create(server metadata)
         fail -> rpc liberar(token)
      -> rpc vincular(token, pi.id) fail/false -> stripe.cancel(pi.id) + rpc liberar(token) -> 500
      -> {clientSecret, reservaDescuento: token, totalPriceReal: amount/100}
    Webhook succeeded -> rpc canjear FIRST (see the error policy above), then the existing ticket flow
            canceled  -> rpc liberar(codigo, metadata.reservaDescuento)

**Paid-buyer return case:** the buyer paid, the webhook has not redeemed yet, and `/checkout` remounts with `reservaPrevia`. `reservar` returns `takeover_required`, and Stripe reports `succeeded` (or `processing`). The server redeems (or extends) and returns 409 with `alreadyPaid`. It never creates a second PI. The client clears `reservaPrevia` and shows "payment received". The client also clears `reservaPrevia` after `confirmPayment` succeeds.

## Interfaces / Contracts

```sql
-- supabase/migrations/20261009120000_discount_codes_qr.sql
ALTER TABLE "codigosDescuento" ADD "idEvento" int REFERENCES "mEvento"(idevento),
  ADD porcentaje numeric(5,2) CHECK (porcentaje > 0 AND porcentaje < 100),
  ADD reserva_token uuid, ADD reserva_pi text, ADD reserva_expira timestamptz,
  ADD CONSTRAINT "codigosDescuento_codigo_key" UNIQUE (codigo);
validar_codigo_descuento(p_codigo, p_id_evento) RETURNS TABLE(valido bool, porcentaje numeric)
reservar_codigo_descuento(p_codigo, p_id_evento, p_token uuid, p_token_previo uuid,
  p_token_esperado uuid, p_ttl_min int)
  RETURNS TABLE(resultado text, porcentaje numeric, token_actual uuid, pi_actual text)
  -- plpgsql: SELECT ... FOR UPDATE, then a branch; values are read BEFORE any write
vincular_reserva_descuento(p_token, p_payment_intent) RETURNS bool
extender_reserva_descuento(p_token, p_ttl_min) RETURNS bool
liberar_codigo_descuento(p_codigo, p_token) RETURNS bool  -- token match, acreditado=false
canjear_codigo_descuento(p_codigo, p_token, p_payment_intent)
  RETURNS TABLE(resultado text, pi_desplazado text)
  -- 'redeemed' | 'already_same_pi' | 'superseded_redeemed' | 'double_spend'
```

`reservar` branches on the locked row:
- Not found, already redeemed, or legacy: `unavailable`.
- `reserva_token IS NULL`, or `= p_token_esperado` (CAS): write the new token and expiry, set `reserva_pi = NULL`, return `reserved`.
- Live hold with a token other than `p_token_previo`: `unavailable`.
- Expired, or the buyer's own previous hold: return `takeover_required` with the current token and PI, and write nothing. If that hold has no PI and is the buyer's own, the server goes straight to CAS.

`canjear` sets `acreditado=true`, `fecha_acreditado=current_date` (the column is `date`), `session_id=p_payment_intent`, and clears the reservation. `superseded_redeemed` returns the other holder's PI, and the webhook cancels it on a best-effort basis. `double_spend` logs at error level. All functions use `SET search_path = public` and `upper(trim(p_codigo))`.

`canjear` **replaces** `acreditarCodigoDescuentoDesdeMetadata` (webhook `+server.js:543`, called at lines 91 and 103). The function is deleted.

PI metadata set by the server: `codigoDescuento`, `porcentajeDescuento`, `reservaDescuento`, `idEvento`, `subtotalCentavos`. Client metadata allowlist on create: `nombre, correo, cantidad, ticketsDescripcion, codigoReferido`. `update-payment-intent` allowlist: `nombre, correo`.

## File Changes

| File | Action | Description |
|---|---|---|
| `supabase/migrations/20261009120000_discount_codes_qr.sql` | Create | Columns, UNIQUE, RLS (admin-uid policy), grants, 6 RPCs |
| `supabase/rollback/20261009120000_discount_codes_qr.down.sql` | Create | Manual down script |
| `src/lib/server/supabaseAdmin.js` | Create | Service-role client |
| `src/routes/api/validate-discount/+server.js` | Create | Validation endpoint |
| `src/routes/api/create-payment-intent/+server.js` | Modify | Reserve/takeover, discount, fail closed, metadata allowlist. `totalPriceReal` (line 77) returns the discounted amount |
| `src/routes/api/update-payment-intent/+server.js` | Modify | Metadata allowlist |
| `src/routes/api/webhook/+server.js` | Modify | `canjear` replaces `acreditarCodigoDescuentoDesdeMetadata`; new `payment_intent.canceled` case; legacy path guarded with `"idEvento" IS NULL` |
| `src/routes/components/Tickets.svelte` | Modify | `codigoInicial` prop, split fields, server validation. Remove the hardcoded fallback price `price_1SKUvo2KnoE6M9dvEHOmwBzR` (line 85) |
| `src/routes/components/CheckoutEmbedded.svelte`, `src/routes/checkout/+page.svelte` | Modify | Carry `idEvento`/`reservaDescuento`; handle `alreadyPaid`/`CODE_PENDING`; clear `reservaPrevia` |
| `src/routes/eventos/[slug]/+page.svelte` | Modify | Read `?code=` |
| `src/lib/services/dataService.js` | Modify | Remove `validarCodigoDescuentoSupabase` |
| `src/hooks.server.js` | Modify | Add both endpoints to `CRITICAL_ROUTES` |
| `scripts/generate-discount-qr.mjs` | Create | 40 codes (10 chars, alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789`), PNGs, CSV, insert SQL. Requires `--base-url` (absolute `https://` production origin, no default, no trailing slash) and encodes `${base}/eventos/101?code=${code}`. Writes the base URL into the CSV |
| `.gitignore` | Modify | Add `scripts/output/` |

## Testing Strategy
No test runner exists.

| Layer | What | Approach |
|---|---|---|
| DB | Reserve race, CAS miss, takeover branches, release, idempotent redeem, anon and non-admin users denied | SQL script, two concurrent `psql` sessions |
| Pure | `computeDiscountedAmount` for 1-10 tickets at 35000 cents | Node assert script |
| E2E | QR link, 85% charge, reuse rejected, cancel releases, takeover of an expired `requires_payment_method` PI, paid-buyer return, referral still works | Stripe test mode + CLI |

## Migration / Rollout
1. **Drift check:** `npx supabase migration list`; `pg_policies`, `role_table_grants`, and `routine_privileges` for `codigosDescuento`; a duplicate-`codigo` query; the admin uuid (`auth.users` where email = `franmtz96@gmail.com`); the hosted **signup setting** (Dashboard > Auth > "Allow new users to sign up", or Management API `config/auth.disable_signup`). If signups are enabled, flag it. Record everything in apply-progress.
2. Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel and subscribe the Stripe endpoint to `payment_intent.canceled`.
3. Apply the migration and deploy, then run the generator with the confirmed production origin and run its SQL.
4. Reconciliation: grep the logs for `DISCOUNT_REDEEM_FAILED` and redeem those codes manually.

**Rollback:** revert the app, then run the down script. To void codes, set `acreditado=true`.

## Risks (out of scope)
- In the webhook, `payment_intent.succeeded` falls through to `payment_intent.created` when `acreditaPagoYGeneraTickets` returns false (`+server.js:88-94`). Noted only; not fixed here.

## Open Questions
- [x] Split fields: referral attribution in `getOrCreateCliente` gets enabled. **Resolved (user): yes.**
- [x] Legacy `checkout.session.completed` could burn QR codes. **Resolved: guard with `"idEvento" IS NULL`.**
- [ ] The production origin for `--base-url` must be confirmed before generation. It does not block the design.
