import compromise from 'compromise';

class NLPParser {
  constructor() {
    // Patterns and keywords
    this.categories = {
      kebab: ['kebab', 'kebabs'],
      hsp: ['hsp', 'halal snack pack', 'snack pack'],
      chips: ['chips', 'fries'],
      drinks: ['drink', 'coke', 'pepsi', 'sprite', 'fanta', 'solo', 'lift', 'water', 'beverage'],
      gozleme: ['gozleme', 'gözleme'],
      sweets: ['baklava', 'turkish delight', 'dessert']
    };

    this.sizes = {
      small: ['small', 's'],
      large: ['large', 'l', 'big']
    };

    this.proteins = {
      lamb: ['lamb'],
      chicken: ['chicken', 'chook'],
      mixed: ['mixed', 'combo', 'both'],
      falafel: ['falafel', 'vego', 'vegetarian']
    };

    this.salads = ['lettuce', 'tomato', 'onion', 'cucumber', 'pickles', 'jalapeños', 'jalapenos'];
    this.sauces = ['garlic', 'chilli', 'chili', 'bbq', 'barbecue', 'yogurt', 'yoghurt'];
    this.extras = ['cheese', 'avocado', 'extra meat'];
    this.saltTypes = ['chicken salt', 'normal salt', 'no salt'];
    this.drinkBrands = ['coke', 'pepsi', 'sprite', 'fanta', 'solo', 'lift', 'water'];
    this.fillings = ['cheese', 'spinach', 'potato', 'meat'];
  }

  parse(description) {
    const lower = description.toLowerCase().trim();
    const doc = compromise(description);

    // Extract quantity
    let quantity = 1;
    const numbers = doc.numbers().out('array');
    if (numbers.length > 0) {
      const num = parseInt(numbers[0]);
      if (!isNaN(num) && num > 0 && num < 50) {
        quantity = num;
      }
    }

    // Detect category
    const category = this.detectCategory(lower);
    if (!category) {
      return {
        success: false,
        error: 'Could not identify item type. Try being more specific (e.g., "kebab", "chips", "drink")'
      };
    }

    // Build item config based on category
    const itemConfig = { category, quantity };

    if (category === 'kebabs' || category === 'hsp') {
      itemConfig.size = this.detectSize(lower);
      itemConfig.protein = this.detectProtein(lower);
      itemConfig.salads = this.detectSalads(lower);
      itemConfig.sauces = this.detectSauces(lower);

      if (category === 'kebabs') {
        itemConfig.extras = this.detectExtras(lower);
      } else {
        itemConfig.cheese = !lower.includes('no cheese');
      }
    } else if (category === 'chips') {
      itemConfig.size = this.detectSize(lower);
      itemConfig.salt_type = this.detectSaltType(lower);
    } else if (category === 'drinks') {
      itemConfig.brand = this.detectDrink(lower);
    } else if (category === 'gozleme') {
      itemConfig.filling = this.detectFilling(lower);
    } else if (category === 'sweets') {
      itemConfig.type = this.detectSweet(lower);
    }

    return {
      success: true,
      itemConfig,
      description: this.formatDescription(itemConfig)
    };
  }

  detectCategory(text) {
    // Check for specific drink brands first
    for (const brand of this.drinkBrands) {
      if (text.includes(brand)) {
        return 'drinks';
      }
    }

    // Check for HSP before kebab (since HSP might contain "kebab" in description)
    if (this.categories.hsp.some(kw => text.includes(kw))) {
      return 'hsp';
    }

    for (const [category, keywords] of Object.entries(this.categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        return category === 'kebab' ? 'kebabs' : category;
      }
    }

    return null;
  }

  detectSize(text) {
    if (this.sizes.small.some(kw => text.includes(kw))) {
      return 'small';
    }
    if (this.sizes.large.some(kw => text.includes(kw))) {
      return 'large';
    }
    return 'large'; // default
  }

  detectProtein(text) {
    for (const [protein, keywords] of Object.entries(this.proteins)) {
      if (keywords.some(kw => text.includes(kw))) {
        return protein;
      }
    }
    return 'lamb'; // default
  }

  detectSalads(text) {
    const detected = [];

    // Check for "no salad" or similar
    if (text.includes('no salad') || text.includes('without salad')) {
      return [];
    }

    for (const salad of this.salads) {
      if (text.includes(salad)) {
        detected.push(salad);
      }
    }

    return detected;
  }

  detectSauces(text) {
    const detected = [];

    // Check for "no sauce"
    if (text.includes('no sauce')) {
      return [];
    }

    for (const sauce of this.sauces) {
      if (text.includes(sauce)) {
        // Normalize chilli/chili to chilli
        const normalized = sauce === 'chili' ? 'chilli' : sauce;
        if (!detected.includes(normalized)) {
          detected.push(normalized);
        }
      }
    }

    return detected;
  }

  detectExtras(text) {
    const detected = [];

    for (const extra of this.extras) {
      if (text.includes(extra)) {
        detected.push(extra);
      }
    }

    return detected;
  }

  detectSaltType(text) {
    if (text.includes('chicken salt')) {
      return 'chicken';
    }
    if (text.includes('normal salt')) {
      return 'normal';
    }
    if (text.includes('no salt')) {
      return 'none';
    }
    return 'chicken'; // default
  }

  detectDrink(text) {
    for (const brand of this.drinkBrands) {
      if (text.includes(brand)) {
        return brand;
      }
    }
    return 'coke'; // default
  }

  detectFilling(text) {
    if (text.includes('spinach')) {
      return 'spinach-cheese';
    }
    for (const filling of this.fillings) {
      if (text.includes(filling)) {
        return filling;
      }
    }
    return 'cheese'; // default
  }

  detectSweet(text) {
    if (text.includes('baklava')) {
      return 'baklava';
    }
    if (text.includes('turkish delight') || text.includes('delight')) {
      return 'turkish-delight';
    }
    return 'baklava'; // default
  }

  formatDescription(itemConfig) {
    const parts = [];

    if (itemConfig.quantity > 1) {
      parts.push(`${itemConfig.quantity}x`);
    }

    if (itemConfig.size) {
      parts.push(itemConfig.size);
    }

    parts.push(itemConfig.category);

    if (itemConfig.protein) {
      parts.push(`(${itemConfig.protein})`);
    }

    if (itemConfig.brand) {
      parts.push(`(${itemConfig.brand})`);
    }

    if (itemConfig.filling) {
      parts.push(`(${itemConfig.filling})`);
    }

    if (itemConfig.salads && itemConfig.salads.length > 0) {
      parts.push(`with ${itemConfig.salads.join(', ')}`);
    }

    if (itemConfig.sauces && itemConfig.sauces.length > 0) {
      parts.push(`+ ${itemConfig.sauces.join(' & ')} sauce`);
    }

    return parts.join(' ');
  }
}

export default new NLPParser();
