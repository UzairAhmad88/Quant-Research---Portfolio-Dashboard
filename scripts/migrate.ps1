<#
.SYNOPSIS
Database migration runner for Quant Research Dashboard (PowerShell).
#>
$ErrorActionPreference = "Stop"
Write-Host "==> Running Alembic database migrations..." -ForegroundColor Cyan

Push-Location backend
try {
    python -m alembic upgrade head
    if ($LASTEXITCODE -eq 0) {
        Write-Host "==> Database migrations applied successfully." -ForegroundColor Green
    } else {
        Write-Error "Alembic migration failed with exit code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}
