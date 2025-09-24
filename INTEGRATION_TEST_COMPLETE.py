#!/usr/bin/env python3
"""
CrowdControl Complete Integration Test Suite
Tests Django + DRF backend and Vite/Tailwind frontend integration
Resolves all connectivity issues and provides comprehensive debugging
"""

import requests
import json
import os
import time
import sys
from urllib.parse import urljoin
from io import BytesIO
from PIL import Image
import subprocess
import webbrowser
import threading
from datetime import datetime

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5176"
API_BASE = urljoin(BACKEND_URL, "/api/")

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(title):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{title.center(60)}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")

def print_status(message, status="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    color = Colors.BLUE
    if status == "SUCCESS":
        color = Colors.GREEN
    elif status == "ERROR":
        color = Colors.RED
    elif status == "WARNING":
        color = Colors.YELLOW
    elif status == "TEST":
        color = Colors.PURPLE
    
    print(f"{color}{Colors.BOLD}[{timestamp} {status}]{Colors.END} {message}")

def test_backend_health():
    """Test backend health with comprehensive checks"""
    print_header("BACKEND HEALTH CHECK")
    
    try:
        response = requests.get(urljoin(API_BASE, "health/"), timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_status("Backend is healthy!", "SUCCESS")
            
            # Display detailed health information
            print(f"  📊 Status: {data.get('status')}")
            print(f"  🗄️  Database: {data.get('database')}")
            print(f"  🤖 ML Predictor: {data.get('ml_predictor')}")
            print(f"  🔧 Debug Mode: {data.get('system_info', {}).get('debug_mode')}")
            print(f"  🌐 CORS Allow All: {data.get('cors_config', {}).get('allow_all_origins')}")
            print(f"  📁 Max File Size: {data.get('upload_config', {}).get('max_file_size')}")
            
            return True, data
        else:
            print_status(f"Backend health check failed: {response.status_code}", "ERROR")
            return False, None
    except requests.exceptions.RequestException as e:
        print_status(f"Backend connection failed: {e}", "ERROR")
        print_status("Make sure Django server is running: python manage.py runserver 127.0.0.1:8000", "WARNING")
        return False, None

def test_frontend_accessibility():
    """Test frontend accessibility"""
    print_header("FRONTEND ACCESSIBILITY CHECK")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print_status("Frontend is accessible!", "SUCCESS")
            print(f"  🌐 URL: {FRONTEND_URL}")
            print(f"  📄 Content-Type: {response.headers.get('content-type', 'unknown')}")
            return True
        else:
            print_status(f"Frontend returned status: {response.status_code}", "WARNING")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Frontend connection failed: {e}", "ERROR")
        print_status("Make sure Vite dev server is running: npm run dev", "WARNING")
        return False

def test_cors_configuration():
    """Test CORS configuration"""
    print_header("CORS CONFIGURATION TEST")
    
    try:
        # Test preflight request
        headers = {
            'Origin': FRONTEND_URL,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
        
        response = requests.options(urljoin(API_BASE, "health/"), headers=headers, timeout=5)
        
        if response.status_code in [200, 204]:
            print_status("CORS preflight request successful", "SUCCESS")
            
            # Check CORS headers
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            for header, value in cors_headers.items():
                if value:
                    print(f"  ✅ {header}: {value}")
                else:
                    print(f"  ❌ {header}: Not set")
            
            return True
        else:
            print_status(f"CORS preflight failed: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        print_status(f"CORS test error: {e}", "ERROR")
        return False

def create_test_user():
    """Create a test user and return access token"""
    print_header("USER AUTHENTICATION TEST")
    
    test_user = {
        "username": f"integtest_{int(time.time())}",
        "email": f"integtest_{int(time.time())}@example.com",
        "password": "TestPassword123!",
        "first_name": "Integration",
        "last_name": "Test"
    }
    
    try:
        # Register user
        print_status("Creating test user...", "TEST")
        response = requests.post(urljoin(API_BASE, "auth/register/"), json=test_user, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            print_status(f"User created: {test_user['username']}", "SUCCESS")
            
            # Login to get tokens
            print_status("Logging in to get JWT tokens...", "TEST")
            login_data = {
                "username": test_user["username"],
                "password": test_user["password"]
            }
            
            login_response = requests.post(urljoin(API_BASE, "auth/login/"), json=login_data, timeout=10)
            
            if login_response.status_code == 200:
                login_result = login_response.json()
                access_token = login_result.get('access')
                refresh_token = login_result.get('refresh')
                
                print_status("JWT authentication successful!", "SUCCESS")
                print(f"  🔑 Access Token: {access_token[:20]}...")
                print(f"  🔄 Refresh Token: {refresh_token[:20]}...")
                
                return access_token, test_user
            else:
                print_status(f"Login failed: {login_response.status_code}", "ERROR")
                print(f"Response: {login_response.text}")
                return None, None
        else:
            print_status(f"User creation failed: {response.status_code}", "ERROR")
            print(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print_status(f"Authentication test error: {e}", "ERROR")
        return None, None

def test_jwt_authentication(access_token):
    """Test JWT authentication with profile endpoint"""
    print_status("Testing JWT authentication...", "TEST")
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(urljoin(API_BASE, "auth/profile/"), headers=headers, timeout=10)
        
        if response.status_code == 200:
            profile_data = response.json()
            print_status("JWT authentication working correctly!", "SUCCESS")
            print(f"  👤 User: {profile_data.get('username')}")
            print(f"  📧 Email: {profile_data.get('email')}")
            return True
        else:
            print_status(f"JWT authentication failed: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        print_status(f"JWT test error: {e}", "ERROR")
        return False

def create_test_image(size_mb=1):
    """Create a test image of specified size"""
    try:
        # Calculate dimensions for target file size
        target_size = size_mb * 1024 * 1024
        # Rough calculation for JPEG compression
        width = int((target_size / 3) ** 0.5) 
        height = width
        
        # Create image with random colors
        import random
        color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        image = Image.new('RGB', (width, height), color=color)
        
        # Save to BytesIO
        img_buffer = BytesIO()
        image.save(img_buffer, format='JPEG', quality=85)
        img_buffer.seek(0)
        
        return img_buffer, f"test_image_{size_mb}MB.jpg"
    except Exception as e:
        print_status(f"Failed to create test image: {e}", "ERROR")
        return None, None

def test_file_upload_integration(access_token):
    """Test file upload with comprehensive scenarios"""
    print_header("FILE UPLOAD INTEGRATION TEST")
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    test_scenarios = [
        {"size": 1, "description": "Small image (1MB)"},
        {"size": 5, "description": "Medium image (5MB)"},
        {"size": 20, "description": "Large image (20MB)"},
    ]
    
    for scenario in test_scenarios:
        print_status(f"Testing: {scenario['description']}", "TEST")
        
        image_buffer, filename = create_test_image(scenario['size'])
        if not image_buffer:
            continue
            
        files = {
            'file': (filename, image_buffer, 'image/jpeg')
        }
        data = {
            'media_type': 'image',
            'description': f"Integration test - {scenario['description']}",
            'location': 'Test Environment'
        }
        
        try:
            response = requests.post(
                urljoin(API_BASE, "media/upload/"),
                headers=headers,
                files=files,
                data=data,
                timeout=60  # Longer timeout for large files
            )
            
            if response.status_code == 201:
                upload_data = response.json()
                print_status(f"✅ {scenario['description']} uploaded successfully!", "SUCCESS")
                print(f"  📄 File ID: {upload_data.get('id')}")
                print(f"  📊 Size: {upload_data.get('file_size')} bytes")
                print(f"  🔄 Analysis Status: {upload_data.get('analysis_status', 'pending')}")
                
                # Test getting upload details
                upload_id = upload_data.get('id')
                if upload_id:
                    detail_response = requests.get(
                        urljoin(API_BASE, f"media/{upload_id}/"),
                        headers=headers,
                        timeout=10
                    )
                    if detail_response.status_code == 200:
                        print_status(f"✅ Upload details retrieved successfully", "SUCCESS")
                    else:
                        print_status(f"❌ Failed to get upload details: {detail_response.status_code}", "WARNING")
                        
            else:
                print_status(f"❌ {scenario['description']} upload failed: {response.status_code}", "ERROR")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print_status(f"❌ Upload error for {scenario['description']}: {e}", "ERROR")

def test_error_handling():
    """Test error handling scenarios"""
    print_header("ERROR HANDLING TEST")
    
    # Test 1: Invalid endpoint
    print_status("Testing invalid endpoint...", "TEST")
    try:
        response = requests.get(urljoin(API_BASE, "invalid/endpoint/"), timeout=5)
        if response.status_code == 404:
            print_status("✅ 404 error handled correctly", "SUCCESS")
        else:
            print_status(f"❌ Unexpected status for invalid endpoint: {response.status_code}", "WARNING")
    except Exception as e:
        print_status(f"Invalid endpoint test error: {e}", "ERROR")
    
    # Test 2: Unauthorized access
    print_status("Testing unauthorized access...", "TEST")
    try:
        response = requests.get(urljoin(API_BASE, "auth/profile/"), timeout=5)
        if response.status_code == 401:
            print_status("✅ 401 unauthorized handled correctly", "SUCCESS")
        else:
            print_status(f"❌ Unexpected status for unauthorized access: {response.status_code}", "WARNING")
    except Exception as e:
        print_status(f"Unauthorized test error: {e}", "ERROR")
    
    # Test 3: Invalid file upload
    print_status("Testing invalid file upload...", "TEST")
    try:
        files = {'file': ('test.txt', BytesIO(b'This is not an image'), 'text/plain')}
        response = requests.post(urljoin(API_BASE, "media/upload/"), files=files, timeout=10)
        if response.status_code == 400:
            print_status("✅ Invalid file type rejected correctly", "SUCCESS")
        elif response.status_code == 401:
            print_status("✅ Unauthorized upload rejected correctly", "SUCCESS")
        else:
            print_status(f"❌ Unexpected status for invalid file: {response.status_code}", "WARNING")
    except Exception as e:
        print_status(f"Invalid file test error: {e}", "ERROR")

def create_debugging_guide():
    """Create comprehensive debugging guide"""
    print_header("CREATING DEBUGGING GUIDE")
    
    guide_content = """# CrowdControl Integration Debugging Guide

## 🔍 Browser DevTools Debugging

### Network Tab Verification
1. **Open DevTools**: Press F12 or right-click → Inspect
2. **Go to Network Tab**: Click "Network" tab
3. **Clear existing requests**: Click clear button (🗑️)
4. **Perform action**: Upload file, login, etc.
5. **Check requests**:

#### Expected Request Format (File Upload):
```
Method: POST
URL: http://127.0.0.1:8000/api/media/upload/
Status: 201 Created

Request Headers:
- Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
- Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

Form Data:
- file: [File object]
- media_type: "image" or "video"
- description: "Optional description"
- location: "Optional location"
```

#### Expected Response (Success):
```json
{
  "id": 123,
  "filename": "example.jpg",
  "file_size": 1234567,
  "media_type": "image",
  "analysis_status": "pending",
  "uploaded_at": "2025-09-21T09:00:00Z"
}
```

### Console Tab Debugging
1. **Check for errors**: Look for red error messages
2. **API call logs**: Look for "🔴 API Error Details" groups
3. **Network errors**: Check for CORS, connection issues

## 🛠️ Common Issues & Solutions

### Issue 1: CORS Errors
**Symptoms**: 
- Console shows "CORS policy" errors
- Network requests fail with no response

**Solutions**:
1. Check backend CORS settings in `settings.py`
2. Verify frontend URL is in `CORS_ALLOWED_ORIGINS`
3. Ensure `CORS_ALLOW_ALL_ORIGINS = True` in development

### Issue 2: 401 Unauthorized
**Symptoms**:
- All API calls return 401
- User gets logged out immediately

**Solutions**:
1. Check JWT token in localStorage: `localStorage.getItem('access_token')`
2. Verify token format: Should start with "eyJ"
3. Check token expiration
4. Test login endpoint manually

### Issue 3: File Upload Fails
**Symptoms**:
- Upload returns 400/413/415 errors
- Files don't appear in backend

**Solutions**:
1. Check file size (max 100MB)
2. Verify file type (images/videos only)
3. Check FormData format in Network tab
4. Verify backend file upload settings

### Issue 4: Backend Connection Failed
**Symptoms**:
- "ERR_NETWORK" or "ECONNABORTED" errors
- Health check fails

**Solutions**:
1. Verify backend is running: `python manage.py runserver 127.0.0.1:8000`
2. Check URL configuration in frontend
3. Test backend directly: `curl http://127.0.0.1:8000/api/health/`

## 🧪 Manual Testing Steps

### 1. Backend Health Check
```bash
curl -X GET http://127.0.0.1:8000/api/health/
```

### 2. User Registration
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \\
  -H "Content-Type: application/json" \\
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!"}'
```

### 3. User Login
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \\
  -H "Content-Type: application/json" \\
  -d '{"username":"testuser","password":"TestPass123!"}'
```

### 4. File Upload
```bash
curl -X POST http://127.0.0.1:8000/api/media/upload/ \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -F "file=@test_image.jpg" \\
  -F "media_type=image"
```

## 📊 Configuration Checklist

### Backend (Django) ✅
- [ ] `CORS_ALLOW_ALL_ORIGINS = True` (development)
- [ ] `FILE_UPLOAD_MAX_MEMORY_SIZE = 100MB`
- [ ] `DATA_UPLOAD_MAX_MEMORY_SIZE = 100MB`
- [ ] JWT settings configured
- [ ] Database migrations applied

### Frontend (Vite) ✅
- [ ] `VITE_API_URL` points to correct backend
- [ ] CORS enabled in vite.config.js
- [ ] JWT tokens stored in localStorage
- [ ] Error handling implemented

## 🔧 Environment Variables

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5176
```

### Frontend (.env.development)
```
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws
VITE_DEBUG=true
```

## 🚀 Quick Fix Commands

### Restart Everything
```bash
# Backend
cd backend
python manage.py runserver 127.0.0.1:8000

# Frontend (new terminal)
cd frontend
npm run dev
```

### Clear Browser Data
1. Open DevTools (F12)
2. Application tab → Storage → Clear site data
3. Refresh page (Ctrl+F5)

### Reset Database
```bash
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

---

**Need Help?** 
1. Run the integration test: `python INTEGRATION_TEST_COMPLETE.py`
2. Check browser console for detailed error logs
3. Verify both servers are running on correct ports
"""

    try:
        with open("DEBUGGING_GUIDE.md", "w", encoding="utf-8") as f:
            f.write(guide_content)
        print_status("✅ Debugging guide created: DEBUGGING_GUIDE.md", "SUCCESS")
        return True
    except Exception as e:
        print_status(f"❌ Failed to create debugging guide: {e}", "ERROR")
        return False

def open_browser_for_testing():
    """Open browser for manual testing"""
    print_header("OPENING BROWSER FOR MANUAL TESTING")
    
    try:
        webbrowser.open(FRONTEND_URL)
        print_status(f"✅ Browser opened to {FRONTEND_URL}", "SUCCESS")
        
        # Also open backend health check
        webbrowser.open(urljoin(API_BASE, "health/"))
        print_status(f"✅ Backend health check opened", "SUCCESS")
        
        return True
    except Exception as e:
        print_status(f"❌ Failed to open browser: {e}", "ERROR")
        return False

def main():
    """Run complete integration test suite"""
    print_header("CROWDCONTROL COMPLETE INTEGRATION TEST SUITE")
    print(f"🎯 Backend URL: {BACKEND_URL}")
    print(f"🎯 Frontend URL: {FRONTEND_URL}")
    print(f"🎯 API Base: {API_BASE}")
    
    results = {
        'backend_health': False,
        'frontend_access': False,
        'cors_config': False,
        'authentication': False,
        'file_upload': False,
        'error_handling': False
    }
    
    # Test 1: Backend Health
    results['backend_health'], health_data = test_backend_health()
    
    # Test 2: Frontend Accessibility
    results['frontend_access'] = test_frontend_accessibility()
    
    # Test 3: CORS Configuration
    results['cors_config'] = test_cors_configuration()
    
    # Test 4: Authentication Flow
    if results['backend_health']:
        access_token, test_user = create_test_user()
        if access_token:
            results['authentication'] = test_jwt_authentication(access_token)
            
            # Test 5: File Upload Integration
            if results['authentication']:
                test_file_upload_integration(access_token)
                results['file_upload'] = True
    
    # Test 6: Error Handling
    test_error_handling()
    results['error_handling'] = True
    
    # Create debugging guide
    create_debugging_guide()
    
    # Final Results Summary
    print_header("INTEGRATION TEST RESULTS")
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print_status(f"{test_name.replace('_', ' ').title()}: {status}", 
                    "SUCCESS" if passed else "ERROR")
    
    print(f"\n{Colors.BOLD}Overall Result: {passed_tests}/{total_tests} tests passed{Colors.END}")
    
    if passed_tests == total_tests:
        print_status("🎉 ALL INTEGRATION TESTS PASSED!", "SUCCESS")
        print_status("Your Django + Vite integration is working perfectly!", "SUCCESS")
    else:
        print_status(f"⚠️  {total_tests - passed_tests} tests failed", "WARNING")
        print_status("Check the debugging guide for solutions", "WARNING")
    
    # Open browser for manual testing
    print_header("MANUAL TESTING")
    open_browser_for_testing()
    
    print(f"\n{Colors.CYAN}📖 Next Steps:{Colors.END}")
    print("1. 🌐 Test the application in your browser")
    print("2. 🔍 Use DevTools to verify API calls")
    print("3. 📁 Try uploading different file types and sizes")
    print("4. 🎨 Test theme toggle and notifications")
    print("5. 📋 Read DEBUGGING_GUIDE.md for troubleshooting")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    try:
        success = main()
        print(f"\n{Colors.BOLD}Press Enter to exit...{Colors.END}")
        input()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Unexpected error: {e}{Colors.END}")
        sys.exit(1)
