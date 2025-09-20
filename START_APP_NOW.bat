@echo off
setlocal

:: BatchGotAdmin
:-------------------------------------
REM  --> Check for permissions
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrative permissions confirmed.
) else (
    echo ############################################################################
    echo #
    echo #  ERROR: Administrative permissions are required to configure the firewall.
    echo #
    echo #  Please right-click this file and select 'Run as administrator'.
    echo #
    echo ############################################################################
    echo.
    pause
    exit /b
)

:-------------------------------------

title CrowdControl - Universal Access Launcher
color 0B

echo.
echo                           🌐 LAUNCHING UNIVERSAL ACCESS 🌐
echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.

echo 🔥 CONFIGURING FIREWALL FOR UNIVERSAL ACCESS...
netsh advfirewall firewall add rule name="CrowdControl Universal Frontend" dir=in action=allow protocol=TCP localport=5174 >nul
netsh advfirewall firewall add rule name="CrowdControl Universal Backend" dir=in action=allow protocol=TCP localport=8000 >nul
echo    ✅ Firewall configured successfully.

echo.
echo 🔍 DETECTING YOUR NETWORK IP ADDRESS...
set "IP_ADDRESS="
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set IP_ADDRESS=%%j
    )
)

if defined IP_ADDRESS (
    echo    ✅ Your Primary IP Address is: %IP_ADDRESS%
) else (
    echo    ⚠️  Could not detect IP address. You may need to find it manually with 'ipconfig'.
    set IP_ADDRESS=YOUR_IP_ADDRESS
)

echo.
echo 🚀 STARTING SERVERS...

REM Start Backend Server
echo    • Launching Backend Server on port 8000...
start "CrowdControl Backend (Universal)" cmd /c "call venv\Scripts\activate.bat && cd backend && python manage.py runserver 0.0.0.0:8000"

REM Wait for backend to initialize
timeout /t 4 /nobreak >nul

REM Start Frontend Server
echo    • Launching Frontend Server on port 5174...
start "CrowdControl Frontend (Universal)" cmd /c "cd frontend && npm run dev -- --host"

timeout /t 5 /nobreak >nul

echo.
echo ✅ ALL SYSTEMS GO! YOUR SITE IS LIVE!
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.
echo 🌐 YOUR SITE LINKS:
echo.
echo    💻 On this computer:
    echo       http://localhost:5174

echo.
echo    📱 On your Phone, iPad, or another computer:
echo       http://%IP_ADDRESS%:5174
echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.
echo 🚨 IF IT DOESN'T WORK:
echo    1. Make sure your phone/iPad is on the SAME Wi-Fi network.
echo    2. Try restarting your router.
echo    3. See the new TROUBLESHOOTING_GUIDE.md for more help.
echo.
echo The server windows will remain open. To stop, close those windows.
echo.
pause
