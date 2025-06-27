import { Migration } from './Migration';
import { InitialSchemaMigration } from './001_initial_schema';

/**
 * Migration Registry
 * 
 * Central registry for all available migrations.
 * Add new migrations here to make them available for execution.
 */
export class MigrationRegistry {
  private static migrations: Migration[] = [
    new InitialSchemaMigration(),
  ];

  /**
   * Gets all available migrations
   */
  static getAllMigrations(): Migration[] {
    return [...this.migrations];
  }

  /**
   * Gets migrations sorted by version
   */
  static getSortedMigrations(): Migration[] {
    return this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Gets a specific migration by version
   */
  static getMigrationByVersion(version: number): Migration | undefined {
    return this.migrations.find(m => m.version === version);
  }

  /**
   * Gets migrations within a version range
   */
  static getMigrationsInRange(fromVersion: number, toVersion: number): Migration[] {
    return this.migrations
      .filter(m => m.version >= fromVersion && m.version <= toVersion)
      .sort((a, b) => a.version - b.version);
  }

  /**
   * Gets pending migrations (not yet applied)
   */
  static getPendingMigrations(appliedVersions: number[]): Migration[] {
    return this.migrations
      .filter(m => !appliedVersions.includes(m.version))
      .sort((a, b) => a.version - b.version);
  }

  /**
   * Validates migration integrity
   */
  static validateMigrations(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate versions
    const versions = this.migrations.map(m => m.version);
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

    // Validate each migration
    for (const migration of this.migrations) {
      try {
        migration.validate();
      } catch (error) {
        errors.push(`Migration ${migration.version}: ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets migration statistics
   */
  static getMigrationStats(): {
    total: number;
    versions: number[];
    names: string[];
  } {
    return {
      total: this.migrations.length,
      versions: this.migrations.map(m => m.version).sort((a, b) => a - b),
      names: this.migrations.map(m => m.name).sort()
    };
  }

  /**
   * Registers a new migration
   */
  static registerMigration(migration: Migration): void {
    // Validate the migration
    migration.validate();

    // Check for duplicate version
    const existingMigration = this.getMigrationByVersion(migration.version);
    if (existingMigration) {
      throw new Error(`Migration with version ${migration.version} already exists: ${existingMigration.name}`);
    }

    // Add to registry
    this.migrations.push(migration);
    
    // Re-sort migrations
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Unregisters a migration
   */
  static unregisterMigration(version: number): void {
    const index = this.migrations.findIndex(m => m.version === version);
    if (index !== -1) {
      this.migrations.splice(index, 1);
    }
  }

  /**
   * Clears all migrations (useful for testing)
   */
  static clearMigrations(): void {
    this.migrations = [];
  }
} 