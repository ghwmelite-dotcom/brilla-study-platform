-- Migration: Add user verification and management fields
-- Run this migration to add email verification and admin management capabilities

-- Add new columns to users table for email verification and management
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_token TEXT;
ALTER TABLE users ADD COLUMN verification_token_expires_at TEXT;
ALTER TABLE users ADD COLUMN password_reset_token TEXT;
ALTER TABLE users ADD COLUMN password_reset_expires_at TEXT;
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN last_login_at TEXT;
ALTER TABLE users ADD COLUMN created_by TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN approved_by TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN approved_at TEXT;
ALTER TABLE users ADD COLUMN rejection_reason TEXT;

-- Additional fields for teachers
ALTER TABLE users ADD COLUMN school_name TEXT;
ALTER TABLE users ADD COLUMN school_level TEXT CHECK (school_level IN ('jhs', 'shs'));
ALTER TABLE users ADD COLUMN teacher_license_number TEXT;
ALTER TABLE users ADD COLUMN subjects_taught TEXT; -- JSON array
ALTER TABLE users ADD COLUMN years_experience TEXT;
ALTER TABLE users ADD COLUMN qualifications TEXT;

-- Create index for verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Update existing users to be approved and verified (for migration)
UPDATE users SET status = 'approved', email_verified = 1 WHERE status IS NULL;
