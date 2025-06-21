import 'reflect-metadata';
import { injectable } from 'inversify';
import { LoggerPort, LogLevel, LogContext } from '../../domain/shared/ports/LoggerPort';

@injectable()
export class ConsoleLogger implements LoggerPort {
  private context: LogContext = {};

  constructor(initialContext: LogContext = {}) {
    this.context = { ...initialContext };
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? { error: error.message, stack: error.stack } : {};
    const mergedContext = { ...context, ...errorContext };
    this.log(LogLevel.ERROR, message, mergedContext);
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...mergedContext
    };

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(this.formatLogEntry(logEntry));
        break;
      case LogLevel.INFO:
        console.info(this.formatLogEntry(logEntry));
        break;
      case LogLevel.WARN:
        console.warn(this.formatLogEntry(logEntry));
        break;
      case LogLevel.ERROR:
        console.error(this.formatLogEntry(logEntry));
        break;
      default:
        console.log(this.formatLogEntry(logEntry));
    }
  }

  child(context: LogContext): LoggerPort {
    const childLogger = new ConsoleLogger({ ...this.context, ...context });
    return childLogger;
  }

  private formatLogEntry(logEntry: any): string {
    const { timestamp, level, message, ...context } = logEntry;
    
    // Format the log entry with emojis for better visual distinction
    const levelEmoji = this.getLevelEmoji(level);
    const contextString = Object.keys(context).length > 0 
      ? ` | ${JSON.stringify(context)}` 
      : '';
    
    return `${levelEmoji} [${timestamp}] ${level.toUpperCase()}: ${message}${contextString}`;
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }
} 