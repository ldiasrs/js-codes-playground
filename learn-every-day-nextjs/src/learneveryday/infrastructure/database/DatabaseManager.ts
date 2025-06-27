import { DatabaseConfiguration } from '../config/database.config';
import { createPool, VercelPool } from '@vercel/postgres';

export interface DatabaseConnection {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  close(): Promise<void>;
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

    if (!this.config.isPostgreSQL()) {
      throw new Error('Only PostgreSQL is supported');
    }

    const postgresConfig = this.config.getPostgreSQLConfig();
    const connection = new PostgreSQLConnection(postgresConfig);
    
    this.connections.set(tableName, connection);
    return connection;
  }

  public async closeAll(): Promise<void> {
    const closePromises = Array.from(this.connections.values()).map(conn => conn.close());
    await Promise.all(closePromises);
    this.connections.clear();
  }

  public static resetInstance(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.closeAll();
      DatabaseManager.instance = undefined as unknown as DatabaseManager;
    }
  }
} 