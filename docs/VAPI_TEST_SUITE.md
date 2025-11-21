# Stuffed Lamb - Vapi Voice Testing Suite

Complete test scenarios for validating the AI ordering assistant.

---

## Test 1: Simple Single Item Order

### Script
1. Answer the greeting and order a Lamb Mandi.
2. Decline any additional items.
3. When asked about pickup time, say "ASAP".
4. Provide name "Sarah" and phone number "0412345678".
5. Confirm the order and end the call.

### Rubric
The assistant should:
- Greet warmly and add the Lamb Mandi correctly
- Ask about additional items naturally
- Call `estimateReadyTime()` for ASAP request
- Collect customer details (name and phone)
- Successfully call `createOrder()` with correct pricing
- Confirm order number and pickup time clearly
- End the call after confirmation

---

## Test 2: Multiple Items with Addons

### Script
1. Order a Mansaf with extra Jameed and extra rice.
2. When asked, add a Coke.
3. Confirm the total when asked.
4. Request pickup at "6:30 PM".
5. Provide name "Michael" and phone "0423680596".
6. Confirm and complete the order.

### Rubric
The assistant should:
- Add ONE Mansaf with BOTH addons (not two separate items)
- Add the Coke as a separate item
- Provide accurate total for Mansaf ($33) + extra Jameed ($8) + extra rice ($8) + Coke ($3) = $52
- Parse "6:30 PM" correctly as specific time
- Collect details and successfully create order
- Maintain consistent pricing throughout (no mismatches)

---

## Test 3: Menu Inquiry and Text Request

### Script
1. Ask "What's on the menu?"
2. Accept the offer to receive menu via text.
3. After receiving text confirmation, order a Chicken Mandi with nuts.
4. Request pickup "in 45 minutes".
5. Provide name "Jessica" and phone "0456789012".
6. Complete the order.

### Rubric
The assistant should:
- Offer to text the menu FIRST (not list everything verbally)
- Call `sendMenuLink()` with the phone number
- Acknowledge the text was sent
- Add Chicken Mandi with nuts correctly ($23 + $2 = $25)
- Parse "in 45 minutes" correctly as relative time
- Complete order successfully

---

## Test 4: Off-Topic Question Handling

### Script
1. Begin by asking about menu options.
2. Midway, ask "How much do the sun and moon weigh?"
3. When redirected, order a Lamb Mandi with sultanas.
4. Request pickup time "20 minutes".
5. Provide name "David" and phone "0498765432".
6. Conclude the order.

### Rubric
The assistant should:
- Politely decline the off-topic question
- Redirect conversation back to ordering without being rude
- Not attempt to answer non-restaurant questions
- Add Lamb Mandi with sultanas correctly
- Parse "20 minutes" (without "in") as relative time correctly
- Complete order flow professionally

---

## Test 5: Order Modification

### Script
1. Order a Chicken Mandi.
2. Before finalizing, say "Actually, change that to Lamb Mandi".
3. Add nuts to the Lamb Mandi.
4. Request pickup "ASAP".
5. Provide name "Emma" and phone "0487654321".
6. Complete the order.

### Rubric
The assistant should:
- Successfully handle the modification request
- Either remove Chicken Mandi and add Lamb Mandi, or use `editCartItem()`
- Add nuts as an addon to the Lamb Mandi
- Calculate correct total: Lamb Mandi ($28) + nuts ($2) = $30
- Complete order with correct items in cart

---

## Test 6: Multiple Items Same Type

### Script
1. Order "2 Lamb Mandis".
2. When asked about addons, say "nuts on both".
3. Add a soup and water.
4. Request pickup at "7 PM".
5. Provide name "Oliver" and phone "0476543210".
6. Confirm order.

### Rubric
The assistant should:
- Add 2x Lamb Mandi with nuts (either as quantity=2 or combined items)
- Add soup ($7) and water ($2) separately
- Calculate correct total: (2 × $28) + (2 × $2) + $7 + $2 = $69
- Not create duplicate separate items
- Maintain accurate cart throughout

---

## Test 7: Pickup Time Clarification

### Script
1. Order a Mansaf.
2. When asked about pickup time, say "later today".
3. When prompted for specific time, say "around dinner time".
4. Finally specify "6 PM".
5. Provide name "Sophia" and phone "0465432109".
6. Complete order.

### Rubric
The assistant should:
- Recognize "later today" is too vague
- Ask for a more specific time
- Recognize "dinner time" is still vague
- Continue asking until specific time is given
- Parse "6 PM" correctly
- Not proceed to collect details until pickup time is set

---

## Test 8: Cart Review Before Ordering

### Script
1. Order a Lamb Mandi with nuts.
2. Add a Coke.
3. Before confirming, ask "What do I have so far?"
4. Confirm and request pickup "in 30 minutes".
5. Provide name "Lucas" and phone "0454321098".
6. Complete order.

### Rubric
The assistant should:
- Call `getCartState()` when asked
- List items naturally: "Lamb Mandi with nuts, Coke"
- NOT use numbered list format
- Calculate total correctly: $28 + $2 + $3 = $33
- Keep the flow conversational and brief
- Complete order successfully

---

## Test 9: Addon-Only Item Attempt

### Script
1. Ask to order "just extra rice".
2. When informed it's addon-only, order a Mansaf.
3. Ask to add the extra rice to the Mansaf.
4. Request pickup "ASAP".
5. Provide name "Ava" and phone "0443210987".
6. Complete order.

### Rubric
The assistant should:
- Recognize "extra rice" cannot be ordered alone
- Politely explain it's only available as an addon
- Suggest adding a main dish
- Successfully add Mansaf with extra rice
- Calculate correct total: $33 + $5 = $38
- Handle the correction gracefully

---

## Test 10: Repeat Order Scenario

### Script
1. Call and provide phone number "0423680596" (existing customer).
2. When offered, confirm to repeat your last order.
3. Request pickup time "6 PM".
4. Confirm name and complete order.

### Rubric
The assistant should:
- Call `getCallerSmartContext()` with the phone number
- Recognize returning customer (if order history exists)
- Offer to repeat last order naturally
- Call `repeatLastOrder()` if customer agrees
- Not require full order process again
- Apply same items with current pricing

---

## Test 11: Partial Order Abandonment Recovery

### Script
1. Order a Lamb Mandi.
2. When asked about additional items, pause for 5 seconds.
3. Say "Sorry, I'm still deciding".
4. Add sultanas to the Lamb Mandi.
5. Complete the order with pickup "in 25 minutes".
6. Provide name "Noah" and phone "0432109876".

### Rubric
The assistant should:
- Be patient with customer indecision
- Not rush or pressure the customer
- Successfully add sultanas as addon
- Maintain cart state throughout pauses
- Complete order without losing items
- Calculate total correctly: $28 + $2 = $30

---

## Test 12: Price Inquiry

### Script
1. Ask "How much is the Mansaf?"
2. Order a Mansaf.
3. Ask "What are the extras and how much?"
4. Add extra Jameed.
5. Request pickup "ASAP".
6. Provide name "Isabella" and phone "0421098765".
7. Complete order.

### Rubric
The assistant should:
- Answer price question directly: "thirty-three dollars"
- When asked about extras, list them WITHOUT mentioning every price
- Only mention addon prices if specifically asked
- Keep response brief and natural
- Calculate correct total: $33 + $8 = $41
- Not be overly verbose with pricing details

---

## Critical Success Criteria (All Tests)

### Must Always:
✅ Call `createOrder()` before ending the call
✅ Collect both name AND phone number
✅ Set pickup time (via `setPickupTime()` or `estimateReadyTime()`)
✅ Maintain consistent pricing (no $49 → $77 jumps)
✅ Use natural, conversational language
✅ Not use numbered lists when reading back orders
✅ End call only after order is confirmed

### Must Never:
❌ Create order without pickup time
❌ Skip `createOrder()` function call
❌ Use robotic/scripted language
❌ List prices for every addon unless asked
❌ Duplicate items when customer wants addons on ONE item
❌ Maintain cart between different test calls (session isolation)

---

## Expected Response Times

- **Initial greeting**: < 2 seconds
- **Item addition**: < 3 seconds
- **Cart state retrieval**: < 2 seconds
- **Order creation**: < 5 seconds
- **Total call duration**: 45-90 seconds for simple orders

---

## SMS Validation

After each successful order, verify SMS receipt shows:
- ✅ Proper item names (not "1x main_dishes")
- ✅ Addons listed correctly (e.g., "+ nuts, sultanas")
- ✅ Drink options shown (e.g., "Soft Drink (coke)")
- ✅ Correct total matching what AI stated
- ✅ Proper pickup time formatted

---

## Notes for Testers

1. **Natural Speech**: Speak naturally, don't over-enunciate
2. **Varied Phrasing**: Use different ways to say the same thing
3. **Interruptions**: Occasionally interrupt to test handling
4. **Pauses**: Add realistic thinking pauses
5. **Corrections**: Test "actually, I meant..." scenarios
6. **Background Noise**: Test with moderate ambient sound if possible

---

## Scoring

Each test is scored on:
- **Functionality** (50%): Did it complete the order correctly?
- **Conversation Quality** (30%): Was it natural and pleasant?
- **Accuracy** (20%): Were prices and details correct?

**Pass Threshold**: 85% overall score across all tests
