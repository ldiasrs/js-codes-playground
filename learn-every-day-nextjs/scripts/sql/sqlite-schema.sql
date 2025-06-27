-- Learn Every Day - SQLite Database Schema
-- This file contains all table structures for SQLite database

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    gov_identification_type TEXT NOT NULL,
    gov_identification_content TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'Basic',
    date_created TEXT NOT NULL
);

-- =====================================================
-- TOPICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    date_created TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- =====================================================
-- TOPIC HISTORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS topic_histories (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- =====================================================
-- TASK PROCESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS task_processes (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    error_msg TEXT,
    scheduled_to TEXT,
    process_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- =====================================================
-- AUTHENTICATION ATTEMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS authentication_attempts (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    encrypted_verification_code TEXT NOT NULL,
    attempt_date TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    is_used INTEGER NOT NULL DEFAULT 0, -- SQLite stores booleans as INTEGER (0/1)
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- =====================================================
-- MIGRATIONS TABLE (for tracking applied migrations)
-- =====================================================
CREATE TABLE IF NOT EXISTS migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    checksum TEXT NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_gov_id ON customers(gov_identification_content);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);

-- Topic indexes
CREATE INDEX IF NOT EXISTS idx_topics_customer_id ON topics(customer_id);
CREATE INDEX IF NOT EXISTS idx_topics_date_created ON topics(date_created);

-- Topic history indexes
CREATE INDEX IF NOT EXISTS idx_topic_histories_topic_id ON topic_histories(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_histories_created_at ON topic_histories(created_at);

-- Task process indexes
CREATE INDEX IF NOT EXISTS idx_task_processes_customer_id ON task_processes(customer_id);
CREATE INDEX IF NOT EXISTS idx_task_processes_status ON task_processes(status);
CREATE INDEX IF NOT EXISTS idx_task_processes_scheduled_to ON task_processes(scheduled_to);

-- Authentication attempt indexes
CREATE INDEX IF NOT EXISTS idx_auth_attempts_customer_id ON authentication_attempts(customer_id);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_expires_at ON authentication_attempts(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_is_used ON authentication_attempts(is_used);

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment the following lines to insert sample data for testing

/*
-- Sample customer
INSERT OR REPLACE INTO customers (
    id, 
    customer_name, 
    gov_identification_type, 
    gov_identification_content, 
    email, 
    phone_number, 
    tier, 
    date_created
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'John Doe',
    'CPF',
    '12345678901',
    'john.doe@example.com',
    '+5511999999999',
    'Basic',
    '2024-01-01T00:00:00.000Z'
);

-- Sample topic
INSERT OR REPLACE INTO topics (
    id,
    customer_id,
    subject,
    date_created
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript Fundamentals',
    '2024-01-01T00:00:00.000Z'
);
*/ 