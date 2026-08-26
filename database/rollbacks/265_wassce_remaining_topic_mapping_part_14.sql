-- Roll back 265_wassce_remaining_topic_mapping_part_14; restore only ledger-proven NULL topic IDs.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _rollback_265_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_265_guard;
CREATE TABLE IF NOT EXISTS _rollback_265_map(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM _rollback_265_map;
INSERT INTO _rollback_265_map VALUES
 ('q_soc_2024_046','topic_wassce_social_citizenship'),
 ('q_soc_2024_047','topic_wassce_social_governance'),
 ('q_soc_2024_048','topic_wassce_social_culture'),
 ('q_soc_2024_049','topic_wassce_social_governance'),
 ('q_soc_2024_050','topic_wassce_social_governance'),
 ('q_wassce_bio_2023_01','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_02','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_03','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_04','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_05','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_06','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_07','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_08','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_09','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_10','topic_wassce_biology_life_fundamental_unit'),
 ('q_wassce_bio_2023_31','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_32','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_33','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_34','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_35','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_36','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_37','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_38','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_39','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_40','topic_wassce_biology_systems_life'),
 ('q_wassce_bio_2023_41','topic_wassce_biology_diversity_environment'),
 ('q_wassce_bio_2023_42','topic_wassce_biology_diversity_environment'),
 ('q_wassce_bio_2023_43','topic_wassce_biology_diversity_environment'),
 ('q_wassce_bio_2023_44','topic_wassce_biology_diversity_environment'),
 ('q_wassce_bio_2023_45','topic_wassce_biology_diversity_environment'),
 ('q_wassce_bio_2023_46','topic_wassce_biology_diversity_environment'),
 ('q_wassce_bio_2023_47','topic_wassce_biology_diversity_environment'),
 ('q_wassce_bio_2023_48','topic_wassce_biology_diversity_environment'),
 ('q_wassce_bio_2023_49','topic_wassce_biology_diversity_environment'),
 ('q_wassce_bio_2023_50','topic_wassce_biology_diversity_environment'),
 ('q_wassce_chem_2023_01','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_02','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_03','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_04','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_05','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_06','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_07','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_08','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_09','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_10','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_11','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_12','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_13','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_14','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_15','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_16','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_17','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_18','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_19','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_20','topic_wassce_chem_elements'),
 ('q_wassce_chem_2023_21','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_22','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_23','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_24','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_25','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_26','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_27','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_28','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_29','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_30','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_31','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_32','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_33','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_34','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_35','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_36','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_37','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_38','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_39','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_40','topic_wassce_chem_carbon'),
 ('q_wassce_chem_2023_41','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_42','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_43','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_44','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_45','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_46','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_47','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_48','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_49','topic_wassce_chem_physical'),
 ('q_wassce_chem_2023_50','topic_wassce_chem_physical'),
 ('q_wassce_phy_2023_31','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_32','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_33','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_34','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_35','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_36','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_37','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_38','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_39','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_40','topic_wassce_physics_fields_electronics'),
 ('q_wassce_phy_2023_41','topic_wassce_physics_energy'),
 ('q_wassce_phy_2023_42','topic_wassce_physics_energy'),
 ('q_wassce_phy_2023_43','topic_wassce_physics_energy'),
 ('q_wassce_phy_2023_44','topic_wassce_physics_energy'),
 ('q_wassce_phy_2023_45','topic_wassce_physics_energy');
CREATE TABLE IF NOT EXISTS _rollback_265_scope(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM _rollback_265_scope;
INSERT INTO _rollback_265_scope VALUES
 ('topic_wassce_biology_diversity_environment','subj_wassce_biology'),
 ('topic_wassce_biology_life_fundamental_unit','subj_wassce_biology'),
 ('topic_wassce_biology_systems_life','subj_wassce_biology'),
 ('topic_wassce_chem_carbon','subj_wassce_chemistry'),
 ('topic_wassce_chem_elements','subj_wassce_chemistry'),
 ('topic_wassce_chem_physical','subj_wassce_chemistry'),
 ('topic_wassce_physics_energy','subj_wassce_physics'),
 ('topic_wassce_physics_fields_electronics','subj_wassce_physics'),
 ('topic_wassce_social_citizenship','subj_wassce_social'),
 ('topic_wassce_social_culture','subj_wassce_social'),
 ('topic_wassce_social_governance','subj_wassce_social');
INSERT INTO _rollback_265_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _rollback_265_map)=100
 AND (SELECT COUNT(*) FROM _rollback_265_scope)=11
 AND ((SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=20
 AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter') AND NOT (t.subject_id IS CASE t.id WHEN 'topic_eco_development' THEN 'subj_wassce_economics' WHEN 'topic_eco_public_finance' THEN 'subj_wassce_economics' WHEN 'topic_gov_international' THEN 'subj_wassce_government' WHEN 'topic_gov_public_admin' THEN 'subj_wassce_government' WHEN 'topic_gov_west_africa_development' THEN 'subj_wassce_government' WHEN 'topic_wassce_biology_diversity_environment' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_life_fundamental_unit' THEN 'subj_wassce_biology' WHEN 'topic_wassce_biology_systems_life' THEN 'subj_wassce_biology' WHEN 'topic_wassce_chem_carbon' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_elements' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_chem_physical' THEN 'subj_wassce_chemistry' WHEN 'topic_wassce_core_math_algebra' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_data' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_geometry' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_core_math_numbers' THEN 'subj_wassce_core_math' WHEN 'topic_wassce_english_literary_devices' THEN 'subj_wassce_english' WHEN 'topic_wassce_physics_atomic_nuclear' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_energy' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_fields_electronics' THEN 'subj_wassce_physics' WHEN 'topic_wassce_physics_mechanics_matter' THEN 'subj_wassce_physics' END)))
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _rollback_265_map m ON m.question_id=l.entity_id WHERE l.migration_id='265_wassce_remaining_topic_mapping_part_14' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=100
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _rollback_265_map m ON m.question_id=l.entity_id LEFT JOIN questions q ON q.id=l.entity_id LEFT JOIN _rollback_265_scope e ON e.topic_id=m.topic_id LEFT JOIN topics t ON t.id=m.topic_id WHERE l.migration_id='265_wassce_remaining_topic_mapping_part_14' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id OR q.id IS NULL OR e.topic_id IS NULL OR q.subject_id IS NOT e.subject_id OR (q.topic_id IS NOT NULL AND (t.id IS NULL OR t.subject_id IS NOT e.subject_id)) OR (q.topic_id IS NOT l.new_value AND q.topic_id IS NOT NULL)))
 AND ((SELECT COUNT(*) FROM questions q JOIN _rollback_265_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
   OR (SELECT COUNT(*) FROM questions q JOIN _rollback_265_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100)
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id WHERE l.migration_id IN ('266_wassce_remaining_topic_mapping_part_15') AND l.entity_type='question' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)=0
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN _rollback_265_map m ON m.question_id=l.entity_id WHERE l.migration_id='265_wassce_remaining_topic_mapping_part_14' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS questions.topic_id AND l.entity_id=questions.id);
INSERT INTO _rollback_265_guard(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN _rollback_265_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100 THEN 1 ELSE 0 END;
DROP TABLE _rollback_265_scope;
DROP TABLE _rollback_265_map;
DROP TABLE _rollback_265_guard;
