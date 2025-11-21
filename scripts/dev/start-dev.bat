@echo off
REM ============================================
REM Stuffed Lamb - Development Starter (Windows)
REM ============================================

echo.
echo ========================================
echo   STUFFED LAMB - STARTING DEV MODE
echo ========================================
echo.

REM Check if server is already running
netstat -ano | findstr ":8000" >nul
if %errorlevel% equ 0 (
    echo [ERROR] Port 8000 is already in use!
    echo.
    echo Stop the existing server first:
    echo   1. Close any running terminal windows
    echo   2. Or run: taskkill /F /IM node.exe
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo.
    echo Install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

REM Check if ngrok is installed
where ngrok >nul 2>&1
if errorlevel 1 (
    echo [ERROR] ngrok not found!
    echo.
    echo Install ngrok:
    echo   1. Download from https://ngrok.com/download
    echo   2. Extract to a folder in your PATH
    echo   3. Run: ngrok config add-authtoken YOUR_TOKEN
    echo.
    pause
    exit /b 1
)

echo [1/3] Starting Node.js server...
start "Stuffed Lamb Server" cmd /c "npm start"

echo.
echo [2/3] Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting ngrok tunnel...
start "ngrok" cmd /c "ngrok http 8000"

echo.
echo Waiting for ngrok to initialize...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   DEVELOPMENT ENVIRONMENT STARTED
echo ========================================
echo.
echo Status:
echo   - Server: http://localhost:8000
echo   - Ngrok dashboard: http://localhost:4040
echo.
echo Two new windows should have opened:
echo   1. "Stuffed Lamb Server" - Node.js server
echo   2. "ngrok" - Tunnel to expose your server
echo.
echo ========================================
echo   NEXT STEPS
echo ========================================
echo.
echo 1. Check the ngrok window for your public URL
echo    (looks like: https://abc-123.ngrok-free.app)
echo.
echo 2. Update VAPI with your ngrok URL:
echo    bash scripts/tools/update-webhook.sh https://your-url.ngrok-free.app
echo.
echo 3. Test your webhook:
echo    curl https://your-url.ngrok-free.app/health
echo.
echo 4. Call your VAPI phone number to test!
echo.
echo ========================================
echo   TO STOP
echo ========================================
echo.
echo Option 1: Close both terminal windows manually
echo Option 2: Run: bash scripts/dev/stop-dev.sh
echo Option 3: Run: taskkill /F /IM node.exe ^&^& taskkill /F /IM ngrok.exe
echo.
echo ========================================
echo.

REM Try to fetch ngrok URL
echo Attempting to fetch ngrok URL...
timeout /t 2 /nobreak >nul

curl -s http://localhost:4040/api/tunnels 2>nul | findstr "https://" >nul
if %errorlevel% equ 0 (
    echo.
    echo Visit http://localhost:4040 to see your ngrok URL
    echo.
)

pause
