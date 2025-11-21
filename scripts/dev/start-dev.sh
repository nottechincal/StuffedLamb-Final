#!/bin/bash

# ============================================
# Stuffed Lamb - Development Starter
# ============================================
# Starts both the server and ngrok automatically

echo "🚀 Starting Stuffed Lamb Development Environment..."
echo ""

# Check if server is already running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Server already running on port 8000"
    echo "Kill it first with: pkill -f 'node.*server.js' or taskkill /F /IM node.exe"
    exit 1
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found!"
    echo ""
    echo "Install ngrok:"
    echo "  1. Download from https://ngrok.com/download"
    echo "  2. Extract and add to PATH"
    echo "  3. Run: ngrok config add-authtoken YOUR_TOKEN"
    exit 1
fi

# Detect OS
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash / MSYS)
    echo "📟 Detected Windows environment"
    echo ""

    # Start server in new terminal
    echo "🟢 Starting server in new window..."
    start cmd //c "title Stuffed Lamb Server && npm start"

    # Wait for server to start
    echo "⏳ Waiting for server to be ready..."
    sleep 5

    # Start ngrok in new terminal
    echo "🌐 Starting ngrok in new window..."
    start cmd //c "title ngrok && ngrok http 8000"

    # Wait for ngrok to start
    sleep 3

elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📟 Detected macOS environment"
    echo ""

    # Start server in new terminal
    echo "🟢 Starting server in new Terminal tab..."
    osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && npm start"'

    # Wait for server
    sleep 5

    # Start ngrok in new terminal
    echo "🌐 Starting ngrok in new Terminal tab..."
    osascript -e 'tell app "Terminal" to do script "ngrok http 8000"'

    sleep 3

else
    # Linux
    echo "📟 Detected Linux environment"
    echo ""

    # Try to detect terminal emulator
    if command -v gnome-terminal &> /dev/null; then
        TERM_CMD="gnome-terminal --"
    elif command -v xterm &> /dev/null; then
        TERM_CMD="xterm -e"
    elif command -v konsole &> /dev/null; then
        TERM_CMD="konsole -e"
    else
        echo "⚠️  No terminal emulator detected, running in background..."
        npm start &
        sleep 5
        ngrok http 8000 &
        sleep 3
        echo ""
        echo "✅ Server and ngrok running in background"
        echo ""
        echo "To see ngrok URL: curl http://localhost:4040/api/tunnels"
        exit 0
    fi

    # Start in new terminals
    echo "🟢 Starting server..."
    $TERM_CMD bash -c "npm start" &

    sleep 5

    echo "🌐 Starting ngrok..."
    $TERM_CMD bash -c "ngrok http 8000" &

    sleep 3
fi

echo ""
echo "✅ Development environment started!"
echo ""
echo "📊 Status:"
echo "  • Server: http://localhost:8000"
echo "  • Ngrok dashboard: http://localhost:4040"
echo ""

# Get ngrok URL
echo "🔍 Fetching ngrok URL..."
sleep 2

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)

if [ -n "$NGROK_URL" ]; then
    echo "✅ Ngrok URL: $NGROK_URL"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Update VAPI webhook:"
    echo "     bash scripts/tools/update-webhook.sh $NGROK_URL"
    echo ""
    echo "  2. Test webhook:"
    echo "     curl $NGROK_URL/health"
    echo ""
    echo "  3. Call your VAPI number to test!"
    echo ""
else
    echo "⚠️  Could not fetch ngrok URL automatically"
    echo ""
    echo "📋 Manual steps:"
    echo "  1. Check ngrok window for your URL"
    echo "  2. Update VAPI: bash scripts/tools/update-webhook.sh https://your-url.ngrok-free.app"
    echo ""
fi

echo "🛑 To stop everything:"
echo "  • Close the terminal windows, OR"
echo "  • Run: bash scripts/dev/stop-dev.sh"
echo ""
