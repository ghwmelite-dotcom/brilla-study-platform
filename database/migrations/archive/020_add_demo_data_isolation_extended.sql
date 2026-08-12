-- Migration: Add Demo Data Isolation (Extended Tables)
-- Description: Adds is_demo_data/expires_at columns to additional user-generated data tables
-- Purpose: Extends demo data isolation to chat, counselor, tutor, and other feature tables
-- Note: Run this after 019_add_demo_data_isolation.sql

-- =============================================
-- CHAT SYSTEM TABLES
-- =============================================

-- Chat Messages
ALTER TABLE chat_messages ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_chat_messages_demo ON chat_messages(is_demo_data, expires_at);

-- Chat Message Reactions
ALTER TABLE chat_message_reactions ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE chat_message_reactions ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_chat_message_reactions_demo ON chat_message_reactions(is_demo_data, expires_at);

-- =============================================
-- COUNSELOR SYSTEM TABLES
-- =============================================

-- Counselor Conversations
ALTER TABLE counselor_conversations ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE counselor_conversations ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_counselor_conversations_demo ON counselor_conversations(is_demo_data, expires_at);

-- Counselor Messages
ALTER TABLE counselor_messages ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE counselor_messages ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_counselor_messages_demo ON counselor_messages(is_demo_data, expires_at);

-- Wellbeing Logs
ALTER TABLE wellbeing_logs ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE wellbeing_logs ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_wellbeing_logs_demo ON wellbeing_logs(is_demo_data, expires_at);

-- Wellbeing Alerts
ALTER TABLE wellbeing_alerts ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE wellbeing_alerts ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_wellbeing_alerts_demo ON wellbeing_alerts(is_demo_data, expires_at);

-- Counselor Feedback
ALTER TABLE counselor_feedback ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE counselor_feedback ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_counselor_feedback_demo ON counselor_feedback(is_demo_data, expires_at);

-- =============================================
-- AI TUTOR SYSTEM TABLES
-- =============================================

-- Tutor Conversations
ALTER TABLE tutor_conversations ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE tutor_conversations ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_demo ON tutor_conversations(is_demo_data, expires_at);

-- Tutor Messages
ALTER TABLE tutor_messages ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE tutor_messages ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_tutor_messages_demo ON tutor_messages(is_demo_data, expires_at);

-- Tutor Feedback
ALTER TABLE tutor_feedback ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE tutor_feedback ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_tutor_feedback_demo ON tutor_feedback(is_demo_data, expires_at);

-- =============================================
-- ASSESSMENT SYSTEM TABLES
-- =============================================

-- Assessment Attempts
ALTER TABLE assessment_attempts ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE assessment_attempts ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_demo ON assessment_attempts(is_demo_data, expires_at);

-- Assessment Attempt Answers
ALTER TABLE assessment_attempt_answers ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE assessment_attempt_answers ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_assessment_attempt_answers_demo ON assessment_attempt_answers(is_demo_data, expires_at);

-- =============================================
-- PARENT SYSTEM TABLES
-- =============================================

-- Parent Notifications
ALTER TABLE parent_notifications ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE parent_notifications ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_parent_notifications_demo ON parent_notifications(is_demo_data, expires_at);

-- Parent Activity Log
ALTER TABLE parent_activity_log ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE parent_activity_log ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_parent_activity_log_demo ON parent_activity_log(is_demo_data, expires_at);

-- =============================================
-- OTHER TABLES
-- =============================================

-- Library Resources
ALTER TABLE library_resources ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE library_resources ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_library_resources_demo ON library_resources(is_demo_data, expires_at);

-- Notifications
ALTER TABLE notifications ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_notifications_demo ON notifications(is_demo_data, expires_at);

-- Paper Attempts
ALTER TABLE paper_attempts ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE paper_attempts ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_paper_attempts_demo ON paper_attempts(is_demo_data, expires_at);

-- Paper Attempt Answers
ALTER TABLE paper_attempt_answers ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE paper_attempt_answers ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_paper_attempt_answers_demo ON paper_attempt_answers(is_demo_data, expires_at);

-- Essay Attempts
ALTER TABLE essay_attempts ADD COLUMN is_demo_data INTEGER DEFAULT 0;
ALTER TABLE essay_attempts ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_essay_attempts_demo ON essay_attempts(is_demo_data, expires_at);
