@echo off
chcp 65001 >nul
cd /d "%~dp0backend"

echo.
echo ========================================
echo   Rybella - تهيئة قاعدة البيانات
echo   Database Seed
echo ========================================
echo.
echo سيتم إنشاء/تحديث المستخدم المدير:
echo   البريد: admin@rybella.iq
echo   كلمة المرور: Admin@123
echo.
echo تأكد أن MySQL يعمل وقاعدة rybella_iraq موجودة
echo ========================================
echo.

node ../database/run-seed.js
echo.
pause
