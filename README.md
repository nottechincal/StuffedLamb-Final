# Stuffed Lamb Voice AI Ordering System

Automated phone ordering system for Stuffed Lamb restaurant powered by VAPI, Node.js, and Twilio.

---

## 🚀 Quick Start

### Windows

**Double-click:** `START.bat`

That's it! The script will:
- ✅ Check dependencies
- ✅ Start the server
- ✅ Start ngrok tunnel
- ✅ Show your public URL
- ✅ Provide next steps

### Mac/Linux

```bash
bash scripts/dev/start-dev.sh
```

### Manual Start

```bash
# Terminal 1
npm start

# Terminal 2
ngrok http 8000
```

---

## 📖 Documentation

- **Quick Start Guide:** [QUICKSTART.md](QUICKSTART.md)
- **Production Deployment:** [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md)
- **System Overview:** [docs/FINAL-SUMMARY.md](docs/FINAL-SUMMARY.md)
- **Configuration:** [docs/CONFIGURATION.md](docs/CONFIGURATION.md)

---

## 📁 Project Structure

```
StuffedLamb-Final/
├── START.bat                 # 🚀 One-click starter (Windows)
├── package.json              # Dependencies
├── .env                      # Configuration (create from .env.example)
│
├── src/                      # Source code
│   ├── server.js            # Main Express server
│   ├── services/            # Business logic
│   └── utils/               # Helper functions
│
├── scripts/                  # Automation scripts
│   ├── dev/                 # Development scripts
│   │   ├── start-dev.ps1   # PowerShell starter
│   │   ├── start-dev.sh    # Bash starter
│   │   ├── stop-dev.ps1    # Stop everything
│   │   └── stop-dev.sh
│   ├── production/          # Production deployment
│   │   └── deploy-production.sh
│   ├── setup/               # Initial setup
│   │   └── setup.bat
│   └── tools/               # VAPI tool management
│       ├── rebuild-tools-realistic.sh
│       ├── update-webhook.sh
│       └── cleanup-all-tools.sh
│
├── config/                   # Configuration files
│   ├── ecosystem.config.js  # PM2 config for production
│   └── vapi-tools.json      # VAPI tool definitions
│
├── data/                     # Business data
│   ├── menu.json            # Restaurant menu
│   ├── business.json        # Hours, settings
│   ├── customers.json       # Customer history
│   └── orders/              # Saved orders
│
├── docs/                     # Documentation
│   ├── PRODUCTION-DEPLOYMENT.md
│   ├── FINAL-SUMMARY.md
│   └── ...
│
└── templates/                # Multi-tenant templates
    └── kebab-shop/          # Kebab shop backup config
```

---

## 🛠️ Development Commands

```bash
# Start development environment
npm start                     # Start server only
bash scripts/dev/start-dev.sh # Start server + ngrok (recommended)

# Stop development
bash scripts/dev/stop-dev.sh

# Production commands
npm run pm2:start             # Start with PM2
npm run pm2:logs              # View logs
npm run pm2:restart           # Restart server
npm run pm2:stop              # Stop server

# VAPI tools
bash scripts/tools/rebuild-tools-realistic.sh    # Rebuild all tools
bash scripts/tools/update-webhook.sh <URL>       # Update webhook URL
bash scripts/tools/cleanup-all-tools.sh          # Delete all tools
```

---

## ⚙️ Configuration

### First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit .env** and add your credentials:
   - `VAPI_API_KEY` - From https://dashboard.vapi.ai
   - `VAPI_ASSISTANT_ID` - Your assistant ID
   - `TWILIO_ACCOUNT_SID` - From https://console.twilio.com
   - `TWILIO_AUTH_TOKEN` - Twilio auth token
   - `TWILIO_PHONE_NUMBER` - Your Twilio number

4. **Install ngrok:**
   - Download from https://ngrok.com/download
   - Run: `ngrok config add-authtoken YOUR_TOKEN`

### Update Webhook URL

After ngrok starts, update VAPI:

```bash
bash scripts/tools/update-webhook.sh https://your-url.ngrok-free.app
```

---

## 🧪 Testing

### Test Health Endpoint

```bash
curl http://localhost:8000/health
```

### Test Webhook

```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"call":{"id":"test"},"toolCalls":[{"id":"1","function":{"name":"checkOpen","arguments":"{}"}}]}}'
```

### Test Real Call

Call your VAPI number and try:
- "Hi, I'd like a lamb mandi"
- "Add nuts and a coke"
- "Send me the menu to 0423680596"

---

## 📊 Monitoring

### Development

**Server logs:** Check the server terminal window

**ngrok logs:** Visit http://localhost:4040

**VAPI logs:** Visit https://dashboard.vapi.ai

### Production

```bash
# PM2 logs
npm run pm2:logs

# File logs
tail -f logs/*.log

# PM2 monitoring
npm run pm2:monitor
```

---

## 🚀 Production Deployment

See [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md) for full guide.

**Quick Deploy to Railway (Recommended):**

1. Sign up at https://railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy automatically
5. Update VAPI webhook URL

**Cost:** ~$5-10/month

---

## 🛑 Stopping the System

### Development

**Windows:**
- Close terminal windows, OR
- Run: `powershell scripts/dev/stop-dev.ps1`

**Mac/Linux:**
```bash
bash scripts/dev/stop-dev.sh
```

### Production

```bash
npm run pm2:stop
```

---

## 📞 Support

- **VAPI Dashboard:** https://dashboard.vapi.ai
- **Twilio Console:** https://console.twilio.com
- **ngrok Dashboard:** http://localhost:4040 (when running)

---

## 🏪 About Stuffed Lamb

**Address:** 210 Broadway, Reservoir VIC 3073

**Menu:**
- Jordanian Mansaf - $33
- Lamb Mandi - $28
- Chicken Mandi - $23
- Sides & Drinks

**Hours:**
- Closed: Monday & Tuesday
- Wed-Fri: 1pm - 9pm
- Sat-Sun: 1pm - 10pm

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎯 Quick Links

- **Start System:** Double-click `START.bat` (Windows)
- **Documentation:** [QUICKSTART.md](QUICKSTART.md)
- **Production Guide:** [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md)
- **Configuration Help:** [docs/CONFIGURATION.md](docs/CONFIGURATION.md)

---

**Ready to go?** Double-click `START.bat` and start taking orders! 🎉
