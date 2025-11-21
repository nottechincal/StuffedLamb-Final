#!/bin/bash

API_KEY="4000447a-37e5-4aa6-b7b3-e692bec2706f"

echo "🗑️  Deleting ALL VAPI tools..."
echo ""

# Get all tool IDs
TOOL_IDS=$(curl -s -X GET "https://api.vapi.ai/tool" -H "Authorization: Bearer $API_KEY" | jq -r '.[].id')

COUNT=0
for ID in $TOOL_IDS; do
    echo "  Deleting $ID..."
    curl -s -X DELETE "https://api.vapi.ai/tool/$ID" -H "Authorization: Bearer $API_KEY" > /dev/null
    COUNT=$((COUNT + 1))
done

echo ""
echo "✅ Deleted $COUNT tools"
echo ""

# Verify all deleted
REMAINING=$(curl -s -X GET "https://api.vapi.ai/tool" -H "Authorization: Bearer $API_KEY" | jq -r 'length')
echo "Remaining tools: $REMAINING"
