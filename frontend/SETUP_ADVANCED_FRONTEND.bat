@echo off
echo ========================================
echo CrowdControl Advanced Frontend Setup
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

:: Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

:: Create .env file from example if it doesn't exist
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy ".env.example" ".env"
    echo .env file created successfully!
    echo.
) else (
    echo .env file already exists, skipping...
    echo.
)

:: Install dependencies
echo Installing dependencies...
echo This may take a few minutes...
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo.
echo ========================================
echo Dependencies installed successfully!
echo ========================================
echo.

:: Check if backend is running
echo Checking if backend is running...
curl -s http://127.0.0.1:8000/api/health/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend is running on http://127.0.0.1:8000
) else (
    echo ⚠ Backend is not running on http://127.0.0.1:8000
    echo Please start the backend server before running the frontend
)
echo.

:: Display next steps
echo ========================================
echo Setup Complete! Next Steps:
echo ========================================
echo.
echo 1. Make sure your Django backend is running on http://127.0.0.1:8000
echo 2. Run 'npm run dev' to start the development server
echo 3. Open http://localhost:5173 in your browser
echo.
echo Available commands:
echo   npm run dev     - Start development server
echo   npm run build   - Build for production
echo   npm run preview - Preview production build
echo   npm run lint    - Run ESLint
echo.
echo Advanced Features Included:
echo ✓ Real-time Dashboard with Analytics
echo ✓ Advanced Image Upload with Drag & Drop
echo ✓ Live Camera Detection with WebRTC
echo ✓ JWT Authentication System
echo ✓ Responsive Navigation & Notifications
echo ✓ Dark/Light Mode Toggle
echo ✓ WebSocket Integration
echo ✓ Performance Optimization
echo.

pause
