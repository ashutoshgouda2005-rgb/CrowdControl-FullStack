@echo off
title CrowdControl - Production Deployment
color 0B

echo.
echo ========================================
echo    CROWDCONTROL PRODUCTION DEPLOYMENT
echo ========================================
echo.

echo 🚀 Preparing production build...
echo.

REM Step 1: Test system first
echo [1/6] Running system tests...
call TEST_SYSTEM.bat
if %errorlevel% neq 0 (
    echo ❌ System tests failed. Please fix issues before deploying.
    pause
    exit /b 1
)

REM Step 2: Build frontend for production
echo [2/6] Building frontend for production...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    cd ..
    pause
    exit /b 1
)
echo ✅ Frontend build completed
cd ..

REM Step 3: Collect static files for Django
echo [3/6] Collecting Django static files...
call venv\Scripts\activate.bat
cd backend
python manage.py collectstatic --noinput
if %errorlevel% neq 0 (
    echo ❌ Static files collection failed
    cd ..
    pause
    exit /b 1
)
echo ✅ Static files collected
cd ..

REM Step 4: Create production environment file
echo [4/6] Creating production environment...
echo # CrowdControl Production Environment > .env.production
echo DEBUG=False >> .env.production
echo ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.26,your-domain.com >> .env.production
echo SECRET_KEY=your-production-secret-key-here >> .env.production
echo DATABASE_URL=sqlite:///db.sqlite3 >> .env.production
echo CORS_ALLOWED_ORIGINS=http://localhost:5174,http://192.168.1.26:5174 >> .env.production
echo ✅ Production environment created

REM Step 5: Create deployment package
echo [5/6] Creating deployment package...
if exist "crowdcontrol-deploy.zip" del "crowdcontrol-deploy.zip"

REM Create deployment directory structure
mkdir deploy-temp 2>nul
mkdir deploy-temp\backend 2>nul
mkdir deploy-temp\frontend 2>nul

REM Copy backend files
xcopy backend deploy-temp\backend /E /I /Q
xcopy venv deploy-temp\venv /E /I /Q
copy requirements.txt deploy-temp\ 2>nul
copy .env.production deploy-temp\.env

REM Copy frontend build
xcopy frontend\dist deploy-temp\frontend\dist /E /I /Q
xcopy frontend\package.json deploy-temp\frontend\ 2>nul
xcopy frontend\vite.config.js deploy-temp\frontend\ 2>nul

REM Copy deployment scripts
copy START_UNIVERSAL_ACCESS.bat deploy-temp\ 2>nul
copy TEST_SYSTEM.bat deploy-temp\ 2>nul
copy FIXES_APPLIED.md deploy-temp\ 2>nul

REM Create deployment ZIP
powershell -Command "Compress-Archive -Path 'deploy-temp\*' -DestinationPath 'crowdcontrol-deploy.zip' -Force"
rmdir /s /q deploy-temp

if exist "crowdcontrol-deploy.zip" (
    echo ✅ Deployment package created: crowdcontrol-deploy.zip
) else (
    echo ❌ Failed to create deployment package
    pause
    exit /b 1
)

REM Step 6: Generate deployment instructions
echo [6/6] Generating deployment instructions...
echo # CrowdControl Deployment Instructions > DEPLOYMENT_INSTRUCTIONS.md
echo. >> DEPLOYMENT_INSTRUCTIONS.md
echo ## Quick Deployment >> DEPLOYMENT_INSTRUCTIONS.md
echo. >> DEPLOYMENT_INSTRUCTIONS.md
echo 1. Extract crowdcontrol-deploy.zip to your server >> DEPLOYMENT_INSTRUCTIONS.md
echo 2. Run TEST_SYSTEM.bat to verify setup >> DEPLOYMENT_INSTRUCTIONS.md
echo 3. Run START_UNIVERSAL_ACCESS.bat to start the application >> DEPLOYMENT_INSTRUCTIONS.md
echo 4. Access via http://your-server-ip:5174 >> DEPLOYMENT_INSTRUCTIONS.md
echo. >> DEPLOYMENT_INSTRUCTIONS.md
echo ## Production URLs >> DEPLOYMENT_INSTRUCTIONS.md
echo - Frontend: http://your-domain:5174 >> DEPLOYMENT_INSTRUCTIONS.md
echo - Backend API: http://your-domain:8000 >> DEPLOYMENT_INSTRUCTIONS.md
echo - Admin Panel: http://your-domain:8000/admin >> DEPLOYMENT_INSTRUCTIONS.md
echo. >> DEPLOYMENT_INSTRUCTIONS.md
echo ## Support >> DEPLOYMENT_INSTRUCTIONS.md
echo Developer: Ashutosh Gouda >> DEPLOYMENT_INSTRUCTIONS.md
echo Email: ashutoshgouda2005@gmail.com >> DEPLOYMENT_INSTRUCTIONS.md
echo Phone: +91 8456949047 >> DEPLOYMENT_INSTRUCTIONS.md

echo ✅ Deployment instructions created

echo.
echo ========================================
echo        🎉 DEPLOYMENT READY! 🎉
echo ========================================
echo.
echo Your CrowdControl application is ready for production deployment!
echo.
echo 📦 Deployment Package: crowdcontrol-deploy.zip
echo 📋 Instructions: DEPLOYMENT_INSTRUCTIONS.md
echo 🔧 System Status: All tests passed
echo.
echo 🌐 Current Access URLs:
echo    Local: http://localhost:5174
echo    Network: http://192.168.1.26:5174
echo.
echo 🚀 To deploy to production server:
echo    1. Upload crowdcontrol-deploy.zip to your server
echo    2. Extract and run TEST_SYSTEM.bat
echo    3. Start with START_UNIVERSAL_ACCESS.bat
echo.
echo 📞 Support: ashutoshgouda2005@gmail.com
echo           +91 8456949047 (WhatsApp)
echo.

pause
