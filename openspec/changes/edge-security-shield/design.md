# Technical Design: Edge Security Shield

## Architecture Overview
The security shield is implemented using SvelteKit's native `handle` chain via `sequence()` inside `src/hooks.server.js`.

```
Incoming Request
       │
       ▼
┌──────────────────────────────┐
│  1. botAndScanBlocker        │ ──► [Matched Bot/Path?] ──► Return 403 / 404
└──────────────┬───────────────┘
               │ Pass
               ▼
┌──────────────────────────────┐
│  2. rateLimiter              │ ──► [Exceeded Limit?] ──► Return 429
└──────────────┬───────────────┘
               │ Pass
               ▼
┌──────────────────────────────┐
│  3. SvelteKit Route Handler  │ ──► Execute App Logic / API Endpoint
└──────────────┬───────────────┘
               │ Response
               ▼
┌──────────────────────────────┐
│  4. securityHeaders          │ ──► Inject Security Headers
└──────────────┬───────────────┘
               │
               ▼
        Client Response
```

## Performance & Memory Management
- **Regex Compilation**: Compiled once at module load time for $O(1)$ evaluation.
- **Client IP Resolution**: Extract client IP safely using `x-forwarded-for` (first entry), `x-real-ip`, or `event.getClientAddress()`.
- **In-Memory Rate Limiter Cleanup**: Garbage collection of stale IPs via `setInterval` every window interval.

## Extensibility
- Supports seamless drop-in of Redis (`@upstash/ratelimit`) for serverless multi-instance rate limiting in production without altering the hook structure.
