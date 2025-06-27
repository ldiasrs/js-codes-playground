import { LoggerPort } from "@/learneveryday/domain";
import { ConsoleLogger } from "../adapters/loggers/ConsoleLogger";
import { loggerConfig } from "../config/logger.config";


export interface LoggerConfig {
  type: 'console' | 'file' | 'composite';
  logDir?: string;
  maxFileSize?: number;
  maxFiles?: number;
  includeConsole?: boolean;
  includeFile?: boolean;
  context?: Record<string, unknown>;
}

export class LoggerFactory {
  /**
   * Creates a logger based on the provided configuration
   * @param config The logger configuration
   * @returns A logger instance
   */
  static createLogger(config: LoggerConfig): LoggerPort {
    const context = config.context || {};
    return new ConsoleLogger(context);
  }

  /**
   * Creates a logger based on the default configuration
   * @returns A logger instance
   */
  static createLoggerFromConfig(): LoggerPort {
    return this.createLogger(loggerConfig);
  }
} 