@echo off
echo Deploying CrowdControl Backend to Railway...
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo Railway CLI not found. Installing...
    npm install -g @railway/cli
)

REM Navigate to backend directory
cd /d "%~dp0"

echo Logging into Railway...
railway login

echo Initializing Railway project...
railway init

echo Setting environment variables...
echo Please set these environment variables in Railway dashboard:
echo - SECRET_KEY=your-secret-key-here
echo - DEBUG=False
echo - DATABASE_URL=postgresql://... (Railway will provide this)
echo.

echo Deploying...
railway up

echo.
echo Deployment complete!
echo Don't forget to:
echo 1. Set environment variables in Railway dashboard
echo 2. Update frontend API URL to your Railway app URL
echo 3. Run migrations: railway run python manage.py migrate
echo 4. Create superuser: railway run python manage.py createsuperuser
pause
