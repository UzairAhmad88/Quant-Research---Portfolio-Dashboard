# Security Architecture Overview

The **Quant Research Dashboard** enforces a defense-in-depth security model across every layer of the application lifecycle. Built for institutional quantitative analysis and market research, the platform couples numerical precision with defensive engineering.

---

## 1. Security Architecture Diagram

```
[ Browser / Client ]
        │  (HTTPS / Strict-Transport-Security / CSP / Referrer-Policy)
        ▼
[ Edge / Reverse Proxy / Fastify/FastAPI Middleware ]
        │  ├── SecurityHeadersMiddleware (nosniff, DENY frame, CSP, XSS protection)
        │  ├── RequestCorrelationMiddleware (UUID tracing, Header/Secret Redaction)
        │  └── RateLimitingMiddleware (Sliding-window IP throttles: 120/min standard, 60/min heavy)
        ▼
[ API Validation & Boundary ]
        │  ├── Pydantic Schemas (Types, bounds, ISO-UTC timestamps, enum allowlists)
        │  └── Error Envelopes (No stack traces, no internal paths, safe user messages)
        ▼
[ Service & Analytics Engine ]
        │  ├── Resource Limits (MAX_CORRELATION_INSTRUMENTS=20, rolling windows 2..500)
        │  ├── Non-Finite Protection (NaN / Inf / Zero-Division bounds)
        │  └── Export Protections (Path traversal sanitization, CSV formula injection defense)
        ▼
[ Repositories & Data Access ]
        │  └── SQLAlchemy ORM (100% Parameterized queries, No dynamic SQL concatenation)
        ▼
[ Database (PostgreSQL) ]
        └── Schema Isolation (core schema, Least-privilege role, TLS, Constraints)

[ External Providers ] ──► [ Provider Allowlist / Timeout / Response Validation ] ──► [ Ingestion QC ]
```

---

## 2. Core Security Principles

1. **Never Trust Input**: All URL parameters, query strings, request bodies, HTTP headers, uploaded data, and provider responses are treated as untrusted.
2. **Fail Securely & Explicitly**: Invalid requests are rejected with structured error codes (`VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED`). We never silently sanitize dangerous values into unintended domain values.
3. **Least Privilege**: Dedicated database users, isolated schemas, and separated runtime credentials ensure access is limited to strictly required capabilities.
4. **Zero Secrets in Source**: No credentials, API tokens, or encryption keys are committed to Git. Production secrets must be provided via external environment variables.
5. **Information Leakage Defense**: Production errors conceal internal file structures, database hosts, SQL syntax, and stack traces while logging correlated request IDs for diagnostics.
6. **Data Integrity as Security**: Financial calculations and market records are protected against corruption, duplicate insertions, and out-of-order timestamps.
