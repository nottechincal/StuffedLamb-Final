# 🚀 STUFFED LAMB - QUICK START GUIDE

**For Impatient People Who Just Want It Working NOW**

---

## ⚡ 60-Second Setup

### 1. Configure .env (2 minutes)

Edit `.env` file and add these 4 things:

```env
VAPI_API_KEY=your_vapi_key_here
VAPI_ASSISTANT_ID=your_assistant_id
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM=+61468033229
WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhook
```

**Where to get these:**
- **VAPI**: https://dashboard.vapi.ai → Settings → API Keys
- **Twilio**: https://console.twilio.com → Dashboard (Account SID & Auth Token)
- **Webhook URL**: Run `ngrok http 8000`, copy the HTTPS URL + `/webhook`

### 2. Run Setup (1 click)

```cmd
setup.bat
```

That's it! ✅

---

## 📋 WHAT YOU NEED BEFORE STARTING

| Item | Where to Get | Required? |
|------|--------------|-----------|
| **Node.js 18+** | https://nodejs.org | ✅ YES |
| **VAPI Account** | https://vapi.ai | ✅ YES |
| **Twilio Account** | https://twilio.com | ✅ YES |
| **ngrok** (for local testing) | https://ngrok.com | ⚠️  Optional (use for testing) |
| **Git Bash** (Windows) | https://git-scm.com | ⚠️  Recommended |

---

## 🎯 CONFIGURATION CHECKLIST

Before running `setup.bat`, make sure you have:

- [ ] Installed Node.js 18+
- [ ] Created VAPI account and got API key
- [ ] Created Twilio account and got credentials
- [ ] Bought a Twilio phone number
- [ ] Edited `.env` file with all your credentials
- [ ] (Optional) Running ngrok for local testing

**Full details:** See `config/CONFIGURATION_CHECKLIST.md`

---

## 🏃 RUNNING THE SYSTEM

### Option 1: Auto Setup (Recommended)
```cmd
setup.bat
```

This will:
1. Check prerequisites
2. Install dependencies
3. Configure VAPI tools
4. Run tests
5. Start server

### Option 2: Manual Steps

```cmd
REM 1. Install dependencies
npm install

REM 2. Setup VAPI tools (requires Git Bash)
bash scripts\rebuild-tools-realistic.sh

REM 3. Start server
npm start

REM 4. In another terminal, expose with ngrok
ngrok http 8000
```

---

## 🧪 TESTING

### Quick Test
```cmd
REM Make sure server is running first!
curl http://localhost:8000/health
```

### Full Test Suite
```cmd
bash scripts\test-all-endpoints.sh
```

### Manual Test
Call your VAPI phone number and say:
- "Lamb Mandi"
- "Add a coke"
- "That's it"

---

## 🔧 COMMON ISSUES

### "Node.js not found"
→ Install Node.js from https://nodejs.org
→ Restart terminal after installing

### "VAPI_API_KEY not configured"
→ Edit `.env` file and add your VAPI API key
→ No spaces around the `=` sign

### "Port 8000 already in use"
→ Kill the process: `taskkill /F /IM node.exe`
→ Or change PORT in .env to 8001

### "Twilio credentials not configured"
→ SMS features will be disabled but system still works
→ Add Twilio credentials to enable SMS

### "The client is closed" (Redis error)
→ This is normal - system falls back to in-memory sessions
→ Everything still works, just without persistence

### "Tests failing"
→ Make sure server is running: `npm start`
→ Some failures are expected during initial setup
→ Main operations should still work

---

## 📞 GETTING CREDENTIALS

### VAPI API Key & Assistant ID

1. **Sign up:** https://vapi.ai
2. **Get API Key:**
   - Dashboard → Settings → API Keys → Create
   - Copy the key
3. **Get Assistant ID:**
   - Dashboard → Assistants → Your Assistant
   - Copy ID from URL or settings panel

### Twilio Credentials

1. **Sign up:** https://twilio.com/try-twilio
2. **Get SID & Token:**
   - After signup, you're on Console Dashboard
   - Account SID and Auth Token are right there
   - Click "Show" to reveal Auth Token
3. **Get Phone Number:**
   - Phone Numbers → Manage → Buy a number
   - Search for Australian (+61) numbers
   - Buy one (uses free trial credit)
   - Copy in format: `+61468033229`

### Webhook URL

**Local Testing:**
1. Download ngrok: https://ngrok.com/download
2. Run: `ngrok http 8000`
3. Copy the HTTPS URL (like: https://abc123.ngrok.io)
4. Add `/webhook` to the end

**Production:**
1. Deploy to Railway/Render (see deployment guide)
2. Get URL from dashboard
3. Add `/webhook` to the end

---

## 📁 PROJECT STRUCTURE

```
StuffedLamb-Final/
├── setup.bat           ⭐ RUN THIS FIRST
├── .env                ⭐ CONFIGURE THIS
├── package.json        Dependencies
│
├── config/
│   └── CONFIGURATION_CHECKLIST.md  Detailed setup guide
│
├── docs/
│   ├── FINAL-SUMMARY.md         Complete system overview
│   ├── SYSTEM_PROMPT.md         AI behavior guide
│   ├── BUSINESS-SCALING.md      Scaling strategy
│   └── README.md                Technical docs
│
├── scripts/
│   ├── rebuild-tools-realistic.sh  Setup VAPI tools
│   ├── test-all-endpoints.sh       Run all tests
│   └── run-tests.sh                Quick test runner
│
├── src/
│   ├── server.js               Main webhook server
│   ├── services/               Business logic
│   └── utils/                  Utilities
│
└── data/
    ├── menu.json              Menu items & pricing
    ├── business.json          Business config
    └── orders/                Saved orders
```

---

## ⚡ QUICK COMMANDS

```cmd
REM Start server
npm start

REM Run tests
bash scripts\test-all-endpoints.sh

REM Update VAPI tools
bash scripts\rebuild-tools-realistic.sh

REM Check health
curl http://localhost:8000/health

REM View logs
type logs\*.log

REM Stop server
taskkill /F /IM node.exe
```

---

## 🎓 NEXT STEPS

After setup completes:

1. **Test locally:** Call your VAPI number
2. **Review logs:** Check `logs\*.log` for any errors
3. **Read documentation:**
   - System behavior: `docs\SYSTEM_PROMPT.md`
   - Full guide: `docs\FINAL-SUMMARY.md`
   - Business plan: `docs\BUSINESS-SCALING.md`

4. **Deploy to production:**
   - Railway: `railway up`
   - Render: Connect GitHub repo
   - Update WEBHOOK_URL in VAPI dashboard

5. **Scale it:**
   - See `docs\BUSINESS-SCALING.md` for multi-restaurant strategy
   - Start with 5 clients, grow to 50+
   - Multi-tenant SaaS architecture included

---

## 🆘 NEED HELP?

1. **Configuration issues:** See `config\CONFIGURATION_CHECKLIST.md`
2. **System not working:** Check logs in `logs\` folder
3. **VAPI not calling webhook:** Verify webhook URL in VAPI dashboard
4. **Detailed docs:** See `docs\FINAL-SUMMARY.md`

---

## ✅ VERIFICATION

System is working correctly if:

- [ ] `npm start` runs without errors
- [ ] `curl http://localhost:8000/health` returns `{"status":"ok"}`
- [ ] Calling VAPI number connects
- [ ] AI can take an order
- [ ] Order appears in `data/orders/`

---

**Ready? Run:** `setup.bat`

🎉 **That's it! You're done!**
