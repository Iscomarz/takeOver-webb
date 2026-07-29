# Specification: Edge Security Shield

## Requirement 1: Bot Scraper Blocking
- **Given** an incoming HTTP request with a User-Agent header matching aggressive bots (AhrefsBot, SemrushBot, MJ12bot, DotBot, PetalBot, Bytespider, GPTBot, ClaudeBot, etc.)
- **When** the request hits `botAndScanBlocker` hook
- **Then** immediately return HTTP 403 Forbidden without executing downstream route handlers.

## Requirement 2: Directory Traversal and Vulnerability Scanner Defense
- **Given** an incoming HTTP request targeting known vulnerability paths (`/.env`, `/.git`, `/wp-admin`, `/xmlrpc.php`, `/phpmyadmin`, `..` path traversal, `.php`, `.asp`, `.bak`, `.sql`)
- **When** the request hits `botAndScanBlocker` hook
- **Then** immediately return HTTP 404 Not Found without executing downstream route handlers.

## Requirement 3: IP Rate Limiting on Critical Endpoints
- **Given** an incoming HTTP request to critical routes (`/api/checkout`, `/api/login`, `/api/registro-invitacion`)
- **When** the request count from the client IP exceeds the configured threshold (e.g. 10 requests per minute)
- **Then** return HTTP 429 Too Many Requests with a `Retry-After: 60` header.

## Requirement 4: HTTP Security Headers Injection
- **Given** any valid outgoing HTTP response
- **When** the response passes through `securityHeaders` hook
- **Then** append standard security headers:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
