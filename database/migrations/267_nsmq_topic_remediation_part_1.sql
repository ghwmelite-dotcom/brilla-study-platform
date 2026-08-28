-- 267: NSMQ null-topic remediation part 1/4 (100 exact mappings).
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS _migration_267_expected(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT NOT NULL);
DELETE FROM _migration_267_expected;
INSERT INTO _migration_267_expected VALUES
  ('nsmq_math_rid_012','subj_nsmq_math','riddles','topic_nsmq_math_general_reasoning'),
  ('nsmq_phy_rid_012','subj_nsmq_physics','riddles','topic_thermodynamics'),
  ('nsmq_bio_pod_001','subj_nsmq_biology','problem_of_day','topic_genetics'),
  ('nsmq_bio_pod_002','subj_nsmq_biology','problem_of_day','topic_genetics'),
  ('nsmq_bio_pod_003','subj_nsmq_biology','problem_of_day','topic_genetics'),
  ('nsmq_bio_pod_004','subj_nsmq_biology','problem_of_day','topic_genetics'),
  ('nsmq_bio_pod_005','subj_nsmq_biology','problem_of_day','topic_physiology'),
  ('nsmq_bio_pod_006','subj_nsmq_biology','problem_of_day','topic_genetics'),
  ('nsmq_bio_pod_007','subj_nsmq_biology','problem_of_day','topic_biochemistry'),
  ('nsmq_bio_pod_008','subj_nsmq_biology','problem_of_day','topic_genetics'),
  ('nsmq_bio_pod_009','subj_nsmq_biology','problem_of_day','topic_ecology'),
  ('nsmq_bio_pod_010','subj_nsmq_biology','problem_of_day','topic_cells'),
  ('nsmq_bio_pod_011','subj_nsmq_biology','problem_of_day','topic_genetics'),
  ('nsmq_bio_pod_012','subj_nsmq_biology','problem_of_day','topic_physiology'),
  ('nsmq_bio_pod_013','subj_nsmq_biology','problem_of_day','topic_genetics'),
  ('nsmq_bio_pod_014','subj_nsmq_biology','problem_of_day','topic_physiology'),
  ('nsmq_bio_pod_015','subj_nsmq_biology','problem_of_day','topic_genetics'),
  ('nsmq_bio_pod_016','subj_nsmq_biology','problem_of_day','topic_physiology'),
  ('nsmq_bio_pod_017','subj_nsmq_biology','problem_of_day','topic_cells'),
  ('nsmq_bio_pod_018','subj_nsmq_biology','problem_of_day','topic_biochemistry'),
  ('nsmq_bio_pod_019','subj_nsmq_biology','problem_of_day','topic_ecology'),
  ('nsmq_bio_pod_020','subj_nsmq_biology','problem_of_day','topic_physiology'),
  ('nsmq_bio_rid_001','subj_nsmq_biology','riddles','topic_genetics'),
  ('nsmq_bio_rid_002','subj_nsmq_biology','riddles','topic_cells'),
  ('nsmq_bio_rid_003','subj_nsmq_biology','riddles','topic_genetics'),
  ('nsmq_bio_rid_004','subj_nsmq_biology','riddles','topic_physiology'),
  ('nsmq_bio_rid_005','subj_nsmq_biology','riddles','topic_cells'),
  ('nsmq_bio_rid_006','subj_nsmq_biology','riddles','topic_physiology'),
  ('nsmq_bio_rid_007','subj_nsmq_biology','riddles','topic_biochemistry'),
  ('nsmq_bio_rid_008','subj_nsmq_biology','riddles','topic_ecology'),
  ('nsmq_bio_rid_009','subj_nsmq_biology','riddles','topic_physiology'),
  ('nsmq_bio_rid_010','subj_nsmq_biology','riddles','topic_genetics'),
  ('nsmq_bio_rid_011','subj_nsmq_biology','riddles','topic_genetics'),
  ('nsmq_bio_rid_012','subj_nsmq_biology','riddles','topic_physiology'),
  ('nsmq_bio_rid_013','subj_nsmq_biology','riddles','topic_physiology'),
  ('nsmq_bio_rid_014','subj_nsmq_biology','riddles','topic_physiology'),
  ('nsmq_bio_rid_015','subj_nsmq_biology','riddles','topic_cells'),
  ('nsmq_bio_r1_001','subj_nsmq_biology','round_one','topic_cells'),
  ('nsmq_bio_r1_002','subj_nsmq_biology','round_one','topic_biochemistry'),
  ('nsmq_bio_r1_003','subj_nsmq_biology','round_one','topic_genetics'),
  ('nsmq_bio_r1_004','subj_nsmq_biology','round_one','topic_cells'),
  ('nsmq_bio_r1_005','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_006','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_007','subj_nsmq_biology','round_one','topic_genetics'),
  ('nsmq_bio_r1_008','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_009','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_010','subj_nsmq_biology','round_one','topic_cells'),
  ('nsmq_bio_r1_011','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_012','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_013','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_014','subj_nsmq_biology','round_one','topic_genetics'),
  ('nsmq_bio_r1_015','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_016','subj_nsmq_biology','round_one','topic_ecology'),
  ('nsmq_bio_r1_017','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_018','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_019','subj_nsmq_biology','round_one','topic_cells'),
  ('nsmq_bio_r1_020','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_021','subj_nsmq_biology','round_one','topic_biochemistry'),
  ('nsmq_bio_r1_022','subj_nsmq_biology','round_one','topic_cells'),
  ('nsmq_bio_r1_023','subj_nsmq_biology','round_one','topic_ecology'),
  ('nsmq_bio_r1_024','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_025','subj_nsmq_biology','round_one','topic_physiology'),
  ('nsmq_bio_r1_026','subj_nsmq_biology','round_one','topic_genetics'),
  ('nsmq_bio_r1_027','subj_nsmq_biology','round_one','topic_ecology'),
  ('nsmq_bio_r1_028','subj_nsmq_biology','round_one','topic_biochemistry'),
  ('nsmq_bio_r1_029','subj_nsmq_biology','round_one','topic_ecology'),
  ('nsmq_bio_r1_030','subj_nsmq_biology','round_one','topic_cells'),
  ('q_speed_005','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_tf_001','subj_nsmq_biology','true_false','topic_cells'),
  ('nsmq_bio_tf_002','subj_nsmq_biology','true_false','topic_genetics'),
  ('nsmq_bio_tf_003','subj_nsmq_biology','true_false','topic_physiology'),
  ('nsmq_bio_tf_004','subj_nsmq_biology','true_false','topic_biochemistry'),
  ('nsmq_bio_tf_005','subj_nsmq_biology','true_false','topic_biochemistry'),
  ('nsmq_bio_tf_006','subj_nsmq_biology','true_false','topic_cells'),
  ('nsmq_bio_tf_007','subj_nsmq_biology','true_false','topic_genetics'),
  ('nsmq_bio_tf_008','subj_nsmq_biology','true_false','topic_physiology'),
  ('nsmq_bio_tf_009','subj_nsmq_biology','true_false','topic_cells'),
  ('nsmq_bio_tf_010','subj_nsmq_biology','true_false','topic_biochemistry'),
  ('nsmq_bio_tf_011','subj_nsmq_biology','true_false','topic_physiology'),
  ('nsmq_bio_tf_012','subj_nsmq_biology','true_false','topic_genetics'),
  ('nsmq_bio_tf_013','subj_nsmq_biology','true_false','topic_physiology'),
  ('nsmq_bio_tf_014','subj_nsmq_biology','true_false','topic_ecology'),
  ('nsmq_bio_tf_015','subj_nsmq_biology','true_false','topic_biochemistry'),
  ('nsmq_bio_tf_016','subj_nsmq_biology','true_false','topic_physiology'),
  ('nsmq_bio_tf_017','subj_nsmq_biology','true_false','topic_physiology'),
  ('nsmq_bio_tf_018','subj_nsmq_biology','true_false','topic_genetics'),
  ('nsmq_bio_tf_019','subj_nsmq_biology','true_false','topic_genetics'),
  ('nsmq_bio_tf_020','subj_nsmq_biology','true_false','topic_physiology'),
  ('nsmq_chem_pod_001','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry'),
  ('nsmq_chem_pod_002','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry'),
  ('nsmq_chem_pod_003','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry'),
  ('nsmq_chem_pod_004','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry'),
  ('nsmq_chem_pod_005','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry'),
  ('nsmq_chem_pod_006','subj_nsmq_chemistry','problem_of_day','topic_equilibrium'),
  ('nsmq_chem_pod_007','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry'),
  ('nsmq_chem_pod_008','subj_nsmq_chemistry','problem_of_day','topic_organic'),
  ('nsmq_chem_pod_009','subj_nsmq_chemistry','problem_of_day','topic_electrochemistry'),
  ('nsmq_chem_pod_010','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry'),
  ('nsmq_chem_pod_011','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry'),
  ('nsmq_chem_pod_012','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry');
CREATE TABLE IF NOT EXISTS _migration_267_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _migration_267_guard;
INSERT INTO _migration_267_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _migration_267_expected)=100
  AND (SELECT COUNT(*) FROM questions q JOIN _migration_267_expected e ON e.q=q.id)=100
  AND NOT EXISTS (SELECT 1 FROM _migration_267_expected e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id IS NOT 'exam_nsmq' OR s.is_active<>1)
  AND NOT EXISTS (SELECT 1 FROM _migration_267_expected e LEFT JOIN topics t ON t.id=e.t WHERE
    (e.t NOT IN ('topic_nsmq_math_general_reasoning','topic_nsmq_math_numeration','topic_nsmq_math_sets','topic_nsmq_chem_environmental') AND (t.id IS NULL OR t.subject_id IS NOT e.s))
    OR (e.t IN ('topic_nsmq_math_general_reasoning','topic_nsmq_math_numeration','topic_nsmq_math_sets','topic_nsmq_chem_environmental') AND e.s IS NOT CASE e.t WHEN 'topic_nsmq_math_general_reasoning' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_math_numeration' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_math_sets' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_chem_environmental' THEN 'subj_nsmq_chemistry' END))
  AND (1=1)
  AND (
    ((SELECT COUNT(*) FROM questions q JOIN _migration_267_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS NULL)=100 AND EXISTS (SELECT 1 FROM questions WHERE id='nsmq_math_rid_012'
    AND question_text='I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What number am I?'
    AND correct_answer='3624'
    AND explanation='Last=2, First=6, no wait... Let me recalculate: 3×1=3, 3-1=2, 2×1=2, last=1 → but not 4 digits. Try: 6521 (6=3×2, 5=6-1, 2=2×1, 1). Actually: 3624')
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='267_nsmq_topic_remediation_part_1')=0
      AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_nsmq_math_general_reasoning','topic_nsmq_math_numeration','topic_nsmq_math_sets','topic_nsmq_chem_environmental'))=0
  AND NOT EXISTS (SELECT 1 FROM topics t WHERE (t.subject_id='subj_nsmq_math' AND (t.slug='general-reasoning' OR lower(t.name)=lower('General Reasoning'))) OR (t.subject_id='subj_nsmq_math' AND (t.slug='numeration-number-systems' OR lower(t.name)=lower('Numeration & Number Systems'))) OR (t.subject_id='subj_nsmq_math' AND (t.slug='sets' OR lower(t.name)=lower('Sets'))) OR (t.subject_id='subj_nsmq_chemistry' AND (t.slug='environmental-chemistry' OR lower(t.name)=lower('Environmental Chemistry')))))
    OR
    ((SELECT COUNT(*) FROM questions q JOIN _migration_267_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS e.t)=100 AND EXISTS (SELECT 1 FROM questions WHERE id='nsmq_math_rid_012'
    AND question_text='I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What numbers can I be?'
    AND correct_answer='6542 or 9863'
    AND explanation='Let the last digit be d, so the digits are 3d, 3d−1, 2d, d. The only possible last digits are 1, 2, and 3. When d=1, the digit 2 repeats, so it is invalid. When d=2, the number is 6542; when d=3, the number is 9863. Both satisfy every stated constraint.')
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='267_nsmq_topic_remediation_part_1')=103
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _migration_267_expected e ON e.q=l.entity_id
    WHERE l.migration_id='267_nsmq_topic_remediation_part_1' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS e.t)=100
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='267_nsmq_topic_remediation_part_1'
    AND entity_type='question' AND entity_id='nsmq_math_rid_012' AND (
      (field_name='question_text' AND old_value='I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What number am I?' AND new_value='I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What numbers can I be?')
      OR (field_name='correct_answer' AND old_value='3624' AND new_value='6542 or 9863')
      OR (field_name='explanation' AND old_value='Last=2, First=6, no wait... Let me recalculate: 3×1=3, 3-1=2, 2×1=2, last=1 → but not 4 digits. Try: 6521 (6=3×2, 5=6-1, 2=2×1, 1). Actually: 3624' AND new_value='Let the last digit be d, so the digits are 3d, 3d−1, 2d, d. The only possible last digits are 1, 2, and 3. When d=1, the digit 2 repeats, so it is invalid. When d=2, the number is 6542; when d=3, the number is 9863. Both satisfy every stated constraint.')
    ))=3
      AND (SELECT COUNT(*) FROM topics t WHERE (t.id='topic_nsmq_math_general_reasoning' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='General Reasoning' AND t.slug='general-reasoning' AND t.description='Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=6 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_numeration' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Numeration & Number Systems' AND t.slug='numeration-number-systems' AND t.description='Number representation, notation, bases and number-system conventions.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_sets' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Sets' AND t.slug='sets' AND t.description='Set notation, membership, subsets, operations and related reasoning.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=8 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_chem_environmental' AND t.subject_id='subj_nsmq_chemistry' AND t.parent_id IS NULL AND t.name='Environmental Chemistry' AND t.slug='environmental-chemistry' AND t.description='Chemical processes and substances affecting the atmosphere and environment.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z'))=4)
  )
  AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
INSERT OR IGNORE INTO topics(id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order,created_at) VALUES
  ('topic_nsmq_math_general_reasoning','subj_nsmq_math',NULL,'General Reasoning','general-reasoning','Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.',NULL,NULL,'6','2026-08-26T00:00:00.000Z'),
  ('topic_nsmq_math_numeration','subj_nsmq_math',NULL,'Numeration & Number Systems','numeration-number-systems','Number representation, notation, bases and number-system conventions.',NULL,NULL,'7','2026-08-26T00:00:00.000Z'),
  ('topic_nsmq_math_sets','subj_nsmq_math',NULL,'Sets','sets','Set notation, membership, subsets, operations and related reasoning.',NULL,NULL,'8','2026-08-26T00:00:00.000Z'),
  ('topic_nsmq_chem_environmental','subj_nsmq_chemistry',NULL,'Environmental Chemistry','environmental-chemistry','Chemical processes and substances affecting the atmosphere and environment.',NULL,NULL,'7','2026-08-26T00:00:00.000Z');
INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT '267_nsmq_topic_remediation_part_1','question',e.q,'topic_id',NULL,e.t FROM _migration_267_expected e JOIN questions q ON q.id=e.q WHERE q.topic_id IS NULL;
INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES ('267_nsmq_topic_remediation_part_1','question','nsmq_math_rid_012','question_text','I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What number am I?','I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What numbers can I be?');
INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES ('267_nsmq_topic_remediation_part_1','question','nsmq_math_rid_012','correct_answer','3624','6542 or 9863');
INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES ('267_nsmq_topic_remediation_part_1','question','nsmq_math_rid_012','explanation','Last=2, First=6, no wait... Let me recalculate: 3×1=3, 3-1=2, 2×1=2, last=1 → but not 4 digits. Try: 6521 (6=3×2, 5=6-1, 2=2×1, 1). Actually: 3624','Let the last digit be d, so the digits are 3d, 3d−1, 2d, d. The only possible last digits are 1, 2, and 3. When d=1, the digit 2 repeats, so it is invalid. When d=2, the number is 6542; when d=3, the number is 9863. Both satisfy every stated constraint.');
UPDATE questions SET question_text='I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What numbers can I be?',correct_answer='6542 or 9863',explanation='Let the last digit be d, so the digits are 3d, 3d−1, 2d, d. The only possible last digits are 1, 2, and 3. When d=1, the digit 2 repeats, so it is invalid. When d=2, the number is 6542; when d=3, the number is 9863. Both satisfy every stated constraint.'
WHERE id='nsmq_math_rid_012' AND question_text='I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What number am I?' AND correct_answer='3624' AND explanation='Last=2, First=6, no wait... Let me recalculate: 3×1=3, 3-1=2, 2×1=2, last=1 → but not 4 digits. Try: 6521 (6=3×2, 5=6-1, 2=2×1, 1). Actually: 3624';
UPDATE questions SET topic_id=(SELECT e.t FROM _migration_267_expected e WHERE e.q=questions.id)
WHERE topic_id IS NULL AND id IN (SELECT q FROM _migration_267_expected);
DROP TABLE _migration_267_expected;
DROP TABLE _migration_267_guard;
