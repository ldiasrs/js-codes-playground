# Database Migration System

This directory contains a comprehensive versioned database migration system for the Learn Every Day application. The system provides versioned schema changes, data seeding capabilities, and rollback functionality.

## Overview

The migration system consists of several key components:

- **Migration Interface**: Defines the contract for all migrations
- **Migration Manager**: Handles migration execution and tracking
- **Migration Registry**: Manages all available migrations
- **Data Seeder**: Provides utilities for manual data insertion
- **Base Migration**: Abstract class with common migration functionality

## Architecture

```
migrations/
├── Migration.ts              # Core migration interfaces and base class
├── MigrationManager.ts       # Migration execution and tracking
├── MigrationRegistry.ts      # Migration registration and management
├── DataSeeder.ts            # Data seeding utilities
├── 001_initial_schema.ts    # Initial database schema
├── 002_sample_data.ts       # Sample data insertion
├── index.ts                 # Exports for easy importing
└── README.md               # This file
```

## Key Features

### 1. Versioned Migrations
- Each migration has a unique version number
- Migrations are executed in order
- Automatic tracking of applied migrations
- Checksum validation for migration integrity

### 2. Rollback Support
- Rollback migrations to any previous version
- Automatic dependency handling
- Safe rollback with error handling

### 3. Data Seeding
- Manual data insertion utilities
- Sample data for development/testing
- Custom data seeding capabilities
- Data cleanup utilities

### 4. Database Agnostic
- Works with both SQLite and PostgreSQL
- Automatic database-specific optimizations
- Consistent interface across database types

## Usage

### Basic Setup

```bash
# Run all migrations
npm run db:setup-v2 setup

# Run migrations with sample data
npm run db:setup-v2 setup --seed

# Skip migrations (useful for data-only operations)
npm run db:setup-v2 setup --skip-migrations
```

### Migration Management

```bash
# Check migration status
npm run db:setup-v2 status

# Rollback to specific version
npm run db:setup-v2 rollback 1

# Rollback all migrations
npm run db:setup-v2 rollback
```

### Data Management

```bash
# Seed sample data
npm run db:setup-v2 seed

# Clear seeded data
npm run db:setup-v2 clear-data

# Get database statistics
npm run db:setup-v2 stats
```

### Database Reset

```bash
# Complete database reset (for testing)
npm run db:setup-v2 reset
```

## Creating New Migrations

### 1. Create Migration File

Create a new file in the `migrations/` directory with the naming convention:
`XXX_migration_name.ts` where `XXX` is the next version number.

Example: `003_add_user_preferences.ts`

### 2. Implement Migration Class

```typescript
import { BaseMigration } from './Migration';
import { DatabaseConnection } from '../../src/learneveryday/infrastructure/database/DatabaseManager';

export class AddUserPreferencesMigration extends BaseMigration {
  readonly version = 3;
  readonly name = 'add_user_preferences';
  readonly description = 'Add user preferences table and related fields';

  async up(connection: DatabaseConnection): Promise<void> {
    // Create new table
    await this.executeSQL(connection, `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        theme TEXT NOT NULL DEFAULT 'light',
        notifications_enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // Add indexes
    await this.executeSQL(connection, `
      CREATE INDEX IF NOT EXISTS idx_user_preferences_customer_id 
      ON user_preferences(customer_id)
    `);
  }

  async down(connection: DatabaseConnection): Promise<void> {
    // Drop table and indexes
    await this.executeSQL(connection, 'DROP TABLE IF EXISTS user_preferences');
  }
}
```

### 3. Register Migration

Add the new migration to the `MigrationRegistry`:

```typescript
// In MigrationRegistry.ts
import { AddUserPreferencesMigration } from './003_add_user_preferences';

export class MigrationRegistry {
  private static migrations: Migration[] = [
    new InitialSchemaMigration(),
    new SampleDataMigration(),
    new AddUserPreferencesMigration(), // Add your new migration here
  ];
  // ... rest of the class
}
```

## Data Seeding

### Using the DataSeeder

```typescript
import { DataSeeder } from './migrations/DataSeeder';

// Get a database connection
const connection = await dbManager.getConnection('customers');
const seeder = new DataSeeder(connection);

// Seed a single customer with topics
const result = await seeder.seedCustomerWithTopics(
  {
    customer_name: 'John Doe',
    gov_identification_type: 'CPF',
    gov_identification_content: '12345678901',
    email: 'john@example.com',
    phone_number: '+5511999999999',
    tier: 'Premium'
  },
  [
    {
      subject: 'TypeScript Advanced Features',
      histories: [
        {
          content: 'TypeScript provides advanced type features...'
        }
      ]
    }
  ]
);

// Seed multiple customers
const customersData = [
  {
    customer_name: 'Alice',
    gov_identification_type: 'CPF',
    gov_identification_content: '11111111111',
    email: 'alice@example.com',
    phone_number: '+5511111111111',
    tier: 'Standard',
    topics: [
      {
        subject: 'React Hooks',
        histories: [
          {
            content: 'React Hooks allow you to use state...'
          }
        ]
      }
    ]
  }
];

const result = await seeder.seedMultipleCustomers(customersData);
```

### Custom Data Seeding

You can create custom data seeding by extending the `DataSeeder` class or using it directly:

```typescript
// Custom seeding function
async function seedProductionData(connection: DatabaseConnection) {
  const seeder = new DataSeeder(connection);
  
  // Seed production customers
  const productionCustomers = [
    // Your production data here
  ];
  
  const result = await seeder.seedMultipleCustomers(productionCustomers);
  console.log(`Seeded ${result.customer_ids.length} production customers`);
}
```

## Migration Best Practices

### 1. Version Numbers
- Use sequential version numbers (1, 2, 3, ...)
- Never reuse version numbers
- Keep versions small and focused

### 2. Migration Content
- Each migration should have a single purpose
- Include both `up()` and `down()` methods
- Use descriptive names and descriptions
- Test migrations thoroughly

### 3. Data Handling
- Use parameterized queries to prevent SQL injection
- Handle database-specific differences
- Include proper error handling
- Use transactions when appropriate

### 4. Rollback Safety
- Ensure `down()` methods can safely reverse `up()` operations
- Test rollbacks in development
- Consider data loss implications

## Database Support

### SQLite
- Uses TEXT for all string data
- BOOLEAN stored as INTEGER (0 or 1)
- Supports IF NOT EXISTS clauses
- File-based storage

### PostgreSQL
- Native UUID and TIMESTAMP types
- Native BOOLEAN type
- Better performance for large datasets
- Network-based storage

## Error Handling

The migration system includes comprehensive error handling:

- **Validation Errors**: Migration structure and version conflicts
- **Execution Errors**: SQL errors during migration execution
- **Rollback Errors**: Errors during migration rollback
- **Connection Errors**: Database connection issues

All errors are logged with detailed information for debugging.

## Monitoring and Maintenance

### Migration Status
```bash
npm run db:setup-v2 status
```

This command shows:
- Applied migrations with timestamps
- Pending migrations
- Migration statistics

### Database Statistics
```bash
npm run db:setup-v2 stats
```

This command shows:
- Migration status
- Data counts for each table
- Seeded data statistics

### Validation
The system automatically validates:
- Migration version uniqueness
- Migration version sequence
- Migration checksums
- Migration structure

## Troubleshooting

### Common Issues

1. **Migration Already Applied**
   - Check migration status: `npm run db:setup-v2 status`
   - Use rollback if needed: `npm run db:setup-v2 rollback <version>`

2. **Version Conflicts**
   - Ensure version numbers are sequential
   - Check for duplicate versions in MigrationRegistry

3. **Database Connection Issues**
   - Verify database configuration
   - Check database server status
   - Ensure proper permissions

4. **Migration Failures**
   - Check migration logs for specific errors
   - Verify SQL syntax for target database
   - Test migrations in development first

### Debug Mode

For detailed debugging, you can modify the migration scripts to include more verbose logging:

```typescript
// Add to migration methods
console.log(`Executing migration ${this.version}: ${this.name}`);
console.log(`SQL: ${sql}`);
```

## Integration with CI/CD

The migration system can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Setup Database
  run: npm run db:setup-v2 setup

- name: Run Tests
  run: npm test

- name: Cleanup Database
  run: npm run db:setup-v2 reset
```

## Security Considerations

- Use parameterized queries to prevent SQL injection
- Validate all input data
- Use appropriate database permissions
- Log migration activities for audit trails
- Backup database before major migrations

## Performance Considerations

- Use indexes for better query performance
- Batch operations when possible
- Consider migration timing for production
- Monitor migration execution time
- Use appropriate database-specific optimizations 