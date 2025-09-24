#!/usr/bin/env python3
"""
🔍 Diagnose and Fix CrowdControl Connection Errors
==================================================

This script diagnoses why you're getting:
1. "Server error please try again" on login
2. "File not receiving" on upload
3. "Failed to start live detection"

And provides specific fixes for each issue.
"""

import os
import sys
import json
import subprocess
import time
import socket
from pathlib import Path

class Colors:
    """Terminal colors for better output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(title):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}🔍 {title}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")

def check_port(port):
    """Check if a port is in use"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result == 0

def run_command(cmd, capture=True, timeout=10):
    """Run a command with timeout"""
    try:
        if capture:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
            return result.returncode == 0, result.stdout, result.stderr
        else:
            result = subprocess.run(cmd, shell=True, timeout=timeout)
            return result.returncode == 0, "", ""
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out"
    except Exception as e:
        return False, "", str(e)

def diagnose_backend():
    """Diagnose backend issues"""
    print_header("BACKEND DIAGNOSIS")
    
    issues = []
    
    # Check if port 8000 is in use
    if check_port(8000):
        print_success("Port 8000 is active")
        
        # Try to access Django admin
        success, stdout, stderr = run_command('curl -s -o nul -w "%{http_code}" http://127.0.0.1:8000/admin/')
        if success and "200" in stdout or "301" in stdout or "302" in stdout:
            print_success("Django backend is responding")
        else:
            print_error("Port 8000 is in use but Django is not responding")
            issues.append("django_not_responding")
    else:
        print_error("Port 8000 is NOT active - Backend is not running!")
        issues.append("backend_not_running")
    
    # Check API endpoints
    api_endpoints = {
        "/api/health/": "Health Check",
        "/api/auth/login/": "Login Endpoint",
        "/api/media/upload/": "Upload Endpoint",
        "/api/streams/": "Streams Endpoint"
    }
    
    for endpoint, name in api_endpoints.items():
        url = f"http://127.0.0.1:8000{endpoint}"
        success, stdout, stderr = run_command(f'curl -s -o nul -w "%{{http_code}}" {url}', timeout=5)
        
        if success:
            if "200" in stdout:
                print_success(f"{name}: OK (200)")
            elif "405" in stdout:
                print_success(f"{name}: OK (405 - Method not allowed, but endpoint exists)")
            elif "401" in stdout:
                print_success(f"{name}: OK (401 - Auth required, but endpoint exists)")
            elif "404" in stdout:
                print_error(f"{name}: NOT FOUND (404)")
                issues.append(f"missing_endpoint_{endpoint}")
            else:
                print_warning(f"{name}: Unexpected status {stdout}")
        else:
            print_error(f"{name}: Cannot connect")
            issues.append(f"cannot_connect_{endpoint}")
    
    return issues

def diagnose_frontend():
    """Diagnose frontend issues"""
    print_header("FRONTEND DIAGNOSIS")
    
    issues = []
    
    # Check if port 5176 is in use
    if check_port(5176):
        print_success("Frontend is running on port 5176")
    else:
        print_warning("Frontend may not be running on port 5176")
        if check_port(5173):
            print_info("Frontend is running on port 5173 instead")
            issues.append("wrong_port")
    
    # Check frontend environment files
    frontend_dir = "frontend"
    if os.path.exists(frontend_dir):
        env_files = [".env", ".env.development", ".env.local"]
        env_found = False
        
        for env_file in env_files:
            env_path = os.path.join(frontend_dir, env_file)
            if os.path.exists(env_path):
                with open(env_path, 'r') as f:
                    content = f.read()
                    if "VITE_API_URL" in content:
                        if "127.0.0.1:8000" in content or "localhost:8000" in content:
                            print_success(f"{env_file}: API URL configured correctly")
                            env_found = True
                        else:
                            print_error(f"{env_file}: API URL not pointing to backend")
                            issues.append("wrong_api_url")
        
        if not env_found:
            print_error("No environment file with API URL found")
            issues.append("missing_env_file")
    
    return issues

def fix_backend_issues(issues):
    """Fix identified backend issues"""
    print_header("FIXING BACKEND ISSUES")
    
    if "backend_not_running" in issues:
        print_error("CRITICAL: Backend is not running!")
        print_info("Starting backend...")
        
        backend_dir = "backend"
        if not os.path.exists(backend_dir):
            print_error("Backend directory not found!")
            return False
        
        # Create start script
        start_script = """
import os
import sys
import subprocess

os.chdir('backend')
if os.name == 'nt':
    subprocess.run(['cmd', '/c', 'venv\\Scripts\\activate && python manage.py runserver 127.0.0.1:8000'])
else:
    subprocess.run(['bash', '-c', 'source venv/bin/activate && python manage.py runserver 127.0.0.1:8000'])
"""
        
        with open("start_backend_now.py", "w") as f:
            f.write(start_script)
        
        print_warning("Backend must be started manually!")
        print_info("Run this in a NEW terminal:")
        print(f"    cd {backend_dir}")
        print("    python manage.py runserver 127.0.0.1:8000")
        return False
    
    # Fix missing endpoints
    for issue in issues:
        if issue.startswith("missing_endpoint_"):
            endpoint = issue.replace("missing_endpoint_", "")
            print_warning(f"Missing endpoint: {endpoint}")
            print_info("This needs to be added to backend/api/urls.py")
    
    return True

def fix_frontend_issues(issues):
    """Fix identified frontend issues"""
    print_header("FIXING FRONTEND ISSUES")
    
    if "missing_env_file" in issues or "wrong_api_url" in issues:
        print_info("Creating correct environment configuration...")
        
        env_content = """# CrowdControl Frontend Configuration
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws
"""
        
        frontend_dir = "frontend"
        if os.path.exists(frontend_dir):
            # Create all env files to be sure
            for env_file in [".env", ".env.development", ".env.local"]:
                env_path = os.path.join(frontend_dir, env_file)
                with open(env_path, "w") as f:
                    f.write(env_content)
                print_success(f"Created {env_file} with correct API URL")
    
    if "wrong_port" in issues:
        print_warning("Frontend is running on wrong port")
        print_info("Update vite.config.js to use port 5176")
    
    return True

def create_fix_scripts():
    """Create helpful fix scripts"""
    print_header("CREATING FIX SCRIPTS")
    
    # Quick test script
    test_script = """#!/usr/bin/env python3
import requests
import json

print("Testing CrowdControl API Endpoints...")

# Test login
try:
    response = requests.post('http://127.0.0.1:8000/api/auth/login/', 
                            json={'username': 'admin', 'password': 'admin123'})
    if response.status_code == 200:
        print("✅ Login endpoint working")
        token = response.json().get('access', '')
    else:
        print(f"❌ Login failed: {response.status_code}")
except Exception as e:
    print(f"❌ Cannot connect to backend: {e}")

# Test upload endpoint
try:
    response = requests.get('http://127.0.0.1:8000/api/media/upload/')
    if response.status_code in [200, 405, 401]:
        print("✅ Upload endpoint exists")
    else:
        print(f"❌ Upload endpoint issue: {response.status_code}")
except Exception as e:
    print(f"❌ Upload endpoint error: {e}")

# Test streams endpoint
try:
    response = requests.get('http://127.0.0.1:8000/api/streams/')
    if response.status_code in [200, 405, 401]:
        print("✅ Streams endpoint exists")
    else:
        print(f"❌ Streams endpoint issue: {response.status_code}")
except Exception as e:
    print(f"❌ Streams endpoint error: {e}")
"""
    
    with open("test_api_endpoints.py", "w") as f:
        f.write(test_script)
    print_success("Created test_api_endpoints.py")
    
    return True

def main():
    """Main diagnostic and fix function"""
    print_header("CROWDCONTROL ERROR DIAGNOSIS")
    
    print("\n📋 REPORTED ISSUES:")
    print("1. Login: 'server error please try again or contact support'")
    print("2. Upload: 'file not receiving'")
    print("3. Live: 'failed to start live detection'")
    
    print("\n🔍 Starting diagnosis...")
    
    # Diagnose backend
    backend_issues = diagnose_backend()
    
    # Diagnose frontend
    frontend_issues = diagnose_frontend()
    
    # Summary
    print_header("DIAGNOSIS RESULTS")
    
    if backend_issues:
        print_error(f"Backend issues found: {len(backend_issues)}")
        for issue in backend_issues:
            print(f"  - {issue}")
    else:
        print_success("No backend issues detected")
    
    if frontend_issues:
        print_warning(f"Frontend issues found: {len(frontend_issues)}")
        for issue in frontend_issues:
            print(f"  - {issue}")
    else:
        print_success("No frontend issues detected")
    
    # Apply fixes
    if backend_issues:
        fix_backend_issues(backend_issues)
    
    if frontend_issues:
        fix_frontend_issues(frontend_issues)
    
    # Create helper scripts
    create_fix_scripts()
    
    # Final instructions
    print_header("SOLUTION")
    
    if "backend_not_running" in backend_issues:
        print("\n🚨 CRITICAL FIX REQUIRED:")
        print("The backend is NOT running. This is why all features are failing!")
        print("\n📋 TO FIX:")
        print("1. Open a NEW terminal window")
        print("2. Navigate to the backend directory:")
        print("   cd backend")
        print("3. Activate virtual environment:")
        print("   venv\\Scripts\\activate")
        print("4. Start Django server:")
        print("   python manage.py runserver 127.0.0.1:8000")
        print("\n5. Keep that terminal open!")
        print("6. In another terminal, start frontend:")
        print("   cd frontend")
        print("   npm run dev")
    else:
        print("\n✅ Backend is running")
        print("\n📋 REMAINING FIXES:")
        print("1. Restart the frontend to load new environment variables:")
        print("   cd frontend")
        print("   npm run dev")
        print("\n2. Clear browser cache and cookies")
        print("\n3. Try login with:")
        print("   Username: admin")
        print("   Password: admin123")
    
    print("\n🧪 TEST YOUR FIXES:")
    print("Run: python test_api_endpoints.py")
    print("This will verify all endpoints are working")
    
    print("\n💡 REMEMBER:")
    print("- Backend MUST be running for ANY feature to work")
    print("- Check browser console (F12) for detailed errors")
    print("- Both servers must be running simultaneously")

if __name__ == "__main__":
    main()
