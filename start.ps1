# Rybella - تشغيل من PowerShell (يتعامل مع المسارات العربية)
$ErrorActionPreference = "Stop"
$project = $PSScriptRoot

if (-not (Test-Path "$project\run.js")) {
    Write-Host "[خطأ] run.js غير موجود" -ForegroundColor Red
    exit 1
}

Set-Location -LiteralPath $project
node run.js
