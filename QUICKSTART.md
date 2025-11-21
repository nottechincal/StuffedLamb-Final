# Quick Start - Stuffed Lamb Voice AI

Get your voice ordering system running in **under 5 minutes**.

---

## Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org)
2. **ngrok account** - [Sign up free](https://ngrok.com)
3. **Git Bash** (Windows) - [Download here](https://git-scm.com)

---

## Setup (One Time)

### 1. Install ngrok

**Windows:**
```bash
# Download from https://ngrok.com/download
# Extract ngrok.exe to a folder in your PATH (e.g., C:\Windows\System32)

# Set your authtoken (get from https://dashboard.ngrok.com/get-started/your-authtoken)
ngrok config add-authtoken YOUR_TOKEN_HERE
```

**Mac:**
```bash
brew install ngrok
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 2. Install Dependencies

```bash
cd StuffedLamb-Final
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your credentials (VAPI_API_KEY, Twilio, etc.)
```

---

## Running Development Server

### Option A: One-Click Start (Recommended)

**Windows - Double-click:**
```
start-dev.bat
```

**Or in Git Bash/Terminal:**
```bash
bash start-dev.sh
```

This automatically:
- ✅ Starts the Node.js server
- ✅ Starts ngrok tunnel
- ✅ Opens both in new windows
- ✅ Shows your ngrok URL

### Option B: Manual Start

**Terminal 1 - Start Server:**
```bash
npm start
```

**Terminal 2 - Start ngrok:**
```bash
ngrok http 8000
```

---

## Update VAPI Webhook

After ngrok starts, you'll see a URL like:
```
https://abc-123-xyz.ngrok-free.app
```

**Update VAPI to use this URL:**
```bash
bash scripts/update-webhook.sh https://abc-123-xyz.ngrok-free.app
```

---

## Test Your System

### 1. Test Webhook Health

```bash
curl https://your-ngrok-url.ngrok-free.app/health
```

Should return: `{"status":"ok","shop":"Stuffed Lamb"}`

### 2. Test with Real Call

Call your VAPI phone number and try:
- "Hi, I'd like a lamb mandi"
- "Add a coke"
- "Send me the menu to 0423680596"

### 3. Monitor Logs

**Server logs:**
- Check the "Stuffed Lamb Server" terminal window
- Or run: `tail -f logs/*.log`

**VAPI logs:**
- Visit: https://dashboard.vapi.ai

---

## Stopping Development

### Easy Way:
```bash
bash scripts/stop-dev.sh
```

### Manual Way:
- Close both terminal windows (server + ngrok)

### Force Kill (if stuck):
```bash
# Windows
taskkill /F /IM node.exe
taskkill /F /IM ngrok.exe

# Mac/Linux
pkill -f node
pkill -f ngrok
```

---

## Common Issues

### "Port 8000 already in use"

**Fix:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /F /PID [PID_NUMBER]

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### "ngrok not found"

**Fix:**
- Download from https://ngrok.com/download
- Extract and add to PATH
- Restart terminal

### "pipeline-error-openai-400-bad-request"

**Fix:**
- Your ngrok URL expired or changed
- Run: `bash scripts/update-webhook.sh https://NEW_URL.ngrok-free.app`

### "VAPI can't reach webhook"

**Fix:**
1. Check ngrok is running: visit http://localhost:4040
2. Test webhook: `curl https://your-url.ngrok-free.app/health`
3. Check firewall isn't blocking ngrok

---

## Daily Development Workflow

```bash
# 1. Start everything
bash start-dev.sh

# 2. Note your ngrok URL from the ngrok window

# 3. If ngrok URL changed, update VAPI:
bash scripts/update-webhook.sh https://new-url.ngrok-free.app

# 4. Test with phone calls

# 5. When done:
bash scripts/stop-dev.sh
```

---

## Production Deployment

When ready to deploy for real (no ngrok):

See: [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md)

**Recommended:** Deploy to Railway (5 minutes, free tier available)

---

## Need Help?

- **Logs:** Check `logs/*.log`
- **VAPI Dashboard:** https://dashboard.vapi.ai
- **Twilio Dashboard:** https://console.twilio.com
- **ngrok Dashboard:** http://localhost:4040 (when running)

---

## File Structure

```
StuffedLamb-Final/
├── start-dev.sh          ← Start everything (Mac/Linux)
├── start-dev.bat         ← Start everything (Windows)
├── scripts/
│   ├── stop-dev.sh       ← Stop everything
│   └── update-webhook.sh ← Update VAPI webhook URL
├── src/
│   └── server.js         ← Main server
├── data/
│   ├── menu.json         ← Your menu
│   └── business.json     ← Business hours
└── logs/                 ← Server logs
```

---

## Tips

1. **ngrok URLs expire** - Free tier URLs change when you restart ngrok
2. **Keep terminals open** - Don't close server/ngrok windows while testing
3. **Check logs first** - Most issues are visible in server logs
4. **Test locally** - Use `curl` to test webhook before calling VAPI
5. **Production = Railway** - Don't use ngrok in production

---

**You're all set!** 🎉

Run `bash start-dev.sh` and start testing!
