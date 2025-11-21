# Production Deployment Guide - Stuffed Lamb VAPI

This guide will help you deploy the Stuffed Lamb voice AI system to production.

---

## 🚀 Quick Start (Recommended: Railway)

### Option A: Deploy to Railway (Easiest - 5 minutes)

1. **Sign up at [Railway.app](https://railway.app)**

2. **Deploy from GitHub:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `StuffedLamb-Final` repository
   - Railway will auto-detect Node.js and deploy

3. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=8000
   VAPI_API_KEY=4000447a-37e5-4aa6-b7b3-e692bec2706f
   VAPI_ASSISTANT_ID=977a1a1a-de18-4e2c-9e81-216b6b17dde9
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   REDIS_HOST=your_redis_host (Railway provides this)
   REDIS_PORT=6379
   ```

4. **Get your webhook URL:**
   - Railway gives you: `https://your-app.up.railway.app`
   - Your webhook: `https://your-app.up.railway.app/webhook`

5. **Update VAPI:**
   ```bash
   bash scripts/update-webhook.sh https://your-app.up.railway.app
   ```

6. **Done!** Call your VAPI number to test.

---

## Option B: Deploy to Render (Also Easy)

1. **Sign up at [Render.com](https://render.com)**

2. **Create Web Service:**
   - New → Web Service → Connect GitHub
   - Select `StuffedLamb-Final`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Add Environment Variables** (same as above)

4. **Add Redis:**
   - Create Redis instance on Render
   - Copy connection URL to `REDIS_URL` env var

5. **Update VAPI** with your Render URL

---

## Option C: VPS (DigitalOcean, AWS, etc.) - Advanced

### Prerequisites

- Ubuntu 20.04+ server
- Domain name (e.g., `api.stuffedlamb.com.au`)
- SSH access
- Port 80/443 open

### Step 1: Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Redis
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Install Nginx (reverse proxy)
apt install -y nginx certbot python3-certbot-nginx

# Install Git
apt install -y git
```

### Step 2: Clone Repository

```bash
# Create app directory
mkdir -p /var/www
cd /var/www

# Clone repo
git clone https://github.com/nottechincal/StuffedLamb-Final.git
cd StuffedLamb-Final

# Install dependencies
npm install --production
```

### Step 3: Configure Environment

```bash
# Copy and edit .env
cp .env.example .env
nano .env
```

Add:
```env
NODE_ENV=production
PORT=8000
VAPI_API_KEY=4000447a-37e5-4aa6-b7b3-e692bec2706f
VAPI_ASSISTANT_ID=977a1a1a-de18-4e2c-9e81-216b6b17dde9
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 4: Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Auto-start on boot
pm2 startup
# Run the command it outputs

# Check status
pm2 status
pm2 logs stuffed-lamb
```

### Step 5: Configure Nginx

```bash
nano /etc/nginx/sites-available/stuffedlamb
```

Add:
```nginx
server {
    listen 80;
    server_name api.stuffedlamb.com.au;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_connect_timeout 30s;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/stuffedlamb /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 6: SSL Certificate (HTTPS)

```bash
# Get free SSL from Let's Encrypt
certbot --nginx -d api.stuffedlamb.com.au

# Auto-renew
certbot renew --dry-run
```

Your webhook URL is now: `https://api.stuffedlamb.com.au/webhook`

### Step 7: Update VAPI

```bash
bash scripts/update-webhook.sh https://api.stuffedlamb.com.au
```

---

## 🔧 Production Checklist

### Before Going Live:

- [ ] Server is running 24/7 (not your laptop!)
- [ ] HTTPS/SSL is configured
- [ ] Environment variables are set correctly
- [ ] Redis is running and accessible
- [ ] Twilio credentials are configured
- [ ] VAPI webhook URL is updated
- [ ] Health check is accessible: `curl https://your-url/health`
- [ ] Test call works end-to-end
- [ ] Logs are being written (`pm2 logs` or `logs/*.log`)
- [ ] PM2 auto-restart is enabled
- [ ] Server auto-starts on reboot

### Monitoring:

```bash
# Check server status
pm2 status

# View logs
pm2 logs stuffed-lamb

# Restart if needed
pm2 restart stuffed-lamb

# Monitor CPU/memory
pm2 monit
```

---

## 🔄 Updating Production

When you make changes:

```bash
# SSH into server
ssh root@your-server-ip
cd /var/www/StuffedLamb-Final

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install --production

# Restart
pm2 restart stuffed-lamb

# Check logs
pm2 logs stuffed-lamb --lines 50
```

---

## 🚨 Troubleshooting

### Server won't start

```bash
# Check PM2 logs
pm2 logs stuffed-lamb --err

# Check Redis
systemctl status redis-server

# Check Nginx
nginx -t
systemctl status nginx
```

### VAPI can't reach webhook

```bash
# Test from outside
curl https://your-url/health

# Check firewall
ufw status
ufw allow 80
ufw allow 443
```

### Orders not saving

```bash
# Check permissions
ls -la data/orders/
chown -R www-data:www-data /var/www/StuffedLamb-Final/data/

# Check disk space
df -h
```

---

## 💰 Cost Comparison

| Provider | Cost/Month | Pros | Cons |
|----------|------------|------|------|
| **Railway** | $5-10 | Easiest setup, Redis included | Sleeps on free tier |
| **Render** | $7-15 | Great for Node.js, Auto-deploy | Separate Redis cost |
| **DigitalOcean** | $6-12 | Full control, $200 free credit | Manual setup |
| **AWS Lightsail** | $5-10 | AWS ecosystem, Reliable | AWS complexity |
| **Heroku** | $7-25 | Very easy, Addons | Expensive dynos |

**Recommendation:** Start with Railway or Render for simplicity.

---

## 🎯 Production vs Development

### Development (your laptop):
```
npm start → ngrok → VAPI
```
- ngrok URL changes every restart
- Server stops when laptop sleeps
- Good for testing only

### Production (cloud server):
```
PM2 → Nginx → HTTPS → VAPI
```
- Permanent URL
- Runs 24/7
- Auto-restarts on crash
- SSL/HTTPS enabled
- Ready for customers

---

## 📞 Support

After deployment:
1. Test by calling your VAPI number
2. Check `pm2 logs` or Railway/Render logs
3. Monitor `data/orders/` for new orders
4. Check Twilio dashboard for SMS delivery

Need help? Check:
- Server logs: `pm2 logs stuffed-lamb`
- VAPI logs: https://dashboard.vapi.ai
- Twilio logs: https://console.twilio.com

---

## ✅ You're Live!

Once deployed, your system is production-ready and will:
- Take orders 24/7
- Save to `data/orders/`
- Send SMS receipts
- Handle multiple concurrent calls
- Auto-restart on crashes

**No more terminals, no more ngrok!** 🎉
