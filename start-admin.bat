@echo off
chcp 65001 >nul
cd /d "%~dp0admin-dashboard"

echo.
echo ========================================
echo   Rybella - تشغيل لوحة التحكم
echo   Admin Dashboard
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Node.js غير مثبت أو غير موجود في PATH
    echo قم بتثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
)

echo تثبيت المتطلبات...
call npm install
if errorlevel 1 (
    echo [خطأ] فشل تثبيت المتطلبات
    pause
    exit /b 1
)

echo.
echo لوحة التحكم ستتاح على: http://localhost:3001
echo.
echo تسجيل الدخول الافتراضي:
echo   البريد: admin@rybella.iq
echo   كلمة المرور: Admin@123
echo.
echo مهم: يجب تشغيل Backend على المنفذ 5000 اولاً
echo اذا فشل الدخول: اعد تشغيل Backend او reset-admin.bat
echo.
echo اضغط Ctrl+C لإيقاف السيرفر
echo ========================================
echo.

call npm run dev
pause
