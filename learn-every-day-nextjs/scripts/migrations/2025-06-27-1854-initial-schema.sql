-- Learn Every Day - PostgreSQL Database Schema
-- This file contains all table structures for PostgreSQL database

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    gov_identification_type VARCHAR(50) NOT NULL,
    gov_identification_content VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'Basic',
    date_created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TOPICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    subject VARCHAR(500) NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- =====================================================
-- TOPIC HISTORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS topic_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- =====================================================
-- TASK PROCESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS task_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_msg TEXT,
    scheduled_to TIMESTAMP WITH TIME ZONE,
    process_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- =====================================================
-- AUTHENTICATION ATTEMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS authentication_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    encrypted_verification_code TEXT NOT NULL,
    attempt_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- =====================================================
-- MIGRATIONS TABLE (for tracking applied migrations)
-- =====================================================
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    date_executed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_gov_id ON customers(gov_identification_content);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);
CREATE INDEX IF NOT EXISTS idx_customers_date_created ON customers(date_created);

-- Topic indexes
CREATE INDEX IF NOT EXISTS idx_topics_customer_id ON topics(customer_id);
CREATE INDEX IF NOT EXISTS idx_topics_date_created ON topics(date_created);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject);

-- Topic history indexes
CREATE INDEX IF NOT EXISTS idx_topic_histories_topic_id ON topic_histories(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_histories_created_at ON topic_histories(created_at);

-- Task process indexes
CREATE INDEX IF NOT EXISTS idx_task_processes_customer_id ON task_processes(customer_id);
CREATE INDEX IF NOT EXISTS idx_task_processes_status ON task_processes(status);
CREATE INDEX IF NOT EXISTS idx_task_processes_scheduled_to ON task_processes(scheduled_to);
CREATE INDEX IF NOT EXISTS idx_task_processes_type ON task_processes(type);
CREATE INDEX IF NOT EXISTS idx_task_processes_created_at ON task_processes(created_at);

-- Authentication attempt indexes
CREATE INDEX IF NOT EXISTS idx_auth_attempts_customer_id ON authentication_attempts(customer_id);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_expires_at ON authentication_attempts(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_is_used ON authentication_attempts(is_used);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_attempt_date ON authentication_attempts(attempt_date);


-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment the following lines to insert sample data for testing

/*
-- Sample customer
INSERT INTO customers (
    id, 
    customer_name, 
    gov_identification_type, 
    gov_identification_content, 
    email, 
    phone_number, 
    tier, 
    date_created
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'John Doe',
    'CPF',
    '12345678901',
    'john.doe@example.com',
    '+5511999999999',
    'Basic',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Sample topic
INSERT INTO topics (
    id,
    customer_id,
    subject,
    date_created
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'JavaScript Fundamentals',
    NOW()
) ON CONFLICT (id) DO NOTHING;
*/ 