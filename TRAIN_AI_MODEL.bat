@echo off
title CrowdControl - AI Model Training
color 0E

echo.
echo ========================================
echo    CROWDCONTROL AI MODEL TRAINING
echo ========================================
echo.

echo 🤖 Starting AI model training pipeline...
echo.

REM Check if AI environment is set up
if not exist "ai_model\config.py" (
    echo ❌ AI environment not found. Running setup first...
    call ai_model\setup_ai_environment.bat
    if %errorlevel% neq 0 (
        echo ❌ AI setup failed
        pause
        exit /b 1
    )
)

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo ❌ Virtual environment not found
    pause
    exit /b 1
)

echo 🎯 Training Options:
echo    [1] Quick Test Training (5 epochs, synthetic data)
echo    [2] Full Training (100 epochs, real data)
echo    [3] Hyperparameter Optimization
echo    [4] Resume from checkpoint
echo    [5] Evaluate existing model
echo.

set /p choice="Select training option (1-5): "

cd ai_model

if "%choice%"=="1" (
    echo.
    echo 🚀 Starting Quick Test Training...
    echo    - Creates synthetic dataset
    echo    - Trains for 5 epochs
    echo    - Takes ~10 minutes
    echo.
    python train_model.py --create-sample --epochs 5 --batch-size 16
    
) else if "%choice%"=="2" (
    echo.
    echo 🎯 Starting Full Training...
    echo    - Requires real dataset
    echo    - Trains for 100 epochs
    echo    - Takes 2-4 hours
    echo.
    set /p data_path="Enter path to your dataset (or press Enter for sample): "
    if "%data_path%"=="" (
        python train_model.py --create-sample --epochs 100
    ) else (
        python train_model.py --data-path "%data_path%" --epochs 100
    )
    
) else if "%choice%"=="3" (
    echo.
    echo 🔧 Starting Hyperparameter Optimization...
    echo    - Automatically finds best parameters
    echo    - Runs multiple training trials
    echo    - Takes 4-8 hours
    echo.
    set /p data_path="Enter path to your dataset (or press Enter for sample): "
    if "%data_path%"=="" (
        python train_model.py --create-sample --optimize
    ) else (
        python train_model.py --data-path "%data_path%" --optimize
    )
    
) else if "%choice%"=="4" (
    echo.
    echo 🔄 Resuming from checkpoint...
    echo.
    set /p checkpoint="Enter checkpoint path: "
    set /p data_path="Enter dataset path: "
    python train_model.py --data-path "%data_path%" --resume "%checkpoint%"
    
) else if "%choice%"=="5" (
    echo.
    echo 📊 Evaluating existing model...
    echo.
    set /p model_path="Enter model path: "
    set /p test_data="Enter test data path: "
    python train_model.py --evaluate "%model_path%" --data-path "%test_data%"
    
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo        🎉 TRAINING COMPLETED! 🎉
    echo ========================================
    echo.
    echo ✅ Model training finished successfully!
    echo.
    echo 📁 Check these locations:
    echo    • Trained models: ai_model\models\
    echo    • Training logs: ai_model\logs\
    echo    • Checkpoints: ai_model\checkpoints\
    echo    • Plots: ai_model\logs\plots\
    echo.
    echo 🚀 Next steps:
    echo    1. Test your model: START_UNIVERSAL_ACCESS.bat
    echo    2. Check training plots in logs\plots\
    echo    3. Monitor with TensorBoard: tensorboard --logdir ai_model\logs\tensorboard
    echo.
    echo 📊 Model Performance:
    echo    • Check evaluation_results.json for detailed metrics
    echo    • View confusion matrix and classification report
    echo    • Monitor training history plots
    echo.
) else (
    echo.
    echo ========================================
    echo         ❌ TRAINING FAILED ❌
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo Common issues:
    echo    • Insufficient GPU memory (reduce batch size)
    echo    • Missing dataset (use --create-sample)
    echo    • Dependency issues (run setup_ai_environment.bat)
    echo.
    echo 📞 Support: ashutoshgouda2005@gmail.com
    echo.
)

cd ..

echo Press any key to exit...
pause >nul
