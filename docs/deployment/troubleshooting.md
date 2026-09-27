# Deployment Troubleshooting & Incident Diagnostic Guide

Diagnostic steps for addressing common production deployment and runtime issues.

---

## 1. Issue Diagnostic Matrix

### Issue 1: `GET /health/ready` returns 503 "Database connection unavailable"
- **Cause**: Database container not healthy, credentials mismatch, or PostgreSQL connection limit reached.
- **Diagnostic**:
  ```bash
  docker logs quant_postgres_prod
  docker exec -it quant_backend_prod python -c "from app.db.session import engine; engine.connect()"
  ```
- **Fix**: Verify `DATABASE_URL` matches credentials, ensure PostgreSQL is accepting connections.

### Issue 2: Frontend returns 404 on page refresh (e.g. `/backtesting`)
- **Cause**: Nginx SPA fallback rule missing.
- **Diagnostic**: Check `docker/nginx/frontend.conf` for `try_files $uri $uri/ /index.html;`.
- **Fix**: Rebuild frontend image with updated Nginx configuration.

### Issue 3: Market Data fetch fails with HTTP 422 "Provider ... not in allowlist"
- **Cause**: Request specifies unknown or unapproved market data provider name.
- **Fix**: Ensure request uses `yahoo_finance` or supported provider aliases.

### Issue 4: Rate limit 429 triggered during legitimate operations
- **Cause**: Rate limiting threshold exceeded by automated testing or batch operations.
- **Fix**: Adjust `RATE_LIMIT_PER_MINUTE_STANDARD` or `RATE_LIMIT_PER_MINUTE_EXPENSIVE` in production environment variables.
