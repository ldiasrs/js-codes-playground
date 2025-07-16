-- Learn Every Day - Add Logs Table Migration
-- This migration adds the logs table for database logging functionality

-- =====================================================
-- LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    context TEXT NOT NULL DEFAULT '{}',
    error_message TEXT,
    error_stack TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary access patterns indexes
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_level_timestamp ON logs(level, timestamp);

-- Error tracking indexes
CREATE INDEX IF NOT EXISTS idx_logs_error_message ON logs(error_message) WHERE error_message IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_has_error ON logs((CASE WHEN error_message IS NOT NULL THEN true ELSE false END));

-- Search and filtering indexes
CREATE INDEX IF NOT EXISTS idx_logs_message_search ON logs USING gin (to_tsvector('english', message));
CREATE INDEX IF NOT EXISTS idx_logs_timestamp_desc ON logs(timestamp DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_logs_level_timestamp_desc ON logs(level, timestamp DESC);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE logs IS 'Application logs stored in the database for monitoring and debugging';
COMMENT ON COLUMN logs.id IS 'Unique identifier for the log entry';
COMMENT ON COLUMN logs.level IS 'Log level (debug, info, warn, error)';
COMMENT ON COLUMN logs.message IS 'The log message content';
COMMENT ON COLUMN logs.context IS 'JSON context data associated with the log entry';
COMMENT ON COLUMN logs.error_message IS 'Error message if this is an error log';
COMMENT ON COLUMN logs.error_stack IS 'Stack trace if this is an error log';
COMMENT ON COLUMN logs.timestamp IS 'When the log entry was created';

-- =====================================================
-- RECORD MIGRATION EXECUTION
-- =====================================================

INSERT INTO migrations (filename, date_executed)
VALUES ('2025-01-27-1630-add-logs-table.sql', NOW())
ON CONFLICT (filename) DO NOTHING; 