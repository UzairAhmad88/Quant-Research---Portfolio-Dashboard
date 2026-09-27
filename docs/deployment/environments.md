# Environment Separation Strategy

To ensure zero cross-contamination of financial research state, credentials, or test fixtures, four distinct operating environments are maintained:

---

## 1. Environment Matrix

| Parameter | Development | Testing / CI | Staging | Production |
| :--- | :--- | :--- | :--- | :--- |
| `APP_ENV` | `development` | `testing` | `staging` | `production` |
| `DEBUG` | `True` | `False` | `False` | `False` |
| **Database** | Local PostgreSQL or SQLite | Ephemeral PostgreSQL instance | Dedicated Staging Database | High-Availability Managed PostgreSQL |
| **Provider Adapter** | Mock / Live Yahoo Finance | Mock / Recorded Provider Fixtures | Live Yahoo Finance (Rate-controlled) | Live Yahoo Finance / Enterprise Provider |
| **CORS Origins** | `localhost:5173`, `localhost:3000` | None required | `https://staging.quant.internal` | `https://quant.internal.net` |
| **Log Level** | `DEBUG` / `INFO` | `WARNING` | `INFO` | `INFO` / `WARNING` |
| **OpenAPI / Docs** | Enabled (`/docs`, `/redoc`) | Disabled | Enabled (Internal VPN) | Disabled |
