# API Security & Middleware Pipeline

The API layer establishes defense-in-depth through layered middleware, strong Pydantic schema validation, and rate limiting.

---

## 1. Middleware Order & Functions

1. **SecurityHeadersMiddleware**:
   - `X-Content-Type-Options: nosniff` (Prevents MIME-type sniffing attacks)
   - `X-Frame-Options: DENY` (Mitigates clickjacking in iframes)
   - `X-XSS-Protection: 1; mode=block` (Legacy browser XSS filter)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()`
   - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http: https:;`
   - `Strict-Transport-Security` (Appended automatically when running under HTTPS / production)
2. **RequestCorrelationMiddleware**:
   - Assigns or passes through unique `X-Request-ID` UUID on every request.
   - Formats uniform request logs and redacts sensitive headers.
3. **RateLimitingMiddleware**:
   - Sliding-window in-memory limiter tracking client IP addresses.
   - Enforces 120 requests/minute for standard read endpoints.
   - Enforces 60 requests/minute for heavy calculation and ingestion endpoints (`/market-data/fetch`, `/backtests/run`, `/export`, `/correlation`).
   - Returns structured `429 Too Many Requests` with `Retry-After: 60` and `RATE_LIMITED` error code.
4. **CORSMiddleware**:
   - Rejects wildcards (`*`) in production.
   - Whitelists explicit HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`) and headers.

---

## 2. API Contract & Error Envelopes

All errors return a standardized JSON structure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Maximum 20 instruments can be analyzed at once.",
    "details": null,
    "request_id": "7a35607b-8919-4cb5-aebe-99222c36ca2b",
    "timestamp": "2026-09-26T18:00:00.000000Z"
  }
}
```
Production mode never exposes Python tracebacks, database table names, or raw SQL queries to clients.
