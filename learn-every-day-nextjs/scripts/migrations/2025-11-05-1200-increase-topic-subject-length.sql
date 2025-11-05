-- Migration: Increase topic subject column length
-- Date: 2025-11-05
-- Description: Changes the subject column from VARCHAR(500) to TEXT to allow longer topic subjects

-- Increase the subject column size from VARCHAR(500) to TEXT
ALTER TABLE topics 
ALTER COLUMN subject TYPE TEXT;

-- Update index if needed (PostgreSQL handles this automatically)
-- The existing index idx_topics_subject will be updated automatically

