#!/usr/bin/env python3
"""
Quick Test Script to Verify Camera and Detection Fixes
Run this to confirm both issues are resolved
"""

import cv2
import numpy as np
import sys
from pathlib import Path

# Add AI model directory to path
AI_MODEL_DIR = Path(__file__).parent / 'ai_model'
if str(AI_MODEL_DIR) not in sys.path:
    sys.path.append(str(AI_MODEL_DIR))

def test_camera_access():
    """Quick camera access test"""
    print("🎥 Testing Camera Access...")
    
    try:
        cap = cv2.VideoCapture(0)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                print("✅ Camera accessible and working")
                print(f"   Frame size: {frame.shape}")
                cap.release()
                return True
            else:
                print("❌ Camera opened but cannot capture frames")
        else:
            print("❌ Cannot open camera")
        cap.release()
        return False
    except Exception as e:
        print(f"❌ Camera test failed: {e}")
        return False

def test_people_counting():
    """Quick people counting accuracy test"""
    print("\n👥 Testing People Counting Accuracy...")
    
    try:
        from improved_people_detector import ImprovedPeopleDetector
        
        detector = ImprovedPeopleDetector()
        
        # Test with single person image (synthetic)
        single_person_img = create_single_person_image()
        result = detector.detect_people(single_person_img, debug=False)
        
        print(f"Single person test:")
        print(f"   Expected: 1 person")
        print(f"   Detected: {result.people_count} people")
        print(f"   Raw detections: {result.raw_detections}")
        print(f"   After NMS: {result.filtered_detections}")
        
        # Test accuracy
        if result.people_count == 1:
            print("✅ Single person detection: ACCURATE")
            return True
        elif result.people_count == 0:
            print("⚠️ Single person detection: No detection (may need tuning)")
            return False
        else:
            print(f"❌ Single person detection: INACCURATE (got {result.people_count})")
            return False
            
    except Exception as e:
        print(f"❌ People counting test failed: {e}")
        return False

def create_single_person_image():
    """Create a synthetic image with exactly one person"""
    # Create base image
    img = np.random.randint(100, 150, (480, 640, 3), dtype=np.uint8)
    
    # Add one person-like shape in center
    x, y = 300, 200  # Center position
    w, h = 60, 150   # Person dimensions (taller than wide)
    
    # Draw person body
    color = (180, 160, 140)  # Skin-like color
    cv2.rectangle(img, (x, y), (x + w, y + h), color, -1)
    
    # Add head
    head_radius = w // 3
    cv2.circle(img, (x + w//2, y + head_radius), head_radius, color, -1)
    
    # Add some contrast
    cv2.rectangle(img, (x + 10, y + 40), (x + w - 10, y + h - 20), (100, 100, 200), -1)
    
    return img

def test_api_prediction():
    """Test the production predictor with improved detection"""
    print("\n🤖 Testing AI Model Integration...")
    
    try:
        from production_predictor import get_predictor
        
        predictor = get_predictor()
        
        # Test with single person image
        test_img = create_single_person_image()
        result = predictor.predict_crowd(test_img)
        
        print(f"AI Prediction Results:")
        print(f"   People count: {result.get('people_count', 'N/A')}")
        print(f"   Confidence: {result.get('confidence_score', 'N/A')}")
        print(f"   Stampede risk: {result.get('is_stampede_risk', 'N/A')}")
        
        # Check for improved detection fields
        if 'raw_detections' in result:
            print(f"   Raw detections: {result['raw_detections']}")
            print(f"   Filtered detections: {result['filtered_detections']}")
            print("✅ Improved people detection is active")
        else:
            print("⚠️ Using fallback detection")
        
        # Check accuracy
        people_count = result.get('people_count', 0)
        if people_count == 1:
            print("✅ AI prediction: ACCURATE")
            return True
        else:
            print(f"❌ AI prediction: INACCURATE (expected 1, got {people_count})")
            return False
            
    except Exception as e:
        print(f"❌ AI model test failed: {e}")
        return False

def main():
    """Run quick verification tests"""
    print("🚀 QUICK VERIFICATION OF CROWDCONTROL FIXES")
    print("=" * 50)
    
    results = {}
    
    # Test camera access
    results['camera'] = test_camera_access()
    
    # Test people counting
    results['detection'] = test_people_counting()
    
    # Test AI integration
    results['ai_model'] = test_api_prediction()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 QUICK TEST RESULTS:")
    print("=" * 50)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.upper()}: {status}")
    
    total_passed = sum(results.values())
    total_tests = len(results)
    
    print(f"\nOverall: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("🎉 ALL FIXES WORKING CORRECTLY!")
        print("Your CrowdControl system is ready for production use.")
    elif total_passed >= total_tests * 0.7:
        print("⚠️ Most fixes working - minor issues may need attention")
        print("Run DEBUG_AND_FIX_ISSUES.py for detailed analysis")
    else:
        print("❌ Major issues detected")
        print("Run DEBUG_AND_FIX_ISSUES.py for comprehensive debugging")
    
    print("\n📋 Next Steps:")
    print("1. If camera fails: Check browser permissions and camera availability")
    print("2. If detection fails: Run full debugging script for detailed analysis")
    print("3. If AI model fails: Check model files and dependencies")
    print("4. Test with real images through the web interface")

if __name__ == "__main__":
    main()
