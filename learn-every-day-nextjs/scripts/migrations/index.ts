// Migration system exports
export { BaseMigration } from './Migration';
export type { Migration, MigrationResult, MigrationStatus, MigrationContext } from './Migration';
export { MigrationManager } from './MigrationManager';
export { MigrationRegistry } from './MigrationRegistry';

// Migration implementations
export { InitialSchemaMigration } from './001_initial_schema';