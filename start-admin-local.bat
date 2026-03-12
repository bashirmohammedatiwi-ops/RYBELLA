@echo off
chcp 65001 >nul
title Rybella - لوحة التحكم محلياً

cd /d "%~dp0"

echo.
echo ============================================
echo   Rybella - تشغيل لوحة التحكم محلياً
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Node.js غير مثبت
    pause
    exit /b 1
)

echo [1/4] تثبيت Backend...
cd backend
call npm install --silent 2>nul
if not exist node_modules (
    call npm install
)
echo [2/4] تشغيل Backend...
start "Backend" cmd /k "cd /d %~dp0backend && node server.js"
cd ..
timeout /t 4 /nobreak >nul

echo [3/4] تثبيت Admin...
cd admin-dashboard
call npm install --silent 2>nul
if not exist node_modules (
    call npm install
)
echo [4/4] تشغيل لوحة التحكم...
start "Admin" cmd /k "cd /d %~dp0admin-dashboard && npx vite --port 3001"
cd ..
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   تم التشغيل
echo   افتح: http://localhost:3001
echo   تسجيل الدخول معطل - ستفتح مباشرة
echo ============================================
echo.
start http://localhost:3001
echo تم فتح المتصفح
pause
