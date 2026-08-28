-- Rollback 270: restore only exact ledger-backed NSMQ source values.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS _rollback_270_expected(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT NOT NULL);
DELETE FROM _rollback_270_expected;
INSERT INTO _rollback_270_expected VALUES
  ('nsmq_phy_r1_004','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_005','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_006','subj_nsmq_physics','round_one','topic_modern_physics'),
  ('nsmq_phy_r1_007','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_008','subj_nsmq_physics','round_one','topic_electricity'),
  ('nsmq_phy_r1_009','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_010','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_011','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_012','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_013','subj_nsmq_physics','round_one','topic_electricity'),
  ('nsmq_phy_r1_014','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_015','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_016','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_017','subj_nsmq_physics','round_one','topic_electricity'),
  ('nsmq_phy_r1_018','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_019','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_020','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_021','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_022','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_023','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_024','subj_nsmq_physics','round_one','topic_mechanics'),
  ('nsmq_phy_r1_025','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_026','subj_nsmq_physics','round_one','topic_electricity'),
  ('nsmq_phy_r1_027','subj_nsmq_physics','round_one','topic_electricity'),
  ('nsmq_phy_r1_028','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_029','subj_nsmq_physics','round_one','topic_waves'),
  ('nsmq_phy_r1_030','subj_nsmq_physics','round_one','topic_electricity'),
  ('nsmq_phy_sr_001','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_002','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phy_sr_003','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_004','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_005','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phy_sr_006','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_007','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_008','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phy_sr_009','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phy_sr_010','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_011','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phy_sr_012','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phy_sr_013','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phy_sr_014','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_015','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phy_sr_016','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phy_sr_017','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_018','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_019','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phy_sr_020','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_021','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_sr_022','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phy_sr_023','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phy_sr_024','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phy_sr_025','subj_nsmq_physics','speed_race','topic_waves'),
  ('q_speed_003','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phy_tf_001','subj_nsmq_physics','true_false','topic_waves'),
  ('nsmq_phy_tf_002','subj_nsmq_physics','true_false','topic_mechanics'),
  ('nsmq_phy_tf_003','subj_nsmq_physics','true_false','topic_waves'),
  ('nsmq_phy_tf_004','subj_nsmq_physics','true_false','topic_mechanics'),
  ('nsmq_phy_tf_005','subj_nsmq_physics','true_false','topic_electricity'),
  ('nsmq_phy_tf_006','subj_nsmq_physics','true_false','topic_electricity'),
  ('nsmq_phy_tf_007','subj_nsmq_physics','true_false','topic_mechanics'),
  ('nsmq_phy_tf_008','subj_nsmq_physics','true_false','topic_waves'),
  ('nsmq_phy_tf_009','subj_nsmq_physics','true_false','topic_waves'),
  ('nsmq_phy_tf_010','subj_nsmq_physics','true_false','topic_electricity'),
  ('nsmq_phy_tf_011','subj_nsmq_physics','true_false','topic_mechanics'),
  ('nsmq_phy_tf_012','subj_nsmq_physics','true_false','topic_mechanics'),
  ('nsmq_phy_tf_013','subj_nsmq_physics','true_false','topic_mechanics'),
  ('nsmq_phy_tf_014','subj_nsmq_physics','true_false','topic_waves'),
  ('nsmq_phy_tf_015','subj_nsmq_physics','true_false','topic_modern_physics'),
  ('nsmq_phy_tf_016','subj_nsmq_physics','true_false','topic_electricity'),
  ('nsmq_phy_tf_017','subj_nsmq_physics','true_false','topic_mechanics'),
  ('nsmq_phy_tf_018','subj_nsmq_physics','true_false','topic_mechanics'),
  ('nsmq_phy_tf_019','subj_nsmq_physics','true_false','topic_waves'),
  ('nsmq_phy_tf_020','subj_nsmq_physics','true_false','topic_electricity');
CREATE TABLE IF NOT EXISTS _rollback_270_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_270_guard;
INSERT INTO _rollback_270_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _rollback_270_expected)=73
  AND (SELECT COUNT(*) FROM questions q JOIN _rollback_270_expected e ON e.q=q.id WHERE q.subject_id IS e.s AND q.round_type IS e.r)=73
  AND NOT EXISTS (SELECT 1 FROM _rollback_270_expected e LEFT JOIN topics t ON t.id=e.t WHERE
    (e.t NOT IN ('topic_nsmq_math_general_reasoning','topic_nsmq_math_numeration','topic_nsmq_math_sets','topic_nsmq_chem_environmental') AND (t.id IS NULL OR t.subject_id IS NOT e.s))
    OR (e.t IN ('topic_nsmq_math_general_reasoning','topic_nsmq_math_numeration','topic_nsmq_math_sets','topic_nsmq_chem_environmental') AND e.s IS NOT CASE e.t WHEN 'topic_nsmq_math_general_reasoning' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_math_numeration' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_math_sets' THEN 'subj_nsmq_math' WHEN 'topic_nsmq_chem_environmental' THEN 'subj_nsmq_chemistry' END))
  AND 1=1
  AND (
    ((SELECT COUNT(*) FROM questions q JOIN _rollback_270_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS e.t)=73
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='270_nsmq_topic_remediation_part_4')=73
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _rollback_270_expected e ON e.q=l.entity_id
    WHERE l.migration_id='270_nsmq_topic_remediation_part_4' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS e.t)=73
      AND (SELECT COUNT(*) FROM topics t WHERE (t.id='topic_nsmq_math_general_reasoning' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='General Reasoning' AND t.slug='general-reasoning' AND t.description='Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=6 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_numeration' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Numeration & Number Systems' AND t.slug='numeration-number-systems' AND t.description='Number representation, notation, bases and number-system conventions.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_sets' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Sets' AND t.slug='sets' AND t.description='Set notation, membership, subsets, operations and related reasoning.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=8 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_chem_environmental' AND t.subject_id='subj_nsmq_chemistry' AND t.parent_id IS NULL AND t.name='Environmental Chemistry' AND t.slug='environmental-chemistry' AND t.description='Chemical processes and substances affecting the atmosphere and environment.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z'))=4)
    OR
    ((SELECT COUNT(*) FROM questions q JOIN _rollback_270_expected e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS NULL)=73
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='270_nsmq_topic_remediation_part_4')=0
      AND (SELECT COUNT(*) FROM topics t WHERE (t.id='topic_nsmq_math_general_reasoning' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='General Reasoning' AND t.slug='general-reasoning' AND t.description='Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=6 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_numeration' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Numeration & Number Systems' AND t.slug='numeration-number-systems' AND t.description='Number representation, notation, bases and number-system conventions.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_math_sets' AND t.subject_id='subj_nsmq_math' AND t.parent_id IS NULL AND t.name='Sets' AND t.slug='sets' AND t.description='Set notation, membership, subsets, operations and related reasoning.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=8 AND t.created_at='2026-08-26T00:00:00.000Z') OR (t.id='topic_nsmq_chem_environmental' AND t.subject_id='subj_nsmq_chemistry' AND t.parent_id IS NULL AND t.name='Environmental Chemistry' AND t.slug='environmental-chemistry' AND t.description='Chemical processes and substances affecting the atmosphere and environment.' AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=7 AND t.created_at='2026-08-26T00:00:00.000Z'))=4)
  )
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM _rollback_270_expected e JOIN question_bank_remediation_log l ON l.migration_id='270_nsmq_topic_remediation_part_4' AND l.entity_type='question' AND l.entity_id=e.q AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=questions.topic_id WHERE e.q=questions.id);
DELETE FROM question_bank_remediation_log WHERE migration_id='270_nsmq_topic_remediation_part_4';
DROP TABLE _rollback_270_expected;
DROP TABLE _rollback_270_guard;
