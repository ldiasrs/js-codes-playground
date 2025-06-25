# Database Setup Guide

This project supports both SQLite (for local development) and PostgreSQL (for production) databases.

## Local Development (SQLite)

SQLite is used by default for local development and testing. No additional setup is required.

### Configuration

The application will automatically:
1. Create a `./data/local` directory if it doesn't exist
2. Create a `learneveryday.db` SQLite database file
3. Initialize all required tables

### Environment Variables (Optional)

You can override the default SQLite configuration using environment variables:

```bash
DATABASE_TYPE=sqlite
SQLITE_DATA_DIR=./data/local
SQLITE_DATABASE=learneveryday.db
```

## Production (PostgreSQL)

For production environments, PostgreSQL is recommended for better performance and scalability.

### Prerequisites

1. Install PostgreSQL on your server
2. Create a database for the application
3. Create a user with appropriate permissions

### Configuration

#### Option 1: Environment Variables

Set the following environment variables:

```bash
DATABASE_TYPE=postgres
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_DATABASE=learneveryday
POSTGRES_USERNAME=your-username
POSTGRES_PASSWORD=your-password
POSTGRES_SSL=true  # Set to true for cloud databases
```

#### Option 2: Configuration File

Create a `config/global-config.prod.json` file:

```json
{
  "database": {
    "type": "postgres",
    "postgres": {
      "host": "your-postgres-host",
      "port": 5432,
      "database": "learneveryday",
      "username": "your-username",
      "password": "your-password",
      "ssl": true
    }
  }
}
```

### Database Schema

The application automatically creates the following tables:

#### customers
- `id` (TEXT PRIMARY KEY)
- `customer_name` (TEXT NOT NULL)
- `gov_identification_type` (TEXT NOT NULL)
- `gov_identification_content` (TEXT NOT NULL)
- `email` (TEXT NOT NULL)
- `phone_number` (TEXT NOT NULL)
- `date_created` (TEXT NOT NULL)

#### topics
- `id` (TEXT PRIMARY KEY)
- `customer_id` (TEXT NOT NULL)
- `subject` (TEXT NOT NULL)
- `date_created` (TEXT NOT NULL)
- Foreign Key: `customer_id` references `customers(id)`

#### topic_histories
- `id` (TEXT PRIMARY KEY)
- `topic_id` (TEXT NOT NULL)
- `content` (TEXT NOT NULL)
- `created_at` (TEXT NOT NULL)
- Foreign Key: `topic_id` references `topics(id)`

#### task_processes
- `id` (TEXT PRIMARY KEY)
- `entity_id` (TEXT NOT NULL)
- `customer_id` (TEXT NOT NULL)
- `type` (TEXT NOT NULL)
- `status` (TEXT NOT NULL)
- `error_msg` (TEXT)
- `scheduled_to` (TEXT)
- `process_at` (TEXT)
- `created_at` (TEXT NOT NULL)
- Foreign Key: `customer_id` references `customers(id)`

## Testing

### Local Testing

For local tests, the application will use SQLite by default. You can run tests without any additional database setup.

### Integration Testing

For integration tests that require a specific database:

1. Set the appropriate environment variables
2. Ensure the database is accessible
3. Run your test suite

## Migration from NeDB

If you're migrating from the previous NeDB implementation:

1. Export your data from NeDB
2. Set up the new database (SQLite or PostgreSQL)
3. Import your data into the new schema
4. Update your application configuration

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the application has write permissions to the data directory
2. **Connection Refused**: Check PostgreSQL connection settings and firewall rules
3. **SSL Issues**: For cloud databases, ensure SSL is properly configured

### Logs

Check the application logs for database-related errors. The logger will provide detailed information about connection issues and query failures.

## Performance Considerations

### SQLite
- Suitable for small to medium applications
- File-based, no network overhead
- Limited concurrent connections
- Good for development and testing

### PostgreSQL
- Suitable for production applications
- Better performance with large datasets
- Supports concurrent connections
- Advanced features like indexing and optimization
- Recommended for production environments 