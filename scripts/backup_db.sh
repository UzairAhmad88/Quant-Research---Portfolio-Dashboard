#!/usr/bin/env bash
# Automated timestamped PostgreSQL database backup script for Quant Research Dashboard
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-quant_dashboard}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_DIR}"
BACKUP_FILE="${BACKUP_DIR}/quant_backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "==> Starting database backup for '${DB_NAME}' at ${TIMESTAMP}..."
PGPASSWORD="${PGPASSWORD:-password}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner | gzip > "${BACKUP_FILE}"

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "==> Backup completed successfully: ${BACKUP_FILE} (${FILESIZE})"

# Enforce retention policy: purge backups older than RETENTION_DAYS
echo "==> Purging backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "quant_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete
echo "==> Backup maintenance complete."
