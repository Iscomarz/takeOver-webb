# Delta for Edge Security Shield

## MODIFIED Requirements

## Requirement 3: IP Rate Limiting on Critical Endpoints
- **Given** an incoming HTTP request to critical routes (`/api/checkout`, `/api/login`, `/api/registro-invitacion`, the discount code validation endpoint, `/api/create-payment-intent`)
- **When** the request count from the client IP exceeds the configured threshold (e.g. 10 requests per minute)
- **Then** return HTTP 429 Too Many Requests with a `Retry-After: 60` header.
(Previously: the route list excluded discount validation and `/api/create-payment-intent`)

### Scenario: Validation endpoint brute force
- GIVEN a client IP has exceeded the threshold on the discount validation endpoint
- WHEN it sends another validation request within the window
- THEN HTTP 429 with `Retry-After: 60` is returned

### Scenario: Payment intent flooding
- GIVEN a client IP has exceeded the threshold on `/api/create-payment-intent`
- WHEN it sends another request within the window
- THEN HTTP 429 with `Retry-After: 60` is returned
