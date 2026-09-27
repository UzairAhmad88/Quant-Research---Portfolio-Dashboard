# Production Deployment Runbook

Standard operating procedure for deploying the Quant Research Dashboard to production infrastructure.

---

## 1. Production Release Steps

1. **Tag Release**: Create immutable Git tag (e.g. `v1.0.0`).
2. **Execute Full CI Gate**: Ensure all backend, frontend, security, and container build steps pass.
3. **Database Pre-Deployment Snapshot**:
   ```bash
   ./scripts/backup_db.sh
   ```
4. **Apply Alembic Migrations**:
   ```bash
   ./scripts/migrate.sh
   ```
5. **Deploy Containers**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --remove-orphans
   ```
6. **Verify Health Probes**:
   ```bash
   ./scripts/healthcheck.sh
   ```
7. **Post-Deployment Smoke Verification**:
   - Verify frontend loads over HTTPS without mixed-content warnings.
   - Verify CSP headers are present in response headers.
   - Run end-to-end analytical workflow.
