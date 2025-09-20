@echo off
title CrowdControl Frontend Server
echo.
echo ========================================
echo   STARTING CROWDCONTROL FRONTEND
echo ========================================
echo.

cd /d "%~dp0\frontend"

echo [INFO] Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo [INFO] Installing/updating dependencies...
call npm install

echo [INFO] Starting Vite development server...
echo [INFO] Frontend will be available at: http://localhost:5173
echo.

call npm run dev

pause
