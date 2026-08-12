-- PROD-ONLY patch (2026-08-12): create the 14 tables that never applied on prod
-- (legacy migration chain partially failed). Extracted verbatim from the canonical
-- schema.sql. IF NOT EXISTS makes re-runs safe. questions_new (scratch) excluded.

CREATE TABLE IF NOT EXISTS ai_classroom_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  revision_session_id TEXT REFERENCES revision_sessions(id) ON DELETE CASCADE,

  -- Student info
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT,
  student_avatar_url TEXT,

  -- Session context
  subject_id TEXT REFERENCES subjects(id),
  subject_name TEXT,
  topic_id TEXT REFERENCES topics(id),
  topic_name TEXT,
  exam_type TEXT,

  -- Current teaching state (synced from revision classroom)
  current_phase TEXT DEFAULT 'hook', -- hook, explain, check, practice, confirm, connect
  current_lesson_id TEXT,
  lesson_title TEXT,
  lesson_progress_percent INTEGER DEFAULT 0,

  -- Struggle detection signals
  struggle_score REAL DEFAULT 0, -- 0-100, computed from signals below
  consecutive_wrong_answers INTEGER DEFAULT 0,
  time_stuck_seconds INTEGER DEFAULT 0,
  repeated_questions_count INTEGER DEFAULT 0,
  clarification_requests_count INTEGER DEFAULT 0,
  last_activity_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Handoff state
  handoff_status TEXT DEFAULT 'none', -- none, suggested, requested, pending, connected, declined
  handoff_reason TEXT,
  handoff_suggested_at TEXT,
  handoff_requested_at TEXT,

  -- Connected tutor (if any)
  tutor_id TEXT REFERENCES users(id),
  tutor_name TEXT,
  tutor_avatar_url TEXT,
  tutor_joined_at TEXT,
  tutor_mode TEXT DEFAULT 'observe', -- observe, co_teach, takeover

  -- Session state
  is_active INTEGER DEFAULT 1,
  visibility TEXT DEFAULT 'public', -- public (visible to tutors), private

  -- AI conversation context (for tutor reference)
  ai_messages_summary TEXT, -- Brief summary of AI conversation
  last_ai_message TEXT,
  last_student_response TEXT,

  -- Whiteboard state reference
  whiteboard_state TEXT, -- JSON serialized Fabric.js state

  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_grading_limits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    usage_count INTEGER DEFAULT 0,
    limit_count INTEGER NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, period_start, period_type)
);

CREATE TABLE IF NOT EXISTS chat_rate_limits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id TEXT REFERENCES chat_rooms(id) ON DELETE CASCADE,
    message_count INTEGER DEFAULT 0,
    window_start TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, room_id)
);

CREATE TABLE IF NOT EXISTS chat_student_moderators (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    assigned_by TEXT NOT NULL REFERENCES users(id),
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, room_id)
);

CREATE TABLE IF NOT EXISTS chat_teacher_assignments (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    assigned_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(teacher_id, subject_id)
);

CREATE TABLE IF NOT EXISTS essay_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    paper_attempt_id TEXT REFERENCES paper_attempts(id) ON DELETE SET NULL,
    answer_text TEXT NOT NULL,
    word_count INTEGER,
    time_taken INTEGER,
    grading_type TEXT CHECK (grading_type IN ('ai', 'manual', 'self', 'peer')),
    grading_status TEXT DEFAULT 'pending' CHECK (grading_status IN ('pending', 'grading', 'completed', 'failed')),
    ai_score INTEGER,
    ai_feedback TEXT,
    ai_criteria_scores TEXT,
    ai_graded_at TEXT,
    ai_model_used TEXT,
    ai_confidence REAL,
    manual_score INTEGER,
    manual_feedback TEXT,
    graded_by TEXT REFERENCES users(id),
    manually_graded_at TEXT,
    final_score INTEGER,
    marks_earned REAL,
    is_premium_graded INTEGER DEFAULT 0,
    flagged_for_review INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    is_demo_data INTEGER DEFAULT 0,
    -- added by migrations/020_add_demo_data_isolation_extended.sql
    expires_at TEXT
);

CREATE TABLE IF NOT EXISTS essay_questions (
    id TEXT PRIMARY KEY,
    question_id TEXT UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    word_limit_min INTEGER,
    word_limit_max INTEGER,
    requires_introduction INTEGER DEFAULT 1,
    requires_conclusion INTEGER DEFAULT 1,
    marking_scheme TEXT NOT NULL,
    model_answer TEXT,
    marking_rubric TEXT,
    required_points TEXT,
    optional_points TEXT,
    ai_grading_enabled INTEGER DEFAULT 0,
    sample_answer_excellent TEXT,
    sample_answer_good TEXT,
    sample_answer_poor TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scheduled_classroom_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Link to tutoring marketplace session (optional, extends it)
  tutoring_session_id TEXT REFERENCES tutoring_sessions(id) ON DELETE SET NULL,

  -- Participants
  tutor_id TEXT NOT NULL REFERENCES users(id),
  student_id TEXT NOT NULL REFERENCES users(id),

  -- Session details
  subject_id TEXT REFERENCES subjects(id),
  subject_name TEXT,
  topic_id TEXT REFERENCES topics(id),
  topic_name TEXT,
  exam_type TEXT,
  title TEXT,
  description TEXT,
  objectives TEXT, -- JSON array of learning objectives

  -- Scheduling
  scheduled_datetime TEXT NOT NULL,
  scheduled_duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'Africa/Accra',

  -- Join info
  room_code TEXT UNIQUE,
  join_url TEXT,

  -- AI co-pilot settings
  ai_copilot_enabled INTEGER DEFAULT 1,
  ai_copilot_mode TEXT DEFAULT 'assistant', -- assistant (suggests), silent (only when asked), disabled

  -- Features
  whiteboard_enabled INTEGER DEFAULT 1,
  voice_enabled INTEGER DEFAULT 1,
  recording_enabled INTEGER DEFAULT 0,
  screen_share_enabled INTEGER DEFAULT 1,

  -- Reminders
  reminder_24h_sent INTEGER DEFAULT 0,
  reminder_1h_sent INTEGER DEFAULT 0,
  reminder_15m_sent INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled, waiting, active, completed, cancelled, no_show
  started_at TEXT,
  ended_at TEXT,
  actual_duration_minutes INTEGER,

  -- Session notes
  tutor_notes TEXT,
  session_summary TEXT,
  homework_assigned TEXT,

  -- AI assistance metrics (for tutor/student review)
  ai_suggestions_given INTEGER DEFAULT 0,
  ai_explanations_requested INTEGER DEFAULT 0,
  ai_problems_generated INTEGER DEFAULT 0,

  -- Rating (post-session)
  student_rating INTEGER, -- 1-5
  student_feedback TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_ai_interactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  scheduled_session_id TEXT NOT NULL REFERENCES scheduled_classroom_sessions(id) ON DELETE CASCADE,

  -- Who requested
  requested_by TEXT NOT NULL, -- tutor_id or student_id
  requester_role TEXT NOT NULL, -- tutor, student

  -- Request details
  request_type TEXT NOT NULL, -- explain_concept, generate_problem, check_answer, provide_hint, summarize, suggest_next
  request_context TEXT, -- JSON with topic, difficulty, etc.
  request_prompt TEXT,

  -- AI response
  ai_response TEXT,
  response_type TEXT, -- text, whiteboard_content, problem_set

  -- Usage
  was_helpful INTEGER, -- 1 = yes, 0 = no, null = not rated

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS structured_question_parts (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    part_label TEXT NOT NULL,
    part_text TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'calculation', 'diagram', 'table', 'graph')),
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tutor_availability (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tutor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Availability settings
  accepting_handoffs INTEGER DEFAULT 1,
  accepting_observation INTEGER DEFAULT 1,
  max_observed_sessions INTEGER DEFAULT 5,

  -- Real-time status (updated via polling/heartbeat)
  is_online INTEGER DEFAULT 0,
  current_session_count INTEGER DEFAULT 0,
  last_heartbeat TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Matching preferences
  preferred_subjects TEXT, -- JSON array of subject IDs
  preferred_exam_types TEXT, -- JSON array: ['WASSCE', 'BECE', 'IGCSE', 'NSMQ']
  preferred_difficulty_levels TEXT, -- JSON array: ['beginner', 'intermediate', 'advanced']

  -- Notification preferences
  notify_on_handoff_request INTEGER DEFAULT 1,
  notify_on_high_struggle INTEGER DEFAULT 1,
  min_struggle_score_notify INTEGER DEFAULT 70,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tutor_id)
);

CREATE TABLE IF NOT EXISTS tutor_classroom_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ai_session_id TEXT NOT NULL REFERENCES ai_classroom_sessions(id) ON DELETE CASCADE,
  tutor_id TEXT REFERENCES users(id),
  student_id TEXT REFERENCES users(id),

  -- Event details
  event_type TEXT NOT NULL,
  -- Types: observe_start, observe_end, handoff_suggest, handoff_request, handoff_accept,
  --        handoff_decline, co_teach_start, takeover_start, message_sent, annotation_added,
  --        encouragement_sent, ai_guidance_sent, mode_change, session_end

  event_data TEXT, -- JSON payload with event-specific data

  -- For messages/annotations
  content TEXT,
  content_type TEXT, -- text, voice_transcript, whiteboard_annotation, ai_prompt, encouragement

  -- For annotations
  annotation_type TEXT, -- highlight, circle, arrow, text_note, correction, star, checkmark
  annotation_data TEXT, -- JSON Fabric.js object
  annotation_color TEXT DEFAULT '#10b981', -- Tutor color (emerald)

  -- Visibility
  is_visible_to_student INTEGER DEFAULT 1,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutor_observations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tutor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ai_session_id TEXT NOT NULL REFERENCES ai_classroom_sessions(id) ON DELETE CASCADE,

  -- Observation state
  is_active INTEGER DEFAULT 1,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,

  -- Last sync point (for polling)
  last_event_id TEXT,
  last_poll_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tutor_id, ai_session_id)
);

CREATE TABLE IF NOT EXISTS user_subject_selections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    is_selected INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, exam_type_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subject_sel_user ON user_subject_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subject_sel_exam ON user_subject_selections(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_ai_grading_limits_user ON ai_grading_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_teacher_assignments_teacher ON chat_teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chat_teacher_assignments_subject ON chat_teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_user ON chat_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_student_mods_user ON chat_student_moderators(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_student_mods_room ON chat_student_moderators(room_id);
CREATE INDEX IF NOT EXISTS idx_essay_questions_question ON essay_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_essay_questions_ai ON essay_questions(ai_grading_enabled);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_user ON essay_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_question ON essay_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_status ON essay_attempts(grading_status);
CREATE INDEX IF NOT EXISTS idx_essay_attempts_demo ON essay_attempts(is_demo_data, expires_at);
CREATE INDEX IF NOT EXISTS idx_structured_parts_question ON structured_question_parts(question_id);
