@echo off
echo ========================================
echo   CROWDCONTROL DEPLOYMENT SCRIPT
echo ========================================
echo.

REM Set PATH to include Node.js
set PATH=C:\Program Files\nodejs;%PATH%

echo [1/4] Installing deployment tools...
"C:\Program Files\nodejs\npm.cmd" install -g netlify-cli @railway/cli

echo.
echo [2/4] Deploying Frontend to Netlify...
cd /d "%~dp0"
netlify login
netlify deploy --prod --dir=frontend/dist

echo.
echo [3/4] Deploying Backend to Railway...
cd /d "%~dp0backend"
railway login
railway init crowdcontrol-backend
railway up

echo.
echo [4/4] Deployment Complete!
echo.
echo ========================================
echo   NEXT STEPS:
echo ========================================
echo 1. Set environment variables in Railway dashboard:
echo    - SECRET_KEY=your-secret-key-here
echo    - DEBUG=False
echo.
echo 2. Run database migrations:
echo    railway run python manage.py migrate
echo.
echo 3. Create superuser:
echo    railway run python manage.py createsuperuser
echo.
echo 4. Update frontend API URL with your Railway app URL
echo    in frontend/.env.production
echo.
echo 5. Redeploy frontend with updated API URL:
echo    netlify deploy --prod --dir=frontend/dist
echo.
echo Your CrowdControl app is now LIVE!
echo ========================================
pause
