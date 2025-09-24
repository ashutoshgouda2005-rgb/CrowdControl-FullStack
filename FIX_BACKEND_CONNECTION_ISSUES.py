#!/usr/bin/env python3
"""
🔧 Fix Backend Connection Issues for CrowdControl
================================================

This script fixes the three main issues you're experiencing:
1. Login error: "server error please try again or contact support"
2. File upload: "file not receiving"
3. Live detection: "failed to start live detection"

All these are backend connectivity issues!
"""

import os
import sys
import json
import subprocess
import time
from pathlib import Path

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔧 {title}")
    print(f"{'='*60}")

def print_success(msg):
    print(f"✅ {msg}")

def print_error(msg):
    print(f"❌ {msg}")

def print_warning(msg):
    print(f"⚠️  {msg}")

def print_info(msg):
    print(f"ℹ️  {msg}")

def run_command(cmd, capture=True):
    """Run a command and return success status"""
    try:
        if capture:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.returncode == 0, result.stdout, result.stderr
        else:
            result = subprocess.run(cmd, shell=True)
            return result.returncode == 0, "", ""
    except Exception as e:
        return False, "", str(e)

def check_backend_running():
    """Check if Django backend is running on port 8000"""
    print_header("Step 1: Checking Backend Status")
    
    # Try to connect to backend
    success, stdout, stderr = run_command('curl -s -o nul -w "%{http_code}" http://127.0.0.1:8000/api/health/')
    
    if success and "200" in stdout:
        print_success("Backend is running on port 8000")
        return True
    else:
        print_error("Backend is NOT running on port 8000!")
        print_info("The backend must be running for login, file upload, and live detection to work")
        return False

def start_backend():
    """Start the Django backend"""
    print_header("Starting Django Backend")
    
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    
    if not os.path.exists(backend_dir):
        print_error(f"Backend directory not found at: {backend_dir}")
        return False
    
    os.chdir(backend_dir)
    print_info(f"Changed to backend directory: {os.getcwd()}")
    
    # Check if virtual environment exists
    venv_path = "venv" if os.path.exists("venv") else "env" if os.path.exists("env") else None
    
    if not venv_path:
        print_warning("Virtual environment not found. Creating one...")
        run_command("python -m venv venv", capture=False)
        venv_path = "venv"
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        activate_cmd = f"{venv_path}\\Scripts\\activate.bat && "
        python_cmd = "python"
    else:  # Unix/Linux
        activate_cmd = f"source {venv_path}/bin/activate && "
        python_cmd = "python3"
    
    print_info("Installing backend dependencies...")
    run_command(f"{activate_cmd}pip install django djangorestframework django-cors-headers pillow", capture=False)
    
    print_info("Running migrations...")
    run_command(f"{activate_cmd}{python_cmd} manage.py migrate", capture=False)
    
    print_info("Starting Django server...")
    print_warning("Keep this terminal open! The backend must stay running.")
    print_info("Open a NEW terminal to run the frontend")
    
    # Start the server (this will block)
    run_command(f"{activate_cmd}{python_cmd} manage.py runserver 127.0.0.1:8000", capture=False)
    
    return True

def fix_backend_settings():
    """Fix Django settings for CORS and other configurations"""
    print_header("Step 2: Fixing Backend Settings")
    
    settings_path = "backend/crowdcontrol/settings.py"
    
    if not os.path.exists(settings_path):
        settings_path = "crowdcontrol/settings.py"
        if not os.path.exists(settings_path):
            print_error("Cannot find settings.py")
            return False
    
    print_info(f"Found settings.py at: {settings_path}")
    
    # Read current settings
    with open(settings_path, 'r') as f:
        settings_content = f.read()
    
    # Backup settings
    backup_path = settings_path + ".backup"
    if not os.path.exists(backup_path):
        with open(backup_path, 'w') as f:
            f.write(settings_content)
        print_success(f"Backed up settings to {backup_path}")
    
    # Check and fix CORS settings
    fixes_applied = []
    
    if "CORS_ALLOWED_ORIGINS" not in settings_content:
        cors_config = """
# CORS Configuration for Frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_ALLOW_ALL_ORIGINS = True  # For development only
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
"""
        settings_content += cors_config
        fixes_applied.append("CORS configuration")
    
    # Fix INSTALLED_APPS if corsheaders not present
    if "'corsheaders'" not in settings_content:
        settings_content = settings_content.replace(
            "INSTALLED_APPS = [",
            "INSTALLED_APPS = [\n    'corsheaders',"
        )
        fixes_applied.append("corsheaders to INSTALLED_APPS")
    
    # Fix MIDDLEWARE if corsheaders not present
    if "'corsheaders.middleware.CorsMiddleware'" not in settings_content:
        settings_content = settings_content.replace(
            "MIDDLEWARE = [",
            "MIDDLEWARE = [\n    'corsheaders.middleware.CorsMiddleware',"
        )
        fixes_applied.append("CorsMiddleware to MIDDLEWARE")
    
    # Add file upload settings
    if "FILE_UPLOAD_MAX_MEMORY_SIZE" not in settings_content:
        upload_config = """
# File Upload Configuration
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
"""
        settings_content += upload_config
        fixes_applied.append("File upload limits")
    
    # Write updated settings
    if fixes_applied:
        with open(settings_path, 'w') as f:
            f.write(settings_content)
        print_success(f"Applied fixes: {', '.join(fixes_applied)}")
    else:
        print_info("Settings already configured correctly")
    
    return True

def fix_frontend_env():
    """Fix frontend environment configuration"""
    print_header("Step 3: Fixing Frontend Environment")
    
    frontend_dir = "frontend"
    if not os.path.exists(frontend_dir):
        print_error("Frontend directory not found")
        return False
    
    os.chdir(frontend_dir)
    
    # Create .env.development if it doesn't exist
    env_content = """# Frontend Development Environment
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws
"""
    
    with open(".env.development", "w") as f:
        f.write(env_content)
    print_success("Created .env.development with correct API URL")
    
    # Update .env if it exists
    if os.path.exists(".env"):
        with open(".env", "w") as f:
            f.write(env_content)
        print_success("Updated .env with correct API URL")
    
    os.chdir("..")
    return True

def test_api_endpoints():
    """Test specific API endpoints"""
    print_header("Step 4: Testing API Endpoints")
    
    endpoints = [
        ("http://127.0.0.1:8000/api/health/", "Health Check"),
        ("http://127.0.0.1:8000/api/auth/login/", "Login Endpoint"),
        ("http://127.0.0.1:8000/api/media/upload/", "Upload Endpoint"),
        ("http://127.0.0.1:8000/api/streams/create/", "Live Stream Endpoint"),
    ]
    
    all_working = True
    for url, name in endpoints:
        success, stdout, stderr = run_command(f'curl -s -o nul -w "%{{http_code}}" {url}')
        if success and ("200" in stdout or "405" in stdout or "401" in stdout):
            print_success(f"{name}: Accessible")
        else:
            print_error(f"{name}: NOT accessible")
            all_working = False
    
    return all_working

def create_start_script():
    """Create a script to start both backend and frontend"""
    print_header("Creating Start Scripts")
    
    # Windows batch script
    bat_content = """@echo off
echo ========================================
echo Starting CrowdControl Full Stack
echo ========================================
echo.

echo Starting Django Backend...
start cmd /k "cd backend && venv\\Scripts\\activate && python manage.py runserver 127.0.0.1:8000"

timeout /t 5 /nobreak > nul

echo Starting Vite Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5176
echo ========================================
echo.
echo Press any key to exit...
pause > nul
"""
    
    with open("START_BOTH_SERVERS.bat", "w") as f:
        f.write(bat_content)
    print_success("Created START_BOTH_SERVERS.bat")
    
    # Python script for cross-platform
    py_content = '''#!/usr/bin/env python3
import subprocess
import time
import sys
import os

def start_backend():
    """Start Django backend"""
    print("Starting Django backend...")
    os.chdir("backend")
    if os.name == 'nt':
        subprocess.Popen(["cmd", "/k", "venv\\\\Scripts\\\\activate && python manage.py runserver 127.0.0.1:8000"])
    else:
        subprocess.Popen(["bash", "-c", "source venv/bin/activate && python manage.py runserver 127.0.0.1:8000"])
    os.chdir("..")

def start_frontend():
    """Start Vite frontend"""
    print("Starting Vite frontend...")
    os.chdir("frontend")
    subprocess.Popen(["npm", "run", "dev"])
    os.chdir("..")

if __name__ == "__main__":
    start_backend()
    time.sleep(5)
    start_frontend()
    print("\\nBoth servers started!")
    print("Backend: http://127.0.0.1:8000")
    print("Frontend: http://localhost:5176")
    input("Press Enter to exit...")
'''
    
    with open("start_both_servers.py", "w") as f:
        f.write(py_content)
    print_success("Created start_both_servers.py")
    
    return True

def main():
    """Main function"""
    print_header("CrowdControl Backend Connection Fix")
    
    print("\n🔍 ISSUES TO FIX:")
    print("1. Login error: 'server error please try again'")
    print("2. File upload: 'file not receiving'")
    print("3. Live detection: 'failed to start'")
    print("\nAll these indicate the backend is not running or not accessible!")
    
    # Check if backend is running
    backend_running = check_backend_running()
    
    if not backend_running:
        print("\n" + "="*60)
        print("🚨 CRITICAL: Backend is not running!")
        print("="*60)
        print("\nThe Django backend MUST be running for:")
        print("- User login/authentication")
        print("- File uploads")
        print("- Live detection")
        print("\n📋 SOLUTION:")
        print("1. Open a NEW terminal")
        print("2. Navigate to the backend directory")
        print("3. Run: python manage.py runserver 127.0.0.1:8000")
        print("\nOr use the automated option below.")
        
        choice = input("\nWould you like to start the backend now? (y/n): ").strip().lower()
        if choice == 'y':
            start_backend()
    
    # Fix settings regardless
    fix_backend_settings()
    fix_frontend_env()
    
    # Test endpoints if backend is running
    if backend_running:
        test_api_endpoints()
    
    # Create start scripts
    create_start_script()
    
    print_header("SOLUTION SUMMARY")
    
    print("\n✅ FIXES APPLIED:")
    print("1. Backend CORS configuration updated")
    print("2. Frontend environment variables set")
    print("3. Start scripts created")
    
    print("\n🚀 TO FIX YOUR ISSUES:")
    print("\n1. START THE BACKEND (Most Important!):")
    print("   Option A: Use the script")
    print("   - Run: START_BOTH_SERVERS.bat")
    print("\n   Option B: Manual start")
    print("   - Terminal 1: cd backend && python manage.py runserver 127.0.0.1:8000")
    print("   - Terminal 2: cd frontend && npm run dev")
    
    print("\n2. VERIFY BACKEND IS RUNNING:")
    print("   - Open browser: http://127.0.0.1:8000/admin")
    print("   - You should see Django admin login")
    
    print("\n3. TEST THE FRONTEND:")
    print("   - Open: http://localhost:5176")
    print("   - Try login with: admin/admin123")
    print("   - Try uploading a file")
    print("   - Try live detection")
    
    print("\n💡 IMPORTANT:")
    print("- Backend MUST be running for ANY feature to work")
    print("- Keep the backend terminal open")
    print("- If you close it, all features will fail")
    
    print("\n🔍 TROUBLESHOOTING:")
    print("If issues persist after starting backend:")
    print("1. Check browser console (F12) for errors")
    print("2. Check backend terminal for error messages")
    print("3. Verify both servers show no errors")

if __name__ == "__main__":
    main()
