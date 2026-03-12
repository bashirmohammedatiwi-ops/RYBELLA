@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   Rybella - اعادة تعيين المدير
echo ========================================
echo.
echo الطريقة 1: اعد تشغيل Backend فقط
echo    - اغلاق نافذة Backend (Ctrl+C)
echo    - تشغيل start-all.bat من جديد
echo    - عند بدء التشغيل يتم تعيين كلمة المرور تلقائياً
echo.
echo الطريقة 2: اذا لم تنجح - احذف قاعدة البيانات
echo    - سيتم حذف backend\database\rybella.db الآن
echo.
echo البريد: admin@rybella.iq
echo كلمة المرور: Admin@123
echo ========================================
echo.

set /p choice="احذف قاعدة البيانات الآن؟ (y/n): "
if /i "%choice%"=="y" (
    if exist "backend\database\rybella.db" (
        del "backend\database\rybella.db"
        echo تم الحذف. شغّل start-all.bat
    ) else (
        echo الملف غير موجود
    )
) else (
    echo اعد تشغيل Backend فقط من start-all.bat
)

echo.
pause
