import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGS_DIR = join(__dirname, '../../logs');

class Logger {
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // Console output with colors
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    };

    const color = colors[level] || colors.reset;
    const emoji = {
      info: 'ℹ️ ',
      success: '✅',
      warn: '⚠️ ',
      error: '❌'
    };

    console.log(
      `${color}${emoji[level] || ''} [${format(new Date(), 'HH:mm:ss')}] ${message}${colors.reset}`,
      data ? data : ''
    );

    // Write to file
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const logFile = join(LOGS_DIR, `${dateStr}.log`);

      const logLine = JSON.stringify(logEntry) + '\n';
      appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  success(message, data) {
    this.log('success', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  webhook(functionName, params, result) {
    this.log('info', `Webhook: ${functionName}`, { params, result });
  }
}

export default new Logger();
