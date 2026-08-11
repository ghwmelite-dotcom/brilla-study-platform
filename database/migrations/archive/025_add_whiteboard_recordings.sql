-- Migration: Add Whiteboard Recordings System
-- Description: Adds support for recording and storing whiteboard lesson recordings

-- Whiteboard recordings table
CREATE TABLE IF NOT EXISTS whiteboard_recordings (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 0,  -- Duration in milliseconds

  -- Recording asset URLs (R2 storage)
  thumbnail_url TEXT,
  canvas_events_url TEXT NOT NULL,      -- JSON file with canvas events
  audio_url TEXT,                        -- WebM audio file
  webcam_url TEXT,                       -- WebM video file

  -- Canvas metadata
  canvas_width INTEGER DEFAULT 1200,
  canvas_height INTEGER DEFAULT 800,
  initial_canvas_json TEXT,             -- Starting state of canvas

  -- Organization
  subject_id TEXT,
  topic_id TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted')),
  is_public INTEGER DEFAULT 0,          -- Whether recording is publicly accessible
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_whiteboard_recordings_teacher ON whiteboard_recordings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_recordings_status ON whiteboard_recordings(status);
CREATE INDEX IF NOT EXISTS idx_whiteboard_recordings_created ON whiteboard_recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whiteboard_recordings_subject ON whiteboard_recordings(subject_id);

-- Recording views tracking (for analytics)
CREATE TABLE IF NOT EXISTS recording_views (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL,
  viewer_id TEXT,                        -- NULL for anonymous views
  viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  watch_duration INTEGER DEFAULT 0,      -- How long they watched in ms
  completed INTEGER DEFAULT 0,           -- Whether they watched to the end

  FOREIGN KEY (recording_id) REFERENCES whiteboard_recordings(id) ON DELETE CASCADE,
  FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recording_views_recording ON recording_views(recording_id);
CREATE INDEX IF NOT EXISTS idx_recording_views_viewer ON recording_views(viewer_id);

-- Recording sharing (for generating share links)
CREATE TABLE IF NOT EXISTS recording_shares (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,      -- Unique token for sharing
  created_by TEXT NOT NULL,
  expires_at TEXT,                       -- Optional expiration date
  max_views INTEGER,                     -- Optional view limit
  current_views INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (recording_id) REFERENCES whiteboard_recordings(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recording_shares_token ON recording_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_recording_shares_recording ON recording_shares(recording_id);
