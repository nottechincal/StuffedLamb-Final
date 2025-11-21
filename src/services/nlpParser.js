import compromise from 'compromise';

class NLPParser {
  constructor() {
    // Main dish patterns
    this.mainDishes = {
      'mansaf': 'mansaf',
      'jordanian mansaf': 'mansaf',
      'lamb mansaf': 'mansaf',
      'lamb mandi': 'lamb_mandi',
      'lamb mandy': 'lamb_mandi',  // Speech-to-text often transcribes as "Mandy"
      'lam mandi': 'lamb_mandi',   // Mishearing
      'lam mandy': 'lamb_mandi',
      'mandi lamb': 'lamb_mandi',
      'mandy lamb': 'lamb_mandi',
      'lamb mandi rice': 'lamb_mandi',
      'chicken mandi': 'chicken_mandi',
      'chicken mandy': 'chicken_mandi',  // Speech-to-text variant
      'mandi chicken': 'chicken_mandi',
      'mandy chicken': 'chicken_mandi',
      'chicken mandi rice': 'chicken_mandi'
    };

    // Addon patterns
    this.addonPatterns = {
      'nuts': 'nuts',
      'nut': 'nuts',
      'sultanas': 'sultanas',
      'sultana': 'sultanas',
      'raisins': 'sultanas',
      'raisin': 'sultanas',
      'extra jameed': 'extra_jameed',
      'more jameed': 'extra_jameed',
      'jameed sauce': 'extra_jameed',
      'yogurt sauce': 'extra_jameed',
      'extra rice on the plate': 'extra_rice_plate',
      'extra rice on plate': 'extra_rice_plate',
      'more rice on plate': 'extra_rice_plate',
      'extra rice side': 'extra_rice_side',
      'extra rice on the side': 'extra_rice_side',
      'side of extra rice': 'extra_rice_side',
      'extra rice': 'extra_rice_plate' // Default to on-plate
    };

    // Drink patterns
    this.drinkPatterns = {
      'coke': { item_id: 'soft_drink', option: 'coke' },
      'coca cola': { item_id: 'soft_drink', option: 'coke' },
      'pepsi': { item_id: 'soft_drink', option: 'pepsi' },
      'sprite': { item_id: 'soft_drink', option: 'sprite' },
      'fanta': { item_id: 'soft_drink', option: 'fanta' },
      'l&p': { item_id: 'soft_drink', option: 'l&p' },
      'lemon and paeroa': { item_id: 'soft_drink', option: 'l&p' },
      'coke no sugar': { item_id: 'soft_drink', option: 'coke no sugar' },
      'diet coke': { item_id: 'soft_drink', option: 'coke no sugar' },
      'water': { item_id: 'water', option: null },
      'bottled water': { item_id: 'water', option: null }
    };

    // Side patterns
    this.sidePatterns = {
      'soup': 'soup',
      'side of soup': 'soup',
      'rice': 'rice_side',
      'side of rice': 'rice_side',
      'rice side': 'rice_side',
      'just rice': 'rice_side'
    };

    // Number words
    this.numberWords = {
      'one': 1, 'a': 1, 'an': 1,
      'two': 2, 'couple': 2,
      'three': 3,
      'four': 4,
      'five': 5,
      'six': 6,
      'seven': 7,
      'eight': 8,
      'nine': 9,
      'ten': 10
    };
  }

  /**
   * Main parse function - converts natural language to structured item config
   */
  parse(description) {
    const lower = description.toLowerCase().trim();

    // Extract quantity
    const quantity = this.extractQuantity(lower);

    // Try to detect main dish
    const mainDish = this.detectMainDish(lower);
    if (mainDish) {
      return {
        success: true,
        itemConfig: {
          category: 'main_dishes',
          item_id: mainDish,
          quantity,
          addons: this.detectAddons(lower, mainDish)
        }
      };
    }

    // Try to detect drink
    const drink = this.detectDrink(lower);
    if (drink) {
      return {
        success: true,
        itemConfig: {
          category: 'drinks',
          item_id: drink.item_id,
          drink_option: drink.option,
          quantity
        }
      };
    }

    // Try to detect side
    const side = this.detectSide(lower);
    if (side) {
      return {
        success: true,
        itemConfig: {
          category: 'sides',
          item_id: side,
          quantity
        }
      };
    }

    // Could not parse
    return {
      success: false,
      error: `Could not identify menu item from: "${description}". Try saying the dish name like "lamb mandi" or "mansaf"`,
      suggestion: 'Available dishes: Mansaf, Lamb Mandi, Chicken Mandi'
    };
  }

  /**
   * Extract quantity from description
   */
  extractQuantity(text) {
    // Try to find digits first
    const digitMatch = text.match(/(\d+)\s*(?:x\s*)?/);
    if (digitMatch) {
      return parseInt(digitMatch[1]);
    }

    // Try number words
    for (const [word, num] of Object.entries(this.numberWords)) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(text)) {
        return num;
      }
    }

    return 1; // Default quantity
  }

  /**
   * Detect main dish from description
   */
  detectMainDish(text) {
    // Check each pattern (longest first to match more specific patterns)
    const patterns = Object.entries(this.mainDishes).sort((a, b) => b[0].length - a[0].length);

    for (const [pattern, itemId] of patterns) {
      if (text.includes(pattern)) {
        return itemId;
      }
    }

    return null;
  }

  /**
   * Detect addons for a main dish
   */
  detectAddons(text, dishId) {
    const addons = [];

    // For mansaf, check for mansaf-specific addons
    if (dishId === 'mansaf') {
      if (text.includes('jameed') || text.includes('yogurt')) {
        addons.push('extra_jameed');
      }
      if (text.includes('extra rice')) {
        if (text.includes('side')) {
          // Mansaf doesn't have side rice addon, only on-plate
          addons.push('extra_rice_plate');
        } else {
          addons.push('extra_rice_plate');
        }
      }
    }

    // For mandi dishes (lamb or chicken), check for mandi-specific addons
    if (dishId === 'lamb_mandi' || dishId === 'chicken_mandi') {
      if (text.includes('nut')) {
        addons.push('nuts');
      }
      if (text.includes('sultana') || text.includes('raisin')) {
        addons.push('sultanas');
      }
      if (text.includes('extra rice')) {
        if (text.includes('side') || text.includes('on the side')) {
          addons.push('extra_rice_side');
        } else if (text.includes('plate') || text.includes('on the plate')) {
          addons.push('extra_rice_plate');
        } else {
          // Default to on-plate
          addons.push('extra_rice_plate');
        }
      }
    }

    return addons;
  }

  /**
   * Detect drink from description
   */
  detectDrink(text) {
    // Check patterns (longest first)
    const patterns = Object.entries(this.drinkPatterns).sort((a, b) => b[0].length - a[0].length);

    for (const [pattern, drink] of patterns) {
      if (text.includes(pattern)) {
        return drink;
      }
    }

    return null;
  }

  /**
   * Detect side dish from description
   */
  detectSide(text) {
    // Check patterns (longest first)
    const patterns = Object.entries(this.sidePatterns).sort((a, b) => b[0].length - a[0].length);

    for (const [pattern, itemId] of patterns) {
      if (text.includes(pattern)) {
        return itemId;
      }
    }

    return null;
  }

  /**
   * Parse multiple items from a description (e.g., "2 lamb mandi and a coke")
   */
  parseMultiple(description) {
    const lower = description.toLowerCase();
    const items = [];

    // Split by common separators
    const parts = lower.split(/\s+and\s+|\s+,\s+|,\s+/);

    for (const part of parts) {
      const parsed = this.parse(part.trim());
      if (parsed.success) {
        items.push(parsed.itemConfig);
      }
    }

    if (items.length > 0) {
      return {
        success: true,
        items
      };
    }

    // Fall back to single parse
    return this.parse(description);
  }

  /**
   * Suggest corrections for common misspellings
   */
  suggestCorrection(text) {
    const suggestions = [];

    // Check for partial matches
    const lower = text.toLowerCase();

    if (lower.includes('man') && !lower.includes('mandi')) {
      suggestions.push('Did you mean "Mansaf" or "Mandi"?');
    }

    if (lower.includes('lamb') && !lower.includes('mandi')) {
      suggestions.push('We have Lamb Mandi ($28)');
    }

    if (lower.includes('chicken')) {
      suggestions.push('We have Chicken Mandi ($23)');
    }

    if (suggestions.length > 0) {
      return suggestions.join(' ');
    }

    return 'Try saying: "Mansaf", "Lamb Mandi", or "Chicken Mandi"';
  }

  /**
   * Get all valid items for autocomplete/suggestions
   */
  getAllItems() {
    return {
      mainDishes: Object.keys(this.mainDishes),
      drinks: Object.keys(this.drinkPatterns),
      sides: Object.keys(this.sidePatterns),
      addons: Object.keys(this.addonPatterns)
    };
  }
}

export default new NLPParser();
