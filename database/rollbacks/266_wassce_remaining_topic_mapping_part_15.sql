-- Roll back 266_wassce_remaining_topic_mapping_part_15; restore only ledger-proven NULL topic IDs.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _rollback_266_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_266_guard;
CREATE TABLE IF NOT EXISTS _rollback_266_map(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM _rollback_266_map;
INSERT INTO _rollback_266_map VALUES
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
CREATE TABLE IF NOT EXISTS _rollback_266_scope(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM _rollback_266_scope;
INSERT INTO _rollback_266_scope VALUES
 ('topic_wassce_core_math_algebra','subj_wassce_core_math'),
 ('topic_wassce_core_math_data','subj_wassce_core_math'),
 ('topic_wassce_core_math_geometry','subj_wassce_core_math'),
 ('topic_wassce_core_math_numbers','subj_wassce_core_math');
INSERT INTO _rollback_266_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _rollback_266_map)=100
 AND (SELECT COUNT(*) FROM _rollback_266_scope)=4
 AND ((SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=20
 AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter') AND NOT (t.subject_id IS CASE t.id WHEN 'topic_eco_development' THEN 'subj_wassce_economics' WHEN 'topic_eco_public_finance' THEN 'subj_wassce_economics' WHEN 'topic_gov_international' THEN 'subj_wassce_government' WHEN 'topic_gov_public_admin' THEN 'subj_wassce_government' WHEN 'topic_gov_west_africa_development' THEN 'subj_wassce_government' WHEN 'topic_wassce_biology_diversity_environment' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_life_fundamental_unit' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_systems_life' THEN 'subj_wassce_biology' WHEN 'topic_wassce_chem_carbon' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_elements' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_physical' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_core_math_algebra' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_data' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_geometry' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_numbers' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_english_literary_devices' THEN 'subj_wassce_english' WHEN 'topic_wassce_physics_atomic_nuclear' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_energy' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_fields_electronics' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_mechanics_matter' THEN 'subj_wassce_physics' END)))
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _rollback_266_map m ON m.question_id=l.entity_id WHERE l.migration_id='266_wassce_remaining_topic_mapping_part_15' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=100
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _rollback_266_map m ON m.question_id=l.entity_id LEFT JOIN questions q ON q.id=l.entity_id LEFT JOIN _rollback_266_scope e ON e.topic_id=m.topic_id LEFT JOIN topics t ON t.id=m.topic_id WHERE l.migration_id='266_wassce_remaining_topic_mapping_part_15' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id OR q.id IS NULL OR e.topic_id IS NULL OR q.subject_id IS NOT e.subject_id OR (q.topic_id IS NOT NULL AND (t.id IS NULL OR t.subject_id IS NOT e.subject_id)) OR (q.topic_id IS NOT l.new_value AND q.topic_id IS NOT NULL)))
 AND ((SELECT COUNT(*) FROM questions q JOIN _rollback_266_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
   OR (SELECT COUNT(*) FROM questions q JOIN _rollback_266_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100)
 AND 0=0
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN _rollback_266_map m ON m.question_id=l.entity_id WHERE l.migration_id='266_wassce_remaining_topic_mapping_part_15' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS questions.topic_id AND l.entity_id=questions.id);
INSERT INTO _rollback_266_guard(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN _rollback_266_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100 THEN 1 ELSE 0 END;
DROP TABLE _rollback_266_scope;
DROP TABLE _rollback_266_map;
DROP TABLE _rollback_266_guard;
