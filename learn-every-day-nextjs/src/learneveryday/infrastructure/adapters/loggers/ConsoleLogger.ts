import { LoggerPort, LogLevel, LogContext } from '../../../shared/ports/LoggerPort';

/**
 * Console logger that outputs to stdout/stderr
 */
export class ConsoleLogger implements LoggerPort {
  private context: LogContext;
  private className?: string;

  constructor(context: LogContext = {}, className?: string) {
    this.context = context;
    this.className = className;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, this.formatMessage(message), context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, this.formatMessage(message), context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, this.formatMessage(message), context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    
    const logEntry = {
      timestamp,
      level: 'ERROR',
      message: this.formatMessage(message),
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
      message: this.formatMessage(message),
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
    return new ConsoleLogger({ ...this.context, ...context }, this.className);
  }

  private formatMessage(message: string): string {
    return this.className ? `${this.className}: ${message}` : message;
  }
} 