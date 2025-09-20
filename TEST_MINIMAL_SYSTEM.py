#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Minimal System Integration Test
Tests the core functionality of the CrowdControl system
"""

import requests
import json
import time
import base64
import io
from PIL import Image
import numpy as np

class MinimalSystemTester:
    def __init__(self):
        self.backend_url = "http://127.0.0.1:8000"
        self.frontend_url = "http://localhost:5177"  # Current running port
        self.token = None
        
    def test_backend_health(self):
        """Test if backend is running and healthy"""
        try:
            response = requests.get(f"{self.backend_url}/api/health/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print("[PASS] Backend Health: OK")
                print(f"   Status: {data.get('status')}")
                print(f"   ML Predictor: {data.get('ml_predictor')}")
                return True
            else:
                print(f"❌ Backend Health: HTTP {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Backend Health: Connection failed - {e}")
            return False
    
    def test_authentication(self):
        """Test JWT authentication"""
        try:
            response = requests.post(f"{self.backend_url}/api/auth/login/", 
                json={'username': 'admin', 'password': 'admin123'})
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access')
                print("✅ Authentication: JWT token obtained")
                return True
            else:
                print(f"❌ Authentication: Failed - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Authentication: Connection failed - {e}")
            return False
    
    def create_test_image(self):
        """Create a simple test image"""
        # Create a simple test image with some basic shapes
        img = Image.new('RGB', (640, 480), color='white')
        pixels = img.load()
        
        # Draw a simple person-like shape (rectangle + circle for head)
        for x in range(300, 340):  # Body
            for y in range(200, 350):
                pixels[x, y] = (100, 100, 100)
        
        for x in range(310, 330):  # Head
            for y in range(180, 200):
                pixels[x, y] = (150, 120, 100)
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes.getvalue()
    
    def test_photo_upload(self):
        """Test photo upload and analysis"""
        if not self.token:
            print("❌ Photo Upload: No authentication token")
            return False
        
        try:
            # Create test image
            image_data = self.create_test_image()
            
            # Upload image
            files = {'file': ('test_image.jpg', image_data, 'image/jpeg')}
            data = {
                'media_type': 'image',
                'description': 'Minimal system test image'
            }
            headers = {'Authorization': f'Bearer {self.token}'}
            
            response = requests.post(f"{self.backend_url}/api/media/", 
                files=files, data=data, headers=headers)
            
            if response.status_code == 201:
                upload_data = response.json()
                upload_id = upload_data['id']
                print(f"✅ Photo Upload: Success (ID: {upload_id})")
                
                # Wait for analysis
                print("   Waiting for analysis...")
                for attempt in range(10):
                    time.sleep(2)
                    result_response = requests.get(f"{self.backend_url}/api/media/{upload_id}/", 
                        headers=headers)
                    
                    if result_response.status_code == 200:
                        result_data = result_response.json()
                        if result_data.get('analysis_status') == 'completed':
                            people_count = result_data.get('people_count', 0)
                            confidence = result_data.get('confidence_score', 0)
                            print(f"✅ Analysis Complete: {people_count} people, {confidence:.1%} confidence")
                            return True
                
                print("⚠️  Analysis: Timed out waiting for results")
                return False
            else:
                print(f"❌ Photo Upload: Failed - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Photo Upload: Connection failed - {e}")
            return False
    
    def test_live_stream_creation(self):
        """Test live stream creation"""
        if not self.token:
            print("❌ Live Stream: No authentication token")
            return False
        
        try:
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
            data = {
                'stream_name': 'Minimal Test Stream',
                'description': 'Test stream for minimal system'
            }
            
            response = requests.post(f"{self.backend_url}/api/streams/", 
                json=data, headers=headers)
            
            if response.status_code == 201:
                stream_data = response.json()
                stream_id = stream_data['id']
                print(f"✅ Live Stream Creation: Success (ID: {stream_id})")
                return True
            else:
                print(f"❌ Live Stream Creation: Failed - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Live Stream Creation: Connection failed - {e}")
            return False
    
    def test_frame_analysis(self):
        """Test frame analysis for live detection"""
        if not self.token:
            print("❌ Frame Analysis: No authentication token")
            return False
        
        try:
            # First create a stream
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
            
            stream_response = requests.post(f"{self.backend_url}/api/streams/", 
                json={'stream_name': 'Frame Test', 'description': 'Frame analysis test'}, 
                headers=headers)
            
            if stream_response.status_code != 201:
                print("❌ Frame Analysis: Failed to create test stream")
                return False
            
            stream_id = stream_response.json()['id']
            
            # Create test frame data
            image_data = self.create_test_image()
            frame_data = base64.b64encode(image_data).decode('utf-8')
            
            # Send frame for analysis
            analysis_data = {
                'stream_id': stream_id,
                'frame_data': frame_data
            }
            
            response = requests.post(f"{self.backend_url}/api/streams/analyze-frame/", 
                json=analysis_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                analysis = result.get('analysis', {})
                people_count = analysis.get('people_count', 0)
                confidence = analysis.get('confidence_score', 0)
                print(f"✅ Frame Analysis: Success - {people_count} people, {confidence:.1%} confidence")
                return True
            else:
                print(f"❌ Frame Analysis: Failed - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Frame Analysis: Connection failed - {e}")
            return False
    
    def run_all_tests(self):
        """Run all core functionality tests"""
        print("=" * 60)
        print("MINIMAL SYSTEM INTEGRATION TEST")
        print("=" * 60)
        
        tests = [
            ("Backend Health", self.test_backend_health),
            ("Authentication", self.test_authentication),
            ("Photo Upload", self.test_photo_upload),
            ("Live Stream Creation", self.test_live_stream_creation),
            ("Frame Analysis", self.test_frame_analysis)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n[TEST] {test_name}...")
            if test_func():
                passed += 1
            else:
                print(f"   ⚠️  {test_name} failed")
        
        print("\n" + "=" * 60)
        print(f"TEST RESULTS: {passed}/{total} tests passed")
        print(f"Success Rate: {passed/total*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Minimal system is working correctly.")
            print("\n✅ Core Features Verified:")
            print("   - Backend API responding")
            print("   - Authentication working")
            print("   - Photo upload and analysis")
            print("   - Live stream creation")
            print("   - Real-time frame analysis")
            print("\n🚀 Your minimal CrowdControl system is ready!")
        else:
            print(f"\n⚠️  {total-passed} tests failed. Please check the issues above.")
        
        return passed == total

if __name__ == "__main__":
    tester = MinimalSystemTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n" + "=" * 60)
        print("NEXT STEPS:")
        print("1. Open browser to http://localhost:5177")
        print("2. Login with admin/admin123")
        print("3. Test Photo Upload tab")
        print("4. Test Live Detection tab")
        print("5. Verify camera access and real-time detection")
        print("=" * 60)
