export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  [key: string]: any;
}

export interface LoggerPort {
  /**
   * Logs a debug message
   * @param message The message to log
   * @param context Optional context data
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Logs an info message
   * @param message The message to log
   * @param context Optional context data
   */
  info(message: string, context?: LogContext): void;

  /**
   * Logs a warning message
   * @param message The message to log
   * @param context Optional context data
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Logs an error message
   * @param message The message to log
   * @param error Optional error object
   * @param context Optional context data
   */
  error(message: string, error?: Error, context?: LogContext): void;

  /**
   * Logs a message with a specific log level
   * @param level The log level
   * @param message The message to log
   * @param context Optional context data
   */
  log(level: LogLevel, message: string, context?: LogContext): void;

  /**
   * Creates a child logger with additional context
   * @param context Additional context to include in all log messages
   * @returns A new logger instance with the additional context
   */
  child(context: LogContext): LoggerPort;
} 