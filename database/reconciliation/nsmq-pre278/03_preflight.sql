-- Fail closed unless the complete 270-row reviewed NSMQ scope is exact legacy production or exact canonical post-278 staging.
PRAGMA foreign_keys=ON;
CREATE TABLE _npr_expected_guard(valid INTEGER NOT NULL CHECK(valid=1));
INSERT INTO _npr_expected_guard SELECT CASE WHEN (SELECT count(*) FROM _npr_expected_m)=268
  AND (SELECT count(*) FROM _npr_expected_q)=2
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_m e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=268
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_q e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=2
  AND NOT EXISTS(SELECT 1 FROM _npr_expected_m e LEFT JOIN topics t ON t.id=e.t WHERE t.id IS NULL OR t.subject_id<>e.s)
  AND (SELECT count(*) FROM topics t JOIN subjects s ON s.id=t.subject_id WHERE t.id='topic_nsmq_chem_atomic' AND t.subject_id='subj_nsmq_chemistry' AND s.exam_type_id='exam_nsmq' AND s.is_active=1)=1
  AND NOT EXISTS(SELECT 1 FROM (SELECT s FROM _npr_expected_m UNION SELECT s FROM _npr_expected_q) e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id<>'exam_nsmq' OR s.is_active<>1) AND (((SELECT count(*) FROM questions q JOIN _npr_expected_m e ON e.q=q.id WHERE e.q<>'nsmq_chem_sr_008' AND q.topic_id IS NULL)=267
  AND (SELECT count(*) FROM questions WHERE id='nsmq_chem_sr_008' AND subject_id='subj_nsmq_chemistry' AND round_type='speed_race' AND topic_id='topic_nsmq_chem_atomic')=1
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_q e ON e.q=q.id WHERE q.topic_id IS NULL)=2
  AND NOT EXISTS(SELECT 1 FROM question_bank_remediation_log WHERE migration_id IN ('278_nsmq_legacy_null_topic_part_1','279_nsmq_legacy_null_topic_part_2','280_nsmq_legacy_null_topic_part_3'))
  AND ((SELECT count(*) FROM d1_migrations WHERE name IN ('267_nsmq_topic_remediation_part_1.sql','268_nsmq_topic_remediation_part_2.sql','269_nsmq_topic_remediation_part_3.sql','270_nsmq_topic_remediation_part_4.sql'))=4
  AND NOT EXISTS(SELECT 1 FROM d1_migrations WHERE name IN ('278_nsmq_legacy_null_topic_part_1.sql','279_nsmq_legacy_null_topic_part_2.sql','280_nsmq_legacy_null_topic_part_3.sql','281_cambridge_legacy_topic_remediation.sql','282_battle_demo_data_integrity.sql'))
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='267_nsmq_topic_remediation_part_1')=103
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='268_nsmq_topic_remediation_part_2')=100
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='269_nsmq_topic_remediation_part_3')=100
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='270_nsmq_topic_remediation_part_4')=73)
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='102_nsmq_question_alignment' AND entity_type='question' AND entity_id='nsmq_chem_sr_008' AND field_name='topic_id' AND old_value='topic_wchem_atomic' AND new_value='topic_nsmq_chem_atomic')=1) OR (((SELECT count(*) FROM d1_migrations WHERE name IN ('267_nsmq_topic_remediation_part_1.sql','268_nsmq_topic_remediation_part_2.sql','269_nsmq_topic_remediation_part_3.sql','270_nsmq_topic_remediation_part_4.sql'))=4
  AND NOT EXISTS(SELECT 1 FROM d1_migrations WHERE name IN ('278_nsmq_legacy_null_topic_part_1.sql','279_nsmq_legacy_null_topic_part_2.sql','280_nsmq_legacy_null_topic_part_3.sql','281_cambridge_legacy_topic_remediation.sql','282_battle_demo_data_integrity.sql'))
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='267_nsmq_topic_remediation_part_1')=103
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='268_nsmq_topic_remediation_part_2')=100
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='269_nsmq_topic_remediation_part_3')=100
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='270_nsmq_topic_remediation_part_4')=73)
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_m e ON e.q=q.id WHERE e.q<>'nsmq_chem_sr_008' AND q.topic_id IS NULL)=267
  AND (SELECT count(*) FROM questions WHERE id='nsmq_chem_sr_008' AND subject_id='subj_nsmq_chemistry' AND round_type='speed_race' AND topic_id IS NULL)=1
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_q e ON e.q=q.id WHERE q.topic_id IS NULL)=2
  AND NOT EXISTS(SELECT 1 FROM question_bank_remediation_log WHERE migration_id IN ('278_nsmq_legacy_null_topic_part_1','279_nsmq_legacy_null_topic_part_2','280_nsmq_legacy_null_topic_part_3'))
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id='102_nsmq_question_alignment' AND entity_type='question' AND entity_id='nsmq_chem_sr_008' AND field_name='topic_id' AND old_value='topic_wchem_atomic' AND new_value='topic_nsmq_chem_atomic')=1) OR (((SELECT count(*) FROM d1_migrations WHERE name IN ('278_nsmq_legacy_null_topic_part_1.sql','279_nsmq_legacy_null_topic_part_2.sql','280_nsmq_legacy_null_topic_part_3.sql','281_cambridge_legacy_topic_remediation.sql','282_battle_demo_data_integrity.sql'))=5)
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_m e ON e.q=q.id WHERE q.topic_id=e.t)=268
  AND (SELECT count(*) FROM questions q JOIN _npr_expected_q e ON e.q=q.id WHERE q.topic_id IS NULL)=2
  AND (SELECT count(*) FROM question_bank_remediation_log l JOIN _npr_expected_m e ON e.q=l.entity_id AND e.m=l.migration_id WHERE l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=e.t)=268
  AND (SELECT count(*) FROM question_bank_remediation_log WHERE migration_id IN ('278_nsmq_legacy_null_topic_part_1','279_nsmq_legacy_null_topic_part_2','280_nsmq_legacy_null_topic_part_3'))=268)) AND NOT EXISTS(SELECT 1 FROM pragma_foreign_key_check) THEN 1 ELSE 0 END;
DROP TABLE _npr_expected_guard;
