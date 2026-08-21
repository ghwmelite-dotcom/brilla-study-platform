-- Make the semantic AI answer cache part of the normal migration chain.
-- Production received the same shape through prod-patches/097. Rebuilding the
-- table makes the canonical contract explicit and fails before dropping the
-- source table if an older patch is missing any required column.
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

DROP TABLE IF EXISTS ai_answer_cache__098_rebuild;
CREATE TABLE ai_answer_cache__098_rebuild (
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

INSERT INTO ai_answer_cache__098_rebuild (
  id, topic_id, subject_id, exam_type, question_text, answer_text,
  model, embedding_id, hit_count, created_at, last_hit_at
)
SELECT
  id, topic_id, subject_id, exam_type, question_text, answer_text,
  model, embedding_id, hit_count, created_at, last_hit_at
FROM ai_answer_cache;

DROP TABLE ai_answer_cache;
ALTER TABLE ai_answer_cache__098_rebuild RENAME TO ai_answer_cache;
CREATE INDEX idx_ai_answer_cache_topic ON ai_answer_cache(topic_id);
