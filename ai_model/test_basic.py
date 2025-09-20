"""
Basic test script to verify AI model components are working
"""

import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

def test_imports():
    """Test if we can import the basic modules"""
    try:
        import numpy as np
        print("[OK] NumPy imported successfully")
        
        import cv2
        print("[OK] OpenCV imported successfully")
        
        from config import CONFIG
        print("[OK] Config imported successfully")
        
        print(f"[OK] Model config loaded: {CONFIG['model']['backbone']}")
        
        return True
    except ImportError as e:
        print(f"[ERROR] Import error: {e}")
        return False

def test_tensorflow():
    """Test TensorFlow availability"""
    try:
        import tensorflow as tf
        print(f"[OK] TensorFlow {tf.__version__} imported successfully")
        
        # Test GPU availability
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            print(f"[OK] Found {len(gpus)} GPU(s)")
        else:
            print("[INFO] No GPUs found, using CPU")
        
        return True
    except ImportError as e:
        print(f"[ERROR] TensorFlow import error: {e}")
        return False

def test_production_predictor():
    """Test the production predictor"""
    try:
        from production_predictor import ProductionStampedePredictor
        
        predictor = ProductionStampedePredictor()
        print("[OK] Production predictor created successfully")
        
        # Test with demo mode (should work without trained models)
        import numpy as np
        test_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        result = predictor.predict_crowd(test_image)
        print(f"[OK] Prediction test successful: {result['risk_level']}")
        
        return True
    except Exception as e:
        print(f"[ERROR] Production predictor error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("AI MODEL COMPONENT TESTS")
    print("=" * 50)
    
    tests = [
        ("Basic Imports", test_imports),
        ("TensorFlow", test_tensorflow),
        ("Production Predictor", test_production_predictor),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n[{test_name}]")
        try:
            if test_func():
                passed += 1
                print(f"[PASS] {test_name} PASSED")
            else:
                print(f"[FAIL] {test_name} FAILED")
        except Exception as e:
            print(f"[FAIL] {test_name} FAILED: {e}")
    
    print("\n" + "=" * 50)
    print(f"RESULTS: {passed}/{total} tests passed")
    print("=" * 50)
    
    if passed == total:
        print("SUCCESS: All tests passed! AI model is ready.")
        return True
    else:
        print("WARNING: Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    main()
