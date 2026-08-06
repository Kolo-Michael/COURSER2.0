@echo off
REM Ping the Render endpoint every 15 seconds (4x per run).
REM Schedule this via Task Scheduler with a 1-minute trigger, or
REM just run it directly for a continuous 15-second loop.
REM
REM Set RENDER_HEALTH_URL to override the default endpoint.
REM
REM Usage:
REM   ping_render_loop.bat          (continuous loop, 15s interval)
REM   ping_render_loop.bat 5        (continuous loop, 5s interval)

setlocal enabledelayedexpansion

if "%RENDER_HEALTH_URL%"=="" (
    set "URL=https://courser-api-18uo.onrender.com/api/health"
) else (
    set "URL=%RENDER_HEALTH_URL%"
)

set "INTERVAL=15"
if not "%~1"=="" set "INTERVAL=%~1"

echo [%TIME%] Starting continuous ping loop for %URL% (interval=%INTERVAL%s)

:loop
    echo [%TIME%] Pinging %URL%
    curl.exe --max-time 10 --silent "%URL%" 2>&1 1>nul
    if !ERRORLEVEL! equ 0 (
        echo  OK
    ) else (
        echo  FAILED
    )
    timeout /t %INTERVAL% /nobreak >nul 2>&1
goto loop
