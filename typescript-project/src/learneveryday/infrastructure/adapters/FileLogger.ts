import 'reflect-metadata';
import { injectable } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerPort, LogLevel, LogContext } from '../../domain/shared/ports/LoggerPort';

@injectable()
export class FileLogger implements LoggerPort {
  private context: LogContext = {};
  private logDir: string;
  private maxFileSize: number; // in bytes
  private maxFiles: number;

  constructor(
    logDir: string = './logs',
    maxFileSize: number = 10 * 1024 * 1024, // 10MB
    maxFiles: number = 5,
    initialContext: LogContext = {}
  ) {
    this.logDir = logDir;
    this.maxFileSize = maxFileSize;
    this.maxFiles = maxFiles;
    this.context = { ...initialContext };
    this.ensureLogDirectory();
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

    const formattedEntry = this.formatLogEntry(logEntry);
    this.writeToFile(level, formattedEntry);
  }

  child(context: LogContext): LoggerPort {
    const childLogger = new FileLogger(this.logDir, this.maxFileSize, this.maxFiles, { ...this.context, ...context });
    return childLogger;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(level: LogLevel): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `${level}-${date}.log`);
  }

  private writeToFile(level: LogLevel, formattedEntry: string): void {
    const logFile = this.getLogFileName(level);
    
    try {
      // Check if file exists and get its size
      let fileSize = 0;
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        fileSize = stats.size;
      }

      // Rotate file if it's too large
      if (fileSize > this.maxFileSize) {
        this.rotateLogFile(logFile);
      }

      // Append to file
      fs.appendFileSync(logFile, formattedEntry + '\n');
    } catch (error) {
      // Fallback to console if file writing fails
      console.error('Failed to write to log file:', error);
      console.log(formattedEntry);
    }
  }

  private rotateLogFile(logFile: string): void {
    const dir = path.dirname(logFile);
    const ext = path.extname(logFile);
    const base = path.basename(logFile, ext);

    // Remove oldest file if we have too many
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = path.join(dir, `${base}.${i}${ext}`);
      const newFile = path.join(dir, `${base}.${i + 1}${ext}`);
      
      if (fs.existsSync(oldFile)) {
        if (i === this.maxFiles - 1) {
          // Remove the oldest file
          fs.unlinkSync(oldFile);
        } else {
          // Move file to next number
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Rename current file to .1
    const rotatedFile = path.join(dir, `${base}.1${ext}`);
    if (fs.existsSync(logFile)) {
      fs.renameSync(logFile, rotatedFile);
    }
  }

  private formatLogEntry(logEntry: any): string {
    const { timestamp, level, message, ...context } = logEntry;
    
    const contextString = Object.keys(context).length > 0 
      ? ` | ${JSON.stringify(context)}` 
      : '';
    
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextString}`;
  }
} 