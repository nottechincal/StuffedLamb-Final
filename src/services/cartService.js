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
  addItemToCart(cart, itemConfig) {
    const { category, size, protein, salads, sauces, extras, quantity, brand, salt_type, filling } = itemConfig;

    const item = {
      category,
      quantity: quantity || 1,
      timestamp: new Date().toISOString()
    };

    // Add category-specific properties
    if (category === 'kebabs' || category === 'hsp') {
      item.size = size || 'large';
      item.protein = protein || menuData[category].items[0].defaultProtein;
      item.salads = salads || [];
      item.sauces = sauces || [];

      if (category === 'kebabs') {
        item.extras = extras || [];
      } else if (category === 'hsp') {
        item.cheese = itemConfig.cheese !== undefined ? itemConfig.cheese : true;
      }
    } else if (category === 'chips') {
      item.size = size || 'small';
      item.salt_type = salt_type || 'chicken';
    } else if (category === 'drinks') {
      item.brand = brand || 'coke';
    } else if (category === 'gozleme') {
      item.filling = filling || 'cheese';
    } else if (category === 'sweets') {
      item.type = itemConfig.type || 'baklava';
    }

    cart.push(item);
    return { success: true, itemIndex: cart.length - 1, item };
  }

  addMultipleItems(cart, items) {
    const addedItems = [];

    for (const itemConfig of items) {
      const result = this.addItemToCart(cart, itemConfig);
      addedItems.push(result);
    }

    return {
      success: true,
      count: addedItems.length,
      items: addedItems
    };
  }

  removeItem(cart, itemIndex) {
    if (itemIndex < 0 || itemIndex >= cart.length) {
      return { success: false, error: 'Invalid item index' };
    }

    const removed = cart.splice(itemIndex, 1)[0];
    return { success: true, removed };
  }

  editItem(cart, itemIndex, modifications) {
    if (itemIndex < 0 || itemIndex >= cart.length) {
      return { success: false, error: 'Invalid item index' };
    }

    const item = cart[itemIndex];

    // Apply modifications
    for (const [key, value] of Object.entries(modifications)) {
      item[key] = value;
    }

    return { success: true, item };
  }

  clearCart(cart) {
    const count = cart.length;
    cart.length = 0;
    return { success: true, cleared: count };
  }

  getCartState(cart) {
    const formatted = cart.map((item, index) => {
      return `${index + 1}. ${this.formatItem(item)}`;
    });

    return {
      items: cart,
      count: cart.length,
      formatted: formatted.join('\n')
    };
  }

  formatItem(item) {
    const parts = [];

    // Quantity
    if (item.quantity > 1) {
      parts.push(`${item.quantity}x`);
    }

    // Size and category
    if (item.size) {
      parts.push(`${item.size} ${item.category}`);
    } else {
      parts.push(item.category);
    }

    // Protein
    if (item.protein) {
      parts.push(`(${item.protein})`);
    }

    // Filling (for gozleme)
    if (item.filling) {
      parts.push(`(${item.filling})`);
    }

    // Brand (for drinks)
    if (item.brand) {
      parts.push(`(${item.brand})`);
    }

    // Salt type
    if (item.salt_type && item.salt_type !== 'none') {
      parts.push(`${item.salt_type} salt`);
    }

    // Salads
    if (item.salads && item.salads.length > 0) {
      parts.push(`with ${item.salads.join(', ')}`);
    }

    // Sauces
    if (item.sauces && item.sauces.length > 0) {
      parts.push(`+ ${item.sauces.join(', ')} sauce`);
    }

    // Extras
    if (item.extras && item.extras.length > 0) {
      parts.push(`+ ${item.extras.join(', ')}`);
    }

    // Cheese
    if (item.cheese === false) {
      parts.push('(no cheese)');
    }

    // Combo indicator
    if (item.isCombo) {
      parts.push('🎉 COMBO');
      if (item.comboDrink) {
        parts.push(`with ${item.comboDrink}`);
      }
      if (item.comboChips) {
        parts.push(`+ ${item.comboChips.size} chips (${item.comboChips.salt})`);
      }
    }

    return parts.join(' ');
  }

  convertToMeals(cart, options = {}) {
    const {
      itemIndices,
      drinkBrand = 'coke',
      chipsSize = 'small',
      chipsSalt = 'chicken'
    } = options;

    let converted = 0;
    const indicesToConvert = itemIndices || cart.map((_, i) => i);

    for (const index of indicesToConvert) {
      if (index < 0 || index >= cart.length) continue;

      const item = cart[index];

      // Only convert kebabs and HSPs
      if (item.category === 'kebabs' && !item.isCombo) {
        item.isCombo = true;
        item.comboDrink = drinkBrand;
        item.comboChips = {
          size: chipsSize,
          salt: chipsSalt
        };
        converted++;
      } else if (item.category === 'hsp' && !item.isCombo) {
        item.isCombo = true;
        item.comboDrink = drinkBrand;
        converted++;
      }
    }

    return {
      success: true,
      converted,
      message: `Converted ${converted} item(s) to combo meals`
    };
  }

  // Calculate price for a single item
  calculateItemPrice(item) {
    let price = 0;

    if (item.category === 'kebabs' || item.category === 'hsp') {
      const menuItem = menuData[item.category].items[0];
      price = menuItem.sizes[item.size] || menuItem.sizes.large;

      // Add extras pricing for kebabs
      if (item.category === 'kebabs' && item.extras) {
        for (const extra of item.extras) {
          price += menuItem.extraPrices[extra] || 0;
        }
      }

      // Add cheese pricing for HSP
      if (item.category === 'hsp' && item.cheese) {
        price += menuItem.cheesePrice || 0;
      }

      // Combo discount
      if (item.isCombo) {
        const drinkPrice = menuData.drinks.items[0].price;

        if (item.category === 'kebabs') {
          const chipsPrice = menuData.chips.items[0].sizes[item.comboChips?.size || 'small'];
          const comboDiscount = menuData.combos.kebabCombo.discount;
          price = price + drinkPrice + chipsPrice - comboDiscount;
        } else {
          const comboDiscount = menuData.combos.hspCombo.discount;
          price = price + drinkPrice - comboDiscount;
        }
      }
    } else if (item.category === 'chips') {
      price = menuData.chips.items[0].sizes[item.size];
    } else if (item.category === 'drinks') {
      price = menuData.drinks.items[0].price;
    } else if (item.category === 'gozleme') {
      price = menuData.gozleme.items[0].price;
    } else if (item.category === 'sweets') {
      const sweetItem = menuData.sweets.items.find(s => s.id === item.type);
      price = sweetItem?.price || 5.00;
    }

    return price * (item.quantity || 1);
  }

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
      itemCount: cart.length
    };
  }

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
}

export default new CartService();
