import 'reflect-metadata';
import { injectable } from 'inversify';
import { LoggerPort, LogLevel, LogContext } from '../../domain/shared/ports/LoggerPort';

@injectable()
export class CompositeLogger implements LoggerPort {
  private loggers: LoggerPort[];
  private context: LogContext = {};

  constructor(loggers: LoggerPort[] = [], initialContext: LogContext = {}) {
    this.loggers = loggers;
    this.context = { ...initialContext };
  }

  addLogger(logger: LoggerPort): void {
    this.loggers.push(logger);
  }

  removeLogger(logger: LoggerPort): void {
    const index = this.loggers.indexOf(logger);
    if (index > -1) {
      this.loggers.splice(index, 1);
    }
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
    const mergedContext = { ...this.context, ...context };
    
    // Log to all registered loggers
    this.loggers.forEach(logger => {
      try {
        logger.log(level, message, mergedContext);
      } catch (error) {
        // If one logger fails, don't stop the others
        console.error('Logger failed:', error);
      }
    });
  }

  child(context: LogContext): LoggerPort {
    const childLoggers = this.loggers.map(logger => logger.child(context));
    return new CompositeLogger(childLoggers, { ...this.context, ...context });
  }
} 