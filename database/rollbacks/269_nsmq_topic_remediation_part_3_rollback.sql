-- Rollback 269: restore only exact ledger-backed NSMQ source values.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS _rollback_269_expected(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT);
DELETE FROM _rollback_269_expected;
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
INSERT INTO _rollback_269_expected
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
CREATE TABLE IF NOT EXISTS _rollback_269_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_269_guard;
INSERT INTO _rollback_269_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _rollback_269_expected)=100
  AND (SELECT COUNT(*) FROM questions q JOIN _rollback_269_expected e ON e.q=q.id WHERE q.subject_id IS e.s AND q.round_type IS e.r)=100
  AND NOT EXISTS (SELECT 1 FROM _rollback_269_expected WHERE t IS NULL)
  AND NOT EXISTS (SELECT 1 FROM _rollback_269_expected e LEFT JOIN topics t ON t.id=e.t WHERE
    (e.t NOT IN ('topic_nsmq_math_general_reasoning','topic_nsmq_math_numeration','topic_nsmq_math_sets','topic_nsmq_chem_environmental') AND (t.id IS NULL OR t.subject_id IS NOT e.s))
    OR (e.t IN ('topic_nsmq_math_general_reasoning','topic_nsmq_math_numeration','topic_nsmq_math_sets','topic_nsmq_chem_environmental') AND e.s IS NOT CASE e.t WHEN 'topic_nsmq_math_general_reasoning' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_math_numeration' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_math_sets' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_chem_environmental' THEN 'subj_nsmq_chemistry' END))
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id IN ('270_nsmq_topic_remediation_part_4'))=0
  AND (
    ((SELECT COUNT(*) FROM questions q JOIN _rollback_269_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS e.t)=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='269_nsmq_topic_remediation_part_3')=100
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _rollback_269_expected e ON e.q=l.entity_id
    WHERE l.migration_id='269_nsmq_topic_remediation_part_3' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS e.t)=100
      AND (SELECT COUNT(*) FROM topics t WHERE (t.id='topic_nsmq_math_general_reasoning' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='General Reasoning' AND t.slug='general-reasoning' AND t.description='Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=6 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_numeration' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Numeration & Number Systems' AND t.slug='numeration-number-systems' AND t.description='Number representation, notation, bases and number-system conventions.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_sets' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Sets' AND t.slug='sets' AND t.description='Set notation, membership, subsets, operations and related reasoning.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=8 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_chem_environmental' AND t.subject_id='subj_nsmq_chemistry' AND t.parent_id IS NULL AND t.name='Environmental Chemistry' AND t.slug='environmental-chemistry' AND t.description='Chemical processes and substances affecting the atmosphere and environment.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z'))=4)
    OR
    ((SELECT COUNT(*) FROM questions q JOIN _rollback_269_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS NULL)=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='269_nsmq_topic_remediation_part_3')=0
      AND (SELECT COUNT(*) FROM topics t WHERE (t.id='topic_nsmq_math_general_reasoning' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='General Reasoning' AND t.slug='general-reasoning' AND t.description='Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=6 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_numeration' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Numeration & Number Systems' AND t.slug='numeration-number-systems' AND t.description='Number representation, notation, bases and number-system conventions.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_sets' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Sets' AND t.slug='sets' AND t.description='Set notation, membership, subsets, operations and related reasoning.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=8 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_chem_environmental' AND t.subject_id='subj_nsmq_chemistry' AND t.parent_id IS NULL AND t.name='Environmental Chemistry' AND t.slug='environmental-chemistry' AND t.description='Chemical processes and substances affecting the atmosphere and environment.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z'))=4)
  )
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM _rollback_269_expected e JOIN question_bank_remediation_log l ON l.migration_id='269_nsmq_topic_remediation_part_3' AND l.entity_type='question' AND l.entity_id=e.q AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=questions.topic_id WHERE e.q=questions.id);
DELETE FROM question_bank_remediation_log WHERE migration_id='269_nsmq_topic_remediation_part_3';
DROP TABLE _rollback_269_expected;
DROP TABLE _rollback_269_guard;
