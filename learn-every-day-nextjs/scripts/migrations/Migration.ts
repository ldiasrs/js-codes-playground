import { DatabaseConnection } from '../../src/learneveryday/infrastructure/database/DatabaseManager';

/**
 * Migration interface that all migrations must implement
 */
export interface Migration {
  readonly version: number;
  readonly name: string;
  readonly description: string;
  
  /**
   * Executes the migration
   */
  up(connection: DatabaseConnection): Promise<void>;
  
  /**
   * Reverts the migration (rollback)
   */
  down(connection: DatabaseConnection): Promise<void>;

  /**
   * Gets the migration checksum for tracking changes
   */
  getChecksum(): string;

  /**
   * Validates the migration before execution
   */
  validate(): void;
}

/**
 * Migration result interface
 */
export interface MigrationResult {
  success: boolean;
  message: string;
  version: number;
  name: string;
  details?: string[];
}

/**
 * Migration status interface
 */
export interface MigrationStatus {
  version: number;
  name: string;
  applied_at: string;
  checksum: string;
}

/**
 * Migration execution context
 */
export interface MigrationContext {
  connection: DatabaseConnection;
  isPostgreSQL: boolean;
  version: number;
  name: string;
}

/**
 * Base migration class with common functionality
 */
export abstract class BaseMigration implements Migration {
  abstract readonly version: number;
  abstract readonly name: string;
  abstract readonly description: string;

  /**
   * Executes the migration
   */
  abstract up(connection: DatabaseConnection): Promise<void>;

  /**
   * Reverts the migration
   */
  abstract down(connection: DatabaseConnection): Promise<void>;

  /**
   * Gets the migration checksum for tracking changes
   */
  getChecksum(): string {
    return `${this.version}_${this.name}_${this.description}`;
  }

  /**
   * Validates the migration before execution
   */
  validate(): void {
    if (!this.version || this.version <= 0) {
      throw new Error(`Invalid migration version: ${this.version}`);
    }
    if (!this.name || this.name.trim() === '') {
      throw new Error('Migration name cannot be empty');
    }
    if (!this.description || this.description.trim() === '') {
      throw new Error('Migration description cannot be empty');
    }
  }

  /**
   * Helper method to execute SQL with error handling
   */
  protected async executeSQL(connection: DatabaseConnection, sql: string, params?: unknown[]): Promise<void> {
    try {
      await connection.query(sql, params);
    } catch (error) {
      throw new Error(`Failed to execute SQL: ${sql}. Error: ${error}`);
    }
  }

  /**
   * Helper method to check if a table exists
   */
  protected async tableExists(connection: DatabaseConnection, tableName: string): Promise<boolean> {
    try {
      const result = await connection.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return result.length > 0;
    } catch {
      // If the query fails, assume table doesn't exist
      return false;
    }
  }

  /**
   * Helper method to check if a column exists in a table
   */
  protected async columnExists(connection: DatabaseConnection, tableName: string, columnName: string): Promise<boolean> {
    try {
      const result = await connection.query(`PRAGMA table_info(${tableName})`);
      return result.some((row: Record<string, unknown>) => row.name === columnName);
    } catch {
      return false;
    }
  }
} 