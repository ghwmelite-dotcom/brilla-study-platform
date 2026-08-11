-- Additional IGCSE Mathematics Questions (21-40)

-- Number
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_021', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Find the HCF of 24 and 36.', 'calculation', NULL, '12', 'Factors of 24: 1,2,3,4,6,8,12,24. Factors of 36: 1,2,3,4,6,9,12,18,36. HCF = 12', 'easy', 3, 2, 'st_igcse_math_1_1', 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_022', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Find the LCM of 6 and 8.', 'calculation', NULL, '24', 'Multiples of 6: 6,12,18,24... Multiples of 8: 8,16,24... LCM = 24', 'easy', 3, 2, 'st_igcse_math_1_1', 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_023', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Express 0.375 as a fraction in lowest terms.', 'calculation', NULL, '3/8', '0.375 = 375/1000 = 3/8', 'medium', 3, 2, 'st_igcse_math_1_2', 'board_cambridge', 'Express');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_024', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Calculate 15% of 80.', 'calculation', NULL, '12', '15% × 80 = 0.15 × 80 = 12', 'easy', 3, 1, 'st_igcse_math_1_3', 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_025', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'A price increases from £50 to £60. What is the percentage increase?', 'calculation', NULL, '20%', 'Increase = 10. Percentage = (10/50) × 100 = 20%', 'medium', 3, 2, 'st_igcse_math_1_3', 'board_cambridge', 'Calculate');

-- Algebra
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_026', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Expand: (x + 3)(x - 2)', 'calculation', NULL, 'x² + x - 6', '(x+3)(x-2) = x² - 2x + 3x - 6 = x² + x - 6', 'medium', 3, 2, 'st_igcse_math_2_1', 'board_cambridge', 'Expand');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_027', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Factorise: x² - 9', 'calculation', NULL, '(x + 3)(x - 3)', 'This is difference of squares: a² - b² = (a+b)(a-b)', 'medium', 3, 2, 'st_igcse_math_2_1', 'board_cambridge', 'Factorise');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_028', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Solve: 3(x - 2) = 12', 'calculation', NULL, 'x = 6', '3x - 6 = 12, 3x = 18, x = 6', 'easy', 3, 2, 'st_igcse_math_2_2', 'board_cambridge', 'Solve');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_029', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Solve the inequality: 2x + 5 > 11', 'calculation', NULL, 'x > 3', '2x > 6, so x > 3', 'medium', 3, 2, 'st_igcse_math_2_3', 'board_cambridge', 'Solve');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_030', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Find the equation of a line with gradient 2 passing through (0, 5).', 'calculation', NULL, 'y = 2x + 5', 'Using y = mx + c, where m = 2 and c = 5 (y-intercept)', 'medium', 3, 2, 'st_igcse_math_2_6', 'board_cambridge', 'Find');

-- Geometry
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_031', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'What is the sum of angles in a quadrilateral?', 'multiple_choice', '["A. 180°", "B. 270°", "C. 360°", "D. 540°"]', 'C', 'Sum = (n-2) × 180 = 2 × 180 = 360°', 'easy', 3, 1, 'st_igcse_math_3_1', 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_032', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Each exterior angle of a regular polygon is 30°. How many sides does it have?', 'calculation', NULL, '12', 'Sum of exterior angles = 360°. Number of sides = 360/30 = 12', 'medium', 3, 2, 'st_igcse_math_3_1', 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_033', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Two angles are supplementary. One is 65°. What is the other?', 'calculation', NULL, '115°', 'Supplementary angles add up to 180°. 180 - 65 = 115°', 'easy', 3, 1, 'st_igcse_math_3_1', 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_034', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Calculate the area of a circle with diameter 10 cm. (π = 3.14)', 'calculation', NULL, '78.5 cm²', 'Radius = 5 cm. Area = πr² = 3.14 × 25 = 78.5 cm²', 'medium', 3, 2, 'st_igcse_math_4_1', 'board_cambridge', 'Calculate');

-- Mensuration
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_035', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Calculate the volume of a cube with side 4 cm.', 'calculation', NULL, '64 cm³', 'Volume = s³ = 4³ = 64 cm³', 'easy', 3, 1, 'st_igcse_math_4_2', 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_036', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Calculate the surface area of a cube with side 3 cm.', 'calculation', NULL, '54 cm²', 'Surface area = 6s² = 6 × 9 = 54 cm²', 'medium', 3, 2, 'st_igcse_math_4_2', 'board_cambridge', 'Calculate');

-- Trigonometry
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_037', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'In a right triangle, if cos θ = 0.8, what is sin θ? (Use sin²θ + cos²θ = 1)', 'calculation', NULL, '0.6', 'sin²θ = 1 - 0.64 = 0.36, so sin θ = 0.6', 'hard', 3, 3, 'st_igcse_math_5_1', 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_038', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Find the length of side opposite to angle 30° in a right triangle if hypotenuse is 10 cm.', 'calculation', NULL, '5 cm', 'sin 30° = 0.5 = opposite/10, so opposite = 5 cm', 'medium', 3, 2, 'st_igcse_math_5_1', 'board_cambridge', 'Calculate');

-- Statistics and Probability
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_039', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'Find the median of: 3, 7, 2, 9, 5', 'calculation', NULL, '5', 'Ordered: 2,3,5,7,9. Middle value is 5.', 'easy', 3, 1, 'st_igcse_math_6_2', 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_math_040', 'topic_mathematics', 'subj_igcse_math', 'igcse', 'A coin is flipped twice. What is P(two heads)?', 'calculation', NULL, '1/4 or 0.25', 'P(H) × P(H) = 1/2 × 1/2 = 1/4', 'medium', 3, 2, 'st_igcse_math_6_3', 'board_cambridge', 'Calculate');
