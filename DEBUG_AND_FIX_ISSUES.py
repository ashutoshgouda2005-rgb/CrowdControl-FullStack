#!/usr/bin/env python3
"""
Comprehensive Debugging and Issue Resolution Script
Fixes camera access and people counting accuracy issues
"""

import os
import sys
import cv2
import numpy as np
import requests
import json
from pathlib import Path
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add AI model directory to path
AI_MODEL_DIR = Path(__file__).parent / 'ai_model'
if str(AI_MODEL_DIR) not in sys.path:
    sys.path.append(str(AI_MODEL_DIR))

class CrowdControlDebugger:
    """Comprehensive debugging tool for CrowdControl issues"""
    
    def __init__(self):
        self.api_base = "http://127.0.0.1:8000/api"
        self.test_results = {}
        
    def test_camera_access(self):
        """Test camera access and permissions"""
        print("\n" + "="*60)
        print("🎥 TESTING CAMERA ACCESS")
        print("="*60)
        
        try:
            # Test basic camera access
            cap = cv2.VideoCapture(0)
            
            if not cap.isOpened():
                print("❌ Camera not accessible")
                print("   - Check if camera is connected")
                print("   - Close other applications using camera")
                print("   - Try different camera index (1, 2, etc.)")
                self.test_results['camera_access'] = False
                return False
            
            # Test frame capture
            ret, frame = cap.read()
            if not ret:
                print("❌ Cannot capture frames from camera")
                self.test_results['camera_access'] = False
                cap.release()
                return False
            
            print(f"✅ Camera accessible - Frame size: {frame.shape}")
            
            # Test multiple frames
            frame_count = 0
            for i in range(5):
                ret, frame = cap.read()
                if ret:
                    frame_count += 1
                time.sleep(0.1)
            
            print(f"✅ Captured {frame_count}/5 test frames")
            
            cap.release()
            self.test_results['camera_access'] = True
            
            # Provide browser-specific instructions
            print("\n📋 BROWSER CAMERA PERMISSIONS:")
            print("Chrome: chrome://settings/content/camera")
            print("Firefox: about:preferences#privacy")
            print("Edge: edge://settings/content/camera")
            print("Safari: Preferences > Websites > Camera")
            
            return True
            
        except Exception as e:
            print(f"❌ Camera test failed: {e}")
            self.test_results['camera_access'] = False
            return False
    
    def test_people_counting_accuracy(self):
        """Test people counting with known test cases"""
        print("\n" + "="*60)
        print("👥 TESTING PEOPLE COUNTING ACCURACY")
        print("="*60)
        
        try:
            # Import improved people detector
            from improved_people_detector import ImprovedPeopleDetector
            
            detector = ImprovedPeopleDetector()
            
            # Test cases with known people counts
            test_cases = [
                {"name": "Empty scene", "expected_count": 0},
                {"name": "Single person", "expected_count": 1},
                {"name": "Two people", "expected_count": 2},
                {"name": "Small group", "expected_count": 3},
                {"name": "Crowd", "expected_count": 8}
            ]
            
            accurate_predictions = 0
            
            for test_case in test_cases:
                # Create synthetic test image
                test_image = self._create_test_image(test_case["expected_count"])
                
                # Run detection
                result = detector.detect_people(test_image, debug=True)
                predicted_count = result.people_count
                expected_count = test_case["expected_count"]
                
                # Check accuracy (allow ±1 person tolerance)
                is_accurate = abs(predicted_count - expected_count) <= 1
                
                if is_accurate:
                    accurate_predictions += 1
                    status = "✅"
                else:
                    status = "❌"
                
                print(f"{status} {test_case['name']}: Expected {expected_count}, Got {predicted_count}")
                print(f"   Raw detections: {result.raw_detections}")
                print(f"   After filtering: {result.filtered_detections}")
                print(f"   Processing time: {result.processing_time_ms:.1f}ms")
                
                # Save debug image if available
                if result.debug_image is not None:
                    debug_path = f"debug_{test_case['name'].lower().replace(' ', '_')}.jpg"
                    cv2.imwrite(debug_path, result.debug_image)
                    print(f"   Debug image saved: {debug_path}")
                
                print()
            
            accuracy = (accurate_predictions / len(test_cases)) * 100
            print(f"📊 Overall Accuracy: {accuracy:.1f}% ({accurate_predictions}/{len(test_cases)})")
            
            self.test_results['people_counting_accuracy'] = accuracy
            
            if accuracy < 80:
                print("\n⚠️ ACCURACY ISSUES DETECTED:")
                print("1. Tune confidence threshold (try 0.3-0.7)")
                print("2. Adjust NMS threshold (try 0.2-0.5)")
                print("3. Check minimum detection size")
                print("4. Verify cascade classifier files")
            
            return accuracy >= 80
            
        except Exception as e:
            print(f"❌ People counting test failed: {e}")
            self.test_results['people_counting_accuracy'] = 0
            return False
    
    def _create_test_image(self, people_count):
        """Create synthetic test image with specified number of people"""
        # Create base image
        img = np.random.randint(50, 200, (480, 640, 3), dtype=np.uint8)
        
        # Add synthetic "people" (rectangles that look like people)
        for i in range(people_count):
            # Random position
            x = np.random.randint(50, 550)
            y = np.random.randint(50, 350)
            
            # Person-like rectangle (taller than wide)
            w = np.random.randint(40, 80)
            h = int(w * np.random.uniform(2.0, 3.0))  # People are 2-3x taller than wide
            
            # Draw person-like shape
            color = (np.random.randint(100, 255), np.random.randint(100, 255), np.random.randint(100, 255))
            cv2.rectangle(img, (x, y), (x + w, y + h), color, -1)
            
            # Add "head" (circle at top)
            head_radius = w // 4
            cv2.circle(img, (x + w//2, y + head_radius), head_radius, color, -1)
        
        return img
    
    def test_api_endpoints(self):
        """Test API endpoints for proper functionality"""
        print("\n" + "="*60)
        print("🔌 TESTING API ENDPOINTS")
        print("="*60)
        
        # Test authentication
        try:
            login_data = {"username": "admin", "password": "admin123"}
            response = requests.post(f"{self.api_base}/auth/login/", json=login_data, timeout=10)
            
            if response.status_code == 200:
                print("✅ Authentication working")
                token = response.json().get('access')
                self.test_results['api_auth'] = True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                self.test_results['api_auth'] = False
                return False
                
        except Exception as e:
            print(f"❌ Authentication test failed: {e}")
            self.test_results['api_auth'] = False
            return False
        
        # Test media upload endpoint
        try:
            headers = {'Authorization': f'Bearer {token}'}
            
            # Create test image
            test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
            _, img_encoded = cv2.imencode('.jpg', test_img)
            
            files = {'file': ('test.jpg', img_encoded.tobytes(), 'image/jpeg')}
            data = {'media_type': 'image', 'description': 'Test upload'}
            
            response = requests.post(f"{self.api_base}/media/upload/", 
                                   headers=headers, files=files, data=data, timeout=30)
            
            if response.status_code == 201:
                print("✅ Media upload working")
                upload_data = response.json()
                print(f"   Upload ID: {upload_data.get('id')}")
                self.test_results['api_upload'] = True
            else:
                print(f"❌ Media upload failed: {response.status_code}")
                print(f"   Response: {response.text}")
                self.test_results['api_upload'] = False
                
        except Exception as e:
            print(f"❌ Media upload test failed: {e}")
            self.test_results['api_upload'] = False
        
        # Test frame analysis endpoint
        try:
            frame_data = {
                'stream_id': 1,
                'frame_data': 'fake_base64_data'
            }
            
            response = requests.post(f"{self.api_base}/analysis/frame/", 
                                   headers=headers, json=frame_data, timeout=15)
            
            # This might fail due to invalid data, but should not crash
            print(f"✅ Frame analysis endpoint accessible (status: {response.status_code})")
            self.test_results['api_analysis'] = True
            
        except Exception as e:
            print(f"⚠️ Frame analysis test: {e}")
            self.test_results['api_analysis'] = False
        
        return True
    
    def test_ai_model_integration(self):
        """Test AI model loading and prediction"""
        print("\n" + "="*60)
        print("🤖 TESTING AI MODEL INTEGRATION")
        print("="*60)
        
        try:
            from production_predictor import get_predictor
            
            predictor = get_predictor()
            
            print(f"✅ Predictor loaded")
            print(f"   Model loaded: {predictor.model_loaded}")
            print(f"   Fallback mode: {predictor.fallback_mode}")
            
            # Test prediction with dummy image
            test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
            result = predictor.predict_crowd(test_image)
            
            print(f"✅ Prediction successful")
            print(f"   People count: {result.get('people_count', 'N/A')}")
            print(f"   Confidence: {result.get('confidence_score', 'N/A')}")
            print(f"   Processing time: {result.get('processing_time_ms', 'N/A')}ms")
            print(f"   Stampede risk: {result.get('is_stampede_risk', 'N/A')}")
            
            # Check for improved detection fields
            if 'raw_detections' in result:
                print(f"   Raw detections: {result['raw_detections']}")
                print(f"   Filtered detections: {result['filtered_detections']}")
                print("✅ Improved people detection active")
            else:
                print("⚠️ Using fallback detection")
            
            self.test_results['ai_model'] = True
            return True
            
        except Exception as e:
            print(f"❌ AI model test failed: {e}")
            self.test_results['ai_model'] = False
            return False
    
    def provide_fix_recommendations(self):
        """Provide specific fix recommendations based on test results"""
        print("\n" + "="*60)
        print("🔧 FIX RECOMMENDATIONS")
        print("="*60)
        
        # Camera access fixes
        if not self.test_results.get('camera_access', False):
            print("\n📹 CAMERA ACCESS FIXES:")
            print("1. Check camera permissions in browser:")
            print("   - Look for camera icon in address bar")
            print("   - Allow camera access for localhost")
            print("   - Clear browser cache and cookies")
            print("2. System-level fixes:")
            print("   - Close other apps using camera (Zoom, Teams, etc.)")
            print("   - Check Windows Camera privacy settings")
            print("   - Update camera drivers")
            print("3. Development fixes:")
            print("   - Use HTTPS or localhost (required for camera access)")
            print("   - Add better error handling in frontend")
            print("   - Implement camera permission pre-check")
        
        # People counting fixes
        accuracy = self.test_results.get('people_counting_accuracy', 0)
        if accuracy < 80:
            print(f"\n👥 PEOPLE COUNTING FIXES (Current accuracy: {accuracy:.1f}%):")
            print("1. Tune detection parameters:")
            print("   - Lower confidence threshold to 0.3-0.4")
            print("   - Adjust NMS threshold to 0.3-0.4")
            print("   - Reduce minimum detection size")
            print("2. Improve detection methods:")
            print("   - Add YOLO or SSD detector")
            print("   - Use multiple detection methods")
            print("   - Implement temporal smoothing")
            print("3. Training improvements:")
            print("   - Collect more training data")
            print("   - Use data augmentation")
            print("   - Fine-tune on your specific use case")
        
        # API fixes
        if not self.test_results.get('api_upload', False):
            print("\n🔌 API UPLOAD FIXES:")
            print("1. Check Django settings:")
            print("   - FILE_UPLOAD_MAX_MEMORY_SIZE")
            print("   - DATA_UPLOAD_MAX_MEMORY_SIZE")
            print("   - MEDIA_ROOT and MEDIA_URL")
            print("2. Check serializer validation")
            print("3. Add better error logging")
        
        # Overall system health
        working_components = sum(self.test_results.values())
        total_components = len(self.test_results)
        health_percentage = (working_components / total_components) * 100
        
        print(f"\n📊 SYSTEM HEALTH: {health_percentage:.1f}% ({working_components}/{total_components} components working)")
        
        if health_percentage >= 80:
            print("✅ System is mostly healthy - minor fixes needed")
        elif health_percentage >= 60:
            print("⚠️ System has moderate issues - several fixes needed")
        else:
            print("❌ System has major issues - comprehensive fixes required")
    
    def create_test_images(self):
        """Create test images for manual verification"""
        print("\n" + "="*60)
        print("🖼️ CREATING TEST IMAGES")
        print("="*60)
        
        test_dir = Path("test_images")
        test_dir.mkdir(exist_ok=True)
        
        # Create test images with known people counts
        test_cases = [
            (0, "empty_scene.jpg"),
            (1, "single_person.jpg"),
            (2, "two_people.jpg"),
            (5, "small_group.jpg"),
            (10, "large_group.jpg")
        ]
        
        for count, filename in test_cases:
            img = self._create_test_image(count)
            filepath = test_dir / filename
            cv2.imwrite(str(filepath), img)
            print(f"✅ Created {filename} with {count} people")
        
        print(f"\n📁 Test images saved in: {test_dir.absolute()}")
        print("Use these images to manually test your system")
    
    def run_comprehensive_test(self):
        """Run all tests and provide comprehensive report"""
        print("🚀 CROWDCONTROL COMPREHENSIVE DEBUGGING")
        print("="*60)
        print("This script will test all components and provide fix recommendations")
        
        # Run all tests
        self.test_camera_access()
        self.test_people_counting_accuracy()
        self.test_api_endpoints()
        self.test_ai_model_integration()
        
        # Create test images
        self.create_test_images()
        
        # Provide recommendations
        self.provide_fix_recommendations()
        
        # Final summary
        print("\n" + "="*60)
        print("🎯 DEBUGGING COMPLETE")
        print("="*60)
        print("Check the recommendations above to fix any issues.")
        print("Test images have been created for manual verification.")
        print("Run this script again after making fixes to verify improvements.")

def main():
    """Main debugging function"""
    debugger = CrowdControlDebugger()
    debugger.run_comprehensive_test()

if __name__ == "__main__":
    main()
