#!/bin/bash

# Update VAPI webhook URL for all tools and assistant

if [ -z "$1" ]; then
    echo "❌ Error: Please provide ngrok URL"
    echo ""
    echo "Usage: bash scripts/update-webhook.sh https://your-url.ngrok-free.app"
    echo ""
    echo "Example: bash scripts/update-webhook.sh https://abc123.ngrok-free.app"
    exit 1
fi

NGROK_URL="$1"
WEBHOOK_URL="${NGROK_URL}/webhook"
API_KEY="4000447a-37e5-4aa6-b7b3-e692bec2706f"
ASSISTANT_ID="977a1a1a-de18-4e2c-9e81-216b6b17dde9"

echo "🔄 Updating webhook URL to: $WEBHOOK_URL"
echo ""

# Update all tools
echo "📦 Updating tools..."
TOOL_IDS=$(curl -s -X GET "https://api.vapi.ai/tool" -H "Authorization: Bearer $API_KEY" | jq -r '.[].id')

COUNT=0
for TOOL_ID in $TOOL_IDS; do
    # Get current tool config
    TOOL_DATA=$(curl -s -X GET "https://api.vapi.ai/tool/$TOOL_ID" -H "Authorization: Bearer $API_KEY")

    # Update server URL
    UPDATED_TOOL=$(echo "$TOOL_DATA" | jq --arg url "$WEBHOOK_URL" '.server.url = $url')

    # Send update
    curl -s -X PATCH "https://api.vapi.ai/tool/$TOOL_ID" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$UPDATED_TOOL" > /dev/null

    COUNT=$((COUNT + 1))
    echo "  ✅ Updated tool $COUNT"
done

echo ""
echo "🤖 Updating assistant..."

# Update assistant
curl -s -X PATCH "https://api.vapi.ai/assistant/$ASSISTANT_ID" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"server\": {\"url\": \"$WEBHOOK_URL\", \"timeoutSeconds\": 20}}" > /dev/null

echo "  ✅ Assistant updated"
echo ""

# Update .env file
echo "📝 Updating .env file..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" .env
else
    # Linux
    sed -i "s|WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" .env
fi

echo "  ✅ .env updated"
echo ""
echo "✅ Done! Updated $COUNT tools and 1 assistant"
echo ""
echo "🧪 Test your webhook:"
echo "  curl $WEBHOOK_URL"
