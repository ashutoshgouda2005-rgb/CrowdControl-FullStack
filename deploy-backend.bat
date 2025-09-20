@echo off
echo Deploying CrowdControl Backend to Railway...
echo.

REM Set PATH to include Node.js
set PATH=C:\Program Files\nodejs;%PATH%

REM Navigate to backend directory
cd /d "%~dp0backend"

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Railway CLI...
    "C:\Program Files\nodejs\npm.cmd" install -g @railway/cli
)

echo Logging into Railway...
railway login

echo Creating Railway project...
railway init

echo Deploying backend...
railway up

echo.
echo Backend deployment initiated!
echo.
echo IMPORTANT: After deployment completes:
echo 1. Set environment variables in Railway dashboard:
echo    - SECRET_KEY=your-secret-key-here
echo    - DEBUG=False
echo 2. Run migrations: railway run python manage.py migrate
echo 3. Create superuser: railway run python manage.py createsuperuser
echo 4. Update frontend API URL with your Railway app URL
echo.
pause
