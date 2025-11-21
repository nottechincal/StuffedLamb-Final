import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGS_DIR = join(__dirname, '../../logs');

class Logger {
  constructor() {
    // Detect if running on Windows and if colors are supported
    this.isWindows = process.platform === 'win32';
    this.supportsColor = this.checkColorSupport();
  }

  checkColorSupport() {
    // Check if terminal supports colors
    // Windows Command Prompt doesn't support ANSI by default
    // PowerShell 5.1+ and Windows Terminal do support colors
    if (this.isWindows) {
      // Disable colors for basic Windows Command Prompt
      // Enable for Windows Terminal and modern PowerShell
      const term = process.env.TERM || '';
      const wt = process.env.WT_SESSION;
      const psVersion = process.env.PSModuleAnalysisCachePath;

      return !!(wt || psVersion || term.includes('xterm'));
    }
    return true;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // Console output - clean for Windows, colored for others
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    };

    const color = this.supportsColor ? (colors[level] || colors.reset) : '';
    const resetColor = this.supportsColor ? colors.reset : '';

    // Simple text icons for Windows, emojis for others
    const icons = {
      info: this.isWindows ? '[INFO]' : 'ℹ️ ',
      success: this.isWindows ? '[OK]' : '✅',
      warn: this.isWindows ? '[WARN]' : '⚠️ ',
      error: this.isWindows ? '[ERROR]' : '❌'
    };

    console.log(
      `${color}${icons[level] || ''} [${format(new Date(), 'HH:mm:ss')}] ${message}${resetColor}`,
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
