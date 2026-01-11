-- Additional IGCSE Biology Questions (16-40)
-- Cells and Organization
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_016', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is the function of mitochondria?', 'multiple_choice', '["A. Protein synthesis", "B. Aerobic respiration", "C. Photosynthesis", "D. Cell division"]', 'B', 'Mitochondria are the site of aerobic respiration, producing ATP.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_017', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is the function of ribosomes?', 'multiple_choice', '["A. Energy production", "B. Protein synthesis", "C. Lipid storage", "D. Cell movement"]', 'B', 'Ribosomes are the site of protein synthesis in cells.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_018', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is diffusion?', 'short_answer', NULL, 'The net movement of particles from a region of higher concentration to a region of lower concentration', 'Diffusion is a passive process that requires no energy.', 'medium', 3, 3, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_019', 'topic_biology', 'subj_igcse_biology', 'igcse', 'Which organelle contains digestive enzymes?', 'multiple_choice', '["A. Ribosome", "B. Lysosome", "C. Nucleus", "D. Golgi body"]', 'B', 'Lysosomes contain digestive enzymes that break down waste materials.', 'medium', 3, 1, NULL, 'board_cambridge', 'State');

-- Nutrition and Digestion
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_020', 'topic_biology', 'subj_igcse_biology', 'igcse', 'Where does most digestion and absorption occur?', 'multiple_choice', '["A. Stomach", "B. Large intestine", "C. Small intestine", "D. Mouth"]', 'C', 'The small intestine has villi for maximum absorption of nutrients.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_021', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is the role of bile in digestion?', 'short_answer', NULL, 'Bile emulsifies fats, breaking them into smaller droplets to increase surface area for lipase action', 'Bile is produced by the liver and stored in the gall bladder.', 'medium', 3, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_022', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What are the products of protein digestion?', 'multiple_choice', '["A. Fatty acids", "B. Glucose", "C. Amino acids", "D. Glycerol"]', 'C', 'Proteins are broken down into amino acids by proteases.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_023', 'topic_biology', 'subj_igcse_biology', 'igcse', 'Name three nutrients absorbed by villi in the small intestine.', 'short_answer', NULL, 'Glucose, amino acids, fatty acids and glycerol (any three)', 'Villi have large surface area, thin walls, and good blood supply for absorption.', 'medium', 3, 3, NULL, 'board_cambridge', 'State');

-- Gas Exchange and Respiration
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_024', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is the word equation for anaerobic respiration in yeast?', 'short_answer', NULL, 'Glucose → ethanol + carbon dioxide + energy', 'This process is called fermentation and is used in brewing and baking.', 'medium', 3, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_025', 'topic_biology', 'subj_igcse_biology', 'igcse', 'Why is aerobic respiration more efficient than anaerobic?', 'short_answer', NULL, 'Aerobic respiration releases more energy per glucose molecule because glucose is completely broken down', 'Aerobic produces about 38 ATP, anaerobic only 2 ATP per glucose.', 'hard', 3, 4, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_026', 'topic_biology', 'subj_igcse_biology', 'igcse', 'Name three features of alveoli that aid gas exchange.', 'short_answer', NULL, 'Thin walls (one cell thick), large surface area, moist lining, good blood supply', 'Any three features that increase the rate of diffusion.', 'medium', 3, 3, NULL, 'board_cambridge', 'State');

-- Circulation
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_027', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is the function of white blood cells?', 'multiple_choice', '["A. Carry oxygen", "B. Blood clotting", "C. Fight infection", "D. Transport nutrients"]', 'C', 'White blood cells defend the body against pathogens through phagocytosis and antibody production.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_028', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is the role of platelets?', 'short_answer', NULL, 'Blood clotting to prevent blood loss and entry of pathogens at wound sites', 'Platelets release chemicals that trigger the clotting cascade.', 'easy', 3, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_029', 'topic_biology', 'subj_igcse_biology', 'igcse', 'Which chamber of the heart has the thickest wall?', 'multiple_choice', '["A. Right atrium", "B. Left atrium", "C. Right ventricle", "D. Left ventricle"]', 'D', 'Left ventricle pumps blood to the whole body, so needs the strongest walls.', 'medium', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_030', 'topic_biology', 'subj_igcse_biology', 'igcse', 'Why do capillaries have thin walls?', 'short_answer', NULL, 'To allow substances to diffuse easily between blood and tissues', 'Capillary walls are one cell thick for efficient exchange.', 'medium', 3, 2, NULL, 'board_cambridge', 'Explain');

-- Excretion and Homeostasis
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_031', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What are the main waste products excreted by the kidneys?', 'multiple_choice', '["A. Carbon dioxide and water", "B. Urea, water, and salts", "C. Glucose and amino acids", "D. Oxygen and nitrogen"]', 'B', 'Kidneys filter blood to remove urea (from protein breakdown), excess water, and salts.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_032', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is homeostasis?', 'short_answer', NULL, 'The maintenance of a constant internal environment', 'Examples include blood glucose regulation, body temperature, and water balance.', 'medium', 3, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_033', 'topic_biology', 'subj_igcse_biology', 'igcse', 'How does insulin lower blood glucose levels?', 'short_answer', NULL, 'Insulin causes liver and muscle cells to take up glucose and convert it to glycogen for storage', 'Insulin is produced by the pancreas when blood glucose is high.', 'hard', 3, 4, NULL, 'board_cambridge', 'Explain');

-- Nervous System
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_034', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is a reflex arc?', 'short_answer', NULL, 'A pathway of neurones that produces a rapid, automatic response to a stimulus', 'Reflex arcs involve sensory, relay, and motor neurones.', 'medium', 3, 3, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_035', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is the function of a synapse?', 'multiple_choice', '["A. Speed up nerve impulses", "B. Allow impulses to cross between neurones", "C. Store neurotransmitters only", "D. Block all nerve impulses"]', 'B', 'Synapses are junctions where neurotransmitters carry signals across the gap.', 'medium', 3, 1, NULL, 'board_cambridge', 'State');

-- Reproduction
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_036', 'topic_biology', 'subj_igcse_biology', 'igcse', 'Where does fertilization occur in humans?', 'multiple_choice', '["A. Uterus", "B. Ovary", "C. Fallopian tube (oviduct)", "D. Vagina"]', 'C', 'Fertilization occurs in the fallopian tube, then the embryo implants in the uterus.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_037', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is the role of the placenta?', 'short_answer', NULL, 'Exchange of nutrients, oxygen, and waste between mother and fetus; produces hormones to maintain pregnancy', 'The placenta has a large surface area and thin barrier for diffusion.', 'medium', 3, 3, NULL, 'board_cambridge', 'Describe');

-- Ecology
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_038', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is a producer in an ecosystem?', 'multiple_choice', '["A. An organism that eats plants", "B. An organism that makes its own food by photosynthesis", "C. An organism that breaks down dead matter", "D. A predator"]', 'B', 'Producers (usually plants) convert light energy to chemical energy in glucose.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_039', 'topic_biology', 'subj_igcse_biology', 'igcse', 'What is the carbon cycle?', 'short_answer', NULL, 'The cycling of carbon between living organisms and the environment through photosynthesis, respiration, decomposition, and combustion', 'Carbon moves between atmosphere, organisms, and fossil fuels.', 'hard', 3, 4, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_bio_040', 'topic_biology', 'subj_igcse_biology', 'igcse', 'Why is biodiversity important?', 'short_answer', NULL, 'Provides genetic resources, ecosystem stability, food sources, medicines, and ecological services like pollination and nutrient cycling', 'Loss of biodiversity threatens ecosystem function and human welfare.', 'hard', 3, 4, NULL, 'board_cambridge', 'Explain');
