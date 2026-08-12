-- Migration: Add AI Tutor System
-- Description: Tables for AI-powered tutoring with conversation history and feedback

-- Tutor conversations table
CREATE TABLE IF NOT EXISTS tutor_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    context TEXT, -- 'general', 'question_help', 'topic_study', 'exam_prep'
    exam_type TEXT, -- 'nsmq', 'wassce', 'bece'
    subject_id TEXT,
    topic_id TEXT,
    title TEXT,
    is_archived INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Tutor messages table
CREATE TABLE IF NOT EXISTS tutor_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'chat', -- 'chat', 'explanation', 'hint', 'step_by_step'
    question_id TEXT, -- Reference to question being discussed
    hint_level INTEGER, -- 1, 2, or 3 for progressive hints
    tokens_used INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES tutor_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Tutor feedback table
CREATE TABLE IF NOT EXISTS tutor_feedback (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT, -- 'helpful', 'not_helpful', 'incorrect', 'confusing', 'too_long', 'too_short'
    feedback_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (message_id) REFERENCES tutor_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tutor usage statistics
CREATE TABLE IF NOT EXISTS tutor_usage_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    messages_sent INTEGER DEFAULT 0,
    explanations_requested INTEGER DEFAULT 0,
    hints_requested INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_user ON tutor_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_context ON tutor_conversations(context);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_subject ON tutor_conversations(subject_id);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_conversation ON tutor_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_question ON tutor_messages(question_id);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_created ON tutor_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_tutor_feedback_message ON tutor_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_tutor_feedback_user ON tutor_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_usage_user_date ON tutor_usage_stats(user_id, date);
