@echo off
echo Building CrowdControl Frontend...
echo.

REM Set PATH to include Node.js
set PATH=C:\Program Files\nodejs;%PATH%

REM Navigate to frontend directory
cd /d "%~dp0"

echo Dependencies already installed.
echo.
echo Building production bundle...
"C:\Program Files\nodejs\npm.cmd" run build

echo.
echo Build complete! Files are in the 'dist' folder.
pause
