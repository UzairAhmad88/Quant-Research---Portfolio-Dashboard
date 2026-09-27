# Database Backup Strategy

Automated, encrypted, and tested database backups protect research data, strategy definitions, and backtest results.

---

## 1. Backup Specifications

| Parameter | Specification |
| :--- | :--- |
| **Tool** | Native `pg_dump` with gzip compression |
| **Frequency** | Daily automated snapshot at 02:00 UTC |
| **Retention Policy** | 14 days rolling local retention / 90 days off-site S3 cold storage |
| **Storage Destination** | Secure encrypted volume / S3 bucket with versioning & SSE-KMS |
| **Execution Script** | [`scripts/backup_db.sh`](../../scripts/backup_db.sh) / [`scripts/backup_db.ps1`](../../scripts/backup_db.ps1) |

---

## 2. Manual Backup Execution

```bash
# Bash
./scripts/backup_db.sh

# PowerShell
.\scripts\backup_db.ps1 -DbHost "localhost" -DbName "quant_dashboard"
```
