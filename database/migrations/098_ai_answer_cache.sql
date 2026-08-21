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

CREATE INDEX IF NOT EXISTS idx_ai_answer_cache_topic ON ai_answer_cache(topic_id);

-- Abort before the rebuild if a production patch has drifted. Wrangler rolls
-- back a failed migration, so neither missing nor unexpected columns/indexes
-- can be silently normalized with data loss.
DROP TABLE IF EXISTS ai_answer_cache__098_guard;
CREATE TABLE ai_answer_cache__098_guard (
  columns_valid INTEGER NOT NULL CHECK (columns_valid = 1),
  indexes_valid INTEGER NOT NULL CHECK (indexes_valid = 1)
);
INSERT INTO ai_answer_cache__098_guard (columns_valid, indexes_valid)
SELECT
  CASE WHEN (
    SELECT group_concat(signature, '|')
    FROM (
      SELECT
        name || ':' || upper(type) || ':' || "notnull" || ':' || pk || ':'
          || coalesce(dflt_value, '') AS signature
      FROM pragma_table_info('ai_answer_cache')
      ORDER BY cid
    )
  ) = 'id:TEXT:0:1:|topic_id:TEXT:1:0:|subject_id:TEXT:0:0:|exam_type:TEXT:0:0:|question_text:TEXT:1:0:|answer_text:TEXT:1:0:|model:TEXT:0:0:|embedding_id:TEXT:0:0:|hit_count:INTEGER:0:0:0|created_at:TEXT:0:0:datetime(''now'')|last_hit_at:TEXT:0:0:'
    THEN 1 ELSE 0
  END,
  CASE WHEN
    (SELECT COUNT(*) FROM pragma_index_list('ai_answer_cache')) = 2
    AND EXISTS (
      SELECT 1 FROM pragma_index_list('ai_answer_cache')
      WHERE name = 'idx_ai_answer_cache_topic' AND "unique" = 0 AND partial = 0
    )
    AND (SELECT COUNT(*) FROM pragma_index_info('idx_ai_answer_cache_topic')) = 1
    AND EXISTS (
      SELECT 1 FROM pragma_index_info('idx_ai_answer_cache_topic')
      WHERE seqno = 0 AND name = 'topic_id'
    )
    THEN 1 ELSE 0
  END;
DROP TABLE ai_answer_cache__098_guard;

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
