# Change Proposal: Edge Security Shield

## Summary
Implement a framework-native preventive security shield in SvelteKit using `src/hooks.server.js` and `sequence()` to protect the application against aggressive scrapers, directory traversal/vulnerability scanners, and excessive rate limit abuse on critical endpoints.

## Motivation
Transactional platforms (ticket checkout, invitation registration, authentication) are high-value targets for bots, scrapers, and scanners. Blocking bad actors before reaching application routes saves serverless resources, prevents resource exhaustion, and strengthens security posture.

## Scope
- Global Bot Scraper Blocking via User-Agent inspection (403 Forbidden).
- Directory Traversal & Vulnerability Scanner Blocking via Path inspection (404 Not Found / 403 Forbidden).
- Rate Limiting on critical endpoints (`/api/checkout`, `/api/login`, `/api/registro-invitacion`) by Client IP (429 Too Many Requests).
- Security Headers injection (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`).

## Impacted Files
- `src/hooks.server.js` (new)
