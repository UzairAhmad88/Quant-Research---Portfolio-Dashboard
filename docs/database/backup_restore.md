# PostgreSQL Backup, Restore, & Seeding Guide

Procedures for managing PostgreSQL data backups, restores, and reference seed data.

---

## 1. Reference Seeding (Development Only)

To populate reference metadata (`AAPL`, `MSFT`, `SPY`, `BTC/USD`) into `core.instruments`:

```bash
cd backend
python -m app.db.seed
```

> [!NOTE]
> **No Fake Market Data Guarantee**: The seed script registers instrument metadata only. No fake historical OHLCV prices, volume, or returns are generated.

---

## 2. PostgreSQL Backup (`pg_dump`)

### Export Complete Database
```bash
docker exec -t quant-dashboard-db pg_dump -U postgres -d quant_dashboard -F c -b -v -f /var/lib/postgresql/data/quant_backup.dump
```

### Export Specific Schemas Only (`core` & `market_data`)
```bash
docker exec -t quant-dashboard-db pg_dump -U postgres -d quant_dashboard --schema=core --schema=market_data -F p > backup_schemas.sql
```

---

## 3. PostgreSQL Restore (`pg_restore` / `psql`)

### Restore Compressed Dump
```bash
docker exec -i quant-dashboard-db pg_restore -U postgres -d quant_dashboard -v < quant_backup.dump
```

### Development Database Reset
```bash
cd backend
alembic downgrade base
alembic upgrade head
python -m app.db.seed
```
