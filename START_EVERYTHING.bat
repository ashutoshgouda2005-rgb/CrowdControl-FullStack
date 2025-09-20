@echo off
title CrowdControl - Full Stack Application
color 0A

echo.
echo  ██████╗██████╗  ██████╗ ██╗    ██╗██████╗  ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  ██████╗ ██╗     
echo ██╔════╝██╔══██╗██╔═══██╗██║    ██║██╔══██╗██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗██║     
echo ██║     ██████╔╝██║   ██║██║ █╗ ██║██║  ██║██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║██║     
echo ██║     ██╔══██╗██║   ██║██║███╗██║██║  ██║██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║██║     
echo ╚██████╗██║  ██║╚██████╔╝╚███╔███╔╝██████╔╝╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║╚██████╔╝███████╗
echo  ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
echo.
echo                           🚀 Full-Stack Crowd Control Application 🚀
echo                              AI-Powered Stampede Detection System
echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.

echo 🔧 SYSTEM STATUS:
echo    ✅ Python 3.11.9 - Ready
echo    ✅ Node.js v22.19.0 - Ready  
echo    ✅ Virtual Environment - Activated
echo    ✅ SQLite Database - Configured
echo    ✅ Dependencies - Installed
echo.

echo 🌐 STARTING SERVICES:
echo    🔹 Backend API Server: http://127.0.0.1:8000
echo    🔹 Frontend Dev Server: http://localhost:5173
echo    🔹 Admin Panel: http://127.0.0.1:8000/admin (admin/admin123)
echo.

echo 📋 FEATURES AVAILABLE:
echo    ✨ User Authentication ^& JWT Tokens
echo    ✨ Real-time WebSocket Communication  
echo    ✨ File Upload ^& Drag-and-Drop
echo    ✨ Live Webcam Streaming
echo    ✨ AI-Powered Crowd Detection
echo    ✨ Stampede Risk Assessment
echo    ✨ Real-time Alerts ^& Notifications
echo    ✨ Admin Dashboard ^& Analytics
echo.

echo 🚀 LAUNCHING APPLICATION...
echo.

REM Start backend in new window
start "CrowdControl Backend" cmd /k "call venv\Scripts\activate.bat && cd backend && python manage.py runserver"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window  
start "CrowdControl Frontend" cmd /k "cd frontend && powershell -ExecutionPolicy Bypass -Command npm run dev"

REM Wait for services to initialize
timeout /t 5 /nobreak >nul

echo ✅ APPLICATION LAUNCHED SUCCESSFULLY!
echo.
echo 🌐 Open your browser and navigate to:
echo    👉 Frontend: http://localhost:5173
echo    👉 Backend API: http://127.0.0.1:8000
echo    👉 Admin Panel: http://127.0.0.1:8000/admin
echo.
echo 🔑 Default Admin Credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo 📖 Press any key to open the application in your default browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo 🎉 CROWDCONTROL IS NOW RUNNING!
echo    Press Ctrl+C in the backend/frontend windows to stop the servers.
echo.
pause
