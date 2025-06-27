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
      
      // Initialize table if it doesn't exist
      await this.initializeSQLiteTable(connection as SQLiteConnection, tableName);
    } else if (this.config.isPostgreSQL()) {
      const postgresConfig = this.config.getPostgreSQLConfig();
      connection = new PostgreSQLConnection(postgresConfig);
      
      // Initialize table if it doesn't exist
      await this.initializePostgreSQLTable(connection as PostgreSQLConnection, tableName);
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

  private async initializeSQLiteTable(connection: SQLiteConnection, tableName: string): Promise<void> {
    const createTableSQL = this.getCreateTableSQL(tableName);
    await connection.query(createTableSQL);
  }

  private async initializePostgreSQLTable(connection: PostgreSQLConnection, tableName: string): Promise<void> {
    const createTableSQL = this.getCreateTableSQL(tableName);
    await connection.query(createTableSQL);
  }

  private getCreateTableSQL(tableName: string): string {
    const isPostgreSQL = this.config.isPostgreSQL();
    
    switch (tableName) {
      case 'customers':
        return `
          CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            gov_identification_type TEXT NOT NULL,
            gov_identification_content TEXT NOT NULL,
            email TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            tier TEXT NOT NULL DEFAULT 'Basic',
            date_created TEXT NOT NULL
          )
        `;
      
      case 'topics':
        return `
          CREATE TABLE IF NOT EXISTS topics (
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            date_created TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
          )
        `;
      
      case 'topic_histories':
        return `
          CREATE TABLE IF NOT EXISTS topic_histories (
            id TEXT PRIMARY KEY,
            topic_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (topic_id) REFERENCES topics(id)
          )
        `;
      
      case 'task_processes':
        return `
          CREATE TABLE IF NOT EXISTS task_processes (
            id TEXT PRIMARY KEY,
            entity_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            error_msg TEXT,
            scheduled_to TEXT,
            process_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
          )
        `;
      
      case 'authentication_attempts':
        const isUsedDefault = isPostgreSQL ? 'false' : '0';
        return `
          CREATE TABLE IF NOT EXISTS authentication_attempts (
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            encrypted_verification_code TEXT NOT NULL,
            attempt_date TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            is_used BOOLEAN NOT NULL DEFAULT ${isUsedDefault},
            FOREIGN KEY (customer_id) REFERENCES customers(id)
          )
        `;
      
      default:
        throw new Error(`Unknown table name: ${tableName}`);
    }
  }

  public static resetInstance(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.closeAll();
      DatabaseManager.instance = undefined as unknown as DatabaseManager;
    }
  }
} 