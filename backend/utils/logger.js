// utils/logger.js

/**
 * Log levels with numeric priority.
 * @private
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Simple logger wrapper with context tagging support.
 * Provides a consistent interface for logging across the application.
 * 
 * @class Logger
 */
class Logger {
  /**
   * @param {string} context - Context tag for log entries (e.g., 'ML', 'BLOCKCHAIN', 'QUEUE')
   * @param {string} minLevel - Minimum log level to output (default: 'info')
   */
  constructor(context = 'APP', minLevel = 'info') {
    this.context = context;
    this.minLevel = minLevel;
    this.minLevelValue = LOG_LEVELS[minLevel] || LOG_LEVELS.info;
  }

  /**
   * Format log message with timestamp and context.
   * @private
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @returns {Array} Formatted log arguments
   */
  _format(level, args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    return [prefix, ...args];
  }

  /**
   * Check if log level should be output.
   * @private
   * @param {string} level - Log level to check
   * @returns {boolean}
   */
  _shouldLog(level) {
    const levelValue = LOG_LEVELS[level] || LOG_LEVELS.info;
    return levelValue >= this.minLevelValue;
  }

  /**
   * Log debug message.
   * @param {...*} args - Arguments to log
   * @returns {void}
   */
  debug(...args) {
    if (this._shouldLog('debug')) {
      console.log(...this._format('debug', args));
    }
  }

  /**
   * Log info message.
   * @param {...*} args - Arguments to log
   * @returns {void}
   */
  info(...args) {
    if (this._shouldLog('info')) {
      console.log(...this._format('info', args));
    }
  }

  /**
   * Log warning message.
   * @param {...*} args - Arguments to log
   * @returns {void}
   */
  warn(...args) {
    if (this._shouldLog('warn')) {
      console.warn(...this._format('warn', args));
    }
  }

  /**
   * Log error message.
   * @param {...*} args - Arguments to log
   * @returns {void}
   */
  error(...args) {
    if (this._shouldLog('error')) {
      console.error(...this._format('error', args));
    }
  }

  /**
   * Create a child logger with a sub-context.
   * @param {string} subContext - Sub-context to append
   * @returns {Logger}
   */
  child(subContext) {
    return new Logger(`${this.context}:${subContext}`, this.minLevel);
  }

  /**
   * Set minimum log level.
   * @param {string} level - New minimum level
   * @returns {void}
   */
  setLevel(level) {
    if (LOG_LEVELS[level] === undefined) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.minLevel = level;
    this.minLevelValue = LOG_LEVELS[level];
  }

  /**
   * Get current minimum log level.
   * @returns {string}
   */
  getLevel() {
    return this.minLevel;
  }

  /**
   * Log object with pretty formatting.
   * @param {string} level - Log level
   * @param {string} message - Message prefix
   * @param {Object} obj - Object to log
   * @returns {void}
   */
  logObject(level, message, obj) {
    if (this._shouldLog(level)) {
      const formatted = this._format(level, [message]);
      console[level === 'error' ? 'error' : 'log'](...formatted);
      console[level === 'error' ? 'error' : 'log'](JSON.stringify(obj, null, 2));
    }
  }
}

/**
 * Create a logger instance.
 * @param {string} context - Context tag for the logger
 * @param {string} minLevel - Minimum log level (default: from env or 'info')
 * @returns {Logger}
 */
function createLogger(context, minLevel) {
  const level = minLevel || process.env.LOG_LEVEL || 'info';
  return new Logger(context, level);
}

/**
 * Default application logger.
 */
const defaultLogger = createLogger('APP');

module.exports = {
  Logger,
  createLogger,
  logger: defaultLogger,
  info: defaultLogger.info.bind(defaultLogger),
  warn: defaultLogger.warn.bind(defaultLogger),
  error: defaultLogger.error.bind(defaultLogger),
  debug: defaultLogger.debug.bind(defaultLogger)
};
