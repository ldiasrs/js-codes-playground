import { LoggerPort, LogLevel, LogContext } from '../../../shared/ports/LoggerPort';
import { v4 as uuidv4 } from 'uuid';
import { Log } from './Log';
import { SQLLogRepository } from '../repositories/SQLLogRepository';

/**
 * Database logger that persists logs to the database
 */
export class DBLogger implements LoggerPort {
  private context: LogContext;
  private className?: string;

  constructor(
    private readonly logRepository: SQLLogRepository,
    context: LogContext = {},
    className?: string
  ) {
    this.context = context;
    this.className = className;
  }

  debug(message: string, context?: LogContext): void {
    this.persistLog(LogLevel.DEBUG, this.formatMessage(message), context);
  }

  info(message: string, context?: LogContext): void {
    this.persistLog(LogLevel.INFO, this.formatMessage(message), context);
  }

  warn(message: string, context?: LogContext): void {
    this.persistLog(LogLevel.WARN, this.formatMessage(message), context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.persistErrorLog(this.formatMessage(message), error, context);
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    this.persistLog(level, this.formatMessage(message), context);
  }

  child(context: LogContext): LoggerPort {
    const mergedContext = this.mergeContexts(this.context, context);
    return new DBLogger(this.logRepository, mergedContext, this.className);
  }

  private formatMessage(message: string): string {
    return this.className ? `${this.className}: ${message}` : message;
  }

  private persistLog(level: LogLevel, message: string, context?: LogContext): void {
    this.executeAsyncOperation(async () => {
      const mergedContext = this.mergeContexts(this.context, context);
      const log = this.createLog(level, message, mergedContext);
      await this.logRepository.save(log);
    });
  }

  private persistErrorLog(message: string, error?: Error, context?: LogContext): void {
    this.executeAsyncOperation(async () => {
      const mergedContext = this.mergeContexts(this.context, context);
      const log = this.createErrorLog(message, error, mergedContext);
      await this.logRepository.save(log);
    });
  }

  private createLog(level: LogLevel, message: string, context: LogContext): Log {
    const id = this.generateLogId();
    return new Log(id, level, message, context);
  }

  private createErrorLog(message: string, error?: Error, context?: LogContext): Log {
    const id = this.generateLogId();
    const mergedContext = context || {};
    
    if (error) {
      return Log.createError(id, message, error, mergedContext);
    }
    
    return new Log(id, LogLevel.ERROR, message, mergedContext);
  }

  private mergeContexts(baseContext: LogContext, additionalContext?: LogContext): LogContext {
    if (!additionalContext) {
      return { ...baseContext };
    }
    return { ...baseContext, ...additionalContext };
  }

  private generateLogId(): string {
    return uuidv4();
  }

  private executeAsyncOperation(operation: () => Promise<void>): void {
    // Execute async operation without blocking the caller
    // Log any errors that occur during persistence to console as fallback
    operation().catch(error => {
      console.error('DBLogger: Failed to persist log to database:', error);
    });
  }
} 