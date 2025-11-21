# Simple, reliable starter for Stuffed Lamb

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  STUFFED LAMB - STARTING" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if port is in use
$portCheck = netstat -ano | Select-String ":8000"
if ($portCheck) {
    Write-Host "Port 8000 in use. Stop old server? (Y/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -match '^[Yy]') {
        Stop-Process -Name node -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "Stopped." -ForegroundColor Green
    } else {
        exit 1
    }
}

# Get project root
$projectRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName

# Start server
Write-Host "Starting server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; npm start"
Start-Sleep -Seconds 3

# Start ngrok with static domain
Write-Host "Starting ngrok..." -ForegroundColor Yellow
$ngrokDomain = "surveyable-natisha-unsacred.ngrok-free.dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http --domain=$ngrokDomain 8000"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  STARTED!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Server: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Public: https://$ngrokDomain" -ForegroundColor Cyan
Write-Host "Dashboard: http://localhost:4040" -ForegroundColor Cyan
Write-Host ""
Write-Host "VAPI webhook is already configured!" -ForegroundColor Green
Write-Host "(using static ngrok domain)" -ForegroundColor Gray
Write-Host ""
Write-Host "Ready to test! Call your VAPI number." -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop: Run .\scripts\dev\stop-dev.ps1" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to close"
