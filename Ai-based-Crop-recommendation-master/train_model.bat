@echo off
setlocal EnableDelayedExpansion
title CropAI - Train Plant Disease Model

echo ============================================
echo   CropAI - Automated Model Training
echo ============================================
echo.
echo  This will:
echo    1. Download PlantVillage dataset (~1.5 GB)
echo    2. Extract it automatically
echo    3. Train MobileNetV2 CNN
echo    4. Save model to ml_train\
echo.
echo  Estimated time: 30-90 minutes
echo.
pause

:: Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install from https://python.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('python --version') do echo [OK] %%v

:: Check TensorFlow
python -c "import tensorflow" >nul 2>&1
if errorlevel 1 (
    echo [*] Installing TensorFlow...
    python -m pip install tensorflow==2.15.0
    if errorlevel 1 (
        echo [ERROR] TensorFlow install failed.
        pause & exit /b 1
    )
)
echo [OK] TensorFlow ready.

:: Ask training mode
echo.
set /p FAST="Use fast mode? (5 epochs, good for testing) [y/N]: "
if /i "!FAST!"=="y" (
    set EXTRA_ARGS=--epochs_head 5 --epochs_finetune 5 --batch_size 16
    echo [*] Fast mode: 5+5 epochs
) else (
    set EXTRA_ARGS=--epochs_head 10 --epochs_finetune 10 --batch_size 32
    echo [*] Full mode: 10+10 epochs
)

:: Skip download if dataset already exists
set SKIP_DL=
if exist "ml_train\PlantVillage-Dataset-master\raw\color" (
    echo [*] Dataset already downloaded. Skipping.
    set SKIP_DL=--skip_download
)
if exist "ml_train\dataset" (
    echo [*] Custom dataset found. Skipping download.
    set SKIP_DL=--skip_download
)

:: Run training
echo.
echo [*] Starting training...
echo.
python ml_train\auto_train.py !EXTRA_ARGS! !SKIP_DL!

if errorlevel 1 (
    echo.
    echo [ERROR] Training failed. See output above.
    pause & exit /b 1
)

echo.
echo ============================================
echo   Training complete!
echo.
echo   Files saved:
echo     ml_train\plant_disease_model.keras
echo     ml_train\plant_disease_model.tflite
echo     ml_train\plant_disease_classes.json
echo     ml_train\training_report.json
echo.
echo   Start the app:
echo     Terminal 1: cd owner  && npm run dev
echo     Terminal 2: cd client && npm start
echo ============================================
echo.
pause
