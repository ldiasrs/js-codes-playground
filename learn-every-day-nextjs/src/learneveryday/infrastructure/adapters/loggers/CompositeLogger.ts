import { LoggerPort, LogLevel, LogContext } from '../../../shared/ports/LoggerPort';

/**
 * Composite logger that delegates to multiple loggers
 */
export class CompositeLogger implements LoggerPort {
  private loggers: LoggerPort[];

  constructor(loggers: LoggerPort[]) {
    this.loggers = loggers;
  }

  debug(message: string, context?: LogContext): void {
    this.loggers.forEach(logger => logger.debug(message, context));
  }

  info(message: string, context?: LogContext): void {
    this.loggers.forEach(logger => logger.info(message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.loggers.forEach(logger => logger.warn(message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.loggers.forEach(logger => logger.error(message, error, context));
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    this.loggers.forEach(logger => logger.log(level, message, context));
  }

  child(context: LogContext): LoggerPort {
    const childLoggers = this.loggers.map(logger => logger.child(context));
    return new CompositeLogger(childLoggers);
  }
} 