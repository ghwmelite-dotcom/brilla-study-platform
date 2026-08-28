-- Rollback 278: restore exact ledger-backed legacy NSMQ topic values to NULL.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS _nsmq_legacy_rb_278_expected(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,k TEXT NOT NULL,t TEXT);
DELETE FROM _nsmq_legacy_rb_278_expected;
WITH source(q,s,r,k) AS (VALUES ('nsmq_bio_sr_001','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_002','subj_nsmq_biology','speed_race','topic_biochemistry'),
  ('nsmq_bio_sr_003','subj_nsmq_biology','speed_race','topic_biochemistry'),
  ('nsmq_bio_sr_004','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_005','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_006','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_007','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_008','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_009','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_010','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_011','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_012','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_sr_013','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_014','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_015','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_016','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_sr_017','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_018','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_019','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_020','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_021','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_022','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_023','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_024','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_025','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_026','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_sr_027','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_sr_028','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_sr_029','subj_nsmq_biology','speed_race','topic_biochemistry'),
  ('nsmq_bio_sr_030','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_sr_031','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_sr_032','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_sr_033','subj_nsmq_biology','speed_race','topic_cells'),
  ('nsmq_bio_sr_034','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_035','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_036','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_037','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_038','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_039','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_040','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_041','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_042','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_043','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_044','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_045','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_046','subj_nsmq_biology','speed_race','topic_biochemistry'),
  ('nsmq_bio_sr_047','subj_nsmq_biology','speed_race','topic_biochemistry'),
  ('nsmq_bio_sr_048','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_049','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_050','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_051','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_052','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_053','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_054','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_055','subj_nsmq_biology','speed_race','topic_physiology'),
  ('nsmq_bio_sr_056','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_057','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_058','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_059','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_060','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_061','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_062','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_063','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_064','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_065','subj_nsmq_biology','speed_race','topic_genetics'),
  ('nsmq_bio_sr_066','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_067','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_068','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_069','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_070','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_071','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_072','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_073','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_074','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_bio_sr_075','subj_nsmq_biology','speed_race','topic_ecology'),
  ('nsmq_chem_sr_001','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_002','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_003','subj_nsmq_chemistry','speed_race','topic_stoichiometry'),
  ('nsmq_chem_sr_004','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_005','subj_nsmq_chemistry','speed_race','topic_stoichiometry'),
  ('nsmq_chem_sr_006','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_007','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_008','subj_nsmq_chemistry','speed_race','topic_nsmq_chem_environmental'),
  ('nsmq_chem_sr_009','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_010','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_011','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_012','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_013','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_014','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_015','subj_nsmq_chemistry','speed_race','topic_equilibrium')),
candidates(k,s,t,p) AS (VALUES ('topic_biochemistry','subj_nsmq_biology','topic_nsmq_bio_biochemistry','0'),
  ('topic_biochemistry','subj_nsmq_biology','topic_biochemistry','1'),
  ('topic_cells','subj_nsmq_biology','topic_nsmq_bio_cells','0'),
  ('topic_cells','subj_nsmq_biology','topic_cells','1'),
  ('topic_ecology','subj_nsmq_biology','topic_nsmq_bio_ecology','0'),
  ('topic_ecology','subj_nsmq_biology','topic_ecology','1'),
  ('topic_genetics','subj_nsmq_biology','topic_nsmq_bio_genetics','0'),
  ('topic_genetics','subj_nsmq_biology','topic_genetics','1'),
  ('topic_physiology','subj_nsmq_biology','topic_nsmq_bio_physiology','0'),
  ('topic_physiology','subj_nsmq_biology','topic_physiology','1'),
  ('topic_atomic','subj_nsmq_chemistry','topic_nsmq_chem_atomic','0'),
  ('topic_atomic','subj_nsmq_chemistry','topic_atomic','1'),
  ('topic_bonding','subj_nsmq_chemistry','topic_nsmq_chem_bonding','0'),
  ('topic_bonding','subj_nsmq_chemistry','topic_bonding','1'),
  ('topic_equilibrium','subj_nsmq_chemistry','topic_nsmq_chem_equilibrium','0'),
  ('topic_equilibrium','subj_nsmq_chemistry','topic_equilibrium','1'),
  ('topic_nsmq_chem_environmental','subj_nsmq_chemistry','topic_nsmq_chem_environmental','0'),
  ('topic_organic','subj_nsmq_chemistry','topic_nsmq_chem_organic','0'),
  ('topic_organic','subj_nsmq_chemistry','topic_organic','1'),
  ('topic_stoichiometry','subj_nsmq_chemistry','topic_nsmq_chem_stoichiometry','0'),
  ('topic_stoichiometry','subj_nsmq_chemistry','topic_stoichiometry','1'))
INSERT INTO _nsmq_legacy_rb_278_expected
SELECT source.q,source.s,source.r,source.k,(
  SELECT MIN(c.t) FROM candidates c
  JOIN topics t ON t.id=c.t AND t.subject_id=c.s
  JOIN subjects s ON s.id=t.subject_id
  WHERE c.k=source.k AND c.s=source.s AND s.exam_type_id='exam_nsmq' AND s.is_active=1
  HAVING COUNT(*)=1
) FROM source;
CREATE TABLE IF NOT EXISTS _nsmq_legacy_rb_278_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _nsmq_legacy_rb_278_guard;
INSERT INTO _nsmq_legacy_rb_278_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _nsmq_legacy_rb_278_expected)=90
  AND (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_rb_278_expected e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=90
  AND ((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id IN ('279_nsmq_legacy_null_topic_part_2','280_nsmq_legacy_null_topic_part_3'))=0)
  AND ((
    (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_rb_278_expected e ON e.q=q.id WHERE q.topic_id=e.t)=90
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='278_nsmq_legacy_null_topic_part_1')=90
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _nsmq_legacy_rb_278_expected e ON e.q=l.entity_id
    WHERE l.migration_id='278_nsmq_legacy_null_topic_part_1' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=e.t)=90
  ) OR (
    (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_rb_278_expected e ON e.q=q.id WHERE q.topic_id IS NULL)=90
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='278_nsmq_legacy_null_topic_part_1')=0
  ))
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL WHERE EXISTS (SELECT 1 FROM _nsmq_legacy_rb_278_expected e JOIN question_bank_remediation_log l ON l.migration_id='278_nsmq_legacy_null_topic_part_1' AND l.entity_type='question' AND l.entity_id=e.q AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=questions.topic_id WHERE e.q=questions.id);
DELETE FROM question_bank_remediation_log WHERE migration_id='278_nsmq_legacy_null_topic_part_1';
DROP TABLE _nsmq_legacy_rb_278_expected;
DROP TABLE _nsmq_legacy_rb_278_guard;
