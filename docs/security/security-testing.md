# Security Testing Suite & Verification

The automated security test suite lives in `backend/tests/security/` and validates defensive invariants on every build.

---

## 1. Automated Test Coverage

The security test suite (`test_security_hardening.py`) verifies 8 core security domains:

1. **SQL Injection Defense**:
   - Tests instrument search, market data filtering, and portfolio naming against classic injection vectors (`' OR '1'='1`, `'; DROP TABLE core.instruments; --`, UNION queries, comment syntax).
2. **Input Validation & Malformed Payloads**:
   - Tests invalid UUID handling, date range reversal rejection, excessive date range limits (> 35 years), and oversized string payloads.
3. **Resource Limits & DoS Defense**:
   - Tests correlation instrument count limits (rejection $> 20$), rolling volatility window bounds ($W < 2$ or $W > 500$), and pagination caps.
4. **SSRF & Provider Whitelisting**:
   - Tests rejection of untrusted providers and arbitrary internal/external URLs (`http://169.254.169.254`).
5. **Export Security**:
   - Tests filename path traversal sanitization (`../../../../etc/passwd`, null bytes, Windows path separators) and CSV formula injection neutralization.
6. **Security Headers**:
   - Verifies defensive HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Content-Security-Policy`, `Permissions-Policy`, `X-Request-ID`).
7. **Rate Limiting Middleware**:
   - Verifies that excessive requests trip the sliding-window limiter, returning HTTP 429 with `RATE_LIMITED` error envelope and `Retry-After`.
8. **Error Information Leakage**:
   - Verifies that 404, 422, and 500 responses do not leak internal database names, Python stack traces, or environment secrets.

---

## 2. Running Security Tests

```bash
# Run security test suite exclusively
$env:PYTHONPATH="backend"; python -m pytest backend/tests/security/ -v

# Run full project test suite
$env:PYTHONPATH="backend"; python -m pytest backend/tests/
```
