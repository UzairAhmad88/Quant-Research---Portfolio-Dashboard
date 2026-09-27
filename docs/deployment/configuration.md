# Production Configuration Guide

All application configuration is validated via Pydantic (`app.core.config.Settings`) at container startup.

---

## 1. Environment Variable Reference

```ini
# Core Runtime
APP_ENV=production
DEBUG=false
BUILD_ID=20260926.1
LOG_LEVEL=INFO

# Security & Secrets
SECRET_KEY=replace_with_64_character_hex_random_key_in_production
CORS_ORIGINS=["https://quant.internal.net"]

# Database Connection (PostgreSQL with psycopg3 driver)
DATABASE_URL=postgresql+psycopg://quant_user:secure_password@postgres.internal:5432/quant_dashboard?sslmode=require

# Rate Limiting Controls
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE_STANDARD=120
RATE_LIMIT_PER_MINUTE_EXPENSIVE=60

# Quantitative Resource Bounds
MAX_CORRELATION_INSTRUMENTS=20
MAX_DATE_RANGE_YEARS=30
MAX_EXPORT_ROWS=50000

# Market Data Ingestion
MARKET_DATA_PROVIDER=yahoo_finance
MARKET_DATA_TIMEOUT=10
MARKET_DATA_RETRY_LIMIT=3
```

---

## 2. Secrets Injection

Never store production `.env` files in source repositories. Deploy secrets using AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets, or Docker Secrets.
