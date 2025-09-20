@echo off
echo Starting CrowdControl Frontend Preview...
echo.

REM Set PATH to include Node.js
set PATH=C:\Program Files\nodejs;%PATH%

REM Navigate to frontend directory
cd /d "%~dp0"

echo Starting preview server...
echo Open http://localhost:4173 in your browser
echo Press Ctrl+C to stop the server
echo.

"C:\Program Files\nodejs\npm.cmd" run preview
