#!/usr/bin/env ts-node

import { DatabaseManager } from '../src/learneveryday/infrastructure/database/DatabaseManager';
import { DatabaseConfiguration } from '../src/learneveryday/infrastructure/config/database.config';
import { MigrationManager } from './migrations/MigrationManager';
import { MigrationRegistry } from './migrations/MigrationRegistry';
import * as fs from 'fs';

/**
 * Versioned Database Setup Script v2
 * 
 * This script provides a comprehensive database management system with:
 * - Versioned migrations for schema changes
 * - Data seeding capabilities
 * - Migration rollback functionality
 * - Database status monitoring
 * - Manual data insertion utilities
 */

interface SetupResult {
  success: boolean;
  message: string;
  details?: string[];
}

interface MigrationStatus {
  applied: Array<{
    version: number;
    name: string;
    applied_at: string;
  }>;
  pending: Array<{
    version: number;
    name: string;
  }>;
  total: number;
  appliedCount: number;
  pendingCount: number;
}

class VersionedDatabaseSetup {
  private dbManager: DatabaseManager;
  private config: DatabaseConfiguration;
  private migrationManager: MigrationManager;

  constructor() {
    this.config = DatabaseConfiguration.getInstance();
    this.dbManager = DatabaseManager.getInstance();
    this.migrationManager = MigrationManager.getInstance();
  }

  /**
   * Main setup method - runs migrations and optionally seeds data
   */
  async executeSetup(options: {
    seedData?: boolean;
    skipMigrations?: boolean;
  } = {}): Promise<SetupResult> {
    const details: string[] = [];
    
    try {
      console.log('🚀 Starting versioned database setup...');
      
      // Get database configuration
      const dbType = this.config.getType();
      details.push(`Database type: ${dbType}`);
      
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

      // Get a connection for migrations
      const connection = await this.dbManager.getConnection('customers');
      
      // Initialize migration system
      console.log('📋 Initializing migration system...');
      await this.migrationManager.initialize(connection);
      details.push('✓ Migration system initialized');

      // Validate migrations
      console.log('🔍 Validating migrations...');
      const validation = MigrationRegistry.validateMigrations();
      if (!validation.valid) {
        throw new Error(`Migration validation failed: ${validation.errors.join(', ')}`);
      }
      details.push('✓ Migrations validated');

      // Execute migrations if not skipped
      if (!options.skipMigrations) {
        console.log('🔄 Executing migrations...');
        const migrations = MigrationRegistry.getSortedMigrations();
        const results = await this.migrationManager.executeMigrations(connection, migrations);
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        details.push(`✓ Executed ${successCount} migrations successfully`);
        if (failureCount > 0) {
          details.push(`✗ ${failureCount} migrations failed`);
          const failedMigrations = results.filter(r => !r.success);
          failedMigrations.forEach(fm => details.push(`  - ${fm.version}: ${fm.name} - ${fm.message}`));
        }
      }

      // Get final status
      const status = await this.getMigrationStatus();
      details.push(`📊 Final status: ${status.appliedCount}/${status.total} migrations applied`);

      console.log('✅ Versioned database setup completed successfully!');
      
      return {
        success: true,
        message: 'Versioned database setup completed successfully',
        details
      };

    } catch (error) {
      console.error('❌ Versioned database setup failed:', error);
      
      return {
        success: false,
        message: `Versioned database setup failed: ${error}`,
        details
      };
    } finally {
      // Close all database connections
      await this.dbManager.closeAll();
    }
  }

  /**
   * Gets current migration status
   */
  async getMigrationStatus(): Promise<MigrationStatus> {
    const connection = await this.dbManager.getConnection('customers');
    const migrations = MigrationRegistry.getSortedMigrations();
    const status = await this.migrationManager.getMigrationStatus(connection, migrations);
    
    return {
      applied: status.applied.map(m => ({
        version: m.version,
        name: m.name,
        applied_at: m.applied_at
      })),
      pending: status.pending.map(m => ({
        version: m.version,
        name: m.name
      })),
      total: status.total,
      appliedCount: status.appliedCount,
      pendingCount: status.pendingCount
    };
  }

  /**
   * Rolls back migrations to a specific version
   */
  async rollbackMigrations(targetVersion?: number): Promise<SetupResult> {
    const details: string[] = [];
    
    try {
      console.log('🔄 Rolling back migrations...');
      
      const connection = await this.dbManager.getConnection('customers');
      const migrations = MigrationRegistry.getSortedMigrations();
      
      const results = await this.migrationManager.rollbackMigrations(connection, migrations, targetVersion);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      details.push(`✓ Rolled back ${successCount} migrations successfully`);
      if (failureCount > 0) {
        details.push(`✗ ${failureCount} rollbacks failed`);
        const failedRollbacks = results.filter(r => !r.success);
        failedRollbacks.forEach(fr => details.push(`  - ${fr.version}: ${fr.name} - ${fr.message}`));
      }

      return {
        success: failureCount === 0,
        message: `Rollback completed: ${successCount} successful, ${failureCount} failed`,
        details
      };

    } catch (error) {
      console.error('❌ Migration rollback failed:', error);
      
      return {
        success: false,
        message: `Migration rollback failed: ${error}`,
        details
      };
    } finally {
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
      MigrationManager.resetInstance();

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
  const setup = new VersionedDatabaseSetup();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  const options = args.slice(1);

  switch (command) {
    case 'setup':
      console.log('🚀 Database setup mode');
      const seedData = options.includes('--seed');
      const skipMigrations = options.includes('--skip-migrations');
      const result = await setup.executeSetup({ seedData, skipMigrations });
      
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

    case 'status':
      console.log('📊 Getting database status...');
      const status = await setup.getMigrationStatus();
      console.log(`\nMigration Status:`);
      console.log(`  Applied: ${status.appliedCount}/${status.total}`);
      console.log(`  Pending: ${status.pendingCount}`);
      
      if (status.applied.length > 0) {
        console.log(`\nApplied Migrations:`);
        status.applied.forEach(m => console.log(`  ${m.version}: ${m.name} (${m.applied_at})`));
      }
      
      if (status.pending.length > 0) {
        console.log(`\nPending Migrations:`);
        status.pending.forEach(m => console.log(`  ${m.version}: ${m.name}`));
      }
      break;

    case 'rollback':
      const targetVersion = options[0] ? parseInt(options[0]) : undefined;
      console.log(`🔄 Rolling back migrations${targetVersion ? ` to version ${targetVersion}` : ''}...`);
      const rollbackResult = await setup.rollbackMigrations(targetVersion);
      
      if (rollbackResult.success) {
        console.log('✅ Rollback completed successfully');
        if (rollbackResult.details) {
          console.log('\n📋 Rollback details:');
          rollbackResult.details.forEach(detail => console.log(`  ${detail}`));
        }
        process.exit(0);
      } else {
        console.error('❌ Rollback failed:', rollbackResult.message);
        if (rollbackResult.details) {
          console.log('\n📋 Rollback details:');
          rollbackResult.details.forEach(detail => console.log(`  ${detail}`));
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
🚀 Versioned Database Setup Script v2

Usage:
  npm run db:setup-v2 <command> [options]

Commands:
  setup                    Run database setup with migrations
  status                   Show migration and database status
  rollback [version]       Rollback migrations to specified version
  seed                     Seed sample data
  clear-data               Clear all seeded data
  stats                    Show database statistics
  reset                    Reset database completely

Options for setup:
  --seed                   Include sample data seeding
  --skip-migrations        Skip running migrations

Examples:
  npm run db:setup-v2 setup
  npm run db:setup-v2 setup --seed
  npm run db:setup-v2 status
  npm run db:setup-v2 rollback 1
  npm run db:setup-v2 seed
  npm run db:setup-v2 stats
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

export { VersionedDatabaseSetup }; 