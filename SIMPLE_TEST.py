#!/usr/bin/env python3
"""
Simple System Test - Core functionality verification
"""

import requests
import json
import time

def test_backend():
    """Test backend health"""
    try:
        response = requests.get("http://127.0.0.1:8000/api/health/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Backend Health: {data.get('status')}")
            return True
        else:
            print(f"[FAIL] Backend Health: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Backend Health: {e}")
        return False

def test_auth():
    """Test authentication"""
    try:
        response = requests.post("http://127.0.0.1:8000/api/auth/login/", 
            json={'username': 'admin', 'password': 'admin123'})
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access')
            print("[PASS] Authentication: JWT token obtained")
            return token
        else:
            print(f"[FAIL] Authentication: {response.text}")
            return None
    except Exception as e:
        print(f"[FAIL] Authentication: {e}")
        return None

def run_tests():
    """Run basic tests"""
    print("=" * 50)
    print("MINIMAL SYSTEM TEST")
    print("=" * 50)
    
    # Test backend
    backend_ok = test_backend()
    if not backend_ok:
        print("\n[ERROR] Backend is not running!")
        print("Please start the backend with: python manage.py runserver")
        return False
    
    # Test auth
    token = test_auth()
    if not token:
        print("\n[ERROR] Authentication failed!")
        return False
    
    print("\n[SUCCESS] Core system is working!")
    print("Backend: OK")
    print("Authentication: OK")
    print("\nYou can now test the frontend:")
    print("1. Open browser to http://localhost:5177")
    print("2. Login with admin/admin123")
    print("3. Test photo upload and live detection")
    
    return True

if __name__ == "__main__":
    run_tests()
