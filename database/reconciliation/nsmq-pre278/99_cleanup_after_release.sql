-- Explicit post-release cleanup. Run only after canonical migrations 278-282 and their postflight pass.
PRAGMA foreign_keys=ON;
CREATE TABLE _npr_expected_guard(valid INTEGER NOT NULL CHECK(valid=1));
INSERT INTO _npr_expected_guard SELECT CASE WHEN (SELECT count(*) FROM _npr_expected_m)=268
  AND (SELECT count(*) FROM _npr_expected_q)=2
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_m e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=268
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_q e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=2
  AND NOT EXISTS(SELECT 1 FROM _npr_expected_m e LEFT JOIN topics t ON t.id=e.t WHERE t.id IS NULL OR t.subject_id<>e.s)
  AND (SELECT count(*) FROM topics t JOIN subjects s ON s.id=t.subject_id WHERE t.id='topic_nsmq_chem_atomic' AND t.subject_id='subj_nsmq_chemistry' AND s.exam_type_id='exam_nsmq' AND s.is_active=1)=1
  AND NOT EXISTS(SELECT 1 FROM (SELECT s FROM _npr_expected_m UNION SELECT s FROM _npr_expected_q) e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id<>'exam_nsmq' OR s.is_active<>1) AND (((SELECT count(*) FROM d1_migrations WHERE name IN ('278_nsmq_legacy_null_topic_part_1.sql','279_nsmq_legacy_null_topic_part_2.sql','280_nsmq_legacy_null_topic_part_3.sql','281_cambridge_legacy_topic_remediation.sql','282_battle_demo_data_integrity.sql'))=5)
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_m e ON e.q=q.id WHERE q.topic_id=e.t)=268
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_q e ON e.q=q.id WHERE q.topic_id IS NULL)=2
  AND (SELECT count(*) FROM question_bank_remediation_log l JOIN _npr_expected_m e ON e.q=l.entity_id AND e.m=l.migration_id WHERE l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=e.t)=268
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id IN ('278_nsmq_legacy_null_topic_part_1','279_nsmq_legacy_null_topic_part_2','280_nsmq_legacy_null_topic_part_3'))=268) AND (((SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release='nsmq-pre278-one-row-reconciliation-2026-08-28')='legacy:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release='nsmq-pre278-one-row-reconciliation-2026-08-28')=1 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release='nsmq-pre278-one-row-reconciliation-2026-08-28')=1) OR ((SELECT mode||':'||status FROM nsmq_pre278_reconcile_state WHERE release='nsmq-pre278-one-row-reconciliation-2026-08-28')='reviewed_noop:completed' AND (SELECT count(*) FROM nsmq_pre278_reconcile_backup WHERE release='nsmq-pre278-one-row-reconciliation-2026-08-28')=0 AND (SELECT count(*) FROM nsmq_pre278_reconcile_audit WHERE release='nsmq-pre278-one-row-reconciliation-2026-08-28')=0)) THEN 1 ELSE 0 END;
DROP TABLE _npr_expected_guard;
DROP TABLE nsmq_pre278_reconcile_audit;
DROP TABLE nsmq_pre278_reconcile_backup;
DROP TABLE nsmq_pre278_reconcile_state;
DROP TABLE _npr_expected_q;
DROP TABLE _npr_expected_m;
