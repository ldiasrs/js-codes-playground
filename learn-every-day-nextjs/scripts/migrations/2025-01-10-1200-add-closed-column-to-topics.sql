-- Migration: Add closed column to topics table
-- Date: 2025-01-10
-- Description: Add a boolean 'closed' column to the topics table with default value false

-- Add the closed column to the topics table
ALTER TABLE topics ADD COLUMN IF NOT EXISTS closed BOOLEAN NOT NULL DEFAULT false;

-- Create an index on the closed column for better query performance
CREATE INDEX IF NOT EXISTS idx_topics_closed ON topics(closed);

-- Update existing topics to have closed = false (in case the column already exists)
UPDATE topics SET closed = false WHERE closed IS NULL;

-- Add a comment to the column
COMMENT ON COLUMN topics.closed IS 'Indicates whether the topic is closed (true) or open (false). Closed topics cannot be reopened.'; 