-- Roll back 258_wassce_remaining_topic_mapping_part_07; restore only ledger-proven NULL topic IDs.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _rollback_258_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_258_guard;
CREATE TABLE IF NOT EXISTS _rollback_258_map(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM _rollback_258_map;
INSERT INTO _rollback_258_map VALUES
 ('q_eng_2024_026','topic_wassce_english_grammar'),
 ('q_eng_2024_027','topic_wassce_english_lexis'),
 ('q_eng_2024_028','topic_wassce_english_lexis'),
 ('q_eng_2024_029','topic_wassce_english_grammar'),
 ('q_eng_2024_030','topic_wassce_english_lexis'),
 ('q_eng_2024_031','topic_wassce_english_grammar'),
 ('q_eng_2024_032','topic_wassce_english_lexis'),
 ('q_eng_2024_033','topic_wassce_english_grammar'),
 ('q_eng_2024_034','topic_wassce_english_literary_devices'),
 ('q_eng_2024_035','topic_wassce_english_grammar'),
 ('q_eng_2024_036','topic_wassce_english_oral'),
 ('q_eng_2024_037','topic_wassce_english_oral'),
 ('q_eng_2024_038','topic_wassce_english_oral'),
 ('q_eng_2024_039','topic_wassce_english_oral'),
 ('q_eng_2024_040','topic_wassce_english_oral'),
 ('q_eng_2024_041','topic_wassce_english_oral'),
 ('q_eng_2024_042','topic_wassce_english_oral'),
 ('q_eng_2024_043','topic_wassce_english_oral'),
 ('q_eng_2024_044','topic_wassce_english_oral'),
 ('q_eng_2024_045','topic_wassce_english_oral'),
 ('q_eng_2024_046','topic_wassce_english_oral'),
 ('q_eng_2024_047','topic_wassce_english_oral'),
 ('q_eng_2024_048','topic_wassce_english_oral'),
 ('q_eng_2024_049','topic_wassce_english_oral'),
 ('q_eng_2024_050','topic_wassce_english_oral'),
 ('q_food_cat_001','topic_fn_catering'),
 ('q_food_cat_002','topic_fn_catering'),
 ('q_food_cat_003','topic_fn_catering'),
 ('q_food_cat_004','topic_fn_catering'),
 ('q_food_cat_005','topic_fn_catering'),
 ('q_food_diet_001','topic_fn_special_diets'),
 ('q_food_diet_002','topic_fn_special_diets'),
 ('q_food_diet_003','topic_fn_special_diets'),
 ('q_food_diet_004','topic_fn_special_diets'),
 ('q_food_diet_005','topic_fn_special_diets'),
 ('q_food_prep_001','topic_fn_food_prep'),
 ('q_food_prep_002','topic_fn_food_prep'),
 ('q_food_prep_003','topic_fn_food_prep'),
 ('q_food_prep_004','topic_fn_food_prep'),
 ('q_food_prep_005','topic_fn_food_prep'),
 ('q_food_sci_001','topic_fn_food_science'),
 ('q_food_sci_002','topic_fn_food_science'),
 ('q_food_sci_003','topic_fn_food_science'),
 ('q_food_sci_004','topic_fn_food_science'),
 ('q_food_sci_005','topic_fn_food_science'),
 ('q_geo_2023_001','topic_geo_physical'),
 ('q_geo_2023_002','topic_geo_physical'),
 ('q_geo_2023_003','topic_geo_physical'),
 ('q_geo_2023_004','topic_geo_physical'),
 ('q_geo_2023_005','topic_geo_physical'),
 ('q_geo_2023_006','topic_geo_physical'),
 ('q_geo_2023_007','topic_geo_physical'),
 ('q_geo_2023_008','topic_geo_physical'),
 ('q_geo_2023_009','topic_geo_physical'),
 ('q_geo_2023_010','topic_geo_physical'),
 ('q_geo_2023_011','topic_geo_climate'),
 ('q_geo_2023_012','topic_geo_vegetation'),
 ('q_geo_2023_013','topic_geo_climate'),
 ('q_geo_2023_014','topic_geo_climate'),
 ('q_geo_2023_015','topic_geo_vegetation'),
 ('q_geo_2023_016','topic_geo_climate'),
 ('q_geo_2023_017','topic_geo_vegetation'),
 ('q_geo_2023_018','topic_geo_climate'),
 ('q_geo_2023_019','topic_geo_vegetation'),
 ('q_geo_2023_020','topic_geo_vegetation'),
 ('q_geo_2023_021','topic_geo_mapwork'),
 ('q_geo_2023_022','topic_geo_mapwork'),
 ('q_geo_2023_023','topic_geo_mapwork'),
 ('q_geo_2023_024','topic_geo_mapwork'),
 ('q_geo_2023_025','topic_geo_mapwork'),
 ('q_geo_2023_026','topic_geo_mapwork'),
 ('q_geo_2023_027','topic_geo_mapwork'),
 ('q_geo_2023_028','topic_geo_mapwork'),
 ('q_geo_2023_029','topic_geo_mapwork'),
 ('q_geo_2023_030','topic_geo_mapwork'),
 ('q_geo_2023_031','topic_geo_population'),
 ('q_geo_2023_032','topic_geo_resources'),
 ('q_geo_2023_033','topic_geo_resources'),
 ('q_geo_2023_034','topic_geo_resources'),
 ('q_geo_2023_035','topic_geo_resources'),
 ('q_geo_2023_036','topic_geo_resources'),
 ('q_geo_2023_037','topic_geo_resources'),
 ('q_geo_2023_038','topic_geo_resources'),
 ('q_geo_2023_039','topic_geo_resources'),
 ('q_geo_2023_040','topic_geo_resources'),
 ('q_geo_2023_041','topic_geo_africa'),
 ('q_geo_2023_042','topic_geo_africa'),
 ('q_geo_2023_043','topic_geo_africa'),
 ('q_geo_2023_044','topic_geo_africa'),
 ('q_geo_2023_045','topic_geo_ghana'),
 ('q_geo_2023_046','topic_geo_africa'),
 ('q_geo_2023_047','topic_geo_africa'),
 ('q_geo_2023_048','topic_geo_africa'),
 ('q_geo_2023_049','topic_geo_ghana'),
 ('q_geo_2023_050','topic_geo_ghana'),
 ('q_geo_2024_001','topic_geo_physical'),
 ('q_geo_2024_002','topic_geo_physical'),
 ('q_geo_2024_003','topic_geo_physical'),
 ('q_geo_2024_004','topic_geo_physical'),
 ('q_geo_2024_005','topic_geo_physical');
CREATE TABLE IF NOT EXISTS _rollback_258_scope(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM _rollback_258_scope;
INSERT INTO _rollback_258_scope VALUES
 ('topic_fn_catering','subj_wassce_foods'),
 ('topic_fn_food_prep','subj_wassce_foods'),
 ('topic_fn_food_science','subj_wassce_foods'),
 ('topic_fn_special_diets','subj_wassce_foods'),
 ('topic_geo_africa','subj_wassce_geography'),
 ('topic_geo_climate','subj_wassce_geography'),
 ('topic_geo_ghana','subj_wassce_geography'),
 ('topic_geo_mapwork','subj_wassce_geography'),
 ('topic_geo_physical','subj_wassce_geography'),
 ('topic_geo_population','subj_wassce_geography'),
 ('topic_geo_resources','subj_wassce_geography'),
 ('topic_geo_vegetation','subj_wassce_geography'),
 ('topic_wassce_english_grammar','subj_wassce_english'),
 ('topic_wassce_english_lexis','subj_wassce_english'),
 ('topic_wassce_english_literary_devices','subj_wassce_english'),
 ('topic_wassce_english_oral','subj_wassce_english');
INSERT INTO _rollback_258_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _rollback_258_map)=100
 AND (SELECT COUNT(*) FROM _rollback_258_scope)=16
 AND ((SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=20
 AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter') AND NOT (t.subject_id IS CASE t.id WHEN 'topic_eco_development' THEN 'subj_wassce_economics' WHEN 'topic_eco_public_finance' THEN 'subj_wassce_economics' WHEN 'topic_gov_international' THEN 'subj_wassce_government' WHEN 'topic_gov_public_admin' THEN 'subj_wassce_government' WHEN 'topic_gov_west_africa_development' THEN 'subj_wassce_government' WHEN 'topic_wassce_biology_diversity_environment' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_life_fundamental_unit' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_systems_life' THEN 'subj_wassce_biology' WHEN 'topic_wassce_chem_carbon' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_elements' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_physical' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_core_math_algebra' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_data' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_geometry' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_numbers' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_english_literary_devices' THEN 'subj_wassce_english' WHEN 'topic_wassce_physics_atomic_nuclear' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_energy' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_fields_electronics' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_mechanics_matter' THEN 'subj_wassce_physics' END)))
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _rollback_258_map m ON m.question_id=l.entity_id WHERE l.migration_id='258_wassce_remaining_topic_mapping_part_07' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=100
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _rollback_258_map m ON m.question_id=l.entity_id LEFT JOIN questions q ON q.id=l.entity_id LEFT JOIN _rollback_258_scope e ON e.topic_id=m.topic_id LEFT JOIN topics t ON t.id=m.topic_id WHERE l.migration_id='258_wassce_remaining_topic_mapping_part_07' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id OR q.id IS NULL OR e.topic_id IS NULL OR q.subject_id IS NOT e.subject_id OR (q.topic_id IS NOT NULL AND (t.id IS NULL OR t.subject_id IS NOT e.subject_id)) OR (q.topic_id IS NOT l.new_value AND q.topic_id IS NOT NULL)))
 AND ((SELECT COUNT(*) FROM questions q JOIN _rollback_258_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
   OR (SELECT COUNT(*) FROM questions q JOIN _rollback_258_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100)
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id WHERE l.migration_id IN ('259_wassce_remaining_topic_mapping_part_08','260_wassce_remaining_topic_mapping_part_09','261_wassce_remaining_topic_mapping_part_10','262_wassce_remaining_topic_mapping_part_11','263_wassce_remaining_topic_mapping_part_12','264_wassce_remaining_topic_mapping_part_13','265_wassce_remaining_topic_mapping_part_14','266_wassce_remaining_topic_mapping_part_15') AND l.entity_type='question' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)=0
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN _rollback_258_map m ON m.question_id=l.entity_id WHERE l.migration_id='258_wassce_remaining_topic_mapping_part_07' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS questions.topic_id AND l.entity_id=questions.id);
INSERT INTO _rollback_258_guard(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN _rollback_258_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100 THEN 1 ELSE 0 END;
DROP TABLE _rollback_258_scope;
DROP TABLE _rollback_258_map;
DROP TABLE _rollback_258_guard;
