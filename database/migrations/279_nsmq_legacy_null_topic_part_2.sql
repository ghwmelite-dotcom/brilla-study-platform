-- 279: legacy NSMQ null-topic remediation part 2/3 (90 exact mappings).
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS _nsmq_legacy_279_expected(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT NOT NULL);
DELETE FROM _nsmq_legacy_279_expected;
INSERT INTO _nsmq_legacy_279_expected VALUES
  ('nsmq_chem_sr_016','subj_nsmq_chemistry','speed_race','topic_bonding'),
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
  ('nsmq_math_sr_036','subj_nsmq_math','speed_race','topic_geometry');
CREATE TABLE IF NOT EXISTS _nsmq_legacy_279_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _nsmq_legacy_279_guard;
INSERT INTO _nsmq_legacy_279_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM _nsmq_legacy_279_expected)=90
  AND (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_279_expected e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=90
  AND NOT EXISTS (SELECT 1 FROM _nsmq_legacy_279_expected e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id<>'exam_nsmq' OR s.is_active<>1)
  AND NOT EXISTS (SELECT 1 FROM _nsmq_legacy_279_expected e LEFT JOIN topics t ON t.id=e.t WHERE t.id IS NULL OR t.subject_id<>e.s)
  AND ((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='278_nsmq_legacy_null_topic_part_1')=90)
  AND ((
    (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_279_expected e ON e.q=q.id WHERE q.topic_id IS NULL)=90
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='279_nsmq_legacy_null_topic_part_2')=0
  ) OR (
    (SELECT COUNT(*) FROM questions q JOIN _nsmq_legacy_279_expected e ON e.q=q.id WHERE q.topic_id=e.t)=90
    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='279_nsmq_legacy_null_topic_part_2')=90
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _nsmq_legacy_279_expected e ON e.q=l.entity_id
    WHERE l.migration_id='279_nsmq_legacy_null_topic_part_2' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=e.t)=90
  ))
  AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id<>t.subject_id)
THEN 1 ELSE 0 END;
INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT '279_nsmq_legacy_null_topic_part_2','question',e.q,'topic_id',NULL,e.t FROM _nsmq_legacy_279_expected e JOIN questions q ON q.id=e.q WHERE q.topic_id IS NULL;
UPDATE questions SET topic_id=(SELECT e.t FROM _nsmq_legacy_279_expected e WHERE e.q=questions.id) WHERE topic_id IS NULL AND id IN (SELECT q FROM _nsmq_legacy_279_expected);
DROP TABLE _nsmq_legacy_279_expected;
DROP TABLE _nsmq_legacy_279_guard;
