-- Migration: Seed O-Level and A-Level Initial Data (Fixed)
-- Seeds exam boards, exam types, subjects, specifications, and paper components
-- Fixed to work with existing schema

-- =============================================
-- SEED EXAM BOARDS
-- =============================================

INSERT OR IGNORE INTO exam_boards (id, name, code, full_name, region, website_url, display_order) VALUES
('board_cambridge', 'Cambridge International', 'CAIE', 'Cambridge Assessment International Education', 'International', 'https://www.cambridgeinternational.org', 1),
('board_edexcel', 'Edexcel', 'EDEXCEL', 'Pearson Edexcel', 'International', 'https://qualifications.pearson.com', 2);

-- =============================================
-- SEED EXAM TYPES (O-Level / A-Level)
-- =============================================

-- Cambridge Exam Types
INSERT OR IGNORE INTO exam_types (id, name, slug, description, country, is_active, display_order, icon, color, exam_board_id, level, grading_scale) VALUES
('igcse', 'Cambridge IGCSE', 'igcse', 'International General Certificate of Secondary Education - equivalent to O-Level', 'International', 1, 10, 'graduation-cap', '#1E40AF', 'board_cambridge', 'IGCSE', 'A*-G'),
('cambridge_as', 'Cambridge AS Level', 'cambridge-as', 'Cambridge International AS Level - first year of A-Level', 'International', 1, 11, 'book-open', '#7C3AED', 'board_cambridge', 'AS', 'A*-E'),
('cambridge_a2', 'Cambridge A Level', 'cambridge-a-level', 'Cambridge International A Level - full qualification', 'International', 1, 12, 'award', '#DC2626', 'board_cambridge', 'A-Level', 'A*-E');

-- Edexcel Exam Types
INSERT OR IGNORE INTO exam_types (id, name, slug, description, country, is_active, display_order, icon, color, exam_board_id, level, grading_scale) VALUES
('edexcel_igcse', 'Edexcel International GCSE', 'edexcel-igcse', 'Pearson Edexcel International GCSE', 'International', 1, 13, 'graduation-cap', '#059669', 'board_edexcel', 'IGCSE', '9-1'),
('edexcel_as', 'Edexcel AS Level', 'edexcel-as', 'Pearson Edexcel International AS Level', 'International', 1, 14, 'book-open', '#0891B2', 'board_edexcel', 'AS', 'A*-E'),
('edexcel_a2', 'Edexcel A Level', 'edexcel-a-level', 'Pearson Edexcel International A Level', 'International', 1, 15, 'award', '#EA580C', 'board_edexcel', 'A-Level', 'A*-E');

-- =============================================
-- SEED SUBJECTS FOR O/A LEVELS (basic columns only)
-- =============================================

-- Cambridge IGCSE Subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_igcse_physics', 'IGCSE Physics', 'igcse-physics', 'atom', '#3B82F6', 'Cambridge IGCSE Physics (0625)', 101),
('subj_igcse_chemistry', 'IGCSE Chemistry', 'igcse-chemistry', 'flask-conical', '#10B981', 'Cambridge IGCSE Chemistry (0620)', 102),
('subj_igcse_biology', 'IGCSE Biology', 'igcse-biology', 'leaf', '#22C55E', 'Cambridge IGCSE Biology (0610)', 103),
('subj_igcse_math', 'IGCSE Mathematics', 'igcse-mathematics', 'calculator', '#8B5CF6', 'Cambridge IGCSE Mathematics (0580)', 104),
('subj_igcse_add_math', 'IGCSE Additional Maths', 'igcse-add-math', 'sigma', '#EC4899', 'Cambridge IGCSE Additional Mathematics (0606)', 105);

-- Cambridge A-Level Subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_alevel_physics', 'A-Level Physics', 'alevel-physics', 'atom', '#2563EB', 'Cambridge International A Level Physics (9702)', 111),
('subj_alevel_chemistry', 'A-Level Chemistry', 'alevel-chemistry', 'flask-conical', '#059669', 'Cambridge International A Level Chemistry (9701)', 112),
('subj_alevel_biology', 'A-Level Biology', 'alevel-biology', 'leaf', '#16A34A', 'Cambridge International A Level Biology (9700)', 113),
('subj_alevel_math', 'A-Level Mathematics', 'alevel-mathematics', 'calculator', '#7C3AED', 'Cambridge International A Level Mathematics (9709)', 114),
('subj_alevel_further_math', 'A-Level Further Maths', 'alevel-further-math', 'sigma', '#DB2777', 'Cambridge International A Level Further Mathematics (9231)', 115);

-- Edexcel IGCSE Subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_edexcel_igcse_physics', 'Edexcel IGCSE Physics', 'edexcel-igcse-physics', 'atom', '#0284C7', 'Edexcel International GCSE Physics (4PH1)', 121),
('subj_edexcel_igcse_chemistry', 'Edexcel IGCSE Chemistry', 'edexcel-igcse-chemistry', 'flask-conical', '#047857', 'Edexcel International GCSE Chemistry (4CH1)', 122),
('subj_edexcel_igcse_biology', 'Edexcel IGCSE Biology', 'edexcel-igcse-biology', 'leaf', '#15803D', 'Edexcel International GCSE Biology (4BI1)', 123),
('subj_edexcel_igcse_math', 'Edexcel IGCSE Mathematics', 'edexcel-igcse-math', 'calculator', '#6D28D9', 'Edexcel International GCSE Mathematics A (4MA1)', 124);

-- =============================================
-- SEED SUBJECT SPECIFICATIONS - CAMBRIDGE IGCSE
-- =============================================

INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, valid_to, total_papers, assessment_info) VALUES
('spec_igcse_physics_2023', 'board_cambridge', 'subj_igcse_physics', 'igcse', '0625', 'Physics', '2023-2025', '2023-01-01', '2025-12-31', 3, '{"core": true, "extended": true, "practical": true}'),
('spec_igcse_chemistry_2023', 'board_cambridge', 'subj_igcse_chemistry', 'igcse', '0620', 'Chemistry', '2023-2025', '2023-01-01', '2025-12-31', 3, '{"core": true, "extended": true, "practical": true}'),
('spec_igcse_biology_2023', 'board_cambridge', 'subj_igcse_biology', 'igcse', '0610', 'Biology', '2023-2025', '2023-01-01', '2025-12-31', 3, '{"core": true, "extended": true, "practical": true}'),
('spec_igcse_math_2023', 'board_cambridge', 'subj_igcse_math', 'igcse', '0580', 'Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 4, '{"core": true, "extended": true}'),
('spec_igcse_add_math_2023', 'board_cambridge', 'subj_igcse_add_math', 'igcse', '0606', 'Additional Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 2, '{"single_tier": true}');

-- =============================================
-- SEED SUBJECT SPECIFICATIONS - CAMBRIDGE A-LEVEL
-- =============================================

INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, valid_to, total_papers, assessment_info) VALUES
('spec_alevel_physics_2023', 'board_cambridge', 'subj_alevel_physics', 'cambridge_a2', '9702', 'Physics', '2023-2025', '2023-01-01', '2025-12-31', 5, '{"as_papers": [1, 2], "a2_papers": [3, 4, 5], "practical": true}'),
('spec_alevel_chemistry_2023', 'board_cambridge', 'subj_alevel_chemistry', 'cambridge_a2', '9701', 'Chemistry', '2023-2025', '2023-01-01', '2025-12-31', 5, '{"as_papers": [1, 2], "a2_papers": [3, 4, 5], "practical": true}'),
('spec_alevel_biology_2023', 'board_cambridge', 'subj_alevel_biology', 'cambridge_a2', '9700', 'Biology', '2023-2025', '2023-01-01', '2025-12-31', 5, '{"as_papers": [1, 2], "a2_papers": [3, 4, 5], "practical": true}'),
('spec_alevel_math_2023', 'board_cambridge', 'subj_alevel_math', 'cambridge_a2', '9709', 'Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 6, '{"pure_math": [1, 3], "mechanics": [4], "probability_stats": [5, 6]}'),
('spec_alevel_further_math_2023', 'board_cambridge', 'subj_alevel_further_math', 'cambridge_a2', '9231', 'Further Mathematics', '2023-2025', '2023-01-01', '2025-12-31', 4, '{"further_pure": [1, 2], "further_mechanics": [3], "further_stats": [4]}');

-- =============================================
-- SEED PAPER COMPONENTS - IGCSE PHYSICS (0625)
-- =============================================

INSERT OR IGNORE INTO paper_components (id, specification_id, paper_number, paper_name, paper_code, duration_minutes, total_marks, weighting_percent, question_format, is_compulsory, tier, description, display_order) VALUES
('comp_igcse_physics_p1', 'spec_igcse_physics_2023', 1, 'Multiple Choice', '0625/1', 45, 40, 30, 'mcq', 1, 'core', '40 multiple choice questions testing knowledge across all topics', 1),
('comp_igcse_physics_p2', 'spec_igcse_physics_2023', 2, 'Multiple Choice (Extended)', '0625/2', 45, 40, 30, 'mcq', 1, 'extended', '40 multiple choice questions - Extended tier', 2),
('comp_igcse_physics_p3', 'spec_igcse_physics_2023', 3, 'Theory (Core)', '0625/3', 75, 80, 50, 'structured', 1, 'core', 'Short-answer and structured questions', 3),
('comp_igcse_physics_p4', 'spec_igcse_physics_2023', 4, 'Theory (Extended)', '0625/4', 75, 80, 50, 'structured', 1, 'extended', 'Short-answer and structured questions - Extended tier', 4),
('comp_igcse_physics_p5', 'spec_igcse_physics_2023', 5, 'Practical Test', '0625/5', 75, 40, 20, 'practical', 0, NULL, 'Practical examination testing experimental skills', 5),
('comp_igcse_physics_p6', 'spec_igcse_physics_2023', 6, 'Alternative to Practical', '0625/6', 60, 40, 20, 'structured', 0, NULL, 'Written paper testing practical skills', 6);

-- =============================================
-- SEED PAPER COMPONENTS - IGCSE CHEMISTRY (0620)
-- =============================================

INSERT OR IGNORE INTO paper_components (id, specification_id, paper_number, paper_name, paper_code, duration_minutes, total_marks, weighting_percent, question_format, is_compulsory, tier, description, display_order) VALUES
('comp_igcse_chem_p1', 'spec_igcse_chemistry_2023', 1, 'Multiple Choice (Core)', '0620/1', 45, 40, 30, 'mcq', 1, 'core', '40 multiple choice questions', 1),
('comp_igcse_chem_p2', 'spec_igcse_chemistry_2023', 2, 'Multiple Choice (Extended)', '0620/2', 45, 40, 30, 'mcq', 1, 'extended', '40 multiple choice questions - Extended tier', 2),
('comp_igcse_chem_p3', 'spec_igcse_chemistry_2023', 3, 'Theory (Core)', '0620/3', 75, 80, 50, 'structured', 1, 'core', 'Short-answer and structured questions', 3),
('comp_igcse_chem_p4', 'spec_igcse_chemistry_2023', 4, 'Theory (Extended)', '0620/4', 75, 80, 50, 'structured', 1, 'extended', 'Short-answer and structured questions - Extended tier', 4),
('comp_igcse_chem_p5', 'spec_igcse_chemistry_2023', 5, 'Practical Test', '0620/5', 75, 40, 20, 'practical', 0, NULL, 'Practical examination', 5),
('comp_igcse_chem_p6', 'spec_igcse_chemistry_2023', 6, 'Alternative to Practical', '0620/6', 60, 40, 20, 'structured', 0, NULL, 'Written paper testing practical skills', 6);

-- =============================================
-- SEED PAPER COMPONENTS - IGCSE BIOLOGY (0610)
-- =============================================

INSERT OR IGNORE INTO paper_components (id, specification_id, paper_number, paper_name, paper_code, duration_minutes, total_marks, weighting_percent, question_format, is_compulsory, tier, description, display_order) VALUES
('comp_igcse_bio_p1', 'spec_igcse_biology_2023', 1, 'Multiple Choice (Core)', '0610/1', 45, 40, 30, 'mcq', 1, 'core', '40 multiple choice questions', 1),
('comp_igcse_bio_p2', 'spec_igcse_biology_2023', 2, 'Multiple Choice (Extended)', '0610/2', 45, 40, 30, 'mcq', 1, 'extended', '40 multiple choice questions - Extended tier', 2),
('comp_igcse_bio_p3', 'spec_igcse_biology_2023', 3, 'Theory (Core)', '0610/3', 75, 80, 50, 'structured', 1, 'core', 'Short-answer and structured questions', 3),
('comp_igcse_bio_p4', 'spec_igcse_biology_2023', 4, 'Theory (Extended)', '0610/4', 75, 80, 50, 'structured', 1, 'extended', 'Short-answer and structured questions - Extended tier', 4),
('comp_igcse_bio_p5', 'spec_igcse_biology_2023', 5, 'Practical Test', '0610/5', 75, 40, 20, 'practical', 0, NULL, 'Practical examination', 5),
('comp_igcse_bio_p6', 'spec_igcse_biology_2023', 6, 'Alternative to Practical', '0610/6', 60, 40, 20, 'structured', 0, NULL, 'Written paper testing practical skills', 6);

-- =============================================
-- SEED PAPER COMPONENTS - IGCSE MATHEMATICS (0580)
-- =============================================

INSERT OR IGNORE INTO paper_components (id, specification_id, paper_number, paper_name, paper_code, duration_minutes, total_marks, weighting_percent, question_format, is_compulsory, tier, description, display_order) VALUES
('comp_igcse_math_p1', 'spec_igcse_math_2023', 1, 'Short-answer (Core)', '0580/1', 60, 56, 35, 'structured', 1, 'core', 'Short-answer questions - Core tier', 1),
('comp_igcse_math_p2', 'spec_igcse_math_2023', 2, 'Short-answer (Extended)', '0580/2', 90, 70, 35, 'structured', 1, 'extended', 'Short-answer questions - Extended tier', 2),
('comp_igcse_math_p3', 'spec_igcse_math_2023', 3, 'Structured (Core)', '0580/3', 120, 104, 65, 'structured', 1, 'core', 'Structured questions - Core tier', 3),
('comp_igcse_math_p4', 'spec_igcse_math_2023', 4, 'Structured (Extended)', '0580/4', 150, 130, 65, 'structured', 1, 'extended', 'Structured questions - Extended tier', 4);

-- =============================================
-- SEED PAPER COMPONENTS - A-LEVEL PHYSICS (9702)
-- =============================================

INSERT OR IGNORE INTO paper_components (id, specification_id, paper_number, paper_name, paper_code, duration_minutes, total_marks, weighting_percent, question_format, is_compulsory, tier, description, display_order) VALUES
('comp_alevel_physics_p1', 'spec_alevel_physics_2023', 1, 'Multiple Choice (AS)', '9702/1', 75, 40, 15.5, 'mcq', 1, NULL, '40 multiple choice questions covering AS content', 1),
('comp_alevel_physics_p2', 'spec_alevel_physics_2023', 2, 'AS Structured Questions', '9702/2', 75, 60, 23, 'structured', 1, NULL, 'Structured questions on AS topics', 2),
('comp_alevel_physics_p3', 'spec_alevel_physics_2023', 3, 'Advanced Practical Skills', '9702/3', 120, 40, 11.5, 'practical', 1, NULL, 'Practical examination', 3),
('comp_alevel_physics_p4', 'spec_alevel_physics_2023', 4, 'A Level Structured Questions', '9702/4', 120, 100, 38.5, 'structured', 1, NULL, 'Structured questions on all topics', 4),
('comp_alevel_physics_p5', 'spec_alevel_physics_2023', 5, 'Planning, Analysis and Evaluation', '9702/5', 75, 30, 11.5, 'structured', 1, NULL, 'Questions on experimental methods', 5);

-- =============================================
-- SEED PAPER COMPONENTS - A-LEVEL MATHEMATICS (9709)
-- =============================================

INSERT OR IGNORE INTO paper_components (id, specification_id, paper_number, paper_name, paper_code, duration_minutes, total_marks, weighting_percent, question_format, is_compulsory, tier, description, display_order) VALUES
('comp_alevel_math_p1', 'spec_alevel_math_2023', 1, 'Pure Mathematics 1', '9709/1', 75, 50, 25, 'structured', 1, NULL, 'AS Pure Mathematics', 1),
('comp_alevel_math_p2', 'spec_alevel_math_2023', 2, 'Pure Mathematics 2', '9709/2', 75, 50, 25, 'structured', 0, NULL, 'AS Pure Mathematics (alternative route)', 2),
('comp_alevel_math_p3', 'spec_alevel_math_2023', 3, 'Pure Mathematics 3', '9709/3', 75, 50, 25, 'structured', 1, NULL, 'A2 Pure Mathematics', 3),
('comp_alevel_math_p4', 'spec_alevel_math_2023', 4, 'Mechanics', '9709/4', 75, 50, 25, 'structured', 0, NULL, 'Mechanics component', 4),
('comp_alevel_math_p5', 'spec_alevel_math_2023', 5, 'Probability & Statistics 1', '9709/5', 75, 50, 25, 'structured', 0, NULL, 'Statistics component', 5),
('comp_alevel_math_p6', 'spec_alevel_math_2023', 6, 'Probability & Statistics 2', '9709/6', 75, 50, 25, 'structured', 0, NULL, 'Advanced Statistics component', 6);

-- =============================================
-- SEED COMMAND WORDS (CAMBRIDGE)
-- =============================================

INSERT OR IGNORE INTO command_words (id, word, definition, marks_guidance, example_usage, typical_marks_range, exam_board_id) VALUES
('cw_calculate', 'Calculate', 'Work out from given facts, figures or information, generally using a calculator', 'Show all working. Include units in final answer.', 'Calculate the speed of the object.', '1-4 marks', 'board_cambridge'),
('cw_compare', 'Compare', 'Identify similarities and/or differences', 'State both similarities and differences. Use comparative language.', 'Compare the properties of metals and non-metals.', '2-4 marks', 'board_cambridge'),
('cw_define', 'Define', 'Give the meaning of a term', 'Give a precise definition. Include key terms.', 'Define the term acceleration.', '1-2 marks', 'board_cambridge'),
('cw_describe', 'Describe', 'State the points of a topic, give characteristics and main features', 'Give a detailed account. Include relevant facts.', 'Describe the structure of an atom.', '2-4 marks', 'board_cambridge'),
('cw_determine', 'Determine', 'Establish with certainty, usually by calculation or measurement', 'Show method clearly. May involve graphical analysis.', 'Determine the gradient of the line.', '2-4 marks', 'board_cambridge'),
('cw_evaluate', 'Evaluate', 'Judge or calculate the quality, importance, amount or value of something', 'Consider evidence on both sides. Reach a conclusion.', 'Evaluate the effectiveness of this method.', '4-6 marks', 'board_cambridge'),
('cw_explain', 'Explain', 'Set out purposes or reasons; make the relationships between things clear', 'Give reasons why. Link cause and effect.', 'Explain why the current increases.', '2-4 marks', 'board_cambridge'),
('cw_identify', 'Identify', 'Name, locate or recognise something', 'Simply name or point out. No explanation needed.', 'Identify the type of bond present.', '1 mark', 'board_cambridge'),
('cw_justify', 'Justify', 'Support a case with evidence or argument', 'Give reasons to support your answer.', 'Justify your choice of method.', '2-4 marks', 'board_cambridge'),
('cw_outline', 'Outline', 'Set out main points', 'Give key points briefly. No detailed explanation.', 'Outline the stages of mitosis.', '2-4 marks', 'board_cambridge'),
('cw_predict', 'Predict', 'Suggest what may happen based on available information', 'Use scientific reasoning. Base on patterns/trends.', 'Predict the products of this reaction.', '1-3 marks', 'board_cambridge'),
('cw_show', 'Show', 'Provide structured evidence that leads to a given result', 'Present clear logical steps. Usually mathematical.', 'Show that the acceleration is 2 m/s².', '2-4 marks', 'board_cambridge'),
('cw_sketch', 'Sketch', 'Make a simple freehand drawing showing key features', 'Label key parts. Show proportions roughly correct.', 'Sketch the graph of y = x².', '2-3 marks', 'board_cambridge'),
('cw_state', 'State', 'Express in clear terms', 'Give a brief, clear answer. No explanation needed.', 'State Newton''s first law of motion.', '1-2 marks', 'board_cambridge'),
('cw_suggest', 'Suggest', 'Apply knowledge and understanding to situations where there are a range of valid responses', 'Give a reasonable answer based on your understanding.', 'Suggest why the rate increased.', '1-3 marks', 'board_cambridge');

-- =============================================
-- SEED SAMPLE SYLLABUS TOPICS - IGCSE PHYSICS
-- =============================================

INSERT OR IGNORE INTO syllabus_topics (id, specification_id, parent_id, topic_code, title, description, tier, display_order) VALUES
-- Section 1: General Physics
('st_igcse_phy_1', 'spec_igcse_physics_2023', NULL, '1', 'General Physics', 'Motion, mass and weight, density, forces, energy, work and power, pressure', 'both', 1),
('st_igcse_phy_1_1', 'spec_igcse_physics_2023', 'st_igcse_phy_1', '1.1', 'Length and time', 'Measurement of length and time', 'both', 1),
('st_igcse_phy_1_2', 'spec_igcse_physics_2023', 'st_igcse_phy_1', '1.2', 'Motion', 'Speed, velocity and acceleration', 'both', 2),
('st_igcse_phy_1_3', 'spec_igcse_physics_2023', 'st_igcse_phy_1', '1.3', 'Mass and weight', 'Mass, weight and gravitational field', 'both', 3),
('st_igcse_phy_1_4', 'spec_igcse_physics_2023', 'st_igcse_phy_1', '1.4', 'Density', 'Density of solids, liquids and gases', 'both', 4),
('st_igcse_phy_1_5', 'spec_igcse_physics_2023', 'st_igcse_phy_1', '1.5', 'Forces', 'Effects of forces, turning effect, conditions for equilibrium', 'both', 5),
('st_igcse_phy_1_6', 'spec_igcse_physics_2023', 'st_igcse_phy_1', '1.6', 'Momentum', 'Impulse and momentum, conservation of momentum', 'extended', 6),
('st_igcse_phy_1_7', 'spec_igcse_physics_2023', 'st_igcse_phy_1', '1.7', 'Energy, work and power', 'Energy stores, transfers, efficiency', 'both', 7),
('st_igcse_phy_1_8', 'spec_igcse_physics_2023', 'st_igcse_phy_1', '1.8', 'Pressure', 'Pressure in fluids, atmospheric pressure', 'both', 8),

-- Section 2: Thermal Physics
('st_igcse_phy_2', 'spec_igcse_physics_2023', NULL, '2', 'Thermal Physics', 'Simple kinetic molecular model, thermal properties, transfer of thermal energy', 'both', 2),
('st_igcse_phy_2_1', 'spec_igcse_physics_2023', 'st_igcse_phy_2', '2.1', 'Simple kinetic molecular model of matter', 'States of matter, molecular motion', 'both', 1),
('st_igcse_phy_2_2', 'spec_igcse_physics_2023', 'st_igcse_phy_2', '2.2', 'Thermal properties and temperature', 'Temperature, thermal expansion, specific heat capacity', 'both', 2),
('st_igcse_phy_2_3', 'spec_igcse_physics_2023', 'st_igcse_phy_2', '2.3', 'Transfer of thermal energy', 'Conduction, convection, radiation', 'both', 3),

-- Section 3: Properties of Waves
('st_igcse_phy_3', 'spec_igcse_physics_2023', NULL, '3', 'Properties of Waves', 'General wave properties, light, electromagnetic spectrum, sound', 'both', 3),
('st_igcse_phy_3_1', 'spec_igcse_physics_2023', 'st_igcse_phy_3', '3.1', 'General properties of waves', 'Wave motion, transverse and longitudinal waves', 'both', 1),
('st_igcse_phy_3_2', 'spec_igcse_physics_2023', 'st_igcse_phy_3', '3.2', 'Light', 'Reflection, refraction, thin lenses, dispersion', 'both', 2),
('st_igcse_phy_3_3', 'spec_igcse_physics_2023', 'st_igcse_phy_3', '3.3', 'Electromagnetic spectrum', 'Properties and uses of EM waves', 'both', 3),
('st_igcse_phy_3_4', 'spec_igcse_physics_2023', 'st_igcse_phy_3', '3.4', 'Sound', 'Sound waves, echoes, ultrasound', 'both', 4),

-- Section 4: Electricity and Magnetism
('st_igcse_phy_4', 'spec_igcse_physics_2023', NULL, '4', 'Electricity and Magnetism', 'Static electricity, current electricity, electric circuits, electromagnetic effects', 'both', 4),
('st_igcse_phy_4_1', 'spec_igcse_physics_2023', 'st_igcse_phy_4', '4.1', 'Simple phenomena of magnetism', 'Magnets, magnetic fields, magnetic materials', 'both', 1),
('st_igcse_phy_4_2', 'spec_igcse_physics_2023', 'st_igcse_phy_4', '4.2', 'Electrical quantities', 'Electric charge, current, EMF, potential difference, resistance', 'both', 2),
('st_igcse_phy_4_3', 'spec_igcse_physics_2023', 'st_igcse_phy_4', '4.3', 'Electric circuits', 'Series and parallel circuits, electrical components', 'both', 3),
('st_igcse_phy_4_4', 'spec_igcse_physics_2023', 'st_igcse_phy_4', '4.4', 'Electrical safety', 'Fuses, circuit breakers, earthing', 'both', 4),
('st_igcse_phy_4_5', 'spec_igcse_physics_2023', 'st_igcse_phy_4', '4.5', 'Electromagnetic effects', 'Electromagnetic induction, transformers, motors', 'both', 5),

-- Section 5: Nuclear Physics
('st_igcse_phy_5', 'spec_igcse_physics_2023', NULL, '5', 'Nuclear Physics', 'Atomic model, radioactivity, nuclear reactions', 'both', 5),
('st_igcse_phy_5_1', 'spec_igcse_physics_2023', 'st_igcse_phy_5', '5.1', 'The nuclear atom', 'Atomic structure, nucleon number, isotopes', 'both', 1),
('st_igcse_phy_5_2', 'spec_igcse_physics_2023', 'st_igcse_phy_5', '5.2', 'Radioactivity', 'Alpha, beta, gamma radiation; decay equations; half-life', 'both', 2);

-- =============================================
-- SEED SAMPLE SYLLABUS TOPICS - IGCSE MATHEMATICS
-- =============================================

INSERT OR IGNORE INTO syllabus_topics (id, specification_id, parent_id, topic_code, title, description, tier, display_order) VALUES
-- Number
('st_igcse_math_1', 'spec_igcse_math_2023', NULL, '1', 'Number', 'Number theory, calculations, ratios, rates, percentages', 'both', 1),
('st_igcse_math_1_1', 'spec_igcse_math_2023', 'st_igcse_math_1', '1.1', 'Number and language', 'Natural numbers, integers, rationals, irrationals, primes', 'both', 1),
('st_igcse_math_1_2', 'spec_igcse_math_2023', 'st_igcse_math_1', '1.2', 'Calculations', 'Four operations, order of operations, estimation', 'both', 2),
('st_igcse_math_1_3', 'spec_igcse_math_2023', 'st_igcse_math_1', '1.3', 'Fractions, decimals and percentages', 'Conversions, calculations with fractions', 'both', 3),
('st_igcse_math_1_4', 'spec_igcse_math_2023', 'st_igcse_math_1', '1.4', 'Powers and roots', 'Indices, standard form, surds', 'both', 4),
('st_igcse_math_1_5', 'spec_igcse_math_2023', 'st_igcse_math_1', '1.5', 'Ratio and proportion', 'Direct and inverse proportion, scale', 'both', 5),

-- Algebra
('st_igcse_math_2', 'spec_igcse_math_2023', NULL, '2', 'Algebra', 'Algebraic manipulation, equations, sequences, functions, graphs', 'both', 2),
('st_igcse_math_2_1', 'spec_igcse_math_2023', 'st_igcse_math_2', '2.1', 'Algebraic manipulation', 'Simplifying, factorising, expanding', 'both', 1),
('st_igcse_math_2_2', 'spec_igcse_math_2023', 'st_igcse_math_2', '2.2', 'Equations', 'Linear, quadratic, simultaneous equations', 'both', 2),
('st_igcse_math_2_3', 'spec_igcse_math_2023', 'st_igcse_math_2', '2.3', 'Inequalities', 'Solving and representing inequalities', 'both', 3),
('st_igcse_math_2_4', 'spec_igcse_math_2023', 'st_igcse_math_2', '2.4', 'Sequences', 'Term-to-term, position-to-term rules, nth term', 'both', 4),
('st_igcse_math_2_5', 'spec_igcse_math_2023', 'st_igcse_math_2', '2.5', 'Functions', 'Function notation, composite functions, inverse functions', 'extended', 5),
('st_igcse_math_2_6', 'spec_igcse_math_2023', 'st_igcse_math_2', '2.6', 'Graphs', 'Plotting, gradients, equations of lines, curve sketching', 'both', 6),

-- Geometry
('st_igcse_math_3', 'spec_igcse_math_2023', NULL, '3', 'Geometry', 'Shapes, constructions, angle properties, transformations', 'both', 3),
('st_igcse_math_3_1', 'spec_igcse_math_2023', 'st_igcse_math_3', '3.1', 'Angles', 'Angle facts, parallel lines, polygons', 'both', 1),
('st_igcse_math_3_2', 'spec_igcse_math_2023', 'st_igcse_math_3', '3.2', 'Triangles and circles', 'Properties, constructions, circle theorems', 'both', 2),
('st_igcse_math_3_3', 'spec_igcse_math_2023', 'st_igcse_math_3', '3.3', 'Transformations', 'Reflection, rotation, translation, enlargement', 'both', 3),
('st_igcse_math_3_4', 'spec_igcse_math_2023', 'st_igcse_math_3', '3.4', 'Vectors', 'Vector notation, magnitude, addition', 'extended', 4),

-- Mensuration
('st_igcse_math_4', 'spec_igcse_math_2023', NULL, '4', 'Mensuration', 'Perimeter, area, volume, surface area', 'both', 4),
('st_igcse_math_4_1', 'spec_igcse_math_2023', 'st_igcse_math_4', '4.1', 'Perimeter and area', '2D shapes, compound shapes', 'both', 1),
('st_igcse_math_4_2', 'spec_igcse_math_2023', 'st_igcse_math_4', '4.2', 'Volume and surface area', '3D shapes, prisms, cylinders, cones, spheres', 'both', 2),

-- Trigonometry
('st_igcse_math_5', 'spec_igcse_math_2023', NULL, '5', 'Trigonometry', 'Trigonometric ratios, graphs, equations', 'both', 5),
('st_igcse_math_5_1', 'spec_igcse_math_2023', 'st_igcse_math_5', '5.1', 'Right-angled triangles', 'Sin, cos, tan, Pythagoras theorem', 'both', 1),
('st_igcse_math_5_2', 'spec_igcse_math_2023', 'st_igcse_math_5', '5.2', 'Non-right-angled triangles', 'Sine rule, cosine rule, area formula', 'extended', 2),
('st_igcse_math_5_3', 'spec_igcse_math_2023', 'st_igcse_math_5', '5.3', 'Trigonometric graphs', 'Graphs of sin, cos, tan', 'extended', 3),

-- Statistics and Probability
('st_igcse_math_6', 'spec_igcse_math_2023', NULL, '6', 'Statistics and Probability', 'Data handling, averages, probability', 'both', 6),
('st_igcse_math_6_1', 'spec_igcse_math_2023', 'st_igcse_math_6', '6.1', 'Collecting and displaying data', 'Frequency tables, diagrams, histograms', 'both', 1),
('st_igcse_math_6_2', 'spec_igcse_math_2023', 'st_igcse_math_6', '6.2', 'Averages and measures of spread', 'Mean, median, mode, range, IQR', 'both', 2),
('st_igcse_math_6_3', 'spec_igcse_math_2023', 'st_igcse_math_6', '6.3', 'Probability', 'Single events, combined events, tree diagrams', 'both', 3);
