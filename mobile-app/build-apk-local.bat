@echo off
REM Rybella Iraq - بناء APK محلياً
chcp 65001 >nul
set MOBILE_DIR=%~dp0
cd /d "%MOBILE_DIR%"
echo === 1. npm install ===
call npm install
if errorlevel 1 goto fail
echo.
echo === 2. expo prebuild --clean ===
call npx expo prebuild --clean
if errorlevel 1 goto fail
echo.
echo === 3. Fix gradle-wrapper.jar (if needed) ===
call node scripts/fix-gradle-wrapper.js
echo.
echo === 4. gradlew assembleRelease ===
cd android
call gradlew.bat assembleRelease
if errorlevel 1 goto fail
echo.
echo === نجح! ملف APK ===
echo %MOBILE_DIR%android\app\build\outputs\apk\release\app-release.apk
goto end
:fail
echo.
echo فشل البناء.
exit /b 1
:end
cd /d "%MOBILE_DIR%"
