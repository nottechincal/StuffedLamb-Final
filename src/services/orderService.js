import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ORDERS_DIR = join(__dirname, '../../data/orders');
const CUSTOMERS_FILE = join(__dirname, '../../data/customers.json');

class OrderService {
  constructor() {
    // Ensure directories exist
    if (!existsSync(ORDERS_DIR)) {
      mkdirSync(ORDERS_DIR, { recursive: true });
    }

    // Initialize customers file
    if (!existsSync(CUSTOMERS_FILE)) {
      writeFileSync(CUSTOMERS_FILE, JSON.stringify({}, null, 2));
    }
  }

  createOrder(orderData) {
    const orderId = uuidv4();
    const timezone = process.env.SHOP_TIMEZONE || 'Australia/Melbourne';
    const now = new Date();

    const order = {
      id: orderId,
      orderNumber: this.generateOrderNumber(),
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      items: orderData.items,
      pricing: orderData.pricing,
      pickupTime: orderData.pickupTime,
      estimatedReadyTime: orderData.estimatedReadyTime,
      notes: orderData.notes || '',
      status: 'pending',
      createdAt: now.toISOString(),
      createdAtLocal: formatInTimeZone(now, timezone, 'yyyy-MM-dd HH:mm:ss zzz'),
      updatedAt: now.toISOString()
    };

    // Save order to file
    const orderFile = join(ORDERS_DIR, `${orderId}.json`);
    writeFileSync(orderFile, JSON.stringify(order, null, 2));

    // Update customer history
    this.updateCustomerHistory(orderData.customerPhone, order);

    return order;
  }

  generateOrderNumber() {
    // Generate order number: YYYYMMDD-### format
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${date}-${random}`;
  }

  updateCustomerHistory(phoneNumber, order) {
    try {
      const customers = JSON.parse(readFileSync(CUSTOMERS_FILE, 'utf-8'));

      if (!customers[phoneNumber]) {
        customers[phoneNumber] = {
          phone: phoneNumber,
          orders: [],
          favoriteItems: {},
          totalOrders: 0,
          totalSpent: 0,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt
        };
      }

      const customer = customers[phoneNumber];

      // Add order to history (keep last 20)
      customer.orders.unshift({
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        total: order.pricing.total,
        items: order.items.length
      });

      if (customer.orders.length > 20) {
        customer.orders = customer.orders.slice(0, 20);
      }

      // Update stats
      customer.totalOrders++;
      customer.totalSpent = (parseFloat(customer.totalSpent) + parseFloat(order.pricing.total)).toFixed(2);
      customer.lastOrderDate = order.createdAt;

      // Track favorite items
      for (const item of order.items) {
        const key = `${item.category}-${item.size || ''}-${item.protein || item.brand || ''}`;
        customer.favoriteItems[key] = (customer.favoriteItems[key] || 0) + (item.quantity || 1);
      }

      // Save
      writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));

      return customer;
    } catch (error) {
      console.error('Error updating customer history:', error);
      return null;
    }
  }

  getCustomerData(phoneNumber) {
    try {
      const customers = JSON.parse(readFileSync(CUSTOMERS_FILE, 'utf-8'));
      return customers[phoneNumber] || null;
    } catch (error) {
      console.error('Error reading customer data:', error);
      return null;
    }
  }

  getLastOrder(phoneNumber) {
    try {
      const customer = this.getCustomerData(phoneNumber);
      if (!customer || customer.orders.length === 0) {
        return null;
      }

      const lastOrderRef = customer.orders[0];
      const orderFile = join(ORDERS_DIR, `${lastOrderRef.id}.json`);

      if (existsSync(orderFile)) {
        return JSON.parse(readFileSync(orderFile, 'utf-8'));
      }

      return null;
    } catch (error) {
      console.error('Error reading last order:', error);
      return null;
    }
  }

  getOrder(orderId) {
    try {
      const orderFile = join(ORDERS_DIR, `${orderId}.json`);
      if (existsSync(orderFile)) {
        return JSON.parse(readFileSync(orderFile, 'utf-8'));
      }
      return null;
    } catch (error) {
      console.error('Error reading order:', error);
      return null;
    }
  }

  updateOrderStatus(orderId, status) {
    try {
      const order = this.getOrder(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      order.status = status;
      order.updatedAt = new Date().toISOString();

      const orderFile = join(ORDERS_DIR, `${orderId}.json`);
      writeFileSync(orderFile, JSON.stringify(order, null, 2));

      return { success: true, order };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message };
    }
  }

  getTodaysOrders() {
    try {
      const today = format(new Date(), 'yyyyMMdd');
      const orders = [];

      if (!existsSync(ORDERS_DIR)) {
        return orders;
      }

      const files = require('fs').readdirSync(ORDERS_DIR);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const order = JSON.parse(readFileSync(join(ORDERS_DIR, file), 'utf-8'));
          if (order.orderNumber && order.orderNumber.startsWith(today)) {
            orders.push(order);
          }
        }
      }

      return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting today\'s orders:', error);
      return [];
    }
  }

  getQueueSize() {
    const orders = this.getTodaysOrders();
    return orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  }
}

export default new OrderService();
