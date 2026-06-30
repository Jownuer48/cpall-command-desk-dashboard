@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo ================================================
echo CPALL Command Center Dashboard - Stop Helper
echo ================================================
echo.
echo Checking for processes listening on ports 5000 and 5173...
echo.

set "PIDS="

for %%P in (5000 5173) do (
    for /f "tokens=5" %%A in ('netstat -ano -p tcp ^| findstr /R /C:":%%P .*LISTENING"') do (
        if not "%%A"=="0" (
            echo Port %%P is used by PID %%A
            if not defined PID_%%A (
                set "PID_%%A=1"
                set "PIDS=!PIDS! %%A"
            )
        )
    )
)

if "%PIDS%"=="" (
    echo No dashboard process is listening on port 5000 or 5173.
    echo.
    pause
    exit /b 0
)

echo.
echo Processes that will be stopped:
for %%A in (%PIDS%) do (
    tasklist /FI "PID eq %%A" /FO TABLE /NH
)

echo.
echo This only targets processes that are currently listening on port 5000 or 5173.
choice /C YN /M "Stop these processes"
if errorlevel 2 (
    echo.
    echo Canceled. No processes were stopped.
    pause
    exit /b 0
)

echo.
for %%A in (%PIDS%) do (
    echo Stopping PID %%A...
    taskkill /PID %%A /F
)

echo.
echo Done.
pause

endlocal
