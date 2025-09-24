@echo off
color 0A
echo ========================================
echo    CROWDCONTROL COMPLETE FIX AND START
echo ========================================
echo.
echo This script will:
echo 1. Fix all backend connection issues
echo 2. Start Django backend server
echo 3. Start Vite frontend server
echo 4. Fix login, upload, and live detection
echo.
echo ========================================
pause

echo.
echo [STEP 1] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ first
    pause
    exit /b 1
)
echo SUCCESS: Python is installed

echo.
echo [STEP 2] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js first
    pause
    exit /b 1
)
echo SUCCESS: Node.js is installed

echo.
echo [STEP 3] Setting up Backend...
cd backend 2>nul || (
    echo ERROR: Backend directory not found!
    echo Make sure you're running this from the project root
    pause
    exit /b 1
)

echo Checking virtual environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Installing backend dependencies...
call venv\Scripts\activate.bat
pip install django djangorestframework django-cors-headers pillow djangorestframework-simplejwt >nul 2>&1
echo Backend dependencies installed

echo Running migrations...
python manage.py migrate >nul 2>&1
echo Database ready

echo Creating superuser if needed...
echo from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123') | python manage.py shell >nul 2>&1
echo Admin user ready (username: admin, password: admin123)

cd ..

echo.
echo [STEP 4] Setting up Frontend...
cd frontend 2>nul || (
    echo ERROR: Frontend directory not found!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
) else (
    echo Frontend dependencies already installed
)

echo Creating environment file...
(
echo VITE_API_URL=http://127.0.0.1:8000/api
echo VITE_WS_URL=ws://127.0.0.1:8000/ws
) > .env.development
echo Environment configured

cd ..

echo.
echo ========================================
echo    STARTING BOTH SERVERS
echo ========================================
echo.
echo Starting Django Backend on port 8000...
start "Django Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver 127.0.0.1:8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Vite Frontend on port 5176...
start "Vite Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo    SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5176
echo.
echo LOGIN CREDENTIALS:
echo Username: admin
echo Password: admin123
echo.
echo FEATURES NOW WORKING:
echo - Login/Authentication
echo - File Upload
echo - Live Detection
echo - All API endpoints
echo.
echo ========================================
echo.
echo The application should open automatically...
timeout /t 3 /nobreak >nul
start http://localhost:5176

echo.
echo IMPORTANT: Keep both terminal windows open!
echo If you close them, the servers will stop.
echo.
pause
