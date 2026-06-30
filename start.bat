@echo off
setlocal
cd /d "%~dp0"
set "PUBLISH_DIR=%~dp0backend\publish"

echo ================================================
echo CPALL Command Center Dashboard - Production/LAN
echo ================================================
echo.
echo Building frontend, copying files, and publishing backend...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\publish-lan.ps1"
if errorlevel 1 (
    echo.
    echo Publish failed. Please check the message above.
    echo This window will stay open so you can read the error.
    pause
    exit /b 1
)

echo.
echo Starting dashboard backend on http://localhost:5000
echo LAN users can open http://SERVER_LAN_IP:5000
echo Press Ctrl+C in this window to stop the dashboard.
echo.

start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:5000'"

dotnet "%PUBLISH_DIR%\Cpall.CommandCenter.Api.dll" --urls "http://0.0.0.0:5000" --contentRoot "%PUBLISH_DIR%"
if errorlevel 1 (
    echo.
    echo Dashboard failed to start or stopped with an error.
    echo If port 5000 is stuck, double-click stop-dashboard.bat.
    pause
    exit /b 1
)

endlocal
