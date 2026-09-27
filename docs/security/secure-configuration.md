# Secure Configuration Guide

The Quant Research Dashboard centralizes all configuration parameters in `app.core.config.Settings` (Pydantic BaseSettings).

---

## 1. Core Configuration Parameters

| Parameter | Type | Default (Development) | Production Requirement |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | `str` | `"development"` | Set to `"production"` |
| `DEBUG` | `bool` | `True` (dev only) | **MUST be `False`** |
| `SECRET_KEY` | `str` | `"dev-secret-change-in-production"` | **MUST be a 64+ char random cryptographically secure string** |
| `DATABASE_URL` | `str` | PostgreSQL connection string | Dedicated non-superuser credentials over TLS |
| `CORS_ORIGINS` | `List[str]` | `["http://localhost:5173", ...]` | Strict explicit domain allowlist (e.g. `["https://quant.internal.net"]`) |
| `RATE_LIMIT_ENABLED` | `bool` | `True` | `True` |
| `RATE_LIMIT_PER_MINUTE_STANDARD` | `int` | `120` | `120` |
| `RATE_LIMIT_PER_MINUTE_EXPENSIVE`| `int` | `60` | `60` |
| `MAX_CORRELATION_INSTRUMENTS` | `int` | `20` | `20` |
| `MAX_DATE_RANGE_YEARS` | `int` | `30` | `30` |
| `MAX_EXPORT_ROWS` | `int` | `50000` | `50000` |

---

## 2. Production Startup Validation

At startup, `validate_production_security()` executes during the FastAPI lifespan:
- Validates that `DEBUG` is `False`.
- Validates that `SECRET_KEY` is not using the default placeholder.
- Rejects wildcards (`*`) in `CORS_ORIGINS` when running in production.

If any invariant fails, application startup halts immediately with a clear error message.
