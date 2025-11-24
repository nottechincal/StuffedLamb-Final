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

    // Check if the day is explicitly closed
    if (!hours || hours.closed === true) {
      return false;
    }

    // Check if opening hours are defined
    if (!hours.open || !hours.close) {
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
  const currentDayName = format(zonedNow, 'EEEE').toLowerCase();
  const currentTime = format(zonedNow, 'HH:mm');

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentDayIndex = dayOrder.indexOf(currentDayName);

  // Check if shop opens later today
  const todayHours = businessData.hours[currentDayName];
  if (todayHours && !todayHours.closed && todayHours.open && currentTime < todayHours.open) {
    return `${todayHours.open} today`;
  }

  // Find next open day
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayName = dayOrder[nextDayIndex];
    const nextDayHours = businessData.hours[nextDayName];

    if (nextDayHours && !nextDayHours.closed && nextDayHours.open) {
      if (i === 1) {
        return `${nextDayHours.open} tomorrow`;
      } else {
        const dayLabel = nextDayName.charAt(0).toUpperCase() + nextDayName.slice(1);
        return `${dayLabel} at ${nextDayHours.open}`;
      }
    }
  }

  return 'Please check our hours';
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
    const currentDayOfWeek = format(zonedNow, 'EEEE').toLowerCase();

    // HANDLE ISO TIMESTAMP FORMAT (when AI sends timestamps directly like "2025-11-29T03:40:00.000Z")
    const isoMatch = requestedTime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    if (isoMatch) {
      const requestedDate = new Date(requestedTime);
      const zonedDate = utcToZonedTime(requestedDate, TIMEZONE);
      const dayName = format(zonedDate, 'EEEE').toLowerCase();
      const targetHours = businessData.hours[dayName];

      if (validatePickupTime(zonedDate, targetHours)) {
        return {
          time: formatInTimeZone(zonedDate, TIMEZONE, 'h:mm a'),
          fullTime: formatInTimeZone(zonedDate, TIMEZONE, 'EEEE, MMMM do \'at\' h:mm a'),
          iso: requestedDate.toISOString()
        };
      } else {
        // ISO timestamp is outside business hours
        return null;
      }
    }

    // HANDLE FUTURE DAY REQUESTS (e.g., "Wednesday at 1pm", "tomorrow at 6pm")
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayPattern = new RegExp(`(${dayNames.join('|')}|tomorrow|today)(?:\\s+at)?\\s+(.+)`, 'i');
    const dayMatch = requestedTime.match(dayPattern);

    if (dayMatch) {
      let targetDayName = dayMatch[1].toLowerCase();
      const timeStr = dayMatch[2];

      // Convert "tomorrow" or "today" to actual day name
      if (targetDayName === 'today') {
        targetDayName = currentDayOfWeek;
      } else if (targetDayName === 'tomorrow') {
        const tomorrowIndex = (dayNames.indexOf(currentDayOfWeek) + 1) % 7;
        targetDayName = dayNames[tomorrowIndex];
      }

      // Calculate days until target day
      const currentDayIndex = dayNames.indexOf(currentDayOfWeek);
      const targetDayIndex = dayNames.indexOf(targetDayName);
      let daysAhead = (targetDayIndex - currentDayIndex + 7) % 7;

      // If same day and time has passed, assume next week
      if (daysAhead === 0) {
        const currentTime = format(zonedNow, 'HH:mm');
        const targetHours = businessData.hours[targetDayName];
        if (targetHours && !targetHours.closed) {
          // If time specified is before current time, assume next week
          daysAhead = 7;
        }
      }

      // Parse the time part (e.g., "1pm", "13:00")
      const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const meridiem = timeMatch[3]?.toLowerCase();

        // Convert to 24-hour format
        if (meridiem === 'pm' && hour < 12) hour += 12;
        else if (meridiem === 'am' && hour === 12) hour = 0;

        // Create future date
        const futureDate = new Date(zonedNow);
        futureDate.setDate(futureDate.getDate() + daysAhead);
        futureDate.setHours(hour, minute, 0, 0);

        // Validate against that day's hours
        const targetHours = businessData.hours[targetDayName];
        if (!validatePickupTime(futureDate, targetHours)) {
          return null;
        }

        return {
          time: formatInTimeZone(futureDate, TIMEZONE, 'h:mm a'),
          fullTime: formatInTimeZone(futureDate, TIMEZONE, 'EEEE, MMMM do \'at\' h:mm a'),
          iso: futureDate.toISOString()
        };
      }
    }

    // Handle relative times like "in 30 minutes" or "30 minutes" or "23 minutes"
    const minutesMatch = requestedTime.match(/(?:in\s+)?(\d+)\s*minutes?/i);
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      const pickupTime = addMinutes(zonedNow, minutes);

      // Validate against closing time
      if (!validatePickupTime(pickupTime, businessData.hours[currentDayOfWeek])) {
        return null;
      }

      return {
        time: formatInTimeZone(pickupTime, TIMEZONE, 'h:mm a'),
        fullTime: formatInTimeZone(pickupTime, TIMEZONE, 'EEEE, MMMM do \'at\' h:mm a'),
        iso: pickupTime.toISOString()
      };
    }

    // Handle relative hours like "in 3 hours"
    const hoursMatch = requestedTime.match(/(?:in\s+)?(\d+)\s*hours?/i);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      const pickupTime = addMinutes(zonedNow, hours * 60);

      // Validate against closing time
      if (!validatePickupTime(pickupTime, businessData.hours[currentDayOfWeek])) {
        return null;
      }

      return {
        time: formatInTimeZone(pickupTime, TIMEZONE, 'h:mm a'),
        fullTime: formatInTimeZone(pickupTime, TIMEZONE, 'EEEE, MMMM do \'at\' h:mm a'),
        iso: pickupTime.toISOString()
      };
    }

    // Handle specific times TODAY like "6pm" or "6:30 PM"
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

      // Validate against closing time
      if (!validatePickupTime(pickupTime, businessData.hours[currentDayOfWeek])) {
        return null;
      }

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

function validatePickupTime(pickupTime, dayHours) {
  // If no hours defined or shop is closed, invalid
  if (!dayHours || dayHours.closed || !dayHours.close) {
    return false;
  }

  const pickupTimeStr = format(pickupTime, 'HH:mm');
  const closeTimeStr = dayHours.close;

  // Check if pickup time is before closing time
  return pickupTimeStr < closeTimeStr;
}

export function getCurrentTime() {
  const now = new Date();
  return formatInTimeZone(now, TIMEZONE, 'h:mm a zzz');
}
