-- Migration 029: Add BECE Subjects, Topics, Past Papers, and Questions
-- This creates comprehensive BECE content for Ghana JHS students

-- Step 1: Create BECE Subjects
INSERT OR IGNORE INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_bece_math', 'BECE Mathematics', 'bece-mathematics', 'Calculator', '#3B82F6', 'JHS Mathematics for BECE preparation', 10),
('subj_bece_english', 'BECE English', 'bece-english', 'Languages', '#EF4444', 'JHS English Language for BECE preparation', 11),
('subj_bece_science', 'BECE Integrated Science', 'bece-integrated-science', 'Beaker', '#14B8A6', 'JHS Integrated Science for BECE preparation', 12),
('subj_bece_social', 'BECE Social Studies', 'bece-social-studies', 'Users', '#F59E0B', 'JHS Social Studies for BECE preparation', 13);

-- Step 2: Create BECE Topics
INSERT OR IGNORE INTO topics (id, name, subject_id, description, display_order) VALUES
-- BECE Mathematics Topics
('topic_bece_numbers', 'Numbers and Numeration', 'subj_bece_math', 'Whole numbers, fractions, decimals, percentages', 1),
('topic_bece_algebra', 'Basic Algebra', 'subj_bece_math', 'Algebraic expressions, equations, inequalities', 2),
('topic_bece_geometry', 'Geometry and Measurement', 'subj_bece_math', 'Shapes, angles, perimeter, area, volume', 3),
('topic_bece_statistics', 'Statistics and Probability', 'subj_bece_math', 'Data collection, mean, median, mode, probability', 4),
-- BECE English Topics
('topic_bece_grammar', 'Grammar and Structure', 'subj_bece_english', 'Parts of speech, tenses, sentence structure', 1),
('topic_bece_comprehension', 'Reading Comprehension', 'subj_bece_english', 'Passage reading and understanding', 2),
('topic_bece_vocabulary', 'Vocabulary and Spelling', 'subj_bece_english', 'Word meanings, synonyms, antonyms', 3),
('topic_bece_composition', 'Essay and Composition', 'subj_bece_english', 'Letter writing, narrative, descriptive essays', 4),
-- BECE Integrated Science Topics
('topic_bece_living', 'Living Things', 'subj_bece_science', 'Plants, animals, human body systems', 1),
('topic_bece_matter', 'Matter and Energy', 'subj_bece_science', 'States of matter, energy forms, simple machines', 2),
('topic_bece_environment', 'Environment and Health', 'subj_bece_science', 'Ecosystems, pollution, diseases, nutrition', 3),
('topic_bece_technology', 'Science and Technology', 'subj_bece_science', 'Simple experiments, scientific methods', 4),
-- BECE Social Studies Topics
('topic_bece_ghana', 'Ghana Studies', 'subj_bece_social', 'Ghana history, government, culture', 1),
('topic_bece_civics', 'Civics and Governance', 'subj_bece_social', 'Rights, responsibilities, democracy', 2),
('topic_bece_economics', 'Basic Economics', 'subj_bece_social', 'Money, trade, resources', 3),
('topic_bece_geography', 'Geography', 'subj_bece_social', 'Maps, climate, physical features', 4);

-- Step 3: Create BECE Past Papers
INSERT OR REPLACE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, series, title, description, total_questions, total_marks, time_allowed, instructions, is_complete, is_premium) VALUES
-- BECE Mathematics Papers
('pp_bece_math_2024_1', 'exam_bece', 'subj_bece_math', 'paper_bece_1', 2024, 'June', 'BECE', 'Mathematics Paper 1 (2024)', 'BECE Mathematics Objective Questions', 40, 40, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_bece_math_2023_1', 'exam_bece', 'subj_bece_math', 'paper_bece_1', 2023, 'June', 'BECE', 'Mathematics Paper 1 (2023)', 'BECE Mathematics Objective Questions', 40, 40, 60, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- BECE English Papers
('pp_bece_eng_2024_1', 'exam_bece', 'subj_bece_english', 'paper_bece_1', 2024, 'June', 'BECE', 'English Language Paper 1 (2024)', 'BECE English Language Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_bece_eng_2023_1', 'exam_bece', 'subj_bece_english', 'paper_bece_1', 2023, 'June', 'BECE', 'English Language Paper 1 (2023)', 'BECE English Language Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- BECE Integrated Science Papers
('pp_bece_sci_2024_1', 'exam_bece', 'subj_bece_science', 'paper_bece_1', 2024, 'June', 'BECE', 'Integrated Science Paper 1 (2024)', 'BECE Integrated Science Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_bece_sci_2023_1', 'exam_bece', 'subj_bece_science', 'paper_bece_1', 2023, 'June', 'BECE', 'Integrated Science Paper 1 (2023)', 'BECE Integrated Science Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
-- BECE Social Studies Papers
('pp_bece_soc_2024_1', 'exam_bece', 'subj_bece_social', 'paper_bece_1', 2024, 'June', 'BECE', 'Social Studies Paper 1 (2024)', 'BECE Social Studies Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0),
('pp_bece_soc_2023_1', 'exam_bece', 'subj_bece_social', 'paper_bece_1', 2023, 'June', 'BECE', 'Social Studies Paper 1 (2023)', 'BECE Social Studies Objective Questions', 40, 40, 45, 'Answer ALL questions. Each question carries 1 mark.', 1, 0);
