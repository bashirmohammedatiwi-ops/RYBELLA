@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo   Rybella - رفع المشروع عبر Docker
echo   المنفذ: 4000
echo ============================================
echo.

if not exist .env (
    echo إنشاء .env من .env.example...
    copy .env.example .env
    echo.
    echo راجع ملف .env وعدّل JWT_SECRET و API_URL
    echo.
)

echo بناء وتشغيل الحاويات...
echo.
docker compose up -d --build

echo.
echo ============================================
echo   تم - افتح: http://localhost:4000
echo   لوحة التحكم: admin@rybella.iq / Admin@123
echo ============================================
pause
