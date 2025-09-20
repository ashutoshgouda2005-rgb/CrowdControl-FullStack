@echo off
echo ========================================
echo   CROWDCONTROL VERCEL DEPLOYMENT
echo ========================================
echo.

REM Set PATH to include Node.js
set PATH=C:\Program Files\nodejs;%PATH%

echo [1/4] Installing Vercel CLI...
"C:\Program Files\nodejs\npm.cmd" install -g vercel

echo.
echo [2/4] Building frontend...
cd /d "%~dp0frontend"
"C:\Program Files\nodejs\npm.cmd" run build

echo.
echo [3/4] Deploying to Vercel...
cd /d "%~dp0"
vercel --prod

echo.
echo [4/4] Deploying Backend to Railway...
cd /d "%~dp0backend"

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Railway CLI...
    "C:\Program Files\nodejs\npm.cmd" install -g @railway/cli
)

railway login
railway init crowdcontrol-backend
railway up

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Frontend: Deployed to Vercel
echo Backend: Deployed to Railway
echo.
echo NEXT STEPS:
echo 1. Set environment variables in Railway dashboard
echo 2. Run: railway run python manage.py migrate
echo 3. Run: railway run python manage.py createsuperuser
echo 4. Update frontend API URL and redeploy
echo.
pause
