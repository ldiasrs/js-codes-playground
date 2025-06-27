#!/usr/bin/env ts-node

import { DatabaseManager } from '../src/learneveryday/infrastructure/database/DatabaseManager';
import { DatabaseConfiguration } from '../src/learneveryday/infrastructure/config/database.config';
import * as fs from 'fs';
import { DatabaseConnection } from '../src/learneveryday/infrastructure/database/DatabaseManager';

/**
 * Database Setup Script
 * 
 * This script initializes the complete database structure for the Learn Every Day application.
 * It creates all necessary tables and indexes for both SQLite and PostgreSQL databases.
 */

interface SetupResult {
  success: boolean;
  message: string;
  details?: string[];
}

class DatabaseSetup {
  private dbManager: DatabaseManager;
  private config: DatabaseConfiguration;

  constructor() {
    this.config = DatabaseConfiguration.getInstance();
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * Executes the complete database setup process
   */
  async executeSetup(): Promise<SetupResult> {
    const details: string[] = [];
    
    try {

      
      // Get database configuration
      const dbType = this.config.getType();
      details.push(`Database type: ${dbType}`);
      
      console.log('🚀 Starting database setup for type: ' + dbType);

      if (dbType === 'sqlite') {
        const sqliteConfig = this.config.getSQLiteConfig();
        details.push(`SQLite database: ${sqliteConfig.database}`);
        details.push(`Data directory: ${sqliteConfig.dataDir}`);
        
        // Ensure data directory exists
        this.ensureDirectoryExists(sqliteConfig.dataDir);
        details.push('✓ Data directory created/verified');
      } else if (dbType === 'postgres') {
        const postgresConfig = this.config.getPostgreSQLConfig();
        details.push(`PostgreSQL host: ${postgresConfig.host}:${postgresConfig.port}`);
        details.push(`Database: ${postgresConfig.database}`);
        details.push(`Username: ${postgresConfig.username}`);
      }

      // Initialize all tables
      const tables = [
        'customers',
        'topics', 
        'topic_histories',
        'task_processes',
        'authentication_attempts'
      ];

      console.log('📋 Creating database tables...');
      
      for (const tableName of tables) {
        try {
          const connection = await this.dbManager.getConnection(tableName);
          details.push(`✓ Table '${tableName}' created/verified`);
          
          // Create indexes for better performance
          await this.createIndexes(connection, tableName);
          
        } catch (error) {
          details.push(`✗ Failed to create table '${tableName}': ${error}`);
          throw error;
        }
      }

      // Create additional indexes for better query performance
      console.log('🔍 Creating database indexes...');
      await this.createAdditionalIndexes();
      details.push('✓ Additional indexes created');

      // Verify database structure
      console.log('🔍 Verifying database structure...');
      await this.verifyDatabaseStructure();
      details.push('✓ Database structure verified');

      console.log('✅ Database setup completed successfully!');
      
      return {
        success: true,
        message: 'Database setup completed successfully',
        details
      };

    } catch (error) {
      console.error('❌ Database setup failed:', error);
      
      return {
        success: false,
        message: `Database setup failed: ${error}`,
        details
      };
    } finally {
      // Close all database connections
      await this.dbManager.closeAll();
    }
  }

  /**
   * Ensures the data directory exists for SQLite
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Creates indexes for specific tables
   */
  private async createIndexes(connection: DatabaseConnection, tableName: string): Promise<void> {
    const indexes = this.getTableIndexes(tableName);
    
    for (const index of indexes) {
      try {
        await connection.query(index);
      } catch {
        // Index might already exist, which is fine
        console.log(`Index for ${tableName} might already exist: ${index}`);
      }
    }
  }

  /**
   * Creates additional indexes for better query performance
   */
  private async createAdditionalIndexes(): Promise<void> {
    const additionalIndexes = [
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

    for (const indexSQL of additionalIndexes) {
      try {
        // Use any table connection to execute the index
        const connection = await this.dbManager.getConnection('customers');
        await connection.query(indexSQL);
      } catch {
        console.log(`Index creation (might already exist): ${indexSQL}`);
      }
    }
  }

  /**
   * Returns table-specific indexes
   */
  private getTableIndexes(tableName: string): string[] {
    switch (tableName) {
      case 'customers':
        return [
          'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)',
          'CREATE INDEX IF NOT EXISTS idx_customers_gov_id ON customers(gov_identification_content)',
          'CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier)'
        ];
      
      case 'topics':
        return [
          'CREATE INDEX IF NOT EXISTS idx_topics_customer_id ON topics(customer_id)',
          'CREATE INDEX IF NOT EXISTS idx_topics_date_created ON topics(date_created)'
        ];
      
      case 'topic_histories':
        return [
          'CREATE INDEX IF NOT EXISTS idx_topic_histories_topic_id ON topic_histories(topic_id)',
          'CREATE INDEX IF NOT EXISTS idx_topic_histories_created_at ON topic_histories(created_at)'
        ];
      
      case 'task_processes':
        return [
          'CREATE INDEX IF NOT EXISTS idx_task_processes_customer_id ON task_processes(customer_id)',
          'CREATE INDEX IF NOT EXISTS idx_task_processes_status ON task_processes(status)',
          'CREATE INDEX IF NOT EXISTS idx_task_processes_scheduled_to ON task_processes(scheduled_to)'
        ];
      
      case 'authentication_attempts':
        return [
          'CREATE INDEX IF NOT EXISTS idx_auth_attempts_customer_id ON authentication_attempts(customer_id)',
          'CREATE INDEX IF NOT EXISTS idx_auth_attempts_expires_at ON authentication_attempts(expires_at)',
          'CREATE INDEX IF NOT EXISTS idx_auth_attempts_is_used ON authentication_attempts(is_used)'
        ];
      
      default:
        return [];
    }
  }

  /**
   * Verifies the database structure by checking if all tables exist
   */
  private async verifyDatabaseStructure(): Promise<void> {
    const expectedTables = [
      'customers',
      'topics',
      'topic_histories', 
      'task_processes',
      'authentication_attempts'
    ];

    for (const tableName of expectedTables) {
      const connection = await this.dbManager.getConnection(tableName);
      
      // Try to query the table to verify it exists
      try {
        await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`✓ Table '${tableName}' verified`);
      } catch (error) {
        throw new Error(`Table '${tableName}' verification failed: ${error}`);
      }
    }
  }

  /**
   * Resets the database setup (for testing purposes)
   */
  async resetDatabase(): Promise<SetupResult> {
    try {
      console.log('🔄 Resetting database...');
      
      const tables = [
        'authentication_attempts',
        'topic_histories',
        'task_processes', 
        'topics',
        'customers'
      ];

      // Drop tables in reverse order (respecting foreign key constraints)
      for (const tableName of tables) {
        try {
          const connection = await this.dbManager.getConnection(tableName);
          await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
          console.log(`✓ Dropped table '${tableName}'`);
        } catch {
          console.log(`Note: Could not drop table '${tableName}'`);
        }
      }

      // Reset the database manager instance
      DatabaseManager.resetInstance();
      DatabaseConfiguration.resetInstance();

      console.log('✅ Database reset completed');
      
      return {
        success: true,
        message: 'Database reset completed successfully'
      };

    } catch (error) {
      console.error('❌ Database reset failed:', error);
      
      return {
        success: false,
        message: `Database reset failed: ${error}`
      };
    }
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const setup = new DatabaseSetup();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'reset') {
    console.log('🔄 Database reset mode');
    const result = await setup.resetDatabase();
    
    if (result.success) {
      console.log('✅ Reset completed successfully');
      process.exit(0);
    } else {
      console.error('❌ Reset failed:', result.message);
      process.exit(1);
    }
  } else {
    console.log('🚀 Database setup mode');
    const result = await setup.executeSetup();
    
    if (result.success) {
      console.log('✅ Setup completed successfully');
      if (result.details) {
        console.log('\n📋 Setup details:');
        result.details.forEach(detail => console.log(`  ${detail}`));
      }
      process.exit(0);
    } else {
      console.error('❌ Setup failed:', result.message);
      if (result.details) {
        console.log('\n📋 Setup details:');
        result.details.forEach(detail => console.log(`  ${detail}`));
      }
      process.exit(1);
    }
  }
}

// Execute if this file is run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { DatabaseSetup }; 