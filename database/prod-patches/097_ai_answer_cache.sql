-- Prod patch 097: semantic answer cache for classroom AI questions (Phase B7).
CREATE TABLE IF NOT EXISTS ai_answer_cache (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  subject_id TEXT,
  exam_type TEXT,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  model TEXT,
  embedding_id TEXT,
  hit_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_hit_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_ai_answer_cache_topic ON ai_answer_cache(topic_id);
