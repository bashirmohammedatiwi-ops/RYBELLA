@echo off
if not exist backend\node_modules (
    echo Installing packages...
    cd backend && npm install && cd ..
)
if not exist backend\.env copy backend\.env.example backend\.env
if not exist backend\database mkdir backend\database
if not exist backend\uploads mkdir backend\uploads

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /F /PID %%a 2>nul
timeout /t 1 /nobreak >nul

title Rybella Backend
cd backend && node server.js
pause
