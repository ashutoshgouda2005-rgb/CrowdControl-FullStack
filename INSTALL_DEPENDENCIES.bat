@echo off
title Installing Frontend Dependencies
echo.
echo ========================================
echo   INSTALLING FRONTEND DEPENDENCIES
echo ========================================
echo.

cd /d "%~dp0\frontend"

echo [INFO] Installing dependencies...
call npm install

echo.
echo [INFO] Dependencies installed successfully!
echo [INFO] You can now start the frontend with: npm run dev
echo.

pause
