@echo off
title Installing Minimal Frontend Dependencies
echo.
echo ========================================
echo   INSTALLING MINIMAL DEPENDENCIES
echo ========================================
echo.

cd /d "%~dp0\frontend"

echo [INFO] Cleaning old dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo [INFO] Installing minimal dependencies...
call npm install

echo.
echo [INFO] Minimal dependencies installed successfully!
echo [INFO] Starting frontend server...
call npm run dev

pause
