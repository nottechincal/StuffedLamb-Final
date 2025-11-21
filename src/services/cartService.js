import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
    return {
      success: true,
      itemIndex: cart.length - 1,
      item,
      message: `Added ${item.quantity}x ${menuItem.name} to cart`
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
    return {
      success: true,
      removed,
      message: `Removed ${removed.item_name} from cart`
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

    return {
      success: true,
      item,
      message: `Updated ${item.item_name}`
    };
  }

  /**
   * Clear entire cart
   */
  clearCart(cart) {
    const count = cart.length;
    cart.length = 0;
    return {
      success: true,
      cleared: count,
      message: `Cleared ${count} item(s) from cart`
    };
  }

  /**
   * Get cart state with formatted summary
   */
  getCartState(cart) {
    const formatted = cart.map((item, index) => {
      return `${index + 1}. ${this.formatItem(item)}`;
    });

    return {
      items: cart,
      count: cart.length,
      formatted: formatted.join('\n'),
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
  priceCart(cart) {
    let subtotal = 0;

    for (const item of cart) {
      subtotal += this.calculateItemPrice(item);
    }

    const gstRate = parseFloat(process.env.GST_RATE) || 0.10;
    const gst = subtotal * (gstRate / (1 + gstRate)); // Extract GST from total
    const total = subtotal;

    return {
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2),
      itemCount: cart.length,
      currency: 'AUD'
    };
  }

  /**
   * Get complete order summary
   */
  getOrderSummary(cart) {
    const pricing = this.priceCart(cart);
    const items = cart.map((item, index) =>
      `${index + 1}. ${this.formatItem(item)} - $${this.calculateItemPrice(item).toFixed(2)}`
    );

    const summary = [
      '📋 ORDER SUMMARY',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ...items,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Subtotal: $${pricing.subtotal}`,
      `GST (included): $${pricing.gst}`,
      `TOTAL: $${pricing.total}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
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
