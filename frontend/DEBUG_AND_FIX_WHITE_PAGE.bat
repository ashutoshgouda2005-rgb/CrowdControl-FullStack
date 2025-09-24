@echo off
echo ========================================
echo 🔍 CrowdControl Frontend Debug Helper
echo ========================================
echo.

cd /d "%~dp0"

echo 📁 Current directory: %CD%
echo.

echo 🔍 Step 1: Checking if we're in the frontend directory...
if not exist "package.json" (
    echo ❌ package.json not found! 
    echo 💡 Please run this script from the frontend directory
    pause
    exit /b 1
)
echo ✅ Found package.json

echo.
echo 🔍 Step 2: Checking critical files...
if not exist "src\main.jsx" (
    echo ❌ src\main.jsx missing!
) else (
    echo ✅ src\main.jsx exists
)

if not exist "src\App.jsx" (
    echo ❌ src\App.jsx missing!
) else (
    echo ✅ src\App.jsx exists
)

if not exist "index.html" (
    echo ❌ index.html missing!
) else (
    echo ✅ index.html exists
)

echo.
echo 🔍 Step 3: Checking node_modules...
if not exist "node_modules" (
    echo ❌ node_modules missing! Running npm install...
    npm install
) else (
    echo ✅ node_modules exists
)

echo.
echo 🔧 Step 4: Creating backup and minimal test files...

REM Backup original main.jsx if it exists and backup doesn't exist
if exist "src\main.jsx" (
    if not exist "src\main.jsx.backup" (
        copy "src\main.jsx" "src\main.jsx.backup" >nul
        echo ✅ Backed up main.jsx to main.jsx.backup
    ) else (
        echo ℹ️  Backup already exists
    )
)

REM Create minimal main.jsx for testing
echo import React from 'react' > src\main.minimal.jsx
echo import ReactDOM from 'react-dom/client' >> src\main.minimal.jsx
echo import MinimalApp from './App.minimal.test.jsx' >> src\main.minimal.jsx
echo. >> src\main.minimal.jsx
echo console.log('🔄 Loading minimal test app...'^) >> src\main.minimal.jsx
echo. >> src\main.minimal.jsx
echo try { >> src\main.minimal.jsx
echo   ReactDOM.createRoot(document.getElementById('root'^)^).render( >> src\main.minimal.jsx
echo     ^<React.StrictMode^> >> src\main.minimal.jsx
echo       ^<MinimalApp /^> >> src\main.minimal.jsx
echo     ^</React.StrictMode^>, >> src\main.minimal.jsx
echo   ^) >> src\main.minimal.jsx
echo   console.log('✅ Minimal app loaded successfully!'^) >> src\main.minimal.jsx
echo } catch (error^) { >> src\main.minimal.jsx
echo   console.error('❌ Error loading minimal app:', error^) >> src\main.minimal.jsx
echo } >> src\main.minimal.jsx

echo ✅ Created minimal test files

echo.
echo ========================================
echo 🧪 DEBUGGING OPTIONS
echo ========================================
echo.
echo 1. Test with minimal app (recommended first step)
echo 2. Test with original app
echo 3. Run Python debug script
echo 4. Open browser DevTools guide
echo 5. Exit
echo.

:menu
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto test_minimal
if "%choice%"=="2" goto test_original
if "%choice%"=="3" goto run_python_debug
if "%choice%"=="4" goto devtools_guide
if "%choice%"=="5" goto end

echo Invalid choice. Please enter 1-5.
goto menu

:test_minimal
echo.
echo 🧪 Testing with minimal app...
echo ========================================
echo.
echo 📝 Switching to minimal main.jsx...
copy "src\main.minimal.jsx" "src\main.jsx" >nul
echo ✅ Switched to minimal app

echo.
echo 🚀 Starting development server...
echo 💡 Watch for any errors in the terminal output below
echo 💡 Then check your browser at http://localhost:5176
echo.
echo ⚠️  If you see "🎉 Vite + React Working!" page:
echo    - The framework is working fine
echo    - The issue is in your main App components
echo    - Press Ctrl+C to stop server, then choose option 2
echo.
echo ⚠️  If you still see a blank page:
echo    - Check browser console (F12) for JavaScript errors
echo    - Check this terminal for compilation errors
echo    - There may be a fundamental setup issue
echo.
echo Press Ctrl+C to stop the server when done testing...
echo.
npm run dev
goto menu

:test_original
echo.
echo 🔄 Testing with original app...
echo ========================================
echo.
if exist "src\main.jsx.backup" (
    echo 📝 Restoring original main.jsx...
    copy "src\main.jsx.backup" "src\main.jsx" >nul
    echo ✅ Restored original app
) else (
    echo ⚠️  No backup found, using current main.jsx
)

echo.
echo 🚀 Starting development server with original app...
echo 💡 Watch for any errors in the terminal output below
echo 💡 Then check your browser at http://localhost:5176
echo.
echo ⚠️  If you see a blank page:
echo    - Check browser console (F12) for JavaScript errors
echo    - Look for import errors, syntax errors, or API failures
echo    - Consider using the Enhanced Error Boundary
echo.
echo Press Ctrl+C to stop the server when done testing...
echo.
npm run dev
goto menu

:run_python_debug
echo.
echo 🐍 Running Python debug script...
echo ========================================
echo.
if exist "..\DEBUG_WHITE_PAGE_ISSUE.py" (
    python "..\DEBUG_WHITE_PAGE_ISSUE.py"
) else (
    echo ❌ Debug script not found!
    echo 💡 Make sure DEBUG_WHITE_PAGE_ISSUE.py exists in the parent directory
)
echo.
pause
goto menu

:devtools_guide
echo.
echo 🛠️  Browser DevTools Debugging Guide
echo ========================================
echo.
echo 1. Open your browser and go to: http://localhost:5176
echo 2. Press F12 to open Developer Tools
echo 3. Check the CONSOLE tab for JavaScript errors:
echo    - Look for red error messages
echo    - Common errors: "Cannot read property", "Module not found"
echo    - Take note of the file names and line numbers
echo.
echo 4. Check the NETWORK tab:
echo    - Refresh the page (Ctrl+R)
echo    - Look for failed requests (red status codes)
echo    - Check if main.jsx and other assets are loading
echo.
echo 5. Check the SOURCES tab:
echo    - Look for your source files under localhost:5176
echo    - Check if all imported files are present
echo.
echo 6. Common issues to look for:
echo    ❌ "Cannot read property 'X' of undefined" - Missing null checks
echo    ❌ "Module not found" - Incorrect import paths or missing files
echo    ❌ "Unexpected token" - Syntax errors in JSX
echo    ❌ "Failed to fetch" - Backend API not running
echo.
echo 💡 Copy any error messages and search for solutions online
echo 💡 Or use the Enhanced Error Boundary for better error display
echo.
pause
goto menu

:end
echo.
echo ========================================
echo 🎯 DEBUGGING SUMMARY
echo ========================================
echo.
echo Files created:
echo ✅ src\main.jsx.backup (backup of original)
echo ✅ src\main.minimal.jsx (minimal test version)
echo ✅ src\App.minimal.test.jsx (minimal test component)
echo ✅ Enhanced error boundary and debugging tools
echo.
echo Next steps:
echo 1. If minimal app worked: The issue is in your main components
echo 2. If minimal app failed: Check browser console and Vite terminal
echo 3. Use Enhanced Error Boundary for better error messages
echo 4. Check the STEP_BY_STEP_DEBUG.md guide for detailed help
echo.
echo 💡 Remember: Most blank page issues are JavaScript errors
echo 💡 Always check browser console (F12) first!
echo.
echo Good luck debugging! 🚀
pause
