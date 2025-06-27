import { LoggerConfig } from '../factories/LoggerFactory';

export const loggerConfig: LoggerConfig = {
  type: 'console',
  context: {
    application: 'learn-every-day',
    environment: process.env.NODE_ENV || 'development'
  }
}; 