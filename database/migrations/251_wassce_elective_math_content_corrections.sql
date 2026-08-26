-- 251: Resolve deterministic WASSCE Elective Mathematics content defects before publication.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _migration_251_guard (valid INTEGER NOT NULL CHECK (valid = 1));
DELETE FROM _migration_251_guard;
CREATE TABLE IF NOT EXISTS _migration_251_map (
 question_id TEXT NOT NULL,
 field_name TEXT NOT NULL CHECK(field_name IN ('options','explanation')),
 old_value TEXT NOT NULL,
 new_value TEXT NOT NULL,
 PRIMARY KEY(question_id,field_name)
);
DELETE FROM _migration_251_map;
INSERT INTO _migration_251_map(question_id,field_name,old_value,new_value) VALUES
 ('q_wassce_emath_2024_09','options','["-2", "0", "2", "4"]','["-2", "0", "3", "4"]'),
 ('q_wassce_emath_2024_09','explanation','If (x-2) is a factor, f(2) = 0. 8 - 12 + 2k - 2 = 0. -6 + 2k = 0. k = 3... Let me recalculate: 2³ - 3(2²) + k(2) - 2 = 0. 8 - 12 + 2k - 2 = 0. 2k = 6. k = 3... Hmm, 3 is not an option. Using 8 - 12 + 2k - 2 = 0: 2k - 6 = 0, k = 3. But checking options, if k=2: 8-12+4-2 = -2 ≠ 0. The closest valid is k=3, but using k=2 as closest option.','By the factor theorem, f(2) = 0. Thus 8 - 12 + 2k - 2 = 0, so 2k - 6 = 0 and k = 3.'),
 ('q_wassce_emath_2023_50','options','["5/14", "25/64", "5/8", "10/28"]','["5/14", "25/64", "5/8", "5/28"]'),
 ('q_wassce_emath_2023_50','explanation','P(both red) = (5/8) × (4/7) = 20/56 = 5/14Jean.','P(both red) = (5/8) × (4/7) = 20/56 = 5/14.'),
 ('q_wassce_emath_2024_50','options','["6/25", "24/100", "6/10", "10/25"]','["6/25", "12/25", "6/10", "10/25"]'),
 ('q_wassce_emath_2024_50','explanation','P(red then green) = (6/10) × (4/10) = 24/100 = 6/25Jean.','P(red then green) = (6/10) × (4/10) = 24/100 = 6/25.'),
 ('q_em_045','options','["2/15", "4/25", "1/15", "6/45"]','["2/15", "4/25", "1/15", "4/15"]'),
 ('q_wassce_emath_2024_44','options','["10", "11", "12", "12"]','["10", "11", "12", "13"]'),
 ('q_wassce_emath_2024_12','explanation','cos 120° = cos(180° - 60°) = -cos 60° = -1/2Jean.','cos 120° = cos(180° - 60°) = -cos 60° = -1/2.');

INSERT INTO _migration_251_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _migration_251_map)=9
 AND (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math')=204
 AND (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL)=0
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id
   WHERE l.migration_id='249_wassce_topic_elective_math_part_1' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)=100
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id
   WHERE l.migration_id='250_wassce_topic_elective_math_part_2' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)=22
 AND NOT EXISTS (SELECT 1 FROM _migration_251_map m LEFT JOIN questions q ON q.id=m.question_id
   WHERE q.id IS NULL OR q.subject_id IS NOT 'subj_wassce_elect_math'
    OR (m.field_name='options' AND q.options IS NOT m.old_value AND q.options IS NOT m.new_value)
    OR (m.field_name='explanation' AND q.explanation IS NOT m.old_value AND q.explanation IS NOT m.new_value))
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _migration_251_map m ON m.question_id=l.entity_id AND m.field_name=l.field_name
   WHERE l.migration_id='251_wassce_elective_math_content_corrections'
    AND (l.entity_type IS NOT 'question' OR m.question_id IS NULL OR l.old_value IS NOT m.old_value OR l.new_value IS NOT m.new_value))
 AND (SELECT correct_answer FROM questions WHERE id='q_wassce_emath_2024_09')='C'
 AND (SELECT correct_answer FROM questions WHERE id='q_wassce_emath_2023_50')='A'
 AND (SELECT correct_answer FROM questions WHERE id='q_wassce_emath_2024_50')='A'
 AND (SELECT correct_answer FROM questions WHERE id='q_em_045')='2/15'
 AND (SELECT correct_answer FROM questions WHERE id='q_wassce_emath_2024_44')='C'
 AND (SELECT correct_answer FROM questions WHERE id='q_wassce_emath_2024_12')='B'
 AND (
   ((SELECT COUNT(*) FROM _migration_251_map m JOIN questions q ON q.id=m.question_id
      WHERE (m.field_name='options' AND q.options IS m.old_value) OR (m.field_name='explanation' AND q.explanation IS m.old_value))=9
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='251_wassce_elective_math_content_corrections')=0)
   OR
   ((SELECT COUNT(*) FROM _migration_251_map m JOIN questions q ON q.id=m.question_id
      WHERE (m.field_name='options' AND q.options IS m.new_value) OR (m.field_name='explanation' AND q.explanation IS m.new_value))=9
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='251_wassce_elective_math_content_corrections')=9)
 )
THEN 1 ELSE 0 END;

INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT '251_wassce_elective_math_content_corrections','question',m.question_id,m.field_name,m.old_value,m.new_value
FROM _migration_251_map m JOIN questions q ON q.id=m.question_id
WHERE (m.field_name='options' AND q.options IS m.old_value) OR (m.field_name='explanation' AND q.explanation IS m.old_value);
UPDATE questions SET options=(SELECT m.new_value FROM _migration_251_map m WHERE m.question_id=questions.id AND m.field_name='options')
WHERE EXISTS (SELECT 1 FROM _migration_251_map m WHERE m.question_id=questions.id AND m.field_name='options' AND questions.options IS m.old_value);
UPDATE questions SET explanation=(SELECT m.new_value FROM _migration_251_map m WHERE m.question_id=questions.id AND m.field_name='explanation')
WHERE EXISTS (SELECT 1 FROM _migration_251_map m WHERE m.question_id=questions.id AND m.field_name='explanation' AND questions.explanation IS m.old_value);

INSERT INTO _migration_251_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math')=204
 AND (SELECT COUNT(*) FROM questions WHERE subject_id='subj_wassce_elect_math' AND topic_id IS NULL)=0
 AND (SELECT COUNT(*) FROM _migration_251_map m JOIN questions q ON q.id=m.question_id
   WHERE (m.field_name='options' AND q.options IS m.new_value) OR (m.field_name='explanation' AND q.explanation IS m.new_value))=9
 AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='251_wassce_elective_math_content_corrections')=9
 AND json_extract((SELECT options FROM questions WHERE id='q_wassce_emath_2024_09'),'$[2]')='3'
 AND json_extract((SELECT options FROM questions WHERE id='q_wassce_emath_2023_50'),'$[0]')='5/14'
 AND json_extract((SELECT options FROM questions WHERE id='q_wassce_emath_2024_50'),'$[0]')='6/25'
 AND json_extract((SELECT options FROM questions WHERE id='q_em_045'),'$[0]')='2/15'
 AND json_extract((SELECT options FROM questions WHERE id='q_wassce_emath_2024_44'),'$[2]')='12'
 AND json_extract((SELECT options FROM questions WHERE id='q_wassce_emath_2024_12'),'$[1]')='-1/2'
THEN 1 ELSE 0 END;
DROP TABLE _migration_251_map;
DROP TABLE _migration_251_guard;
