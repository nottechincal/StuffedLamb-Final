#!/bin/bash

# ============================================
# Test Suite Runner for Stuffed Lamb
# ============================================

set -e

echo "🧪 Starting Stuffed Lamb Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if server is running
echo "📡 Checking if server is running..."
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Server is not running!"
    echo ""
    echo "Please start the server first:"
    echo "  npm start"
    echo ""
    exit 1
fi

echo "✅ Server is running"
echo ""

# Run tests
echo "🏃 Running test suite..."
echo ""

export WEBHOOK_URL="http://localhost:8000/webhook"

node --test tests/test-suite.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test suite complete!"
