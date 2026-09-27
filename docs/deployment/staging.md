# Staging Deployment & Pre-Production Verification

The staging environment replicates production topology with isolated staging credentials, providing a sandbox for pre-release validation.

---

## 1. Staging Pre-Flight Verification Checklist

Before promoting any release build to production:

1. **Deploy Build to Staging**: Build and deploy candidate container images.
2. **Execute Database Migrations**: Run `./scripts/migrate.sh` against staging database.
3. **Run Health Probes**:
   - `GET /health` returns HTTP 200 `status: "ok"`.
   - `GET /health/ready` returns HTTP 200 `status: "ready"`, `database: "connected"`.
   - `GET /version` matches candidate release version and commit hash.
4. **Smoke Test Analytical Modules**:
   - Market Data acquisition (fetch historical bars for SPY, AAPL).
   - Return metrics & distribution calculations.
   - Correlation matrix calculation across 5 instruments.
   - Volatility summary & rolling calculation.
   - Moving average strategy crossover signals.
   - Backtesting engine simulation with full trade logs.
   - CSV and PDF export generation.
