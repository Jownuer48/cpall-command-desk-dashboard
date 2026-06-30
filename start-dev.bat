@echo off
setlocal
cd /d "%~dp0"

echo ================================================
echo CPALL Command Center Dashboard - Development
echo ================================================
echo.
echo Opening separate windows for the backend and frontend dev servers...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.

start "CPALL Dashboard Backend" /D "%~dp0backend" cmd /k "echo CPALL backend starting on http://localhost:5000 & echo Press Ctrl+C to stop this backend window. & echo. & dotnet run --urls http://localhost:5000 || (echo. & echo Backend failed. Check whether port 5000 is already in use. & pause)"

start "CPALL Dashboard Frontend" /D "%~dp0frontend" cmd /k "echo CPALL frontend starting on http://localhost:5173 & echo Press Ctrl+C to stop this frontend window. & echo. & if not exist node_modules (echo node_modules not found. Running npm install... & call npm install & if errorlevel 1 (echo. & echo npm install failed. & pause & exit /b 1)) & call npm run dev || (echo. & echo Frontend dev server failed. Check the message above. & pause)"

echo Opening browser to http://localhost:5173
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:5173'"

echo.
echo Development mode is starting. Use the backend and frontend windows to stop each server.
ping 127.0.0.1 -n 4 >nul

endlocal
