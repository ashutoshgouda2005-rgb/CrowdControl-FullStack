@echo off
title CrowdControl - Minimal System Startup
color 0A

echo.
echo ========================================
echo   CROWDCONTROL - MINIMAL SYSTEM
echo ========================================
echo.
echo [INFO] Starting minimal stable system...
echo.

REM Test if backend is already running
echo [CHECK] Testing backend connection...
python SIMPLE_TEST.py > temp_test.log 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Backend is running and healthy!
    echo.
    echo [INFO] Your CrowdControl system is ready:
    echo.
    echo   Frontend: http://localhost:5177
    echo   Backend:  http://127.0.0.1:8000
    echo   Login:    admin / admin123
    echo.
    echo [FEATURES] Available:
    echo   - Photo Upload and Analysis
    echo   - Live Camera Detection
    echo   - Real-time People Counting
    echo   - Smart Alerts
    echo.
    echo [NEXT] Open your browser to: http://localhost:5177
    echo.
) else (
    echo [ERROR] Backend is not running!
    echo.
    echo [ACTION] Please start the backend first:
    echo   1. Open new terminal
    echo   2. Navigate to backend folder
    echo   3. Run: python manage.py runserver
    echo.
)

REM Clean up temp file
if exist temp_test.log del temp_test.log

echo ========================================
echo   Press any key to exit...
echo ========================================
pause > nul
