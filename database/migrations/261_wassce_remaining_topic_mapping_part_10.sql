-- 261: WASSCE remaining-topic remediation batch 10/15 (exactly 100 authoritative live rows).
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _migration_261_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _migration_261_guard;
CREATE TABLE IF NOT EXISTS _migration_261_map(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM _migration_261_map;
INSERT INTO _migration_261_map VALUES
 ('q_lit_2023_001','topic_lit_devices'),
 ('q_lit_2023_002','topic_lit_devices'),
 ('q_lit_2023_003','topic_lit_devices'),
 ('q_lit_2023_004','topic_lit_devices'),
 ('q_lit_2023_005','topic_lit_devices'),
 ('q_lit_2023_006','topic_lit_devices'),
 ('q_lit_2023_007','topic_lit_devices'),
 ('q_lit_2023_008','topic_lit_devices'),
 ('q_lit_2023_009','topic_lit_devices'),
 ('q_lit_2023_010','topic_lit_devices'),
 ('q_lit_2023_011','topic_lit_devices'),
 ('q_lit_2023_012','topic_lit_devices'),
 ('q_lit_2023_013','topic_lit_devices'),
 ('q_lit_2023_014','topic_lit_devices'),
 ('q_lit_2023_015','topic_lit_devices'),
 ('q_lit_2023_016','topic_lit_prose'),
 ('q_lit_2023_017','topic_lit_prose'),
 ('q_lit_2023_018','topic_lit_prose'),
 ('q_lit_2023_019','topic_lit_prose'),
 ('q_lit_2023_020','topic_lit_prose'),
 ('q_lit_2023_021','topic_lit_drama'),
 ('q_lit_2023_022','topic_lit_drama'),
 ('q_lit_2023_023','topic_lit_drama'),
 ('q_lit_2023_024','topic_lit_drama'),
 ('q_lit_2023_025','topic_lit_drama'),
 ('q_lit_2023_026','topic_lit_drama'),
 ('q_lit_2023_027','topic_lit_drama'),
 ('q_lit_2023_028','topic_lit_drama'),
 ('q_lit_2023_029','topic_lit_prose'),
 ('q_lit_2023_030','topic_lit_prose'),
 ('q_lit_2023_031','topic_lit_poetry'),
 ('q_lit_2023_032','topic_lit_poetry'),
 ('q_lit_2023_033','topic_lit_poetry'),
 ('q_lit_2023_034','topic_lit_poetry'),
 ('q_lit_2023_035','topic_lit_poetry'),
 ('q_lit_2023_036','topic_lit_poetry'),
 ('q_lit_2023_037','topic_lit_poetry'),
 ('q_lit_2023_038','topic_lit_poetry'),
 ('q_lit_2023_039','topic_lit_poetry'),
 ('q_lit_2023_040','topic_lit_poetry'),
 ('q_lit_2023_041','topic_lit_african'),
 ('q_lit_2023_042','topic_lit_african'),
 ('q_lit_2023_043','topic_lit_african'),
 ('q_lit_2023_044','topic_lit_african'),
 ('q_lit_2023_045','topic_lit_african'),
 ('q_lit_2023_046','topic_lit_drama'),
 ('q_lit_2023_047','topic_lit_drama'),
 ('q_lit_2023_048','topic_lit_african'),
 ('q_lit_2023_049','topic_lit_african'),
 ('q_lit_2023_050','topic_lit_african'),
 ('q_lit_2024_001','topic_lit_devices'),
 ('q_lit_2024_002','topic_lit_intro'),
 ('q_lit_2024_003','topic_lit_intro'),
 ('q_lit_2024_004','topic_lit_poetry'),
 ('q_lit_2024_005','topic_lit_devices'),
 ('q_lit_2024_006','topic_lit_devices'),
 ('q_lit_2024_007','topic_lit_devices'),
 ('q_lit_2024_008','topic_lit_intro'),
 ('q_lit_2024_009','topic_lit_poetry'),
 ('q_lit_2024_010','topic_lit_intro'),
 ('q_lit_2024_011','topic_lit_devices'),
 ('q_lit_2024_012','topic_lit_drama'),
 ('q_lit_2024_013','topic_lit_devices'),
 ('q_lit_2024_014','topic_lit_devices'),
 ('q_lit_2024_015','topic_lit_devices'),
 ('q_lit_2024_016','topic_lit_drama'),
 ('q_lit_2024_017','topic_lit_drama'),
 ('q_lit_2024_018','topic_lit_drama'),
 ('q_lit_2024_019','topic_lit_drama'),
 ('q_lit_2024_020','topic_lit_drama'),
 ('q_lit_2024_021','topic_lit_drama'),
 ('q_lit_2024_022','topic_lit_drama'),
 ('q_lit_2024_023','topic_lit_drama'),
 ('q_lit_2024_024','topic_lit_drama'),
 ('q_lit_2024_025','topic_lit_drama'),
 ('q_lit_2024_026','topic_lit_prose'),
 ('q_lit_2024_027','topic_lit_prose'),
 ('q_lit_2024_028','topic_lit_prose'),
 ('q_lit_2024_029','topic_lit_prose'),
 ('q_lit_2024_030','topic_lit_prose'),
 ('q_lit_2024_031','topic_lit_prose'),
 ('q_lit_2024_032','topic_lit_prose'),
 ('q_lit_2024_033','topic_lit_prose'),
 ('q_lit_2024_034','topic_lit_prose'),
 ('q_lit_2024_035','topic_lit_prose'),
 ('q_lit_2024_036','topic_lit_poetry'),
 ('q_lit_2024_037','topic_lit_poetry'),
 ('q_lit_2024_038','topic_lit_poetry'),
 ('q_lit_2024_039','topic_lit_poetry'),
 ('q_lit_2024_040','topic_lit_poetry'),
 ('q_lit_2024_041','topic_lit_poetry'),
 ('q_lit_2024_042','topic_lit_poetry'),
 ('q_lit_2024_043','topic_lit_poetry'),
 ('q_lit_2024_044','topic_lit_poetry'),
 ('q_lit_2024_045','topic_lit_poetry'),
 ('q_lit_2024_046','topic_lit_african'),
 ('q_lit_2024_047','topic_lit_african'),
 ('q_lit_2024_048','topic_lit_african'),
 ('q_lit_2024_049','topic_lit_african'),
 ('q_lit_2024_050','topic_lit_african');
CREATE TABLE IF NOT EXISTS _migration_261_scope(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM _migration_261_scope;
INSERT INTO _migration_261_scope VALUES
 ('topic_lit_african','subj_wassce_literature'),
 ('topic_lit_devices','subj_wassce_literature'),
 ('topic_lit_drama','subj_wassce_literature'),
 ('topic_lit_intro','subj_wassce_literature'),
 ('topic_lit_poetry','subj_wassce_literature'),
 ('topic_lit_prose','subj_wassce_literature');
INSERT INTO _migration_261_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _migration_261_map)=100
 AND (SELECT COUNT(*) FROM _migration_261_scope)=6
AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=20
 AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter') AND NOT (t.subject_id IS CASE t.id WHEN 'topic_eco_development' THEN 'subj_wassce_economics' WHEN 'topic_eco_public_finance' THEN 'subj_wassce_economics' WHEN 'topic_gov_international' THEN 'subj_wassce_government' WHEN 'topic_gov_public_admin' THEN 'subj_wassce_government' WHEN 'topic_gov_west_africa_development' THEN 'subj_wassce_government' WHEN 'topic_wassce_biology_diversity_environment' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_life_fundamental_unit' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_systems_life' THEN 'subj_wassce_biology' WHEN 'topic_wassce_chem_carbon' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_elements' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_physical' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_core_math_algebra' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_data' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_geometry' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_numbers' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_english_literary_devices' THEN 'subj_wassce_english' WHEN 'topic_wassce_physics_atomic_nuclear' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_energy' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_fields_electronics' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_mechanics_matter' THEN 'subj_wassce_physics' END))
 AND NOT EXISTS (SELECT 1 FROM _migration_261_map m LEFT JOIN _migration_261_scope e ON e.topic_id=m.topic_id LEFT JOIN questions q ON q.id=m.question_id LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN topics t ON t.id=m.topic_id
  WHERE e.topic_id IS NULL OR q.id IS NULL OR q.subject_id IS NOT e.subject_id OR s.id IS NULL OR s.exam_type_id IS NOT 'exam_wassce' OR s.is_active<>1 OR (t.id IS NULL AND m.topic_id NOT IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter')) OR (t.id IS NOT NULL AND t.subject_id IS NOT e.subject_id) OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id))
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _migration_261_map m ON m.question_id=l.entity_id
  WHERE l.migration_id='261_wassce_remaining_topic_mapping_part_10' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id))
 AND ((SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id JOIN topics t ON t.id=l.new_value
   WHERE l.migration_id IN ('252_wassce_remaining_topic_mapping_part_01','253_wassce_remaining_topic_mapping_part_02','254_wassce_remaining_topic_mapping_part_03','255_wassce_remaining_topic_mapping_part_04','256_wassce_remaining_topic_mapping_part_05','257_wassce_remaining_topic_mapping_part_06','258_wassce_remaining_topic_mapping_part_07','259_wassce_remaining_topic_mapping_part_08','260_wassce_remaining_topic_mapping_part_09') AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL
    AND q.topic_id IS l.new_value AND q.subject_id IS t.subject_id)=900
  AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN questions q ON q.id=l.entity_id LEFT JOIN topics t ON t.id=l.new_value
   WHERE l.migration_id IN ('252_wassce_remaining_topic_mapping_part_01','253_wassce_remaining_topic_mapping_part_02','254_wassce_remaining_topic_mapping_part_03','255_wassce_remaining_topic_mapping_part_04','256_wassce_remaining_topic_mapping_part_05','257_wassce_remaining_topic_mapping_part_06','258_wassce_remaining_topic_mapping_part_07','259_wassce_remaining_topic_mapping_part_08','260_wassce_remaining_topic_mapping_part_09') AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR q.id IS NULL OR q.topic_id IS NOT l.new_value OR t.id IS NULL OR q.subject_id IS NOT t.subject_id)))
 AND (((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='261_wassce_remaining_topic_mapping_part_10')=0
       AND (SELECT COUNT(*) FROM questions q JOIN _migration_261_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100)
   OR ((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='261_wassce_remaining_topic_mapping_part_10')=100
       AND ((SELECT COUNT(*) FROM questions q JOIN _migration_261_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100
         OR (SELECT COUNT(*) FROM questions q JOIN _migration_261_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100)))
 AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT '261_wassce_remaining_topic_mapping_part_10','question',q.id,'topic_id',q.topic_id,m.topic_id FROM questions q JOIN _migration_261_map m ON m.question_id=q.id WHERE q.topic_id IS NULL;
UPDATE questions SET topic_id=(SELECT m.topic_id FROM _migration_261_map m WHERE m.question_id=questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_261_map);
INSERT INTO _migration_261_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=20
 AND (SELECT COUNT(*) FROM questions q JOIN _migration_261_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _migration_261_map m ON m.question_id=l.entity_id WHERE l.migration_id='261_wassce_remaining_topic_mapping_part_10' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=100
 AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
DROP TABLE _migration_261_scope;
DROP TABLE _migration_261_map;
DROP TABLE _migration_261_guard;
