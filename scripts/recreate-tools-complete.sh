#!/bin/bash

# ============================================
# Complete VAPI Tools Setup with ALL Options
# ============================================
# Includes: async, messages, strict, server config

API_KEY="4000447a-37e5-4aa6-b7b3-e692bec2706f"
WEBHOOK_URL="https://surveyable-natisha-unsacred.ngrok-free.dev/webhook"
ASSISTANT_ID="977a1a1a-de18-4e2c-9e81-216b6b17dde9"

echo "🔧 Recreating tools with complete configuration..."
echo ""

# Delete all existing tools first
echo "🗑️  Deleting all existing tools..."
EXISTING_IDS=$(curl -s -X GET "https://api.vapi.ai/tool" -H "Authorization: Bearer $API_KEY" | jq -r '.[].id')
for ID in $EXISTING_IDS; do
    curl -s -X DELETE "https://api.vapi.ai/tool/$ID" -H "Authorization: Bearer $API_KEY" > /dev/null
done
echo "✅ All old tools deleted"
echo ""

# Array to store new tool IDs
TOOL_IDS=()

# Helper function to create tool
create_tool() {
    local NAME=$1
    local DESCRIPTION=$2
    local PARAMS=$3
    local MESSAGES=$4
    local ASYNC=${5:-false}

    RESPONSE=$(curl -s -X POST "https://api.vapi.ai/tool" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"function\",
            \"function\": {
                \"name\": \"$NAME\",
                \"description\": \"$DESCRIPTION\",
                \"parameters\": $PARAMS
            },
            \"async\": $ASYNC,
            \"messages\": $MESSAGES,
            \"server\": {
                \"url\": \"$WEBHOOK_URL\",
                \"timeoutSeconds\": 20
            }
        }")

    TOOL_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
    if [ -n "$TOOL_ID" ]; then
        echo "✅ Created: $NAME ($TOOL_ID)"
        TOOL_IDS+=("$TOOL_ID")
    else
        echo "❌ Failed: $NAME"
        echo "   Response: $RESPONSE"
    fi
}

# Quick tools (no messages needed - instant response)
create_tool "checkOpen" \
    "Check if shop is open" \
    '{"type":"object","properties":{},"required":[]}' \
    'null' \
    'false'

create_tool "getCallerSmartContext" \
    "Get caller info and order history" \
    '{"type":"object","properties":{},"required":[]}' \
    '[{"type":"request-start","content":"Let me pull up your information"}]' \
    'false'

create_tool "quickAddItem" \
    "Smart NLP parser for natural language orders" \
    '{"type":"object","properties":{"description":{"type":"string","description":"Natural language item description"}},"required":["description"]}' \
    'null' \
    'false'

create_tool "addMultipleItemsToCart" \
    "Batch add items to cart" \
    '{"type":"object","properties":{"items":{"type":"array","items":{"type":"object"}}},"required":["items"]}' \
    'null' \
    'false'

create_tool "getCartState" \
    "View current cart" \
    '{"type":"object","properties":{},"required":[]}' \
    'null' \
    'false'

create_tool "removeCartItem" \
    "Remove item from cart" \
    '{"type":"object","properties":{"itemIndex":{"type":"number"}},"required":["itemIndex"]}' \
    'null' \
    'false'

create_tool "clearCart" \
    "Clear entire cart" \
    '{"type":"object","properties":{},"required":[]}' \
    'null' \
    'false'

create_tool "editCartItem" \
    "Edit cart item properties" \
    '{"type":"object","properties":{"itemIndex":{"type":"number"},"modifications":{"type":"object"}},"required":["itemIndex","modifications"]}' \
    'null' \
    'false'

create_tool "priceCart" \
    "Calculate total with GST" \
    '{"type":"object","properties":{},"required":[]}' \
    'null' \
    'false'

create_tool "convertItemsToMeals" \
    "Convert to combo meals" \
    '{"type":"object","properties":{"itemIndices":{"type":"array","items":{"type":"number"}},"drinkBrand":{"type":"string"},"chipsSize":{"type":"string"},"chipsSalt":{"type":"string"}},"required":[]}' \
    'null' \
    'false'

create_tool "getOrderSummary" \
    "Get formatted order summary" \
    '{"type":"object","properties":{},"required":[]}' \
    'null' \
    'false'

create_tool "setPickupTime" \
    "Set custom pickup time" \
    '{"type":"object","properties":{"requestedTime":{"type":"string"}},"required":["requestedTime"]}' \
    'null' \
    'false'

create_tool "estimateReadyTime" \
    "Calculate prep time based on queue" \
    '{"type":"object","properties":{},"required":[]}' \
    '[{"type":"request-start","content":"Let me check how long that will take"}]' \
    'false'

create_tool "sendMenuLink" \
    "SMS menu link to customer" \
    '{"type":"object","properties":{"phoneNumber":{"type":"string"}},"required":["phoneNumber"]}' \
    '[{"type":"request-start","content":"I will text you the menu now"},{"type":"request-complete","content":"I have sent the menu to your phone"}]' \
    'false'

create_tool "sendReceipt" \
    "SMS receipt to customer" \
    '{"type":"object","properties":{"phoneNumber":{"type":"string"}},"required":["phoneNumber"]}' \
    '[{"type":"request-start","content":"Sending your receipt now"},{"type":"request-complete","content":"Receipt sent to your phone"}]' \
    'false'

create_tool "createOrder" \
    "Finalize and save order" \
    '{"type":"object","properties":{"customerName":{"type":"string"},"customerPhone":{"type":"string"},"notes":{"type":"string"}},"required":["customerName","customerPhone"]}' \
    '[{"type":"request-start","content":"Processing your order"},{"type":"request-complete","content":"Your order is confirmed"},{"type":"request-failed","content":"Sorry, there was an issue creating your order. Let me try again"}]' \
    'false'

create_tool "repeatLastOrder" \
    "Reorder previous order" \
    '{"type":"object","properties":{"phoneNumber":{"type":"string"}},"required":["phoneNumber"]}' \
    '[{"type":"request-start","content":"Let me find your last order"}]' \
    'false'

create_tool "endCall" \
    "End call gracefully" \
    '{"type":"object","properties":{},"required":[]}' \
    'null' \
    'false'

echo ""
echo "✅ Created ${#TOOL_IDS[@]} tools with complete configuration"
echo ""

# Update assistant
echo "🔧 Updating assistant..."

TOOL_IDS_JSON=$(printf '%s\n' "${TOOL_IDS[@]}" | jq -R . | jq -s .)

UPDATE_RESPONSE=$(curl -s -X PATCH "https://api.vapi.ai/assistant/$ASSISTANT_ID" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": {
            \"provider\": \"openai\",
            \"model\": \"gpt-4o-mini\",
            \"maxTokens\": 200,
            \"temperature\": 0.4,
            \"toolIds\": $TOOL_IDS_JSON
        }
    }")

TOOL_COUNT=$(echo "$UPDATE_RESPONSE" | jq '.model.toolIds | length // 0')
echo "✅ Assistant updated with $TOOL_COUNT tools"
echo ""

# Verify one tool has all fields
echo "🔍 Verifying configuration..."
SAMPLE_TOOL=$(curl -s -X GET "https://api.vapi.ai/tool/${TOOL_IDS[0]}" -H "Authorization: Bearer $API_KEY")
echo ""
echo "Sample tool configuration:"
echo "$SAMPLE_TOOL" | jq '{
    name: .function.name,
    async: .async,
    hasMessages: (.messages != null),
    server: .server
}'

echo ""
echo "🎉 Complete! All tools configured with messages, async, and server settings"
