#!/usr/bin/env python3
"""
CrowdControl File Upload Test Script
Tests file upload functionality with various file types and sizes
"""

import requests
import json
import os
import time
import sys
from urllib.parse import urljoin
from io import BytesIO
from PIL import Image

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
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

def create_test_user():
    """Create a test user and return access token"""
    print_status("Creating test user...", "INFO")
    
    test_user = {
        "username": f"uploadtest_{int(time.time())}",
        "email": f"uploadtest_{int(time.time())}@example.com",
        "password": "TestPassword123!",
        "first_name": "Upload",
        "last_name": "Test"
    }
    
    try:
        # Register user
        response = requests.post(urljoin(API_BASE, "auth/register/"), json=test_user, timeout=10)
        if response.status_code == 201:
            data = response.json()
            access_token = data.get('access')
            print_status(f"Test user created: {test_user['username']}", "SUCCESS")
            return access_token, test_user['username']
        else:
            print_status(f"User creation failed: {response.status_code}", "ERROR")
            print(response.text)
            return None, None
    except Exception as e:
        print_status(f"User creation error: {e}", "ERROR")
        return None, None

def create_test_image(size_mb=1):
    """Create a test image of specified size"""
    # Create a simple test image
    width = int((size_mb * 1024 * 1024 / 3) ** 0.5)  # Rough calculation for RGB image
    height = width
    
    image = Image.new('RGB', (width, height), color='red')
    
    # Save to BytesIO
    img_buffer = BytesIO()
    image.save(img_buffer, format='JPEG', quality=95)
    img_buffer.seek(0)
    
    return img_buffer, f"test_image_{size_mb}MB.jpg"

def create_test_video(size_mb=5):
    """Create a dummy test video file"""
    # Create a dummy video file (just random bytes for testing)
    video_data = b'FAKE_VIDEO_DATA' * (size_mb * 1024 * 1024 // 15)
    video_buffer = BytesIO(video_data)
    
    return video_buffer, f"test_video_{size_mb}MB.mp4"

def test_file_upload(access_token, file_buffer, filename, expected_status=201):
    """Test uploading a file"""
    print_status(f"Testing upload: {filename}", "INFO")
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # Determine media type
    media_type = 'video' if filename.endswith(('.mp4', '.avi', '.mov')) else 'image'
    
    files = {
        'file': (filename, file_buffer, 'image/jpeg' if media_type == 'image' else 'video/mp4')
    }
    
    data = {
        'media_type': media_type,
        'description': f'Test upload of {filename}',
        'location': 'Test Location'
    }
    
    try:
        response = requests.post(
            urljoin(API_BASE, "media/upload/"),
            headers=headers,
            files=files,
            data=data,
            timeout=30
        )
        
        print(f"  Status Code: {response.status_code}")
        print(f"  Response: {response.text[:200]}...")
        
        if response.status_code == expected_status:
            if response.status_code == 201:
                data = response.json()
                print_status(f"Upload successful: {data.get('filename', 'unknown')}", "SUCCESS")
                print(f"  - File ID: {data.get('id')}")
                print(f"  - File Size: {data.get('file_size')} bytes")
                print(f"  - Media Type: {data.get('media_type')}")
                return True
            else:
                print_status("Upload correctly rejected", "SUCCESS")
                return True
        else:
            print_status(f"Upload failed with status {response.status_code}", "ERROR")
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    print(f"  Error: {error_data.get('error', 'Unknown error')}")
                    print(f"  Detail: {error_data.get('detail', 'No details')}")
                except:
                    pass
            return False
            
    except Exception as e:
        print_status(f"Upload request failed: {e}", "ERROR")
        return False

def test_invalid_uploads(access_token):
    """Test various invalid upload scenarios"""
    print_status("Testing invalid upload scenarios...", "INFO")
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # Test 1: No file
    print_status("Test 1: No file provided", "INFO")
    response = requests.post(
        urljoin(API_BASE, "media/upload/"),
        headers=headers,
        data={'media_type': 'image'},
        timeout=10
    )
    if response.status_code == 400:
        print_status("No file test passed", "SUCCESS")
    else:
        print_status(f"No file test failed: {response.status_code}", "ERROR")
    
    # Test 2: Invalid file type
    print_status("Test 2: Invalid file type", "INFO")
    invalid_file = BytesIO(b'invalid file content')
    files = {
        'file': ('test.txt', invalid_file, 'text/plain')
    }
    data = {
        'media_type': 'image'
    }
    
    response = requests.post(
        urljoin(API_BASE, "media/upload/"),
        headers=headers,
        files=files,
        data=data,
        timeout=10
    )
    if response.status_code == 400:
        print_status("Invalid file type test passed", "SUCCESS")
    else:
        print_status(f"Invalid file type test failed: {response.status_code}", "ERROR")

def test_large_file_upload(access_token):
    """Test uploading a large file (close to 100MB limit)"""
    print_status("Testing large file upload (90MB)...", "INFO")
    
    # Create a 90MB test image
    large_buffer, filename = create_test_image(90)
    
    return test_file_upload(access_token, large_buffer, filename)

def test_oversized_file_upload(access_token):
    """Test uploading a file that exceeds the 100MB limit"""
    print_status("Testing oversized file upload (110MB)...", "INFO")
    
    # Create a 110MB test image (should be rejected)
    oversized_buffer, filename = create_test_image(110)
    
    return test_file_upload(access_token, oversized_buffer, filename, expected_status=400)

def main():
    """Run all file upload tests"""
    print_status("Starting CrowdControl File Upload Tests", "INFO")
    print(f"Backend URL: {BACKEND_URL}")
    print("-" * 60)
    
    # Create test user
    access_token, username = create_test_user()
    if not access_token:
        print_status("Failed to create test user. Exiting.", "ERROR")
        return False
    
    tests = [
        ("Small Image Upload (1MB)", lambda: test_file_upload(access_token, *create_test_image(1))),
        ("Medium Image Upload (10MB)", lambda: test_file_upload(access_token, *create_test_image(10))),
        ("Video Upload (5MB)", lambda: test_file_upload(access_token, *create_test_video(5))),
        ("Large File Upload (90MB)", lambda: test_large_file_upload(access_token)),
        ("Oversized File Upload (110MB)", lambda: test_oversized_file_upload(access_token)),
        ("Invalid Upload Scenarios", lambda: test_invalid_uploads(access_token)),
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
    print(f"Test User: {username}")
    
    if passed == total:
        print_status("All tests passed! File upload is working correctly.", "SUCCESS")
        print("\nNext steps:")
        print("1. Open your browser and go to http://localhost:5176")
        print("2. Log in and try uploading files through the UI")
        print("3. Check browser DevTools Network tab for upload requests")
        print("4. Verify files up to 100MB can be uploaded")
        return True
    else:
        print_status(f"Some tests failed. Please check the issues above.", "ERROR")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
