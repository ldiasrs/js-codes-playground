import { LoggerPort } from '../../domain/shared/ports/LoggerPort';
import { ConsoleLogger } from '../adapters/logs/ConsoleLogger';
import { FileLogger } from '../adapters/logs/FileLogger';
import { CompositeLogger } from '../adapters/logs/CompositeLogger';

export interface LoggerConfig {
  type: 'console' | 'file' | 'composite';
  logDir?: string;
  maxFileSize?: number;
  maxFiles?: number;
  includeConsole?: boolean;
  includeFile?: boolean;
  context?: Record<string, any>;
}

export class LoggerFactory {
  /**
   * Creates a logger based on the provided configuration
   * @param config The logger configuration
   * @returns A logger instance
   */
  static createLogger(config: LoggerConfig): LoggerPort {
    const context = config.context || {};

    switch (config.type) {
      case 'console':
        return new ConsoleLogger(context);

      case 'file':
        return new FileLogger(
          config.logDir || './logs',
          config.maxFileSize || 10 * 1024 * 1024, // 10MB
          config.maxFiles || 5,
          context
        );

      case 'composite':
        const loggers: LoggerPort[] = [];
        
        if (config.includeConsole !== false) {
          loggers.push(new ConsoleLogger(context));
        }
        
        if (config.includeFile !== false) {
          loggers.push(new FileLogger(
            config.logDir || './logs',
            config.maxFileSize || 10 * 1024 * 1024,
            config.maxFiles || 5,
            context
          ));
        }

        return new CompositeLogger(loggers, context);

      default:
        throw new Error(`Unknown logger type: ${config.type}`);
    }
  }

  /**
   * Creates a development logger (console only)
   * @param context Optional context
   * @returns A console logger
   */
  static createDevelopmentLogger(context?: Record<string, any>): LoggerPort {
    return this.createLogger({
      type: 'console',
      context
    });
  }

  /**
   * Creates a production logger (file only)
   * @param logDir Log directory
   * @param context Optional context
   * @returns A file logger
   */
  static createProductionLogger(logDir: string = './logs', context?: Record<string, any>): LoggerPort {
    return this.createLogger({
      type: 'file',
      logDir,
      context
    });
  }

  /**
   * Creates a comprehensive logger (console + file)
   * @param logDir Log directory
   * @param context Optional context
   * @returns A composite logger
   */
  static createComprehensiveLogger(logDir: string = './logs', context?: Record<string, any>): LoggerPort {
    return this.createLogger({
      type: 'composite',
      logDir,
      includeConsole: true,
      includeFile: true,
      context
    });
  }

  /**
   * Creates a logger based on environment variables
   * @returns A logger instance based on NODE_ENV
   */
  static createLoggerFromEnv(): LoggerPort {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const logDir = process.env.LOG_DIR || './logs';
    const context = {
      environment: nodeEnv,
      service: 'learneveryday'
    };

    switch (nodeEnv) {
      case 'production':
        return this.createProductionLogger(logDir, context);
      
      case 'test':
        return this.createDevelopmentLogger(context);
      
      case 'development':
      default:
        return this.createComprehensiveLogger(logDir, context);
    }
  }
} 