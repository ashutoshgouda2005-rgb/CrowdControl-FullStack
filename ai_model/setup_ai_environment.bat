@echo off
title CrowdControl - AI Model Setup
color 0C

echo.
echo ========================================
echo    CROWDCONTROL AI MODEL SETUP
echo ========================================
echo.

echo 🤖 Setting up advanced AI environment...
echo.

REM Check if we're in the right directory
if not exist "ai_model" (
    echo ❌ Please run this script from the CrowdControl main directory
    pause
    exit /b 1
)

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    echo ✅ Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo ❌ Virtual environment not found. Please run setup first.
    pause
    exit /b 1
)

echo [1/6] Installing AI model dependencies...
cd ai_model
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install AI dependencies
    pause
    exit /b 1
)
echo ✅ AI dependencies installed

echo [2/6] Creating model directories...
mkdir data\images 2>nul
mkdir data\annotations 2>nul
mkdir data\videos 2>nul
mkdir data\synthetic 2>nul
mkdir models 2>nul
mkdir logs 2>nul
mkdir logs\tensorboard 2>nul
mkdir logs\plots 2>nul
mkdir checkpoints 2>nul
echo ✅ Model directories created

echo [3/6] Testing TensorFlow installation...
python -c "import tensorflow as tf; print(f'TensorFlow {tf.__version__} - GPU Available: {len(tf.config.list_physical_devices(\"GPU\")) > 0}')"
if %errorlevel% neq 0 (
    echo ❌ TensorFlow test failed
    pause
    exit /b 1
)
echo ✅ TensorFlow working

echo [4/6] Testing OpenCV installation...
python -c "import cv2; print(f'OpenCV {cv2.__version__} installed successfully')"
if %errorlevel% neq 0 (
    echo ❌ OpenCV test failed
    pause
    exit /b 1
)
echo ✅ OpenCV working

echo [5/6] Creating sample training dataset...
python train_model.py --create-sample
if %errorlevel% neq 0 (
    echo ❌ Sample dataset creation failed
    pause
    exit /b 1
)
echo ✅ Sample dataset created

echo [6/6] Testing AI model integration...
python -c "from production_predictor import get_predictor; p = get_predictor(); print('✅ Production predictor loaded successfully')"
if %errorlevel% neq 0 (
    echo ⚠️  Production predictor test failed (will use fallback mode)
) else (
    echo ✅ Production predictor working
)

cd ..

echo.
echo ========================================
echo        🎉 AI SETUP COMPLETE! 🎉
echo ========================================
echo.
echo Your advanced AI system is ready!
echo.
echo 🚀 Next Steps:
echo    1. Train your model: cd ai_model && python train_model.py --data-path data/images/sample
echo    2. Or use quick training: python train_model.py --create-sample --epochs 10
echo    3. Test the system: START_UNIVERSAL_ACCESS.bat
echo.
echo 🔧 AI Features Available:
echo    ✅ Modern TensorFlow 2.x architecture
echo    ✅ EfficientNet backbone with attention mechanisms
echo    ✅ Multi-task learning (classification + density + counting)
echo    ✅ Advanced data augmentation
echo    ✅ Hyperparameter optimization
echo    ✅ Real-time inference engine
echo    ✅ Ensemble model support
echo    ✅ Production-ready deployment
echo.
echo 📊 Training Options:
echo    • Quick test: python train_model.py --create-sample --epochs 5
echo    • Full training: python train_model.py --data-path your/data --epochs 100
echo    • Hyperparameter tuning: python train_model.py --data-path your/data --optimize
echo.
echo 📞 Support: ashutoshgouda2005@gmail.com
echo.

pause
