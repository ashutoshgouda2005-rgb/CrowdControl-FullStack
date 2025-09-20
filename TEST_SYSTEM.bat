@echo off
title CrowdControl - System Test & Verification
color 0E

echo.
echo ========================================
echo    CROWDCONTROL SYSTEM TEST SUITE
echo ========================================
echo.

echo 🔍 Testing system components...
echo.

REM Test 1: Check if Python is available
echo [1/8] Testing Python installation...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python is installed
) else (
    echo ❌ Python not found - please install Python 3.11+
    goto :error
)

REM Test 2: Check if Node.js is available
echo [2/8] Testing Node.js installation...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js is installed
) else (
    echo ❌ Node.js not found - please install Node.js 18+
    goto :error
)

REM Test 3: Check virtual environment
echo [3/8] Testing Python virtual environment...
if exist "venv\Scripts\activate.bat" (
    echo ✅ Virtual environment found
) else (
    echo ❌ Virtual environment not found - creating one...
    python -m venv venv
    if %errorlevel% equ 0 (
        echo ✅ Virtual environment created
    ) else (
        echo ❌ Failed to create virtual environment
        goto :error
    )
)

REM Test 4: Check backend dependencies
echo [4/8] Testing backend dependencies...
call venv\Scripts\activate.bat
pip show django >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Django is installed
) else (
    echo ⚠️  Installing backend dependencies...
    pip install -r backend\requirements.txt
    if %errorlevel% equ 0 (
        echo ✅ Backend dependencies installed
    ) else (
        echo ❌ Failed to install backend dependencies
        goto :error
    )
)

REM Test 5: Check frontend dependencies
echo [5/8] Testing frontend dependencies...
cd frontend
if exist "node_modules" (
    echo ✅ Frontend dependencies found
) else (
    echo ⚠️  Installing frontend dependencies...
    npm install
    if %errorlevel% equ 0 (
        echo ✅ Frontend dependencies installed
    ) else (
        echo ❌ Failed to install frontend dependencies
        cd ..
        goto :error
    )
)
cd ..

REM Test 6: Test database migration
echo [6/8] Testing database setup...
call venv\Scripts\activate.bat
cd backend
python manage.py migrate --check >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database is up to date
) else (
    echo ⚠️  Running database migrations...
    python manage.py migrate
    if %errorlevel% equ 0 (
        echo ✅ Database migrations completed
    ) else (
        echo ❌ Database migration failed
        cd ..
        goto :error
    )
)
cd ..

REM Test 7: Test backend startup
echo [7/8] Testing backend server startup...
call venv\Scripts\activate.bat
cd backend
timeout /t 1 /nobreak >nul
start /min "Test Backend" cmd /c "python manage.py runserver 127.0.0.1:8001 --noreload"
timeout /t 5 /nobreak >nul

REM Check if backend is responding
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8001/api/health/' -TimeoutSec 10; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend server is responding
    taskkill /f /im python.exe /fi "WINDOWTITLE eq Test Backend*" >nul 2>&1
) else (
    echo ❌ Backend server failed to start or respond
    taskkill /f /im python.exe /fi "WINDOWTITLE eq Test Backend*" >nul 2>&1
    cd ..
    goto :error
)
cd ..

REM Test 8: Test frontend build
echo [8/8] Testing frontend build...
cd frontend
npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend build successful
    if exist "dist\index.html" (
        echo ✅ Frontend build files created
    ) else (
        echo ❌ Frontend build files not found
        cd ..
        goto :error
    )
) else (
    echo ❌ Frontend build failed
    cd ..
    goto :error
)
cd ..

echo.
echo ========================================
echo           🎉 ALL TESTS PASSED! 🎉
echo ========================================
echo.
echo Your CrowdControl system is ready to use!
echo.
echo 🚀 To start the application:
echo    1. Run START_UNIVERSAL_ACCESS.bat
echo    2. Open http://localhost:5174 in your browser
echo    3. Create an account and start monitoring!
echo.
echo 📱 For mobile access:
echo    - Use your IP address: http://192.168.1.26:5174
echo    - Make sure devices are on the same Wi-Fi network
echo.
echo 🔧 System Status:
echo    ✅ Backend: Ready (Django + AI Model)
echo    ✅ Frontend: Ready (React + Vite)
echo    ✅ Database: Ready (SQLite)
echo    ✅ Dependencies: All installed
echo.
goto :end

:error
echo.
echo ========================================
echo           ❌ TESTS FAILED ❌
echo ========================================
echo.
echo Please check the error messages above and:
echo 1. Make sure Python 3.11+ is installed
echo 2. Make sure Node.js 18+ is installed
echo 3. Run this test again after fixing issues
echo.
echo For help, contact: ashutoshgouda2005@gmail.com
echo.

:end
echo Press any key to exit...
pause >nul
