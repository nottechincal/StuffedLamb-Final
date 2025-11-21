#!/bin/bash

# ============================================
# Stop Development Environment
# ============================================

echo "🛑 Stopping Stuffed Lamb development environment..."
echo ""

# Detect OS
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    echo "Stopping Node.js server..."
    taskkill //F //IM node.exe 2>/dev/null || echo "  (no Node.js processes found)"

    echo "Stopping ngrok..."
    taskkill //F //IM ngrok.exe 2>/dev/null || echo "  (no ngrok processes found)"

else
    # macOS / Linux
    echo "Stopping Node.js server..."
    pkill -f 'node.*server.js' || echo "  (no server process found)"

    echo "Stopping ngrok..."
    pkill -f ngrok || echo "  (no ngrok process found)"
fi

echo ""
echo "✅ Development environment stopped"
