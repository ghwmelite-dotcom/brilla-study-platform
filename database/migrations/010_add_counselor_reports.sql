-- Migration: 010_add_counselor_reports
-- Description: Add counselor reports system for parent/guardian access
-- Created: 2024

-- =============================================
-- COUNSELOR REPORTS (Comprehensive Student Reports)
-- =============================================

-- Student Counselor Reports (generated periodically or on-demand)
CREATE TABLE IF NOT EXISTS counselor_reports (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_by TEXT NOT NULL CHECK (generated_by IN ('system', 'counselor', 'parent_request')),
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'semester', 'custom', 'concern')),
    report_period_start TEXT NOT NULL,
    report_period_end TEXT NOT NULL,

    -- Overall Summary
    summary TEXT NOT NULL,
    key_insights TEXT, -- JSON array of key insights

    -- Academic Section
    academic_summary TEXT,
    academic_strengths TEXT, -- JSON array
    academic_challenges TEXT, -- JSON array
    study_patterns TEXT, -- JSON object with study time, peak hours, consistency
    subject_performance TEXT, -- JSON object with per-subject analysis

    -- Wellbeing Section
    wellbeing_summary TEXT,
    mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining', 'fluctuating')),
    stress_indicators TEXT, -- JSON array of observed stress patterns
    wellbeing_score INTEGER CHECK (wellbeing_score >= 1 AND wellbeing_score <= 100),

    -- Engagement Section
    engagement_summary TEXT,
    platform_usage_hours REAL,
    counselor_sessions_count INTEGER DEFAULT 0,
    topics_discussed TEXT, -- JSON array

    -- Goals & Progress
    goals_set TEXT, -- JSON array of goals
    goals_achieved TEXT, -- JSON array of achieved goals
    goals_in_progress TEXT, -- JSON array

    -- Recommendations
    recommendations TEXT, -- JSON array of actionable recommendations
    parent_action_items TEXT, -- JSON array of things parents can do
    follow_up_needed INTEGER DEFAULT 0,
    follow_up_reason TEXT,

    -- Flags and Concerns
    concern_level TEXT DEFAULT 'none' CHECK (concern_level IN ('none', 'low', 'medium', 'high', 'urgent')),
    concern_areas TEXT, -- JSON array of concern areas
    professional_referral_suggested INTEGER DEFAULT 0,
    referral_type TEXT, -- e.g., 'academic_support', 'counseling', 'medical'

    -- Metadata
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_read_by_parent INTEGER DEFAULT 0,
    read_at TEXT,
    parent_feedback TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Parent Report Access Log
CREATE TABLE IF NOT EXISTS report_access_logs (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES counselor_reports(id) ON DELETE CASCADE,
    accessed_by TEXT NOT NULL REFERENCES users(id),
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'share')),
    accessed_at TEXT DEFAULT (datetime('now'))
);

-- Parent-Counselor Communication Thread
CREATE TABLE IF NOT EXISTS parent_counselor_messages (
    id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES counselor_reports(id) ON DELETE SET NULL,
    parent_id TEXT NOT NULL REFERENCES users(id),
    student_id TEXT NOT NULL REFERENCES users(id),
    sender_role TEXT NOT NULL CHECK (sender_role IN ('parent', 'counselor_ai', 'admin')),
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    read_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Report Scheduling (for automated report generation)
CREATE TABLE IF NOT EXISTS report_schedules (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id TEXT NOT NULL REFERENCES users(id),
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'semester')),
    is_active INTEGER DEFAULT 1,
    last_generated_at TEXT,
    next_generation_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Student-Parent Linking (for parent portal access)
CREATE TABLE IF NOT EXISTS student_parent_links (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent' CHECK (relationship IN ('parent', 'guardian', 'other')),
    is_primary INTEGER DEFAULT 0,
    notification_preferences TEXT DEFAULT '{"email": true, "inApp": true, "reports": true}',
    is_verified INTEGER DEFAULT 0,
    verified_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(student_id, parent_id)
);

-- Counselor Session Summaries (for report generation)
CREATE TABLE IF NOT EXISTS counselor_session_summaries (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES counselor_conversations(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id),
    session_date TEXT NOT NULL,
    duration_minutes INTEGER,

    -- AI-generated summary
    brief_summary TEXT NOT NULL,
    main_topics TEXT, -- JSON array
    emotional_state TEXT CHECK (emotional_state IN ('positive', 'neutral', 'stressed', 'anxious', 'sad', 'angry', 'mixed')),
    key_concerns TEXT, -- JSON array
    breakthroughs TEXT, -- JSON array of positive developments

    -- Action items
    student_action_items TEXT, -- JSON array
    recommended_resources TEXT, -- JSON array

    -- Flags
    requires_attention INTEGER DEFAULT 0,
    attention_reason TEXT,

    created_at TEXT DEFAULT (datetime('now'))
);

-- Wellbeing Alerts (for urgent notifications to parents)
CREATE TABLE IF NOT EXISTS wellbeing_alerts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('stress', 'mood_decline', 'inactivity', 'concerning_content', 'academic_struggle')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
    description TEXT NOT NULL,
    triggered_by TEXT, -- What triggered the alert (e.g., 'conversation_analysis', 'wellbeing_log', 'pattern_detection')
    source_id TEXT, -- Reference to the source (conversation_id, wellbeing_log_id, etc.)

    -- Notification status
    parent_notified INTEGER DEFAULT 0,
    notified_at TEXT,
    notification_method TEXT, -- 'email', 'in_app', 'both'

    -- Resolution
    is_resolved INTEGER DEFAULT 0,
    resolved_at TEXT,
    resolution_notes TEXT,
    resolved_by TEXT REFERENCES users(id),

    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_counselor_reports_student ON counselor_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_counselor_reports_status ON counselor_reports(status);
CREATE INDEX IF NOT EXISTS idx_counselor_reports_period ON counselor_reports(report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_report_access_logs_report ON report_access_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_parent_counselor_messages_parent ON parent_counselor_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_counselor_messages_student ON parent_counselor_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parent_links_student ON student_parent_links(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parent_links_parent ON student_parent_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_counselor_session_summaries_student ON counselor_session_summaries(student_id);
CREATE INDEX IF NOT EXISTS idx_counselor_session_summaries_date ON counselor_session_summaries(session_date);
CREATE INDEX IF NOT EXISTS idx_wellbeing_alerts_student ON wellbeing_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_alerts_unresolved ON wellbeing_alerts(is_resolved, severity);
