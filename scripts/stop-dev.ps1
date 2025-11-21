# ============================================
# Stop Development Environment (PowerShell)
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  🛑 STOPPING DEV ENVIRONMENT" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Stop Node.js
Write-Host "Stopping Node.js server..." -ForegroundColor Yellow
try {
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Node.js stopped" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  No Node.js process found" -ForegroundColor Gray
}

# Stop ngrok
Write-Host "Stopping ngrok..." -ForegroundColor Yellow
try {
    Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ ngrok stopped" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  No ngrok process found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Development environment stopped" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to close"
