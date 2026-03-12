@echo off
chcp 65001 >nul
title Rybella - Backend + Admin

echo.
echo ========================================
echo   Rybella - تشغيل Backend ولوحة التحكم
echo ========================================
echo.
echo سيتم فتح نافذتين:
echo   1- Backend على المنفذ 5000
echo   2- لوحة التحكم على المنفذ 3001
echo.
echo افتح المتصفح على: http://localhost:3001
echo.
echo تسجيل الدخول:
echo   البريد: admin@rybella.iq
echo   كلمة المرور: Admin@123
echo.
echo اذا فشل الدخول: اعد تشغيل Backend او شغّل reset-admin.bat
echo ========================================
echo.

start "Rybella Backend" cmd /k "cd /d %~dp0backend && npm install && npm start"
timeout /t 3 /nobreak >nul
start "Rybella Admin" cmd /k "cd /d %~dp0admin-dashboard && npm install && npm run dev"

echo تم فتح النوافذ - يمكنك إغلاق هذه النافذة
pause
