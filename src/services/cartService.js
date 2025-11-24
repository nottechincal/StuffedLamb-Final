import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as naturalSpeech from '../utils/naturalSpeech.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load menu data
const menuData = JSON.parse(
  readFileSync(join(__dirname, '../../data/menu.json'), 'utf-8')
);

class CartService {
  /**
   * Add item to cart
   * @param {Array} cart - Current cart
   * @param {Object} itemConfig - Item configuration
   * @param {string} itemConfig.category - Category (main_dishes, sides, drinks)
   * @param {string} itemConfig.item_id - Item ID (mansaf, lamb_mandi, etc.)
   * @param {number} itemConfig.quantity - Quantity
   * @param {Array<string>} itemConfig.addons - Addon IDs
   * @param {string} itemConfig.drink_option - For drinks (coke, sprite, etc.)
   * @param {string} itemConfig.notes - Special instructions
   */
  addItemToCart(cart, itemConfig) {
    const { category, item_id, quantity, addons, drink_option, notes } = itemConfig;

    // Validate category and item
    if (!menuData[category]) {
      return {
        success: false,
        error: `Invalid category: ${category}`
      };
    }

    const menuItem = menuData[category].items.find(item => item.id === item_id);
    if (!menuItem) {
      return {
        success: false,
        error: `Item not found: ${item_id} in category ${category}`
      };
    }

    // Validate addons if provided
    if (addons && addons.length > 0 && menuItem.addons) {
      const validAddons = Object.keys(menuItem.addons);
      const invalidAddons = addons.filter(addon => !validAddons.includes(addon));
      if (invalidAddons.length > 0) {
        return {
          success: false,
          error: `Invalid addons for ${item_id}: ${invalidAddons.join(', ')}`
        };
      }
    }

    // Validate drink option if provided
    if (drink_option && menuItem.options) {
      if (!menuItem.options.includes(drink_option.toLowerCase())) {
        return {
          success: false,
          error: `Invalid drink option: ${drink_option}. Available: ${menuItem.options.join(', ')}`
        };
      }
    }

    // SMART DUPLICATE DETECTION
    // Check if identical item already exists (exact match on item_id, drink_option, and addons)
    const normalizedAddons = (addons || []).sort();
    const existingItemIndex = cart.findIndex(item =>
      item.item_id === item_id &&
      item.drink_option === (drink_option || null) &&
      JSON.stringify((item.addons || []).sort()) === JSON.stringify(normalizedAddons)
    );

    if (existingItemIndex >= 0) {
      // Combine quantities instead of adding duplicate
      const oldQuantity = cart[existingItemIndex].quantity;
      cart[existingItemIndex].quantity += (quantity || 1);

      console.log(`[CART] Combined ${quantity || 1}x ${menuItem.name} with existing item (total: ${cart[existingItemIndex].quantity})`);

      const spokenItem = this.describeItemForSpeech(cart[existingItemIndex], { includeArticle: false });
      const message = naturalSpeech.getAddedConfirmation(spokenItem, quantity || 1);
      return {
        success: true,
        itemIndex: existingItemIndex,
        item: cart[existingItemIndex],
        message,
        combined: true
      };
    }

    // ENHANCED: Check if same item exists with DIFFERENT addons (likely a modification)
    // If found within last 60 seconds, merge addons instead of creating duplicate
    const recentSameItemIndex = cart.findIndex(item => {
      if (item.item_id !== item_id) return false;
      if (item.drink_option !== (drink_option || null)) return false;

      // Check if added recently (within 60 seconds)
      const itemAge = Date.now() - new Date(item.timestamp).getTime();
      if (itemAge > 60000) return false; // Older than 1 minute, treat as separate order

      // Same item, recent, different addons - likely a modification
      return JSON.stringify((item.addons || []).sort()) !== JSON.stringify(normalizedAddons);
    });

    if (recentSameItemIndex >= 0 && normalizedAddons.length > 0) {
      // Merge addons instead of creating duplicate
      const existingAddons = cart[recentSameItemIndex].addons || [];
      const mergedAddons = [...new Set([...existingAddons, ...normalizedAddons])];

      console.log(`[CART] Detected addon modification for ${menuItem.name}. Merging addons:`, {
        before: existingAddons,
        adding: normalizedAddons,
        merged: mergedAddons
      });

      cart[recentSameItemIndex].addons = mergedAddons;
      cart[recentSameItemIndex].quantity += (quantity || 1) - 1; // Don't double the quantity
      cart[recentSameItemIndex].timestamp = new Date().toISOString(); // Update timestamp

      const spokenItem = this.describeItemForSpeech(cart[recentSameItemIndex], { includeArticle: false });
      const message = `Got it! Updated ${spokenItem}`;
      return {
        success: true,
        itemIndex: recentSameItemIndex,
        item: cart[recentSameItemIndex],
        message,
        merged: true
      };
    }

    console.log(`[CART] Adding new item: ${quantity || 1}x ${menuItem.name}`, {
      addons: normalizedAddons,
      drink_option
    });

    const item = {
      category,
      item_id,
      item_name: menuItem.name,
      quantity: quantity || 1,
      addons: addons || [],
      drink_option: drink_option || null,
      notes: notes || null,
      timestamp: new Date().toISOString()
    };

    cart.push(item);

    // Use natural confirmation instead of robotic "Added 1x Item"
    const spokenItem = this.describeItemForSpeech(item);
    const message = naturalSpeech.getAddedConfirmation(spokenItem, item.quantity);

    return {
      success: true,
      itemIndex: cart.length - 1,
      item,
      message
    };
  }

  /**
   * Add multiple items at once
   */
  addMultipleItems(cart, items) {
    const addedItems = [];
    const errors = [];

    for (const itemConfig of items) {
      const result = this.addItemToCart(cart, itemConfig);
      if (result.success) {
        addedItems.push(result);
      } else {
        errors.push(result.error);
      }
    }

    return {
      success: errors.length === 0,
      count: addedItems.length,
      items: addedItems,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Remove item from cart
   */
  removeItem(cart, itemIndex) {
    if (itemIndex < 0 || itemIndex >= cart.length) {
      return { success: false, error: 'Invalid item index' };
    }

    const removed = cart.splice(itemIndex, 1)[0];
    const message = naturalSpeech.getRemovalConfirmation(removed.item_name);

    return {
      success: true,
      removed,
      message
    };
  }

  /**
   * Edit cart item
   */
  editItem(cart, itemIndex, modifications) {
    if (itemIndex < 0 || itemIndex >= cart.length) {
      return { success: false, error: 'Invalid item index' };
    }

    const item = cart[itemIndex];

    // Apply modifications
    for (const [key, value] of Object.entries(modifications)) {
      if (key === 'quantity' && value > 0) {
        item.quantity = value;
      } else if (key === 'addons' && Array.isArray(value)) {
        // Validate addons before applying
        const menuItem = this.getMenuItem(item.category, item.item_id);
        if (menuItem && menuItem.addons) {
          const validAddons = Object.keys(menuItem.addons);
          const invalidAddons = value.filter(addon => !validAddons.includes(addon));
          if (invalidAddons.length === 0) {
            item.addons = value;
          }
        }
      } else if (key === 'notes') {
        item.notes = value;
      }
    }

    const message = naturalSpeech.getUpdateConfirmation(item.item_name);

    return {
      success: true,
      item,
      message
    };
  }

  /**
   * Clear entire cart
   */
  clearCart(cart) {
    const count = cart.length;
    cart.length = 0;

    const messages = [
      "Starting fresh",
      "All clear",
      "Cart's empty now",
      "Cleared everything out"
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      success: true,
      cleared: count,
      message
    };
  }

  /**
   * Get cart state with formatted summary
   */
  getCartState(cart) {
    // Don't number items - just list them naturally
    const formatted = cart.map((item) => {
      return this.formatItem(item);
    });

    return {
      items: cart,
      count: cart.length,
      formatted: formatted.join(', '),  // Comma-separated, not numbered list
      isEmpty: cart.length === 0
    };
  }

  /**
   * Format single item for display
   */
  formatItem(item) {
    const parts = [];

    // Quantity
    if (item.quantity > 1) {
      parts.push(`${item.quantity}x`);
    }

    // Item name
    parts.push(item.item_name);

    // Drink option (for soft drinks)
    if (item.drink_option) {
      parts.push(`(${item.drink_option})`);
    }

    // Addons
    if (item.addons && item.addons.length > 0) {
      const menuItem = this.getMenuItem(item.category, item.item_id);
      if (menuItem && menuItem.addons) {
        const addonNames = item.addons.map(addonId => {
          const addon = menuItem.addons[addonId];
          return addon ? addon.name : addonId;
        });
        parts.push(`+ ${addonNames.join(', ')}`);
      }
    }

    // Notes
    if (item.notes) {
      parts.push(`[Note: ${item.notes}]`);
    }

    return parts.join(' ');
  }

  describeItemForSpeech(item, options = {}) {
    const { includeArticle = true } = options;
    const menuItem = this.getMenuItem(item.category, item.item_id);

    // Prefer the specific drink name for soft drinks
    const baseName = (item.item_id === 'soft_drink' && item.drink_option)
      ? item.drink_option.toLowerCase()
      : (menuItem?.name || item.item_name || 'item').toLowerCase();

    const quantityPhrase = item.quantity > 1
      ? `${item.quantity} ${baseName}${item.quantity > 1 ? 's' : ''}`
      : includeArticle
        ? `a ${baseName}`
        : baseName;

    const addonNames = (item.addons || []).map((addonId) => {
      const addon = menuItem?.addons?.[addonId];
      return addon ? addon.name.toLowerCase() : addonId.toLowerCase();
    });

    const detailParts = [...addonNames];

    if (item.drink_option && item.item_id !== 'soft_drink') {
      detailParts.push(`a ${item.drink_option.toLowerCase()}`);
    }

    if (item.notes) {
      detailParts.push(item.notes.toLowerCase());
    }

    const detailString = detailParts.length > 0
      ? ` with ${naturalSpeech.formatItemList(detailParts)}`
      : '';

    return `${quantityPhrase}${detailString}`;
  }

  /**
   * Get menu item by category and ID
   */
  getMenuItem(category, item_id) {
    if (!menuData[category]) return null;
    return menuData[category].items.find(item => item.id === item_id);
  }

  /**
   * Calculate price for a single item
   */
  calculateItemPrice(item) {
    const menuItem = this.getMenuItem(item.category, item.item_id);
    if (!menuItem) return 0;

    let price = menuItem.price;

    // Add addon prices
    if (item.addons && item.addons.length > 0 && menuItem.addons) {
      for (const addonId of item.addons) {
        const addon = menuItem.addons[addonId];
        if (addon && addon.price) {
          price += addon.price;
        }
      }
    }

    return price * (item.quantity || 1);
  }

  /**
   * Calculate cart total with GST breakdown
   */
  priceCart(cart, options = {}) {
    const lastAction = options.lastAction;
    const recentLastAction = lastAction?.timestamp
      ? (Date.now() - new Date(lastAction.timestamp).getTime()) < 120000
      : false;

    let subtotal = 0;

    for (const item of cart) {
      subtotal += this.calculateItemPrice(item);
    }

    const gstRate = parseFloat(process.env.GST_RATE) || 0.10;
    const gst = subtotal * (gstRate / (1 + gstRate)); // Extract GST from total
    const total = subtotal;

    const spokenItems = cart.map((item) => this.describeItemForSpeech(item)).filter(Boolean);
    const itemsLine = naturalSpeech.formatItemList(spokenItems);
    const spokenTotal = naturalSpeech.formatMoney(total);
    const spokenSummary = spokenItems.length
      ? `That's ${itemsLine}, that comes to ${spokenTotal}.`
      : 'Cart is empty.';

    return {
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2),
      itemCount: cart.length,
      currency: 'AUD',
      spokenItems,
      spokenSummary,
      spokenSummaryWithPrompt: spokenItems.length
        ? `${itemsLine ? `That's ${itemsLine},` : ''} that comes to ${spokenTotal}. Anything else?`
        : 'Cart is empty. Anything else?'
    };
  }

  /**
   * Get complete order summary
   */
  getOrderSummary(cart) {
    const pricing = this.priceCart(cart);
    // Don't number items - keep it natural
    const items = cart.map((item) =>
      `${this.formatItem(item)} - $${this.calculateItemPrice(item).toFixed(2)}`
    );

    // Brief summary - just items and total
    const summary = [
      ...items,
      `TOTAL: ${naturalSpeech.formatMoney(pricing.total)}`
    ].join('\n');

    return {
      summary,
      pricing,
      itemCount: cart.length
    };
  }

  /**
   * Get full menu for reference
   */
  getFullMenu() {
    return menuData;
  }

  /**
   * Search menu by keywords
   */
  searchMenu(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    for (const [category, categoryData] of Object.entries(menuData)) {
      for (const item of categoryData.items) {
        if (
          item.name.toLowerCase().includes(lowerKeyword) ||
          item.id.toLowerCase().includes(lowerKeyword) ||
          (item.description && item.description.toLowerCase().includes(lowerKeyword))
        ) {
          results.push({
            category,
            item
          });
        }
      }
    }

    return results;
  }
}

export default new CartService();
