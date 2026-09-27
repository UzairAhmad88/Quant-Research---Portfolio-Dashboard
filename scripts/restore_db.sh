#!/usr/bin/env bash
# Database restoration and integrity verification script for Quant Research Dashboard
set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql[.gz]> [db_name]"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${2:-quant_dashboard}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' does not exist."
    exit 1
fi

echo "==> Restoring database '${DB_NAME}' from '${BACKUP_FILE}'..."

if [[ "${BACKUP_FILE}" == *.gz ]]; then
    gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${PGPASSWORD:-password}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"
else
    PGPASSWORD="${PGPASSWORD:-password}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${BACKUP_FILE}"
fi

echo "==> Restoration complete. Verifying schema integrity..."
PGPASSWORD="${PGPASSWORD:-password}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) AS total_instruments FROM core.instruments;"

echo "==> Verification successful."
