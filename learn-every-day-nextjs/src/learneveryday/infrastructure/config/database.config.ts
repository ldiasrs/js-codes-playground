import dotenv from 'dotenv';

dotenv.config();

export type DatabaseType = 'postgres';

export interface DatabaseConfig {
  type: DatabaseType;
  // PostgreSQL specific
  postgres: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
}

interface ConfigFile {
  database?: {
    type?: string;
    postgres?: {
      host?: string;
      port?: number;
      database?: string;
      username?: string;
      password?: string;
      ssl?: boolean;
    };
  };
}

/**
 * Loads database configuration from APP_GLOBAL_CONFIG environment variable (database section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. APP_GLOBAL_CONFIG > database
 *   2. Environment variables
 */
export class DatabaseConfiguration {
  private static instance: DatabaseConfiguration;
  private config: DatabaseConfig;

  private constructor() {
    let configFromEnv: ConfigFile = {};
    try {
      const globalConfig = process.env.APP_GLOBAL_CONFIG;
      if (globalConfig) {
        const parsed = JSON.parse(globalConfig) as ConfigFile;
        if (parsed.database) {
          configFromEnv = parsed;
        }
      }
    } catch {
      // Ignore JSON parsing errors, fallback to individual env vars
    }

    const type = (configFromEnv.database?.type || process.env.DATABASE_TYPE || 'postgres') as DatabaseType;

    if (type !== 'postgres') {
      throw new Error('Only PostgreSQL is supported');
    }

    const host = configFromEnv.database?.postgres?.host || process.env.POSTGRES_HOST || 'localhost';
    const port = configFromEnv.database?.postgres?.port || parseInt(process.env.POSTGRES_PORT || '5432');
    const database = configFromEnv.database?.postgres?.database || process.env.POSTGRES_DATABASE || 'learneveryday';
    const username = configFromEnv.database?.postgres?.username || process.env.POSTGRES_USERNAME;
    const password = configFromEnv.database?.postgres?.password || process.env.POSTGRES_PASSWORD;
    const ssl = configFromEnv.database?.postgres?.ssl || (process.env.POSTGRES_SSL === 'true');

    if (!username || !password) {
      throw new Error('POSTGRES_USERNAME and POSTGRES_PASSWORD environment variables or postgres.username and postgres.password in APP_GLOBAL_CONFIG are required for PostgreSQL');
    }

    this.config = {
      type: 'postgres',
      postgres: {
        host,
        port,
        database,
        username,
        password,
        ssl
      }
    };
  }

  public static getInstance(): DatabaseConfiguration {
    if (!DatabaseConfiguration.instance) {
      DatabaseConfiguration.instance = new DatabaseConfiguration();
    }
    return DatabaseConfiguration.instance;
  }

  public getConfig(): DatabaseConfig {
    return this.config;
  }

  public getType(): DatabaseType {
    return this.config.type;
  }

  public isPostgreSQL(): boolean {
    return this.config.type === 'postgres';
  }

  public getPostgreSQLConfig() {
    if (!this.isPostgreSQL()) {
      throw new Error('Database is not configured for PostgreSQL');
    }
    return this.config.postgres;
  }

  public static resetInstance(): void {
    if (DatabaseConfiguration.instance) {
      DatabaseConfiguration.instance = undefined as unknown as DatabaseConfiguration;
    }
  }
} 