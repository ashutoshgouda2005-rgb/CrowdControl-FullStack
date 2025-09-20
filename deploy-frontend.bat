@echo off
echo Deploying CrowdControl Frontend to Netlify...
echo.

REM Set PATH to include Node.js
set PATH=C:\Program Files\nodejs;%PATH%

REM Navigate to project root
cd /d "%~dp0"

REM Check if Netlify CLI is installed
where netlify >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Netlify CLI...
    "C:\Program Files\nodejs\npm.cmd" install -g netlify-cli
)

echo Logging into Netlify...
netlify login

echo Deploying frontend...
netlify deploy --prod --dir=frontend/dist --build

echo.
echo Frontend deployment complete!
echo Your CrowdControl app should now be live on Netlify.
pause
