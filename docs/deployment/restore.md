# Database Restoration & Recovery Runbook

Step-by-step restoration and recovery procedure in the event of database failure or corrupted state.

---

## 1. Disaster Recovery Sequence

```
1. Provision or reset target PostgreSQL instance.
2. Ensure database user credentials and permissions are created.
3. Execute restore script with target backup archive.
4. Verify schema structure and row counts across core.instruments and market_data.ohlcv_bars.
5. Apply any pending Alembic migrations if restoring to newer code release.
6. Trigger backend /health/ready probe to verify connectivity.
```

---

## 2. Restoration Command

```bash
# Bash
./scripts/restore_db.sh ./backups/quant_backup_quant_dashboard_20260926_020000.sql.gz quant_dashboard

# PowerShell
.\scripts\restore_db.ps1 -BackupFile ".\backups\quant_backup_quant_dashboard_20260926_020000.sql" -DbName "quant_dashboard"
```
