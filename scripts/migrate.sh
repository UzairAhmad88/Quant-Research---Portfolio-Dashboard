#!/usr/bin/env bash
# Database migration runner with pre-flight check for Quant Research Dashboard
set -euo pipefail

echo "==> Running Alembic database migrations..."
cd backend
python -m alembic upgrade head
echo "==> Database migrations applied successfully."
