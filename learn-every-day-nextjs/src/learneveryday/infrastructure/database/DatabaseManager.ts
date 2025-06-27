import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseConfiguration } from '../config/database.config';
import { createPool, VercelPool } from '@vercel/postgres';

export interface DatabaseConnection {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  close(): Promise<void>;
}

export class SQLiteConnection implements DatabaseConnection {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
  }

  async query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows as Record<string, unknown>[]) || []);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export class PostgreSQLConnection implements DatabaseConnection {
  private pool: VercelPool;

  constructor(config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  }) {
    const connectionString =
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL ||
      `postgres://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${config.ssl ? '?sslmode=require' : ''}`;
    this.pool = createPool({ connectionString });
  }

  async query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async close(): Promise<void> {
    // Vercel's pool does not require explicit close, but for compatibility:
    if (typeof (this.pool as unknown as { end?: () => Promise<void> }).end === 'function') {
      await (this.pool as unknown as { end: () => Promise<void> }).end();
    }
  }
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, DatabaseConnection> = new Map();
  private config: DatabaseConfiguration;

  private constructor() {
    this.config = DatabaseConfiguration.getInstance();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getConnection(tableName: string): Promise<DatabaseConnection> {
    if (this.connections.has(tableName)) {
      return this.connections.get(tableName)!;
    }

    let connection: DatabaseConnection;

    if (this.config.isSQLite()) {
      const sqliteConfig = this.config.getSQLiteConfig();
      const dbPath = path.join(sqliteConfig.dataDir, sqliteConfig.database);
      
      // Ensure data directory exists
      this.ensureDirectoryExists(sqliteConfig.dataDir);
      
      connection = new SQLiteConnection(dbPath);
      
    } else if (this.config.isPostgreSQL()) {
      const postgresConfig = this.config.getPostgreSQLConfig();
      connection = new PostgreSQLConnection(postgresConfig);
      
    } else {
      throw new Error('Unsupported database type');
    }

    this.connections.set(tableName, connection);
    return connection;
  }

  public async closeAll(): Promise<void> {
    const closePromises = Array.from(this.connections.values()).map(conn => conn.close());
    await Promise.all(closePromises);
    this.connections.clear();
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  public static resetInstance(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.closeAll();
      DatabaseManager.instance = undefined as unknown as DatabaseManager;
    }
  }
} 