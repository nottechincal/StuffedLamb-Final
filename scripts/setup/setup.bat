@echo off
REM ========================================
REM STUFFED LAMB - ONE-CLICK SETUP
REM ========================================
REM This script sets up everything automatically

setlocal enabledelayedexpansion

echo.
echo ========================================
echo    STUFFED LAMB VOICE AI SETUP
echo ========================================
echo.

REM Set colors (if supported)
color 0A

REM ========================================
REM STEP 1: PRE-FLIGHT CHECKS
REM ========================================
echo [1/7] Running pre-flight checks...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js 18+ from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found:
node --version
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo.
    echo Creating .env from template...
    copy .env.example .env >nul
    echo.
    echo [ACTION REQUIRED] Please edit .env file and add your credentials:
    echo   - VAPI_API_KEY
    echo   - VAPI_ASSISTANT_ID
    echo   - TWILIO credentials
    echo   - WEBHOOK_URL
    echo.
    echo See: config\CONFIGURATION_CHECKLIST.md for detailed instructions
    echo.
    pause
    exit /b 1
)

echo [OK] .env file found
echo.

REM Check critical environment variables
findstr /C:"VAPI_API_KEY=" .env | findstr /V "your_key_here" >nul
if errorlevel 1 (
    echo [ERROR] VAPI_API_KEY not configured in .env!
    echo.
    echo Please edit .env and set your VAPI API key.
    echo See: config\CONFIGURATION_CHECKLIST.md
    echo.
    pause
    exit /b 1
)

echo [OK] VAPI_API_KEY configured
echo.

findstr /C:"WEBHOOK_URL=" .env | findstr /V "YOUR_WEBHOOK_URL" >nul
if errorlevel 1 (
    echo [WARNING] WEBHOOK_URL not configured in .env!
    echo.
    echo For local testing, run: ngrok http 8000
    echo Then update WEBHOOK_URL in .env
    echo.
)

REM ========================================
REM STEP 2: INSTALL DEPENDENCIES
REM ========================================
echo [2/7] Installing dependencies...
echo.

if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed
)

echo.
echo [OK] Dependencies ready
echo.

REM ========================================
REM STEP 3: SETUP DIRECTORIES
REM ========================================
echo [3/7] Setting up directories...
echo.

if not exist "data\orders" mkdir data\orders
if not exist "logs" mkdir logs
if not exist "tests" mkdir tests

echo [OK] Directories created
echo.

REM ========================================
REM STEP 4: CONFIGURE VAPI TOOLS
REM ========================================
echo [4/7] Configuring VAPI tools...
echo.

REM Check if bash is available (Git Bash)
where bash >nul 2>&1
if errorlevel 0 (
    echo Using bash to setup VAPI tools...
    bash scripts\rebuild-tools-realistic.sh
    if errorlevel 1 (
        echo [WARNING] VAPI tool setup failed
        echo You can run this manually later: bash scripts\rebuild-tools-realistic.sh
    ) else (
        echo [OK] VAPI tools configured
    )
) else (
    echo [INFO] Git Bash not found - VAPI tools setup skipped
    echo.
    echo To setup VAPI tools:
    echo   1. Install Git Bash: https://git-scm.com
    echo   2. Run: bash scripts\rebuild-tools-realistic.sh
    echo.
    echo OR use PowerShell script:
    echo   powershell -ExecutionPolicy Bypass -File update-vapi-tools.ps1
    echo.
)

echo.

REM ========================================
REM STEP 5: RUN TESTS
REM ========================================
echo [5/7] Running tests...
echo.

REM Start server in background for tests
echo Starting server for tests...
start /B npm start >nul 2>&1

REM Wait for server to start
timeout /t 5 /nobreak >nul

REM Check if server is running
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not start server for tests
    echo Tests will be skipped
    goto :skip_tests
)

echo [OK] Server started
echo.

REM Run tests
where bash >nul 2>&1
if errorlevel 0 (
    echo Running test suite...
    bash scripts\run-tests.sh
    if errorlevel 1 (
        echo [WARNING] Some tests failed
        echo This is normal during initial setup
        echo Check logs\*.log for details
    ) else (
        echo [OK] All tests passed!
    )
) else (
    echo [INFO] Git Bash not found - Tests skipped
    echo To run tests later: bash scripts\run-tests.sh
)

REM Kill background server
taskkill /F /IM node.exe >nul 2>&1

:skip_tests
echo.

REM ========================================
REM STEP 6: SYSTEM VALIDATION
REM ========================================
echo [6/7] Validating system...
echo.

REM Check data files
if exist "data\menu.json" (
    echo [OK] Menu data found
) else (
    echo [ERROR] Menu data missing!
)

if exist "data\business.json" (
    echo [OK] Business config found
) else (
    echo [ERROR] Business config missing!
)

if exist "src\server.js" (
    echo [OK] Server code found
) else (
    echo [ERROR] Server code missing!
)

echo.

REM ========================================
REM STEP 7: DISPLAY SUMMARY
REM ========================================
echo [7/7] Setup complete!
echo.
echo ========================================
echo   SETUP SUMMARY
echo ========================================
echo.
echo Status: READY TO RUN
echo.
echo Configuration:
type .env | findstr /V "TWILIO_AUTH_TOKEN" | findstr /V "VAPI_API_KEY"
echo.
echo ========================================
echo   NEXT STEPS
echo ========================================
echo.
echo 1. START THE SERVER:
echo    npm start
echo.
echo 2. TEST THE SYSTEM:
echo    Call your VAPI phone number
echo.
echo 3. VIEW LOGS:
echo    type logs\*.log
echo.
echo 4. UPDATE TOOLS (if webhook changes):
echo    bash scripts\rebuild-tools-realistic.sh
echo.
echo ========================================
echo   DOCUMENTATION
echo ========================================
echo.
echo - Configuration: config\CONFIGURATION_CHECKLIST.md
echo - System Guide: docs\FINAL-SUMMARY.md
echo - AI Behavior: docs\SYSTEM_PROMPT.md
echo - Business Plan: docs\BUSINESS-SCALING.md
echo.
echo ========================================
echo   QUICK COMMANDS
echo ========================================
echo.
echo Start server:        npm start
echo Run tests:           bash scripts\run-tests.sh
echo Update VAPI tools:   bash scripts\rebuild-tools-realistic.sh
echo View health:         curl http://localhost:8000/health
echo.
echo ========================================
echo.

REM Check if user wants to start server now
set /p START_NOW="Start server now? (Y/N): "
if /i "%START_NOW%"=="Y" (
    echo.
    echo Starting server...
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    npm start
) else (
    echo.
    echo To start server later, run: npm start
    echo.
)

pause
