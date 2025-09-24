@echo off
echo ========================================
echo CrowdControl Integration Quick Test
echo ========================================
echo.

echo [INFO] Testing Django + Vite Integration...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "backend\manage.py" (
    echo [ERROR] Please run this script from the CrowdControl root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [INFO] Running comprehensive integration tests...
echo.

REM Run the Python integration test
python INTEGRATION_TEST_COMPLETE.py

echo.
echo ========================================
echo Integration Test Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Check the test results above
echo 2. If tests passed, your integration is working!
echo 3. If tests failed, check DEBUGGING_GUIDE.md
echo 4. Start your servers and test manually:
echo    - Backend: python manage.py runserver 127.0.0.1:8000
echo    - Frontend: npm run dev
echo.
pause
