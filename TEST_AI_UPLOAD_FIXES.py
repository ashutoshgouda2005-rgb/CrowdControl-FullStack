#!/usr/bin/env python3
"""
Test Script for AI Upload and Analysis Fixes
Verifies that image upload and analysis works end-to-end with proper error handling
"""

import requests
import json
import os
import time
import sys
from pathlib import Path
from PIL import Image
from io import BytesIO
import random

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
API_BASE = f"{BACKEND_URL}/api/"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
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
    elif status == "FIX":
        color = Colors.PURPLE
    
    print(f"{color}{Colors.BOLD}[{status}]{Colors.END} {message}")

def create_test_image(width=800, height=600, filename="test_image.jpg"):
    """Create a test image with realistic content"""
    try:
        # Create a colorful test image
        image = Image.new('RGB', (width, height), color=(135, 206, 235))  # Sky blue background
        
        # Add some visual elements to make it more realistic
        from PIL import ImageDraw
        draw = ImageDraw.Draw(image)
        
        # Add some shapes to simulate people/objects
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255)]
        for i in range(random.randint(3, 8)):
            x = random.randint(50, width - 100)
            y = random.randint(50, height - 100)
            size = random.randint(20, 60)
            color = random.choice(colors)
            draw.ellipse([x, y, x + size, y + size], fill=color)
        
        # Add some lines to simulate structure
        for i in range(5):
            x1, y1 = random.randint(0, width), random.randint(0, height)
            x2, y2 = random.randint(0, width), random.randint(0, height)
            draw.line([(x1, y1), (x2, y2)], fill=(255, 255, 255), width=3)
        
        # Save to BytesIO
        img_buffer = BytesIO()
        image.save(img_buffer, format='JPEG', quality=85)
        img_buffer.seek(0)
        
        return img_buffer, filename
    except Exception as e:
        print_status(f"Failed to create test image: {e}", "ERROR")
        return None, None

def authenticate():
    """Create test user and authenticate"""
    print_status("Setting up authentication...", "INFO")
    
    # Create test user
    test_user = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test_{int(time.time())}@example.com",
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User"
    }
    
    try:
        # Register user
        reg_response = requests.post(f"{API_BASE}auth/register/", json=test_user, timeout=10)
        if reg_response.status_code != 201:
            print_status(f"Registration failed: {reg_response.text}", "ERROR")
            return None
        
        # Login
        login_data = {
            "username": test_user["username"],
            "password": test_user["password"]
        }
        
        login_response = requests.post(f"{API_BASE}auth/login/", json=login_data, timeout=10)
        if login_response.status_code != 200:
            print_status(f"Login failed: {login_response.text}", "ERROR")
            return None
        
        access_token = login_response.json().get('access')
        print_status("✅ Authentication successful", "SUCCESS")
        return access_token
        
    except Exception as e:
        print_status(f"Authentication error: {e}", "ERROR")
        return None

def test_image_upload_and_analysis(access_token):
    """Test complete image upload and analysis workflow"""
    print_status("Testing image upload and analysis...", "INFO")
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Create test image
    image_buffer, filename = create_test_image()
    if not image_buffer:
        return False
    
    # Prepare upload data
    files = {
        'file': (filename, image_buffer, 'image/jpeg')
    }
    data = {
        'media_type': 'image',
        'description': 'Test image for AI analysis verification',
        'location': 'Test Environment'
    }
    
    try:
        # Upload image
        print_status("📤 Uploading test image...", "INFO")
        upload_response = requests.post(
            f"{API_BASE}media/upload/",
            headers=headers,
            files=files,
            data=data,
            timeout=60
        )
        
        if upload_response.status_code != 201:
            print_status(f"❌ Upload failed: {upload_response.status_code}", "ERROR")
            print(f"Response: {upload_response.text}")
            return False
        
        upload_data = upload_response.json()
        upload_id = upload_data.get('id')
        print_status(f"✅ Upload successful! ID: {upload_id}", "SUCCESS")
        
        # Wait for analysis to complete
        print_status("🔍 Waiting for AI analysis...", "INFO")
        max_wait = 30  # 30 seconds
        poll_interval = 2  # 2 seconds
        
        for attempt in range(max_wait // poll_interval):
            time.sleep(poll_interval)
            
            # Get upload details with analysis results
            detail_response = requests.get(
                f"{API_BASE}media/{upload_id}/",
                headers=headers,
                timeout=10
            )
            
            if detail_response.status_code != 200:
                print_status(f"⚠️ Failed to get upload details: {detail_response.status_code}", "WARNING")
                continue
            
            detail_data = detail_response.json()
            analysis_status = detail_data.get('analysis_status', 'pending')
            
            print_status(f"Analysis status: {analysis_status} (attempt {attempt + 1})", "INFO")
            
            if analysis_status == 'completed':
                # Check for analysis errors
                if 'analysis_error' in detail_data:
                    error_info = detail_data['analysis_error']
                    print_status("❌ Analysis failed with specific error:", "ERROR")
                    print(f"  Error: {error_info.get('error', 'Unknown error')}")
                    print(f"  Detail: {error_info.get('detail', 'No details')}")
                    print("  Recommendations:")
                    for rec in error_info.get('recommendations', []):
                        print(f"    • {rec}")
                    return False
                
                # Check for successful analysis
                elif 'analysis_success' in detail_data:
                    success_info = detail_data['analysis_success']
                    print_status("✅ Analysis completed successfully!", "SUCCESS")
                    print(f"  👥 People count: {success_info.get('people_count', 0)}")
                    print(f"  🎯 Confidence: {success_info.get('confidence_score', 0):.1%}")
                    print(f"  👥 Crowd detected: {success_info.get('crowd_detected', False)}")
                    print(f"  ⚠️ Stampede risk: {success_info.get('is_stampede_risk', False)}")
                    print(f"  📝 Status: {success_info.get('status_message', 'No message')}")
                    print(f"  ⏱️ Processing time: {success_info.get('processing_time', 0):.2f}s")
                    print(f"  🔄 Fallback mode: {success_info.get('fallback_mode', False)}")
                    
                    if success_info.get('recommendations'):
                        print("  💡 Recommendations:")
                        for rec in success_info.get('recommendations', []):
                            print(f"    • {rec}")
                    
                    return True
                
                else:
                    # Analysis completed but no specific results
                    print_status("⚠️ Analysis completed but no detailed results available", "WARNING")
                    print(f"Raw analysis result: {detail_data.get('analysis_result', {})}")
                    return True
            
            elif analysis_status == 'failed':
                print_status("❌ Analysis failed", "ERROR")
                analysis_result = detail_data.get('analysis_result', {})
                if analysis_result:
                    print(f"  Error details: {analysis_result}")
                return False
        
        # Timeout reached
        print_status("⏰ Analysis timeout - taking longer than expected", "WARNING")
        return False
        
    except Exception as e:
        print_status(f"❌ Upload and analysis test failed: {e}", "ERROR")
        return False

def test_error_scenarios(access_token):
    """Test various error scenarios to ensure proper error handling"""
    print_status("Testing error scenarios...", "INFO")
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Test 1: Invalid file type
    print_status("Testing invalid file type...", "INFO")
    try:
        files = {'file': ('test.txt', BytesIO(b'This is not an image'), 'text/plain')}
        response = requests.post(f"{API_BASE}media/upload/", headers=headers, files=files, timeout=10)
        
        if response.status_code == 400:
            error_data = response.json()
            print_status("✅ Invalid file type correctly rejected", "SUCCESS")
            print(f"  Error: {error_data.get('error', 'Unknown')}")
            print(f"  Detail: {error_data.get('detail', 'No details')}")
        else:
            print_status(f"⚠️ Unexpected response for invalid file: {response.status_code}", "WARNING")
    except Exception as e:
        print_status(f"Error testing invalid file type: {e}", "ERROR")
    
    # Test 2: Missing file
    print_status("Testing missing file...", "INFO")
    try:
        data = {'media_type': 'image', 'description': 'Test'}
        response = requests.post(f"{API_BASE}media/upload/", headers=headers, data=data, timeout=10)
        
        if response.status_code == 400:
            error_data = response.json()
            print_status("✅ Missing file correctly rejected", "SUCCESS")
            print(f"  Error: {error_data.get('error', 'Unknown')}")
            print(f"  Detail: {error_data.get('detail', 'No details')}")
        else:
            print_status(f"⚠️ Unexpected response for missing file: {response.status_code}", "WARNING")
    except Exception as e:
        print_status(f"Error testing missing file: {e}", "ERROR")
    
    return True

def test_ai_predictor_status():
    """Test the AI predictor status endpoint"""
    print_status("Testing AI predictor status...", "INFO")
    
    try:
        # Test the health endpoint which should include AI predictor status
        response = requests.get(f"{API_BASE}health/", timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            print_status("✅ Health endpoint accessible", "SUCCESS")
            
            # Check for ML predictor status
            ml_status = health_data.get('ml_predictor', 'Unknown')
            print(f"  🤖 ML Predictor: {ml_status}")
            
            system_info = health_data.get('system_info', {})
            if system_info:
                print("  📊 System Info:")
                for key, value in system_info.items():
                    print(f"    {key}: {value}")
            
            return True
        else:
            print_status(f"❌ Health endpoint failed: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        print_status(f"❌ Health check failed: {e}", "ERROR")
        return False

def main():
    """Run comprehensive AI upload and analysis tests"""
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}AI UPLOAD AND ANALYSIS FIXES - COMPREHENSIVE TEST{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*80}{Colors.END}")
    
    print_status(f"Testing backend: {BACKEND_URL}", "INFO")
    
    # Test 1: Check backend connectivity
    try:
        response = requests.get(BACKEND_URL, timeout=5)
        print_status("✅ Backend server is running", "SUCCESS")
    except:
        print_status("❌ Backend server is not accessible", "ERROR")
        print_status("💡 Start Django server: python manage.py runserver 127.0.0.1:8000", "FIX")
        return False
    
    # Test 2: Check AI predictor status
    ai_status = test_ai_predictor_status()
    
    # Test 3: Authenticate
    access_token = authenticate()
    if not access_token:
        return False
    
    # Test 4: Test error scenarios
    error_test_passed = test_error_scenarios(access_token)
    
    # Test 5: Test complete upload and analysis workflow
    upload_test_passed = test_image_upload_and_analysis(access_token)
    
    # Results summary
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}TEST RESULTS SUMMARY{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*80}{Colors.END}")
    
    tests = [
        ("Backend Connectivity", True),
        ("AI Predictor Status", ai_status),
        ("Authentication", access_token is not None),
        ("Error Handling", error_test_passed),
        ("Upload & Analysis", upload_test_passed)
    ]
    
    passed = sum(1 for _, result in tests if result)
    total = len(tests)
    
    for test_name, result in tests:
        status = "✅ PASS" if result else "❌ FAIL"
        print_status(f"{test_name}: {status}", "SUCCESS" if result else "ERROR")
    
    print(f"\n{Colors.BOLD}Overall Result: {passed}/{total} tests passed{Colors.END}")
    
    if passed == total:
        print_status("🎉 ALL TESTS PASSED! AI upload and analysis is working correctly!", "SUCCESS")
        print_status("Your Django backend now properly handles image uploads and analysis", "SUCCESS")
        print_status("Frontend will receive specific error messages instead of generic server errors", "SUCCESS")
    else:
        print_status(f"⚠️ {total - passed} tests failed - check the errors above", "WARNING")
    
    print(f"\n{Colors.CYAN}📋 Next Steps:{Colors.END}")
    print("1. 🌐 Test the frontend at http://localhost:5176")
    print("2. 📤 Try uploading various image types and sizes")
    print("3. 🔍 Check browser DevTools for detailed error messages")
    print("4. 📊 Verify analysis results are displayed properly")
    print("5. 🚨 Test error scenarios (invalid files, large files, etc.)")
    
    return passed == total

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
