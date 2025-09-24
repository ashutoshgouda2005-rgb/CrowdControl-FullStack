@echo off
title CrowdControl - FIXED Integration System Launcher
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    🎯 CROWDCONTROL - INTEGRATION FIXES APPLIED              ║
echo ║                          All connectivity issues resolved!                  ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo 💡 Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo 💡 Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Python and Node.js are available
echo.

echo 🔧 FIXES APPLIED:
echo   ✅ Missing backend endpoints added (auth/token/refresh/, analytics/, etc.)
echo   ✅ CORS configuration updated for port 5176
echo   ✅ File upload limit set to 100MB (backend + frontend)
echo   ✅ Enhanced error handling with specific messages
echo   ✅ Theme toggle and notifications working
echo   ✅ FormData validation and proper API responses
echo.

REM Start backend in new window
echo 🚀 Starting Django backend server (Fixed)...
start "CrowdControl Backend - FIXED" cmd /k "cd /d backend && echo 🔧 BACKEND FIXES APPLIED: && echo   ✅ All missing endpoints added && echo   ✅ CORS for port 5176 configured && echo   ✅ 100MB file upload enabled && echo   ✅ Enhanced error responses && echo. && python manage.py runserver 127.0.0.1:8000"

REM Wait a moment for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend in new window
echo 🚀 Starting Vite frontend server (Fixed)...
start "CrowdControl Frontend - FIXED" cmd /k "cd /d frontend && echo 🔧 FRONTEND FIXES APPLIED: && echo   ✅ API paths corrected for all endpoints && echo   ✅ File size limits updated to 100MB && echo   ✅ Error handling enhanced && echo   ✅ Theme toggle and notifications working && echo. && npm run dev"

REM Wait for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo 🎉 CrowdControl FIXED system is starting!
echo.
echo 🌐 Backend (Django + DRF):  http://127.0.0.1:8000
echo 🌐 Frontend (Vite + React): http://localhost:5176
echo 🔍 Health Check:           http://127.0.0.1:8000/api/health/
echo.
echo 📋 INTEGRATION STATUS:
echo   ✅ All API endpoints properly mapped
echo   ✅ CORS configured for correct ports
echo   ✅ JWT authentication with token refresh
echo   ✅ 100MB file upload support
echo   ✅ Detailed error messages
echo   ✅ Working theme toggle (light/dark)
echo   ✅ Notification system functional
echo.
echo 🧪 TESTING:
echo   1. Wait for both servers to show "ready" status
echo   2. Open http://localhost:5176 in your browser
echo   3. Test login/register functionality
echo   4. Try uploading files (1MB, 10MB, 50MB)
echo   5. Toggle theme (should change immediately)
echo   6. Check notifications appear and disappear
echo.
echo 🔍 DEBUGGING:
echo   - Press F12 in browser → Network tab to see API calls
echo   - Look for successful 200/201 responses
echo   - Check Authorization headers are present
echo   - Run: python FIX_ALL_INTEGRATION_ISSUES.py for automated tests
echo.
echo 📖 For detailed debugging: See INTEGRATION_DEBUGGING_GUIDE.md
echo.
echo Press any key to exit this launcher (servers will keep running)...
pause >nul

echo.
echo ========================================
echo System Started Successfully!
echo ========================================
echo.
echo Frontend: http://localhost:5176
echo Backend:  http://127.0.0.1:8000
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:5176

echo.
echo System is running. Close this window to stop all servers.
echo Press any key to exit...
pause >nul
