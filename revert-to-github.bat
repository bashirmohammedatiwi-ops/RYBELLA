@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo   الرجوع لآخر تعديل في GitHub
echo ============================================
echo.
echo تحذير: سيتم إلغاء جميع التعديلات غير المحفوظة
echo        والملفات الجديدة ستحذف
echo.
set /p confirm="هل أنت متأكد؟ (y/n): "
if /i not "%confirm%"=="y" (
    echo تم الإلغاء
    pause
    exit /b 0
)

echo.
echo جاري التنفيذ...
echo.
git status
echo.
git reset --hard HEAD
echo.
echo لاحظ: الملفات الجديدة غير المضافة (مثل node_modules) باقية
echo لحذفها أيضاً شغّل: git clean -fd
echo.
echo ============================================
echo   تم - المشروع الآن مطابق لآخر commit
echo ============================================
pause
