<#
.SYNOPSIS
Automated timestamped PostgreSQL database backup script for Quant Research Dashboard (PowerShell).
#>
param(
    [string]$BackupDir = "./backups",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "postgres",
    [string]$DbName = "quant_dashboard",
    [string]$Password = $env:PGPASSWORD,
    [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$BackupFile = Join-Path $BackupDir "quant_backup_${DbName}_${Timestamp}.sql"
Write-Host "==> Starting database backup for '$DbName' at $Timestamp..." -ForegroundColor Cyan

if ($Password) {
    $env:PGPASSWORD = $Password
}

pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName --clean --if-exists --no-owner -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    $Size = (Get-Item $BackupFile).Length / 1MB
    Write-Host ("==> Backup completed successfully: {0} ({1:N2} MB)" -f $BackupFile, $Size) -ForegroundColor Green
    
    # Retention cleanup
    $Cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "quant_backup_*.sql" | Where-Object { $_.LastWriteTime -lt $Cutoff } | Remove-Item -Force
    Write-Host "==> Retention cleanup complete." -ForegroundColor Green
} else {
    Write-Error "Backup failed with exit code $LASTEXITCODE"
}
