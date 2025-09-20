#!/usr/bin/env python3
"""
Frontend Integration Testing Script
Tests the connection between the new frontend interface and Django backend
"""

import requests
import json
import base64
import time
import os
from pathlib import Path

class FrontendIntegrationTester:
    """Test frontend-backend integration for CrowdControl"""
    
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.frontend_url = "http://localhost:5177"  # Updated to current running port
        self.access_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", details=None):
        """Log test results"""
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': time.time()
        })
    
    def test_backend_health(self):
        """Test if backend is running and healthy"""
        try:
            response = requests.get(f"{self.base_url}/api/health/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Backend Health", True, f"Status: {data.get('status')}")
                return True
            else:
                self.log_test("Backend Health", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Health", False, f"Connection failed: {str(e)}")
            return False
    
    def test_frontend_running(self):
        """Test if frontend dev server is running"""
        try:
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200:
                self.log_test("Frontend Server", True, "Dev server is running")
                return True
            else:
                self.log_test("Frontend Server", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Frontend Server", False, f"Connection failed: {str(e)}")
            return False
    
    def test_user_authentication(self):
        """Test user login and JWT token generation"""
        try:
            # Test login
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/login/",
                json=login_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access')
                if self.access_token:
                    self.log_test("User Authentication", True, "JWT token obtained")
                    return True
                else:
                    self.log_test("User Authentication", False, "No access token in response")
                    return False
            else:
                self.log_test("User Authentication", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Authentication", False, f"Login failed: {str(e)}")
            return False
    
    def test_file_upload_api(self):
        """Test file upload API endpoint"""
        if not self.access_token:
            self.log_test("File Upload API", False, "No authentication token")
            return False
        
        try:
            # Create a test image file
            test_image_path = Path(__file__).parent / "test_image.jpg"
            
            # Create a simple test image if it doesn't exist
            if not test_image_path.exists():
                # Create a minimal JPEG file (1x1 pixel)
                jpeg_data = base64.b64decode(
                    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB'
                    'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEB'
                    'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIA'
                    'AhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QA'
                    'FQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCd'
                    'AB8A'
                )
                with open(test_image_path, 'wb') as f:
                    f.write(jpeg_data)
            
            # Test file upload
            with open(test_image_path, 'rb') as f:
                files = {'file': ('test_image.jpg', f, 'image/jpeg')}
                data = {'media_type': 'image', 'description': 'Integration test image'}
                headers = {'Authorization': f'Bearer {self.access_token}'}
                
                response = requests.post(
                    f"{self.base_url}/api/media/upload/",
                    files=files,
                    data=data,
                    headers=headers
                )
            
            if response.status_code == 201:
                data = response.json()
                upload_id = data.get('id')
                self.log_test("File Upload API", True, f"Upload successful, ID: {upload_id}")
                return upload_id
            else:
                self.log_test("File Upload API", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("File Upload API", False, f"Upload failed: {str(e)}")
            return None
    
    def test_analysis_polling(self, upload_id):
        """Test analysis result polling"""
        if not upload_id or not self.access_token:
            self.log_test("Analysis Polling", False, "No upload ID or token")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.access_token}'}
            max_attempts = 10
            
            for attempt in range(max_attempts):
                response = requests.get(
                    f"{self.base_url}/api/media/{upload_id}/",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    status = data.get('analysis_status')
                    
                    if status == 'completed':
                        analysis_result = data.get('analysis_result')
                        if analysis_result:
                            people_count = analysis_result.get('people_count', 0)
                            confidence = analysis_result.get('confidence_score', 0)
                            self.log_test("Analysis Polling", True, 
                                        f"Analysis completed: {people_count} people, {confidence:.1%} confidence")
                            return True
                        else:
                            self.log_test("Analysis Polling", False, "No analysis result in response")
                            return False
                    elif status == 'failed':
                        self.log_test("Analysis Polling", False, "Analysis failed on server")
                        return False
                    elif status in ['pending', 'processing']:
                        print(f"   Analysis status: {status}, waiting...")
                        time.sleep(2)
                        continue
                else:
                    self.log_test("Analysis Polling", False, f"HTTP {response.status_code}")
                    return False
            
            self.log_test("Analysis Polling", False, "Timeout waiting for analysis")
            return False
            
        except Exception as e:
            self.log_test("Analysis Polling", False, f"Polling failed: {str(e)}")
            return False
    
    def test_stream_creation(self):
        """Test live stream creation API"""
        if not self.access_token:
            self.log_test("Stream Creation", False, "No authentication token")
            return None
        
        try:
            stream_data = {
                "stream_name": "Test Stream",
                "name": "Test Stream", 
                "description": "Integration test stream",
                "stream_type": "webcam"
            }
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.base_url}/api/streams/create/",
                json=stream_data,
                headers=headers
            )
            
            if response.status_code == 201:
                data = response.json()
                stream_id = data.get('id')
                self.log_test("Stream Creation", True, f"Stream created, ID: {stream_id}")
                return stream_id
            else:
                self.log_test("Stream Creation", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Stream Creation", False, f"Stream creation failed: {str(e)}")
            return None
    
    def test_frame_analysis(self, stream_id):
        """Test frame analysis API"""
        if not stream_id or not self.access_token:
            self.log_test("Frame Analysis", False, "No stream ID or token")
            return False
        
        try:
            # Create a test frame (base64 encoded image)
            test_frame = base64.b64encode(b'fake_image_data').decode('utf-8')
            
            frame_data = {
                "stream_id": stream_id,
                "frame_data": test_frame
            }
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.base_url}/api/analysis/frame/",
                json=frame_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                analysis = data.get('analysis', {})
                people_count = analysis.get('people_count', 0)
                processing_time = data.get('processing_time', 0)
                self.log_test("Frame Analysis", True, 
                            f"Frame analyzed: {people_count} people, {processing_time}ms")
                return True
            else:
                self.log_test("Frame Analysis", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Frame Analysis", False, f"Frame analysis failed: {str(e)}")
            return False
    
    def test_cors_headers(self):
        """Test CORS headers for frontend integration"""
        try:
            # Test preflight request
            headers = {
                'Origin': self.frontend_url,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
            
            response = requests.options(
                f"{self.base_url}/api/media/upload/",
                headers=headers
            )
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if cors_headers['Access-Control-Allow-Origin']:
                self.log_test("CORS Headers", True, "CORS properly configured")
                return True
            else:
                self.log_test("CORS Headers", False, "CORS headers missing")
                return False
                
        except Exception as e:
            self.log_test("CORS Headers", False, f"CORS test failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("FRONTEND-BACKEND INTEGRATION TESTS")
        print("=" * 50)
        
        # Basic connectivity tests
        backend_ok = self.test_backend_health()
        frontend_ok = self.test_frontend_running()
        
        if not backend_ok:
            print("\n[ERROR] Backend not running. Please start with: python manage.py runserver")
            return False
        
        if not frontend_ok:
            print("\n[ERROR] Frontend not running. Please start with: npm run dev")
            return False
        
        # Authentication test
        auth_ok = self.test_user_authentication()
        if not auth_ok:
            print("\n[ERROR] Authentication failed. Please check admin user exists.")
            return False
        
        # API integration tests
        print("\n[TEST] Testing File Upload Integration...")
        upload_id = self.test_file_upload_api()
        
        if upload_id:
            print("\n[TEST] Testing Analysis Integration...")
            self.test_analysis_polling(upload_id)
        
        print("\n[TEST] Testing Live Stream Integration...")
        stream_id = self.test_stream_creation()
        
        if stream_id:
            self.test_frame_analysis(stream_id)
        
        print("\n[TEST] Testing CORS Configuration...")
        self.test_cors_headers()
        
        # Summary
        print("\n" + "=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Tests passed: {passed}/{total}")
        print(f"Success rate: {passed/total*100:.1f}%")
        
        if passed == total:
            print("\n[SUCCESS] ALL TESTS PASSED! Frontend-backend integration is working correctly.")
            print("\n[READY] Your CrowdControl application is ready to use:")
            print(f"   Frontend: {self.frontend_url}")
            print(f"   Backend:  {self.base_url}")
        else:
            print(f"\n[WARNING] {total-passed} tests failed. Please check the issues above.")
            
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['message']}")
        
        return passed == total

def main():
    """Main test function"""
    tester = FrontendIntegrationTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n[NEXT] Next steps:")
        print("1. Open your browser to http://localhost:5173")
        print("2. Login with admin/admin123")
        print("3. Test photo upload and live detection features")
        print("4. Check browser DevTools for any console errors")
    else:
        print("\n[HELP] Troubleshooting:")
        print("1. Make sure both backend and frontend servers are running")
        print("2. Check that admin user exists in Django admin")
        print("3. Verify CORS settings in Django settings")
        print("4. Check browser DevTools Network tab for API errors")

if __name__ == "__main__":
    main()
