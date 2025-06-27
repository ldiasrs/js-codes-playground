import { LoggerPort, LogLevel, LogContext } from '../../../domain/shared/ports/LoggerPort';
import * as fs from 'fs';
import * as path from 'path';

/**
 * File logger that writes to log files
 */
export class FileLogger implements LoggerPort {
  private context: LogContext;
  private logDir: string;

  constructor(logDir: string = './logs', context: LogContext = {}) {
    this.logDir = logDir;
    this.context = context;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(level: LogLevel): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${level}-${date}.log`);
  }

  private writeLog(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context: { ...this.context, ...context }
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    const fileName = this.getLogFileName(level);

    try {
      fs.appendFileSync(fileName, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error?.message,
      stack: error?.stack
    };
    this.writeLog(LogLevel.ERROR, message, errorContext);
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    this.writeLog(level, message, context);
  }

  child(context: LogContext): LoggerPort {
    return new FileLogger(this.logDir, { ...this.context, ...context });
  }
} 