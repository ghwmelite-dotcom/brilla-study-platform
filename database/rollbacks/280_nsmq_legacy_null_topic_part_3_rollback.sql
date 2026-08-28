-- Rollback 280: restore exact ledger-backed legacy NSMQ topic values to NULL.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS _nsmq_legacy_rb_280_expected(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT NOT NULL);
DELETE FROM _nsmq_legacy_rb_280_expected;
INSERT INTO _nsmq_legacy_rb_280_expected VALUES
  ('nsmq_math_sr_037','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_038','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_039','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_040','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_041','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_042','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_043','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_044','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_045','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_046','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_047','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_048','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_049','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_050','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_051','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_052','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_053','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_054','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_055','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_056','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_057','subj_nsmq_math','speed_race','topic_statistics'),
  ('nsmq_math_sr_058','subj_nsmq_math','speed_race','topic_statistics'),
  ('nsmq_math_sr_059','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_060','subj_nsmq_math','speed_race','topic_statistics'),
  ('nsmq_math_sr_061','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_062','subj_nsmq_math','speed_race','topic_statistics'),
  ('nsmq_math_sr_063','subj_nsmq_math','speed_race','topic_statistics'),
  ('nsmq_math_sr_064','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_065','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_066','subj_nsmq_math','speed_race','topic_trigonometry'),
  ('nsmq_math_sr_067','subj_nsmq_math','speed_race','topic_trigonometry'),
  ('nsmq_math_sr_068','subj_nsmq_math','speed_race','topic_trigonometry'),
  ('nsmq_math_sr_069','subj_nsmq_math','speed_race','topic_trigonometry'),
  ('nsmq_math_sr_070','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_071','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_072','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_073','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_074','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_075','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_phys_sr_027','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phys_sr_028','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phys_sr_029','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phys_sr_030','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phys_sr_031','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phys_sr_032','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phys_sr_033','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phys_sr_034','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phys_sr_035','subj_nsmq_physics','speed_race','topic_mechanics'),
  ('nsmq_phys_sr_036','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_037','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_038','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_039','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_040','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_041','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_042','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_043','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_044','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_045','subj_nsmq_physics','speed_race','topic_waves'),
  ('nsmq_phys_sr_046','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_047','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_048','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_049','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_050','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_051','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_052','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_053','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_054','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_055','subj_nsmq_physics','speed_race','topic_electricity'),
  ('nsmq_phys_sr_056','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_057','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_058','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_059','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_060','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_061','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_062','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_063','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_064','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_065','subj_nsmq_physics','speed_race','topic_thermodynamics'),
  ('nsmq_phys_sr_066','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phys_sr_067','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phys_sr_068','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phys_sr_069','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phys_sr_070','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phys_sr_071','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phys_sr_072','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phys_sr_073','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phys_sr_074','subj_nsmq_physics','speed_race','topic_modern_physics'),
  ('nsmq_phys_sr_075','subj_nsmq_physics','speed_race','topic_modern_physics');
CREATE TABLE IF NOT EXISTS _nsmq_legacy_rb_280_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _nsmq_legacy_rb_280_guard;
INSERT INTO _nsmq_legacy_rb_280_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _nsmq_legacy_rb_280_expected)=88
  AND (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_rb_280_expected e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=88
  AND (1=1)
  AND ((
    (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_rb_280_expected e ON e.q=q.id WHERE q.topic_id=e.t)=88
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='280_nsmq_legacy_null_topic_part_3')=88
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _nsmq_legacy_rb_280_expected e ON e.q=l.entity_id
    WHERE l.migration_id='280_nsmq_legacy_null_topic_part_3' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=e.t)=88
  ) OR (
    (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_rb_280_expected e ON e.q=q.id WHERE q.topic_id IS NULL)=88
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='280_nsmq_legacy_null_topic_part_3')=0
  ))
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL WHERE EXISTS (SELECT 1 FROM _nsmq_legacy_rb_280_expected e JOIN question_bank_remediation_log l ON l.migration_id='280_nsmq_legacy_null_topic_part_3' AND l.entity_type='question' AND l.entity_id=e.q AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=questions.topic_id WHERE e.q=questions.id);
DELETE FROM question_bank_remediation_log WHERE migration_id='280_nsmq_legacy_null_topic_part_3';
DROP TABLE _nsmq_legacy_rb_280_expected;
DROP TABLE _nsmq_legacy_rb_280_guard;
