<#
.SYNOPSIS
Database restoration and integrity verification script for Quant Research Dashboard (PowerShell).
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DbName = "quant_dashboard",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "postgres",
    [string]$Password = $env:PGPASSWORD
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file '$BackupFile' does not exist."
}

Write-Host "==> Restoring database '$DbName' from '$BackupFile'..." -ForegroundColor Cyan

if ($Password) {
    $env:PGPASSWORD = $Password
}

psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "==> Restoration complete. Verifying schema integrity..." -ForegroundColor Green
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "SELECT count(*) AS total_instruments FROM core.instruments;"
    Write-Host "==> Database restore verified successfully." -ForegroundColor Green
} else {
    Write-Error "Database restoration failed with exit code $LASTEXITCODE"
}
