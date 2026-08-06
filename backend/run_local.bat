@echo off
REM One-command local development server for the COURSER backend (SQLite).
REM
REM Usage:  backend\run_local.bat
cd /d "%~dp0"

echo === Installing backend dependencies ===
python -m pip install -r requirements.txt --quiet
if %ERRORLEVEL% neq 0 (
    echo FAILED to install dependencies
    exit /b 1
)

echo === Initializing local SQLite database ===
python init_db.py --reset
if %ERRORLEVEL% neq 0 (
    echo FAILED to initialize database
    exit /b 1
)

echo === Seeding starter courses ===
python seed_courses.py
if %ERRORLEVEL% neq 0 (
    echo FAILED to seed courses
    exit /b 1
)

echo === Starting backend server (Ctrl+C to stop) ===
echo    API:    http://127.0.0.1:8000
echo    Health: http://127.0.0.1:8000/api/health
echo    Docs:   http://127.0.0.1:8000/api/docs
echo.
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
