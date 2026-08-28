-- Rollback 279: restore exact ledger-backed legacy NSMQ topic values to NULL.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS _nsmq_legacy_rb_279_expected(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,k TEXT NOT NULL,t TEXT);
DELETE FROM _nsmq_legacy_rb_279_expected;
WITH source(q,s,r,k) AS (VALUES ('nsmq_chem_sr_016','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_017','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_018','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_019','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_020','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_021','subj_nsmq_chemistry','speed_race','topic_electrochemistry'),
  ('nsmq_chem_sr_022','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_023','subj_nsmq_chemistry','speed_race','topic_stoichiometry'),
  ('nsmq_chem_sr_024','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_025','subj_nsmq_chemistry','speed_race','topic_electrochemistry'),
  ('nsmq_chem_sr_026','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_027','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_028','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_029','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_030','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_031','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_032','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_033','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_034','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_035','subj_nsmq_chemistry','speed_race','topic_atomic'),
  ('nsmq_chem_sr_036','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_037','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_038','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_039','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_040','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_041','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_042','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_043','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_044','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_045','subj_nsmq_chemistry','speed_race','topic_bonding'),
  ('nsmq_chem_sr_046','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_047','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_048','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_049','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_050','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_051','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_052','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_053','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_054','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_055','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_056','subj_nsmq_chemistry','speed_race','topic_stoichiometry'),
  ('nsmq_chem_sr_057','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_058','subj_nsmq_chemistry','speed_race','topic_electrochemistry'),
  ('nsmq_chem_sr_059','subj_nsmq_chemistry','speed_race','topic_electrochemistry'),
  ('nsmq_chem_sr_060','subj_nsmq_chemistry','speed_race','topic_stoichiometry'),
  ('nsmq_chem_sr_061','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_062','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_063','subj_nsmq_chemistry','speed_race','topic_equilibrium'),
  ('nsmq_chem_sr_064','subj_nsmq_chemistry','speed_race','topic_stoichiometry'),
  ('nsmq_chem_sr_065','subj_nsmq_chemistry','speed_race','topic_stoichiometry'),
  ('nsmq_chem_sr_066','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_067','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_068','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_069','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_070','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_071','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_072','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_073','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_074','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_chem_sr_075','subj_nsmq_chemistry','speed_race','topic_organic'),
  ('nsmq_math_sr_001','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_002','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_003','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_004','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_005','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_006','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_007','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_008','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_009','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_010','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_011','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_012','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_013','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_014','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_015','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_016','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_017','subj_nsmq_math','speed_race','topic_statistics'),
  ('nsmq_math_sr_018','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_019','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_020','subj_nsmq_math','speed_race','topic_geometry'),
  ('nsmq_math_sr_027','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_028','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_029','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_030','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_031','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_032','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_033','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_034','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_035','subj_nsmq_math','speed_race','topic_algebra'),
  ('nsmq_math_sr_036','subj_nsmq_math','speed_race','topic_geometry')),
candidates(k,s,t,p) AS (VALUES ('topic_atomic','subj_nsmq_chemistry','topic_nsmq_chem_atomic','0'),
  ('topic_atomic','subj_nsmq_chemistry','topic_atomic','1'),
  ('topic_bonding','subj_nsmq_chemistry','topic_nsmq_chem_bonding','0'),
  ('topic_bonding','subj_nsmq_chemistry','topic_bonding','1'),
  ('topic_electrochemistry','subj_nsmq_chemistry','topic_nsmq_chem_electrochemistry','0'),
  ('topic_electrochemistry','subj_nsmq_chemistry','topic_electrochemistry','1'),
  ('topic_equilibrium','subj_nsmq_chemistry','topic_nsmq_chem_equilibrium','0'),
  ('topic_equilibrium','subj_nsmq_chemistry','topic_equilibrium','1'),
  ('topic_organic','subj_nsmq_chemistry','topic_nsmq_chem_organic','0'),
  ('topic_organic','subj_nsmq_chemistry','topic_organic','1'),
  ('topic_stoichiometry','subj_nsmq_chemistry','topic_nsmq_chem_stoichiometry','0'),
  ('topic_stoichiometry','subj_nsmq_chemistry','topic_stoichiometry','1'),
  ('topic_algebra','subj_nsmq_math','topic_nsmq_math_algebra','0'),
  ('topic_algebra','subj_nsmq_math','topic_algebra','1'),
  ('topic_geometry','subj_nsmq_math','topic_nsmq_math_geometry','0'),
  ('topic_geometry','subj_nsmq_math','topic_geometry','1'),
  ('topic_statistics','subj_nsmq_math','topic_nsmq_math_statistics','0'),
  ('topic_statistics','subj_nsmq_math','topic_statistics','1'))
INSERT INTO _nsmq_legacy_rb_279_expected
SELECT source.q,source.s,source.r,source.k,(
  SELECT MIN(c.t) FROM candidates c
  JOIN topics t ON t.id=c.t AND t.subject_id=c.s
  JOIN subjects s ON s.id=t.subject_id
  WHERE c.k=source.k AND c.s=source.s AND s.exam_type_id='exam_nsmq' AND s.is_active=1
  HAVING COUNT(*)=1
) FROM source;
CREATE TABLE IF NOT EXISTS _nsmq_legacy_rb_279_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _nsmq_legacy_rb_279_guard;
INSERT INTO _nsmq_legacy_rb_279_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _nsmq_legacy_rb_279_expected)=90
  AND (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_rb_279_expected e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=90
  AND ((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id IN ('280_nsmq_legacy_null_topic_part_3'))=0)
  AND ((
    (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_rb_279_expected e ON e.q=q.id WHERE q.topic_id=e.t)=90
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='279_nsmq_legacy_null_topic_part_2')=90
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _nsmq_legacy_rb_279_expected e ON e.q=l.entity_id
    WHERE l.migration_id='279_nsmq_legacy_null_topic_part_2' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=e.t)=90
  ) OR (
    (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_rb_279_expected e ON e.q=q.id WHERE q.topic_id IS NULL)=90
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='279_nsmq_legacy_null_topic_part_2')=0
  ))
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL WHERE EXISTS (SELECT 1 FROM _nsmq_legacy_rb_279_expected e JOIN question_bank_remediation_log l ON l.migration_id='279_nsmq_legacy_null_topic_part_2' AND l.entity_type='question' AND l.entity_id=e.q AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=questions.topic_id WHERE e.q=questions.id);
DELETE FROM question_bank_remediation_log WHERE migration_id='279_nsmq_legacy_null_topic_part_2';
DROP TABLE _nsmq_legacy_rb_279_expected;
DROP TABLE _nsmq_legacy_rb_279_guard;
