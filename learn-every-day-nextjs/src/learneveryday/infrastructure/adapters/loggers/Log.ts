import { LogLevel } from '../../../domain/shared/ports/LoggerPort';

/**
 * Log entity representing a log entry in the system
 */
export class Log {
  private readonly _id: string;
  private readonly _level: LogLevel;
  private readonly _message: string;
  private readonly _context: Record<string, unknown>;
  private readonly _errorMessage?: string;
  private readonly _errorStack?: string;
  private readonly _timestamp: Date;

  constructor(
    id: string,
    level: LogLevel,
    message: string,
    context: Record<string, unknown> = {},
    timestamp: Date = new Date(),
    errorMessage?: string,
    errorStack?: string
  ) {
    this.validateId(id);
    this.validateMessage(message);
    this.validateLevel(level);

    this._id = id;
    this._level = level;
    this._message = message;
    this._context = { ...context };
    this._timestamp = new Date(timestamp);
    this._errorMessage = errorMessage;
    this._errorStack = errorStack;
  }

  get id(): string {
    return this._id;
  }

  get level(): LogLevel {
    return this._level;
  }

  get message(): string {
    return this._message;
  }

  get context(): Record<string, unknown> {
    return { ...this._context };
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  get errorStack(): string | undefined {
    return this._errorStack;
  }

  get timestamp(): Date {
    return new Date(this._timestamp);
  }

  /**
   * Creates a new Log instance for an error
   */
  static createError(
    id: string,
    message: string,
    error: Error,
    context: Record<string, unknown> = {}
  ): Log {
    return new Log(
      id,
      LogLevel.ERROR,
      message,
      context,
      new Date(),
      error.message,
      error.stack
    );
  }

  /**
   * Creates a new Log instance for info level
   */
  static createInfo(
    id: string,
    message: string,
    context: Record<string, unknown> = {}
  ): Log {
    return new Log(id, LogLevel.INFO, message, context);
  }

  /**
   * Creates a new Log instance for debug level
   */
  static createDebug(
    id: string,
    message: string,
    context: Record<string, unknown> = {}
  ): Log {
    return new Log(id, LogLevel.DEBUG, message, context);
  }

  /**
   * Creates a new Log instance for warn level
   */
  static createWarn(
    id: string,
    message: string,
    context: Record<string, unknown> = {}
  ): Log {
    return new Log(id, LogLevel.WARN, message, context);
  }

  /**
   * Checks if this log represents an error
   */
  hasError(): boolean {
    return this._level === LogLevel.ERROR;
  }

  /**
   * Gets the serialized context as JSON string
   */
  getSerializedContext(): string {
    try {
      return JSON.stringify(this._context);
    } catch {
      return '{}';
    }
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Log ID cannot be empty');
    }
  }

  private validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new Error('Log message cannot be empty');
    }
  }

  private validateLevel(level: LogLevel): void {
    if (!Object.values(LogLevel).includes(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }
  }
} 