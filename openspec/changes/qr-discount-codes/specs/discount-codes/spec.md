# Discount Codes Specification

## Purpose
Event-scoped, single-use percentage discount codes, validated and applied server-side, redeemed atomically, deliverable via QR deep link. Legacy codes and referral codes are unaffected.

## Requirements

### Requirement: Code Model
Each QR code MUST be scoped to one event, carry a percentage (15 for event 101), be single use, and never expire. Codes MUST be unique, at least 8 characters, from an unambiguous alphabet. Legacy codes MUST remain untouched and MUST NOT be event-scoped.

#### Scenario: Batch generation
- GIVEN the offline generator is run for event 101
- WHEN it completes
- THEN 40 distinct codes, 40 QR PNGs, and a CSV mapping code to QR file exist
- AND each QR encodes `/eventos/101?code=<code>`

### Requirement: Server-Side Validation
Validation MUST happen on the server through a dedicated endpoint. The response MUST NOT reveal other codes. Codes MUST NOT be readable with the anon key.

#### Scenario: Valid code
- GIVEN an unused code for event 101
- WHEN validated for event 101
- THEN the response reports valid and 15%

#### Scenario: Invalid cases
- GIVEN a nonexistent, already used, or other-event code
- WHEN validated
- THEN the response reports invalid without distinguishing which case

#### Scenario: Enumeration
- GIVEN an anonymous client
- WHEN it queries the codes table directly with the anon key
- THEN no code rows are returned

### Requirement: Server-Side Discount Application
`create-payment-intent` MUST re-validate the code and compute the amount as `Math.round(subtotal * (1 - pct))` from server-resolved prices. Client-supplied amounts MUST NOT influence the charge when a code is present. Discount metadata MUST be set by the server only.

#### Scenario: Exact charge
- GIVEN a valid code and N tickets (1 to 10) at 350 MXN
- WHEN a payment intent is created
- THEN the charged amount equals 85% of the subtotal, rounded

#### Scenario: Price resolution failure
- GIVEN a code is present and price resolution fails
- WHEN a payment intent is created
- THEN the request fails and no payment intent is created

#### Scenario: Metadata tampering
- GIVEN an existing payment intent
- WHEN a client calls `update-payment-intent` with discount metadata
- THEN the discount metadata is not changed

### Requirement: Single Use and Concurrency
A code MUST be redeemable at most once, including under concurrent attempts. A failed or abandoned payment MUST release the code. A successful payment MUST permanently consume it.

#### Scenario: Second use
- GIVEN a code consumed by a successful payment
- WHEN anyone validates or uses it
- THEN it is rejected

#### Scenario: Concurrent attempts
- GIVEN one unused code
- WHEN two payments try to use it simultaneously
- THEN at most one succeeds and the other is rejected

#### Scenario: Failed payment
- GIVEN a code held by a payment that fails or is abandoned
- WHEN the payment ends
- THEN the code becomes usable again

### Requirement: No Combination with Referral Codes
A purchase MUST NOT combine a discount code with a referral code. The existing referral flow MUST keep working.

#### Scenario: Both supplied
- GIVEN a valid discount code is applied
- WHEN a referral code is also submitted
- THEN the system rejects the combination

### Requirement: QR Deep Link
The event page MUST read `?code=`, auto-fill and validate it, and show the discounted total.

#### Scenario: QR scan
- GIVEN a valid unused code
- WHEN `/eventos/101?code=<code>` is opened
- THEN the code is applied and 15% off is displayed

#### Scenario: Invalid link code
- GIVEN an invalid `?code=` value
- WHEN the page loads
- THEN an error is shown and the full price applies

### Requirement: Redemption Recording
On confirmed payment the webhook MUST record redemption with working credentials, and a failure MUST be surfaced (logged), not silent.

#### Scenario: Payment succeeds
- GIVEN a payment with a discount code succeeds
- WHEN the webhook is processed
- THEN the code is marked redeemed with the session/payment reference
