-- =====================================================
-- TUTOR-AI CLASSROOM INTEGRATION
-- Enables human tutors to observe, handoff, co-teach,
-- and schedule live sessions with AI assistance
-- =====================================================

-- Tutor availability for observation/handoff
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

-- AI classroom sessions that can be observed/joined by tutors
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

-- Tutor classroom events (messages, annotations, guidance, mode changes)
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

-- Tutor observations (which tutors are watching which sessions)
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

-- Scheduled live classroom sessions (tutor-led with AI co-pilot)
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

-- AI co-pilot interactions during scheduled sessions
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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tutor availability indexes
CREATE INDEX IF NOT EXISTS idx_tutor_availability_online
  ON tutor_availability(is_online, accepting_handoffs);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor
  ON tutor_availability(tutor_id);

-- AI classroom session indexes
CREATE INDEX IF NOT EXISTS idx_ai_classroom_active
  ON ai_classroom_sessions(is_active, visibility);
CREATE INDEX IF NOT EXISTS idx_ai_classroom_student
  ON ai_classroom_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_classroom_tutor
  ON ai_classroom_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_ai_classroom_struggle
  ON ai_classroom_sessions(struggle_score DESC) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_ai_classroom_handoff
  ON ai_classroom_sessions(handoff_status) WHERE handoff_status != 'none';
CREATE INDEX IF NOT EXISTS idx_ai_classroom_subject
  ON ai_classroom_sessions(subject_id, exam_type);

-- Tutor events indexes
CREATE INDEX IF NOT EXISTS idx_tutor_events_session
  ON tutor_classroom_events(ai_session_id);
CREATE INDEX IF NOT EXISTS idx_tutor_events_tutor
  ON tutor_classroom_events(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_events_created
  ON tutor_classroom_events(created_at DESC);

-- Tutor observations indexes
CREATE INDEX IF NOT EXISTS idx_tutor_observations_tutor
  ON tutor_observations(tutor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tutor_observations_session
  ON tutor_observations(ai_session_id, is_active);

-- Scheduled sessions indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_tutor
  ON scheduled_classroom_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_student
  ON scheduled_classroom_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_datetime
  ON scheduled_classroom_sessions(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_status
  ON scheduled_classroom_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_classroom_room
  ON scheduled_classroom_sessions(room_code);

-- AI interactions indexes
CREATE INDEX IF NOT EXISTS idx_session_ai_interactions_session
  ON session_ai_interactions(scheduled_session_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER IF NOT EXISTS update_tutor_availability_timestamp
  AFTER UPDATE ON tutor_availability
  BEGIN
    UPDATE tutor_availability SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_ai_classroom_sessions_timestamp
  AFTER UPDATE ON ai_classroom_sessions
  BEGIN
    UPDATE ai_classroom_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_scheduled_classroom_sessions_timestamp
  AFTER UPDATE ON scheduled_classroom_sessions
  BEGIN
    UPDATE scheduled_classroom_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
