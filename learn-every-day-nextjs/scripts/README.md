# Database Setup Scripts

This directory contains scripts for managing the Learn Every Day application database.

## Database Setup Script

The `setup-database.ts` script provides a comprehensive solution for initializing and managing the database structure.

### Features

- **Multi-database support**: Works with both SQLite and PostgreSQL
- **Complete table creation**: Creates all necessary tables with proper schemas
- **Index optimization**: Creates performance indexes for better query performance
- **Structure verification**: Verifies that all tables are created correctly
- **Reset functionality**: Allows complete database reset for testing

### Database Tables

The script creates the following tables:

1. **customers** - Customer information and authentication data
2. **topics** - Learning topics associated with customers
3. **topic_histories** - Generated content for topics
4. **task_processes** - Background task management
5. **authentication_attempts** - Authentication verification codes

### Usage

#### Setup Database (Normal Operation)

```bash
npm run db:setup
```

This command will:
- Read the database configuration from `config/global-config.local.json`
- Create the data directory if using SQLite
- Create all database tables with proper schemas
- Create performance indexes
- Verify the database structure

#### Reset Database (Testing/Development)

```bash
npm run db:reset
```

This command will:
- Drop all existing tables (in the correct order to respect foreign key constraints)
- Reset the database manager instances
- Useful for testing or development scenarios

### Configuration

The script uses the same configuration as the main application:

- **SQLite**: Configured in `config/global-config.local.json` under `database.sqlite`
- **PostgreSQL**: Configured in `config/global-config.local.json` under `database.postgres`

### Example Configuration

```json
{
  "database": {
    "type": "sqlite",
    "sqlite": {
      "database": "learneveryday.db",
      "dataDir": "./data/local"
    }
  }
}
```

### Direct Script Execution

You can also run the script directly:

```bash
# Setup
ts-node scripts/setup-database.ts

# Reset
ts-node scripts/setup-database.ts reset
```

### Error Handling

The script provides detailed error reporting and will:
- Show which tables were successfully created
- Report any failures with specific error messages
- Provide setup details for troubleshooting
- Exit with appropriate status codes (0 for success, 1 for failure)

### Performance Indexes

The script creates the following indexes for optimal performance:

#### Customer Indexes
- `idx_customers_email` - For email-based lookups
- `idx_customers_gov_id` - For government ID lookups

#### Topic Indexes
- `idx_topics_customer_id` - For customer-specific topic queries
- `idx_topics_date_created` - For date-based topic queries

#### Topic History Indexes
- `idx_topic_histories_topic_id` - For topic-specific history queries
- `idx_topic_histories_created_at` - For date-based history queries

#### Task Process Indexes
- `idx_task_processes_customer_id` - For customer-specific task queries
- `idx_task_processes_status` - For status-based task queries
- `idx_task_processes_scheduled_to` - For scheduled task queries

#### Authentication Attempt Indexes
- `idx_auth_attempts_customer_id` - For customer-specific auth queries
- `idx_auth_attempts_expires_at` - For expiration-based queries
- `idx_auth_attempts_is_used` - For usage status queries

### Troubleshooting

#### Common Issues

1. **Permission Errors**: Ensure the script has write permissions to the data directory
2. **Configuration Errors**: Verify the `config/global-config.local.json` file is valid JSON
3. **Database Connection Errors**: Check database credentials and network connectivity
4. **Table Already Exists**: The script uses `CREATE TABLE IF NOT EXISTS`, so this is not an error

#### Logs

The script provides detailed console output including:
- Setup progress indicators
- Success/failure messages for each step
- Detailed error messages
- Configuration information

### Development Notes

- The script is designed to be idempotent - running it multiple times is safe
- It respects foreign key constraints when creating/dropping tables
- It properly closes database connections to prevent resource leaks
- It resets singleton instances to ensure clean state management 