-- Migration: 086_multiplayer_study_rooms.sql
-- Description: Add multiplayer AI study rooms with voice conversation and interactive whiteboard support
-- Date: 2026-01-11

-- =====================================================
-- STUDY ROOMS / SESSIONS
-- =====================================================

-- Main study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_id TEXT NOT NULL,
  room_code TEXT UNIQUE, -- Short joinable code like "ABC123"

  -- Session Details
  title TEXT NOT NULL,
  description TEXT,
  subject_id TEXT,
  topic_id TEXT,
  exam_type TEXT, -- 'BECE', 'WASSCE', 'IGCSE', 'A-Level'

  -- Capacity
  max_participants INTEGER DEFAULT 5,

  -- Features Enabled
  voice_enabled INTEGER DEFAULT 1,
  whiteboard_enabled INTEGER DEFAULT 1,
  ai_tutor_enabled INTEGER DEFAULT 1,
  recording_enabled INTEGER DEFAULT 0,

  -- Privacy
  is_public INTEGER DEFAULT 0, -- Can be discovered in lobby
  requires_approval INTEGER DEFAULT 0, -- Host must approve joins
  password_hash TEXT, -- Optional password protection

  -- Status
  status TEXT DEFAULT 'waiting', -- 'waiting', 'active', 'paused', 'ended'
  started_at TEXT,
  ended_at TEXT,

  -- AI Teaching State (shared across room)
  current_lesson_id TEXT,
  current_teaching_phase TEXT,
  shared_whiteboard_state TEXT, -- JSON canvas state

  -- Metadata
  tags TEXT, -- JSON array: ['algebra', 'exam_prep']
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Study session participants
CREATE TABLE IF NOT EXISTS study_session_participants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Role & Permissions
  role TEXT DEFAULT 'participant', -- 'host', 'co-host', 'participant'
  can_draw INTEGER DEFAULT 1,
  can_speak INTEGER DEFAULT 1,
  can_control_ai INTEGER DEFAULT 0, -- Can trigger AI teaching

  -- Presence
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  left_at TEXT,
  is_active INTEGER DEFAULT 1,
  last_heartbeat TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Media State
  mic_enabled INTEGER DEFAULT 0,
  is_speaking INTEGER DEFAULT 0,
  hand_raised INTEGER DEFAULT 0,

  -- Drawing State
  cursor_x REAL,
  cursor_y REAL,
  drawing_color TEXT DEFAULT '#8b5cf6',

  UNIQUE(session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Real-time events for synchronization
CREATE TABLE IF NOT EXISTS study_session_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  user_id TEXT,

  -- Event Details
  event_type TEXT NOT NULL, -- 'draw', 'erase', 'cursor_move', 'chat', 'ai_request', 'voice_start', 'voice_end', 'hand_raise', 'reaction'
  event_data TEXT NOT NULL, -- JSON payload

  -- Ordering
  sequence_num INTEGER, -- For ordering events
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat messages within study sessions
CREATE TABLE IF NOT EXISTS study_session_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,

  -- Message Content
  message_type TEXT DEFAULT 'text', -- 'text', 'question', 'ai_response', 'system', 'voice_transcript'
  content TEXT NOT NULL,

  -- Voice Message Support
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  transcript TEXT, -- STT transcript if voice message

  -- Metadata
  is_pinned INTEGER DEFAULT 0,
  reply_to_id TEXT, -- For threaded replies
  reactions TEXT, -- JSON: {"👍": ["user1", "user2"], "❤️": ["user3"]}

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES study_session_messages(id)
);

-- Shared whiteboard drawings (separate from AI whiteboard)
CREATE TABLE IF NOT EXISTS study_session_drawings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Drawing Data
  object_id TEXT NOT NULL, -- Fabric.js object ID
  object_type TEXT NOT NULL, -- 'path', 'rect', 'circle', 'text', 'line', 'arrow'
  object_data TEXT NOT NULL, -- JSON serialized Fabric.js object

  -- Metadata
  layer INTEGER DEFAULT 0, -- For z-ordering
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Study session recordings
CREATE TABLE IF NOT EXISTS study_session_recordings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,

  -- Recording Info
  title TEXT,
  duration_seconds INTEGER,
  file_size_bytes INTEGER,

  -- Storage
  video_url TEXT,
  audio_url TEXT,
  whiteboard_events_url TEXT, -- JSON file of all drawing events
  transcript_url TEXT,

  -- Processing Status
  status TEXT DEFAULT 'recording', -- 'recording', 'processing', 'ready', 'failed'

  -- Metadata
  started_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
);

-- =====================================================
-- VOICE CONVERSATION SUPPORT
-- =====================================================

-- Voice interactions log (for AI voice tutoring)
CREATE TABLE IF NOT EXISTS voice_interactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  session_id TEXT, -- Optional: if part of study session
  lesson_id TEXT, -- Optional: if part of revision classroom

  -- Audio Input
  audio_input_url TEXT,
  audio_input_duration_seconds REAL,

  -- Speech-to-Text
  stt_transcript TEXT,
  stt_confidence REAL,
  stt_provider TEXT, -- 'web_speech', 'whisper', 'deepgram'
  stt_processing_ms INTEGER,

  -- AI Response
  ai_response_text TEXT,
  ai_response_tokens INTEGER,
  ai_processing_ms INTEGER,

  -- Text-to-Speech
  audio_output_url TEXT,
  audio_output_duration_seconds REAL,
  tts_provider TEXT, -- 'web_speech', 'elevenlabs', 'openai'
  tts_voice_id TEXT,

  -- Metadata
  interaction_type TEXT DEFAULT 'question', -- 'question', 'answer', 'clarification', 'continuation'
  context_messages TEXT, -- JSON array of previous messages for context

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_id) REFERENCES revision_lessons(id) ON DELETE SET NULL
);

-- =====================================================
-- INTERACTIVE WHITEBOARD ENHANCEMENTS
-- =====================================================

-- Student annotations on AI whiteboard lessons
CREATE TABLE IF NOT EXISTS whiteboard_student_annotations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  whiteboard_step INTEGER NOT NULL, -- Which step of the AI lesson

  -- Annotation Data
  annotation_type TEXT NOT NULL, -- 'highlight', 'circle', 'question_mark', 'checkmark', 'freehand', 'text_note'
  annotation_data TEXT NOT NULL, -- JSON Fabric.js object

  -- AI Response (if AI acknowledged the annotation)
  ai_acknowledged INTEGER DEFAULT 0,
  ai_response TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES revision_lessons(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_study_sessions_owner ON study_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_room_code ON study_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_study_sessions_public ON study_sessions(is_public, status);

CREATE INDEX IF NOT EXISTS idx_study_participants_session ON study_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_study_participants_user ON study_session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_study_participants_active ON study_session_participants(session_id, is_active);

CREATE INDEX IF NOT EXISTS idx_study_events_session ON study_session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_study_events_sequence ON study_session_events(session_id, sequence_num);

CREATE INDEX IF NOT EXISTS idx_study_messages_session ON study_session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_study_messages_pinned ON study_session_messages(session_id, is_pinned);

CREATE INDEX IF NOT EXISTS idx_study_drawings_session ON study_session_drawings(session_id);
CREATE INDEX IF NOT EXISTS idx_study_drawings_object ON study_session_drawings(session_id, object_id);

CREATE INDEX IF NOT EXISTS idx_voice_interactions_user ON voice_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_interactions_session ON voice_interactions(session_id);

CREATE INDEX IF NOT EXISTS idx_whiteboard_annotations_lesson ON whiteboard_student_annotations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_annotations_user ON whiteboard_student_annotations(user_id);
