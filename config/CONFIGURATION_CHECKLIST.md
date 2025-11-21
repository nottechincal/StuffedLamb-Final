# ========================================
# STUFFED LAMB - CONFIGURATION CHECKLIST
# ========================================
# Complete this checklist BEFORE running setup.bat

## ✅ PREREQUISITES

### 1. Software Required
- [ ] Node.js 18+ installed (Download: https://nodejs.org)
- [ ] Git installed (Download: https://git-scm.com)
- [ ] Text editor (VS Code, Notepad++, etc.)

### 2. Accounts Required
- [ ] VAPI.ai account (https://vapi.ai)
- [ ] Twilio account (https://twilio.com)
- [ ] Eleven Labs account (https://elevenlabs.io)

## 📋 CONFIGURATION NEEDED

### ⚠️ CRITICAL - You MUST Configure These

#### 1. VAPI Configuration
```
Location: .env file
Required Values:
```
- [ ] `VAPI_API_KEY` - Get from: https://dashboard.vapi.ai → Settings → API Keys
- [ ] `VAPI_ASSISTANT_ID` - Get from: https://dashboard.vapi.ai → Assistants → Your Assistant → ID

**How to get these:**
1. Go to https://dashboard.vapi.ai
2. Click "Settings" → "API Keys" → Copy your API key
3. Click "Assistants" → Select "Stuffed Lamb" → Copy Assistant ID from URL or settings

#### 2. Twilio Configuration
```
Location: .env file
Required Values:
```
- [ ] `TWILIO_ACCOUNT_SID` - Get from: https://console.twilio.com
- [ ] `TWILIO_AUTH_TOKEN` - Get from: https://console.twilio.com
- [ ] `TWILIO_FROM` - Your Twilio phone number (format: +61468033229)

**How to get these:**
1. Go to https://console.twilio.com
2. Copy "Account SID" and "Auth Token" from dashboard
3. Go to "Phone Numbers" → Copy your phone number

#### 3. Webhook URL
```
Location: .env file
Required Value:
```
- [ ] `WEBHOOK_URL` - Your public webhook URL

**Options:**
- **Local Testing:** Use ngrok (run `ngrok http 8000`, copy URL)
- **Production:** Deploy to Railway/Render first, then get URL

#### 4. Shop Details (Already Configured)
```
Location: .env file
Current Values (Update if needed):
```
- [ ] `SHOP_NAME=Stuffed Lamb`
- [ ] `SHOP_ADDRESS=210 Broadway, Reservoir VIC 3073`
- [ ] `SHOP_TIMEZONE=Australia/Melbourne`
- [ ] `SHOP_ORDER_TO=+61423680596` (Phone for order notifications)
- [ ] `MENU_LINK_URL=https://stuffed-lamb.tuckerfox.com.au/`

## 🔐 OPTIONAL Configuration

### Redis (Recommended for Production)
- [ ] `REDIS_HOST` - Default: localhost
- [ ] `REDIS_PORT` - Default: 6379
- [ ] `REDIS_PASSWORD` - If required

**Note:** System works without Redis (uses in-memory sessions)

### Other Settings
- [ ] `PORT` - Default: 8000
- [ ] `SESSION_TTL` - Default: 1800 seconds (30 minutes)
- [ ] `GST_RATE` - Default: 0.10 (10%)

## 📝 STEP-BY-STEP SETUP GUIDE

### Step 1: Get VAPI Credentials

1. **Sign up at VAPI.ai** if you haven't:
   - Go to https://vapi.ai
   - Click "Sign Up" or "Get Started"
   - Complete registration

2. **Get API Key:**
   - Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Copy the key (starts with `4000...` or similar)
   - Paste in `.env` as: `VAPI_API_KEY=your_key_here`

3. **Get Assistant ID:**
   - Dashboard → Assistants
   - If you have "Stuffed Lamb" assistant → Click it → Copy ID from URL or settings
   - If not, you'll create one in setup process
   - Paste in `.env` as: `VAPI_ASSISTANT_ID=your_id_here`

### Step 2: Get Twilio Credentials

1. **Sign up at Twilio:**
   - Go to https://twilio.com/try-twilio
   - Sign up for free trial (includes $15 credit)

2. **Get Account SID and Auth Token:**
   - After signup, you're on the Console Dashboard
   - You'll see "Account SID" and "Auth Token" right there
   - Click "Show" next to Auth Token to reveal it
   - Copy both values

3. **Get Phone Number:**
   - In Twilio Console → "Phone Numbers" → "Manage" → "Buy a number"
   - Search for Australian numbers (+61)
   - Buy one (uses trial credit)
   - Copy the number in format: +61468033229

4. **Paste in .env:**
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_token_here
   TWILIO_FROM=+61468033229
   ```

### Step 3: Setup Webhook URL

**Option A: Local Testing (ngrok)**
1. Download ngrok: https://ngrok.com/download
2. Extract and run: `ngrok http 8000`
3. Copy the HTTPS URL (looks like: https://abc123.ngrok.io)
4. Add `/webhook` to the end
5. Paste in .env: `WEBHOOK_URL=https://abc123.ngrok.io/webhook`

**Option B: Deploy First**
1. Deploy to Railway/Render (see deployment section)
2. Get the URL from dashboard
3. Add `/webhook` to the end
4. Paste in .env: `WEBHOOK_URL=https://your-app.railway.app/webhook`

### Step 4: Verify .env File

Your `.env` should look like:
```env
# VAPI
VAPI_API_KEY=4000447a-37e5-4aa6-b7b3-e692bec2706f
VAPI_ASSISTANT_ID=977a1a1a-de18-4e2c-9e81-216b6b17dde9

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM=+61468033229

# Webhook
WEBHOOK_URL=https://your-url.ngrok.io/webhook

# Shop Details
SHOP_NAME=Stuffed Lamb
SHOP_ORDER_TO=+61423680596
```

## ✅ PRE-FLIGHT CHECKLIST

Before running `setup.bat`, verify:

- [ ] Node.js installed (check: `node --version` should show v18+)
- [ ] `.env` file exists in project root
- [ ] VAPI_API_KEY is set in .env
- [ ] VAPI_ASSISTANT_ID is set in .env (or will be created)
- [ ] TWILIO credentials are set in .env
- [ ] WEBHOOK_URL is set in .env
- [ ] You're connected to the internet
- [ ] No other app is using port 8000

## 🚀 Ready to Run?

If all checkboxes above are ✅, you're ready to run:

```cmd
setup.bat
```

This will:
1. Check prerequisites
2. Install dependencies
3. Setup VAPI tools
4. Run tests
5. Start the server

## 🆘 Troubleshooting

### "Cannot find VAPI_API_KEY"
→ Check `.env` file has `VAPI_API_KEY=your_key_here` (no spaces around =)

### "Twilio credentials not configured"
→ SMS will be disabled but system will still work
→ Add Twilio credentials to .env to enable SMS

### "Port 8000 already in use"
→ Change PORT in .env to 8001 or another free port
→ Or kill the process using port 8000

### "VAPI assistant not found"
→ Double-check VAPI_ASSISTANT_ID in .env
→ Or let setup.bat create a new assistant

## 📞 Need Help?

- Documentation: See `docs/README.md`
- System Prompt: See `docs/SYSTEM_PROMPT.md`
- Business Guide: See `docs/BUSINESS-SCALING.md`
- Full Summary: See `docs/FINAL-SUMMARY.md`

---

**Once configured, run:** `setup.bat`
