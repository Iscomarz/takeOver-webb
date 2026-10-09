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
