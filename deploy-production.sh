#!/bin/bash

# Production Deployment Script for Stuffed Lamb VAPI

echo "🚀 Deploying Stuffed Lamb to Production..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env from .env.example and configure your production settings."
    exit 1
fi

# Check if NODE_ENV is production
if ! grep -q "NODE_ENV=production" .env; then
    echo "⚠️  Warning: NODE_ENV is not set to production in .env"
    echo "Do you want to continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Installing dependencies..."
npm install --production
echo ""

echo "🗂️  Creating required directories..."
mkdir -p data/orders logs
echo ""

echo "🔍 Testing server startup..."
timeout 5 node src/server.js > /dev/null 2>&1
if [ $? -eq 124 ]; then
    echo "✅ Server can start successfully"
else
    echo "❌ Server failed to start! Check your configuration."
    exit 1
fi
echo ""

echo "🔄 Starting with PM2..."
if command -v pm2 &> /dev/null; then
    # Stop if already running
    pm2 delete stuffed-lamb 2>/dev/null || true

    # Start
    pm2 start ecosystem.config.js --env production

    # Save process list
    pm2 save

    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📊 Status:"
    pm2 status
    echo ""
    echo "📋 Next steps:"
    echo "  1. Update your VAPI webhook URL:"
    echo "     bash scripts/update-webhook.sh https://your-production-url.com"
    echo ""
    echo "  2. Test your endpoint:"
    echo "     curl https://your-production-url.com/health"
    echo ""
    echo "  3. Monitor logs:"
    echo "     npm run pm2:logs"
    echo ""
    echo "  4. Call your VAPI number to test end-to-end"
    echo ""
else
    echo "❌ PM2 not installed!"
    echo ""
    echo "Install PM2 globally:"
    echo "  npm install -g pm2"
    echo ""
    echo "Or run directly (not recommended for production):"
    echo "  npm start"
fi
