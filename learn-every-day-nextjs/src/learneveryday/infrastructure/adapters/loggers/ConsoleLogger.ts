import { LoggerPort, LogLevel, LogContext } from '../../../domain/shared/ports/LoggerPort';

/**
 * Console logger that outputs to stdout/stderr
 */
export class ConsoleLogger implements LoggerPort {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
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
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    
    const logEntry = {
      timestamp,
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack,
      ...mergedContext
    };

    console.error(logEntry);
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...mergedContext
    };

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logEntry);
        break;
      case LogLevel.INFO:
        console.info(logEntry);
        break;
      case LogLevel.WARN:
        console.warn(logEntry);
        break;
      case LogLevel.ERROR:
        console.error(logEntry);
        break;
      default:
        console.log(logEntry);
    }
  }

  child(context: LogContext): LoggerPort {
    return new ConsoleLogger({ ...this.context, ...context });
  }
} 