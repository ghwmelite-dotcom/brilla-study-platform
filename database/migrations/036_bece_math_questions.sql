-- Migration 036: BECE Mathematics Questions
-- 40 questions each for 2024 and 2023 Paper 1

INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- BECE Mathematics 2024 Paper 1
('q_bece_math_2024_001', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Simplify: 15 - 8 + 3', 'multiple_choice', '["A. 4", "B. 10", "C. 20", "D. 6"]', 'B', '15 - 8 + 3 = 7 + 3 = 10.', 'easy', 1, 1),

('q_bece_math_2024_002', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'What is 25% of 200?', 'multiple_choice', '["A. 25", "B. 50", "C. 75", "D. 100"]', 'B', '25% of 200 = 25/100 × 200 = 50.', 'easy', 1, 2),

('q_bece_math_2024_003', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Express 3/4 as a percentage.', 'multiple_choice', '["A. 34%", "B. 75%", "C. 25%", "D. 50%"]', 'B', '3/4 = 3 ÷ 4 = 0.75 = 75%.', 'easy', 1, 3),

('q_bece_math_2024_004', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Find the value of x: 2x + 5 = 15', 'multiple_choice', '["A. 5", "B. 10", "C. 7.5", "D. 20"]', 'A', '2x + 5 = 15; 2x = 10; x = 5.', 'easy', 1, 4),

('q_bece_math_2024_005', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'What is the perimeter of a square with side 8 cm?', 'multiple_choice', '["A. 16 cm", "B. 24 cm", "C. 32 cm", "D. 64 cm"]', 'C', 'Perimeter = 4 × side = 4 × 8 = 32 cm.', 'easy', 1, 5),

('q_bece_math_2024_006', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Find the LCM of 4 and 6.', 'multiple_choice', '["A. 2", "B. 12", "C. 24", "D. 6"]', 'B', 'LCM of 4 and 6 is 12 (smallest number divisible by both).', 'easy', 1, 6),

('q_bece_math_2024_007', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Simplify: 2/3 + 1/6', 'multiple_choice', '["A. 3/9", "B. 5/6", "C. 1/2", "D. 3/6"]', 'B', '2/3 + 1/6 = 4/6 + 1/6 = 5/6.', 'easy', 1, 7),

('q_bece_math_2024_008', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'The area of a rectangle is 48 cm² and its length is 8 cm. Find the width.', 'multiple_choice', '["A. 4 cm", "B. 6 cm", "C. 40 cm", "D. 56 cm"]', 'B', 'Area = length × width; 48 = 8 × width; width = 6 cm.', 'easy', 1, 8),

('q_bece_math_2024_009', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Convert 2.5 km to meters.', 'multiple_choice', '["A. 25 m", "B. 250 m", "C. 2500 m", "D. 25000 m"]', 'C', '1 km = 1000 m; 2.5 km = 2.5 × 1000 = 2500 m.', 'easy', 1, 9),

('q_bece_math_2024_010', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'What is the value of 5²?', 'multiple_choice', '["A. 10", "B. 25", "C. 125", "D. 7"]', 'B', '5² = 5 × 5 = 25.', 'easy', 1, 10),

('q_bece_math_2024_011', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Find the mean of 4, 6, 8, 10, 12.', 'multiple_choice', '["A. 6", "B. 8", "C. 10", "D. 40"]', 'B', 'Mean = (4+6+8+10+12)/5 = 40/5 = 8.', 'easy', 1, 11),

('q_bece_math_2024_012', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'If 3x - 7 = 14, find x.', 'multiple_choice', '["A. 3", "B. 7", "C. 21", "D. 5"]', 'B', '3x - 7 = 14; 3x = 21; x = 7.', 'easy', 1, 12),

('q_bece_math_2024_013', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'A bag contains 3 red and 5 blue balls. What is the probability of picking a red ball?', 'multiple_choice', '["A. 3/8", "B. 5/8", "C. 3/5", "D. 1/3"]', 'A', 'Probability = 3/(3+5) = 3/8.', 'medium', 1, 13),

('q_bece_math_2024_014', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Round 347 to the nearest ten.', 'multiple_choice', '["A. 340", "B. 350", "C. 300", "D. 400"]', 'B', '347 rounded to nearest ten is 350.', 'easy', 1, 14),

('q_bece_math_2024_015', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Find the value of y if y/4 = 12.', 'multiple_choice', '["A. 3", "B. 16", "C. 48", "D. 8"]', 'C', 'y/4 = 12; y = 12 × 4 = 48.', 'easy', 1, 15),

('q_bece_math_2024_016', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'An angle of 90° is called a:', 'multiple_choice', '["A. Acute angle", "B. Right angle", "C. Obtuse angle", "D. Reflex angle"]', 'B', 'A 90° angle is called a right angle.', 'easy', 1, 16),

('q_bece_math_2024_017', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'What is the next number in the sequence: 2, 5, 8, 11, ...?', 'multiple_choice', '["A. 12", "B. 13", "C. 14", "D. 15"]', 'C', 'The pattern is +3. Next number is 11 + 3 = 14.', 'easy', 1, 17),

('q_bece_math_2024_018', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Simplify: 3 × 4 + 6 ÷ 2', 'multiple_choice', '["A. 9", "B. 15", "C. 12", "D. 18"]', 'B', 'Following BODMAS: 3 × 4 + 6 ÷ 2 = 12 + 3 = 15.', 'medium', 1, 18),

('q_bece_math_2024_019', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'The sum of angles in a triangle is:', 'multiple_choice', '["A. 90°", "B. 180°", "C. 270°", "D. 360°"]', 'B', 'The sum of interior angles in a triangle is always 180°.', 'easy', 1, 19),

('q_bece_math_2024_020', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Express 0.45 as a fraction in its lowest terms.', 'multiple_choice', '["A. 45/100", "B. 9/20", "C. 9/10", "D. 45/10"]', 'B', '0.45 = 45/100 = 9/20 (dividing by 5).', 'medium', 1, 20),

('q_bece_math_2024_021', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'A shirt costs GH₵40. If it is sold at 20% profit, what is the selling price?', 'multiple_choice', '["A. GH₵48", "B. GH₵32", "C. GH₵60", "D. GH₵44"]', 'A', 'Selling price = 40 + (20% of 40) = 40 + 8 = GH₵48.', 'medium', 1, 21),

('q_bece_math_2024_022', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Find the HCF of 12 and 18.', 'multiple_choice', '["A. 2", "B. 3", "C. 6", "D. 36"]', 'C', 'HCF of 12 and 18 is 6 (largest common factor).', 'easy', 1, 22),

('q_bece_math_2024_023', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'If the circumference of a circle is 44 cm, find its radius (π = 22/7).', 'multiple_choice', '["A. 7 cm", "B. 14 cm", "C. 22 cm", "D. 11 cm"]', 'A', 'C = 2πr; 44 = 2 × 22/7 × r; r = 44 × 7/(2 × 22) = 7 cm.', 'medium', 1, 23),

('q_bece_math_2024_024', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Kofi is 12 years old and his father is 3 times as old. How old is his father?', 'multiple_choice', '["A. 15", "B. 36", "C. 48", "D. 24"]', 'B', 'Father''s age = 3 × 12 = 36 years.', 'easy', 1, 24),

('q_bece_math_2024_025', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Evaluate: (-5) + (-3)', 'multiple_choice', '["A. -8", "B. 8", "C. -2", "D. 2"]', 'A', '(-5) + (-3) = -8 (adding two negatives gives a larger negative).', 'easy', 1, 25),

('q_bece_math_2024_026', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'How many lines of symmetry does a square have?', 'multiple_choice', '["A. 1", "B. 2", "C. 4", "D. 8"]', 'C', 'A square has 4 lines of symmetry (2 diagonal, 2 through midpoints).', 'easy', 1, 26),

('q_bece_math_2024_027', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'What is the mode of 3, 4, 4, 5, 5, 5, 6?', 'multiple_choice', '["A. 3", "B. 4", "C. 5", "D. 6"]', 'C', 'The mode is 5 as it appears most frequently (3 times).', 'easy', 1, 27),

('q_bece_math_2024_028', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Solve: 4(x - 2) = 20', 'multiple_choice', '["A. 5", "B. 7", "C. 3", "D. 22"]', 'B', '4(x - 2) = 20; x - 2 = 5; x = 7.', 'medium', 1, 28),

('q_bece_math_2024_029', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'The volume of a cube with side 5 cm is:', 'multiple_choice', '["A. 15 cm³", "B. 25 cm³", "C. 125 cm³", "D. 150 cm³"]', 'C', 'Volume = side³ = 5³ = 125 cm³.', 'easy', 1, 29),

('q_bece_math_2024_030', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'What is 3/5 of 45?', 'multiple_choice', '["A. 15", "B. 27", "C. 9", "D. 36"]', 'B', '3/5 × 45 = 3 × 9 = 27.', 'easy', 1, 30),

('q_bece_math_2024_031', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Convert 270° to a fraction of a complete turn.', 'multiple_choice', '["A. 1/4", "B. 1/2", "C. 3/4", "D. 2/3"]', 'C', '270/360 = 3/4 of a complete turn.', 'medium', 1, 31),

('q_bece_math_2024_032', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'A car travels 180 km in 3 hours. What is its speed?', 'multiple_choice', '["A. 60 km/h", "B. 540 km/h", "C. 90 km/h", "D. 183 km/h"]', 'A', 'Speed = distance/time = 180/3 = 60 km/h.', 'easy', 1, 32),

('q_bece_math_2024_033', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Expand: 3(2a + 4b)', 'multiple_choice', '["A. 6a + 4b", "B. 6a + 12b", "C. 5a + 7b", "D. 2a + 12b"]', 'B', '3(2a + 4b) = 6a + 12b.', 'easy', 1, 33),

('q_bece_math_2024_034', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Find the range of 5, 8, 12, 3, 9.', 'multiple_choice', '["A. 3", "B. 5", "C. 9", "D. 12"]', 'C', 'Range = highest - lowest = 12 - 3 = 9.', 'easy', 1, 34),

('q_bece_math_2024_035', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'The interior angle of a regular hexagon is:', 'multiple_choice', '["A. 60°", "B. 90°", "C. 120°", "D. 180°"]', 'C', 'Interior angle = (n-2)×180/n = (6-2)×180/6 = 720/6 = 120°.', 'medium', 1, 35),

('q_bece_math_2024_036', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Simplify: 5a - 2a + 3a', 'multiple_choice', '["A. 10a", "B. 6a", "C. 0", "D. a"]', 'B', '5a - 2a + 3a = 6a.', 'easy', 1, 36),

('q_bece_math_2024_037', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'If a = 3 and b = 4, find the value of a² + b²', 'multiple_choice', '["A. 7", "B. 12", "C. 25", "D. 49"]', 'C', 'a² + b² = 3² + 4² = 9 + 16 = 25.', 'easy', 1, 37),

('q_bece_math_2024_038', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Express 5:3 as a ratio in its simplest form.', 'multiple_choice', '["A. 5:3", "B. 10:6", "C. 15:9", "D. 1:0.6"]', 'A', '5:3 is already in its simplest form.', 'easy', 1, 38),

('q_bece_math_2024_039', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'The bearing of East from North is:', 'multiple_choice', '["A. 000°", "B. 090°", "C. 180°", "D. 270°"]', 'B', 'East is at a bearing of 090° from North.', 'medium', 1, 39),

('q_bece_math_2024_040', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2024_1', 'Factorize: 6x + 9', 'multiple_choice', '["A. 3(2x + 3)", "B. 6(x + 9)", "C. 2(3x + 9)", "D. 9(x + 6)"]', 'A', '6x + 9 = 3(2x + 3) (factor out 3).', 'easy', 1, 40),

-- BECE Mathematics 2023 Paper 1
('q_bece_math_2023_001', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Evaluate: 18 ÷ 3 + 4', 'multiple_choice', '["A. 6", "B. 10", "C. 2", "D. 22"]', 'B', '18 ÷ 3 + 4 = 6 + 4 = 10.', 'easy', 1, 1),

('q_bece_math_2023_002', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'What is 50% of 80?', 'multiple_choice', '["A. 20", "B. 40", "C. 60", "D. 130"]', 'B', '50% of 80 = 0.5 × 80 = 40.', 'easy', 1, 2),

('q_bece_math_2023_003', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Simplify: 2/5 × 10', 'multiple_choice', '["A. 2", "B. 4", "C. 5", "D. 20"]', 'B', '2/5 × 10 = 20/5 = 4.', 'easy', 1, 3),

('q_bece_math_2023_004', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Find x if x + 8 = 15', 'multiple_choice', '["A. 23", "B. 7", "C. 8", "D. 15"]', 'B', 'x + 8 = 15; x = 15 - 8 = 7.', 'easy', 1, 4),

('q_bece_math_2023_005', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'The area of a square with side 6 cm is:', 'multiple_choice', '["A. 12 cm²", "B. 24 cm²", "C. 36 cm²", "D. 18 cm²"]', 'C', 'Area = side² = 6² = 36 cm².', 'easy', 1, 5),

('q_bece_math_2023_006', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Write 0.7 as a fraction.', 'multiple_choice', '["A. 7/100", "B. 7/10", "C. 70/10", "D. 7/1"]', 'B', '0.7 = 7/10.', 'easy', 1, 6),

('q_bece_math_2023_007', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'The HCF of 8 and 12 is:', 'multiple_choice', '["A. 2", "B. 4", "C. 8", "D. 24"]', 'B', 'HCF of 8 and 12 is 4.', 'easy', 1, 7),

('q_bece_math_2023_008', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'How many minutes are in 2.5 hours?', 'multiple_choice', '["A. 120", "B. 150", "C. 180", "D. 100"]', 'B', '2.5 hours = 2.5 × 60 = 150 minutes.', 'easy', 1, 8),

('q_bece_math_2023_009', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Find the value of 2³', 'multiple_choice', '["A. 6", "B. 8", "C. 5", "D. 9"]', 'B', '2³ = 2 × 2 × 2 = 8.', 'easy', 1, 9),

('q_bece_math_2023_010', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'The median of 2, 5, 7, 9, 12 is:', 'multiple_choice', '["A. 5", "B. 7", "C. 9", "D. 6"]', 'B', 'The middle value (median) is 7.', 'easy', 1, 10),

('q_bece_math_2023_011', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Solve: 5x = 35', 'multiple_choice', '["A. 5", "B. 7", "C. 30", "D. 40"]', 'B', '5x = 35; x = 35/5 = 7.', 'easy', 1, 11),

('q_bece_math_2023_012', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'A triangle has angles 40° and 60°. Find the third angle.', 'multiple_choice', '["A. 80°", "B. 100°", "C. 20°", "D. 180°"]', 'A', 'Third angle = 180 - 40 - 60 = 80°.', 'easy', 1, 12),

('q_bece_math_2023_013', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Express 2/5 as a decimal.', 'multiple_choice', '["A. 0.2", "B. 0.4", "C. 0.25", "D. 2.5"]', 'B', '2/5 = 2 ÷ 5 = 0.4.', 'easy', 1, 13),

('q_bece_math_2023_014', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Simplify: 3/4 - 1/4', 'multiple_choice', '["A. 1/4", "B. 2/4", "C. 1/2", "D. 3/4"]', 'C', '3/4 - 1/4 = 2/4 = 1/2.', 'easy', 1, 14),

('q_bece_math_2023_015', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'How many sides does a pentagon have?', 'multiple_choice', '["A. 4", "B. 5", "C. 6", "D. 8"]', 'B', 'A pentagon has 5 sides.', 'easy', 1, 15),

('q_bece_math_2023_016', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'What is √49?', 'multiple_choice', '["A. 6", "B. 7", "C. 8", "D. 9"]', 'B', '√49 = 7.', 'easy', 1, 16),

('q_bece_math_2023_017', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Convert 3000 g to kg.', 'multiple_choice', '["A. 0.3 kg", "B. 3 kg", "C. 30 kg", "D. 300 kg"]', 'B', '3000 g = 3000/1000 = 3 kg.', 'easy', 1, 17),

('q_bece_math_2023_018', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Find the next term: 1, 4, 9, 16, ...', 'multiple_choice', '["A. 20", "B. 25", "C. 21", "D. 36"]', 'B', 'These are perfect squares: 1², 2², 3², 4². Next is 5² = 25.', 'medium', 1, 18),

('q_bece_math_2023_019', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'If a book costs GH₵15 and you pay with GH₵20, your change is:', 'multiple_choice', '["A. GH₵35", "B. GH₵5", "C. GH₵15", "D. GH₵10"]', 'B', 'Change = 20 - 15 = GH₵5.', 'easy', 1, 19),

('q_bece_math_2023_020', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'An angle greater than 90° but less than 180° is:', 'multiple_choice', '["A. Acute", "B. Right", "C. Obtuse", "D. Reflex"]', 'C', 'An obtuse angle is between 90° and 180°.', 'easy', 1, 20),

('q_bece_math_2023_021', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Evaluate: (-3) × 4', 'multiple_choice', '["A. -12", "B. 12", "C. -7", "D. 7"]', 'A', '(-3) × 4 = -12.', 'easy', 1, 21),

('q_bece_math_2023_022', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'The ratio 12:18 in simplest form is:', 'multiple_choice', '["A. 6:9", "B. 4:6", "C. 2:3", "D. 1:2"]', 'C', '12:18 = 2:3 (dividing both by 6).', 'easy', 1, 22),

('q_bece_math_2023_023', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'A regular polygon has 4 sides. It is called a:', 'multiple_choice', '["A. Triangle", "B. Pentagon", "C. Square", "D. Hexagon"]', 'C', 'A 4-sided regular polygon is a square.', 'easy', 1, 23),

('q_bece_math_2023_024', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Find the simple interest on GH₵500 at 10% for 2 years.', 'multiple_choice', '["A. GH₵50", "B. GH₵100", "C. GH₵200", "D. GH₵1000"]', 'B', 'SI = PRT/100 = 500 × 10 × 2/100 = GH₵100.', 'medium', 1, 24),

('q_bece_math_2023_025', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Which of the following is a prime number?', 'multiple_choice', '["A. 9", "B. 15", "C. 17", "D. 21"]', 'C', '17 is prime (only divisible by 1 and 17).', 'easy', 1, 25),

('q_bece_math_2023_026', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'What is 1/4 of 32?', 'multiple_choice', '["A. 4", "B. 8", "C. 16", "D. 28"]', 'B', '1/4 × 32 = 8.', 'easy', 1, 26),

('q_bece_math_2023_027', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Find the perimeter of a rectangle with length 10 cm and width 4 cm.', 'multiple_choice', '["A. 14 cm", "B. 28 cm", "C. 40 cm", "D. 20 cm"]', 'B', 'Perimeter = 2(l + w) = 2(10 + 4) = 28 cm.', 'easy', 1, 27),

('q_bece_math_2023_028', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Simplify: 4² - 3²', 'multiple_choice', '["A. 1", "B. 7", "C. 25", "D. 5"]', 'B', '4² - 3² = 16 - 9 = 7.', 'easy', 1, 28),

('q_bece_math_2023_029', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'If y = 2x + 3 and x = 4, find y.', 'multiple_choice', '["A. 8", "B. 11", "C. 9", "D. 14"]', 'B', 'y = 2(4) + 3 = 8 + 3 = 11.', 'easy', 1, 29),

('q_bece_math_2023_030', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'The sum of angles on a straight line is:', 'multiple_choice', '["A. 90°", "B. 180°", "C. 270°", "D. 360°"]', 'B', 'Angles on a straight line sum to 180°.', 'easy', 1, 30),

('q_bece_math_2023_031', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Express 35% as a fraction in lowest terms.', 'multiple_choice', '["A. 35/100", "B. 7/20", "C. 7/10", "D. 1/3"]', 'B', '35% = 35/100 = 7/20.', 'easy', 1, 31),

('q_bece_math_2023_032', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'A bus leaves at 8:15 a.m. and arrives at 10:45 a.m. How long is the journey?', 'multiple_choice', '["A. 2 hours 15 minutes", "B. 2 hours 30 minutes", "C. 2 hours 45 minutes", "D. 3 hours"]', 'B', 'From 8:15 to 10:45 = 2 hours 30 minutes.', 'medium', 1, 32),

('q_bece_math_2023_033', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Simplify: 2(x + 5) - 3', 'multiple_choice', '["A. 2x + 7", "B. 2x + 10", "C. 2x + 2", "D. 2x - 3"]', 'A', '2(x + 5) - 3 = 2x + 10 - 3 = 2x + 7.', 'medium', 1, 33),

('q_bece_math_2023_034', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'The probability of an impossible event is:', 'multiple_choice', '["A. 0", "B. 1/2", "C. 1", "D. -1"]', 'A', 'An impossible event has probability 0.', 'easy', 1, 34),

('q_bece_math_2023_035', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Find the volume of a cuboid with dimensions 3 cm × 4 cm × 5 cm.', 'multiple_choice', '["A. 12 cm³", "B. 24 cm³", "C. 60 cm³", "D. 20 cm³"]', 'C', 'Volume = 3 × 4 × 5 = 60 cm³.', 'easy', 1, 35),

('q_bece_math_2023_036', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'If 2x - 4 = 10, find x.', 'multiple_choice', '["A. 3", "B. 5", "C. 7", "D. 14"]', 'C', '2x - 4 = 10; 2x = 14; x = 7.', 'easy', 1, 36),

('q_bece_math_2023_037', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'The diameter of a circle is 14 cm. What is the radius?', 'multiple_choice', '["A. 28 cm", "B. 7 cm", "C. 14 cm", "D. 3.5 cm"]', 'B', 'Radius = diameter/2 = 14/2 = 7 cm.', 'easy', 1, 37),

('q_bece_math_2023_038', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'What is the place value of 5 in 3,524?', 'multiple_choice', '["A. 5", "B. 50", "C. 500", "D. 5000"]', 'C', '5 is in the hundreds place, so its value is 500.', 'easy', 1, 38),

('q_bece_math_2023_039', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'Kofi scored 60, 70, 80 in three tests. What is his average?', 'multiple_choice', '["A. 60", "B. 70", "C. 80", "D. 210"]', 'B', 'Average = (60 + 70 + 80)/3 = 210/3 = 70.', 'easy', 1, 39),

('q_bece_math_2023_040', 'subj_bece_math', 'exam_bece', 'paper_bece_1', 'pp_bece_math_2023_1', 'The supplement of 110° is:', 'multiple_choice', '["A. 70°", "B. 80°", "C. 250°", "D. 20°"]', 'A', 'Supplementary angles add up to 180°. 180 - 110 = 70°.', 'easy', 1, 40);
