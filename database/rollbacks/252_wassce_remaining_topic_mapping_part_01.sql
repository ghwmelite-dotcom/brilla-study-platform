-- Roll back 252_wassce_remaining_topic_mapping_part_01; restore only ledger-proven NULL topic IDs.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _rollback_252_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _rollback_252_guard;
CREATE TABLE IF NOT EXISTS _rollback_252_topics(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT NOT NULL,description TEXT NOT NULL);
DELETE FROM _rollback_252_topics;
INSERT INTO _rollback_252_topics VALUES
 ('topic_eco_development','subj_wassce_economics','Economic Development and Planning','economic-development-planning','Economic growth, development indicators, planning and development policy.'),
 ('topic_eco_public_finance','subj_wassce_economics','Public Finance','public-finance','Government revenue, expenditure, taxation, budgets, public goods and fiscal policy.'),
 ('topic_gov_international','subj_wassce_government','Foreign Policy and International Organizations','foreign-policy-international-organizations','Foreign policy, diplomacy, regional bodies and international organizations.'),
 ('topic_gov_public_admin','subj_wassce_government','Public Administration','public-administration','Civil service, public corporations, local government and administrative practice.'),
 ('topic_gov_west_africa_development','subj_wassce_government','Political Developments in West Africa','political-developments-west-africa','Colonial and post-colonial political developments across West African states.'),
 ('topic_wassce_biology_diversity_environment','subj_wassce_biology','Diversity of Living Things and their Environment','diversity-living-things-environment','Classification, ecology, adaptation, evolution and organism-environment relationships.'),
 ('topic_wassce_biology_life_fundamental_unit','subj_wassce_biology','Life in Fundamental Unit','life-fundamental-unit','Cellular organization and the fundamental processes that sustain life.'),
 ('topic_wassce_biology_systems_life','subj_wassce_biology','Systems of Life','systems-of-life','Mammalian and plant transport, coordination, reproduction and homeostasis.'),
 ('topic_wassce_chem_carbon','subj_wassce_chemistry','Chemistry of Carbon Compounds','chemistry-carbon-compounds','Hydrocarbons, functional groups, polymers and organic chemical reactions.'),
 ('topic_wassce_chem_elements','subj_wassce_chemistry','Systematic Chemistry of the Elements','systematic-chemistry-elements','Periodic trends and the properties and reactions of metals and non-metals.'),
 ('topic_wassce_chem_physical','subj_wassce_chemistry','Physical Chemistry','physical-chemistry','Matter, atomic structure, bonding, quantitative chemistry, energetics, kinetics and equilibrium.'),
 ('topic_wassce_core_math_algebra','subj_wassce_core_math','Algebraic Reasoning','algebraic-reasoning','Expressions, equations, inequalities, variation, functions and sequences.'),
 ('topic_wassce_core_math_data','subj_wassce_core_math','Making Sense of and Using Data','making-sense-using-data','Statistics, probability, graphical representation and interpretation of data.'),
 ('topic_wassce_core_math_geometry','subj_wassce_core_math','Geometry Around Us','geometry-around-us','Mensuration, transformations, trigonometry, coordinate geometry and vectors.'),
 ('topic_wassce_core_math_numbers','subj_wassce_core_math','Numbers for Everyday Life','numbers-everyday-life','Number concepts, operations, ratio, rates, percentages and financial applications.'),
 ('topic_wassce_english_literary_devices','subj_wassce_english','Literary Devices','literary-devices','Figures of speech and other literary terms used in English-language interpretation.'),
 ('topic_wassce_physics_atomic_nuclear','subj_wassce_physics','Atomic and Nuclear Physics','atomic-nuclear-physics','Atomic structure, radioactivity, nuclear energy and modern physics.'),
 ('topic_wassce_physics_energy','subj_wassce_physics','Energy','energy','Work, power, heat, optics, sound and wave phenomena.'),
 ('topic_wassce_physics_fields_electronics','subj_wassce_physics','Electric Field, Magnetic Field and Electronics','electric-magnetic-fields-electronics','Electricity, magnetism, circuits and semiconductor electronics.'),
 ('topic_wassce_physics_mechanics_matter','subj_wassce_physics','Mechanics and Matter','mechanics-and-matter','Measurement, motion, forces and the mechanical properties of matter.');
CREATE TABLE IF NOT EXISTS _rollback_252_map(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM _rollback_252_map;
INSERT INTO _rollback_252_map VALUES
 ('q_acc_2023_001','topic_acc_intro'),
 ('q_acc_2023_002','topic_acc_intro'),
 ('q_acc_2023_003','topic_acc_intro'),
 ('q_acc_2023_004','topic_acc_intro'),
 ('q_acc_2023_005','topic_acc_intro'),
 ('q_acc_2023_006','topic_acc_intro'),
 ('q_acc_2023_007','topic_acc_intro'),
 ('q_acc_2023_008','topic_acc_intro'),
 ('q_acc_2023_009','topic_acc_intro'),
 ('q_acc_2023_010','topic_acc_intro'),
 ('q_acc_2023_011','topic_acc_ledger'),
 ('q_acc_2023_012','topic_acc_ledger'),
 ('q_acc_2023_013','topic_acc_ledger'),
 ('q_acc_2023_014','topic_acc_ledger'),
 ('q_acc_2023_015','topic_acc_ledger'),
 ('q_acc_2023_016','topic_acc_books'),
 ('q_acc_2023_017','topic_acc_books'),
 ('q_acc_2023_018','topic_acc_ledger'),
 ('q_acc_2023_019','topic_acc_books'),
 ('q_acc_2023_020','topic_acc_books'),
 ('q_acc_2023_021','topic_acc_trial'),
 ('q_acc_2023_022','topic_acc_errors'),
 ('q_acc_2023_023','topic_acc_errors'),
 ('q_acc_2023_024','topic_acc_errors'),
 ('q_acc_2023_025','topic_acc_errors'),
 ('q_acc_2023_026','topic_acc_errors'),
 ('q_acc_2023_027','topic_acc_errors'),
 ('q_acc_2023_028','topic_acc_errors'),
 ('q_acc_2023_029','topic_acc_trial'),
 ('q_acc_2023_030','topic_acc_ledger'),
 ('q_acc_2023_031','topic_acc_final'),
 ('q_acc_2023_032','topic_acc_final'),
 ('q_acc_2023_033','topic_acc_final'),
 ('q_acc_2023_034','topic_acc_final'),
 ('q_acc_2023_035','topic_acc_final'),
 ('q_acc_2023_036','topic_acc_final'),
 ('q_acc_2023_037','topic_acc_final'),
 ('q_acc_2023_038','topic_acc_final'),
 ('q_acc_2023_039','topic_acc_final'),
 ('q_acc_2023_040','topic_acc_final'),
 ('q_acc_2023_041','topic_acc_final'),
 ('q_acc_2023_042','topic_acc_final'),
 ('q_acc_2023_043','topic_acc_final'),
 ('q_acc_2023_044','topic_acc_final'),
 ('q_acc_2023_045','topic_acc_partnership'),
 ('q_acc_2023_046','topic_acc_partnership'),
 ('q_acc_2023_047','topic_acc_partnership'),
 ('q_acc_2023_048','topic_acc_nonprofit'),
 ('q_acc_2023_049','topic_acc_nonprofit'),
 ('q_acc_2023_050','topic_acc_nonprofit'),
 ('q_acc_2024_001','topic_acc_intro'),
 ('q_acc_2024_002','topic_acc_books'),
 ('q_acc_2024_003','topic_acc_intro'),
 ('q_acc_2024_004','topic_acc_intro'),
 ('q_acc_2024_005','topic_acc_intro'),
 ('q_acc_2024_006','topic_acc_books'),
 ('q_acc_2024_007','topic_acc_books'),
 ('q_acc_2024_008','topic_acc_intro'),
 ('q_acc_2024_009','topic_acc_intro'),
 ('q_acc_2024_010','topic_acc_trial'),
 ('q_acc_2024_011','topic_acc_books'),
 ('q_acc_2024_012','topic_acc_books'),
 ('q_acc_2024_013','topic_acc_ledger'),
 ('q_acc_2024_014','topic_acc_ledger'),
 ('q_acc_2024_015','topic_acc_ledger'),
 ('q_acc_2024_016','topic_acc_books'),
 ('q_acc_2024_017','topic_acc_books'),
 ('q_acc_2024_018','topic_acc_books'),
 ('q_acc_2024_019','topic_acc_books'),
 ('q_acc_2024_020','topic_acc_ledger'),
 ('q_acc_2024_021','topic_acc_final'),
 ('q_acc_2024_022','topic_acc_final'),
 ('q_acc_2024_023','topic_acc_final'),
 ('q_acc_2024_024','topic_acc_final'),
 ('q_acc_2024_025','topic_acc_final'),
 ('q_acc_2024_026','topic_acc_final'),
 ('q_acc_2024_027','topic_acc_final'),
 ('q_acc_2024_028','topic_acc_final'),
 ('q_acc_2024_029','topic_acc_final'),
 ('q_acc_2024_030','topic_acc_final'),
 ('q_acc_2024_031','topic_acc_depreciation'),
 ('q_acc_2024_032','topic_acc_depreciation'),
 ('q_acc_2024_033','topic_acc_depreciation'),
 ('q_acc_2024_034','topic_acc_final'),
 ('q_acc_2024_035','topic_acc_final'),
 ('q_acc_2024_036','topic_acc_depreciation'),
 ('q_acc_2024_037','topic_acc_final'),
 ('q_acc_2024_038','topic_acc_final'),
 ('q_acc_2024_039','topic_acc_depreciation'),
 ('q_acc_2024_040','topic_acc_depreciation'),
 ('q_acc_2024_041','topic_acc_bank'),
 ('q_acc_2024_042','topic_acc_bank'),
 ('q_acc_2024_043','topic_acc_bank'),
 ('q_acc_2024_044','topic_acc_bank'),
 ('q_acc_2024_045','topic_acc_ledger'),
 ('q_acc_2024_046','topic_acc_ledger'),
 ('q_acc_2024_047','topic_acc_ledger'),
 ('q_acc_2024_048','topic_acc_ledger'),
 ('q_acc_2024_049','topic_acc_bank'),
 ('q_acc_2024_050','topic_acc_bank');
CREATE TABLE IF NOT EXISTS _rollback_252_scope(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM _rollback_252_scope;
INSERT INTO _rollback_252_scope VALUES
 ('topic_acc_bank','subj_wassce_accounting'),
 ('topic_acc_books','subj_wassce_accounting'),
 ('topic_acc_depreciation','subj_wassce_accounting'),
 ('topic_acc_errors','subj_wassce_accounting'),
 ('topic_acc_final','subj_wassce_accounting'),
 ('topic_acc_intro','subj_wassce_accounting'),
 ('topic_acc_ledger','subj_wassce_accounting'),
 ('topic_acc_nonprofit','subj_wassce_accounting'),
 ('topic_acc_partnership','subj_wassce_accounting'),
 ('topic_acc_trial','subj_wassce_accounting');
INSERT INTO _rollback_252_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _rollback_252_map)=100
 AND (SELECT COUNT(*) FROM _rollback_252_scope)=10
 AND ((SELECT COUNT(*) FROM _rollback_252_topics)=20
 AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter')) IN (0,20)
 AND ((SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=0
   OR (SELECT COUNT(*) FROM topics t JOIN _rollback_252_topics p ON p.topic_id=t.id
       WHERE t.subject_id IS p.subject_id AND t.parent_id IS NULL AND t.name IS p.name AND t.slug IS p.slug AND t.description IS p.description
         AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=0)=20))
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _rollback_252_map m ON m.question_id=l.entity_id WHERE l.migration_id='252_wassce_remaining_topic_mapping_part_01' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=100
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _rollback_252_map m ON m.question_id=l.entity_id LEFT JOIN questions q ON q.id=l.entity_id LEFT JOIN _rollback_252_scope e ON e.topic_id=m.topic_id LEFT JOIN topics t ON t.id=m.topic_id WHERE l.migration_id='252_wassce_remaining_topic_mapping_part_01' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id OR q.id IS NULL OR e.topic_id IS NULL OR q.subject_id IS NOT e.subject_id OR (q.topic_id IS NOT NULL AND (t.id IS NULL OR t.subject_id IS NOT e.subject_id)) OR (q.topic_id IS NOT l.new_value AND q.topic_id IS NOT NULL)))
 AND ((SELECT COUNT(*) FROM questions q JOIN _rollback_252_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
   OR (SELECT COUNT(*) FROM questions q JOIN _rollback_252_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100)
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id WHERE l.migration_id IN ('253_wassce_remaining_topic_mapping_part_02','254_wassce_remaining_topic_mapping_part_03','255_wassce_remaining_topic_mapping_part_04','256_wassce_remaining_topic_mapping_part_05','257_wassce_remaining_topic_mapping_part_06','258_wassce_remaining_topic_mapping_part_07','259_wassce_remaining_topic_mapping_part_08','260_wassce_remaining_topic_mapping_part_09','261_wassce_remaining_topic_mapping_part_10','262_wassce_remaining_topic_mapping_part_11','263_wassce_remaining_topic_mapping_part_12','264_wassce_remaining_topic_mapping_part_13','265_wassce_remaining_topic_mapping_part_14','266_wassce_remaining_topic_mapping_part_15') AND l.entity_type='question' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)=0
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN _rollback_252_map m ON m.question_id=l.entity_id WHERE l.migration_id='252_wassce_remaining_topic_mapping_part_01' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS questions.topic_id AND l.entity_id=questions.id);
INSERT INTO _rollback_252_guard(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN _rollback_252_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100 THEN 1 ELSE 0 END;
INSERT INTO _rollback_252_guard(valid)
SELECT CASE WHEN
 NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id WHERE l.migration_id IN ('252_wassce_remaining_topic_mapping_part_01','253_wassce_remaining_topic_mapping_part_02','254_wassce_remaining_topic_mapping_part_03','255_wassce_remaining_topic_mapping_part_04','256_wassce_remaining_topic_mapping_part_05','257_wassce_remaining_topic_mapping_part_06','258_wassce_remaining_topic_mapping_part_07','259_wassce_remaining_topic_mapping_part_08','260_wassce_remaining_topic_mapping_part_09','261_wassce_remaining_topic_mapping_part_10','262_wassce_remaining_topic_mapping_part_11','263_wassce_remaining_topic_mapping_part_12','264_wassce_remaining_topic_mapping_part_13','265_wassce_remaining_topic_mapping_part_14','266_wassce_remaining_topic_mapping_part_15') AND l.entity_type='question' AND l.field_name='topic_id' AND q.topic_id IS l.new_value)
 AND NOT EXISTS (SELECT 1 FROM questions WHERE topic_id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))
THEN 1 ELSE 0 END;
DELETE FROM topics WHERE id IN (SELECT topic_id FROM _rollback_252_topics);
INSERT INTO _rollback_252_guard(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=0 THEN 1 ELSE 0 END;
DROP TABLE _rollback_252_topics;
DROP TABLE _rollback_252_scope;
DROP TABLE _rollback_252_map;
DROP TABLE _rollback_252_guard;
