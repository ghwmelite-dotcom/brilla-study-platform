-- 269: NSMQ null-topic remediation part 3/4 (100 exact mappings).
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS _migration_269_expected(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT);
DELETE FROM _migration_269_expected;
WITH source(q,s,r,k) AS (VALUES ('nsmq_math_rid_007','subj_nsmq_math','riddles','topic_algebra'),
  ('nsmq_math_rid_008','subj_nsmq_math','riddles','topic_algebra'),
  ('nsmq_math_rid_009','subj_nsmq_math','riddles','topic_nsmq_math_general_reasoning'),
  ('nsmq_math_rid_010','subj_nsmq_math','riddles','topic_nsmq_math_general_reasoning'),
  ('nsmq_math_rid_011','subj_nsmq_math','riddles','topic_nsmq_math_general_reasoning'),
  ('nsmq_math_rid_013','subj_nsmq_math','riddles','topic_nsmq_math_general_reasoning'),
  ('nsmq_math_rid_014','subj_nsmq_math','riddles','topic_algebra'),
  ('nsmq_math_rid_015','subj_nsmq_math','riddles','topic_nsmq_math_numeration'),
  ('nsmq_math_r1_001','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_002','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_003','subj_nsmq_math','round_one','topic_geometry'),
  ('nsmq_math_r1_004','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_005','subj_nsmq_math','round_one','topic_calculus'),
  ('nsmq_math_r1_006','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_007','subj_nsmq_math','round_one','topic_geometry'),
  ('nsmq_math_r1_008','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_009','subj_nsmq_math','round_one','topic_statistics'),
  ('nsmq_math_r1_010','subj_nsmq_math','round_one','topic_trigonometry'),
  ('nsmq_math_r1_011','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_012','subj_nsmq_math','round_one','topic_statistics'),
  ('nsmq_math_r1_013','subj_nsmq_math','round_one','topic_geometry'),
  ('nsmq_math_r1_014','subj_nsmq_math','round_one','topic_calculus'),
  ('nsmq_math_r1_015','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_016','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_017','subj_nsmq_math','round_one','topic_statistics'),
  ('nsmq_math_r1_018','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_019','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_020','subj_nsmq_math','round_one','topic_trigonometry'),
  ('nsmq_math_r1_021','subj_nsmq_math','round_one','topic_geometry'),
  ('nsmq_math_r1_022','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_023','subj_nsmq_math','round_one','topic_quadratic'),
  ('nsmq_math_r1_024','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_025','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_026','subj_nsmq_math','round_one','topic_geometry'),
  ('nsmq_math_r1_027','subj_nsmq_math','round_one','topic_geometry'),
  ('nsmq_math_r1_028','subj_nsmq_math','round_one','topic_statistics'),
  ('nsmq_math_r1_029','subj_nsmq_math','round_one','topic_algebra'),
  ('nsmq_math_r1_030','subj_nsmq_math','round_one','topic_trigonometry'),
  ('nsmq_math_sr_021','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_022','subj_nsmq_math','speed_race','topic_nsmq_math_numeration'),
  ('nsmq_math_sr_023','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_024','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_025','subj_nsmq_math','speed_race','topic_statistics'),
  ('q_speed_002','subj_nsmq_math','speed_race','topic_algebra'),
  ('q_speed_006','subj_nsmq_math','speed_race','topic_trigonometry'),
  ('nsmq_math_tf_001','subj_nsmq_math','true_false','topic_algebra'),
  ('nsmq_math_tf_002','subj_nsmq_math','true_false','topic_algebra'),
  ('nsmq_math_tf_003','subj_nsmq_math','true_false','topic_geometry'),
  ('nsmq_math_tf_004','subj_nsmq_math','true_false','topic_algebra'),
  ('nsmq_math_tf_005','subj_nsmq_math','true_false','topic_calculus'),
  ('nsmq_math_tf_006','subj_nsmq_math','true_false','topic_geometry'),
  ('nsmq_math_tf_007','subj_nsmq_math','true_false','topic_algebra'),
  ('nsmq_math_tf_008','subj_nsmq_math','true_false','topic_algebra'),
  ('nsmq_math_tf_009','subj_nsmq_math','true_false','topic_algebra'),
  ('nsmq_math_tf_010','subj_nsmq_math','true_false','topic_geometry'),
  ('nsmq_math_tf_011','subj_nsmq_math','true_false','topic_statistics'),
  ('nsmq_math_tf_012','subj_nsmq_math','true_false','topic_trigonometry'),
  ('nsmq_math_tf_013','subj_nsmq_math','true_false','topic_algebra'),
  ('nsmq_math_tf_014','subj_nsmq_math','true_false','topic_statistics'),
  ('nsmq_math_tf_015','subj_nsmq_math','true_false','topic_geometry'),
  ('nsmq_math_tf_016','subj_nsmq_math','true_false','topic_geometry'),
  ('nsmq_math_tf_017','subj_nsmq_math','true_false','topic_calculus'),
  ('nsmq_math_tf_018','subj_nsmq_math','true_false','topic_geometry'),
  ('nsmq_math_tf_019','subj_nsmq_math','true_false','topic_algebra'),
  ('nsmq_math_tf_020','subj_nsmq_math','true_false','topic_nsmq_math_sets'),
  ('nsmq_phy_pod_001','subj_nsmq_physics','problem_of_day','topic_mechanics'),
  ('nsmq_phy_pod_002','subj_nsmq_physics','problem_of_day','topic_mechanics'),
  ('nsmq_phy_pod_003','subj_nsmq_physics','problem_of_day','topic_electricity'),
  ('nsmq_phy_pod_004','subj_nsmq_physics','problem_of_day','topic_waves'),
  ('nsmq_phy_pod_005','subj_nsmq_physics','problem_of_day','topic_electricity'),
  ('nsmq_phy_pod_006','subj_nsmq_physics','problem_of_day','topic_mechanics'),
  ('nsmq_phy_pod_007','subj_nsmq_physics','problem_of_day','topic_electricity'),
  ('nsmq_phy_pod_008','subj_nsmq_physics','problem_of_day','topic_waves'),
  ('nsmq_phy_pod_009','subj_nsmq_physics','problem_of_day','topic_mechanics'),
  ('nsmq_phy_pod_010','subj_nsmq_physics','problem_of_day','topic_electricity'),
  ('nsmq_phy_pod_011','subj_nsmq_physics','problem_of_day','topic_mechanics'),
  ('nsmq_phy_pod_012','subj_nsmq_physics','problem_of_day','topic_mechanics'),
  ('nsmq_phy_pod_013','subj_nsmq_physics','problem_of_day','topic_mechanics'),
  ('nsmq_phy_pod_014','subj_nsmq_physics','problem_of_day','topic_waves'),
  ('nsmq_phy_pod_015','subj_nsmq_physics','problem_of_day','topic_thermodynamics'),
  ('nsmq_phy_pod_016','subj_nsmq_physics','problem_of_day','topic_electricity'),
  ('nsmq_phy_pod_017','subj_nsmq_physics','problem_of_day','topic_mechanics'),
  ('nsmq_phy_pod_018','subj_nsmq_physics','problem_of_day','topic_electricity'),
  ('nsmq_phy_pod_019','subj_nsmq_physics','problem_of_day','topic_mechanics'),
  ('nsmq_phy_pod_020','subj_nsmq_physics','problem_of_day','topic_electricity'),
  ('nsmq_phy_rid_002','subj_nsmq_physics','riddles','topic_mechanics'),
  ('nsmq_phy_rid_004','subj_nsmq_physics','riddles','topic_thermodynamics'),
  ('nsmq_phy_rid_005','subj_nsmq_physics','riddles','topic_waves'),
  ('nsmq_phy_rid_006','subj_nsmq_physics','riddles','topic_mechanics'),
  ('nsmq_phy_rid_007','subj_nsmq_physics','riddles','topic_mechanics'),
  ('nsmq_phy_rid_008','subj_nsmq_physics','riddles','topic_electricity'),
  ('nsmq_phy_rid_009','subj_nsmq_physics','riddles','topic_modern_physics'),
  ('nsmq_phy_rid_010','subj_nsmq_physics','riddles','topic_mechanics'),
  ('nsmq_phy_rid_011','subj_nsmq_physics','riddles','topic_waves'),
  ('nsmq_phy_rid_013','subj_nsmq_physics','riddles','topic_electricity'),
  ('nsmq_phy_rid_014','subj_nsmq_physics','riddles','topic_mechanics'),
  ('nsmq_phy_rid_015','subj_nsmq_physics','riddles','topic_waves'),
  ('nsmq_phy_r1_001','subj_nsmq_physics','round_one','topic_electricity'),
  ('nsmq_phy_r1_002','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_003','subj_nsmq_physics','round_one','topic_mechanics'))
INSERT INTO _migration_269_expected
SELECT source.q,source.s,source.r,coalesce((
  SELECT MIN(t.id) FROM topics t
  JOIN subjects s ON s.id=t.subject_id
  WHERE t.id IN (source.k,CASE source.s
    WHEN 'subj_nsmq_math' THEN 'topic_nsmq_math_'||substr(source.k,7)
    WHEN 'subj_nsmq_physics' THEN 'topic_nsmq_phys_'||substr(source.k,7)
    WHEN 'subj_nsmq_chemistry' THEN 'topic_nsmq_chem_'||substr(source.k,7)
    WHEN 'subj_nsmq_biology' THEN 'topic_nsmq_bio_'||substr(source.k,7)
    ELSE source.k END) AND t.subject_id=source.s
    AND s.exam_type_id='exam_nsmq' AND s.is_active=1
  HAVING COUNT(*)=1
),NULL) FROM source;
CREATE TABLE IF NOT EXISTS _migration_269_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _migration_269_guard;
INSERT INTO _migration_269_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _migration_269_expected)=100
  AND (SELECT COUNT(*) FROM questions q JOIN _migration_269_expected e ON e.q=q.id)=100
  AND NOT EXISTS (SELECT 1 FROM _migration_269_expected WHERE t IS NULL)
  AND NOT EXISTS (SELECT 1 FROM _migration_269_expected e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id IS NOT 'exam_nsmq' OR s.is_active<>1)
  AND ((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='267_nsmq_topic_remediation_part_1')=103
      AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id JOIN topics t ON t.id=l.new_value
        WHERE l.migration_id='267_nsmq_topic_remediation_part_1' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND q.topic_id IS l.new_value AND q.subject_id IS t.subject_id)=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='267_nsmq_topic_remediation_part_1'
    AND entity_type='question' AND entity_id='nsmq_math_rid_012' AND (
      (field_name='question_text' AND old_value='I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What number am I?' AND new_value='I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What numbers can I be?')
      OR (field_name='correct_answer' AND old_value='3624' AND new_value='6542 or 9863')
      OR (field_name='explanation' AND old_value='Last=2, First=6, no wait... Let me recalculate: 3×1=3, 3-1=2, 2×1=2, last=1 → but not 4 digits. Try: 6521 (6=3×2, 5=6-1, 2=2×1, 1). Actually: 3624' AND new_value='Let the last digit be d, so the digits are 3d, 3d−1, 2d, d. The only possible last digits are 1, 2, and 3. When d=1, the digit 2 repeats, so it is invalid. When d=2, the number is 6542; when d=3, the number is 9863. Both satisfy every stated constraint.')
    ))=3
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='268_nsmq_topic_remediation_part_2')=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id JOIN topics t ON t.id=l.new_value
        WHERE l.migration_id='268_nsmq_topic_remediation_part_2' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND q.topic_id IS l.new_value AND q.subject_id IS t.subject_id)=100)
  AND (
    ((SELECT COUNT(*) FROM questions q JOIN _migration_269_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS NULL)=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='269_nsmq_topic_remediation_part_3')=0
      AND (SELECT COUNT(*) FROM topics t WHERE (t.id='topic_nsmq_math_general_reasoning' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='General Reasoning' AND t.slug='general-reasoning' AND t.description='Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=6 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_numeration' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Numeration & Number Systems' AND t.slug='numeration-number-systems' AND t.description='Number representation, notation, bases and number-system conventions.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_sets' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Sets' AND t.slug='sets' AND t.description='Set notation, membership, subsets, operations and related reasoning.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=8 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_chem_environmental' AND t.subject_id='subj_nsmq_chemistry' AND t.parent_id IS NULL AND t.name='Environmental Chemistry' AND t.slug='environmental-chemistry' AND t.description='Chemical processes and substances affecting the atmosphere and environment.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z'))=4)
    OR
    ((SELECT COUNT(*) FROM questions q JOIN _migration_269_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS e.t)=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='269_nsmq_topic_remediation_part_3')=100
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _migration_269_expected e ON e.q=l.entity_id
    WHERE l.migration_id='269_nsmq_topic_remediation_part_3' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS e.t)=100
      AND (SELECT COUNT(*) FROM topics t WHERE (t.id='topic_nsmq_math_general_reasoning' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='General Reasoning' AND t.slug='general-reasoning' AND t.description='Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=6 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_numeration' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Numeration & Number Systems' AND t.slug='numeration-number-systems' AND t.description='Number representation, notation, bases and number-system conventions.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_sets' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Sets' AND t.slug='sets' AND t.description='Set notation, membership, subsets, operations and related reasoning.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=8 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_chem_environmental' AND t.subject_id='subj_nsmq_chemistry' AND t.parent_id IS NULL AND t.name='Environmental Chemistry' AND t.slug='environmental-chemistry' AND t.description='Chemical processes and substances affecting the atmosphere and environment.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z'))=4)
  )
  AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT '269_nsmq_topic_remediation_part_3','question',e.q,'topic_id',NULL,e.t FROM _migration_269_expected e JOIN questions q ON q.id=e.q WHERE q.topic_id IS NULL;
UPDATE questions SET topic_id=(SELECT e.t FROM _migration_269_expected e WHERE e.q=questions.id)
WHERE topic_id IS NULL AND id IN (SELECT q FROM _migration_269_expected);
DROP TABLE _migration_269_expected;
DROP TABLE _migration_269_guard;
