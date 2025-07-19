import { LoggerPort } from "@/learneveryday/domain";
import { ConsoleLogger } from "../adapters/loggers/ConsoleLogger";
import { DBLogger } from "../adapters/loggers/DBLogger";
import { CompositeLogger } from "../adapters/loggers/CompositeLogger";
import { SQLLogRepository } from "../adapters/repositories/SQLLogRepository";
import { loggerConfig } from "../config/logger.config";


export interface LoggerConfig {
  type: 'console' | 'composite' | 'database';
  includeConsole?: boolean;
  includeDatabase?: boolean;
  context?: Record<string, unknown>;
  className?: string;
}

export class LoggerFactory {
  /**
   * Creates a logger based on the provided configuration
   * @param config The logger configuration
   * @returns A logger instance
   */
  static createLogger(config: LoggerConfig): LoggerPort {
    const context = config.context || {};
    const className = config.className;

    switch (config.type) {
      case 'console':
        return new ConsoleLogger(context, className);
      case 'database':
        return this.createDatabaseLogger(context, className);
      case 'composite':
      default:
        return this.createCompositeLogger(config, context, className);
    }
  }

  /**
   * Creates a logger based on the default configuration
   * @returns A logger instance
   */
  static createLoggerFromConfig(): LoggerPort {
    return this.createLogger(loggerConfig);
  }

  /**
   * Creates a logger for a specific class
   * @param className The name of the class
   * @returns A logger instance
   */
  static createLoggerForClass(className: string): LoggerPort {
    return this.createLogger({ ...loggerConfig, className });
  }

  /**
   * Creates a composite logger with multiple loggers
   * @param config The logger configuration
   * @param context The logger context
   * @param className The name of the class
   * @returns A composite logger instance
   */
  private static createCompositeLogger(config: LoggerConfig, context: Record<string, unknown>, className?: string): LoggerPort {
    const loggers: LoggerPort[] = [];

    // Always include console logger unless explicitly disabled
    if (config.includeConsole !== false) {
      loggers.push(new ConsoleLogger(context, className));
    }

    // Include database logger if enabled
    if (config.includeDatabase !== false) {
      loggers.push(this.createDatabaseLogger(context, className));
    }

    return new CompositeLogger(loggers);
  }

  /**
   * Creates a database logger
   * @param context The logger context
   * @param className The name of the class
   * @returns A database logger instance
   */
  private static createDatabaseLogger(context: Record<string, unknown>, className?: string): LoggerPort {
    const logRepository = new SQLLogRepository();
    return new DBLogger(logRepository, context, className);
  }
} 