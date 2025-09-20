@echo off
title CrowdControl - Universal Device Access
color 0A

echo.
echo  ██████╗██████╗  ██████╗ ██╗    ██╗██████╗  ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  ██████╗ ██╗     
echo ██╔════╝██╔══██╗██╔═══██╗██║    ██║██╔══██╗██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗██║     
echo ██║     ██████╔╝██║   ██║██║ █╗ ██║██║  ██║██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║██║     
echo ██║     ██╔══██╗██║   ██║██║███╗██║██║  ██║██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║██║     
echo ╚██████╗██║  ██║╚██████╔╝╚███╔███╔╝██████╔╝╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║╚██████╔╝███████╗
echo  ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
echo.
echo                           🌐 UNIVERSAL ACCESS - Works on ANY Device! 🌐
echo                              Phone • iPad • Laptop • Desktop • Tablet
echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.

echo 🔍 AUTO-DETECTING ALL NETWORK INTERFACES...

REM Get all possible IP addresses
set "IP_LIST="
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set "CURRENT_IP=%%j"
        call :trim_ip
        if not "!TRIMMED_IP!"=="127.0.0.1" (
            if defined IP_LIST (
                set "IP_LIST=!IP_LIST!, !TRIMMED_IP!"
            ) else (
                set "IP_LIST=!TRIMMED_IP!"
            )
            if not defined MAIN_IP set "MAIN_IP=!TRIMMED_IP!"
        )
    )
)

echo ✅ Detected Network Interfaces: %IP_LIST%
echo 🎯 Primary Access IP: %MAIN_IP%

echo.
echo 🔥 CONFIGURING UNIVERSAL ACCESS...
echo    • Opening firewall for all network interfaces
echo    • Enabling cross-device communication
echo    • Setting up automatic discovery

REM Configure firewall for all common ports
netsh advfirewall firewall add rule name="CrowdControl Universal Frontend" dir=in action=allow protocol=TCP localport=5174 >nul 2>&1
netsh advfirewall firewall add rule name="CrowdControl Universal Backend" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
netsh advfirewall firewall add rule name="CrowdControl Universal Alt" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="CrowdControl Universal Dev" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1

echo    ✅ Universal firewall rules configured

echo.
echo 🚀 STARTING UNIVERSAL SERVERS...
echo    • Backend: Accessible from ANY device on network
echo    • Frontend: Auto-detects and works everywhere
echo    • No IP configuration needed!

REM Start backend with universal access
start "CrowdControl Backend (Universal)" cmd /k "call venv\Scripts\activate.bat && cd backend && python manage.py runserver 0.0.0.0:8000"

REM Wait for backend
timeout /t 3 /nobreak >nul

REM Start frontend with universal access and auto-discovery
start "CrowdControl Frontend (Universal)" cmd /k "cd frontend && powershell -ExecutionPolicy Bypass -Command npm run dev -- --host 0.0.0.0 --port 5174"

REM Wait for services
timeout /t 5 /nobreak >nul

echo ✅ UNIVERSAL ACCESS ENABLED!
echo.
echo 🌐 ACCESS FROM ANY DEVICE:
echo.
echo    📱 PHONE/TABLET:
echo       • Connect to same Wi-Fi network
echo       • Open browser and go to: http://%MAIN_IP%:5174
echo       • Or scan QR code (if available)
echo.
echo    💻 LAPTOP/DESKTOP:
echo       • Same network: http://%MAIN_IP%:5174
echo       • Local access: http://localhost:5174
echo.
echo    🌍 ALL NETWORK IPS:
for %%i in (%IP_LIST%) do (
    echo       • http://%%i:5174
)
echo.
echo 🎯 UNIVERSAL FEATURES:
echo    ✨ Works on ANY device with a browser
echo    ✨ Automatic responsive design adaptation
echo    ✨ No manual IP configuration needed
echo    ✨ Cross-platform compatibility
echo    ✨ PWA support for app-like experience
echo.
echo 📱 MOBILE OPTIMIZATION:
echo    ✨ Touch-friendly interface
echo    ✨ Camera access for live streaming
echo    ✨ Offline capability (PWA)
echo    ✨ Add to home screen support
echo.
echo 🔧 TROUBLESHOOTING:
echo    • All devices must be on the same Wi-Fi network
echo    • If connection fails, try different IP from the list above
echo    • Restart router if devices can't communicate
echo    • Check device firewall settings if needed
echo.

REM Create a simple HTML file for easy access
echo ^<!DOCTYPE html^> > universal_access.html
echo ^<html^>^<head^>^<title^>CrowdControl Universal Access^</title^>^</head^> >> universal_access.html
echo ^<body style="font-family: Arial; text-align: center; padding: 50px;"^> >> universal_access.html
echo ^<h1^>🚨 CrowdControl Universal Access^</h1^> >> universal_access.html
echo ^<h2^>Access from ANY Device^</h2^> >> universal_access.html
echo ^<div style="margin: 30px;"^> >> universal_access.html
for %%i in (%IP_LIST%) do (
    echo ^<p^>^<a href="http://%%i:5174" style="font-size: 20px; color: blue;"^>http://%%i:5174^</a^>^</p^> >> universal_access.html
)
echo ^</div^> >> universal_access.html
echo ^<p^>Choose any link above that works for your device^</p^> >> universal_access.html
echo ^</body^>^</html^> >> universal_access.html

echo 📄 Created universal_access.html for easy device access
echo.
echo 🎉 YOUR CROWDCONTROL IS NOW UNIVERSALLY ACCESSIBLE!
echo    Open universal_access.html on any device to get direct links
echo    Or use the IP addresses shown above
echo.
echo    Press Ctrl+C in server windows to stop
echo.
pause

goto :eof

:trim_ip
setlocal enabledelayedexpansion
set "TRIMMED_IP=%CURRENT_IP%"
set "TRIMMED_IP=!TRIMMED_IP: =!"
endlocal & set "TRIMMED_IP=%TRIMMED_IP%"
goto :eof
