#!/bin/bash

# ============================================
# VAPI Tools Setup (Proper Implementation)
# ============================================
# This script properly creates tools and updates assistant
#
# VAPI Architecture:
# 1. Create tools separately via /tool endpoint
# 2. Get tool IDs back
# 3. Update assistant.model.toolIds with those IDs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

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
    log_error "VAPI API Key is required"
    exit 1
fi

if [ -z "$ASSISTANT_ID" ]; then
    log_error "VAPI Assistant ID is required"
    exit 1
fi

if [ -z "$WEBHOOK_URL" ]; then
    log_error "Webhook URL is required"
    exit 1
fi

BASE_URL="https://api.vapi.ai"
TOOL_IDS=()

log_info "============================================"
log_info "VAPI Tools Setup - Proper Implementation"
log_info "============================================"
log_info "Assistant ID: $ASSISTANT_ID"
log_info "Webhook URL: $WEBHOOK_URL"
echo ""

# ============================================
# Step 1: Delete ALL Existing Tools
# ============================================
log_info "Step 1: Fetching existing tools..."

EXISTING_TOOLS=$(curl -s -X GET "$BASE_URL/tool" \
    -H "Authorization: Bearer $API_KEY")

EXISTING_TOOL_IDS=$(echo "$EXISTING_TOOLS" | jq -r '.[].id // empty' 2>/dev/null || echo "")

if [ -n "$EXISTING_TOOL_IDS" ]; then
    TOOL_COUNT=$(echo "$EXISTING_TOOL_IDS" | wc -l)
    log_warning "Found $TOOL_COUNT existing tools. Deleting..."

    while IFS= read -r tool_id; do
        if [ -n "$tool_id" ]; then
            curl -s -X DELETE "$BASE_URL/tool/$tool_id" \
                -H "Authorization: Bearer $API_KEY" > /dev/null
            log_info "  Deleted tool: $tool_id"
        fi
    done <<< "$EXISTING_TOOL_IDS"

    log_success "Deleted all existing tools"
else
    log_info "No existing tools found"
fi

echo ""

# ============================================
# Step 2: Create New Tools
# ============================================
log_info "Step 2: Creating new tools from $TOOLS_FILE..."

# Read tools from JSON
TOOLS=$(jq -c '.tools[]' "$TOOLS_FILE")

TOOL_INDEX=0
while IFS= read -r tool; do
    TOOL_INDEX=$((TOOL_INDEX + 1))

    # Update webhook URL in tool
    TOOL_WITH_WEBHOOK=$(echo "$tool" | jq --arg url "$WEBHOOK_URL" '
        if .server then
            .server.url = $url
        else
            .
        end
    ')

    TOOL_NAME=$(echo "$TOOL_WITH_WEBHOOK" | jq -r '.function.name')

    log_info "  Creating tool $TOOL_INDEX: $TOOL_NAME..."

    # Create tool
    RESPONSE=$(curl -s -X POST "$BASE_URL/tool" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$TOOL_WITH_WEBHOOK")

    # Check for errors
    ERROR=$(echo "$RESPONSE" | jq -r '.error // empty')
    if [ -n "$ERROR" ]; then
        log_error "Failed to create tool $TOOL_NAME: $ERROR"
        log_error "Response: $RESPONSE"
        continue
    fi

    # Extract tool ID
    TOOL_ID=$(echo "$RESPONSE" | jq -r '.id // empty')

    if [ -n "$TOOL_ID" ]; then
        TOOL_IDS+=("$TOOL_ID")
        log_success "    Created: $TOOL_NAME (ID: $TOOL_ID)"
    else
        log_error "Failed to get tool ID for $TOOL_NAME"
        log_error "Response: $RESPONSE"
    fi

done <<< "$TOOLS"

echo ""
log_success "Created ${#TOOL_IDS[@]} tools successfully"
echo ""

# ============================================
# Step 3: Update Assistant with Tool IDs
# ============================================
log_info "Step 3: Updating assistant with new tool IDs..."

# Build tool IDs JSON array
TOOL_IDS_JSON=$(printf '%s\n' "${TOOL_IDS[@]}" | jq -R . | jq -s .)

# Update payload (only update model.toolIds)
UPDATE_PAYLOAD=$(jq -n \
    --argjson toolIds "$TOOL_IDS_JSON" \
    '{
        model: {
            toolIds: $toolIds
        }
    }')

log_info "Sending update to assistant..."

UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/assistant/$ASSISTANT_ID" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_PAYLOAD")

# Check for errors
UPDATE_ERROR=$(echo "$UPDATE_RESPONSE" | jq -r '.error // empty')
if [ -n "$UPDATE_ERROR" ]; then
    log_error "Failed to update assistant: $UPDATE_ERROR"
    log_error "Response: $UPDATE_RESPONSE"
    exit 1
fi

log_success "Assistant updated successfully!"

# ============================================
# Step 4: Verify
# ============================================
log_info "Step 4: Verifying configuration..."

VERIFY=$(curl -s -X GET "$BASE_URL/assistant/$ASSISTANT_ID" \
    -H "Authorization: Bearer $API_KEY")

VERIFY_TOOL_COUNT=$(echo "$VERIFY" | jq '.model.toolIds | length')

if [ "$VERIFY_TOOL_COUNT" -eq "${#TOOL_IDS[@]}" ]; then
    log_success "Verification successful! $VERIFY_TOOL_COUNT tools configured"
else
    log_warning "Tool count mismatch. Expected: ${#TOOL_IDS[@]}, Got: $VERIFY_TOOL_COUNT"
fi

# ============================================
# Summary
# ============================================
echo ""
log_info "============================================"
log_info "Setup Complete!"
log_info "============================================"
echo ""
log_info "Tool Configuration:"
for i in "${!TOOL_IDS[@]}"; do
    TOOL_NAME=$(echo "$TOOLS" | jq -r "select(.function.name) | .function.name" | sed -n "$((i+1))p")
    log_info "  $((i+1)). $TOOL_NAME"
    log_info "     ID: ${TOOL_IDS[$i]}"
done
echo ""
log_info "Assistant ID: $ASSISTANT_ID"
log_info "Webhook URL: $WEBHOOK_URL"
echo ""
log_success "Your VAPI assistant is ready to use! 🎉"
echo ""
log_info "Test your webhook:"
log_info "  curl $WEBHOOK_URL"
echo ""
