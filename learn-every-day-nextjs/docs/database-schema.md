# Database Schema Documentation

This document describes the complete database schema for the Learn Every Day application.

## Overview

The application uses a relational database design with the following core entities:
- **Customers** - User accounts and authentication
- **Topics** - Learning subjects for each customer
- **Topic Histories** - Generated content for topics
- **Task Processes** - Background task management
- **Authentication Attempts** - Verification code management

## Database Tables

### 1. customers

Stores customer information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique customer identifier (UUID) |
| customer_name | TEXT | NOT NULL | Full name of the customer |
| gov_identification_type | TEXT | NOT NULL | Type of government ID (e.g., "CPF", "SSN") |
| gov_identification_content | TEXT | NOT NULL | Government identification number |
| email | TEXT | NOT NULL | Customer's email address |
| phone_number | TEXT | NOT NULL | Customer's phone number |
| date_created | TEXT | NOT NULL | ISO timestamp of account creation |

**Indexes:**
- `idx_customers_email` - For email-based lookups
- `idx_customers_gov_id` - For government ID lookups

### 2. topics

Stores learning topics associated with customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique topic identifier (UUID) |
| customer_id | TEXT | NOT NULL, FOREIGN KEY | Reference to customers.id |
| subject | TEXT | NOT NULL | Topic subject/title |
| date_created | TEXT | NOT NULL | ISO timestamp of topic creation |

**Indexes:**
- `idx_topics_customer_id` - For customer-specific topic queries
- `idx_topics_date_created` - For date-based topic queries

### 3. topic_histories

Stores generated content for topics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique history identifier (UUID) |
| topic_id | TEXT | NOT NULL, FOREIGN KEY | Reference to topics.id |
| content | TEXT | NOT NULL | Generated content for the topic |
| created_at | TEXT | NOT NULL | ISO timestamp of content generation |

**Indexes:**
- `idx_topic_histories_topic_id` - For topic-specific history queries
- `idx_topic_histories_created_at` - For date-based history queries

### 4. task_processes

Manages background tasks and scheduled operations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique task identifier (UUID) |
| entity_id | TEXT | NOT NULL | ID of the entity being processed |
| customer_id | TEXT | NOT NULL, FOREIGN KEY | Reference to customers.id |
| type | TEXT | NOT NULL | Type of task (e.g., "generate_topic_history") |
| status | TEXT | NOT NULL | Task status (e.g., "pending", "running", "completed", "failed") |
| error_msg | TEXT | NULL | Error message if task failed |
| scheduled_to | TEXT | NULL | ISO timestamp when task should be executed |
| process_at | TEXT | NULL | ISO timestamp when task was actually processed |
| created_at | TEXT | NOT NULL | ISO timestamp of task creation |

**Indexes:**
- `idx_task_processes_customer_id` - For customer-specific task queries
- `idx_task_processes_status` - For status-based task queries
- `idx_task_processes_scheduled_to` - For scheduled task queries

### 5. authentication_attempts

Manages verification codes for customer authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique attempt identifier (UUID) |
| customer_id | TEXT | NOT NULL, FOREIGN KEY | Reference to customers.id |
| encrypted_verification_code | TEXT | NOT NULL | Encrypted verification code |
| attempt_date | TEXT | NOT NULL | ISO timestamp of authentication attempt |
| expires_at | TEXT | NOT NULL | ISO timestamp when code expires |
| is_used | BOOLEAN | NOT NULL, DEFAULT 0 | Whether the code has been used |

**Indexes:**
- `idx_auth_attempts_customer_id` - For customer-specific auth queries
- `idx_auth_attempts_expires_at` - For expiration-based queries
- `idx_auth_attempts_is_used` - For usage status queries

## Foreign Key Relationships

```
customers (1) ←→ (N) topics
customers (1) ←→ (N) task_processes
customers (1) ←→ (N) authentication_attempts
topics (1) ←→ (N) topic_histories
```

## Data Types

### SQLite Implementation
- **TEXT**: Used for all string data, UUIDs, and timestamps
- **BOOLEAN**: Stored as INTEGER (0 or 1) in SQLite
- **PRIMARY KEY**: TEXT with UUID values
- **FOREIGN KEY**: TEXT referencing other table UUIDs

### PostgreSQL Implementation
- **TEXT**: Used for string data and UUIDs
- **TIMESTAMP**: Used for date/time fields
- **BOOLEAN**: Native boolean type
- **UUID**: Native UUID type for primary keys
- **FOREIGN KEY**: UUID references

## Security Considerations

### Encryption
- Verification codes in `authentication_attempts` are encrypted using AES-256-GCM
- Encryption key is configured in the application settings

### Data Validation
- Email addresses are validated for format
- Government IDs are validated according to type
- Phone numbers are validated for format
- UUIDs are generated using cryptographically secure methods

### Access Control
- Database connections use parameterized queries to prevent SQL injection
- All user inputs are validated before database operations
- Authentication attempts have expiration times to prevent abuse

## Performance Considerations

### Indexes
- All foreign key columns are indexed
- Frequently queried columns (email, status, dates) are indexed
- Composite indexes are used where appropriate

### Query Optimization
- Pagination is implemented for large result sets
- Date range queries use indexed timestamp columns
- Customer-specific queries use indexed customer_id columns

## Backup and Recovery

### SQLite
- Database file can be backed up directly
- WAL mode provides transaction safety
- Regular backups recommended for production

### PostgreSQL
- Use pg_dump for logical backups
- Point-in-time recovery available
- Automated backup scripts recommended

## Migration Strategy

### Schema Changes
- Use `CREATE TABLE IF NOT EXISTS` for new tables
- Add new columns with `ALTER TABLE ADD COLUMN`
- Use migration scripts for complex changes

### Data Migration
- Export data before major schema changes
- Test migrations on staging environment
- Maintain backward compatibility where possible

## Monitoring and Maintenance

### Regular Tasks
- Monitor database size and growth
- Check index usage and performance
- Clean up expired authentication attempts
- Archive old topic histories if needed

### Health Checks
- Verify foreign key constraints
- Check for orphaned records
- Monitor query performance
- Validate data integrity 