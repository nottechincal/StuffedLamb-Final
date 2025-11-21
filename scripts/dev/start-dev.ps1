# ============================================
# Stuffed Lamb - Development Starter (PowerShell)
# ============================================
# Works with Windows Terminal, PowerShell, CMD

param(
    [switch]$SkipChecks
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STUFFED LAMB - DEV ENVIRONMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PRE-FLIGHT CHECKS
# ============================================

if (-not $SkipChecks) {
    Write-Host "[1/5] Running pre-flight checks..." -ForegroundColor Yellow
    Write-Host ""

    # Check if port 8000 is in use
    $portCheck = netstat -ano | Select-String ":8000"
    if ($portCheck) {
        Write-Host "⚠️  Port 8000 is already in use!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "There's an existing Node.js server running." -ForegroundColor Gray
        Write-Host ""

        # Ask user if they want to stop it
        $response = Read-Host "Would you like to stop the existing server and continue? (Y/N)"

        if ($response -match '^[Yy]') {
            Write-Host ""
            Write-Host "Stopping existing Node.js processes..." -ForegroundColor Yellow
            try {
                Stop-Process -Name node -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 2
                Write-Host "  ✅ Stopped existing server" -ForegroundColor Green
                Write-Host ""
            } catch {
                Write-Host "  ❌ Failed to stop server" -ForegroundColor Red
                Write-Host ""
                Write-Host "Manually stop it with: taskkill /F /IM node.exe" -ForegroundColor Yellow
                Read-Host "Press Enter to exit"
                exit 1
            }
        } else {
            Write-Host ""
            Write-Host "To manually stop the server:" -ForegroundColor Yellow
            Write-Host "  • Close running terminal windows, OR"
            Write-Host "  • Run: Stop-Process -Name node -Force"
            Write-Host ""
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
    Write-Host "  ✅ Port 8000 available" -ForegroundColor Green

    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "  ✅ Node.js found: $nodeVersion" -ForegroundColor Green
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-Host "  ❌ Node.js not installed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Install Node.js from: https://nodejs.org" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Check ngrok
    try {
        $ngrokPath = (Get-Command ngrok -ErrorAction Stop).Source
        Write-Host "  ✅ ngrok found: $ngrokPath" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ ngrok not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Install ngrok:" -ForegroundColor Yellow
        Write-Host "  1. Download from https://ngrok.com/download"
        Write-Host "  2. Extract ngrok.exe to a folder in your PATH"
        Write-Host "  3. Run: ngrok config add-authtoken YOUR_TOKEN"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Check .env file
    if (Test-Path ".env") {
        Write-Host "  ✅ .env file found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  .env file not found" -ForegroundColor Yellow
        Write-Host "     Copy .env.example to .env and configure it"
    }

    # Check node_modules
    if (Test-Path "node_modules") {
        Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Dependencies not installed" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
    }

    Write-Host ""
}

# ============================================
# START SERVER
# ============================================

Write-Host "[2/5] Starting Node.js server..." -ForegroundColor Yellow
Write-Host ""

# Start server in new window (from project root)
$projectRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {
    Set-Location '$projectRoot'
    `$Host.UI.RawUI.WindowTitle = 'Stuffed Lamb Server - Port 8000'
    Write-Host '========================================' -ForegroundColor Green
    Write-Host '  STUFFED LAMB SERVER' -ForegroundColor Green
    Write-Host '========================================' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Server starting on http://localhost:8000...' -ForegroundColor Cyan
    Write-Host 'Working directory: $(Get-Location)' -ForegroundColor Gray
    Write-Host ''
    npm start
}"

Write-Host "  ✅ Server window opened" -ForegroundColor Green
Write-Host ""

# Wait and verify server started
Write-Host "[3/5] Waiting for server to be ready..." -ForegroundColor Yellow

$serverReady = $false
$maxAttempts = 15
$attempt = 0

while (-not $serverReady -and $attempt -lt $maxAttempts) {
    $attempt++
    Start-Sleep -Seconds 1
    Write-Host "  ⏳ Checking server... ($attempt/$maxAttempts)" -ForegroundColor Gray

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
        }
    } catch {
        # Server not ready yet
    }
}

if ($serverReady) {
    Write-Host "  ✅ Server is running!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "  ⚠️  Server may still be starting (couldn't verify health check)" -ForegroundColor Yellow
    Write-Host "     Check the server window for any errors"
    Write-Host ""
}

# ============================================
# START NGROK
# ============================================

Write-Host "[4/5] Starting ngrok tunnel..." -ForegroundColor Yellow
Write-Host ""

# Start ngrok in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {
    `$Host.UI.RawUI.WindowTitle = 'ngrok - Tunnel to localhost:8000'
    Write-Host '========================================' -ForegroundColor Magenta
    Write-Host '  NGROK TUNNEL' -ForegroundColor Magenta
    Write-Host '========================================' -ForegroundColor Magenta
    Write-Host ''
    Write-Host 'Creating tunnel to http://localhost:8000...' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Copy the HTTPS URL below and use it to update VAPI!' -ForegroundColor Yellow
    Write-Host ''
    ngrok http 8000
}"

Write-Host "  ✅ ngrok window opened" -ForegroundColor Green
Write-Host ""

# Wait for ngrok to start
Write-Host "[5/5] Waiting for ngrok tunnel..." -ForegroundColor Yellow

$ngrokReady = $false
$maxAttempts = 10
$attempt = 0

while (-not $ngrokReady -and $attempt -lt $maxAttempts) {
    $attempt++
    Start-Sleep -Seconds 1
    Write-Host "  ⏳ Checking ngrok... ($attempt/$maxAttempts)" -ForegroundColor Gray

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ngrokReady = $true
        }
    } catch {
        # ngrok not ready yet
    }
}

Write-Host ""

# ============================================
# GET NGROK URL
# ============================================

$ngrokUrl = $null

if ($ngrokReady) {
    Write-Host "  ✅ ngrok tunnel established!" -ForegroundColor Green
    Write-Host ""

    try {
        $tunnelInfo = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
        $ngrokUrl = $tunnelInfo.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1 -ExpandProperty public_url

        if ($ngrokUrl) {
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  🌐 NGROK PUBLIC URL" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "  $ngrokUrl" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
        }
    } catch {
        Write-Host "  ⚠️  Could not fetch ngrok URL automatically" -ForegroundColor Yellow
        Write-Host "     Check the ngrok window for your URL"
        Write-Host ""
    }
} else {
    Write-Host "  ⚠️  ngrok may still be starting" -ForegroundColor Yellow
    Write-Host "     Check the ngrok window for your URL"
    Write-Host ""
}

# ============================================
# FINAL STATUS
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ DEVELOPMENT ENVIRONMENT STARTED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Status:" -ForegroundColor Yellow
Write-Host "  • Server: " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Green
Write-Host "  • ngrok dashboard: " -NoNewline; Write-Host "http://localhost:4040" -ForegroundColor Green
if ($ngrokUrl) {
    Write-Host "  • Public URL: " -NoNewline; Write-Host "$ngrokUrl" -ForegroundColor Green
}
Write-Host ""

Write-Host "🪟  Windows Opened:" -ForegroundColor Yellow
Write-Host "  1. Stuffed Lamb Server - Port 8000"
Write-Host "  2. ngrok - Tunneling to localhost:8000"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📋 NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($ngrokUrl) {
    Write-Host "1️⃣  Update VAPI webhook:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   In Git Bash:" -ForegroundColor Gray
    Write-Host "   bash scripts/tools/update-webhook.sh $ngrokUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or use the full API:" -ForegroundColor Gray
    Write-Host "   curl -X PATCH https://api.vapi.ai/assistant/YOUR_ID ..." -ForegroundColor White
    Write-Host ""

    Write-Host "2️⃣  Test webhook health:" -ForegroundColor Yellow
    Write-Host "   curl $ngrokUrl/health" -ForegroundColor White
    Write-Host ""

    Write-Host "3️⃣  Call your VAPI number to test!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "1️⃣  Get your ngrok URL from the ngrok window" -ForegroundColor Yellow
    Write-Host "   (looks like: https://abc-123.ngrok-free.app)" -ForegroundColor Gray
    Write-Host ""

    Write-Host "2️⃣  Update VAPI webhook:" -ForegroundColor Yellow
    Write-Host "   bash scripts/update-webhook.sh https://your-url.ngrok-free.app" -ForegroundColor White
    Write-Host ""

    Write-Host "3️⃣  Test and call VAPI number" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🛑 TO STOP EVERYTHING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Close both PowerShell windows manually" -ForegroundColor Gray
Write-Host "Option 2: Run: " -NoNewline; Write-Host ".\scripts\dev\stop-dev.ps1" -ForegroundColor White
Write-Host "Option 3: Run: " -NoNewline; Write-Host "Stop-Process -Name node,ngrok -Force" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to close this window"
