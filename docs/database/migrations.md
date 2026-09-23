# Database Migrations — Alembic Workflow

Managing PostgreSQL database migrations for Quant Research Dashboard.

---

## 1. Environment Setup

Alembic configuration is managed in `backend/alembic.ini` and `backend/alembic/env.py`.

DATABASE_URL is dynamically read from environment variables (`.env` or system environment):

```bash
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/quant_dashboard
```

---

## 2. Migration Commands

### Apply All Pending Migrations
```bash
cd backend
alembic upgrade head
```

### Rollback Last Migration
```bash
cd backend
alembic downgrade -1
```

### Generate New Migration
```bash
cd backend
alembic revision -m "description_of_changes"
```

---

## 3. Migration Policy

- **Never use `Base.metadata.create_all()` in production**: All database schema changes MUST be driven through versioned Alembic migration files in `backend/alembic/versions/`.
- **Reproducibility**: Migrations must be capable of running from scratch on a clean PostgreSQL database.
