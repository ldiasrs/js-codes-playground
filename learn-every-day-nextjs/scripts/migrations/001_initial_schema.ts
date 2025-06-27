import { BaseMigration } from './Migration';
import { DatabaseConnection } from '../../src/learneveryday/infrastructure/database/DatabaseManager';
import { DatabaseConfiguration } from '../../src/learneveryday/infrastructure/config/database.config';

/**
 * Initial Database Schema Migration
 * 
 * Creates the base database structure with all core tables:
 * - customers
 * - topics
 * - topic_histories
 * - task_processes
 * - authentication_attempts
 */
export class InitialSchemaMigration extends BaseMigration {
  readonly version = 1;
  readonly name = 'initial_schema';
  readonly description = 'Create initial database schema with core tables';

  async up(connection: DatabaseConnection): Promise<void> {
    const config = DatabaseConfiguration.getInstance();
    const isPostgreSQL = config.isPostgreSQL();

    // Create customers table
    await this.executeSQL(connection, `
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
    `);

    // Create topics table
    await this.executeSQL(connection, `
      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        date_created TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // Create topic_histories table
    await this.executeSQL(connection, `
      CREATE TABLE IF NOT EXISTS topic_histories (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (topic_id) REFERENCES topics(id)
      )
    `);

    // Create task_processes table
    await this.executeSQL(connection, `
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
    `);

    // Create authentication_attempts table
    const isUsedDefault = isPostgreSQL ? 'false' : '0';
    await this.executeSQL(connection, `
      CREATE TABLE IF NOT EXISTS authentication_attempts (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        encrypted_verification_code TEXT NOT NULL,
        attempt_date TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT ${isUsedDefault},
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // Create indexes for better performance
    await this.createIndexes(connection);
  }

  async down(connection: DatabaseConnection): Promise<void> {
    // Drop tables in reverse order (respecting foreign key constraints)
    const tables = [
      'authentication_attempts',
      'topic_histories',
      'task_processes',
      'topics',
      'customers'
    ];

    for (const tableName of tables) {
      await this.executeSQL(connection, `DROP TABLE IF EXISTS ${tableName}`);
    }
  }

  private async createIndexes(connection: DatabaseConnection): Promise<void> {
    const indexes = [
      // Customer indexes
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)',
      'CREATE INDEX IF NOT EXISTS idx_customers_gov_id ON customers(gov_identification_content)',
      'CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier)',
      
      // Topic indexes
      'CREATE INDEX IF NOT EXISTS idx_topics_customer_id ON topics(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_topics_date_created ON topics(date_created)',
      
      // Topic history indexes
      'CREATE INDEX IF NOT EXISTS idx_topic_histories_topic_id ON topic_histories(topic_id)',
      'CREATE INDEX IF NOT EXISTS idx_topic_histories_created_at ON topic_histories(created_at)',
      
      // Task process indexes
      'CREATE INDEX IF NOT EXISTS idx_task_processes_customer_id ON task_processes(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_task_processes_status ON task_processes(status)',
      'CREATE INDEX IF NOT EXISTS idx_task_processes_scheduled_to ON task_processes(scheduled_to)',
      
      // Authentication attempt indexes
      'CREATE INDEX IF NOT EXISTS idx_auth_attempts_customer_id ON authentication_attempts(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_auth_attempts_expires_at ON authentication_attempts(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_auth_attempts_is_used ON authentication_attempts(is_used)'
    ];

    for (const indexSQL of indexes) {
      try {
        await this.executeSQL(connection, indexSQL);
      } catch {
        // Index might already exist, which is fine
        console.log(`Index creation (might already exist): ${indexSQL}`);
      }
    }
  }
} 