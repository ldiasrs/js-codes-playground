#!/usr/bin/env ts-node

import { DatabaseManager } from '../src/learneveryday/infrastructure/database/DatabaseManager';
import { DatabaseConfiguration } from '../src/learneveryday/infrastructure/config/database.config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple Database Setup Script
 * 
 * This script executes the PostgreSQL schema file:
 * - PostgreSQL: executes postgresql-schema.sql
 */

interface SetupResult {
  success: boolean;
  message: string;
  details?: string[];
}

class SimpleDatabaseSetup {
  private dbManager: DatabaseManager;
  private config: DatabaseConfiguration;

  constructor() {
    this.config = DatabaseConfiguration.getInstance();
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * Main setup method - executes the PostgreSQL schema
   */
  async executeSetup(): Promise<SetupResult> {
    const details: string[] = [];
    
    try {
      console.log('🚀 Starting PostgreSQL database setup...');
      
      // Get database configuration
      const dbType = this.config.getType();
      details.push(`Database type: ${dbType}`);
      
      if (dbType !== 'postgres') {
        throw new Error('Only PostgreSQL is supported');
      }

      const postgresConfig = this.config.getPostgreSQLConfig();
      details.push(`PostgreSQL host: ${postgresConfig.host}:${postgresConfig.port}`);
      details.push(`Database: ${postgresConfig.database}`);
      details.push(`Username: ${postgresConfig.username}`);

      // Get a connection
      const connection = await this.dbManager.getConnection('customers');
      
      // Execute the PostgreSQL schema file
      console.log('📋 Executing database schema...');
      const schemaFile = 'postgresql-schema.sql';
      const schemaPath = path.join(__dirname, 'sql', schemaFile);
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
      }
      
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaContent);
      
      details.push(`✓ Executed schema: ${schemaFile}`);

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
   * Resets the database completely (for testing purposes)
   */
  async resetDatabase(): Promise<SetupResult> {
    try {
      console.log('🔄 Resetting database...');
      
      const tables = [
        'authentication_attempts',
        'topic_histories',
        'task_processes', 
        'topics',
        'customers',
        'migrations'
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
  const setup = new SimpleDatabaseSetup();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'setup':
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
      break;

    case 'reset':
      console.log('🔄 Database reset mode');
      const resetResult = await setup.resetDatabase();
      
      if (resetResult.success) {
        console.log('✅ Reset completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Reset failed:', resetResult.message);
        process.exit(1);
      }
      break;

    default:
      console.log(`
🚀 Simple Database Setup Script

Usage:
  npm run db:setup <command>

Commands:
  setup                    Run database setup with appropriate schema
  reset                    Reset database completely

Examples:
  npm run db:setup setup
  npm run db:setup reset
      `);
      process.exit(0);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { SimpleDatabaseSetup }; 