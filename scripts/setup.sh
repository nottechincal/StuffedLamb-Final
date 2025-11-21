#!/bin/bash

# ============================================
# Stuffed Lamb Voice AI - Quick Setup Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
cat << "EOF"
╔═══════════════════════════════════════════════╗
║   🥙 Stuffed Lamb Voice AI Setup Wizard      ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${CYAN}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

echo ""
echo -e "${CYAN}${BOLD}Step 1: Choose Deployment Method${NC}"
echo "  1) Local Testing (ngrok)"
echo "  2) Railway Deployment"
echo "  3) Manual (I'll provide URL later)"
echo ""
read -p "Choose option (1-3): " deploy_option

case $deploy_option in
    1)
        echo -e "${CYAN}Starting local server...${NC}"
        npm start &
        SERVER_PID=$!
        sleep 3

        if command -v ngrok &> /dev/null; then
            echo -e "${GREEN}✅ ngrok found${NC}"
            echo -e "${CYAN}Starting ngrok tunnel...${NC}"
            ngrok http 8000 &
            NGROK_PID=$!
            sleep 3

            # Get ngrok URL
            WEBHOOK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1)
            WEBHOOK_URL="${WEBHOOK_URL}/webhook"

            echo -e "${GREEN}✅ Webhook URL: $WEBHOOK_URL${NC}"
        else
            echo -e "${YELLOW}⚠️  ngrok not found. Install from: https://ngrok.com/download${NC}"
            echo -e "${CYAN}After installing, run: ngrok http 8000${NC}"
            read -p "Enter your ngrok URL (e.g., https://abc123.ngrok.io/webhook): " WEBHOOK_URL
        fi
        ;;

    2)
        if command -v railway &> /dev/null; then
            echo -e "${GREEN}✅ Railway CLI found${NC}"
            echo -e "${CYAN}Deploying to Railway...${NC}"

            railway init --name stuffed-lamb-voice-ai 2>/dev/null || true
            railway up

            echo -e "${GREEN}✅ Deployed to Railway${NC}"
            echo -e "${CYAN}Getting deployment URL...${NC}"

            # Get Railway URL
            WEBHOOK_URL=$(railway domain | grep -o 'https://[^"]*' | head -1)
            WEBHOOK_URL="${WEBHOOK_URL}/webhook"

            echo -e "${GREEN}✅ Webhook URL: $WEBHOOK_URL${NC}"
        else
            echo -e "${YELLOW}⚠️  Railway CLI not found. Install with: npm install -g @railway/cli${NC}"
            echo -e "${CYAN}Or deploy manually at: https://railway.app${NC}"
            read -p "Enter your Railway URL (e.g., https://stuffed-lamb.railway.app/webhook): " WEBHOOK_URL
        fi
        ;;

    3)
        read -p "Enter your webhook URL: " WEBHOOK_URL
        ;;

    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}${BOLD}Step 2: Update VAPI Tools${NC}"

# VAPI credentials (pre-filled from user input)
VAPI_API_KEY="4000447a-37e5-4aa6-b7b3-e692bec2706f"
VAPI_ASSISTANT_ID="977a1a1a-de18-4e2c-9e81-216b6b17dde9"

echo -e "${CYAN}API Key: ${VAPI_API_KEY:0:20}...${NC}"
echo -e "${CYAN}Assistant ID: ${VAPI_ASSISTANT_ID}${NC}"
echo -e "${CYAN}Webhook URL: $WEBHOOK_URL${NC}"
echo ""

# Run update script
chmod +x update-vapi-tools.sh
./update-vapi-tools.sh "$VAPI_API_KEY" "$VAPI_ASSISTANT_ID" "$WEBHOOK_URL"

echo ""
echo -e "${GREEN}${BOLD}✅ Setup Complete!${NC}"
echo ""
echo -e "${CYAN}${BOLD}Next Steps:${NC}"
echo "  1. Test your webhook: curl $WEBHOOK_URL"
echo "  2. Call your VAPI phone number to test"
echo "  3. Check logs: tail -f logs/\$(date +%Y-%m-%d).log"
echo ""
echo -e "${CYAN}${BOLD}Useful Commands:${NC}"
echo "  • Start server: npm start"
echo "  • Dev mode: npm run dev"
echo "  • View logs: tail -f logs/*.log"
echo "  • Update tools: ./update-vapi-tools.sh"
echo ""
echo -e "${GREEN}Happy ordering! 🥙${NC}"

# Cleanup on exit
trap "kill $SERVER_PID $NGROK_PID 2>/dev/null || true" EXIT
