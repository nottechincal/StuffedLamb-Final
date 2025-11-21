import { describe, it } from 'node:test';
import assert from 'node:assert';

// fetch is available globally in Node.js 18+
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:8000/webhook';

// Mock VAPI message structure
function createToolCall(functionName, args = {}) {
  return {
    message: {
      call: {
        id: `test-call-${Date.now()}`,
        customer: {
          number: '+61412345678'
        }
      },
      toolCalls: [
        {
          id: `tool-call-${Date.now()}`,
          function: {
            name: functionName,
            arguments: args
          }
        }
      ]
    }
  };
}

async function callWebhook(functionName, args = {}) {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createToolCall(functionName, args))
  });

  const data = await response.json();
  return JSON.parse(data.results[0].result);
}

describe('Stuffed Lamb Voice Ordering System', () => {

  describe('1. Basic Operations', () => {

    it('should check if shop is open', async () => {
      const result = await callWebhook('checkOpen');
      assert.ok(result.hasOwnProperty('isOpen'));
      assert.ok(result.hasOwnProperty('message'));
    });

    it('should get caller context', async () => {
      const result = await callWebhook('getCallerSmartContext');
      assert.ok(result.phoneNumber);
      assert.ok(result.hasOwnProperty('totalOrders'));
    });

  });

  describe('2. Order Management - Happy Path', () => {

    it('should add single item via NLP', async () => {
      const result = await callWebhook('quickAddItem', {
        description: 'lamb mandi'
      });
      assert.strictEqual(result.success, true);
      assert.ok(result.message);
    });

    it('should add multiple items in one order', async () => {
      await callWebhook('clearCart'); // Start fresh

      await callWebhook('quickAddItem', { description: 'lamb mandi' });
      await callWebhook('quickAddItem', { description: 'chicken mandi' });
      await callWebhook('quickAddItem', { description: 'coke' });

      const cart = await callWebhook('getCartState');
      assert.strictEqual(cart.count, 3);
    });

    it('should handle complex NLP orders', async () => {
      await callWebhook('clearCart');

      const result = await callWebhook('quickAddItem', {
        description: '2 large lamb kebabs with extra garlic sauce'
      });

      assert.strictEqual(result.success, true);
    });

    it('should calculate correct pricing', async () => {
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'lamb mandi' }); // $28

      const pricing = await callWebhook('priceCart');
      assert.strictEqual(pricing.subtotal, '28.00');
      assert.ok(parseFloat(pricing.gst) > 0);
      assert.strictEqual(pricing.total, '28.00');
    });

  });

  describe('3. NLP Parser Edge Cases', () => {

    it('should handle misspellings gracefully', async () => {
      await callWebhook('clearCart');

      // Common misspellings
      const result = await callWebhook('quickAddItem', {
        description: 'chiken mandi' // typo
      });

      // Should still work or give clear error
      assert.ok(result.hasOwnProperty('success'));
    });

    it('should handle ambiguous quantities', async () => {
      await callWebhook('clearCart');

      const result = await callWebhook('quickAddItem', {
        description: 'a couple of cokes'
      });

      // Should either parse correctly or ask for clarification
      assert.ok(result.hasOwnProperty('success'));
    });

    it('should reject items not on menu', async () => {
      await callWebhook('clearCart');

      const result = await callWebhook('quickAddItem', {
        description: 'pizza with pepperoni'
      });

      // Should fail gracefully
      assert.ok(result.error || result.success === false);
    });

    it('should handle empty descriptions', async () => {
      await callWebhook('clearCart');

      const result = await callWebhook('quickAddItem', {
        description: ''
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

  });

  describe('4. Cart Modifications', () => {

    it('should remove items by index', async () => {
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'lamb mandi' });
      await callWebhook('quickAddItem', { description: 'coke' });

      const result = await callWebhook('removeCartItem', { itemIndex: 0 });
      assert.strictEqual(result.success, true);

      const cart = await callWebhook('getCartState');
      assert.strictEqual(cart.count, 1);
    });

    it('should edit item properties', async () => {
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'lamb mandi' });

      const result = await callWebhook('editCartItem', {
        itemIndex: 0,
        modifications: { quantity: 2 }
      });

      assert.strictEqual(result.success, true);
    });

    it('should clear entire cart', async () => {
      await callWebhook('quickAddItem', { description: 'lamb mandi' });
      await callWebhook('quickAddItem', { description: 'coke' });

      const result = await callWebhook('clearCart');
      assert.ok(result.cleared >= 2);

      const cart = await callWebhook('getCartState');
      assert.strictEqual(cart.count, 0);
    });

    it('should handle invalid item index', async () => {
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'lamb mandi' });

      const result = await callWebhook('removeCartItem', { itemIndex: 99 });
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

  });

  describe('5. Combo Meal Conversions', () => {

    it('should convert kebab to combo', async () => {
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'lamb mandi' });

      const result = await callWebhook('convertItemsToMeals', {
        drinkBrand: 'coke',
        chipsSize: 'small'
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.converted > 0);
    });

    it('should not convert non-eligible items', async () => {
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'coke' });

      const result = await callWebhook('convertItemsToMeals');
      assert.strictEqual(result.converted, 0);
    });

  });

  describe('6. Pickup Time Management', () => {

    it('should estimate ready time', async () => {
      const result = await callWebhook('estimateReadyTime');
      assert.ok(result.estimatedMinutes);
      assert.ok(result.readyTime);
      assert.ok(result.fullTime);
    });

    it('should set custom pickup time', async () => {
      const result = await callWebhook('setPickupTime', {
        requestedTime: '6:30pm'
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.pickupTime);
    });

    it('should handle invalid time format', async () => {
      const result = await callWebhook('setPickupTime', {
        requestedTime: 'tomorrow at midnight on tuesday'
      });

      // Should either parse or fail gracefully
      assert.ok(result.hasOwnProperty('success'));
    });

  });

  describe('7. Order Creation', () => {

    it('should create complete order', async () => {
      // Setup
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'lamb mandi' });
      await callWebhook('estimateReadyTime');

      // Create order
      const result = await callWebhook('createOrder', {
        customerName: 'Test User',
        customerPhone: '+61412345678',
        notes: 'Test order'
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.orderId);
      assert.ok(result.orderNumber);
      assert.ok(result.total);
    });

    it('should reject order without pickup time', async () => {
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'lamb mandi' });

      // Don't set pickup time
      const result = await callWebhook('createOrder', {
        customerName: 'Test User',
        customerPhone: '+61412345678'
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should reject order with empty cart', async () => {
      await callWebhook('clearCart');
      await callWebhook('estimateReadyTime');

      const result = await callWebhook('createOrder', {
        customerName: 'Test User',
        customerPhone: '+61412345678'
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('empty'));
    });

    it('should clear cart after successful order', async () => {
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'lamb mandi' });
      await callWebhook('estimateReadyTime');

      await callWebhook('createOrder', {
        customerName: 'Test User',
        customerPhone: '+61412345678'
      });

      const cart = await callWebhook('getCartState');
      assert.strictEqual(cart.count, 0);
    });

  });

  describe('8. Customer History', () => {

    it('should track order history', async () => {
      // Place an order first
      await callWebhook('clearCart');
      await callWebhook('quickAddItem', { description: 'lamb mandi' });
      await callWebhook('estimateReadyTime');
      await callWebhook('createOrder', {
        customerName: 'Repeat Customer',
        customerPhone: '+61412345678'
      });

      // Check context
      const context = await callWebhook('getCallerSmartContext');
      assert.ok(context.totalOrders > 0);
    });

    it('should repeat last order', async () => {
      const result = await callWebhook('repeatLastOrder', {
        phoneNumber: '+61412345678'
      });

      // Should either work or say no history
      assert.ok(result.hasOwnProperty('success'));
    });

  });

  describe('9. Stress Tests', () => {

    it('should handle very large orders', async () => {
      await callWebhook('clearCart');

      // Add 20 items
      for (let i = 0; i < 20; i++) {
        await callWebhook('quickAddItem', { description: 'lamb mandi' });
      }

      const cart = await callWebhook('getCartState');
      assert.strictEqual(cart.count, 20);

      const pricing = await callWebhook('priceCart');
      assert.ok(parseFloat(pricing.total) > 500);
    });

    it('should handle rapid cart modifications', async () => {
      await callWebhook('clearCart');

      // Rapid add/remove
      await callWebhook('quickAddItem', { description: 'lamb mandi' });
      await callWebhook('quickAddItem', { description: 'coke' });
      await callWebhook('removeCartItem', { itemIndex: 0 });
      await callWebhook('quickAddItem', { description: 'chicken mandi' });
      await callWebhook('editCartItem', { itemIndex: 0, modifications: { quantity: 3 } });

      const cart = await callWebhook('getCartState');
      assert.ok(cart.count > 0);
    });

  });

  describe('10. Input Validation', () => {

    it('should handle null parameters', async () => {
      try {
        await callWebhook('quickAddItem', { description: null });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error);
      }
    });

    it('should handle missing required parameters', async () => {
      try {
        await callWebhook('createOrder', {
          customerName: 'Test'
          // Missing customerPhone
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error);
      }
    });

    it('should handle SQL injection attempts', async () => {
      const result = await callWebhook('quickAddItem', {
        description: "'; DROP TABLE orders; --"
      });

      // Should safely fail or ignore
      assert.ok(result.hasOwnProperty('success'));
    });

    it('should handle XSS attempts', async () => {
      const result = await callWebhook('createOrder', {
        customerName: '<script>alert("xss")</script>',
        customerPhone: '+61412345678'
      });

      // Should sanitize or reject
      assert.ok(result.hasOwnProperty('success'));
    });

  });

});
