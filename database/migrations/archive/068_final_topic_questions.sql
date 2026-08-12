-- Migration 068: Final fix for topics with fewer than 5 questions
-- Adds remaining questions to reach 5 per topic

-- Literary Devices (needs 3 more)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_lit_devices_003', 'subj_wassce_literature', 'topic_lit_devices', 'What is personification?', '["A comparison using like or as","Giving human qualities to non-human things","Exaggeration for effect","A play on words"]', 1, 'Personification attributes human characteristics to animals, objects, or abstract concepts.', 'easy', 'multiple_choice', datetime('now')),
('q_lit_devices_004', 'subj_wassce_literature', 'topic_lit_devices', 'Which literary device is used in "The wind whispered through the trees"?', '["Simile","Metaphor","Personification","Hyperbole"]', 2, 'Personification is used because the wind is given the human ability to whisper.', 'medium', 'multiple_choice', datetime('now')),
('q_lit_devices_005', 'subj_wassce_literature', 'topic_lit_devices', 'What is an oxymoron?', '["A figure of speech combining contradictory terms","A comparison without using like or as","An extreme exaggeration","A reference to another work"]', 0, 'An oxymoron places contradictory terms side by side, like "deafening silence" or "living dead".', 'medium', 'multiple_choice', datetime('now'));

-- Matrices - Elective Math (needs 2 more)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_em_matrices_004', 'subj_wassce_elective_math', 'topic_wassce_em_matrices', 'What is the identity matrix for 2×2 matrices?', '["[[1,0],[0,1]]","[[0,1],[1,0]]","[[1,1],[1,1]]","[[0,0],[0,0]]"]', 0, 'The identity matrix has 1s on the main diagonal and 0s elsewhere. For 2×2: [[1,0],[0,1]].', 'easy', 'multiple_choice', datetime('now')),
('q_em_matrices_005', 'subj_wassce_elective_math', 'topic_wassce_em_matrices', 'If A is a 2×3 matrix and B is a 3×4 matrix, what is the dimension of AB?', '["2×4","3×3","2×3","4×2"]', 0, 'When multiplying matrices, the result has the number of rows of the first matrix and columns of the second: 2×4.', 'medium', 'multiple_choice', datetime('now'));

-- Costing Methods (needs 1 more)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ca_costing_005', 'subj_wassce_cost_accounting', 'topic_ca_costing', 'Which costing method is most suitable for construction companies?', '["Process costing","Job costing","Batch costing","Service costing"]', 1, 'Job costing is ideal for construction as each project is unique with specific costs tracked separately.', 'medium', 'multiple_choice', datetime('now'));

-- Labor Costing (needs 1 more)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ca_labor_005', 'subj_wassce_cost_accounting', 'topic_ca_labor', 'What is labour turnover?', '["Rate at which employees leave and are replaced","Amount paid to workers per hour","Total direct labour cost","Number of overtime hours worked"]', 0, 'Labour turnover measures the rate at which employees leave an organization and are replaced by new ones.', 'easy', 'multiple_choice', datetime('now'));

-- Quadratic Equations (needs 1 more)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_quadratic_005', 'subj_wassce_core_math', 'topic_quadratic', 'What is the sum of the roots of x² - 5x + 6 = 0?', '["5","6","-5","-6"]', 0, 'For ax² + bx + c = 0, sum of roots = -b/a. Here: -(-5)/1 = 5.', 'medium', 'multiple_choice', datetime('now'));

-- Statistics & Probability - Elective Math (needs 1 more)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_em_stats_005', 'subj_wassce_elective_math', 'topic_wassce_em_stats', 'If P(A) = 0.4 and P(B) = 0.3, and A and B are independent events, what is P(A and B)?', '["0.12","0.7","0.1","0.70"]', 0, 'For independent events, P(A and B) = P(A) × P(B) = 0.4 × 0.3 = 0.12.', 'medium', 'multiple_choice', datetime('now'));

-- Vectors - Elective Math (needs 1 more)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_em_vectors_005', 'subj_wassce_elective_math', 'topic_wassce_em_vectors', 'What is the magnitude of the vector (3, 4)?', '["5","7","12","25"]', 0, 'Magnitude = √(3² + 4²) = √(9 + 16) = √25 = 5.', 'easy', 'multiple_choice', datetime('now'));
