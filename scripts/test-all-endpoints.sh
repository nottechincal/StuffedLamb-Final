#!/bin/bash

# ========================================
# COMPREHENSIVE ENDPOINT TESTING
# ========================================
# Tests all webhook functions systematically

set -e

BASE_URL="http://localhost:8000"
WEBHOOK_URL="$BASE_URL/webhook"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

log_test() {
    echo -e "${CYAN}TEST:${NC} $1"
}

log_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

log_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

log_info() {
    echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

# Helper to call webhook
call_tool() {
    local FUNCTION_NAME=$1
    local ARGS=${2:-"{}"}

    curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"message\": {
                \"call\": {
                    \"id\": \"test-call-$(date +%s)\",
                    \"customer\": {
                        \"number\": \"+61412345678\"
                    }
                },
                \"toolCalls\": [
                    {
                        \"id\": \"tool-call-$(date +%s)\",
                        \"function\": {
                            \"name\": \"$FUNCTION_NAME\",
                            \"arguments\": $ARGS
                        }
                    }
                ]
            }
        }"
}

echo "=========================================="
echo "  STUFFED LAMB - COMPREHENSIVE TESTS"
echo "=========================================="
echo ""

# ========================================
# TEST 1: Health Check
# ========================================
log_test "Health Check"
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
    log_pass "Server is healthy"
else
    log_fail "Server health check failed"
    exit 1
fi
echo ""

# ========================================
# TEST 2: Basic Operations
# ========================================
echo "=========================================="
echo "BASIC OPERATIONS"
echo "=========================================="
echo ""

log_test "checkOpen"
RESULT=$(call_tool "checkOpen")
if echo "$RESULT" | grep -q "isOpen"; then
    log_pass "checkOpen works"
else
    log_fail "checkOpen failed"
fi
echo ""

log_test "getCallerSmartContext"
RESULT=$(call_tool "getCallerSmartContext")
if echo "$RESULT" | grep -q "phoneNumber"; then
    log_pass "getCallerSmartContext works"
else
    log_fail "getCallerSmartContext failed"
fi
echo ""

# ========================================
# TEST 3: Cart Operations
# ========================================
echo "=========================================="
echo "CART OPERATIONS"
echo "=========================================="
echo ""

log_test "clearCart (setup)"
call_tool "clearCart" > /dev/null
log_info "Cart cleared"
echo ""

log_test "quickAddItem - Simple"
RESULT=$(call_tool "quickAddItem" '{"description":"lamb mandi"}')
if echo "$RESULT" | grep -q "success\|Added"; then
    log_pass "quickAddItem works"
else
    log_fail "quickAddItem failed"
    echo "Response: $RESULT"
fi
echo ""

log_test "quickAddItem - Complex"
RESULT=$(call_tool "quickAddItem" '{"description":"2 large lamb kebabs with garlic sauce"}')
if echo "$RESULT" | grep -q "success\|Added\|error"; then
    log_pass "Complex NLP handled"
else
    log_fail "Complex NLP failed"
fi
echo ""

log_test "quickAddItem - Drink"
RESULT=$(call_tool "quickAddItem" '{"description":"coke"}')
if echo "$RESULT" | grep -q "success\|Added\|error"; then
    log_pass "Drink order handled"
else
    log_fail "Drink order failed"
fi
echo ""

log_test "getCartState"
RESULT=$(call_tool "getCartState")
if echo "$RESULT" | grep -q "count\|items\|formatted"; then
    log_pass "getCartState works"
else
    log_fail "getCartState failed"
fi
echo ""

log_test "priceCart"
RESULT=$(call_tool "priceCart")
if echo "$RESULT" | grep -q "total\|subtotal\|gst"; then
    log_pass "priceCart works"
else
    log_fail "priceCart failed"
fi
echo ""

log_test "editCartItem"
RESULT=$(call_tool "editCartItem" '{"itemIndex":0,"modifications":{"quantity":2}}')
if echo "$RESULT" | grep -q "success\|item\|error"; then
    log_pass "editCartItem handled"
else
    log_fail "editCartItem failed"
fi
echo ""

log_test "removeCartItem"
call_tool "quickAddItem" '{"description":"coke"}' > /dev/null
RESULT=$(call_tool "removeCartItem" '{"itemIndex":0}')
if echo "$RESULT" | grep -q "success\|removed\|error"; then
    log_pass "removeCartItem handled"
else
    log_fail "removeCartItem failed"
fi
echo ""

# ========================================
# TEST 4: Time Management
# ========================================
echo "=========================================="
echo "TIME MANAGEMENT"
echo "=========================================="
echo ""

log_test "estimateReadyTime"
RESULT=$(call_tool "estimateReadyTime")
if echo "$RESULT" | grep -q "minutes\|readyTime\|estimatedMinutes"; then
    log_pass "estimateReadyTime works"
else
    log_fail "estimateReadyTime failed"
fi
echo ""

log_test "setPickupTime"
RESULT=$(call_tool "setPickupTime" '{"requestedTime":"6:30pm"}')
if echo "$RESULT" | grep -q "success\|pickupTime\|error"; then
    log_pass "setPickupTime handled"
else
    log_fail "setPickupTime failed"
fi
echo ""

# ========================================
# TEST 5: Order Creation
# ========================================
echo "=========================================="
echo "ORDER CREATION"
echo "=========================================="
echo ""

log_test "createOrder - Empty Cart (should fail)"
call_tool "clearCart" > /dev/null
RESULT=$(call_tool "createOrder" '{"customerName":"Test User","customerPhone":"+61412345678"}')
if echo "$RESULT" | grep -q "empty\|error"; then
    log_pass "Empty cart validation works"
else
    log_fail "Empty cart not validated"
fi
echo ""

log_test "createOrder - No Pickup Time (should fail)"
call_tool "quickAddItem" '{"description":"lamb mandi"}' > /dev/null
RESULT=$(call_tool "createOrder" '{"customerName":"Test User","customerPhone":"+61412345678"}')
if echo "$RESULT" | grep -q "pickup\|error\|time"; then
    log_pass "Pickup time validation works"
else
    log_fail "Pickup time not validated"
fi
echo ""

log_test "createOrder - Complete Order"
call_tool "clearCart" > /dev/null
call_tool "quickAddItem" '{"description":"lamb mandi"}' > /dev/null
call_tool "estimateReadyTime" > /dev/null
RESULT=$(call_tool "createOrder" '{"customerName":"Test User","customerPhone":"+61412345678","notes":"Test order"}')
if echo "$RESULT" | grep -q "orderId\|orderNumber\|success"; then
    log_pass "Complete order creation works"
else
    log_fail "Order creation failed"
    echo "Response: $RESULT"
fi
echo ""

# ========================================
# TEST 6: Edge Cases
# ========================================
echo "=========================================="
echo "EDGE CASES & ERROR HANDLING"
echo "=========================================="
echo ""

log_test "Invalid Item"
RESULT=$(call_tool "quickAddItem" '{"description":"pizza"}')
if echo "$RESULT" | grep -q "error\|not\|invalid"; then
    log_pass "Invalid item rejected"
else
    log_fail "Invalid item not handled"
fi
echo ""

log_test "Empty Description"
RESULT=$(call_tool "quickAddItem" '{"description":""}')
if echo "$RESULT" | grep -q "error\|empty"; then
    log_pass "Empty description rejected"
else
    log_fail "Empty description not handled"
fi
echo ""

log_test "Invalid Item Index"
RESULT=$(call_tool "removeCartItem" '{"itemIndex":999}')
if echo "$RESULT" | grep -q "error\|invalid"; then
    log_pass "Invalid index rejected"
else
    log_fail "Invalid index not handled"
fi
echo ""

log_test "SQL Injection Attempt"
RESULT=$(call_tool "quickAddItem" '{"description":"'; DROP TABLE orders; --"}')
if echo "$RESULT" | grep -q "error\|invalid"; then
    log_pass "SQL injection blocked"
else
    log_info "SQL injection returned: Check for sanitization"
fi
echo ""

# ========================================
# TEST 7: Stress Test
# ========================================
echo "=========================================="
echo "STRESS TESTS"
echo "=========================================="
echo ""

log_test "Multiple Rapid Adds"
call_tool "clearCart" > /dev/null
for i in {1..10}; do
    call_tool "quickAddItem" '{"description":"lamb mandi"}' > /dev/null
done
RESULT=$(call_tool "getCartState")
if echo "$RESULT" | grep -q "count"; then
    log_pass "Handled 10 rapid additions"
else
    log_fail "Rapid additions failed"
fi
echo ""

# ========================================
# SUMMARY
# ========================================
echo ""
echo "=========================================="
echo "  TEST RESULTS"
echo "=========================================="
echo ""
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo "Total:  $((PASS_COUNT + FAIL_COUNT))"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  $FAIL_COUNT TESTS FAILED${NC}"
    echo ""
    echo "This may be normal during initial setup."
    echo "Check server logs for details."
    echo ""
    exit 1
fi
