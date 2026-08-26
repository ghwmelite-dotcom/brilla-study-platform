-- 266: WASSCE remaining-topic remediation batch 15/15 (exactly 100 authoritative live rows).
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _migration_266_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _migration_266_guard;
CREATE TABLE IF NOT EXISTS _migration_266_map(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM _migration_266_map;
INSERT INTO _migration_266_map VALUES
 ('q_wm23_001','topic_wassce_core_math_numbers'),
 ('q_wm23_002','topic_wassce_core_math_numbers'),
 ('q_wm23_003','topic_wassce_core_math_numbers'),
 ('q_wm23_004','topic_wassce_core_math_numbers'),
 ('q_wm23_005','topic_wassce_core_math_numbers'),
 ('q_wm23_006','topic_wassce_core_math_numbers'),
 ('q_wm23_007','topic_wassce_core_math_numbers'),
 ('q_wm23_008','topic_wassce_core_math_numbers'),
 ('q_wm23_009','topic_wassce_core_math_numbers'),
 ('q_wm23_010','topic_wassce_core_math_numbers'),
 ('q_wm23_011','topic_wassce_core_math_algebra'),
 ('q_wm23_012','topic_wassce_core_math_algebra'),
 ('q_wm23_013','topic_wassce_core_math_algebra'),
 ('q_wm23_014','topic_wassce_core_math_algebra'),
 ('q_wm23_015','topic_wassce_core_math_algebra'),
 ('q_wm23_016','topic_wassce_core_math_algebra'),
 ('q_wm23_017','topic_wassce_core_math_algebra'),
 ('q_wm23_018','topic_wassce_core_math_algebra'),
 ('q_wm23_019','topic_wassce_core_math_algebra'),
 ('q_wm23_020','topic_wassce_core_math_algebra'),
 ('q_wm23_021','topic_wassce_core_math_geometry'),
 ('q_wm23_022','topic_wassce_core_math_geometry'),
 ('q_wm23_023','topic_wassce_core_math_geometry'),
 ('q_wm23_024','topic_wassce_core_math_geometry'),
 ('q_wm23_025','topic_wassce_core_math_geometry'),
 ('q_wm23_026','topic_wassce_core_math_geometry'),
 ('q_wm23_027','topic_wassce_core_math_geometry'),
 ('q_wm23_028','topic_wassce_core_math_geometry'),
 ('q_wm23_029','topic_wassce_core_math_geometry'),
 ('q_wm23_030','topic_wassce_core_math_geometry'),
 ('q_wm23_031','topic_wassce_core_math_geometry'),
 ('q_wm23_032','topic_wassce_core_math_geometry'),
 ('q_wm23_033','topic_wassce_core_math_geometry'),
 ('q_wm23_034','topic_wassce_core_math_geometry'),
 ('q_wm23_035','topic_wassce_core_math_geometry'),
 ('q_wm23_036','topic_wassce_core_math_geometry'),
 ('q_wm23_037','topic_wassce_core_math_geometry'),
 ('q_wm23_038','topic_wassce_core_math_geometry'),
 ('q_wm23_039','topic_wassce_core_math_geometry'),
 ('q_wm23_040','topic_wassce_core_math_geometry'),
 ('q_wm23_041','topic_wassce_core_math_data'),
 ('q_wm23_042','topic_wassce_core_math_data'),
 ('q_wm23_043','topic_wassce_core_math_data'),
 ('q_wm23_044','topic_wassce_core_math_data'),
 ('q_wm23_045','topic_wassce_core_math_data'),
 ('q_wm23_046','topic_wassce_core_math_data'),
 ('q_wm23_047','topic_wassce_core_math_data'),
 ('q_wm23_048','topic_wassce_core_math_data'),
 ('q_wm23_049','topic_wassce_core_math_data'),
 ('q_wm23_050','topic_wassce_core_math_data'),
 ('q_wm24_001','topic_wassce_core_math_numbers'),
 ('q_wm24_002','topic_wassce_core_math_numbers'),
 ('q_wm24_003','topic_wassce_core_math_numbers'),
 ('q_wm24_004','topic_wassce_core_math_numbers'),
 ('q_wm24_005','topic_wassce_core_math_numbers'),
 ('q_wm24_006','topic_wassce_core_math_numbers'),
 ('q_wm24_007','topic_wassce_core_math_numbers'),
 ('q_wm24_008','topic_wassce_core_math_numbers'),
 ('q_wm24_009','topic_wassce_core_math_numbers'),
 ('q_wm24_010','topic_wassce_core_math_numbers'),
 ('q_wm24_011','topic_wassce_core_math_algebra'),
 ('q_wm24_012','topic_wassce_core_math_algebra'),
 ('q_wm24_013','topic_wassce_core_math_algebra'),
 ('q_wm24_014','topic_wassce_core_math_algebra'),
 ('q_wm24_015','topic_wassce_core_math_algebra'),
 ('q_wm24_016','topic_wassce_core_math_algebra'),
 ('q_wm24_017','topic_wassce_core_math_algebra'),
 ('q_wm24_018','topic_wassce_core_math_algebra'),
 ('q_wm24_019','topic_wassce_core_math_algebra'),
 ('q_wm24_020','topic_wassce_core_math_algebra'),
 ('q_wm24_021','topic_wassce_core_math_geometry'),
 ('q_wm24_022','topic_wassce_core_math_geometry'),
 ('q_wm24_023','topic_wassce_core_math_geometry'),
 ('q_wm24_024','topic_wassce_core_math_geometry'),
 ('q_wm24_025','topic_wassce_core_math_geometry'),
 ('q_wm24_026','topic_wassce_core_math_geometry'),
 ('q_wm24_027','topic_wassce_core_math_geometry'),
 ('q_wm24_028','topic_wassce_core_math_geometry'),
 ('q_wm24_029','topic_wassce_core_math_geometry'),
 ('q_wm24_030','topic_wassce_core_math_geometry'),
 ('q_wm24_031','topic_wassce_core_math_geometry'),
 ('q_wm24_032','topic_wassce_core_math_geometry'),
 ('q_wm24_033','topic_wassce_core_math_geometry'),
 ('q_wm24_034','topic_wassce_core_math_geometry'),
 ('q_wm24_035','topic_wassce_core_math_geometry'),
 ('q_wm24_036','topic_wassce_core_math_geometry'),
 ('q_wm24_037','topic_wassce_core_math_geometry'),
 ('q_wm24_038','topic_wassce_core_math_geometry'),
 ('q_wm24_039','topic_wassce_core_math_geometry'),
 ('q_wm24_040','topic_wassce_core_math_geometry'),
 ('q_wm24_041','topic_wassce_core_math_data'),
 ('q_wm24_042','topic_wassce_core_math_data'),
 ('q_wm24_043','topic_wassce_core_math_data'),
 ('q_wm24_044','topic_wassce_core_math_data'),
 ('q_wm24_045','topic_wassce_core_math_data'),
 ('q_wm24_046','topic_wassce_core_math_data'),
 ('q_wm24_047','topic_wassce_core_math_data'),
 ('q_wm24_048','topic_wassce_core_math_data'),
 ('q_wm24_049','topic_wassce_core_math_data'),
 ('q_wm24_050','topic_wassce_core_math_data');
CREATE TABLE IF NOT EXISTS _migration_266_scope(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM _migration_266_scope;
INSERT INTO _migration_266_scope VALUES
 ('topic_wassce_core_math_algebra','subj_wassce_core_math'),
 ('topic_wassce_core_math_data','subj_wassce_core_math'),
 ('topic_wassce_core_math_geometry','subj_wassce_core_math'),
 ('topic_wassce_core_math_numbers','subj_wassce_core_math');
INSERT INTO _migration_266_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _migration_266_map)=100
 AND (SELECT COUNT(*) FROM _migration_266_scope)=4
AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=20
 AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter') AND NOT (t.subject_id IS CASE t.id WHEN 'topic_eco_development' THEN 'subj_wassce_economics' WHEN 'topic_eco_public_finance' THEN 'subj_wassce_economics' WHEN 'topic_gov_international' THEN 'subj_wassce_government' WHEN 'topic_gov_public_admin' THEN 'subj_wassce_government' WHEN 'topic_gov_west_africa_development' THEN 'subj_wassce_government' WHEN 'topic_wassce_biology_diversity_environment' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_life_fundamental_unit' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_systems_life' THEN 'subj_wassce_biology' WHEN 'topic_wassce_chem_carbon' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_elements' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_physical' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_core_math_algebra' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_data' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_geometry' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_numbers' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_english_literary_devices' THEN 'subj_wassce_english' WHEN 'topic_wassce_physics_atomic_nuclear' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_energy' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_fields_electronics' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_mechanics_matter' THEN 'subj_wassce_physics' END))
 AND NOT EXISTS (SELECT 1 FROM _migration_266_map m LEFT JOIN _migration_266_scope e ON e.topic_id=m.topic_id LEFT JOIN questions q ON q.id=m.question_id LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN topics t ON t.id=m.topic_id
  WHERE e.topic_id IS NULL OR q.id IS NULL OR q.subject_id IS NOT e.subject_id OR s.id IS NULL OR s.exam_type_id IS NOT 'exam_wassce' OR s.is_active<>1 OR (t.id IS NULL AND m.topic_id NOT IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter')) OR (t.id IS NOT NULL AND t.subject_id IS NOT e.subject_id) OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id))
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _migration_266_map m ON m.question_id=l.entity_id
  WHERE l.migration_id='266_wassce_remaining_topic_mapping_part_15' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id))
 AND ((SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id JOIN topics t ON t.id=l.new_value
   WHERE l.migration_id IN ('252_wassce_remaining_topic_mapping_part_01','253_wassce_remaining_topic_mapping_part_02','254_wassce_remaining_topic_mapping_part_03','255_wassce_remaining_topic_mapping_part_04','256_wassce_remaining_topic_mapping_part_05','257_wassce_remaining_topic_mapping_part_06','258_wassce_remaining_topic_mapping_part_07','259_wassce_remaining_topic_mapping_part_08','260_wassce_remaining_topic_mapping_part_09','261_wassce_remaining_topic_mapping_part_10','262_wassce_remaining_topic_mapping_part_11','263_wassce_remaining_topic_mapping_part_12','264_wassce_remaining_topic_mapping_part_13','265_wassce_remaining_topic_mapping_part_14') AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL
    AND q.topic_id IS l.new_value AND q.subject_id IS t.subject_id)=1400
  AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN questions q ON q.id=l.entity_id LEFT JOIN topics t ON t.id=l.new_value
   WHERE l.migration_id IN ('252_wassce_remaining_topic_mapping_part_01','253_wassce_remaining_topic_mapping_part_02','254_wassce_remaining_topic_mapping_part_03','255_wassce_remaining_topic_mapping_part_04','256_wassce_remaining_topic_mapping_part_05','257_wassce_remaining_topic_mapping_part_06','258_wassce_remaining_topic_mapping_part_07','259_wassce_remaining_topic_mapping_part_08','260_wassce_remaining_topic_mapping_part_09','261_wassce_remaining_topic_mapping_part_10','262_wassce_remaining_topic_mapping_part_11','263_wassce_remaining_topic_mapping_part_12','264_wassce_remaining_topic_mapping_part_13','265_wassce_remaining_topic_mapping_part_14') AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR q.id IS NULL OR q.topic_id IS NOT l.new_value OR t.id IS NULL OR q.subject_id IS NOT t.subject_id)))
 AND (((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='266_wassce_remaining_topic_mapping_part_15')=0
       AND (SELECT COUNT(*) FROM questions q JOIN _migration_266_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100)
   OR ((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='266_wassce_remaining_topic_mapping_part_15')=100
       AND ((SELECT COUNT(*) FROM questions q JOIN _migration_266_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100
         OR (SELECT COUNT(*) FROM questions q JOIN _migration_266_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100)))
 AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT '266_wassce_remaining_topic_mapping_part_15','question',q.id,'topic_id',q.topic_id,m.topic_id FROM questions q JOIN _migration_266_map m ON m.question_id=q.id WHERE q.topic_id IS NULL;
UPDATE questions SET topic_id=(SELECT m.topic_id FROM _migration_266_map m WHERE m.question_id=questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_266_map);
INSERT INTO _migration_266_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=20
 AND (SELECT COUNT(*) FROM questions q JOIN _migration_266_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _migration_266_map m ON m.question_id=l.entity_id WHERE l.migration_id='266_wassce_remaining_topic_mapping_part_15' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=100
 AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
DROP TABLE _migration_266_scope;
DROP TABLE _migration_266_map;
DROP TABLE _migration_266_guard;
