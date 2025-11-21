import twilio from 'twilio';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const businessData = JSON.parse(
  readFileSync(join(__dirname, '../../data/business.json'), 'utf-8')
);

class SMSService {
  constructor() {
    this.client = null;
    this.fromNumber = null;
    this.shopNumber = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    // Read env vars during initialization, not during construction
    this.fromNumber = process.env.TWILIO_FROM;
    this.shopNumber = process.env.SHOP_ORDER_TO;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Debug: Show what we're checking
    console.log('🔍 Twilio Config Check:');
    console.log(`   ACCOUNT_SID: ${accountSid ? 'AC***' + accountSid.slice(-4) : '❌ MISSING'}`);
    console.log(`   AUTH_TOKEN: ${authToken ? '***' + authToken.slice(-4) : '❌ MISSING'}`);
    console.log(`   FROM_NUMBER: ${this.fromNumber || '❌ MISSING'}`);

    if (!accountSid || !authToken || !this.fromNumber) {
      console.warn('⚠️  Twilio credentials not configured. SMS features will be disabled.');
      console.warn(`   Missing: ${!accountSid ? 'ACCOUNT_SID ' : ''}${!authToken ? 'AUTH_TOKEN ' : ''}${!this.fromNumber ? 'FROM_NUMBER' : ''}`);
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.initialized = true;
      console.log('✅ Twilio SMS service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Twilio:', error.message);
    }
  }

  async sendSMS(to, message) {
    if (!this.initialized || !this.client) {
      console.warn('SMS not sent (Twilio not configured):', message.substring(0, 50));
      return { success: false, error: 'Twilio not configured' };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });

      console.log(`✅ SMS sent to ${to}: ${result.sid}`);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error(`❌ Failed to send SMS to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async sendMenuLink(phoneNumber) {
    const menuUrl = process.env.MENU_LINK_URL || 'https://stuffed-lamb.tuckerfox.com.au/';
    const shopName = process.env.SHOP_NAME || businessData.name;

    const message = `Hi from ${shopName}! 🥙\n\nCheck out our menu here:\n${menuUrl}\n\nCall us anytime to place your order!`;

    return await this.sendSMS(phoneNumber, message);
  }

  async sendReceipt(phoneNumber, order) {
    const shopName = process.env.SHOP_NAME || businessData.name;

    const itemsList = order.items.map((item, index) => {
      let desc = `${item.quantity || 1}x `;

      if (item.size) desc += `${item.size} `;
      desc += item.category;

      if (item.protein) desc += ` (${item.protein})`;
      if (item.brand) desc += ` (${item.brand})`;
      if (item.isCombo) desc += ' COMBO';

      return `${index + 1}. ${desc}`;
    }).join('\n');

    const message = `
🧾 ${shopName} - Order Receipt

Order #${order.orderNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: $${order.pricing.subtotal}
GST: $${order.pricing.gst}
TOTAL: $${order.pricing.total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pickup Time: ${order.pickupTime}
Status: ${order.status.toUpperCase()}

${businessData.address}
${businessData.phone}

Thank you for your order! 🥙
    `.trim();

    return await this.sendSMS(phoneNumber, message);
  }

  async notifyShopNewOrder(order) {
    if (!this.shopNumber) {
      console.warn('Shop notification number not configured');
      return { success: false, error: 'Shop number not configured' };
    }

    const itemsList = order.items.map((item, index) => {
      let desc = `${item.quantity || 1}x `;

      if (item.size) desc += `${item.size} `;
      desc += item.category;

      if (item.protein) desc += ` (${item.protein})`;
      if (item.brand) desc += ` (${item.brand})`;

      return `${index + 1}. ${desc}`;
    }).join('\n');

    const message = `
🔔 NEW ORDER - ${order.orderNumber}

Customer: ${order.customerName}
Phone: ${order.customerPhone}
Pickup: ${order.pickupTime}

${itemsList}

TOTAL: $${order.pricing.total}

${order.notes ? `Notes: ${order.notes}` : ''}
    `.trim();

    return await this.sendSMS(this.shopNumber, message);
  }

  formatPhoneNumber(phone) {
    // Ensure E.164 format
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '61' + cleaned.substring(1);
    }

    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }
}

export default new SMSService();
