-- Roll back 260_wassce_remaining_topic_mapping_part_09; restore only ledger-proven NULL topic IDs.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _rollback_260_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_260_guard;
CREATE TABLE IF NOT EXISTS _rollback_260_map(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM _rollback_260_map;
INSERT INTO _rollback_260_map VALUES
 ('q_gov_2023_041','topic_gov_international'),
 ('q_gov_2023_042','topic_gov_international'),
 ('q_gov_2023_043','topic_gov_international'),
 ('q_gov_2023_044','topic_gov_international'),
 ('q_gov_2023_045','topic_gov_international'),
 ('q_gov_2023_046','topic_gov_international'),
 ('q_gov_2023_047','topic_gov_international'),
 ('q_gov_2023_048','topic_gov_west_africa_development'),
 ('q_gov_2023_049','topic_gov_west_africa_development'),
 ('q_gov_2023_050','topic_gov_west_africa_development'),
 ('q_gov_2024_001','topic_gov_intro'),
 ('q_gov_2024_002','topic_gov_organs'),
 ('q_gov_2024_003','topic_gov_organs'),
 ('q_gov_2024_004','topic_gov_parties'),
 ('q_gov_2024_005','topic_gov_intro'),
 ('q_gov_2024_006','topic_gov_systems'),
 ('q_gov_2024_007','topic_gov_parties'),
 ('q_gov_2024_008','topic_gov_organs'),
 ('q_gov_2024_009','topic_gov_parties'),
 ('q_gov_2024_010','topic_gov_intro'),
 ('q_gov_2024_011','topic_gov_systems'),
 ('q_gov_2024_012','topic_gov_systems'),
 ('q_gov_2024_013','topic_gov_systems'),
 ('q_gov_2024_014','topic_gov_systems'),
 ('q_gov_2024_015','topic_gov_constitution'),
 ('q_gov_2024_016','topic_gov_organs'),
 ('q_gov_2024_017','topic_gov_organs'),
 ('q_gov_2024_018','topic_gov_organs'),
 ('q_gov_2024_019','topic_gov_organs'),
 ('q_gov_2024_020','topic_gov_organs'),
 ('q_gov_2024_021','topic_gov_elections'),
 ('q_gov_2024_022','topic_gov_elections'),
 ('q_gov_2024_023','topic_gov_elections'),
 ('q_gov_2024_024','topic_gov_elections'),
 ('q_gov_2024_025','topic_gov_elections'),
 ('q_gov_2024_026','topic_gov_elections'),
 ('q_gov_2024_027','topic_gov_elections'),
 ('q_gov_2024_028','topic_gov_elections'),
 ('q_gov_2024_029','topic_gov_elections'),
 ('q_gov_2024_030','topic_gov_elections'),
 ('q_gov_2024_031','topic_gov_rights'),
 ('q_gov_2024_032','topic_gov_rights'),
 ('q_gov_2024_033','topic_gov_rights'),
 ('q_gov_2024_034','topic_gov_rights'),
 ('q_gov_2024_035','topic_gov_rights'),
 ('q_gov_2024_036','topic_gov_rights'),
 ('q_gov_2024_037','topic_gov_rights'),
 ('q_gov_2024_038','topic_gov_rights'),
 ('q_gov_2024_039','topic_gov_rights'),
 ('q_gov_2024_040','topic_gov_rights'),
 ('q_gov_2024_041','topic_gov_international'),
 ('q_gov_2024_042','topic_gov_international'),
 ('q_gov_2024_043','topic_gov_international'),
 ('q_gov_2024_044','topic_gov_international'),
 ('q_gov_2024_045','topic_gov_international'),
 ('q_gov_2024_046','topic_gov_international'),
 ('q_gov_2024_047','topic_gov_international'),
 ('q_gov_2024_048','topic_gov_ghana'),
 ('q_gov_2024_049','topic_gov_ghana'),
 ('q_gov_2024_050','topic_gov_ghana'),
 ('q_gov_arms_001','topic_gov_organs'),
 ('q_gov_arms_002','topic_gov_organs'),
 ('q_gov_arms_003','topic_gov_organs'),
 ('q_gov_arms_004','topic_gov_organs'),
 ('q_gov_arms_005','topic_gov_organs'),
 ('q_gov_local_001','topic_gov_ghana'),
 ('q_gov_local_002','topic_gov_ghana'),
 ('q_gov_local_003','topic_gov_ghana'),
 ('q_gov_local_004','topic_gov_ghana'),
 ('q_gov_local_005','topic_gov_ghana'),
 ('q_his_au_001','topic_hist_au'),
 ('q_his_au_002','topic_hist_au'),
 ('q_his_au_003','topic_hist_au'),
 ('q_his_au_004','topic_hist_au'),
 ('q_his_au_005','topic_hist_au'),
 ('q_his_cw_001','topic_hist_world2'),
 ('q_his_cw_002','topic_hist_world2'),
 ('q_his_cw_003','topic_hist_world2'),
 ('q_his_cw_004','topic_hist_world2'),
 ('q_his_cw_005','topic_hist_world2'),
 ('q_his_nig_001','topic_hist_nigeria'),
 ('q_his_nig_002','topic_hist_nigeria'),
 ('q_his_nig_003','topic_hist_nigeria'),
 ('q_his_nig_004','topic_hist_nigeria'),
 ('q_his_nig_005','topic_hist_nigeria'),
 ('q_his_post_001','topic_hist_postcolonial'),
 ('q_his_post_002','topic_hist_postcolonial'),
 ('q_his_post_003','topic_hist_postcolonial'),
 ('q_his_post_004','topic_hist_postcolonial'),
 ('q_his_post_005','topic_hist_postcolonial'),
 ('q_his_ww_001','topic_hist_world1'),
 ('q_his_ww_002','topic_hist_world1'),
 ('q_his_ww_003','topic_hist_world1'),
 ('q_his_ww_004','topic_hist_world1'),
 ('q_his_ww_005','topic_hist_world1'),
 ('q_ict_wp_001','topic_ict_wordproc'),
 ('q_ict_wp_002','topic_ict_wordproc'),
 ('q_ict_wp_003','topic_ict_wordproc'),
 ('q_ict_wp_004','topic_ict_wordproc'),
 ('q_ict_wp_005','topic_ict_wordproc');
CREATE TABLE IF NOT EXISTS _rollback_260_scope(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM _rollback_260_scope;
INSERT INTO _rollback_260_scope VALUES
 ('topic_gov_constitution','subj_wassce_government'),
 ('topic_gov_elections','subj_wassce_government'),
 ('topic_gov_ghana','subj_wassce_government'),
 ('topic_gov_international','subj_wassce_government'),
 ('topic_gov_intro','subj_wassce_government'),
 ('topic_gov_organs','subj_wassce_government'),
 ('topic_gov_parties','subj_wassce_government'),
 ('topic_gov_rights','subj_wassce_government'),
 ('topic_gov_systems','subj_wassce_government'),
 ('topic_gov_west_africa_development','subj_wassce_government'),
 ('topic_hist_au','subj_wassce_history'),
 ('topic_hist_nigeria','subj_wassce_history'),
 ('topic_hist_postcolonial','subj_wassce_history'),
 ('topic_hist_world1','subj_wassce_history'),
 ('topic_hist_world2','subj_wassce_history'),
 ('topic_ict_wordproc','subj_wassce_ict');
INSERT INTO _rollback_260_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _rollback_260_map)=100
 AND (SELECT COUNT(*) FROM _rollback_260_scope)=16
 AND ((SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=20
 AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter') AND NOT (t.subject_id IS CASE t.id WHEN 'topic_eco_development' THEN 'subj_wassce_economics' WHEN 'topic_eco_public_finance' THEN 'subj_wassce_economics' WHEN 'topic_gov_international' THEN 'subj_wassce_government' WHEN 'topic_gov_public_admin' THEN 'subj_wassce_government' WHEN 'topic_gov_west_africa_development' THEN 'subj_wassce_government' WHEN 'topic_wassce_biology_diversity_environment' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_life_fundamental_unit' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_systems_life' THEN 'subj_wassce_biology' WHEN 'topic_wassce_chem_carbon' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_elements' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_physical' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_core_math_algebra' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_data' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_geometry' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_numbers' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_english_literary_devices' THEN 'subj_wassce_english' WHEN 'topic_wassce_physics_atomic_nuclear' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_energy' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_fields_electronics' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_mechanics_matter' THEN 'subj_wassce_physics' END)))
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _rollback_260_map m ON m.question_id=l.entity_id WHERE l.migration_id='260_wassce_remaining_topic_mapping_part_09' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=100
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _rollback_260_map m ON m.question_id=l.entity_id LEFT JOIN questions q ON q.id=l.entity_id LEFT JOIN _rollback_260_scope e ON e.topic_id=m.topic_id LEFT JOIN topics t ON t.id=m.topic_id WHERE l.migration_id='260_wassce_remaining_topic_mapping_part_09' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id OR q.id IS NULL OR e.topic_id IS NULL OR q.subject_id IS NOT e.subject_id OR (q.topic_id IS NOT NULL AND (t.id IS NULL OR t.subject_id IS NOT e.subject_id)) OR (q.topic_id IS NOT l.new_value AND q.topic_id IS NOT NULL)))
 AND ((SELECT COUNT(*) FROM questions q JOIN _rollback_260_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
   OR (SELECT COUNT(*) FROM questions q JOIN _rollback_260_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100)
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id WHERE l.migration_id IN ('261_wassce_remaining_topic_mapping_part_10','262_wassce_remaining_topic_mapping_part_11','263_wassce_remaining_topic_mapping_part_12','264_wassce_remaining_topic_mapping_part_13','265_wassce_remaining_topic_mapping_part_14','266_wassce_remaining_topic_mapping_part_15') AND l.entity_type='question' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)=0
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN _rollback_260_map m ON m.question_id=l.entity_id WHERE l.migration_id='260_wassce_remaining_topic_mapping_part_09' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS questions.topic_id AND l.entity_id=questions.id);
INSERT INTO _rollback_260_guard(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN _rollback_260_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100 THEN 1 ELSE 0 END;
DROP TABLE _rollback_260_scope;
DROP TABLE _rollback_260_map;
DROP TABLE _rollback_260_guard;
