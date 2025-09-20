@echo off
title CrowdControl - Mobile Access Setup
color 0A

echo.
echo  ██████╗██████╗  ██████╗ ██╗    ██╗██████╗  ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  ██████╗ ██╗     
echo ██╔════╝██╔══██╗██╔═══██╗██║    ██║██╔══██╗██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗██║     
echo ██║     ██████╔╝██║   ██║██║ █╗ ██║██║  ██║██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║██║     
echo ██║     ██╔══██╗██║   ██║██║███╗██║██║  ██║██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║██║     
echo ╚██████╗██║  ██║╚██████╔╝╚███╔███╔╝██████╔╝╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║╚██████╔╝███████╗
echo  ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
echo.
echo                           📱 MOBILE ACCESS ENABLED - Full Network Access 📱
echo                              Access from Phone, iPad, and Other Devices
echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.

echo 🔍 DETECTING YOUR IP ADDRESS...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set IP_ADDRESS=%%j
        goto :found_ip
    )
)

:found_ip
if defined IP_ADDRESS (
    echo ✅ Your IP Address: %IP_ADDRESS%
) else (
    echo ⚠️  Could not detect IP automatically. Please check manually with 'ipconfig'
    set IP_ADDRESS=YOUR_IP_ADDRESS
)

echo.
echo 🌐 MOBILE ACCESS URLS:
echo    📱 Main App: http://%IP_ADDRESS%:5174
echo    🔧 Backend API: http://%IP_ADDRESS%:8000
echo    👤 Admin Panel: http://%IP_ADDRESS%:8000/admin
echo.

echo 🔥 CONFIGURING FIREWALL...
echo    Adding firewall rules for mobile access...
netsh advfirewall firewall add rule name="CrowdControl Frontend Mobile" dir=in action=allow protocol=TCP localport=5174 >nul 2>&1
netsh advfirewall firewall add rule name="CrowdControl Backend Mobile" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
echo    ✅ Firewall configured for mobile access

echo.
echo 🚀 STARTING SERVERS WITH MOBILE ACCESS...
echo.

REM Start backend with network access
start "CrowdControl Backend (Mobile Ready)" cmd /k "call venv\Scripts\activate.bat && cd backend && python manage.py runserver 0.0.0.0:8000"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend with network access
start "CrowdControl Frontend (Mobile Ready)" cmd /k "cd frontend && powershell -ExecutionPolicy Bypass -Command npm run dev -- --host 0.0.0.0 --port 5174"

REM Wait for services to initialize
timeout /t 5 /nobreak >nul

echo ✅ SERVERS LAUNCHED WITH MOBILE ACCESS!
echo.
echo 📱 MOBILE ACCESS INSTRUCTIONS:
echo    1. Connect your phone/iPad to the SAME Wi-Fi network as this computer
echo    2. Open any browser on your mobile device
echo    3. Go to: http://%IP_ADDRESS%:5174
echo    4. Enjoy your mobile-optimized CrowdControl app!
echo.
echo 🎯 FEATURES ON MOBILE:
echo    ✨ Responsive design that adapts to your screen
echo    ✨ Touch-friendly buttons and navigation
echo    ✨ Camera access for live streaming
echo    ✨ Real-time AI crowd analysis
echo    ✨ PWA support - add to home screen!
echo.
echo 🔧 TROUBLESHOOTING:
echo    • Make sure devices are on the same Wi-Fi network
echo    • Check Windows Firewall if connection fails
echo    • Try different browsers if issues occur
echo    • Restart this script if servers don't start
echo.
echo 📖 For detailed mobile setup guide, see: MOBILE_ACCESS_GUIDE.md
echo.
echo 🎉 YOUR CROWDCONTROL APP IS NOW MOBILE-READY!
echo    Press Ctrl+C in the server windows to stop the servers.
echo.
pause
