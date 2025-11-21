# ============================================
# VAPI Tools Updater for Stuffed Lamb
# ============================================
# This script removes all existing tools and uploads new ones to VAPI assistant
#
# Usage:
#   .\update-vapi-tools.ps1 -ApiKey "your_vapi_key" -AssistantId "your_assistant_id" -WebhookUrl "https://your-domain.com/webhook"
#
# Or set environment variables:
#   $env:VAPI_API_KEY = "your_key"
#   $env:VAPI_ASSISTANT_ID = "your_id"
#   $env:WEBHOOK_URL = "https://your-domain.com/webhook"
#   .\update-vapi-tools.ps1

param(
    [string]$ApiKey = $env:VAPI_API_KEY,
    [string]$AssistantId = $env:VAPI_ASSISTANT_ID,
    [string]$WebhookUrl = $env:WEBHOOK_URL,
    [string]$ToolsFile = "vapi-tools.json"
)

# Colors for output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Validate inputs
if (-not $ApiKey) {
    Write-Error "VAPI API Key is required. Set VAPI_API_KEY environment variable or pass -ApiKey parameter"
    exit 1
}

if (-not $AssistantId) {
    Write-Error "VAPI Assistant ID is required. Set VAPI_ASSISTANT_ID environment variable or pass -AssistantId parameter"
    exit 1
}

if (-not $WebhookUrl) {
    Write-Error "Webhook URL is required. Set WEBHOOK_URL environment variable or pass -WebhookUrl parameter"
    exit 1
}

if (-not (Test-Path $ToolsFile)) {
    Write-Error "Tools file not found: $ToolsFile"
    exit 1
}

$BaseUrl = "https://api.vapi.ai"
$Headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

Write-Info "Starting VAPI Tools Update..."
Write-Info "Assistant ID: $AssistantId"
Write-Info "Webhook URL: $WebhookUrl"
Write-Info ""

# ============================================
# Step 1: Get Current Assistant Configuration
# ============================================
Write-Info "Fetching current assistant configuration..."

try {
    $Assistant = Invoke-RestMethod -Uri "$BaseUrl/assistant/$AssistantId" -Headers $Headers -Method Get
    Write-Success "Successfully fetched assistant: $($Assistant.name)"
} catch {
    Write-Error "Failed to fetch assistant: $_"
    exit 1
}

# ============================================
# Step 2: Read New Tools from JSON
# ============================================
Write-Info "Reading tools from $ToolsFile..."

try {
    $ToolsData = Get-Content $ToolsFile -Raw | ConvertFrom-Json
    $NewTools = $ToolsData.tools
    Write-Success "Found $($NewTools.Count) tools to upload"
} catch {
    Write-Error "Failed to read tools file: $_"
    exit 1
}

# ============================================
# Step 3: Update Tools with Webhook URL
# ============================================
Write-Info "Updating webhook URLs..."

foreach ($Tool in $NewTools) {
    if ($Tool.server) {
        $Tool.server.url = $WebhookUrl
    }
}

Write-Success "Webhook URLs updated"

# ============================================
# Step 4: Update Assistant with New Tools
# ============================================
Write-Info "Updating assistant with new tools..."

$UpdatePayload = @{
    model = $Assistant.model
    tools = $NewTools
} | ConvertTo-Json -Depth 10

try {
    $UpdatedAssistant = Invoke-RestMethod -Uri "$BaseUrl/assistant/$AssistantId" -Headers $Headers -Method Patch -Body $UpdatePayload
    Write-Success "Successfully updated assistant tools!"
} catch {
    Write-Error "Failed to update assistant: $_"
    Write-Error "Response: $($_.Exception.Message)"
    exit 1
}

# ============================================
# Step 5: Verify Update
# ============================================
Write-Info "Verifying update..."

try {
    $VerifyAssistant = Invoke-RestMethod -Uri "$BaseUrl/assistant/$AssistantId" -Headers $Headers -Method Get
    $ToolCount = $VerifyAssistant.model.tools.Count

    if ($ToolCount -eq $NewTools.Count) {
        Write-Success "Verification successful! $ToolCount tools are now active"
    } else {
        Write-Warning "Tool count mismatch. Expected: $($NewTools.Count), Got: $ToolCount"
    }
} catch {
    Write-Warning "Could not verify update: $_"
}

# ============================================
# Summary
# ============================================
Write-Info ""
Write-Info "============================================"
Write-Info "Update Complete!"
Write-Info "============================================"
Write-Info "Tools uploaded: $($NewTools.Count)"
Write-Info ""
Write-Info "Tool List:"
foreach ($Tool in $NewTools) {
    Write-Info "  - $($Tool.function.name)"
}
Write-Info ""
Write-Success "All tools are now configured and ready to use!"
