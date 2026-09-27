<#
.SYNOPSIS
Application liveness and readiness health check probe (PowerShell).
#>
param(
    [string]$ApiUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

Write-Host "==> Probing API Liveness: $ApiUrl/health..." -ForegroundColor Cyan
$liveRes = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get
if ($liveRes.status -eq "ok") {
    Write-Host "==> Liveness probe OK: $($liveRes.version) [$($liveRes.environment)]" -ForegroundColor Green
} else {
    Write-Error "Liveness probe returned unexpected status"
}

Write-Host "==> Probing API Readiness: $ApiUrl/health/ready..." -ForegroundColor Cyan
$readyRes = Invoke-RestMethod -Uri "$ApiUrl/health/ready" -Method Get
if ($readyRes.status -eq "ready" -and $readyRes.database -eq "connected") {
    Write-Host "==> Readiness probe OK: Database connected" -ForegroundColor Green
} else {
    Write-Error "Readiness probe failed"
}

Write-Host "==> Probing Version Endpoint: $ApiUrl/version..." -ForegroundColor Cyan
$verRes = Invoke-RestMethod -Uri "$ApiUrl/version" -Method Get
Write-Host "==> Application Version: $($verRes.version) (Build: $($verRes.build_id))" -ForegroundColor Green
Write-Host "==> All health checks passed successfully." -ForegroundColor Green
