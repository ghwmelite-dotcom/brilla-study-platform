-- 139: Retire invalid generic WASSCE catalogue records without deleting history.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migration_139_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);
DELETE FROM _migration_139_guard;

-- Accept only the reviewed seed state or this migration's exact final state.
-- Any content attached to either record requires an explicit content migration.
INSERT INTO _migration_139_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM subjects WHERE id IN (
    'subj_wassce_commerce', 'subj_wassce_visual_arts'
  )) = 2
  AND NOT EXISTS (
    SELECT 1
    FROM subjects
    WHERE id NOT IN ('subj_wassce_commerce', 'subj_wassce_visual_arts')
      AND slug IN (
        'wassce-commerce--retired-139',
        'wassce-visual-arts--retired-139'
      )
  )
  AND (
    (
      EXISTS (
        SELECT 1 FROM subjects
        WHERE id = 'subj_wassce_commerce'
          AND name = 'Commerce'
          AND exam_type_id = 'exam_wassce'
          AND category_id = 'cat_wassce_business'
          AND waec_code = 'COM'
          AND slug = 'wassce-commerce'
          AND is_active = 1
      )
      AND NOT EXISTS (
        SELECT 1 FROM question_bank_remediation_log
        WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
          AND entity_type = 'subject'
          AND entity_id = 'subj_wassce_commerce'
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM subjects
        WHERE id = 'subj_wassce_commerce'
          AND name = 'Commerce'
          AND exam_type_id = 'exam_wassce'
          AND category_id = 'cat_wassce_business'
          AND waec_code = 'COM'
          AND slug = 'wassce-commerce--retired-139'
          AND is_active = 0
      )
      AND (SELECT COUNT(*) FROM question_bank_remediation_log
           WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
             AND entity_type = 'subject'
             AND entity_id = 'subj_wassce_commerce') = 2
      AND (SELECT COUNT(*) FROM question_bank_remediation_log
           WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
             AND entity_type = 'subject'
             AND entity_id = 'subj_wassce_commerce'
             AND (
               (field_name = 'slug'
                AND old_value = 'wassce-commerce'
                AND new_value = 'wassce-commerce--retired-139')
               OR (field_name = 'is_active'
                   AND old_value = '1'
                   AND new_value = '0')
             )) = 2
    )
  )
  AND (
    (
      EXISTS (
        SELECT 1 FROM subjects
        WHERE id = 'subj_wassce_visual_arts'
          AND name = 'Visual Arts'
          AND exam_type_id = 'exam_wassce'
          AND category_id = 'cat_wassce_arts'
          AND waec_code = 'VIA'
          AND slug = 'wassce-visual-arts'
          AND is_active = 1
      )
      AND NOT EXISTS (
        SELECT 1 FROM question_bank_remediation_log
        WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
          AND entity_type = 'subject'
          AND entity_id = 'subj_wassce_visual_arts'
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM subjects
        WHERE id = 'subj_wassce_visual_arts'
          AND name = 'Visual Arts'
          AND exam_type_id = 'exam_wassce'
          AND category_id = 'cat_wassce_arts'
          AND waec_code = 'VIA'
          AND slug = 'wassce-visual-arts--retired-139'
          AND is_active = 0
      )
      AND (SELECT COUNT(*) FROM question_bank_remediation_log
           WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
             AND entity_type = 'subject'
             AND entity_id = 'subj_wassce_visual_arts') = 2
      AND (SELECT COUNT(*) FROM question_bank_remediation_log
           WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
             AND entity_type = 'subject'
             AND entity_id = 'subj_wassce_visual_arts'
             AND (
               (field_name = 'slug'
                AND old_value = 'wassce-visual-arts'
                AND new_value = 'wassce-visual-arts--retired-139')
               OR (field_name = 'is_active'
                   AND old_value = '1'
                   AND new_value = '0')
             )) = 2
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM questions
    WHERE subject_id IN ('subj_wassce_commerce', 'subj_wassce_visual_arts')
  )
  AND NOT EXISTS (
    SELECT 1 FROM topics
    WHERE subject_id IN ('subj_wassce_commerce', 'subj_wassce_visual_arts')
  )
  AND NOT EXISTS (
    SELECT 1 FROM past_papers
    WHERE subject_id IN ('subj_wassce_commerce', 'subj_wassce_visual_arts')
  )
  AND NOT EXISTS (
    SELECT 1 FROM subject_specifications
    WHERE subject_id IN ('subj_wassce_commerce', 'subj_wassce_visual_arts')
  )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT
  '139_retire_invalid_wassce_catalogue_records',
  'subject',
  id,
  'slug',
  slug,
  CASE id
    WHEN 'subj_wassce_commerce' THEN 'wassce-commerce--retired-139'
    WHEN 'subj_wassce_visual_arts' THEN 'wassce-visual-arts--retired-139'
  END
FROM subjects
WHERE (id = 'subj_wassce_commerce' AND slug = 'wassce-commerce' AND is_active = 1)
   OR (id = 'subj_wassce_visual_arts' AND slug = 'wassce-visual-arts' AND is_active = 1);

INSERT OR IGNORE INTO question_bank_remediation_log
  (migration_id, entity_type, entity_id, field_name, old_value, new_value)
SELECT
  '139_retire_invalid_wassce_catalogue_records',
  'subject',
  id,
  'is_active',
  CAST(is_active AS TEXT),
  '0'
FROM subjects
WHERE id IN ('subj_wassce_commerce', 'subj_wassce_visual_arts')
  AND is_active = 1;

UPDATE subjects
SET slug = CASE id
      WHEN 'subj_wassce_commerce' THEN 'wassce-commerce--retired-139'
      WHEN 'subj_wassce_visual_arts' THEN 'wassce-visual-arts--retired-139'
    END,
    is_active = 0
WHERE (id = 'subj_wassce_commerce' AND slug = 'wassce-commerce' AND is_active = 1)
   OR (id = 'subj_wassce_visual_arts' AND slug = 'wassce-visual-arts' AND is_active = 1);

INSERT INTO _migration_139_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM subjects
   WHERE (id = 'subj_wassce_commerce'
          AND slug = 'wassce-commerce--retired-139'
          AND is_active = 0)
      OR (id = 'subj_wassce_visual_arts'
          AND slug = 'wassce-visual-arts--retired-139'
          AND is_active = 0)) = 2
  AND (SELECT COUNT(*) FROM question_bank_remediation_log
       WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
         AND entity_type = 'subject'
         AND entity_id IN ('subj_wassce_commerce', 'subj_wassce_visual_arts')) = 4
  AND (SELECT COUNT(*) FROM question_bank_remediation_log
       WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
         AND entity_type = 'subject'
         AND (
           (entity_id = 'subj_wassce_commerce'
            AND field_name = 'slug'
            AND old_value = 'wassce-commerce'
            AND new_value = 'wassce-commerce--retired-139')
           OR (entity_id = 'subj_wassce_commerce'
               AND field_name = 'is_active'
               AND old_value = '1'
               AND new_value = '0')
           OR (entity_id = 'subj_wassce_visual_arts'
               AND field_name = 'slug'
               AND old_value = 'wassce-visual-arts'
               AND new_value = 'wassce-visual-arts--retired-139')
           OR (entity_id = 'subj_wassce_visual_arts'
               AND field_name = 'is_active'
               AND old_value = '1'
               AND new_value = '0')
         )) = 4
THEN 1 ELSE 0 END;

DROP TABLE _migration_139_guard;
