# VAPI Configuration - Final Setup Guide

## ⚡ Quick Action List (10 minutes)

### 1. Update System Prompt ⏱️ 2 min
**Location:** VAPI Dashboard → Assistants → Stuffed Lamb → Edit → System Prompt

**Action:** Copy the entire contents of `/docs/SYSTEM_PROMPT_V5_FINAL.md` and paste it into the System Prompt field.

**Why V5?**
- ✅ Prevents food/customer name confusion
- ✅ Eliminates filler words
- ✅ Forces natural language for pickup times (no ISO timestamps)
- ✅ Ensures call ending
- ✅ Prevents asking for name multiple times

---

### 2. Delete ALL Tool Messages ⏱️ 3 min
**Location:** VAPI Dashboard → Assistants → Stuffed Lamb → Tools

**CRITICAL:** These messages are SPOKEN OUT LOUD! They cause filler words.

**For EVERY tool, delete all messages:**

- `getCallerSmartContext` → Messages: **EMPTY**
- `quickAddItem` → Messages: **EMPTY**
- `priceCart` → Messages: **EMPTY**
- `setPickupTime` → Messages: **EMPTY**
- `estimateReadyTime` → Messages: **EMPTY**
- `createOrder` → Messages: **EMPTY**
- `sendReceipt` → Messages: **EMPTY**
- `editCartItem` → Messages: **EMPTY**
- `getCartState` → Messages: **EMPTY**
- `sendMenuLink` → Messages: **EMPTY**
- `endCall` → Messages: **EMPTY**

**ALL tools should have ZERO messages configured.**

---

### 3. Model Settings ⏱️ 2 min
**Location:** VAPI Dashboard → Assistants → Stuffed Lamb → Model

**Set these exact values:**

| Setting | Value | Why |
|---------|-------|-----|
| Model | `gpt-4-turbo` or `gpt-4` | Best performance |
| Temperature | `0.5` | Consistent responses |
| Max Tokens | `100` | Forces brevity, reduces filler |

---

### 4. Voice Settings ⏱️ 1 min
**Location:** VAPI Dashboard → Assistants → Stuffed Lamb → Voice

| Setting | Value |
|---------|-------|
| Background Sound | **OFF** |
| Filler Injection | **MINIMAL** or **OFF** |

**These settings prevent artificial filler words!**

---

### 5. Call Settings ⏱️ 1 min
**Location:** VAPI Dashboard → Assistants → Stuffed Lamb → Advanced

| Setting | Value | Critical? |
|---------|-------|-----------|
| End Call Function | **ENABLED** | ✅ YES! |
| Parallel Tool Calls | **disabled** | Recommended |
| First Message | \"Hi! Welcome to Stuffed Lamb. What can I get for you?\" | Optional |

**End Call Function MUST be enabled or calls won't terminate!**

---

## ✅ Verification Checklist

Before testing, confirm:

### System Prompt
- [ ] Using `SYSTEM_PROMPT_V5_FINAL.md`
- [ ] Contains section \"FOOD NAMES ≠ CUSTOMER NAMES\"
- [ ] Contains section \"USE NATURAL LANGUAGE FOR TIMES\"
- [ ] Contains \"STOP TALKING IMMEDIATELY\" after endCall

### Tool Messages
- [ ] ALL tools have ZERO messages configured
- [ ] No \"Sent\", \"Done\", \"All set\" messages anywhere

### Model Settings
- [ ] Temperature: 0.5
- [ ] Max tokens: 100
- [ ] Background sound: OFF
- [ ] Filler injection: MINIMAL or OFF

### Call Settings
- [ ] End call function: ENABLED

---

## 🧪 Test Script

**Make this exact call to verify everything works:**

1. **Start:** Call the number
2. **AI:** \"Hi! Welcome to Stuffed Lamb. What can I get for you?\"
3. **You:** \"I'd like a Lamb Mandi\"
4. **AI:** \"Would you like nuts or sultanas?\" ✅ (asking about add-ons)
5. **You:** \"Both please\"
6. **AI:** \"Got it! Anything else?\" ✅ (short acknowledgment, NOT \"just a sec\")
7. **You:** \"That's it\"
8. **AI:** \"Perfect! That's 32 dollars.\" ✅ (using varied acknowledgments)
9. **You:** \"Ready in 20 minutes is fine\"
10. **AI:** Should call estimateReadyTime silently ✅ (no filler words)
11. **AI:** \"Can I get your name for the order?\" ✅ (asking for name ONCE)
12. **You:** \"John\"
13. **AI:** Should create order silently ✅ (no \"just a moment\")
14. **AI:** \"Thanks! See you soon.\" ✅ (goodbye)
15. **VERIFY:** Call ends immediately ✅ (no continuation)

---

## 🚨 Common Issues & Fixes

### Issue: Still hearing filler words
**Cause:** Tool messages not deleted
**Fix:** Go back to step 2 - delete ALL messages from ALL tools

### Issue: Call doesn't end
**Cause:** End call function not enabled
**Fix:** Go to Advanced → Enable \"End Call Function\"

### Issue: AI asks for name twice
**Cause:** Old prompt still active
**Fix:** Verify you're using V5 prompt, save and reload VAPI

### Issue: Future orders rejected
**Cause:** Backend not updated
**Fix:** Pull latest code and restart server (already done)

### Issue: AI using timestamps like \"2025-11-29T...\"
**Cause:** Old prompt doesn't specify natural language
**Fix:** Update to V5 prompt which explicitly bans ISO timestamps

---

## 📊 What's Different in V5?

**New in V5 vs V4:**
1. ✅ Explicit ban on ISO timestamps - forces \"Wednesday at 1pm\" format
2. ✅ Varied acknowledgment phrases - prevents repetitive \"Got it\" x10
3. ✅ Even stronger \"STOP TALKING\" language after endCall
4. ✅ Clearer examples of natural vs ISO format

**Backend improvements (already deployed):**
1. ✅ parsePickupTime handles ISO timestamps as fallback
2. ✅ parsePickupTime handles future dates (\"Wednesday at 1pm\")
3. ✅ Smart duplicate detection in cart (60-second merge window)
4. ✅ EditCartItem validation to prevent crashes

---

## 🎯 Expected Results

After applying ALL settings above:

**Before (what you had):**
```
Customer: \"Lamb Mandi please\"
AI: \"Just a sec. Give me a moment. Hold on a sec.\" ❌
AI: \"Welcome back, Lamb Mandi!\" ❌
[Creates duplicate items] ❌
[Rejects future orders] ❌
[Never ends call] ❌
```

**After (what you'll get):**
```
Customer: \"Lamb Mandi please\"
AI: \"Would you like nuts or sultanas?\" ✅
Customer: \"Both\"
AI: \"Perfect! Anything else?\" ✅
Customer: \"That's it\"
AI: \"Great! That's 32 dollars. Ready in 20 minutes?\" ✅
Customer: \"Yes, name is John\"
AI: \"Thanks! See you soon.\" ✅
[Call ends] ✅
```

---

## 🆘 Still Not Working?

1. **Save everything in VAPI** - Changes don't apply until you click Save
2. **Restart backend server** - `pm2 restart stuffed-lamb` or `npm start`
3. **Clear VAPI cache** - Log out and back into VAPI dashboard
4. **Make fresh test call** - Don't retry old calls
5. **Check VAPI logs** - Dashboard → Calls → View transcript
6. **Check backend logs** - Look for errors or tool call issues

---

## 📝 Summary

**3 Critical Changes:**
1. **System Prompt** → V5 (natural language times, varied acknowledgments)
2. **Tool Messages** → ALL DELETED (this fixes filler words!)
3. **End Call Function** → ENABLED (this fixes call ending!)

**Time Required:** 10 minutes
**Difficulty:** Easy - just copy/paste and toggle settings
**Impact:** Fixes ALL major issues

---

**Last Updated:** 2025-11-24
**Version:** V5 FINAL
**Status:** Ready for production
