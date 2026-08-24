-- Migration 100: deterministic question-bank integrity remediation
-- Release gate: apply to staging and rehearse rollback before production.
-- Every mutation is recorded before it is applied.

CREATE TABLE IF NOT EXISTS question_bank_remediation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('subject', 'question')),
  entity_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (migration_id, entity_type, entity_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_question_bank_remediation_log_release
  ON question_bank_remediation_log(migration_id, entity_type, entity_id);

-- Fail closed if the reviewed production assumptions drift.
CREATE TABLE IF NOT EXISTS _migration_100_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _migration_100_guard;
-- Canonical populated WASSCE subjects may already have the correct exam
-- assignment from an earlier release; the guarded category and WAEC code
-- remain required to match the reviewed pre-migration state.
WITH mapping(subject_id, exam_type_id, category_id) AS (
  VALUES
    ('subj_igcse_physics', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_chemistry', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_biology', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_math', 'igcse', 'cat_igcse_mathematics'),
    ('subj_igcse_add_math', 'igcse', 'cat_igcse_mathematics'),
    ('subj_alevel_physics', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_chemistry', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_biology', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_math', 'cambridge_a2', 'cat_alevel_mathematics'),
    ('subj_alevel_further_math', 'cambridge_a2', 'cat_alevel_mathematics'),
    ('subj_edexcel_igcse_physics', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_chemistry', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_biology', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_math', 'edexcel_igcse', 'cat_edexcel_igcse_mathematics')
)
INSERT INTO _migration_100_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM exam_types WHERE id IN ('igcse', 'cambridge_a2', 'edexcel_igcse')) = 3
  AND (SELECT COUNT(*) FROM subject_categories WHERE id IN (
    'cat_igcse_sciences', 'cat_igcse_mathematics',
    'cat_alevel_sciences', 'cat_alevel_mathematics',
    'cat_edexcel_igcse_sciences', 'cat_edexcel_igcse_mathematics'
  )) = 6
  AND (SELECT COUNT(*) FROM subjects WHERE id IN (
    'subj_igcse_physics', 'subj_igcse_chemistry', 'subj_igcse_biology',
    'subj_igcse_math', 'subj_igcse_add_math',
    'subj_alevel_physics', 'subj_alevel_chemistry', 'subj_alevel_biology',
    'subj_alevel_math', 'subj_alevel_further_math',
    'subj_edexcel_igcse_physics', 'subj_edexcel_igcse_chemistry',
    'subj_edexcel_igcse_biology', 'subj_edexcel_igcse_math'
  )) = 14
  AND (SELECT COUNT(*) FROM subjects WHERE id IN (
    'subj_wassce_cost_accounting', 'subj_wassce_cost_acct',
    'subj_wassce_tech_drawing', 'subj_wassce_tech_draw'
  )) = 4
  AND (
    (
      (SELECT COUNT(*) FROM subjects WHERE
        (id = 'subj_wassce_cost_accounting' AND slug = 'cost-accounting'
          AND (exam_type_id IS NULL OR exam_type_id = 'exam_wassce')
          AND category_id IS NULL AND waec_code IS NULL AND is_active = 1)
        OR (id = 'subj_wassce_tech_drawing' AND slug = 'technical-drawing'
          AND (exam_type_id IS NULL OR exam_type_id = 'exam_wassce')
          AND category_id IS NULL AND waec_code IS NULL AND is_active = 1)
      ) = 2
      AND (SELECT COUNT(*) FROM subjects WHERE
        (id = 'subj_wassce_cost_acct' AND slug = 'wassce-cost-accounting'
          AND exam_type_id = 'exam_wassce' AND category_id = 'cat_wassce_business'
          AND waec_code = 'CAC' AND is_active = 1)
        OR (id = 'subj_wassce_tech_draw' AND slug = 'wassce-technical-drawing'
          AND exam_type_id = 'exam_wassce' AND category_id = 'cat_wassce_technical'
          AND waec_code = 'TED' AND is_active = 1)
      ) = 2
    )
    OR (
      EXISTS (SELECT 1 FROM question_bank_remediation_log
        WHERE migration_id = '100_question_bank_integrity')
      AND (SELECT COUNT(*) FROM subjects WHERE
        (id = 'subj_wassce_cost_accounting' AND slug = 'cost-accounting'
          AND exam_type_id = 'exam_wassce' AND category_id = 'cat_wassce_business'
          AND waec_code = 'CAC' AND is_active = 1)
        OR (id = 'subj_wassce_tech_drawing' AND slug = 'technical-drawing'
          AND exam_type_id = 'exam_wassce' AND category_id = 'cat_wassce_technical'
          AND waec_code = 'TED' AND is_active = 1)
      ) = 2
      AND (SELECT COUNT(*) FROM subjects WHERE
        (id = 'subj_wassce_cost_acct' AND slug = 'wassce-cost-accounting--retired-100'
          AND exam_type_id = 'exam_wassce' AND category_id = 'cat_wassce_business'
          AND waec_code = 'CAC' AND is_active = 0)
        OR (id = 'subj_wassce_tech_draw' AND slug = 'wassce-technical-drawing--retired-100'
          AND exam_type_id = 'exam_wassce' AND category_id = 'cat_wassce_technical'
          AND waec_code = 'TED' AND is_active = 0)
      ) = 2
      AND (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id
           WHERE t.subject_id <> q.subject_id) = 0
      AND (SELECT COUNT(*)
           FROM questions q
           JOIN subjects s ON s.id = q.subject_id
           WHERE q.exam_type_id IS NULL
             AND s.exam_type_id IS NOT NULL) = 0
    )
  )
  AND (SELECT COUNT(*) FROM questions WHERE subject_id IN (
    'subj_wassce_cost_acct', 'subj_wassce_tech_draw'
  )) = 0
  AND (SELECT COUNT(*) FROM questions WHERE subject_id IN (
    'subj_wassce_cost_accounting', 'subj_wassce_tech_drawing'
  )) > 0
  AND (SELECT COUNT(*)
       FROM questions q
       JOIN subjects s ON s.id = q.subject_id
       WHERE q.exam_type_id IS NOT NULL
         AND s.exam_type_id IS NOT NULL
         AND q.exam_type_id <> s.exam_type_id) = 0
  AND (SELECT COUNT(*)
       FROM questions q
       JOIN mapping m ON m.subject_id = q.subject_id
       WHERE q.exam_type_id IS NOT NULL
         AND q.exam_type_id <> m.exam_type_id) = 0
  AND (SELECT COUNT(*)
       FROM subjects s
       JOIN mapping m ON m.subject_id = s.id
       WHERE (s.exam_type_id IS NOT NULL AND s.exam_type_id <> m.exam_type_id)
          OR (s.category_id IS NOT NULL AND s.category_id <> m.category_id)) = 0
  AND (SELECT COUNT(*)
       FROM mapping m
       JOIN subject_categories sc ON sc.id = m.category_id
       WHERE sc.exam_type_id <> m.exam_type_id) = 0
  AND (SELECT COUNT(*)
       FROM subject_categories
       WHERE (id = 'cat_wassce_business' AND exam_type_id = 'exam_wassce')
          OR (id = 'cat_wassce_technical' AND exam_type_id = 'exam_wassce')) = 2
THEN 1 ELSE 0 END;

-- Explicit reviewed subject -> exam/category allowlist.
WITH mapping(subject_id, exam_type_id, category_id) AS (
  VALUES
    ('subj_igcse_physics', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_chemistry', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_biology', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_math', 'igcse', 'cat_igcse_mathematics'),
    ('subj_igcse_add_math', 'igcse', 'cat_igcse_mathematics'),
    ('subj_alevel_physics', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_chemistry', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_biology', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_math', 'cambridge_a2', 'cat_alevel_mathematics'),
    ('subj_alevel_further_math', 'cambridge_a2', 'cat_alevel_mathematics'),
    ('subj_edexcel_igcse_physics', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_chemistry', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_biology', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_math', 'edexcel_igcse', 'cat_edexcel_igcse_mathematics')
)
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'subject', s.id, 'exam_type_id',
       s.exam_type_id, m.exam_type_id
FROM subjects s
JOIN mapping m ON m.subject_id = s.id
WHERE s.exam_type_id IS NOT m.exam_type_id;

WITH mapping(subject_id, exam_type_id, category_id) AS (
  VALUES
    ('subj_igcse_physics', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_chemistry', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_biology', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_math', 'igcse', 'cat_igcse_mathematics'),
    ('subj_igcse_add_math', 'igcse', 'cat_igcse_mathematics'),
    ('subj_alevel_physics', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_chemistry', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_biology', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_math', 'cambridge_a2', 'cat_alevel_mathematics'),
    ('subj_alevel_further_math', 'cambridge_a2', 'cat_alevel_mathematics'),
    ('subj_edexcel_igcse_physics', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_chemistry', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_biology', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_math', 'edexcel_igcse', 'cat_edexcel_igcse_mathematics')
)
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'subject', s.id, 'category_id',
       s.category_id, m.category_id
FROM subjects s
JOIN mapping m ON m.subject_id = s.id
WHERE s.category_id IS NOT m.category_id;

WITH mapping(subject_id, exam_type_id, category_id) AS (
  VALUES
    ('subj_igcse_physics', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_chemistry', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_biology', 'igcse', 'cat_igcse_sciences'),
    ('subj_igcse_math', 'igcse', 'cat_igcse_mathematics'),
    ('subj_igcse_add_math', 'igcse', 'cat_igcse_mathematics'),
    ('subj_alevel_physics', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_chemistry', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_biology', 'cambridge_a2', 'cat_alevel_sciences'),
    ('subj_alevel_math', 'cambridge_a2', 'cat_alevel_mathematics'),
    ('subj_alevel_further_math', 'cambridge_a2', 'cat_alevel_mathematics'),
    ('subj_edexcel_igcse_physics', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_chemistry', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_biology', 'edexcel_igcse', 'cat_edexcel_igcse_sciences'),
    ('subj_edexcel_igcse_math', 'edexcel_igcse', 'cat_edexcel_igcse_mathematics')
)
UPDATE subjects
SET exam_type_id = (
      SELECT m.exam_type_id FROM mapping m WHERE m.subject_id = subjects.id
    ),
    category_id = (
      SELECT m.category_id FROM mapping m WHERE m.subject_id = subjects.id
    )
WHERE id IN (SELECT subject_id FROM mapping)
  AND (
    exam_type_id IS NOT (SELECT m.exam_type_id FROM mapping m WHERE m.subject_id = subjects.id)
    OR category_id IS NOT (SELECT m.category_id FROM mapping m WHERE m.subject_id = subjects.id)
  );

-- Preserve populated legacy IDs and working slugs. Tombstone empty duplicates.
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'subject', id, 'slug', slug, slug || '--retired-100'
FROM subjects
WHERE id IN ('subj_wassce_cost_acct', 'subj_wassce_tech_draw')
  AND slug NOT LIKE '%--retired-100';

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'subject', id, 'is_active',
       CAST(is_active AS TEXT), '0'
FROM subjects
WHERE id IN ('subj_wassce_cost_acct', 'subj_wassce_tech_draw')
  AND is_active <> 0;

UPDATE subjects
SET slug = slug || '--retired-100',
    is_active = 0
WHERE id IN ('subj_wassce_cost_acct', 'subj_wassce_tech_draw')
  AND slug NOT LIKE '%--retired-100';

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'subject', id, 'exam_type_id',
       exam_type_id, 'exam_wassce'
FROM subjects
WHERE id IN ('subj_wassce_cost_accounting', 'subj_wassce_tech_drawing')
  AND exam_type_id IS NOT 'exam_wassce';


INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'subject', id, 'category_id', category_id,
       CASE id
         WHEN 'subj_wassce_cost_accounting' THEN 'cat_wassce_business'
         WHEN 'subj_wassce_tech_drawing' THEN 'cat_wassce_technical'
       END
FROM subjects
WHERE (id = 'subj_wassce_cost_accounting' AND category_id IS NOT 'cat_wassce_business')
   OR (id = 'subj_wassce_tech_drawing' AND category_id IS NOT 'cat_wassce_technical');

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'subject', id, 'waec_code', waec_code,
       CASE id
         WHEN 'subj_wassce_cost_accounting' THEN 'CAC'
         WHEN 'subj_wassce_tech_drawing' THEN 'TED'
       END
FROM subjects
WHERE (id = 'subj_wassce_cost_accounting' AND waec_code IS NOT 'CAC')
   OR (id = 'subj_wassce_tech_drawing' AND waec_code IS NOT 'TED');

UPDATE subjects
SET exam_type_id = 'exam_wassce',
    category_id = CASE id
      WHEN 'subj_wassce_cost_accounting' THEN 'cat_wassce_business'
      WHEN 'subj_wassce_tech_drawing' THEN 'cat_wassce_technical'
    END,
    waec_code = CASE id
      WHEN 'subj_wassce_cost_accounting' THEN 'CAC'
      WHEN 'subj_wassce_tech_drawing' THEN 'TED'
    END
WHERE id IN ('subj_wassce_cost_accounting', 'subj_wassce_tech_drawing');

-- Null-only question exam assignment from the now explicit subject relation.
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'question', q.id, 'exam_type_id',
       q.exam_type_id, s.exam_type_id
FROM questions q
JOIN subjects s ON s.id = q.subject_id
WHERE q.exam_type_id IS NULL
  AND s.exam_type_id IS NOT NULL;

UPDATE questions
SET exam_type_id = (
  SELECT s.exam_type_id FROM subjects s WHERE s.id = questions.subject_id
)
WHERE exam_type_id IS NULL
  AND EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.id = questions.subject_id
      AND s.exam_type_id IS NOT NULL
  );

-- Cross-subject topic links with exactly one normalized-name candidate.
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'question', q.id, 'topic_id', q.topic_id,
       (
         SELECT MIN(candidate.id)
         FROM topics candidate
         WHERE candidate.subject_id = q.subject_id
           AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
       )
FROM questions q
JOIN topics old_topic ON old_topic.id = q.topic_id
WHERE old_topic.subject_id <> q.subject_id
  AND (
    SELECT COUNT(*)
    FROM topics candidate
    WHERE candidate.subject_id = q.subject_id
      AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
  ) = 1;

UPDATE questions
SET topic_id = (
  SELECT MIN(candidate.id)
  FROM topics old_topic
  JOIN topics candidate
    ON candidate.subject_id = questions.subject_id
   AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
  WHERE old_topic.id = questions.topic_id
)
WHERE topic_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM topics old_topic
    WHERE old_topic.id = questions.topic_id
      AND old_topic.subject_id <> questions.subject_id
  )
  AND (
    SELECT COUNT(*)
    FROM topics old_topic
    JOIN topics candidate
      ON candidate.subject_id = questions.subject_id
     AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
    WHERE old_topic.id = questions.topic_id
  ) = 1;

-- Any remaining cross-subject link is ambiguous or unmatched.
INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT '100_question_bank_integrity', 'question', q.id, 'topic_id', q.topic_id, NULL
FROM questions q
JOIN topics t ON t.id = q.topic_id
WHERE t.subject_id <> q.subject_id;

UPDATE questions
SET topic_id = NULL
WHERE topic_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM topics t
    WHERE t.id = questions.topic_id
      AND t.subject_id <> questions.subject_id
  );

-- The repaired data must be globally consistent before durable triggers land.
INSERT INTO _migration_100_guard (valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM questions q
  JOIN subjects s ON s.id = q.subject_id
  WHERE q.exam_type_id IS NOT NULL
    AND q.exam_type_id IS NOT s.exam_type_id
) THEN 1 ELSE 0 END;

INSERT INTO _migration_100_guard (valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM questions q
  JOIN topics t ON t.id = q.topic_id
  WHERE q.topic_id IS NOT NULL
    AND q.subject_id IS NOT t.subject_id
) THEN 1 ELSE 0 END;

DROP TABLE _migration_100_guard;
-- Durable question-bank relationship invariants. These prevent future imports
-- from recreating the repaired cross-subject topic or exam mismatches.
CREATE TRIGGER IF NOT EXISTS trg_questions_subject_exam_insert
BEFORE INSERT ON questions
WHEN NEW.exam_type_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.id = NEW.subject_id AND s.exam_type_id IS NEW.exam_type_id
  )
BEGIN
  SELECT RAISE(ABORT, 'QUESTION_SUBJECT_EXAM_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_questions_subject_exam_update
BEFORE UPDATE OF subject_id, exam_type_id ON questions
WHEN NEW.exam_type_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subjects s
    WHERE s.id = NEW.subject_id AND s.exam_type_id IS NEW.exam_type_id
  )
BEGIN
  SELECT RAISE(ABORT, 'QUESTION_SUBJECT_EXAM_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_questions_subject_topic_insert
BEFORE INSERT ON questions
WHEN NEW.topic_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM topics t
    WHERE t.id = NEW.topic_id AND t.subject_id = NEW.subject_id
  )
BEGIN
  SELECT RAISE(ABORT, 'QUESTION_SUBJECT_TOPIC_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_questions_subject_topic_update
BEFORE UPDATE OF subject_id, topic_id ON questions
WHEN NEW.topic_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM topics t
    WHERE t.id = NEW.topic_id AND t.subject_id = NEW.subject_id
  )
BEGIN
  SELECT RAISE(ABORT, 'QUESTION_SUBJECT_TOPIC_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_subject_exam_update_with_questions
BEFORE UPDATE OF exam_type_id ON subjects
WHEN EXISTS (
  SELECT 1 FROM questions q
  WHERE q.subject_id = OLD.id
    AND q.exam_type_id IS NOT NULL
    AND q.exam_type_id IS NOT NEW.exam_type_id
)
BEGIN
  SELECT RAISE(ABORT, 'SUBJECT_EXAM_HAS_MISMATCHED_QUESTIONS');
END;

CREATE TRIGGER IF NOT EXISTS trg_topic_subject_update_with_questions
BEFORE UPDATE OF subject_id ON topics
WHEN EXISTS (
  SELECT 1 FROM questions q
  WHERE q.topic_id = OLD.id AND q.subject_id IS NOT NEW.subject_id
)
BEGIN
  SELECT RAISE(ABORT, 'TOPIC_SUBJECT_HAS_MISMATCHED_QUESTIONS');
END;
