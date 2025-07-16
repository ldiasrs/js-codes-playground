import { LoggerConfig } from '../factories/LoggerFactory';

export const loggerConfig: LoggerConfig = {
  type: 'composite',
  includeConsole: true,
  includeDatabase: true,
  context: {
    application: 'learn-every-day',
    environment: process.env.NODE_ENV || 'development'
  }
}; 