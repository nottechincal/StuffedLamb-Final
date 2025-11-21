#!/bin/bash

# ============================================
# VAPI Tools Updater for Stuffed Lamb
# ============================================
# This script removes all existing tools and uploads new ones to VAPI assistant
#
# Usage:
#   ./update-vapi-tools.sh <api_key> <assistant_id> <webhook_url>
#
# Or set environment variables:
#   export VAPI_API_KEY="your_key"
#   export VAPI_ASSISTANT_ID="your_id"
#   export WEBHOOK_URL="https://your-domain.com/webhook"
#   ./update-vapi-tools.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Parse arguments
API_KEY=${1:-$VAPI_API_KEY}
ASSISTANT_ID=${2:-$VAPI_ASSISTANT_ID}
WEBHOOK_URL=${3:-$WEBHOOK_URL}
TOOLS_FILE="vapi-tools.json"

# Validate inputs
if [ -z "$API_KEY" ]; then
    log_error "VAPI API Key is required. Set VAPI_API_KEY environment variable or pass as first argument"
    exit 1
fi

if [ -z "$ASSISTANT_ID" ]; then
    log_error "VAPI Assistant ID is required. Set VAPI_ASSISTANT_ID environment variable or pass as second argument"
    exit 1
fi

if [ -z "$WEBHOOK_URL" ]; then
    log_error "Webhook URL is required. Set WEBHOOK_URL environment variable or pass as third argument"
    exit 1
fi

if [ ! -f "$TOOLS_FILE" ]; then
    log_error "Tools file not found: $TOOLS_FILE"
    exit 1
fi

BASE_URL="https://api.vapi.ai"

log_info "Starting VAPI Tools Update..."
log_info "Assistant ID: $ASSISTANT_ID"
log_info "Webhook URL: $WEBHOOK_URL"
echo ""

# ============================================
# Step 1: Get Current Assistant Configuration
# ============================================
log_info "Fetching current assistant configuration..."

ASSISTANT_RESPONSE=$(curl -s -X GET "$BASE_URL/assistant/$ASSISTANT_ID" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json")

if [ $? -ne 0 ]; then
    log_error "Failed to fetch assistant"
    exit 1
fi

ASSISTANT_NAME=$(echo "$ASSISTANT_RESPONSE" | jq -r '.name // "Unknown"')
log_success "Successfully fetched assistant: $ASSISTANT_NAME"

# ============================================
# Step 2: Update Tools with Webhook URL
# ============================================
log_info "Updating webhook URLs in tools..."

UPDATED_TOOLS=$(jq --arg url "$WEBHOOK_URL" '
    .tools |= map(
        if .server then
            .server.url = $url
        else
            .
        end
    )
' "$TOOLS_FILE")

TOOL_COUNT=$(echo "$UPDATED_TOOLS" | jq '.tools | length')
log_success "Prepared $TOOL_COUNT tools with webhook URL"

# ============================================
# Step 3: Update Assistant
# ============================================
log_info "Updating assistant with new tools..."

MODEL_CONFIG=$(echo "$ASSISTANT_RESPONSE" | jq '.model')

UPDATE_PAYLOAD=$(echo "$UPDATED_TOOLS" | jq --argjson model "$MODEL_CONFIG" '{
    model: $model,
    tools: .tools
}')

UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/assistant/$ASSISTANT_ID" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_PAYLOAD")

if [ $? -ne 0 ]; then
    log_error "Failed to update assistant"
    exit 1
fi

log_success "Successfully updated assistant tools!"

# ============================================
# Step 4: Verify Update
# ============================================
log_info "Verifying update..."

VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/assistant/$ASSISTANT_ID" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json")

VERIFY_TOOL_COUNT=$(echo "$VERIFY_RESPONSE" | jq '.model.tools | length // 0')

if [ "$VERIFY_TOOL_COUNT" -eq "$TOOL_COUNT" ]; then
    log_success "Verification successful! $VERIFY_TOOL_COUNT tools are now active"
else
    log_warning "Tool count mismatch. Expected: $TOOL_COUNT, Got: $VERIFY_TOOL_COUNT"
fi

# ============================================
# Summary
# ============================================
echo ""
log_info "============================================"
log_info "Update Complete!"
log_info "============================================"
log_info "Tools uploaded: $TOOL_COUNT"
echo ""
log_info "Tool List:"
echo "$UPDATED_TOOLS" | jq -r '.tools[].function.name' | while read -r tool; do
    log_info "  - $tool"
done
echo ""
log_success "All tools are now configured and ready to use!"
