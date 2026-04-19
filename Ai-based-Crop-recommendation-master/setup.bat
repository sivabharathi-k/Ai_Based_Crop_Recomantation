@echo off
setlocal EnableDelayedExpansion
title CropAI Setup

echo ============================================
echo        CropAI - Automated Setup
echo ============================================
echo.

:: ── 1. Check Node.js ──────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/ and re-run.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js %%v

:: ── 2. Check Python ───────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install from https://python.org/ and re-run.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('python --version') do echo [OK] %%v

:: ── 3. Start MongoDB ──────────────────────────
echo.
echo [*] Starting MongoDB service...
net start MongoDB >nul 2>&1
if errorlevel 1 (
    echo [WARN] Could not start MongoDB service (may already be running or not installed as a service).
    echo        If MongoDB is not running, start it manually before launching the app.
) else (
    echo [OK] MongoDB service started.
)

:: ── 4. Install Node dependencies ──────────────
echo.
echo [*] Installing root Node dependencies...
call npm install --silent
if errorlevel 1 ( echo [ERROR] Root npm install failed. & pause & exit /b 1 )
echo [OK] Root dependencies installed.

echo [*] Installing backend dependencies...
cd owner
call npm install --silent
if errorlevel 1 ( echo [ERROR] Backend npm install failed. & pause & exit /b 1 )
:: python-shell is no longer used (replaced by native child_process.spawn)
:: Remove it if present to avoid confusion
call npm uninstall python-shell --silent >nul 2>&1
cd ..
echo [OK] Backend dependencies installed.

echo [*] Installing frontend dependencies...
cd client
call npm install --silent
if errorlevel 1 ( echo [ERROR] Frontend npm install failed. & pause & exit /b 1 )
cd ..
echo [OK] Frontend dependencies installed.

:: ── 5. Python virtual environment ─────────────
echo.
echo [*] Setting up Python virtual environment...
if not exist "venv" (
    python -m venv venv
    if errorlevel 1 ( echo [ERROR] Failed to create venv. & pause & exit /b 1 )
    echo [OK] Virtual environment created.
) else (
    echo [OK] Virtual environment already exists, skipping creation.
)

echo [*] Installing Python dependencies...
call venv\Scripts\pip install --quiet -r owner\requirements.txt
if errorlevel 1 ( echo [ERROR] Python pip install failed. & pause & exit /b 1 )
echo [OK] Python dependencies installed.

:: ── 6. Patch .env with venv Python path ───────
echo.
echo [*] Updating PYTHON_PATH in owner\.env...
set VENV_PYTHON=%CD%\venv\Scripts\python.exe
:: Remove existing PYTHON_PATH line if present, then append
findstr /v "^PYTHON_PATH=" owner\.env > owner\.env.tmp
echo PYTHON_PATH=%VENV_PYTHON%>> owner\.env.tmp
move /y owner\.env.tmp owner\.env >nul
echo [OK] PYTHON_PATH set to %VENV_PYTHON%

:: ── Done ──────────────────────────────────────
echo.
echo ============================================
echo   Setup complete!
echo.
echo   To start the app run:
echo     npm run dev          (both together)
echo   OR separately:
echo     cd owner ^&^& npm run dev   (backend)
echo     cd client ^&^& npm start    (frontend)
echo ============================================
echo.
pause
