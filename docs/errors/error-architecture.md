# Error Handling & Resilience Architecture

## 1. Overview & Guiding Philosophy

The Quant Research Dashboard is engineered as an institutional quantitative platform. In financial research, **a silent failure is far more dangerous than an explicit error**. Under no circumstances does the application silently swallow exceptions, fabricate market data, or disguise partial calculations as successful completions.

Our architectural workflow for failures is:
```text
Failure Occurs
      ↓
Detect (Strict bounds & validations)
      ↓
Classify (Standardized ErrorCode & ErrorSeverity)
      ↓
Log (Structured diagnostic entry with Request ID)
      ↓
Preserve Context (Active instrument, parameters, timestamps)
      ↓
Recover if Safe (Bounded retry or valid cached historical fallback)
      ↓
Expose Explicit State (Predictable API error envelope & accessible UI)
```

---

## 2. Multi-Tier Resilience Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  - GlobalErrorBoundary (Catastrophic root render failure)    │
│  - ModuleErrorBoundary (Isolates panel crashes)              │
│  - TanStack Query Controlled Retry (No retry on 4xx)        │
│  - Reusable States: ModuleErrorState, InsufficientDataState  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                       HTTP / JSON API
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                        BACKEND API                           │
│  - RequestCorrelationMiddleware (X-Request-ID propagation)   │
│  - Centralized Exception Handlers (AppException, 422, 500)   │
│  - Non-Finite Protection (NaN / Infinity -> None / null)     │
│  - Sanitized Error Messages (Zero leaked DB passwords/paths) │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                    PERSISTENCE & PROVIDERS                   │
│  - Database Transaction Safety (Rollback on ingestion error) │
│  - Provider Retry Policy (3 attempts, backoff + jitter)      │
│  - Cached Fallback (Stale warning instead of hard crash)     │
│  - Zero Data Fabrication (Never generate synthetic prices)   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Core Resilience Guarantees

1. **Deterministic Error Contracts**: Every failed API call returns a standardized JSON error envelope containing a machine-readable `code`, a human-readable `message`, optional `details`, and a `request_id`.
2. **Zero Fake Data on Failure**: If a provider is down and no valid cached observations exist, the system returns an explicit `PROVIDER_UNAVAILABLE` or `NOT_FOUND` error.
3. **Transactional Integrity**: Financial operations (market data ingestion, portfolio updates, backtests) execute inside atomic transactions. If any step fails, `session.rollback()` is invoked, leaving zero orphaned records.
4. **No Retry Storms**: Client retries are restricted to transient failures (502, 503, 504, 429). Client-side errors (400, 404, 409, 422) are never retried automatically.
