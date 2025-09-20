@echo off
title CrowdControl - Quick Fix for Phone Access
color 0C

echo.
echo 🔍 CROWD CONTROL PHONE ACCESS DIAGNOSTIC
echo ════════════════════════════════════════════════════════════════════════════════════════════
echo.

echo 📱 Checking if servers are running...
netstat -an | findstr ":5174\|:8000" >nul
if %errorlevel%==0 (
    echo    ✅ Servers are running
) else (
    echo    ❌ Servers are NOT running
    echo.
    echo 🚀 STARTING SERVERS NOW...
    echo.

    REM Start Backend
    start "CrowdControl Backend" cmd /c "call venv\Scripts\activate.bat && cd backend && python manage.py runserver 0.0.0.0:8000"

    REM Wait
    timeout /t 3 /nobreak >nul

    REM Start Frontend
    start "CrowdControl Frontend" cmd /c "cd frontend && npm run dev -- --host 0.0.0.0 --port 5174"

    REM Wait
    timeout /t 5 /nobreak >nul

    echo ✅ Servers started! Check for two new command windows.
)

echo.
echo 🌐 Finding your IP address...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set IP_ADDRESS=%%j
    )
)

if defined IP_ADDRESS (
    echo    ✅ Your IP Address: %IP_ADDRESS%
) else (
    echo    ❌ Could not find IP address
    set IP_ADDRESS=192.168.1.26
)

echo.
echo 🔥 Configuring firewall...
netsh advfirewall firewall add rule name="CrowdControl Phone Fix" dir=in action=allow protocol=TCP localport=5174 >nul 2>&1
netsh advfirewall firewall add rule name="CrowdControl Phone Fix Backend" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
echo    ✅ Firewall rules added

echo.
echo 🎯 PHONE ACCESS INSTRUCTIONS:
echo ════════════════════════════════════════════════════════════════════════════════════════════
echo.
echo    📱 On your phone, open browser and go to:
echo    🌟 http://%IP_ADDRESS%:5174
echo.
echo    💻 On this computer, test with:
echo    http://localhost:5174
echo.
echo 🚨 TROUBLESHOOTING:
echo    1. Make sure phone is on SAME Wi-Fi as computer
echo    2. Try different browser on phone (Chrome, Safari, etc.)
echo    3. If still not working, disable Windows Firewall temporarily:
echo       - Search for "Windows Defender Firewall"
echo       - Turn OFF all firewall profiles
echo       - Try accessing site
echo       - Turn firewall back ON after testing
echo.
echo Press any key to test server status...
pause >nul

netstat -an | findstr ":5174\|:8000"
echo.
echo If you see lines with LISTENING, servers are ready!
echo.
echo Press any key to exit...
pause >nul
