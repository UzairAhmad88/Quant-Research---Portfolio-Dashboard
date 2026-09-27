# Database Migration Workflow (Alembic)

Database schema migrations are version-controlled, deterministic, and managed via Alembic.

---

## 1. Migration Deployment Order

During zero-downtime or blue/green deployments, adhere to the expand-and-contract pattern:

```
1. Deploy new schema additions (nullable columns, new tables) via Alembic.
2. Deploy backend code compatible with both old and new schema.
3. Migrate data if necessary.
4. Deploy code utilizing new schema strictly.
5. Apply contracting migration (drop obsolete columns/tables).
```

---

## 2. Executing Migrations

```bash
# Apply pending migrations to head
cd backend
python -m alembic upgrade head

# Or using the deployment helper script
./scripts/migrate.sh
```
