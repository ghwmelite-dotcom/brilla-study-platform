-- 252: WASSCE remaining-topic remediation batch 1/15 (exactly 100 authoritative live rows).
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _migration_252_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _migration_252_guard;
CREATE TABLE IF NOT EXISTS _migration_252_map(question_id TEXT PRIMARY KEY,topic_id TEXT NOT NULL);
DELETE FROM _migration_252_map;
INSERT INTO _migration_252_map VALUES
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
CREATE TABLE IF NOT EXISTS _migration_252_scope(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL);
DELETE FROM _migration_252_scope;
INSERT INTO _migration_252_scope VALUES
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
INSERT INTO _migration_252_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _migration_252_map)=100
 AND (SELECT COUNT(*) FROM _migration_252_scope)=10

 AND NOT EXISTS (SELECT 1 FROM _migration_252_map m LEFT JOIN _migration_252_scope e ON e.topic_id=m.topic_id LEFT JOIN questions q ON q.id=m.question_id LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN topics t ON t.id=m.topic_id
  WHERE e.topic_id IS NULL OR q.id IS NULL OR q.subject_id IS NOT e.subject_id OR s.id IS NULL OR s.exam_type_id IS NOT 'exam_wassce' OR s.is_active<>1 OR (t.id IS NULL AND m.topic_id NOT IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter')) OR (t.id IS NOT NULL AND t.subject_id IS NOT e.subject_id) OR (q.topic_id IS NOT NULL AND q.topic_id IS NOT m.topic_id))
 AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l LEFT JOIN _migration_252_map m ON m.question_id=l.entity_id
  WHERE l.migration_id='252_wassce_remaining_topic_mapping_part_01' AND (l.entity_type IS NOT 'question' OR l.field_name IS NOT 'topic_id' OR l.old_value IS NOT NULL OR m.question_id IS NULL OR l.new_value IS NOT m.topic_id))
 AND (1=1)
 AND (((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='252_wassce_remaining_topic_mapping_part_01')=0
       AND (SELECT COUNT(*) FROM questions q JOIN _migration_252_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100)
   OR ((SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id='252_wassce_remaining_topic_mapping_part_01')=100
       AND ((SELECT COUNT(*) FROM questions q JOIN _migration_252_map m ON m.question_id=q.id WHERE q.topic_id IS NULL)=100
         OR (SELECT COUNT(*) FROM questions q JOIN _migration_252_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100)))
 AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
CREATE TABLE IF NOT EXISTS _m252_sources(source_key TEXT PRIMARY KEY,authority TEXT NOT NULL,title TEXT NOT NULL,url TEXT NOT NULL);
DELETE FROM _m252_sources;
INSERT INTO _m252_sources VALUES
 ('source_01','West African Examinations Council, Ghana','WAEC Ghana Economics Detailed Syllabus','https://waecgh.org/wp-content/uploads/2024/07/ECONOMICS.pdf'),
 ('source_02','West African Examinations Council, Ghana','WAEC Ghana Government Syllabus','https://waecgh.org/wp-content/uploads/2024/07/GOVERNMENT.pdf'),
 ('source_03','West African Examinations Council','WASSCE Government e-learning: political developments in West Africa','https://www.waeconline.org.ng/e-learning/Government/Govt240mq9.html'),
 ('source_04','National Council for Curriculum and Assessment (NaCCA), Ghana','Biology Curriculum for Secondary Education (SHS 1-3), September 2023','https://nacca.gov.gh/wp-content/uploads/2025/04/Biology-Curriculum.pdf'),
 ('source_05','National Council for Curriculum and Assessment (NaCCA), Ghana','Chemistry Curriculum for Secondary Education (SHS 1-3), September 2023','https://nacca.gov.gh/wp-content/uploads/2025/04/Chemistry-Curriculum.pdf'),
 ('source_06','National Council for Curriculum and Assessment (NaCCA), Ghana','Mathematics Curriculum for Secondary Education','https://nacca.gov.gh/wp-content/uploads/2025/04/Mathematics-Curriculum.pdf'),
 ('source_07','National Council for Curriculum and Assessment (NaCCA), Ghana','English Language Curriculum','https://www.nacca.gov.gh/wp-content/uploads/2023/06/ENGLISH-LANGUAGE.pdf'),
 ('source_08','National Council for Curriculum and Assessment (NaCCA), Ghana','Physics Curriculum for Secondary Education (SHS 1-3), September 2023','https://nacca.gov.gh/wp-content/uploads/2025/04/Physics-Curriculum.pdf');
CREATE TABLE IF NOT EXISTS _m252_topics(topic_id TEXT PRIMARY KEY,subject_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT NOT NULL,description TEXT NOT NULL,source_key TEXT NOT NULL);
DELETE FROM _m252_topics;
INSERT INTO _m252_topics VALUES
 ('topic_eco_development','subj_wassce_economics','Economic Development and Planning','economic-development-planning','Economic growth, development indicators, planning and development policy.','source_01'),
 ('topic_eco_public_finance','subj_wassce_economics','Public Finance','public-finance','Government revenue, expenditure, taxation, budgets, public goods and fiscal policy.','source_01'),
 ('topic_gov_international','subj_wassce_government','Foreign Policy and International Organizations','foreign-policy-international-organizations','Foreign policy, diplomacy, regional bodies and international organizations.','source_02'),
 ('topic_gov_public_admin','subj_wassce_government','Public Administration','public-administration','Civil service, public corporations, local government and administrative practice.','source_02'),
 ('topic_gov_west_africa_development','subj_wassce_government','Political Developments in West Africa','political-developments-west-africa','Colonial and post-colonial political developments across West African states.','source_03'),
 ('topic_wassce_biology_diversity_environment','subj_wassce_biology','Diversity of Living Things and their Environment','diversity-living-things-environment','Classification, ecology, adaptation, evolution and organism-environment relationships.','source_04'),
 ('topic_wassce_biology_life_fundamental_unit','subj_wassce_biology','Life in Fundamental Unit','life-fundamental-unit','Cellular organization and the fundamental processes that sustain life.','source_04'),
 ('topic_wassce_biology_systems_life','subj_wassce_biology','Systems of Life','systems-of-life','Mammalian and plant transport, coordination, reproduction and homeostasis.','source_04'),
 ('topic_wassce_chem_carbon','subj_wassce_chemistry','Chemistry of Carbon Compounds','chemistry-carbon-compounds','Hydrocarbons, functional groups, polymers and organic chemical reactions.','source_05'),
 ('topic_wassce_chem_elements','subj_wassce_chemistry','Systematic Chemistry of the Elements','systematic-chemistry-elements','Periodic trends and the properties and reactions of metals and non-metals.','source_05'),
 ('topic_wassce_chem_physical','subj_wassce_chemistry','Physical Chemistry','physical-chemistry','Matter, atomic structure, bonding, quantitative chemistry, energetics, kinetics and equilibrium.','source_05'),
 ('topic_wassce_core_math_algebra','subj_wassce_core_math','Algebraic Reasoning','algebraic-reasoning','Expressions, equations, inequalities, variation, functions and sequences.','source_06'),
 ('topic_wassce_core_math_data','subj_wassce_core_math','Making Sense of and Using Data','making-sense-using-data','Statistics, probability, graphical representation and interpretation of data.','source_06'),
 ('topic_wassce_core_math_geometry','subj_wassce_core_math','Geometry Around Us','geometry-around-us','Mensuration, transformations, trigonometry, coordinate geometry and vectors.','source_06'),
 ('topic_wassce_core_math_numbers','subj_wassce_core_math','Numbers for Everyday Life','numbers-everyday-life','Number concepts, operations, ratio, rates, percentages and financial applications.','source_06'),
 ('topic_wassce_english_literary_devices','subj_wassce_english','Literary Devices','literary-devices','Figures of speech and other literary terms used in English-language interpretation.','source_07'),
 ('topic_wassce_physics_atomic_nuclear','subj_wassce_physics','Atomic and Nuclear Physics','atomic-nuclear-physics','Atomic structure, radioactivity, nuclear energy and modern physics.','source_08'),
 ('topic_wassce_physics_energy','subj_wassce_physics','Energy','energy','Work, power, heat, optics, sound and wave phenomena.','source_08'),
 ('topic_wassce_physics_fields_electronics','subj_wassce_physics','Electric Field, Magnetic Field and Electronics','electric-magnetic-fields-electronics','Electricity, magnetism, circuits and semiconductor electronics.','source_08'),
 ('topic_wassce_physics_mechanics_matter','subj_wassce_physics','Mechanics and Matter','mechanics-and-matter','Measurement, motion, forces and the mechanical properties of matter.','source_08');
INSERT INTO _migration_252_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM _m252_sources)=8
 AND (SELECT COUNT(*) FROM _m252_topics)=20
 AND NOT EXISTS (SELECT 1 FROM _m252_topics p LEFT JOIN _m252_sources s ON s.source_key=p.source_key WHERE s.source_key IS NULL)
 AND NOT EXISTS (SELECT 1 FROM topics t JOIN _m252_topics p ON t.id=p.topic_id WHERE t.subject_id IS NOT p.subject_id OR t.parent_id IS NOT NULL OR t.name IS NOT p.name OR t.slug IS NOT p.slug OR t.description IS NOT p.description OR t.theory_content IS NOT NULL OR t.key_formulas IS NOT NULL OR t.display_order<>0)
 AND NOT EXISTS (SELECT 1 FROM topics t JOIN _m252_topics p ON t.subject_id=p.subject_id AND (t.slug=p.slug OR lower(t.name)=lower(p.name)) WHERE t.id IS NOT p.topic_id)
 AND (SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter')) IN (0,20)
THEN 1 ELSE 0 END;
INSERT OR IGNORE INTO topics(id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order)
SELECT topic_id,subject_id,NULL,name,slug,description,NULL,NULL,0 FROM _m252_topics;
INSERT INTO _migration_252_guard(valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM topics t JOIN _m252_topics p ON p.topic_id=t.id
 WHERE t.subject_id IS p.subject_id AND t.parent_id IS NULL AND t.name IS p.name AND t.slug IS p.slug AND t.description IS p.description AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=0)=20 THEN 1 ELSE 0 END;
DROP TABLE _m252_sources;
INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT '252_wassce_remaining_topic_mapping_part_01','question',q.id,'topic_id',q.topic_id,m.topic_id FROM questions q JOIN _migration_252_map m ON m.question_id=q.id WHERE q.topic_id IS NULL;
UPDATE questions SET topic_id=(SELECT m.topic_id FROM _migration_252_map m WHERE m.question_id=questions.id)
WHERE topic_id IS NULL AND id IN (SELECT question_id FROM _migration_252_map);
INSERT INTO _migration_252_guard(valid)
SELECT CASE WHEN
 (SELECT COUNT(*) FROM topics WHERE id IN ('topic_eco_development','topic_eco_public_finance','topic_gov_international','topic_gov_public_admin','topic_gov_west_africa_development','topic_wassce_biology_diversity_environment','topic_wassce_biology_life_fundamental_unit','topic_wassce_biology_systems_life','topic_wassce_chem_carbon','topic_wassce_chem_elements','topic_wassce_chem_physical','topic_wassce_core_math_algebra','topic_wassce_core_math_data','topic_wassce_core_math_geometry','topic_wassce_core_math_numbers','topic_wassce_english_literary_devices','topic_wassce_physics_atomic_nuclear','topic_wassce_physics_energy','topic_wassce_physics_fields_electronics','topic_wassce_physics_mechanics_matter'))=20
 AND (SELECT COUNT(*) FROM questions q JOIN _migration_252_map m ON m.question_id=q.id WHERE q.topic_id IS m.topic_id)=100
 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN _migration_252_map m ON m.question_id=l.entity_id WHERE l.migration_id='252_wassce_remaining_topic_mapping_part_01' AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS m.topic_id)=100
 AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
DROP TABLE _m252_topics;
DROP TABLE _migration_252_scope;
DROP TABLE _migration_252_map;
DROP TABLE _migration_252_guard;
