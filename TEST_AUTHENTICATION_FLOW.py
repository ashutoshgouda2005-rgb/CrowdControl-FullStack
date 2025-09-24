#!/usr/bin/env python3
"""
CrowdControl Authentication Flow Test Script
Tests the complete authentication flow between frontend (port 5176) and backend (port 8000)
"""

import requests
import json
import time
import sys
from urllib.parse import urljoin

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5176"
API_BASE = urljoin(BACKEND_URL, "/api/")

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_status(message, status="INFO"):
    color = Colors.BLUE
    if status == "SUCCESS":
        color = Colors.GREEN
    elif status == "ERROR":
        color = Colors.RED
    elif status == "WARNING":
        color = Colors.YELLOW
    
    print(f"{color}{Colors.BOLD}[{status}]{Colors.END} {message}")

def test_backend_health():
    """Test if backend is running and healthy"""
    print_status("Testing backend health...", "INFO")
    
    try:
        response = requests.get(urljoin(API_BASE, "health/"), timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_status(f"Backend is healthy: {data.get('status', 'unknown')}", "SUCCESS")
            print(f"  - Database: {data.get('database', 'unknown')}")
            print(f"  - ML Predictor: {data.get('ml_predictor', 'unknown')}")
            return True
        else:
            print_status(f"Backend health check failed: {response.status_code}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Backend connection failed: {e}", "ERROR")
        return False

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    print_status("Testing frontend accessibility...", "INFO")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print_status("Frontend is accessible", "SUCCESS")
            return True
        else:
            print_status(f"Frontend returned status: {response.status_code}", "WARNING")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Frontend connection failed: {e}", "ERROR")
        return False

def test_cors_configuration():
    """Test CORS configuration"""
    print_status("Testing CORS configuration...", "INFO")
    
    headers = {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
    
    try:
        # Test preflight request
        response = requests.options(urljoin(API_BASE, "auth/login/"), headers=headers, timeout=5)
        
        if response.status_code in [200, 204]:
            cors_headers = response.headers
            allowed_origins = cors_headers.get('Access-Control-Allow-Origin', '')
            allowed_methods = cors_headers.get('Access-Control-Allow-Methods', '')
            
            print_status("CORS preflight successful", "SUCCESS")
            print(f"  - Allowed Origins: {allowed_origins}")
            print(f"  - Allowed Methods: {allowed_methods}")
            return True
        else:
            print_status(f"CORS preflight failed: {response.status_code}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"CORS test failed: {e}", "ERROR")
        return False

def test_authentication_endpoints():
    """Test authentication endpoints"""
    print_status("Testing authentication endpoints...", "INFO")
    
    # Test login endpoint
    login_url = urljoin(API_BASE, "auth/login/")
    
    # Test with invalid credentials
    print_status("Testing login with invalid credentials...", "INFO")
    invalid_credentials = {
        "username": "invalid_user",
        "password": "invalid_password"
    }
    
    try:
        response = requests.post(login_url, json=invalid_credentials, timeout=5)
        if response.status_code == 401:
            print_status("Invalid credentials correctly rejected", "SUCCESS")
        else:
            print_status(f"Unexpected response for invalid credentials: {response.status_code}", "WARNING")
            print(f"Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print_status(f"Login endpoint test failed: {e}", "ERROR")
        return False
    
    # Test with missing credentials
    print_status("Testing login with missing credentials...", "INFO")
    try:
        response = requests.post(login_url, json={}, timeout=5)
        if response.status_code == 400:
            print_status("Missing credentials correctly rejected", "SUCCESS")
        else:
            print_status(f"Unexpected response for missing credentials: {response.status_code}", "WARNING")
    except requests.exceptions.RequestException as e:
        print_status(f"Missing credentials test failed: {e}", "ERROR")
    
    return True

def test_user_creation_and_login():
    """Test user creation and login flow"""
    print_status("Testing user creation and login flow...", "INFO")
    
    # Create test user data
    test_user = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test_{int(time.time())}@example.com",
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User"
    }
    
    # Test registration
    register_url = urljoin(API_BASE, "auth/register/")
    print_status("Testing user registration...", "INFO")
    
    try:
        response = requests.post(register_url, json=test_user, timeout=10)
        if response.status_code == 201:
            data = response.json()
            print_status("User registration successful", "SUCCESS")
            print(f"  - User ID: {data.get('user', {}).get('id', 'unknown')}")
            print(f"  - Username: {data.get('user', {}).get('username', 'unknown')}")
            
            # Check if tokens are returned
            if 'access' in data and 'refresh' in data:
                print_status("JWT tokens received on registration", "SUCCESS")
                access_token = data['access']
            else:
                print_status("No JWT tokens in registration response", "WARNING")
                access_token = None
        else:
            print_status(f"User registration failed: {response.status_code}", "ERROR")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Registration test failed: {e}", "ERROR")
        return False
    
    # Test login with created user
    login_url = urljoin(API_BASE, "auth/login/")
    print_status("Testing login with created user...", "INFO")
    
    login_credentials = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    
    try:
        response = requests.post(login_url, json=login_credentials, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_status("Login successful", "SUCCESS")
            print(f"  - User: {data.get('user', {}).get('username', 'unknown')}")
            
            if 'access' in data and 'refresh' in data:
                print_status("JWT tokens received on login", "SUCCESS")
                access_token = data['access']
                
                # Test protected endpoint
                return test_protected_endpoint(access_token)
            else:
                print_status("No JWT tokens in login response", "ERROR")
                return False
        else:
            print_status(f"Login failed: {response.status_code}", "ERROR")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Login test failed: {e}", "ERROR")
        return False

def test_protected_endpoint(access_token):
    """Test accessing protected endpoint with JWT token"""
    print_status("Testing protected endpoint access...", "INFO")
    
    profile_url = urljoin(API_BASE, "auth/profile/")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(profile_url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_status("Protected endpoint access successful", "SUCCESS")
            print(f"  - User ID: {data.get('id', 'unknown')}")
            print(f"  - Username: {data.get('username', 'unknown')}")
            return True
        else:
            print_status(f"Protected endpoint access failed: {response.status_code}", "ERROR")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Protected endpoint test failed: {e}", "ERROR")
        return False

def test_invalid_token():
    """Test behavior with invalid JWT token"""
    print_status("Testing invalid token handling...", "INFO")
    
    profile_url = urljoin(API_BASE, "auth/profile/")
    headers = {
        "Authorization": "Bearer invalid_token_here",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(profile_url, headers=headers, timeout=5)
        if response.status_code == 401:
            print_status("Invalid token correctly rejected", "SUCCESS")
            return True
        else:
            print_status(f"Unexpected response for invalid token: {response.status_code}", "WARNING")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Invalid token test failed: {e}", "ERROR")
        return False

def main():
    """Run all authentication tests"""
    print_status("Starting CrowdControl Authentication Flow Tests", "INFO")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print("-" * 60)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Frontend Accessibility", test_frontend_accessibility),
        ("CORS Configuration", test_cors_configuration),
        ("Authentication Endpoints", test_authentication_endpoints),
        ("User Creation and Login", test_user_creation_and_login),
        ("Invalid Token Handling", test_invalid_token),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{Colors.BOLD}=== {test_name} ==={Colors.END}")
        try:
            if test_func():
                passed += 1
            else:
                print_status(f"{test_name} failed", "ERROR")
        except Exception as e:
            print_status(f"{test_name} crashed: {e}", "ERROR")
        
        time.sleep(1)  # Brief pause between tests
    
    print(f"\n{Colors.BOLD}=== Test Summary ==={Colors.END}")
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print_status("All tests passed! Authentication flow is working correctly.", "SUCCESS")
        print("\nNext steps:")
        print("1. Open your browser and go to http://localhost:5176")
        print("2. Try logging in with the credentials you created")
        print("3. Check browser DevTools Network tab for API requests")
        return True
    else:
        print_status(f"Some tests failed. Please check the issues above.", "ERROR")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
