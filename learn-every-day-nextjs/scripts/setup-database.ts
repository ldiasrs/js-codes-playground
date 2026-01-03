#!/usr/bin/env ts-node

import { DatabaseManager, DatabaseConnection } from '../src/learneveryday/infrastructure/database/DatabaseManager';
import { DatabaseConfiguration } from '../src/learneveryday/infrastructure/config/database.config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple Database Setup Script
 * 
 * This script executes all SQL migration files in the migrations directory:
 * - Reads all .sql files from scripts/migrations
 * - Executes them in alphabetical order
 * - Tracks executed migrations in the migrations table
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
   * Creates the migrations table if it doesn't exist
   */
  private async ensureMigrationsTable(connection: DatabaseConnection): Promise<void> {
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          date_executed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
    } catch (error) {
      console.error('🔄 Error creating migrations table', error);
      throw error;
    }
  }

  /**
   * Gets the list of already executed migrations
   */
  private async getExecutedMigrations(connection: DatabaseConnection): Promise<string[]> {
    try {
      await this.ensureMigrationsTable(connection);
      const result = await connection.query('SELECT filename FROM migrations ORDER BY date_executed');
      return result.rows.map((row: Record<string, unknown>) => row.filename as string);
    } catch (error) {
      console.error('🔄 Error on getExecutedMigrations', error);
      return [];
    }
  }


  /**
   * Main setup method - executes all migration files in order
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
      const connection = await this.dbManager.getConnection('migrations');
      
      // Read all migration files from the migrations directory
      const migrationsDir = path.join(__dirname, 'migrations');
      console.log('📁 Reading migration files from:', migrationsDir);
      
      if (!fs.existsSync(migrationsDir)) {
        throw new Error(`Migrations directory not found: ${migrationsDir}`);
      }
      
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort((a, b) => {
          // Prioritize initial-schema migrations to run first
          const aIsInitial = a.includes('initial-schema');
          const bIsInitial = b.includes('initial-schema');
          
          if (aIsInitial && !bIsInitial) return -1;
          if (!aIsInitial && bIsInitial) return 1;
          
          // Extract date and time from filename (format: YYYY-MM-DD-HHMM-filename.sql)
          const extractDateTime = (filename: string): Date => {
            const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{4})-/);
            if (match) {
              const [, year, month, day, time] = match;
              const hours = parseInt(time.substring(0, 2), 10);
              const minutes = parseInt(time.substring(2, 4), 10);
              return new Date(
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10),
                hours,
                minutes
              );
            }
            // Fallback to filename for non-standard names
            return new Date(0);
          };
          return extractDateTime(a).getTime() - extractDateTime(b).getTime();
        }); // Sort files by date/time, with initial-schema first
      
      if (migrationFiles.length === 0) {
        throw new Error('No migration files found in migrations directory');
      }
      
      details.push(`Found ${migrationFiles.length} migration files`);
      
      // Get already executed migrations
      const executedMigrations = await this.getExecutedMigrations(connection);
      details.push(`Found ${executedMigrations.length} already executed migrations`);
      
      // Execute each migration file in order
      for (const migrationFile of migrationFiles) {
        // Skip if already executed
        if (executedMigrations.includes(migrationFile)) {
          console.log(`⏭️  Skipping already executed migration: ${migrationFile}`);
          details.push(`⏭️  Skipped migration: ${migrationFile} (already executed)`);
          continue;
        }
        
        console.log(`📋 Executing migration: ${migrationFile}`);
        
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationContent = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await connection.query(migrationContent);
        
        // Record the migration in the migrations table
        await connection.query(
          'INSERT INTO migrations (filename, date_executed) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING',
          [migrationFile, new Date()]
        );
        
        details.push(`✓ Executed migration: ${migrationFile}`);
      }

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
          await connection.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
          console.log(`✓ Dropped table '${tableName}'`);
        } catch (error) {
          console.log(`Note: Could not drop table '${tableName}': ${error}`);
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