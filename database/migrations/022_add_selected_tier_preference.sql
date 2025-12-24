-- Migration 022: Add selected tier preference for premium registration flow
-- This allows users to select a premium plan during registration
-- Their trial is auto-started when admin approves them

-- Add selected_tier_id column to users table
ALTER TABLE users ADD COLUMN selected_tier_id TEXT REFERENCES subscription_tiers(id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_selected_tier ON users(selected_tier_id);
