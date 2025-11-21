import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { format, parse, addMinutes, isBefore, isAfter } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const businessData = JSON.parse(
  readFileSync(join(__dirname, '../../data/business.json'), 'utf-8')
);

const TIMEZONE = process.env.SHOP_TIMEZONE || businessData.timezone || 'Australia/Melbourne';

export function isShopOpen() {
  try {
    const now = new Date();
    const zonedNow = utcToZonedTime(now, TIMEZONE);
    const dayOfWeek = format(zonedNow, 'EEEE').toLowerCase();
    const currentTime = format(zonedNow, 'HH:mm');

    const hours = businessData.hours[dayOfWeek];

    if (!hours || !hours.open || !hours.close) {
      return false;
    }

    return currentTime >= hours.open && currentTime < hours.close;
  } catch (error) {
    console.error('Error checking shop hours:', error);
    return true; // Assume open on error
  }
}

export function getNextOpenTime() {
  const now = new Date();
  const zonedNow = utcToZonedTime(now, TIMEZONE);
  const dayOfWeek = format(zonedNow, 'EEEE').toLowerCase();
  const hours = businessData.hours[dayOfWeek];

  if (hours && hours.open) {
    return `${hours.open} today`;
  }

  return 'during business hours';
}

export function estimateReadyTime(queueSize = 0) {
  const settings = businessData.orderSettings || {};
  const basePrepTime = settings.defaultPrepTime || 20; // minutes
  const perItemTime = settings.prepTimePerItem || 3; // minutes per queued order

  const totalMinutes = basePrepTime + (queueSize * perItemTime);
  const now = new Date();
  const zonedNow = utcToZonedTime(now, TIMEZONE);
  const readyTime = addMinutes(zonedNow, totalMinutes);

  return {
    minutes: totalMinutes,
    time: formatInTimeZone(readyTime, TIMEZONE, 'h:mm a'),
    fullTime: formatInTimeZone(readyTime, TIMEZONE, 'EEEE, MMMM do \'at\' h:mm a'),
    iso: readyTime.toISOString()
  };
}

export function parsePickupTime(requestedTime) {
  try {
    const now = new Date();
    const zonedNow = utcToZonedTime(now, TIMEZONE);

    // Handle relative times like "in 30 minutes"
    const inMinutesMatch = requestedTime.match(/in (\d+) minutes?/i);
    if (inMinutesMatch) {
      const minutes = parseInt(inMinutesMatch[1]);
      const pickupTime = addMinutes(zonedNow, minutes);
      return {
        time: formatInTimeZone(pickupTime, TIMEZONE, 'h:mm a'),
        fullTime: formatInTimeZone(pickupTime, TIMEZONE, 'EEEE, MMMM do \'at\' h:mm a'),
        iso: pickupTime.toISOString()
      };
    }

    // Handle specific times like "6pm" or "6:30 PM"
    const timeMatch = requestedTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();

      // Convert to 24-hour format
      if (meridiem === 'pm' && hour < 12) {
        hour += 12;
      } else if (meridiem === 'am' && hour === 12) {
        hour = 0;
      }

      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const dateString = format(zonedNow, 'yyyy-MM-dd');
      const pickupTime = parse(`${dateString} ${timeString}`, 'yyyy-MM-dd HH:mm', zonedNow);

      return {
        time: formatInTimeZone(pickupTime, TIMEZONE, 'h:mm a'),
        fullTime: formatInTimeZone(pickupTime, TIMEZONE, 'EEEE, MMMM do \'at\' h:mm a'),
        iso: pickupTime.toISOString()
      };
    }

    // Fallback - estimate based on current queue
    return null;
  } catch (error) {
    console.error('Error parsing pickup time:', error);
    return null;
  }
}

export function getCurrentTime() {
  const now = new Date();
  return formatInTimeZone(now, TIMEZONE, 'h:mm a zzz');
}
