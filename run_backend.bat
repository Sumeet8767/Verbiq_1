@echo off
setlocal
echo ==========================================
echo Starting Verbiq Consolidated Backend...
echo ==========================================

:: Get the directory where the batch file is located (root)
set "PROJECT_ROOT=%~dp0"

:: Check for venv
if not exist "%PROJECT_ROOT%backend\venv" (
    echo [ERROR] Virtual environment not found in %PROJECT_ROOT%backend\venv
    echo Please ensure you have created the venv.
    pause
    exit /b
)

:: Run from the backend folder to ensure relative imports (like 'from model import...') work
cd /d "%PROJECT_ROOT%backend"

echo [INFO] Starting server on port 8080...
"venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8080

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start the server.
    pause
)
pause
