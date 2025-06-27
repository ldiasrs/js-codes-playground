import { DatabaseConnection } from '../../src/learneveryday/infrastructure/database/DatabaseManager';
import { Migration, MigrationResult, MigrationStatus } from './Migration';
import { DatabaseConfiguration } from '../../src/learneveryday/infrastructure/config/database.config';

/**
 * Migration Manager
 * 
 * Handles the execution and tracking of database migrations
 */
export class MigrationManager {
  private static instance: MigrationManager;
  private config: DatabaseConfiguration;
  private migrationsTableName = 'migrations';

  private constructor() {
    this.config = DatabaseConfiguration.getInstance();
  }

  public static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  public static resetInstance(): void {
    MigrationManager.instance = undefined as unknown as MigrationManager;
  }

  /**
   * Initializes the migration system
   */
  async initialize(connection: DatabaseConnection): Promise<void> {
    await this.createMigrationsTable(connection);
  }

  /**
   * Creates the migrations tracking table
   */
  private async createMigrationsTable(connection: DatabaseConnection): Promise<void> {
    const isPostgreSQL = this.config.isPostgreSQL();
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTableName} (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        applied_at TEXT NOT NULL,
        checksum TEXT NOT NULL
      )
    `;

    await connection.query(createTableSQL);
  }

  /**
   * Gets all applied migrations
   */
  async getAppliedMigrations(connection: DatabaseConnection): Promise<MigrationStatus[]> {
    try {
      const result = await connection.query(
        `SELECT version, name, applied_at, checksum FROM ${this.migrationsTableName} ORDER BY version`
      );
      
      return result.map((row: Record<string, unknown>) => ({
        version: Number(row.version),
        name: String(row.name),
        applied_at: String(row.applied_at),
        checksum: String(row.checksum)
      }));
    } catch {
      return [];
    }
  }

  /**
   * Records a migration as applied
   */
  async recordMigration(
    connection: DatabaseConnection, 
    migration: Migration, 
    appliedAt: string
  ): Promise<void> {
    await connection.query(
      `INSERT INTO ${this.migrationsTableName} (version, name, description, applied_at, checksum) VALUES (?, ?, ?, ?, ?)`,
      [migration.version, migration.name, migration.description, appliedAt, migration.getChecksum()]
    );
  }

  /**
   * Removes a migration record (for rollback)
   */
  async removeMigrationRecord(connection: DatabaseConnection, version: number): Promise<void> {
    await connection.query(
      `DELETE FROM ${this.migrationsTableName} WHERE version = ?`,
      [version]
    );
  }

  /**
   * Executes pending migrations
   */
  async executeMigrations(
    connection: DatabaseConnection, 
    migrations: Migration[]
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    const appliedMigrations = await this.getAppliedMigrations(connection);
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));

    // Sort migrations by version
    const sortedMigrations = migrations.sort((a, b) => a.version - b.version);

    for (const migration of sortedMigrations) {
      if (appliedVersions.has(migration.version)) {
        console.log(`⏭️  Migration ${migration.version}: ${migration.name} already applied`);
        continue;
      }

      try {
        console.log(`🔄 Executing migration ${migration.version}: ${migration.name}`);
        
        // Validate migration
        migration.validate();

        // Execute migration
        await migration.up(connection);

        // Record migration
        const appliedAt = new Date().toISOString();
        await this.recordMigration(connection, migration, appliedAt);

        console.log(`✅ Migration ${migration.version}: ${migration.name} completed`);
        
        results.push({
          success: true,
          message: `Migration ${migration.version}: ${migration.name} executed successfully`,
          version: migration.version,
          name: migration.name
        });

      } catch (error) {
        console.error(`❌ Migration ${migration.version}: ${migration.name} failed:`, error);
        
        results.push({
          success: false,
          message: `Migration ${migration.version}: ${migration.name} failed: ${error}`,
          version: migration.version,
          name: migration.name
        });

        // Stop execution on first failure
        break;
      }
    }

    return results;
  }

  /**
   * Rolls back migrations
   */
  async rollbackMigrations(
    connection: DatabaseConnection, 
    migrations: Migration[], 
    targetVersion?: number
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    const appliedMigrations = await this.getAppliedMigrations(connection);
    
    // Sort applied migrations by version (descending for rollback)
    const sortedAppliedMigrations = appliedMigrations.sort((a, b) => b.version - a.version);

    for (const appliedMigration of sortedAppliedMigrations) {
      // Stop if we've reached the target version
      if (targetVersion !== undefined && appliedMigration.version <= targetVersion) {
        break;
      }

      const migration = migrations.find(m => m.version === appliedMigration.version);
      if (!migration) {
        console.warn(`⚠️  Migration ${appliedMigration.version} not found in migration list`);
        continue;
      }

      try {
        console.log(`🔄 Rolling back migration ${migration.version}: ${migration.name}`);
        
        // Execute rollback
        await migration.down(connection);

        // Remove migration record
        await this.removeMigrationRecord(connection, migration.version);

        console.log(`✅ Rollback ${migration.version}: ${migration.name} completed`);
        
        results.push({
          success: true,
          message: `Migration ${migration.version}: ${migration.name} rolled back successfully`,
          version: migration.version,
          name: migration.name
        });

      } catch (error) {
        console.error(`❌ Rollback ${migration.version}: ${migration.name} failed:`, error);
        
        results.push({
          success: false,
          message: `Rollback ${migration.version}: ${migration.name} failed: ${error}`,
          version: migration.version,
          name: migration.name
        });

        // Stop execution on first failure
        break;
      }
    }

    return results;
  }

  /**
   * Gets migration status
   */
  async getMigrationStatus(connection: DatabaseConnection, migrations: Migration[]): Promise<{
    applied: MigrationStatus[];
    pending: Migration[];
    total: number;
    appliedCount: number;
    pendingCount: number;
  }> {
    const appliedMigrations = await this.getAppliedMigrations(connection);
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    
    const pendingMigrations = migrations.filter(m => !appliedVersions.has(m.version));
    
    return {
      applied: appliedMigrations,
      pending: pendingMigrations,
      total: migrations.length,
      appliedCount: appliedMigrations.length,
      pendingCount: pendingMigrations.length
    };
  }

  /**
   * Validates migration integrity
   */
  async validateMigrations(
    connection: DatabaseConnection, 
    migrations: Migration[]
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const appliedMigrations = await this.getAppliedMigrations(connection);

    // Check for duplicate versions
    const versions = migrations.map(m => m.version);
    const duplicateVersions = versions.filter((v, i) => versions.indexOf(v) !== i);
    if (duplicateVersions.length > 0) {
      errors.push(`Duplicate migration versions found: ${duplicateVersions.join(', ')}`);
    }

    // Check for gaps in versions
    const sortedVersions = [...new Set(versions)].sort((a, b) => a - b);
    for (let i = 1; i < sortedVersions.length; i++) {
      if (sortedVersions[i] !== sortedVersions[i - 1] + 1) {
        errors.push(`Gap in migration versions: ${sortedVersions[i - 1]} -> ${sortedVersions[i]}`);
      }
    }

    // Check for checksum mismatches in applied migrations
    for (const appliedMigration of appliedMigrations) {
      const migration = migrations.find(m => m.version === appliedMigration.version);
      if (migration && migration.getChecksum() !== appliedMigration.checksum) {
        errors.push(`Checksum mismatch for migration ${appliedMigration.version}: ${appliedMigration.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 