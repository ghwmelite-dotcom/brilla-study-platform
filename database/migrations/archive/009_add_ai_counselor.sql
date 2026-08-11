-- AI Student Counselor System Migration
-- Adds tables for AI-powered student counseling with conversation history, feedback, and wellbeing tracking

-- Counselor Conversations
CREATE TABLE IF NOT EXISTS counselor_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counselor_type TEXT NOT NULL CHECK (counselor_type IN ('academic', 'career', 'wellbeing', 'general')),
    title TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'flagged')),
    message_count INTEGER DEFAULT 0,
    last_message_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Counselor Messages
CREATE TABLE IF NOT EXISTS counselor_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES counselor_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'counselor', 'system')),
    content TEXT NOT NULL,
    thinking TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'concerned', 'urgent')),
    suggested_resources TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Counselor Feedback (for improving responses)
CREATE TABLE IF NOT EXISTS counselor_feedback (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES counselor_messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT CHECK (feedback_type IN ('helpful', 'not_helpful', 'inappropriate')),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Student Wellbeing Logs (daily check-ins)
CREATE TABLE IF NOT EXISTS wellbeing_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date TEXT NOT NULL,
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
    study_satisfaction INTEGER CHECK (study_satisfaction >= 1 AND study_satisfaction <= 5),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'low', 'stressed')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, log_date)
);

-- Counselor Resources (curated resources per counselor type)
CREATE TABLE IF NOT EXISTS counselor_resources (
    id TEXT PRIMARY KEY,
    counselor_type TEXT NOT NULL CHECK (counselor_type IN ('academic', 'career', 'wellbeing', 'general')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('article', 'video', 'exercise', 'tip', 'external_link')),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_counselor_conversations_user ON counselor_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_counselor_conversations_type ON counselor_conversations(counselor_type);
CREATE INDEX IF NOT EXISTS idx_counselor_conversations_status ON counselor_conversations(status);
CREATE INDEX IF NOT EXISTS idx_counselor_messages_conversation ON counselor_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_counselor_messages_role ON counselor_messages(role);
CREATE INDEX IF NOT EXISTS idx_counselor_feedback_message ON counselor_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_counselor_feedback_user ON counselor_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_logs_user ON wellbeing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_logs_date ON wellbeing_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_counselor_resources_type ON counselor_resources(counselor_type);
