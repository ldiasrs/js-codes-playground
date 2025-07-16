import { LoggerPort, LogLevel, LogContext } from '../../../domain/shared/ports/LoggerPort';
import { LogRepositoryPort } from '../../../domain/logs/ports/LogRepositoryPort';
import { Log } from '../../../domain/logs/entities/Log';
import { v4 as uuidv4 } from 'uuid';

/**
 * Database logger that persists logs to the database
 */
export class DBLogger implements LoggerPort {
  private context: LogContext;

  constructor(
    private readonly logRepository: LogRepositoryPort,
    context: LogContext = {}
  ) {
    this.context = context;
  }

  debug(message: string, context?: LogContext): void {
    this.persistLog(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.persistLog(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.persistLog(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.persistErrorLog(message, error, context);
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    this.persistLog(level, message, context);
  }

  child(context: LogContext): LoggerPort {
    const mergedContext = this.mergeContexts(this.context, context);
    return new DBLogger(this.logRepository, mergedContext);
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