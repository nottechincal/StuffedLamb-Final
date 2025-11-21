#!/bin/bash

# ============================================
# REALISTIC VAPI Tools Configuration
# ============================================
# Philosophy: Let the AI speak naturally
# Only add messages for critical/slow operations

API_KEY="4000447a-37e5-4aa6-b7b3-e692bec2706f"
WEBHOOK_URL="https://surveyable-natisha-unsacred.ngrok-free.dev/webhook"
ASSISTANT_ID="977a1a1a-de18-4e2c-9e81-216b6b17dde9"

echo "🎯 Rebuilding tools with REALISTIC configuration..."
echo ""

# Delete all existing tools
echo "🗑️  Cleaning up..."
EXISTING_IDS=$(curl -s -X GET "https://api.vapi.ai/tool" -H "Authorization: Bearer $API_KEY" | jq -r '.[].id')
for ID in $EXISTING_IDS; do
    curl -s -X DELETE "https://api.vapi.ai/tool/$ID" -H "Authorization: Bearer $API_KEY" > /dev/null
done
echo "✅ Cleaned"
echo ""

TOOL_IDS=()

create_tool() {
    local NAME=$1
    local DESC=$2
    local PARAMS=$3
    local MESSAGES=$4

    RESPONSE=$(curl -s -X POST "https://api.vapi.ai/tool" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"function\",
            \"function\": {
                \"name\": \"$NAME\",
                \"description\": \"$DESC\",
                \"parameters\": $PARAMS
            },
            \"async\": false,
            \"messages\": $MESSAGES,
            \"server\": {
                \"url\": \"$WEBHOOK_URL\",
                \"timeoutSeconds\": 20
            }
        }")

    TOOL_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
    if [ -n "$TOOL_ID" ]; then
        TOOL_IDS+=("$TOOL_ID")
        echo "  ✅ $NAME"
    else
        echo "  ❌ $NAME: $RESPONSE"
    fi
}

# ============================================
# FAST TOOLS - NO MESSAGES (instant response)
# ============================================
echo "📦 Creating instant tools (no messages)..."

create_tool "checkOpen" \
    "Check if shop is open" \
    '{"type":"object","properties":{},"required":[]}' \
    'null'

# This is called ONCE at start - but AI can say it naturally
create_tool "getCallerSmartContext" \
    "Get caller phone number, order history, and favorite items" \
    '{"type":"object","properties":{},"required":[]}' \
    'null'

# These are called MANY times - must be silent
create_tool "quickAddItem" \
    "Parse natural language and add item to cart. Examples: '2 large lamb kebabs with garlic sauce', 'small chips', 'coke'" \
    '{"type":"object","properties":{"description":{"type":"string","description":"Natural language item description"}},"required":["description"]}' \
    'null'

create_tool "addMultipleItemsToCart" \
    "Batch add multiple items" \
    '{"type":"object","properties":{"items":{"type":"array"}},"required":["items"]}' \
    'null'

create_tool "getCartState" \
    "Get current cart contents with formatted display" \
    '{"type":"object","properties":{},"required":[]}' \
    'null'

create_tool "removeCartItem" \
    "Remove item by index (0-based)" \
    '{"type":"object","properties":{"itemIndex":{"type":"number"}},"required":["itemIndex"]}' \
    'null'

create_tool "clearCart" \
    "Clear all items from cart" \
    '{"type":"object","properties":{},"required":[]}' \
    'null'

create_tool "editCartItem" \
    "Modify item properties (size, protein, salads, sauces, etc)" \
    '{"type":"object","properties":{"itemIndex":{"type":"number"},"modifications":{"type":"object"}},"required":["itemIndex","modifications"]}' \
    'null'

create_tool "priceCart" \
    "Calculate total with GST breakdown" \
    '{"type":"object","properties":{},"required":[]}' \
    'null'

create_tool "convertItemsToMeals" \
    "Convert kebabs/HSPs to combo meals with discount" \
    '{"type":"object","properties":{"itemIndices":{"type":"array"},"drinkBrand":{"type":"string"},"chipsSize":{"type":"string"},"chipsSalt":{"type":"string"}},"required":[]}' \
    'null'

create_tool "getOrderSummary" \
    "Get formatted summary with pricing" \
    '{"type":"object","properties":{},"required":[]}' \
    'null'

create_tool "setPickupTime" \
    "Set specific pickup time" \
    '{"type":"object","properties":{"requestedTime":{"type":"string"}},"required":["requestedTime"]}' \
    'null'

create_tool "estimateReadyTime" \
    "Calculate prep time based on current queue" \
    '{"type":"object","properties":{},"required":[]}' \
    'null'

create_tool "repeatLastOrder" \
    "Copy previous order to cart" \
    '{"type":"object","properties":{"phoneNumber":{"type":"string"}},"required":["phoneNumber"]}' \
    'null'

create_tool "endCall" \
    "End call gracefully" \
    '{"type":"object","properties":{},"required":[]}' \
    'null'

echo ""
echo "📨 Creating tools with confirmation messages..."

# ============================================
# SLOW/CRITICAL TOOLS - WITH MESSAGES
# ============================================

# SMS operations - user expects confirmation
create_tool "sendMenuLink" \
    "Text menu link to customer phone" \
    '{"type":"object","properties":{"phoneNumber":{"type":"string"}},"required":["phoneNumber"]}' \
    '[{"type":"request-complete","content":"Sent"}]'

create_tool "sendReceipt" \
    "Text order receipt to customer" \
    '{"type":"object","properties":{"phoneNumber":{"type":"string"}},"required":["phoneNumber"]}' \
    '[{"type":"request-complete","content":"Done"}]'

# Order creation - CRITICAL operation
create_tool "createOrder" \
    "Finalize order and save to database. Must call AFTER setting pickup time" \
    '{"type":"object","properties":{"customerName":{"type":"string"},"customerPhone":{"type":"string"},"notes":{"type":"string"}},"required":["customerName","customerPhone"]}' \
    '[{"type":"request-complete","content":"All set"},{"type":"request-failed","content":"Sorry, something went wrong. Let me try that again"}]'

echo ""
echo "✅ Created ${#TOOL_IDS[@]} tools"
echo ""

# Update assistant
TOOL_IDS_JSON=$(printf '%s\n' "${TOOL_IDS[@]}" | jq -R . | jq -s .)

curl -s -X PATCH "https://api.vapi.ai/assistant/$ASSISTANT_ID" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"model\":{\"provider\":\"openai\",\"model\":\"gpt-4o-mini\",\"maxTokens\":200,\"temperature\":0.4,\"toolIds\":$TOOL_IDS_JSON}}" > /dev/null

echo "✅ Assistant updated"
echo ""
echo "📊 Configuration Summary:"
echo "  • 15 instant tools (no messages)"
echo "  • 3 confirmation tools (SMS + order)"
echo "  • Total: 18 tools"
echo ""
echo "🎯 Philosophy: Let AI speak naturally, only confirm critical actions"
