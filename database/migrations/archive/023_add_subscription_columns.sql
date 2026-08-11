-- Migration: 023_add_subscription_columns.sql
-- Description: Add missing subscription columns to users table
-- Date: 2024-12-24

-- Add subscription tier and expiry columns to users table
ALTER TABLE users ADD COLUMN subscription_tier_id TEXT;
ALTER TABLE users ADD COLUMN subscription_expires_at TEXT;

-- Update existing users to have free tier
UPDATE users SET subscription_tier_id = 'tier_free' WHERE subscription_tier_id IS NULL;
