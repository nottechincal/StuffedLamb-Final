# ============================================
# Diagnostics Script
# ============================================
# Run this to check your configuration

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STUFFED LAMB - DIAGNOSTICS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check .env file exists
Write-Host "[1/6] Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "  ❌ .env file missing!" -ForegroundColor Red
    Write-Host "     Copy .env.example to .env" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# Check Twilio credentials
Write-Host "[2/6] Checking Twilio credentials..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw

if ($envContent -match 'TWILIO_ACCOUNT_SID=AC[a-f0-9]{32}') {
    Write-Host "  ✅ TWILIO_ACCOUNT_SID looks valid" -ForegroundColor Green
} else {
    Write-Host "  ❌ TWILIO_ACCOUNT_SID missing or invalid" -ForegroundColor Red
}

if ($envContent -match 'TWILIO_AUTH_TOKEN=.{32,}') {
    Write-Host "  ✅ TWILIO_AUTH_TOKEN has value" -ForegroundColor Green
} else {
    Write-Host "  ❌ TWILIO_AUTH_TOKEN missing or too short" -ForegroundColor Red
}

if ($envContent -match 'TWILIO_FROM=\+[0-9]{10,}') {
    Write-Host "  ✅ TWILIO_FROM has phone number" -ForegroundColor Green
    $twilioFrom = ($envContent | Select-String 'TWILIO_FROM=(.+)' -AllMatches).Matches[0].Groups[1].Value
    Write-Host "     Number: $twilioFrom" -ForegroundColor Gray
} else {
    Write-Host "  ❌ TWILIO_FROM missing or invalid format" -ForegroundColor Red
    Write-Host "     Should be in E.164 format: +61468033229" -ForegroundColor Gray
}
Write-Host ""

# Check VAPI credentials
Write-Host "[3/6] Checking VAPI credentials..." -ForegroundColor Yellow
if ($envContent -match 'VAPI_API_KEY=.{32,}') {
    Write-Host "  ✅ VAPI_API_KEY has value" -ForegroundColor Green
} else {
    Write-Host "  ❌ VAPI_API_KEY missing" -ForegroundColor Red
}

if ($envContent -match 'VAPI_ASSISTANT_ID=[a-f0-9-]{36}') {
    Write-Host "  ✅ VAPI_ASSISTANT_ID looks valid" -ForegroundColor Green
} else {
    Write-Host "  ❌ VAPI_ASSISTANT_ID missing or invalid" -ForegroundColor Red
}
Write-Host ""

# Check if server is running
Write-Host "[4/6] Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 3 -ErrorAction Stop
    $health = $response.Content | ConvertFrom-Json
    Write-Host "  ✅ Server is running!" -ForegroundColor Green
    Write-Host "     Shop: $($health.shop)" -ForegroundColor Gray
    Write-Host "     Environment: $($health.environment)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Server not responding" -ForegroundColor Red
    Write-Host "     Start with: npm start" -ForegroundColor Gray
}
Write-Host ""

# Check if ngrok is running
Write-Host "[5/6] Checking if ngrok is running..." -ForegroundColor Yellow
try {
    $ngrokResponse = Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 3 -ErrorAction Stop
    $tunnels = ($ngrokResponse.Content | ConvertFrom-Json).tunnels
    $httpsUrl = ($tunnels | Where-Object { $_.proto -eq "https" })[0].public_url

    if ($httpsUrl) {
        Write-Host "  ✅ ngrok is running!" -ForegroundColor Green
        Write-Host "     Public URL: $httpsUrl" -ForegroundColor Green
        Write-Host ""
        Write-Host "  📋 To update VAPI webhook:" -ForegroundColor Yellow
        Write-Host "     bash scripts/tools/update-webhook.sh $httpsUrl" -ForegroundColor White
    }
} catch {
    Write-Host "  ❌ ngrok not responding" -ForegroundColor Red
    Write-Host "     Start with: ngrok http 8000" -ForegroundColor Gray
}
Write-Host ""

# Test webhook health from outside
Write-Host "[6/6] Testing public webhook..." -ForegroundColor Yellow
if ($httpsUrl) {
    try {
        $publicHealth = Invoke-WebRequest -Uri "$httpsUrl/health" -TimeoutSec 5 -ErrorAction Stop -Headers @{"ngrok-skip-browser-warning"="true"}
        Write-Host "  ✅ Webhook accessible from internet!" -ForegroundColor Green
        Write-Host "     Ready for VAPI to call" -ForegroundColor Gray
    } catch {
        Write-Host "  ❌ Webhook not accessible" -ForegroundColor Red
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⏭️  Skipped (ngrok not running)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
