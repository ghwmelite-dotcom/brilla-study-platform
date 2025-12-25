-- Migration: Add whiteboards table for cloud storage
-- This replaces localStorage-based whiteboard storage

-- Whiteboards table
CREATE TABLE IF NOT EXISTS whiteboards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  canvas_json TEXT NOT NULL, -- Fabric.js canvas JSON
  thumbnail TEXT, -- Base64 or R2 URL
  canvas_width INTEGER DEFAULT 1200,
  canvas_height INTEGER DEFAULT 800,
  subject_id TEXT,
  topic_id TEXT,
  is_template INTEGER DEFAULT 0, -- Can be used as a template
  is_public INTEGER DEFAULT 0, -- Publicly viewable
  status TEXT DEFAULT 'active', -- active, archived, deleted
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_whiteboards_user_id ON whiteboards(user_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_status ON whiteboards(status);
CREATE INDEX IF NOT EXISTS idx_whiteboards_updated_at ON whiteboards(updated_at);

-- Whiteboard collaborators (for future shared editing)
CREATE TABLE IF NOT EXISTS whiteboard_collaborators (
  id TEXT PRIMARY KEY,
  whiteboard_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT DEFAULT 'view', -- view, edit, admin
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (whiteboard_id) REFERENCES whiteboards(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(whiteboard_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_whiteboard_collaborators_whiteboard ON whiteboard_collaborators(whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_collaborators_user ON whiteboard_collaborators(user_id);
