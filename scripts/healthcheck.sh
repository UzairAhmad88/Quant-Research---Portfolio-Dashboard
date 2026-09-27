#!/usr/bin/env bash
# Application liveness and readiness health check probe
set -euo pipefail

API_URL="${API_URL:-http://localhost:8000}"

echo "==> Probing API Liveness: ${API_URL}/health..."
LIVENESS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health")
if [ "${LIVENESS_STATUS}" -ne 200 ]; then
    echo "ERROR: Liveness probe failed with HTTP ${LIVENESS_STATUS}"
    exit 1
fi
echo "==> Liveness probe OK (HTTP 200)."

echo "==> Probing API Readiness: ${API_URL}/health/ready..."
READINESS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health/ready")
if [ "${READINESS_STATUS}" -ne 200 ]; then
    echo "ERROR: Readiness probe failed with HTTP ${READINESS_STATUS}"
    exit 1
fi
echo "==> Readiness probe OK (HTTP 200)."

echo "==> Probing Application Version: ${API_URL}/version..."
curl -s "${API_URL}/version" | grep -q "version"
echo "==> All health probes passed successfully."
