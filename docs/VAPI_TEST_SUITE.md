# Stuffed Lamb - Complete Vapi Voice Testing Suite

**15 Strategic Tests Covering All System Functionality**

---

## Test 1: Simple Happy Path

### Script
1. Order a Lamb Mandi.
2. Decline additional items.
3. Pickup time "ASAP".
4. Name "Sarah", phone "0423680596".
5. Complete order.

### Rubric
- Greet warmly, add item correctly
- Call `estimateReadyTime()` for ASAP
- Call `createOrder()` with correct pricing ($28)
- Confirm order number and pickup time
- Call `endCall()` after confirmation

**Tests**: Basic flow, estimateReadyTime, createOrder, endCall

---

## Test 2: Multiple Items with Mixed Addons

### Script
1. Order "2 Lamb Mandis - one with nuts, one with sultanas".
2. Add a Mansaf with both extra Jameed AND extra rice.
3. Add Sprite, Fanta, and water.
4. Pickup "6:30 PM".
5. Name "Michael", phone "0423680596".
6. Complete order.

### Rubric
- 2 separate Lamb Mandis (different addons) + 1 Mansaf (2 addons)
- 3 different drinks added correctly
- Total: $28 + $2 + $28 + $2 + $33 + $8 + $8 + $3 + $3 + $2 = $117
- Parse "6:30 PM" as specific time
- All items in SMS receipt with correct names

**Tests**: Multiple items, mixed addons, specific time parsing, all drink types, SMS formatting

---

## Test 3: Cart Management (Review, Remove, Clear)

### Script
1. Order Chicken Mandi, Lamb Mandi, Coke.
2. Ask "What's in my cart?"
3. Say "Remove the Chicken Mandi".
4. Confirm cart state again.
5. Say "Actually, cancel everything and start over".
6. Order just a Mansaf.
7. Pickup "in 45 minutes", name "Emma", phone "0423680596".
8. Complete order.

### Rubric
- Call `getCartState()` twice
- Call `removeCartItem()` successfully
- Call `clearCart()` and start fresh
- Final order only has Mansaf ($33)
- Cart formatted as comma-separated (no numbers)

**Tests**: getCartState, removeCartItem, clearCart, relative time parsing

---

## Test 4: Menu Inquiry and Off-Topic Handling

### Script
1. Ask "What's on the menu?"
2. Accept menu text.
3. Ask "How much do the sun and moon weigh?"
4. When redirected, order Chicken Mandi with nuts and sultanas.
5. Ask "How much is that?"
6. Pickup "20 minutes", name "David", phone "0423680596".
7. Complete order.

### Rubric
- Offer to text menu, call `sendMenuLink()`
- Politely decline off-topic question
- Add ONE Chicken Mandi with BOTH addons (not 2 items)
- Answer price: "twenty-seven dollars" ($23 + $2 + $2)
- Parse "20 minutes" without "in"

**Tests**: sendMenuLink, off-topic handling, price inquiry, multiple addons on one item

---

## Test 5: Order Modifications and Quantity Changes

### Script
1. Order "2 Chicken Mandis".
2. Say "Actually, make that 3".
3. Say "Change one to Lamb Mandi but keep it at 3 total".
4. Say "Add nuts to all of them".
5. Pickup "ASAP", name "Abigail", phone "0423680596".
6. Complete order.

### Rubric
- Use `editCartItem()` for quantity change
- Handle complex modification request
- Final: 2 Chicken Mandi + 1 Lamb Mandi, all with nuts
- Total: ($23 × 2) + $28 + ($2 × 3) = $80
- Maintain patience through changes

**Tests**: editCartItem, quantity modification, complex change handling

---

## Test 6: All Main Dishes + Standalone Sides

### Script
1. Order Mansaf, Lamb Mandi, Chicken Mandi (no addons).
2. Add 2 soups, 1 rice side.
3. Add L&P and Coke No Sugar.
4. Pickup "7 PM", name "Amelia", phone "0423680596".
5. Complete order.

### Rubric
- All 3 mains added successfully
- Sides ordered without requiring main dish
- Both specialty drinks added correctly
- Total: $33 + $28 + $23 + ($7 × 2) + $7 + $3 + $3 = $111
- SMS shows "Soft Drink (lnp)" and "Soft Drink (coke_no_sugar)"

**Tests**: All main dishes, standalone sides, L&P, Coke No Sugar, large order

---

## Test 7: Repeat Customer Flow

### Script
1. Call from "0423680596" (existing customer).
2. When offered, say "Yes, repeat my last order".
3. Say "Add a Coke to it".
4. Pickup "6 PM", confirm name.
5. Complete order.

### Rubric
- Call `getCallerSmartContext()`
- Recognize returning customer
- Call `repeatLastOrder()`
- Successfully add additional item
- Not re-request full order entry
- May auto-fill phone number

**Tests**: getCallerSmartContext, repeatLastOrder, customer recognition, phone auto-detect

---

## Test 8: Business Hours and Closed Day

### Script (Run on Monday/Tuesday):
1. Call and try to order.
2. Ask "When do you open?"
3. End call.

### Script (Run Wed-Sun):
1. Ask "Are you open?"
2. Order Chicken Mandi.
3. Pickup "ASAP", name "Evelyn", phone "0423680596".
4. Complete order.

### Rubric
- Call `checkOpen()`
- If closed: state "Closed Mon-Tue, open Wed 1 PM"
- If open: confirm and proceed
- Not create order when closed

**Tests**: checkOpen, business hours validation, closed day handling

---

## Test 9: Pickup Time Edge Cases

### Script
1. Order Lamb Mandi.
2. Say "later today".
3. When asked for specific time, say "dinner time".
4. When asked again, say "in 3 hours".
5. If shop closes before then, negotiate time.
6. Finalize pickup time.
7. Name "Madison", phone "0423680596".
8. Complete order.

### Rubric
- Recognize vague times and ask for specifics
- Parse "in 3 hours" correctly
- Validate pickup time against closing time
- Suggest alternative if invalid
- Not proceed without valid pickup time

**Tests**: Vague time handling, hour-based relative time, closing time validation, time negotiation

---

## Test 10: Special Instructions and Notes

### Script
1. Order 2 Mansafs.
2. Say "Make one extra spicy, no onions. The other one mild".
3. Order a Lamb Mandi, say "Extra sauce on the side please".
4. Pickup "6:30 PM", name "Harper", phone "0423680596".
5. Complete order.

### Rubric
- Capture special instructions in notes field
- Pass notes through to `createOrder()`
- Acknowledge requests naturally
- Complete order with notes preserved

**Tests**: Notes field, special instructions, multiple note handling

---

## Test 11: Stress Test - Very Long Order

### Script
1. Rapid fire: "3 Mansafs - one plain, one with extra Jameed, one with extra rice".
2. "2 Lamb Mandis with nuts".
3. "2 Chicken Mandis with sultanas".
4. "3 soups, 2 rice sides".
5. "Coke, Sprite, Fanta, L&P, and 2 waters".
6. Ask "What's my total?"
7. Pickup "7:30 PM", name "Daniel", phone "0423680596".
8. Complete order.

### Rubric
- Add all 17+ items without errors
- Maintain accurate cart throughout
- Call `priceCart()` when asked
- Complex total: 3×$33 + addons + 2×$28 + 2×$2 + 2×$23 + 2×$2 + 3×$7 + 2×$7 + 4×$3 + 2×$2 = $216
- Handle rapid input gracefully
- SMS lists all items correctly

**Tests**: Rapid ordering, large cart, price calculation, priceCart function, session stability

---

## Test 12: Customer Interruptions and Corrections

### Script
1. Order "Mansaf".
2. While AI is confirming, interrupt: "Wait, make it 2".
3. Let AI finish.
4. Interrupt again: "Actually 3".
5. Say "And add Coke to that".
6. During cart review, interrupt: "Hold on, remove one Mansaf".
7. Pickup "ASAP", name "Scarlett", phone "0423680596".
8. Complete order.

### Rubric
- Handle multiple interruptions gracefully
- Update quantities correctly
- Final: 2 Mansafs + 1 Coke
- Total: 2×$33 + $3 = $69
- Not get confused by interruptions

**Tests**: Interruption handling, real-time modifications, patience

---

## Test 13: Similar Names and Clarification

### Script
1. Say "Mandy" (unclear if Mandi or Mansaf).
2. When asked to clarify, say "The lamb one".
3. Confirm "Lamb Mandi, yes".
4. Add water.
5. Pickup "in 30 minutes", name "Chloe", phone "0423680596".
6. Complete order.

### Rubric
- Detect ambiguous item name
- Ask for clarification naturally
- Add correct item after confirmation
- Total: $28 + $2 = $30

**Tests**: Ambiguity handling, clarification requests, fuzzy matching

---

## Test 14: Silence and Patience Test

### Script
1. Order Lamb Mandi.
2. When asked about addons, pause 10 seconds.
3. Say "Sorry, yes nuts".
4. When asked about drinks, pause 8 seconds.
5. Say "Coke".
6. Pickup "6 PM", name "Alexander", phone "0423680596".
7. Complete order.

### Rubric
- Wait patiently during silences
- Not hang up or error
- Gentle prompting if needed
- Continue normally after pauses
- Complete order successfully

**Tests**: Timeout handling, patience, session persistence during silence

---

## Test 15: End-to-End with All Features

### Script
1. Ask "Are you open? Can you text me the menu?"
2. Receive menu.
3. Order "Lamb Mandi with nuts and sultanas".
4. Add "Chicken Mandi plain".
5. Add "Mansaf with extra Jameed".
6. Ask "What do I have?"
7. Say "Remove the Chicken Mandi".
8. Add "soup, rice side, Sprite, and water".
9. Ask "What's my total?"
10. Say "Make the Lamb Mandi extra spicy please".
11. Pickup "6:45 PM".
12. Name "William", phone "0423680596".
13. Complete and verify SMS.
14. Say "Thanks, bye" and verify call ends.

### Rubric
- checkOpen + sendMenuLink
- Multiple items with addons
- getCartState + removeCartItem
- Add sides and drinks
- priceCart
- Special instructions (notes)
- setPickupTime (specific time)
- createOrder
- SMS with correct formatting
- endCall terminates
- Total: $28 + $2 + $2 + $33 + $8 + $7 + $7 + $3 + $2 = $92

**Tests**: Full system integration, all major functions, end-to-end flow

---

## Coverage Map

| Function | Test(s) |
|----------|---------|
| `checkOpen` | 8, 15 |
| `getCallerSmartContext` | 7 |
| `quickAddItem` | All tests |
| `getCartState` | 3, 11, 15 |
| `removeCartItem` | 3, 12, 15 |
| `clearCart` | 3 |
| `editCartItem` | 5 |
| `priceCart` | 11, 15 |
| `setPickupTime` | 2, 15 |
| `estimateReadyTime` | 1, 11 |
| `sendMenuLink` | 4, 15 |
| `createOrder` | All tests |
| `repeatLastOrder` | 7 |
| `endCall` | 1, 15 |

**Edge Cases Covered:**
- Addon-only items: Invalid (mentioned in rubrics)
- Multiple addons on one item: Test 2, 4
- Mixed addons on multiple items: Test 2
- All drink options: Tests 2, 6, 11
- All main dishes: Test 6
- Standalone sides: Test 6
- Time parsing (relative, specific, vague): Tests 1, 2, 3, 9
- Cart operations: Test 3
- Modifications: Tests 5, 12
- Special instructions: Test 10
- Large orders: Test 11
- Interruptions: Test 12
- Silence: Test 14
- Business hours: Test 8
- Off-topic: Test 4
- Ambiguity: Test 13
- SMS formatting: All tests

---

## Critical Success Criteria

### Must Always:
✅ Call `createOrder()` before ending call
✅ Collect name AND phone number
✅ Set pickup time
✅ Maintain consistent pricing
✅ Use natural language (no numbered lists)
✅ Actually terminate with `endCall()`
✅ SMS shows item names (not "main_dishes")

### Must Never:
❌ Create order without pickup time
❌ Skip createOrder()
❌ Use robotic language
❌ Duplicate items with same addons
❌ Persist sessions between tests
❌ List prices unless asked

---

## Pass Criteria

- **Per Test**: 85% functionality + conversation quality
- **Overall Suite**: 90% pass rate (13/15 tests minimum)
- **Zero Tolerance**: No order data loss, no price mismatches, no failed createOrder calls

---

## Testing Notes

1. Run tests in order 1-15 for progressive complexity
2. Tests 8 requires specific day testing (Mon/Tue vs Wed-Sun)
3. Test 7 requires prior order history setup
4. Allow 2-minute gap between tests for session isolation
5. Verify SMS receipt after each successful order
6. Test on both mobile and actual phone calls
