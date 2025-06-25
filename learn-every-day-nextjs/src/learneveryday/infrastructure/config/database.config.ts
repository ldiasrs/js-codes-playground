import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export type DatabaseType = 'sqlite' | 'postgres';

export interface DatabaseConfig {
  type: DatabaseType;
  // SQLite specific
  sqlite?: {
    database: string;
    dataDir: string;
  };
  // PostgreSQL specific
  postgres?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
}

/**
 * Loads database configuration from global-config.prod.json (database section) if available,
 * otherwise falls back to environment variables.
 *
 * Precedence:
 *   1. global-config.prod.json > database
 *   2. Environment variables
 */
export class DatabaseConfiguration {
  private static instance: DatabaseConfiguration;
  private config: DatabaseConfig;

  private constructor() {
    let configFromFile: any = {};
    try {
      const configPath = path.join(__dirname, '../../../../config/global-config.prod.json');
      if (fs.existsSync(configPath)) {
        const file = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(file);
        if (parsed.database) {
          configFromFile = parsed.database;
        }
      }
    } catch (e) {
      // Ignore file errors, fallback to env
    }

    const type = (configFromFile.type || process.env.DATABASE_TYPE || 'sqlite') as DatabaseType;

    if (type === 'sqlite') {
      const dataDir = configFromFile.sqlite?.dataDir || process.env.SQLITE_DATA_DIR || './data/local';
      const database = configFromFile.sqlite?.database || process.env.SQLITE_DATABASE || 'learneveryday.db';
      
      this.config = {
        type: 'sqlite',
        sqlite: {
          database,
          dataDir
        }
      };
    } else if (type === 'postgres') {
      const host = configFromFile.postgres?.host || process.env.POSTGRES_HOST || 'localhost';
      const port = configFromFile.postgres?.port || parseInt(process.env.POSTGRES_PORT || '5432');
      const database = configFromFile.postgres?.database || process.env.POSTGRES_DATABASE || 'learneveryday';
      const username = configFromFile.postgres?.username || process.env.POSTGRES_USERNAME;
      const password = configFromFile.postgres?.password || process.env.POSTGRES_PASSWORD;
      const ssl = configFromFile.postgres?.ssl || (process.env.POSTGRES_SSL === 'true');

      if (!username || !password) {
        throw new Error('POSTGRES_USERNAME and POSTGRES_PASSWORD environment variables or postgres.username and postgres.password in global-config.prod.json are required for PostgreSQL');
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
    } else {
      throw new Error(`Unsupported database type: ${type}`);
    }
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

  public isSQLite(): boolean {
    return this.config.type === 'sqlite';
  }

  public isPostgreSQL(): boolean {
    return this.config.type === 'postgres';
  }

  public getSQLiteConfig() {
    if (!this.isSQLite()) {
      throw new Error('Database is not configured for SQLite');
    }
    return this.config.sqlite!;
  }

  public getPostgreSQLConfig() {
    if (!this.isPostgreSQL()) {
      throw new Error('Database is not configured for PostgreSQL');
    }
    return this.config.postgres!;
  }

  public static resetInstance(): void {
    if (DatabaseConfiguration.instance) {
      DatabaseConfiguration.instance = undefined as any;
    }
  }
} 