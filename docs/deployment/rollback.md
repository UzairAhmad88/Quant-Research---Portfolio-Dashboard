# Rollback Strategy & Procedures

Emergency rollback instructions for recovering to a previously known stable state.

---

## 1. Application Container Rollback

Because container images are immutable and tagged per version:
```bash
# Point deployment to previous container tag
export APP_TAG=v0.9.9
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## 2. Database Schema Rollback

- For backward-compatible migrations, no immediate database rollback is required.
- If a schema downgrade is strictly necessary:
  ```bash
  cd backend
  # Revert single migration step
  python -m alembic downgrade -1
  ```
- If data corruption occurred, restore from the pre-deployment backup using [`scripts/restore_db.sh`](../../scripts/restore_db.sh).
