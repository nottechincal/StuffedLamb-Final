/**
 * Utility functions to make AI responses sound natural and human-like
 * Converts robotic text to conversational speech patterns
 */

/**
 * Format dollar amount for natural speech
 * $28.00 → "28 dollars"
 * $5.50 → "5 dollars 50 cents"
 * $100.00 → "100 dollars"
 */
export function formatMoney(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;

  const dollars = Math.floor(num);
  const cents = Math.round((num - dollars) * 100);

  if (cents === 0) {
    return `${dollars} dollar${dollars === 1 ? '' : 's'}`;
  } else {
    return `${dollars} dollar${dollars === 1 ? '' : 's'} and ${cents} cents`;
  }
}

/**
 * Format order number naturally
 * "20251121-737" → "order 737"
 * Extracts just the meaningful part customers care about
 */
export function formatOrderNumber(orderNumber) {
  if (!orderNumber) return orderNumber;

  // Extract the last part after the dash (e.g., "737" from "20251121-737")
  const parts = orderNumber.split('-');
  if (parts.length > 1) {
    return `order ${parts[parts.length - 1]}`;
  }
  return `order ${orderNumber}`;
}

/**
 * Vary confirmation phrases so AI doesn't sound repetitive
 * Returns random variation each time
 */
export function getConfirmation() {
  const phrases = [
    'Got it',
    'Done',
    'No problem',
    'Sure thing',
    'Alright',
    'Perfect'
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Vary item added confirmations
 */
export function getAddedConfirmation(itemName, quantity) {
  const templates = [
    `${quantity > 1 ? quantity : 'One'} ${itemName}${quantity > 1 ? 's' : ''} added`,
    `Added ${quantity > 1 ? quantity : 'a'} ${itemName}${quantity > 1 ? 's' : ''}`,
    `I've got ${quantity > 1 ? quantity : 'one'} ${itemName}${quantity > 1 ? 's' : ''} for you`,
    `${quantity > 1 ? quantity : 'One'} ${itemName}${quantity > 1 ? 's' : ''}, coming up`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Vary removal confirmations
 */
export function getRemovalConfirmation(itemName) {
  const templates = [
    `Removed the ${itemName}`,
    `Took out the ${itemName}`,
    `${itemName} removed`,
    `No worries, removed the ${itemName}`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Vary update confirmations
 */
export function getUpdateConfirmation(itemName) {
  const templates = [
    `Updated the ${itemName}`,
    `Changed the ${itemName}`,
    `${itemName} updated`,
    `Got it, changed the ${itemName}`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Format pickup time naturally
 * "Friday, November 21st at 8:00 PM" → "Friday at 8 PM"
 * "in 25 minutes" → "in about 25 minutes"
 */
export function formatPickupTime(timeString) {
  if (!timeString) return timeString;

  // If it's already "in X minutes", make it more natural
  if (timeString.includes('in') && timeString.includes('minute')) {
    return timeString.replace('in ', 'in about ');
  }

  // Simplify full date strings
  // "Friday, November 21st at 8:00 PM" → "Friday at 8 PM"
  const match = timeString.match(/(\w+day)[^a]+ at (\d+):?(\d*)\s*(AM|PM)/i);
  if (match) {
    const [, day, hour, minutes, period] = match;
    if (minutes && minutes !== '00') {
      return `${day} at ${hour}:${minutes} ${period}`;
    }
    return `${day} at ${hour} ${period}`;
  }

  return timeString;
}

/**
 * Create natural order confirmation message
 */
export function formatOrderConfirmation(orderNumber, total, pickupTime) {
  const money = formatMoney(total);
  const orderNum = formatOrderNumber(orderNumber);
  const time = formatPickupTime(pickupTime);

  return `Perfect! Your ${orderNum} comes to ${money}, ready for pickup ${time}`;
}

/**
 * Format quantity naturally
 * 1 → "one", 2 → "two", etc. for 1-10, then numbers
 */
export function formatQuantity(num) {
  const words = {
    1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
    6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten'
  };
  return words[num] || num.toString();
}

/**
 * Vary "no previous orders" messages
 */
export function getNoOrdersMessage() {
  const messages = [
    "Looks like this is your first time ordering with us",
    "I don't see any previous orders",
    "This looks like a new number to us",
    "Can't find any past orders for this number"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
