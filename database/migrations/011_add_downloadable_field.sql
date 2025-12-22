-- Migration 011: Add isDownloadable field to library_resources
-- This allows content creators to control whether resources can be downloaded

-- Add is_downloadable column with default value of 1 (true/downloadable)
ALTER TABLE library_resources ADD COLUMN is_downloadable INTEGER DEFAULT 1;
