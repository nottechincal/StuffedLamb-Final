# 🥙 Stuffed Lamb - Voice AI Ordering System

A complete voice ordering system for Stuffed Lamb restaurant, powered by VAPI.ai, Twilio, and Eleven Labs.

## 🎯 Features

- **Voice AI Ordering** - Natural conversation ordering via VAPI.ai with Eleven Labs voice
- **Smart NLP Parser** - Understands natural language like "2 large lamb kebabs with garlic sauce"
- **Session Management** - Redis-backed or in-memory session storage
- **Order Management** - Complete order lifecycle with customer history
- **SMS Notifications** - Order receipts and shop notifications via Twilio
- **Combo Meals** - Automatic meal conversions with discounts
- **Business Hours** - Automatic open/closed detection with timezone support
- **Customer Intelligence** - Order history, favorite items, smart greetings

## 📋 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   VAPI.ai   │────▶│   Webhook    │────▶│   Redis/    │
│  (Voice AI) │     │    Server    │     │  In-Memory  │
└─────────────┘     └──────────────┘     └─────────────┘
      │                     │
      │                     ▼
┌─────────────┐     ┌──────────────┐
│ Eleven Labs │     │    Twilio    │
│   (Voice)   │     │    (SMS)     │
└─────────────┘     └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Redis (optional, will use in-memory if unavailable)
- Twilio account (for SMS)
- VAPI.ai account (for voice AI)
- Eleven Labs account (for voice synthesis)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd StuffedLamb-Final

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Configuration

Edit `.env` with your actual credentials:

```env
# Server
PORT=8000
HOST=0.0.0.0

# Business Details
SHOP_NAME=Stuffed Lamb
SHOP_ADDRESS=210 Broadway, Reservoir VIC 3073
SHOP_TIMEZONE=Australia/Melbourne
SHOP_ORDER_TO=+61423680596

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+61468033229

# Menu Link
MENU_LINK_URL=https://stuffed-lamb.tuckerfox.com.au/

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Running the Server

```bash
# Production mode
npm start

# Development mode with auto-reload
npm run dev
```

The server will start on `http://localhost:8000`

## 🔧 VAPI.ai Setup

### 1. Create Assistant

In VAPI.ai dashboard:
1. Create new assistant
2. Set voice provider to **Eleven Labs**
3. Configure your preferred voice

### 2. Import Tools

1. Upload `vapi-tools.json` to your VAPI assistant
2. Set webhook URL to: `https://your-domain.com/webhook`
3. Ensure all tools are enabled

### 3. Connect Phone Number

1. Add Twilio phone number in VAPI
2. Set assistant as default for incoming calls

## 📱 Available Functions

### Order Management
- `quickAddItem` - Smart NLP parser for natural language orders
- `addMultipleItemsToCart` - Batch add items
- `getCartState` - View current cart
- `editCartItem` - Modify cart items
- `removeCartItem` - Remove items
- `clearCart` - Clear entire cart

### Pricing & Combos
- `priceCart` - Calculate total with GST
- `convertItemsToMeals` - Convert to combo meals
- `getOrderSummary` - Get formatted order summary

### Customer Service
- `checkOpen` - Check business hours
- `getCallerSmartContext` - Get customer history and suggestions
- `repeatLastOrder` - Reorder previous order
- `sendMenuLink` - SMS menu link
- `sendReceipt` - SMS order receipt

### Order Completion
- `estimateReadyTime` - Auto-calculate pickup time
- `setPickupTime` - Custom pickup time
- `createOrder` - Finalize and save order
- `endCall` - End conversation gracefully

## 🗂️ Project Structure

```
StuffedLamb-Final/
├── src/
│   ├── server.js              # Main Express server
│   ├── services/
│   │   ├── sessionManager.js  # Session storage (Redis/in-memory)
│   │   ├── cartService.js     # Cart operations
│   │   ├── nlpParser.js       # Natural language parser
│   │   ├── orderService.js    # Order management
│   │   └── smsService.js      # Twilio SMS integration
│   └── utils/
│       ├── businessHours.js   # Hours & time calculations
│       └── logger.js          # Logging utility
├── data/
│   ├── menu.json             # Menu items & pricing
│   ├── business.json         # Business configuration
│   ├── customers.json        # Customer database
│   └── orders/               # Order files
├── logs/                     # Application logs
├── vapi-tools.json          # VAPI function definitions
├── package.json
└── .env                     # Environment variables
```

## 💡 Usage Examples

### Natural Language Ordering

The NLP parser understands phrases like:
- "2 large lamb kebabs with garlic sauce"
- "small chips with chicken salt"
- "coke"
- "large chicken HSP no salad"

### Customer Intelligence

The system tracks:
- Order history (last 20 orders)
- Favorite items
- Total spent
- Custom greetings for returning customers

### Combo Meals

Automatically converts items to combos:
- Kebab Combo = Kebab + Chips + Drink (-$2)
- HSP Combo = HSP + Drink (-$1.50)

## 📊 Data Storage

### Orders
Stored as JSON files in `data/orders/`:
```
{
  "id": "uuid",
  "orderNumber": "20241121-001",
  "customerName": "John Doe",
  "items": [...],
  "pricing": {...},
  "status": "pending"
}
```

### Customers
Stored in `data/customers.json`:
```
{
  "+61412345678": {
    "totalOrders": 5,
    "totalSpent": "150.50",
    "orders": [...],
    "favoriteItems": {...}
  }
}
```

## 🔒 Security

- Environment variables for all sensitive data
- CORS configuration
- Input validation on all endpoints
- Session expiry (30 minutes default)
- No passwords or secrets in code

## 🧪 Testing

Test the webhook locally:

```bash
# Health check
curl http://localhost:8000/health

# Test webhook (simulate VAPI call)
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "toolCalls": [{
        "id": "test",
        "function": {
          "name": "checkOpen",
          "arguments": {}
        }
      }]
    }
  }'
```

## 🚀 Deployment

### Using Railway/Render/Heroku

1. Connect your Git repository
2. Add environment variables
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Deploy!

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

### Ngrok (for local testing)

```bash
# Expose local server
ngrok http 8000

# Use the ngrok URL in VAPI webhook settings
```

## 📈 Monitoring

Logs are written to:
- Console (with colors and emojis)
- `logs/YYYY-MM-DD.log` (JSON format)

Monitor with:
```bash
# Watch logs
tail -f logs/$(date +%Y-%m-%d).log

# Pretty print
tail -f logs/$(date +%Y-%m-%d).log | jq .
```

## 🔧 Customization

### Adding Menu Items

Edit `data/menu.json`:
```json
{
  "category_name": {
    "items": [
      {
        "id": "item-id",
        "name": "Item Name",
        "price": 10.00
      }
    ]
  }
}
```

### Modifying Business Hours

Edit `data/business.json`:
```json
{
  "hours": {
    "monday": { "open": "11:00", "close": "21:00" }
  }
}
```

### Custom NLP Patterns

Edit `src/services/nlpParser.js` to add custom keywords and patterns.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🆘 Support

For issues or questions:
- GitHub Issues: [your-repo/issues]
- Email: support@stuffed-lamb.com.au

## 🙏 Credits

Built with:
- [VAPI.ai](https://vapi.ai) - Voice AI platform
- [Eleven Labs](https://elevenlabs.io) - Voice synthesis
- [Twilio](https://twilio.com) - SMS service
- [Express.js](https://expressjs.com) - Web framework
- [Node.js](https://nodejs.org) - Runtime

---

Made with ❤️ for Stuffed Lamb
