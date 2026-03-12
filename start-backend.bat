@echo off
chcp 65001 >nul
cd /d "%~dp0backend"

echo.
echo ========================================
echo   Rybella - تشغيل الـ Backend
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Node.js غير مثبت
    pause
    exit /b 1
)

if not exist ".env" (
    echo [تحذير] ملف .env غير موجود
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo تم إنشاء .env من .env.example - راجع الإعدادات
    )
)

echo تثبيت المتطلبات...
call npm install
if errorlevel 1 (
    echo [خطأ] فشل تثبيت المتطلبات
    pause
    exit /b 1
)

echo.
echo Backend يعمل على: http://localhost:5000
echo اضغط Ctrl+C للإيقاف
echo ========================================
echo.

call npm start
pause
