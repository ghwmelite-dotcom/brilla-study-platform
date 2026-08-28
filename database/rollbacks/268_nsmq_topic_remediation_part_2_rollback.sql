-- Rollback 268: restore only exact ledger-backed NSMQ source values.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS _rollback_268_expected(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT NOT NULL);
DELETE FROM _rollback_268_expected;
INSERT INTO _rollback_268_expected VALUES
  ('nsmq_chem_pod_013','subj_nsmq_chemistry','problem_of_day','topic_atomic'),
  ('nsmq_chem_pod_014','subj_nsmq_chemistry','problem_of_day','topic_stoichiometry'),
  ('nsmq_chem_pod_015','subj_nsmq_chemistry','problem_of_day','topic_equilibrium'),
  ('nsmq_chem_pod_016','subj_nsmq_chemistry','problem_of_day','topic_equilibrium'),
  ('nsmq_chem_pod_017','subj_nsmq_chemistry','problem_of_day','topic_atomic'),
  ('nsmq_chem_pod_018','subj_nsmq_chemistry','problem_of_day','topic_equilibrium'),
  ('nsmq_chem_pod_019','subj_nsmq_chemistry','problem_of_day','topic_organic'),
  ('nsmq_chem_pod_020','subj_nsmq_chemistry','problem_of_day','topic_bonding'),
  ('nsmq_chem_rid_001','subj_nsmq_chemistry','riddles','topic_electrochemistry'),
  ('nsmq_chem_rid_002','subj_nsmq_chemistry','riddles','topic_organic'),
  ('nsmq_chem_rid_003','subj_nsmq_chemistry','riddles','topic_atomic'),
  ('nsmq_chem_rid_004','subj_nsmq_chemistry','riddles','topic_atomic'),
  ('nsmq_chem_rid_005','subj_nsmq_chemistry','riddles','topic_atomic'),
  ('nsmq_chem_rid_006','subj_nsmq_chemistry','riddles','topic_stoichiometry'),
  ('nsmq_chem_rid_007','subj_nsmq_chemistry','riddles','topic_bonding'),
  ('nsmq_chem_rid_008','subj_nsmq_chemistry','riddles','topic_atomic'),
  ('nsmq_chem_rid_009','subj_nsmq_chemistry','riddles','topic_atomic'),
  ('nsmq_chem_rid_010','subj_nsmq_chemistry','riddles','topic_bonding'),
  ('nsmq_chem_rid_011','subj_nsmq_chemistry','riddles','topic_equilibrium'),
  ('nsmq_chem_rid_012','subj_nsmq_chemistry','riddles','topic_atomic'),
  ('nsmq_chem_rid_013','subj_nsmq_chemistry','riddles','topic_equilibrium'),
  ('nsmq_chem_rid_014','subj_nsmq_chemistry','riddles','topic_bonding'),
  ('nsmq_chem_rid_015','subj_nsmq_chemistry','riddles','topic_atomic'),
  ('nsmq_chem_r1_001','subj_nsmq_chemistry','round_one','topic_atomic'),
  ('nsmq_chem_r1_002','subj_nsmq_chemistry','round_one','topic_stoichiometry'),
  ('nsmq_chem_r1_003','subj_nsmq_chemistry','round_one','topic_atomic'),
  ('nsmq_chem_r1_004','subj_nsmq_chemistry','round_one','topic_equilibrium'),
  ('nsmq_chem_r1_005','subj_nsmq_chemistry','round_one','topic_atomic'),
  ('nsmq_chem_r1_006','subj_nsmq_chemistry','round_one','topic_bonding'),
  ('nsmq_chem_r1_007','subj_nsmq_chemistry','round_one','topic_stoichiometry'),
  ('nsmq_chem_r1_008','subj_nsmq_chemistry','round_one','topic_bonding'),
  ('nsmq_chem_r1_009','subj_nsmq_chemistry','round_one','topic_bonding'),
  ('nsmq_chem_r1_010','subj_nsmq_chemistry','round_one','topic_stoichiometry'),
  ('nsmq_chem_r1_011','subj_nsmq_chemistry','round_one','topic_stoichiometry'),
  ('nsmq_chem_r1_012','subj_nsmq_chemistry','round_one','topic_atomic'),
  ('nsmq_chem_r1_013','subj_nsmq_chemistry','round_one','topic_stoichiometry'),
  ('nsmq_chem_r1_014','subj_nsmq_chemistry','round_one','topic_bonding'),
  ('nsmq_chem_r1_015','subj_nsmq_chemistry','round_one','topic_equilibrium'),
  ('nsmq_chem_r1_016','subj_nsmq_chemistry','round_one','topic_organic'),
  ('nsmq_chem_r1_017','subj_nsmq_chemistry','round_one','topic_atomic'),
  ('nsmq_chem_r1_018','subj_nsmq_chemistry','round_one','topic_electrochemistry'),
  ('nsmq_chem_r1_019','subj_nsmq_chemistry','round_one','topic_nsmq_chem_environmental'),
  ('nsmq_chem_r1_020','subj_nsmq_chemistry','round_one','topic_equilibrium'),
  ('nsmq_chem_r1_021','subj_nsmq_chemistry','round_one','topic_atomic'),
  ('nsmq_chem_r1_022','subj_nsmq_chemistry','round_one','topic_atomic'),
  ('nsmq_chem_r1_023','subj_nsmq_chemistry','round_one','topic_organic'),
  ('nsmq_chem_r1_024','subj_nsmq_chemistry','round_one','topic_stoichiometry'),
  ('nsmq_chem_r1_025','subj_nsmq_chemistry','round_one','topic_equilibrium'),
  ('nsmq_chem_r1_026','subj_nsmq_chemistry','round_one','topic_bonding'),
  ('nsmq_chem_r1_027','subj_nsmq_chemistry','round_one','topic_atomic'),
  ('nsmq_chem_r1_028','subj_nsmq_chemistry','round_one','topic_stoichiometry'),
  ('nsmq_chem_r1_029','subj_nsmq_chemistry','round_one','topic_atomic'),
  ('nsmq_chem_r1_030','subj_nsmq_chemistry','round_one','topic_stoichiometry'),
  ('q_speed_004','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_tf_001','subj_nsmq_chemistry','true_false','topic_atomic'),
  ('nsmq_chem_tf_002','subj_nsmq_chemistry','true_false','topic_atomic'),
  ('nsmq_chem_tf_003','subj_nsmq_chemistry','true_false','topic_equilibrium'),
  ('nsmq_chem_tf_004','subj_nsmq_chemistry','true_false','topic_bonding'),
  ('nsmq_chem_tf_005','subj_nsmq_chemistry','true_false','topic_atomic'),
  ('nsmq_chem_tf_006','subj_nsmq_chemistry','true_false','topic_equilibrium'),
  ('nsmq_chem_tf_007','subj_nsmq_chemistry','true_false','topic_atomic'),
  ('nsmq_chem_tf_008','subj_nsmq_chemistry','true_false','topic_electrochemistry'),
  ('nsmq_chem_tf_009','subj_nsmq_chemistry','true_false','topic_equilibrium'),
  ('nsmq_chem_tf_010','subj_nsmq_chemistry','true_false','topic_atomic'),
  ('nsmq_chem_tf_011','subj_nsmq_chemistry','true_false','topic_atomic'),
  ('nsmq_chem_tf_012','subj_nsmq_chemistry','true_false','topic_equilibrium'),
  ('nsmq_chem_tf_013','subj_nsmq_chemistry','true_false','topic_equilibrium'),
  ('nsmq_chem_tf_014','subj_nsmq_chemistry','true_false','topic_organic'),
  ('nsmq_chem_tf_015','subj_nsmq_chemistry','true_false','topic_equilibrium'),
  ('nsmq_chem_tf_016','subj_nsmq_chemistry','true_false','topic_bonding'),
  ('nsmq_chem_tf_017','subj_nsmq_chemistry','true_false','topic_stoichiometry'),
  ('nsmq_chem_tf_018','subj_nsmq_chemistry','true_false','topic_bonding'),
  ('nsmq_chem_tf_019','subj_nsmq_chemistry','true_false','topic_electrochemistry'),
  ('nsmq_chem_tf_020','subj_nsmq_chemistry','true_false','topic_equilibrium'),
  ('nsmq_math_pod_001','subj_nsmq_math','problem_of_day','topic_algebra'),
  ('nsmq_math_pod_002','subj_nsmq_math','problem_of_day','topic_algebra'),
  ('nsmq_math_pod_003','subj_nsmq_math','problem_of_day','topic_geometry'),
  ('nsmq_math_pod_004','subj_nsmq_math','problem_of_day','topic_statistics'),
  ('nsmq_math_pod_005','subj_nsmq_math','problem_of_day','topic_algebra'),
  ('nsmq_math_pod_006','subj_nsmq_math','problem_of_day','topic_geometry'),
  ('nsmq_math_pod_007','subj_nsmq_math','problem_of_day','topic_algebra'),
  ('nsmq_math_pod_008','subj_nsmq_math','problem_of_day','topic_statistics'),
  ('nsmq_math_pod_009','subj_nsmq_math','problem_of_day','topic_algebra'),
  ('nsmq_math_pod_010','subj_nsmq_math','problem_of_day','topic_geometry'),
  ('nsmq_math_pod_011','subj_nsmq_math','problem_of_day','topic_quadratic'),
  ('nsmq_math_pod_012','subj_nsmq_math','problem_of_day','topic_algebra'),
  ('nsmq_math_pod_013','subj_nsmq_math','problem_of_day','topic_geometry'),
  ('nsmq_math_pod_014','subj_nsmq_math','problem_of_day','topic_calculus'),
  ('nsmq_math_pod_015','subj_nsmq_math','problem_of_day','topic_geometry'),
  ('nsmq_math_pod_016','subj_nsmq_math','problem_of_day','topic_algebra'),
  ('nsmq_math_pod_017','subj_nsmq_math','problem_of_day','topic_statistics'),
  ('nsmq_math_pod_018','subj_nsmq_math','problem_of_day','topic_algebra'),
  ('nsmq_math_pod_019','subj_nsmq_math','problem_of_day','topic_geometry'),
  ('nsmq_math_pod_020','subj_nsmq_math','problem_of_day','topic_statistics'),
  ('nsmq_math_rid_001','subj_nsmq_math','riddles','topic_algebra'),
  ('nsmq_math_rid_002','subj_nsmq_math','riddles','topic_nsmq_math_general_reasoning'),
  ('nsmq_math_rid_003','subj_nsmq_math','riddles','topic_nsmq_math_general_reasoning'),
  ('nsmq_math_rid_004','subj_nsmq_math','riddles','topic_nsmq_math_general_reasoning'),
  ('nsmq_math_rid_005','subj_nsmq_math','riddles','topic_algebra'),
  ('nsmq_math_rid_006','subj_nsmq_math','riddles','topic_geometry');
CREATE TABLE IF NOT EXISTS _rollback_268_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_268_guard;
INSERT INTO _rollback_268_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _rollback_268_expected)=100
  AND (SELECT COUNT(*) FROM questions q JOIN _rollback_268_expected e ON e.q=q.id WHERE q.subject_id IS e.s AND q.round_type IS e.r)=100
  AND NOT EXISTS (SELECT 1 FROM _rollback_268_expected e LEFT JOIN topics t ON t.id=e.t WHERE
    (e.t NOT IN ('topic_nsmq_math_general_reasoning','topic_nsmq_math_numeration','topic_nsmq_math_sets','topic_nsmq_chem_environmental') AND (t.id IS NULL OR t.subject_id IS NOT e.s))
    OR (e.t IN ('topic_nsmq_math_general_reasoning','topic_nsmq_math_numeration','topic_nsmq_math_sets','topic_nsmq_chem_environmental') AND e.s IS NOT CASE e.t WHEN 'topic_nsmq_math_general_reasoning' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_math_numeration' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_math_sets' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_chem_environmental' THEN 'subj_nsmq_chemistry' END))
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id IN ('269_nsmq_topic_remediation_part_3','270_nsmq_topic_remediation_part_4'))=0
  AND (
    ((SELECT COUNT(*) FROM questions q JOIN _rollback_268_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS e.t)=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='268_nsmq_topic_remediation_part_2')=100
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _rollback_268_expected e ON e.q=l.entity_id
    WHERE l.migration_id='268_nsmq_topic_remediation_part_2' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS e.t)=100
      AND (SELECT COUNT(*) FROM topics t WHERE (t.id='topic_nsmq_math_general_reasoning' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='General Reasoning' AND t.slug='general-reasoning' AND t.description='Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=6 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_numeration' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Numeration & Number Systems' AND t.slug='numeration-number-systems' AND t.description='Number representation, notation, bases and number-system conventions.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_sets' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Sets' AND t.slug='sets' AND t.description='Set notation, membership, subsets, operations and related reasoning.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=8 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_chem_environmental' AND t.subject_id='subj_nsmq_chemistry' AND t.parent_id IS NULL AND t.name='Environmental Chemistry' AND t.slug='environmental-chemistry' AND t.description='Chemical processes and substances affecting the atmosphere and environment.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z'))=4)
    OR
    ((SELECT COUNT(*) FROM questions q JOIN _rollback_268_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS NULL)=100
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='268_nsmq_topic_remediation_part_2')=0
      AND (SELECT COUNT(*) FROM topics t WHERE (t.id='topic_nsmq_math_general_reasoning' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='General Reasoning' AND t.slug='general-reasoning' AND t.description='Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=6 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_numeration' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Numeration & Number Systems' AND t.slug='numeration-number-systems' AND t.description='Number representation, notation, bases and number-system conventions.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_sets' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Sets' AND t.slug='sets' AND t.description='Set notation, membership, subsets, operations and related reasoning.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=8 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_chem_environmental' AND t.subject_id='subj_nsmq_chemistry' AND t.parent_id IS NULL AND t.name='Environmental Chemistry' AND t.slug='environmental-chemistry' AND t.description='Chemical processes and substances affecting the atmosphere and environment.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z'))=4)
  )
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM _rollback_268_expected e JOIN question_bank_remediation_log l ON l.migration_id='268_nsmq_topic_remediation_part_2' AND l.entity_type='question' AND l.entity_id=e.q AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=questions.topic_id WHERE e.q=questions.id);
DELETE FROM question_bank_remediation_log WHERE migration_id='268_nsmq_topic_remediation_part_2';
DROP TABLE _rollback_268_expected;
DROP TABLE _rollback_268_guard;
