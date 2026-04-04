# Rybella - تصدير APK محلياً على Windows
# المتطلبات: Node.js, JDK 17, Android SDK

$ErrorActionPreference = "Stop"
# PSScriptRoot = mobile-app/scripts, parent = mobile-app
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "=== 1. تثبيت الحزم ===" -ForegroundColor Cyan
npm install

Write-Host "`n=== 2. إصلاح node:sea (Windows) ===" -ForegroundColor Cyan
node scripts/fix-node-sea-windows.js

Write-Host "`n=== 3. إنشاء الأصول إن لم تكن موجودة ===" -ForegroundColor Cyan
if (-not (Test-Path "assets/adaptive-icon.png")) {
    node scripts/generate-assets.js
}

Write-Host "`n=== 4. حذف android وإعادة prebuild ===" -ForegroundColor Cyan
if (Test-Path "android") { Remove-Item -Recurse -Force android }
npx expo prebuild --platform android --clean

Write-Host "`n=== 5. إعداد Gradle ===" -ForegroundColor Cyan
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
# JDK 17 - adjust path if different on your system
$jdkPath = if (Test-Path "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot") { "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot" } else { "C:\Program Files\Java\jdk-17" }

# local.properties (escape backslashes for Java properties)
$sdkDir = $sdkPath -replace '\\', '\\\\'
@"
sdk.dir=$sdkDir
"@ | Set-Content -Path "android\local.properties" -Encoding UTF8

# gradle.properties - add JDK 17
$gradleProps = Get-Content "android\gradle.properties" -Raw
if ($gradleProps -notmatch "org.gradle.java.home") {
    $jdkDir = $jdkPath -replace '\\', '\\\\'
    $gradleProps = $gradleProps + "`norg.gradle.java.home=$jdkDir`n"
    Set-Content -Path "android\gradle.properties" -Value $gradleProps -Encoding UTF8
}

# Fix Gradle version if 9.x (incompatible with RN 0.73)
$wrapperProps = Get-Content "android\gradle\wrapper\gradle-wrapper.properties" -Raw
if ($wrapperProps -match "gradle-9\.\d") {
    $wrapperProps = $wrapperProps -replace "gradle-9\.\d+\.\d+", "gradle-8.3"
    Set-Content -Path "android\gradle\wrapper\gradle-wrapper.properties" -Value $wrapperProps -Encoding UTF8
}

Write-Host "`n=== 6. بناء APK ===" -ForegroundColor Cyan
Set-Location android
.\gradlew.bat --stop 2>$null
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    $fullPath = Join-Path $projectRoot "android\$apkPath"
    Write-Host "`n*** تم البناء بنجاح! ***" -ForegroundColor Green
    Write-Host "موقع APK: $fullPath" -ForegroundColor Green
} else {
    Write-Host "`n*** فشل البناء ***" -ForegroundColor Red
    exit 1
}
