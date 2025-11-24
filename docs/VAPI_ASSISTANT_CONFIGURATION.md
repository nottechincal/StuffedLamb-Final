# VAPI Assistant Configuration Guide
## Critical Fixes for Common Issues

This guide addresses the major issues you're experiencing:
1. ❌ Assistant not ending calls
2. ❌ Assistant not asking for customer name
3. ❌ Excessive filler words
4. ❌ Duplicate items in cart
5. ❌ Reverting to initial greeting after order

---

## 🚨 CRITICAL: System Prompt Configuration

### Step 1: Update Your VAPI Assistant System Prompt

**Navigate to:** VAPI Dashboard → Assistants → Stuffed Lamb → Edit

**Replace the entire system prompt with the contents of:**
```
/docs/SYSTEM_PROMPT_V2.md
```

**This new prompt includes:**
- ✅ Mandatory call flow sequence
- ✅ Explicit requirement to ask for customer name
- ✅ Explicit requirement to call endCall()
- ✅ Rules to prevent duplicate items
- ✅ Minimal filler word usage

---

## 🔧 Model Configuration Settings

### Step 2: Configure Model Settings

**In VAPI Dashboard → Assistant → Model Settings:**

1. **Model:** `gpt-4` or `gpt-4-turbo` (recommended)

2. **Temperature:** `0.7`
   - Lower = more consistent
   - Higher = more variable
   - 0.7 is a good balance

3. **Max Tokens:** `150` per response
   - Prevents long rambling responses
   - Forces concise answers
   - Reduces filler words

4. **Background Sound:** `OFF` or `office` at very low volume
   - **CRITICAL:** Turn this OFF or very low
   - This is what causes excessive filler words!

5. **Filler Injection:** `MINIMAL` or `OFF`
   - **CRITICAL:** Set to MINIMAL or OFF
   - High settings cause "um", "uh", "give me a moment" spam

---

## 🗣️ Voice Configuration Settings

### Step 3: Configure Voice Settings

**In VAPI Dashboard → Assistant → Voice:**

1. **Provider:** `elevenlabs` (recommended for quality)

2. **Voice:** Choose a warm, professional voice
   - Recommended: `Rachel`, `Drew`, `Clyde`
   - Avoid overly robotic voices

3. **Stability:** `0.5-0.7`
   - Too low = unpredictable
   - Too high = robotic

4. **Similarity Boost:** `0.75-0.85`
   - Maintains consistent voice quality

5. **Speech Rate:** `1.0` (normal)
   - Don't speed up or slow down
   - Natural pace is best

---

## 🛠️ Advanced Settings

### Step 4: Tool Call Configuration

**In VAPI Dashboard → Assistant → Advanced:**

1. **Tool Choice:** `auto`
   - Let the AI decide when to call tools
   - **NOT** `required` (causes forced tool calls)

2. **Parallel Tool Calls:** `disabled`
   - Execute one tool at a time
   - Prevents conflicts and duplicate calls

3. **Tool Timeout:** `10000ms` (10 seconds)
   - Enough time for backend processing
   - Not too long to cause awkward pauses

---

## 📞 Call Flow Configuration

### Step 5: First Message Setup

**In VAPI Dashboard → Assistant → First Message:**

**Set to:**
```
Hello. Welcome to Stuffed Lamb. What can I get for you today?
```

**DO NOT:**
- ❌ Make it too long
- ❌ Add "How can I help?" (it's implied)
- ❌ Add filler like "Thanks for calling"

**Keep it simple and direct.**

### Step 6: End Call Configuration

**In VAPI Dashboard → Assistant → End Call Settings:**

1. **End Call Function Enabled:** `YES`
   - **CRITICAL:** Must be enabled
   - Allows the endCall() tool to actually end the call

2. **End Call Phrase:** Empty or "Goodbye"
   - Let the endCall() tool handle this
   - Don't set a manual phrase

---

## 🔍 Troubleshooting Specific Issues

### Issue: Assistant Not Ending Call

**Root Cause:**
- endCall() tool is not being called by the AI
- End call function is not enabled in VAPI

**Fix:**
1. ✅ Use SYSTEM_PROMPT_V2.md which explicitly requires endCall()
2. ✅ Enable "End Call Function" in VAPI settings
3. ✅ Verify endCall tool is in your vapi-tools.json
4. ✅ Check that the tool's `endCall: true` flag is being returned

**In the prompt, ensure this section is clear:**
```
### 7. Confirmation & Ending Call (MANDATORY)

After createOrder succeeds:
1. Confirm order
2. Say goodbye
3. *** CALL endCall() *** (MANDATORY - NO EXCEPTIONS)
```

### Issue: Assistant Not Asking for Name

**Root Cause:**
- System prompt doesn't make it mandatory
- Prompt allows skipping name collection
- AI thinks it already has the name

**Fix:**
1. ✅ Use SYSTEM_PROMPT_V2.md which makes name collection MANDATORY
2. ✅ Explicit instruction: "Can I get your name for the order?" (REQUIRED - NO EXCEPTIONS)
3. ✅ Checklist before createOrder includes name verification

**In the prompt:**
```
### 5. Collecting Customer Details (MANDATORY - NEVER SKIP)

STEP 1: "Can I get your name for the order?"
[Wait for answer - get customer name]
```

### Issue: Excessive Filler Words

**Root Cause:**
- VAPI's "Filler Injection" setting too high
- VAPI's "Background Sound" causing pauses
- Assistant saying filler words AND VAPI adding more

**Fix:**
1. ✅ Set "Filler Injection" to `MINIMAL` or `OFF`
2. ✅ Set "Background Sound" to `OFF` or very low
3. ✅ Update system prompt with filler word limits
4. ✅ Set max tokens to 150 to force brevity

**In SYSTEM_PROMPT_V2.md:**
```
### Filler Words - USE SPARINGLY

MAXIMUM USAGE:
- Max 1 filler word per response
- Max 2 filler words per entire call

NEVER use:
- ❌ "Give me a moment"
- ❌ "Hold on a sec"
- ❌ "Just a sec"
```

### Issue: Duplicate Items in Cart

**Root Cause:**
- AI calls quickAddItem multiple times for same item
- AI adds base item, then adds same item with addons
- cartService creates two separate items

**Fix:**
1. ✅ Updated cartService.js with smart duplicate detection
   - Detects same item added within 60 seconds
   - Merges addons instead of creating duplicate
2. ✅ SYSTEM_PROMPT_V2.md instructs AI to ask for addons UPFRONT
3. ✅ Clear examples of correct vs wrong approach

**Backend fix (already implemented):**
```javascript
// Detects "lamb mandi" added recently
// Then "lamb mandi with nuts" → merges instead of duplicating
if (recentSameItemIndex >= 0 && normalizedAddons.length > 0) {
  // Merge addons
  cart[recentSameItemIndex].addons = mergedAddons;
}
```

### Issue: Reverting to Initial Greeting

**Root Cause:**
- endCall() never called
- Session still active
- Customer says "Hello" again
- AI treats it as continuation, not new call

**Fix:**
1. ✅ Ensure endCall() is ALWAYS called after order completion
2. ✅ SYSTEM_PROMPT_V2.md makes this mandatory
3. ✅ Backend handleEndCall() deletes session properly

**Verify in logs:**
```
[Should see]: "Call ended successfully via Vapi API"
[Should NOT see]: Assistant continuing after "All set"
```

---

## ✅ Configuration Checklist

Before testing, verify all settings:

### System Prompt
- [ ] Using SYSTEM_PROMPT_V2.md
- [ ] Includes mandatory call flow sequence
- [ ] Explicit name collection requirement
- [ ] Explicit endCall() requirement
- [ ] Filler word limits documented

### Model Settings
- [ ] Temperature: 0.7
- [ ] Max tokens: 150
- [ ] Filler injection: MINIMAL or OFF
- [ ] Background sound: OFF or very low
- [ ] Tool choice: auto
- [ ] Parallel tool calls: disabled

### Voice Settings
- [ ] Provider: elevenlabs
- [ ] Voice: professional, warm tone
- [ ] Stability: 0.5-0.7
- [ ] Speech rate: 1.0

### Call Settings
- [ ] First message: Simple greeting
- [ ] End call function: ENABLED
- [ ] End call phrase: Empty or "Goodbye"

### Backend Verification
- [ ] vapi-tools.json includes endCall tool
- [ ] server.js handleEndCall() returns endCall: true
- [ ] cartService.js has smart duplicate detection
- [ ] All tools have proper error handling

---

## 🧪 Testing Your Configuration

### Test Call #1: Basic Order

**Script:**
1. Call system
2. Order "Lamb Mandi"
3. When asked about addons, say "nuts and sultanas"
4. Confirm order
5. Give pickup time
6. **Verify AI asks: "Can I get your name for the order?"**
7. Give name and phone
8. **Verify AI calls createOrder()**
9. **Verify AI calls endCall()**
10. **Verify call actually ends**

### Test Call #2: Addon Modification

**Script:**
1. Call system
2. Order "Lamb Mandi"
3. Say "Actually, add nuts to that"
4. **Verify cart has ONE lamb mandi with nuts, not TWO**
5. Continue with order
6. **Verify name collection**
7. **Verify call ends properly**

### Test Call #3: Filler Words

**Script:**
1. Call system
2. Make a normal order
3. **Count filler words**
4. **Should be max 2 total** ("Got it", "Perfect", etc.)
5. **Should NOT hear: "Give me a moment", "Hold on", "Just a sec" repeatedly**

---

## 📊 Monitoring & Logs

### What to Check in Logs

**Good call should show:**
```
[WEBHOOK] getCallerSmartContext called
[CART] Adding new item: 1x Lamb Mandi
[CART] Detected addon modification - Merging addons (if applicable)
[ORDER] Creating order: customerName=John
[CALL] Call ended successfully via Vapi API
```

**Bad call shows:**
```
❌ [CART] Adding new item: 1x Lamb Mandi (first)
❌ [CART] Adding new item: 1x Lamb Mandi (DUPLICATE!)
❌ [ORDER] Creating order: customerName=undefined (no name!)
❌ Missing: Call ended successfully (never ended!)
```

---

## 🚀 Quick Start: Apply All Fixes Now

### 1. Update System Prompt (5 minutes)

```bash
# Copy SYSTEM_PROMPT_V2.md contents
# Go to VAPI Dashboard → Assistants → Your Assistant
# Paste into System Prompt field
# Save
```

### 2. Update Model Settings (2 minutes)

```
Max Tokens: 150
Filler Injection: MINIMAL
Background Sound: OFF
Parallel Tool Calls: disabled
```

### 3. Update Call Settings (1 minute)

```
End Call Function: ENABLED
First Message: "Hello. Welcome to Stuffed Lamb. What can I get for you today?"
```

### 4. Deploy Backend Updates (already done)

```bash
# cartService.js - smart duplicate detection ✅
# SYSTEM_PROMPT_V2.md - strict call flow ✅
```

### 5. Test Immediately

Make a test call and verify:
- ✅ AI asks for your name
- ✅ AI creates the order
- ✅ AI ends the call
- ✅ No duplicate items
- ✅ Minimal filler words

---

## 🆘 Still Having Issues?

### Debug Steps:

1. **Check VAPI Logs:**
   - Dashboard → Calls → Latest Call
   - View full transcript
   - Check which tools were called
   - Look for missing endCall()

2. **Check Backend Logs:**
   - Look for `[CART]` entries - duplicate detection
   - Look for `[ORDER]` entries - name being passed
   - Look for `Call ended successfully` - endCall working

3. **Check System Prompt:**
   - Make sure you're using SYSTEM_PROMPT_V2.md
   - Verify it includes all mandatory steps
   - Check for any custom modifications that broke flow

4. **Restart Everything:**
   - Save VAPI assistant config
   - Restart backend server
   - Clear any cached sessions
   - Make fresh test call

---

## 📝 Summary of Changes

**Files Modified:**
1. `docs/SYSTEM_PROMPT_V2.md` - New, strict call flow rules
2. `src/services/cartService.js` - Smart duplicate detection
3. `docs/VAPI_ASSISTANT_CONFIGURATION.md` - This guide

**VAPI Settings to Change:**
1. System Prompt → Use SYSTEM_PROMPT_V2.md
2. Max Tokens → 150
3. Filler Injection → MINIMAL or OFF
4. Background Sound → OFF
5. End Call Function → ENABLED
6. Parallel Tool Calls → disabled

**Expected Results:**
- ✅ AI asks for name every time
- ✅ AI calls createOrder with name
- ✅ AI calls endCall after completion
- ✅ No duplicate items in cart
- ✅ Maximum 1-2 filler words per call
- ✅ Call ends properly, no continuation

---

**Last Updated:** 2025-11-24
**Version:** 2.0
**Status:** Ready for deployment
