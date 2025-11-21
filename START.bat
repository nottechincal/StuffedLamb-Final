@echo off
REM ============================================
REM Stuffed Lamb - ONE-CLICK START
REM ============================================
REM Double-click this file to start everything!

echo.
echo ========================================
echo    STUFFED LAMB - STARTING...
echo ========================================
echo.

REM Check if PowerShell is available (Windows 7+)
powershell -Command "exit" >nul 2>&1
if %errorlevel% equ 0 (
    echo Using simplified PowerShell launcher...
    powershell -ExecutionPolicy Bypass -File "scripts\dev\start-dev-simple.ps1"
) else (
    echo PowerShell not available, using basic launcher...
    call scripts\dev\start-dev.bat
)
