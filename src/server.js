import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import sessionManager from './services/sessionManager.js';
import cartService from './services/cartService.js';
import nlpParser from './services/nlpParser.js';
import orderService from './services/orderService.js';
import smsService from './services/smsService.js';
import logger from './utils/logger.js';
import * as naturalSpeech from './utils/naturalSpeech.js';
import { isShopOpen, getNextOpenTime, estimateReadyTime, parsePickupTime } from './utils/businessHours.js';

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware - increase payload limit for large conversation transcripts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  if (req.path !== '/health') {
    const bodySummary = logger.summarizePayload(req.body);
    logger.info(`${req.method} ${req.path}`, { bodySummary });
  }
  next();
});

// ==================== HELPER FUNCTIONS ====================

function getCallId(req) {
  // Vapi sends the chat/call ID in message.chat.id
  return req.body.message?.chat?.id
    || req.body.message?.call?.id
    || req.body.call?.id
    || 'unknown';
}

async function getOrCreateSession(callId) {
  return await sessionManager.getSession(callId);
}

async function saveSession(callId, session) {
  await sessionManager.saveSession(callId, session);
}

// ==================== WEBHOOK ENDPOINTS ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    shop: process.env.SHOP_NAME || 'Stuffed Lamb',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Main webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { message } = req.body;

    // BULLETPROOF SESSION ISOLATION
    // Problem: Vapi reuses call IDs across test suite runs
    // Solution: Detect fresh conversations and reset contaminated sessions

    const callId = getCallId(req);
    logger.info(`[WEBHOOK] Received message type: ${message?.type}, callId: ${callId}`);

    if (message && message.type === 'tool-calls') {
      const conversationLength = message.artifact?.messages?.length || 0;
      logger.info(`[CONV LENGTH] ${conversationLength} messages in conversation`);

      // Peek at session without creating a new one
      if (callId !== 'unknown') {
        const existingSession = await sessionManager.peekSession(callId);
        const cartSize = existingSession?.cart?.length || 0;

        if (existingSession) {
          logger.info(`[SESSION EXISTS] callId=${callId}, cart=${cartSize} items`);

          // RESET LOGIC: Fresh conversation (<10 msgs) with existing cart = contamination!
          if (conversationLength < 10 && cartSize > 0) {
            logger.info(`[SESSION RESET] *** CONTAMINATION DETECTED *** Fresh convo (${conversationLength} msgs) + existing cart (${cartSize} items) - RESETTING NOW`);
            await sessionManager.deleteSession(callId);
          }
        } else {
          logger.info(`[SESSION NEW] No existing session for callId=${callId}`);
        }
      }
    }

    if (!message || !message.toolCalls || message.toolCalls.length === 0) {
      return res.json({ results: [] });
    }

    const results = [];

    for (const toolCall of message.toolCalls) {
      const { function: func, id: toolCallId} = toolCall;
      const functionName = func.name;

      // Parse arguments - VAPI sends them as a JSON string
      let params = func.arguments;
      if (typeof params === 'string') {
        try {
          params = JSON.parse(params);
        } catch (e) {
          logger.error(`Failed to parse arguments for ${functionName}:`, e);
          params = {};
        }
      }

      logger.info(`Processing: ${functionName}`, logger.summarizePayload(params));

      let result;

      try {
        switch (functionName) {
          case 'checkOpen':
            result = await handleCheckOpen();
            break;

          case 'getCallerSmartContext':
            result = await handleGetCallerSmartContext(req);
            break;

          case 'quickAddItem':
            result = await handleQuickAddItem(req, params);
            break;

          case 'addMultipleItemsToCart':
            result = await handleAddMultipleItems(req, params);
            break;

          case 'getCartState':
            result = await handleGetCartState(req);
            break;

          case 'removeCartItem':
            result = await handleRemoveCartItem(req, params);
            break;

          case 'clearCart':
            result = await handleClearCart(req);
            break;

          case 'editCartItem':
            result = await handleEditCartItem(req, params);
            break;

          case 'priceCart':
            result = await handlePriceCart(req);
            break;

          case 'convertItemsToMeals':
            result = await handleConvertToMeals(req, params);
            break;

          case 'getOrderSummary':
            result = await handleGetOrderSummary(req);
            break;

          case 'setPickupTime':
            result = await handleSetPickupTime(req, params);
            break;

          case 'estimateReadyTime':
            result = await handleEstimateReadyTime(req);
            break;

          case 'sendMenuLink':
            result = await handleSendMenuLink(params);
            break;

          case 'sendReceipt':
            result = await handleSendReceipt(params);
            break;

          case 'createOrder':
            result = await handleCreateOrder(req, params);
            break;

          case 'repeatLastOrder':
            result = await handleRepeatLastOrder(req, params);
            break;

          case 'endCall':
            result = await handleEndCall(req);
            break;

          default:
            result = { error: `Unknown function: ${functionName}` };
        }
      } catch (error) {
        logger.error(`Error in ${functionName}:`, error);
        result = { error: error.message };
      }

      // Update session timestamp for idle detection
      if (callId && callId !== 'unknown') {
        try {
          const session = await sessionManager.getSession(callId);
          if (session) {
            session.metadata.lastToolCallTime = new Date().toISOString();
            await sessionManager.saveSession(callId, session);
          }
        } catch (e) {
          // Ignore timestamp update errors
        }
      }

      logger.webhook(functionName, params, result);

      results.push({
        toolCallId,
        result: JSON.stringify(result)
      });
    }

    res.json({ results });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HANDLER FUNCTIONS ====================

async function handleCheckOpen() {
  const open = isShopOpen();
  return {
    isOpen: open,
    message: open
      ? "We're open and ready to take your order!"
      : `Sorry, we're currently closed. We'll be open ${getNextOpenTime()}.`
  };
}

async function handleGetCallerSmartContext(req) {
  const callId = getCallId(req);

  // Try multiple locations for phone number in Vapi payload
  const callerNumber = req.body.message?.call?.customer?.number
    || req.body.message?.call?.phoneNumber
    || req.body.call?.customer?.number
    || req.body.call?.phoneNumber
    || req.body.message?.call?.customerPhoneNumber
    || 'unknown';

  logger.info('getCallerSmartContext: extracted phone', { callerNumber, hasCall: !!req.body.message?.call });

  const customerData = orderService.getCustomerData(callerNumber);

  if (customerData) {
    return {
      phoneNumber: callerNumber,
      totalOrders: customerData.totalOrders,
      lastOrderDate: customerData.lastOrderDate,
      favoriteItems: Object.keys(customerData.favoriteItems).slice(0, 3),
      greeting: `Welcome back! You've ordered ${customerData.totalOrders} times.`
    };
  }

  return {
    phoneNumber: callerNumber,
    totalOrders: 0,
    greeting: 'Welcome to Stuffed Lamb! First time ordering?'
  };
}

async function handleQuickAddItem(req, params) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  const parsed = nlpParser.parse(params.description);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const result = cartService.addItemToCart(session.cart, parsed.itemConfig);
  await saveSession(callId, session);

  // Use varied, natural confirmations
  const message = result.message || naturalSpeech.getAddedConfirmation(
    cartService.describeItemForSpeech(result.item),
    result.item.quantity
  );

  return {
    success: true,
    message,
    item: result.item
  };
}

async function handleAddMultipleItems(req, params) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  const result = cartService.addMultipleItems(session.cart, params.items);
  await saveSession(callId, session);

  const message = result.count === 1
    ? naturalSpeech.getConfirmation()
    : `${naturalSpeech.getConfirmation()}, added ${result.count} items`;

  return {
    success: true,
    count: result.count,
    message
  };
}

async function handleGetCartState(req) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  return cartService.getCartState(session.cart);
}

async function handleRemoveCartItem(req, params) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  const result = cartService.removeItem(session.cart, params.itemIndex);
  await saveSession(callId, session);

  return result;
}

async function handleClearCart(req) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  const result = cartService.clearCart(session.cart);
  await saveSession(callId, session);

  return result;
}

async function handleEditCartItem(req, params) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  // Validate that modifications object exists
  if (!params.modifications || typeof params.modifications !== 'object') {
    logger.error('editCartItem called without modifications', { params });
    return {
      success: false,
      error: 'Modifications parameter is required. Example: editCartItem(0, { addons: ["nuts"] })'
    };
  }

  const result = cartService.editItem(session.cart, params.itemIndex, params.modifications);
  await saveSession(callId, session);

  return result;
}

async function handlePriceCart(req) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  return cartService.priceCart(session.cart);
}

async function handleConvertToMeals(req, params) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  const result = cartService.convertToMeals(session.cart, params);
  await saveSession(callId, session);

  return result;
}

async function handleGetOrderSummary(req) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  return cartService.getOrderSummary(session.cart);
}

async function handleSetPickupTime(req, params) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  // Debug logging to see what Vapi is sending
  logger.info('setPickupTime called with:', { requestedTime: params.requestedTime });

  const parsed = parsePickupTime(params.requestedTime);

  logger.info('Parsed result:', parsed);

  if (parsed) {
    session.metadata.pickupTime = parsed.fullTime;
    session.metadata.pickupTimeISO = parsed.iso;
    await saveSession(callId, session);

    const formattedTime = naturalSpeech.formatPickupTime(parsed.fullTime);

    return {
      success: true,
      pickupTime: parsed.fullTime,
      message: `Perfect! Your order will be ready for pickup ${parsed.time}`
    };
  }

  // If parsing failed, suggest next available time
  return {
    success: false,
    error: `I couldn't understand that time. Try saying something like "Wednesday at 1pm" or "in 30 minutes". We're open ${getNextOpenTime()}.`
  };
}

async function handleEstimateReadyTime(req) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  const queueSize = orderService.getQueueSize();
  const estimate = estimateReadyTime(queueSize);

  session.metadata.estimatedReadyTime = estimate.fullTime;
  session.metadata.estimatedReadyTimeISO = estimate.iso;
  await saveSession(callId, session);

  const formattedTime = naturalSpeech.formatPickupTime(estimate.time);
  const message = estimate.minutes <= 20
    ? `Should be ready ${formattedTime}`
    : `That'll be ready ${formattedTime}`;

  return {
    estimatedMinutes: estimate.minutes,
    readyTime: estimate.time,
    fullTime: estimate.fullTime,
    queueSize,
    message
  };
}

async function handleSendMenuLink(params) {
  const result = await smsService.sendMenuLink(params.phoneNumber);
  return result;
}

async function handleSendReceipt(params) {
  const customerData = orderService.getCustomerData(params.phoneNumber);

  if (!customerData || customerData.orders.length === 0) {
    return { success: false, error: 'No recent orders found' };
  }

  const lastOrder = orderService.getOrder(customerData.orders[0].id);

  if (!lastOrder) {
    return { success: false, error: 'Order not found' };
  }

  const result = await smsService.sendReceipt(params.phoneNumber, lastOrder);
  return result;
}

async function handleCreateOrder(req, params) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  if (session.cart.length === 0) {
    return { success: false, error: 'Cart is empty' };
  }

  if (!session.metadata.pickupTime && !session.metadata.estimatedReadyTime) {
    return {
      success: false,
      error: 'Please set a pickup time first using estimateReadyTime or setPickupTime',
      requiresPickupTime: true
    };
  }

  const pricing = cartService.priceCart(session.cart);

  // Prefer explicitly-set pickup time, fall back to estimated time
  const finalPickupTime = session.metadata.pickupTime || session.metadata.estimatedReadyTime;

  const orderData = {
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    items: [...session.cart],
    pricing,
    pickupTime: finalPickupTime,
    estimatedReadyTime: session.metadata.estimatedReadyTime,
    notes: params.notes || ''
  };

  logger.info('Creating order with pickup time:', {
    finalPickupTime,
    explicitPickupTime: session.metadata.pickupTime,
    estimatedTime: session.metadata.estimatedReadyTime
  });

  const order = orderService.createOrder(orderData);

  // Send notifications
  await smsService.sendReceipt(params.customerPhone, order);
  await smsService.notifyShopNewOrder(order);

  // Clear cart
  cartService.clearCart(session.cart);
  await saveSession(callId, session);

  logger.success(`Order created: ${order.orderNumber}`, { total: order.pricing.total });

  // Create natural, conversational confirmation
  const message = naturalSpeech.formatOrderConfirmation(
    order.orderNumber,
    order.pricing.total,
    order.pickupTime
  );

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: order.pricing.total,
    pickupTime: order.pickupTime,
    message
  };
}

async function handleRepeatLastOrder(req, params) {
  const callId = getCallId(req);
  const session = await getOrCreateSession(callId);

  const lastOrder = orderService.getLastOrder(params.phoneNumber);

  if (!lastOrder) {
    return {
      success: false,
      error: naturalSpeech.getNoOrdersMessage()
    };
  }

  // Copy items from last order to current cart
  session.cart = [...lastOrder.items];
  await saveSession(callId, session);

  const cartState = cartService.getCartState(session.cart);

  const message = cartState.count === 1
    ? "Added your usual order"
    : `Added your usual - that's ${cartState.count} items`;

  return {
    success: true,
    message,
    items: cartState.formatted
  };
}

async function handleEndCall(req) {
  const callId = getCallId(req);
  await sessionManager.deleteSession(callId);

  // Don't return a message - let the AI say goodbye from the prompt
  // Returning endCall: true tells VAPI to terminate the call
  logger.info('endCall() triggered - VAPI should end call now');

  return {
    endCall: true  // Signal to VAPI to end the call immediately
  };
}

// ==================== STARTUP ====================

async function startup() {
  try {
    logger.info('🚀 Starting Stuffed Lamb VAPI Server...');

    // Initialize services
    await sessionManager.initialize();
    smsService.initialize();

    // Start server
    app.listen(PORT, HOST, () => {
      logger.success(`✅ Server running on http://${HOST}:${PORT}`);
      logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏪 Shop: ${process.env.SHOP_NAME || 'Stuffed Lamb'}`);
      logger.info(`📞 Webhook ready at: http://${HOST}:${PORT}/webhook`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await sessionManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await sessionManager.close();
  process.exit(0);
});

// Start the server
startup();
