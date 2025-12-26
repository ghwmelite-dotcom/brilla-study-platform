-- Migration 029: WASSCE Core Mathematics Questions (2024 & 2023)
-- Paper 1 - Objective Questions (50 questions each)

-- First, ensure the past_paper_id column exists
-- We'll add it if the column check fails

-- WASSCE Core Mathematics 2024 Paper 1 Questions
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number, section) VALUES

-- Number and Numeration (Questions 1-10)
('q_wm24_001', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Simplify: 3/4 + 2/3 - 1/2', 'multiple_choice',
'[{"id":"A","text":"11/12"},{"id":"B","text":"5/6"},{"id":"C","text":"7/12"},{"id":"D","text":"3/4"}]',
'11/12', 'Convert to common denominator 12: 9/12 + 8/12 - 6/12 = 11/12', 'medium', 1, 1, 'A'),

('q_wm24_002', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Express 0.000045 in standard form', 'multiple_choice',
'[{"id":"A","text":"4.5 × 10⁻⁵"},{"id":"B","text":"4.5 × 10⁻⁴"},{"id":"C","text":"45 × 10⁻⁶"},{"id":"D","text":"0.45 × 10⁻⁴"}]',
'4.5 × 10⁻⁵', 'Move decimal 5 places right: 0.000045 = 4.5 × 10⁻⁵', 'easy', 1, 2, 'A'),

('q_wm24_003', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the LCM of 12, 18, and 24', 'multiple_choice',
'[{"id":"A","text":"72"},{"id":"B","text":"36"},{"id":"C","text":"48"},{"id":"D","text":"144"}]',
'72', '12 = 2² × 3, 18 = 2 × 3², 24 = 2³ × 3. LCM = 2³ × 3² = 72', 'medium', 1, 3, 'A'),

('q_wm24_004', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'If 2ˣ = 32, find the value of x', 'multiple_choice',
'[{"id":"A","text":"4"},{"id":"B","text":"5"},{"id":"C","text":"6"},{"id":"D","text":"3"}]',
'5', '32 = 2⁵, therefore x = 5', 'easy', 1, 4, 'A'),

('q_wm24_005', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Evaluate √(144/25)', 'multiple_choice',
'[{"id":"A","text":"12/5"},{"id":"B","text":"5/12"},{"id":"C","text":"7/5"},{"id":"D","text":"12/25"}]',
'12/5', '√(144/25) = √144/√25 = 12/5', 'easy', 1, 5, 'A'),

('q_wm24_006', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Convert 110101₂ to base 10', 'multiple_choice',
'[{"id":"A","text":"53"},{"id":"B","text":"45"},{"id":"C","text":"37"},{"id":"D","text":"41"}]',
'53', '1(32) + 1(16) + 0(8) + 1(4) + 0(2) + 1(1) = 32 + 16 + 4 + 1 = 53', 'medium', 1, 6, 'A'),

('q_wm24_007', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Simplify: (27)^(2/3)', 'multiple_choice',
'[{"id":"A","text":"9"},{"id":"B","text":"3"},{"id":"C","text":"6"},{"id":"D","text":"18"}]',
'9', '27^(2/3) = (³√27)² = 3² = 9', 'medium', 1, 7, 'A'),

('q_wm24_008', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Express 75% as a fraction in its lowest terms', 'multiple_choice',
'[{"id":"A","text":"3/4"},{"id":"B","text":"7/10"},{"id":"C","text":"15/20"},{"id":"D","text":"5/6"}]',
'3/4', '75% = 75/100 = 3/4', 'easy', 1, 8, 'A'),

('q_wm24_009', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the value of x if log₁₀x = 2', 'multiple_choice',
'[{"id":"A","text":"100"},{"id":"B","text":"20"},{"id":"C","text":"10"},{"id":"D","text":"1000"}]',
'100', 'If log₁₀x = 2, then x = 10² = 100', 'medium', 1, 9, 'A'),

('q_wm24_010', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Simplify: 2³ × 2⁴ ÷ 2²', 'multiple_choice',
'[{"id":"A","text":"32"},{"id":"B","text":"16"},{"id":"C","text":"64"},{"id":"D","text":"8"}]',
'32', '2³ × 2⁴ ÷ 2² = 2^(3+4-2) = 2⁵ = 32', 'easy', 1, 10, 'A'),

-- Algebra (Questions 11-20)
('q_wm24_011', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Solve for x: 3x - 7 = 2x + 5', 'multiple_choice',
'[{"id":"A","text":"12"},{"id":"B","text":"-12"},{"id":"C","text":"2"},{"id":"D","text":"-2"}]',
'12', '3x - 2x = 5 + 7, x = 12', 'easy', 1, 11, 'B'),

('q_wm24_012', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Factorize: x² - 9', 'multiple_choice',
'[{"id":"A","text":"(x+3)(x-3)"},{"id":"B","text":"(x+3)²"},{"id":"C","text":"(x-3)²"},{"id":"D","text":"(x+9)(x-1)"}]',
'(x+3)(x-3)', 'Difference of squares: a² - b² = (a+b)(a-b)', 'easy', 1, 12, 'B'),

('q_wm24_013', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'If 2x + 3y = 12 and x - y = 1, find the value of x', 'multiple_choice',
'[{"id":"A","text":"3"},{"id":"B","text":"2"},{"id":"C","text":"4"},{"id":"D","text":"5"}]',
'3', 'From x - y = 1, x = y + 1. Substitute: 2(y+1) + 3y = 12, 5y = 10, y = 2, x = 3', 'medium', 1, 13, 'B'),

('q_wm24_014', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Simplify: (2a + 3b) - (a - 2b)', 'multiple_choice',
'[{"id":"A","text":"a + 5b"},{"id":"B","text":"a + b"},{"id":"C","text":"3a + b"},{"id":"D","text":"3a + 5b"}]',
'a + 5b', '2a + 3b - a + 2b = a + 5b', 'easy', 1, 14, 'B'),

('q_wm24_015', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Solve the quadratic equation: x² - 5x + 6 = 0', 'multiple_choice',
'[{"id":"A","text":"x = 2 or x = 3"},{"id":"B","text":"x = -2 or x = -3"},{"id":"C","text":"x = 1 or x = 6"},{"id":"D","text":"x = -1 or x = -6"}]',
'x = 2 or x = 3', 'Factorize: (x-2)(x-3) = 0, so x = 2 or x = 3', 'medium', 1, 15, 'B'),

('q_wm24_016', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Make r the subject of the formula: A = πr²', 'multiple_choice',
'[{"id":"A","text":"r = √(A/π)"},{"id":"B","text":"r = A/π"},{"id":"C","text":"r = √(Aπ)"},{"id":"D","text":"r = A²/π"}]',
'r = √(A/π)', 'A = πr², r² = A/π, r = √(A/π)', 'medium', 1, 16, 'B'),

('q_wm24_017', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'If f(x) = 2x² - 3x + 1, find f(2)', 'multiple_choice',
'[{"id":"A","text":"3"},{"id":"B","text":"5"},{"id":"C","text":"7"},{"id":"D","text":"1"}]',
'3', 'f(2) = 2(4) - 3(2) + 1 = 8 - 6 + 1 = 3', 'medium', 1, 17, 'B'),

('q_wm24_018', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Solve the inequality: 2x - 3 > 5', 'multiple_choice',
'[{"id":"A","text":"x > 4"},{"id":"B","text":"x > 1"},{"id":"C","text":"x < 4"},{"id":"D","text":"x > 8"}]',
'x > 4', '2x > 8, x > 4', 'easy', 1, 18, 'B'),

('q_wm24_019', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Express (x² - 4)/(x + 2) in its simplest form', 'multiple_choice',
'[{"id":"A","text":"x - 2"},{"id":"B","text":"x + 2"},{"id":"C","text":"x² - 2"},{"id":"D","text":"x - 4"}]',
'x - 2', '(x² - 4)/(x + 2) = (x+2)(x-2)/(x+2) = x - 2', 'medium', 1, 19, 'B'),

('q_wm24_020', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the nth term of the sequence: 3, 7, 11, 15, ...', 'multiple_choice',
'[{"id":"A","text":"4n - 1"},{"id":"B","text":"4n + 1"},{"id":"C","text":"3n + 4"},{"id":"D","text":"4n - 3"}]',
'4n - 1', 'First term a = 3, common difference d = 4. nth term = a + (n-1)d = 3 + 4n - 4 = 4n - 1', 'medium', 1, 20, 'B'),

-- Geometry and Mensuration (Questions 21-35)
('q_wm24_021', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Calculate the area of a triangle with base 8 cm and height 6 cm', 'multiple_choice',
'[{"id":"A","text":"24 cm²"},{"id":"B","text":"48 cm²"},{"id":"C","text":"14 cm²"},{"id":"D","text":"28 cm²"}]',
'24 cm²', 'Area = ½ × base × height = ½ × 8 × 6 = 24 cm²', 'easy', 1, 21, 'C'),

('q_wm24_022', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the circumference of a circle with radius 7 cm (Take π = 22/7)', 'multiple_choice',
'[{"id":"A","text":"44 cm"},{"id":"B","text":"22 cm"},{"id":"C","text":"154 cm"},{"id":"D","text":"88 cm"}]',
'44 cm', 'C = 2πr = 2 × 22/7 × 7 = 44 cm', 'easy', 1, 22, 'C'),

('q_wm24_023', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'The angles of a triangle are in the ratio 2:3:4. Find the largest angle', 'multiple_choice',
'[{"id":"A","text":"80°"},{"id":"B","text":"60°"},{"id":"C","text":"40°"},{"id":"D","text":"100°"}]',
'80°', 'Sum = 180°, 2x + 3x + 4x = 180, 9x = 180, x = 20. Largest = 4(20) = 80°', 'medium', 1, 23, 'C'),

('q_wm24_024', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Calculate the volume of a cylinder with radius 3 cm and height 7 cm (Take π = 22/7)', 'multiple_choice',
'[{"id":"A","text":"198 cm³"},{"id":"B","text":"66 cm³"},{"id":"C","text":"132 cm³"},{"id":"D","text":"396 cm³"}]',
'198 cm³', 'V = πr²h = 22/7 × 9 × 7 = 198 cm³', 'medium', 1, 24, 'C'),

('q_wm24_025', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'What is the sum of interior angles of a hexagon?', 'multiple_choice',
'[{"id":"A","text":"720°"},{"id":"B","text":"540°"},{"id":"C","text":"360°"},{"id":"D","text":"900°"}]',
'720°', 'Sum = (n-2) × 180° = (6-2) × 180° = 720°', 'medium', 1, 25, 'C'),

('q_wm24_026', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the length of the diagonal of a rectangle with length 8 cm and width 6 cm', 'multiple_choice',
'[{"id":"A","text":"10 cm"},{"id":"B","text":"14 cm"},{"id":"C","text":"7 cm"},{"id":"D","text":"12 cm"}]',
'10 cm', 'Using Pythagoras: d = √(8² + 6²) = √(64 + 36) = √100 = 10 cm', 'medium', 1, 26, 'C'),

('q_wm24_027', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'The surface area of a sphere is 616 cm². Find its radius (Take π = 22/7)', 'multiple_choice',
'[{"id":"A","text":"7 cm"},{"id":"B","text":"14 cm"},{"id":"C","text":"49 cm"},{"id":"D","text":"3.5 cm"}]',
'7 cm', '4πr² = 616, r² = 616 × 7/(4 × 22) = 49, r = 7 cm', 'hard', 1, 27, 'C'),

('q_wm24_028', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Two similar triangles have corresponding sides in the ratio 3:5. If the area of the smaller triangle is 27 cm², find the area of the larger triangle', 'multiple_choice',
'[{"id":"A","text":"75 cm²"},{"id":"B","text":"45 cm²"},{"id":"C","text":"135 cm²"},{"id":"D","text":"81 cm²"}]',
'75 cm²', 'Area ratio = 3²:5² = 9:25. 27/A = 9/25, A = 75 cm²', 'hard', 1, 28, 'C'),

('q_wm24_029', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the area of a sector with angle 60° and radius 21 cm (Take π = 22/7)', 'multiple_choice',
'[{"id":"A","text":"231 cm²"},{"id":"B","text":"462 cm²"},{"id":"C","text":"154 cm²"},{"id":"D","text":"77 cm²"}]',
'231 cm²', 'Area = θ/360 × πr² = 60/360 × 22/7 × 441 = 231 cm²', 'medium', 1, 29, 'C'),

('q_wm24_030', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Calculate the perimeter of a semicircle with diameter 14 cm (Take π = 22/7)', 'multiple_choice',
'[{"id":"A","text":"36 cm"},{"id":"B","text":"22 cm"},{"id":"C","text":"44 cm"},{"id":"D","text":"58 cm"}]',
'36 cm', 'Perimeter = πr + 2r = 22/7 × 7 + 14 = 22 + 14 = 36 cm', 'medium', 1, 30, 'C'),

('q_wm24_031', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'A cone has base radius 4 cm and height 3 cm. Calculate its volume (Take π = 22/7)', 'multiple_choice',
'[{"id":"A","text":"50.29 cm³"},{"id":"B","text":"150.86 cm³"},{"id":"C","text":"100.57 cm³"},{"id":"D","text":"25.14 cm³"}]',
'50.29 cm³', 'V = 1/3 × πr²h = 1/3 × 22/7 × 16 × 3 ≈ 50.29 cm³', 'medium', 1, 31, 'C'),

('q_wm24_032', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the gradient of the line joining points A(2, 3) and B(6, 11)', 'multiple_choice',
'[{"id":"A","text":"2"},{"id":"B","text":"4"},{"id":"C","text":"1/2"},{"id":"D","text":"8"}]',
'2', 'Gradient = (y₂ - y₁)/(x₂ - x₁) = (11-3)/(6-2) = 8/4 = 2', 'medium', 1, 32, 'C'),

('q_wm24_033', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'What is the equation of a line with gradient 3 passing through the origin?', 'multiple_choice',
'[{"id":"A","text":"y = 3x"},{"id":"B","text":"y = x + 3"},{"id":"C","text":"y = 3x + 1"},{"id":"D","text":"y = x/3"}]',
'y = 3x', 'Line through origin: y = mx where m = 3, so y = 3x', 'easy', 1, 33, 'C'),

('q_wm24_034', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'The bearing of B from A is 075°. What is the bearing of A from B?', 'multiple_choice',
'[{"id":"A","text":"255°"},{"id":"B","text":"105°"},{"id":"C","text":"285°"},{"id":"D","text":"195°"}]',
'255°', 'Back bearing = 075° + 180° = 255°', 'medium', 1, 34, 'C'),

('q_wm24_035', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'A ladder 10 m long leans against a wall. If the foot of the ladder is 6 m from the wall, how high up the wall does the ladder reach?', 'multiple_choice',
'[{"id":"A","text":"8 m"},{"id":"B","text":"4 m"},{"id":"C","text":"16 m"},{"id":"D","text":"6 m"}]',
'8 m', 'Using Pythagoras: h² + 6² = 10², h² = 100 - 36 = 64, h = 8 m', 'medium', 1, 35, 'C'),

-- Trigonometry (Questions 36-40)
('q_wm24_036', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the value of sin 30°', 'multiple_choice',
'[{"id":"A","text":"1/2"},{"id":"B","text":"√3/2"},{"id":"C","text":"1"},{"id":"D","text":"√2/2"}]',
'1/2', 'sin 30° = 1/2 (standard value)', 'easy', 1, 36, 'D'),

('q_wm24_037', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'In a right-angled triangle, if the opposite side is 5 and the hypotenuse is 13, find sin θ', 'multiple_choice',
'[{"id":"A","text":"5/13"},{"id":"B","text":"12/13"},{"id":"C","text":"5/12"},{"id":"D","text":"13/5"}]',
'5/13', 'sin θ = opposite/hypotenuse = 5/13', 'easy', 1, 37, 'D'),

('q_wm24_038', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the value of tan 45°', 'multiple_choice',
'[{"id":"A","text":"1"},{"id":"B","text":"0"},{"id":"C","text":"√2"},{"id":"D","text":"1/√2"}]',
'1', 'tan 45° = 1 (standard value)', 'easy', 1, 38, 'D'),

('q_wm24_039', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'If cos θ = 0.6, find sin θ (θ is acute)', 'multiple_choice',
'[{"id":"A","text":"0.8"},{"id":"B","text":"0.4"},{"id":"C","text":"1.6"},{"id":"D","text":"0.36"}]',
'0.8', 'sin²θ + cos²θ = 1, sin²θ = 1 - 0.36 = 0.64, sin θ = 0.8', 'medium', 1, 39, 'D'),

('q_wm24_040', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'From the top of a building 50 m high, the angle of depression to a car is 30°. How far is the car from the base of the building?', 'multiple_choice',
'[{"id":"A","text":"86.6 m"},{"id":"B","text":"50 m"},{"id":"C","text":"28.9 m"},{"id":"D","text":"100 m"}]',
'86.6 m', 'tan 30° = 50/d, d = 50/tan 30° = 50/(1/√3) = 50√3 ≈ 86.6 m', 'hard', 1, 40, 'D'),

-- Statistics and Probability (Questions 41-50)
('q_wm24_041', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the mean of: 4, 7, 9, 12, 8', 'multiple_choice',
'[{"id":"A","text":"8"},{"id":"B","text":"9"},{"id":"C","text":"7"},{"id":"D","text":"10"}]',
'8', 'Mean = (4+7+9+12+8)/5 = 40/5 = 8', 'easy', 1, 41, 'E'),

('q_wm24_042', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the median of: 3, 7, 2, 9, 5, 8, 4', 'multiple_choice',
'[{"id":"A","text":"5"},{"id":"B","text":"7"},{"id":"C","text":"4"},{"id":"D","text":"6"}]',
'5', 'Arranged: 2, 3, 4, 5, 7, 8, 9. Middle value = 5', 'easy', 1, 42, 'E'),

('q_wm24_043', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'Find the mode of: 2, 3, 5, 3, 7, 3, 8, 2', 'multiple_choice',
'[{"id":"A","text":"3"},{"id":"B","text":"2"},{"id":"C","text":"5"},{"id":"D","text":"7"}]',
'3', 'Mode is the most frequent value. 3 appears 3 times.', 'easy', 1, 43, 'E'),

('q_wm24_044', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'The range of a set of data is 15 and the smallest value is 7. Find the largest value.', 'multiple_choice',
'[{"id":"A","text":"22"},{"id":"B","text":"8"},{"id":"C","text":"15"},{"id":"D","text":"23"}]',
'22', 'Range = Largest - Smallest, 15 = L - 7, L = 22', 'easy', 1, 44, 'E'),

('q_wm24_045', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'A die is thrown once. What is the probability of getting a number greater than 4?', 'multiple_choice',
'[{"id":"A","text":"1/3"},{"id":"B","text":"1/2"},{"id":"C","text":"2/3"},{"id":"D","text":"1/6"}]',
'1/3', 'Numbers greater than 4: {5, 6}. P = 2/6 = 1/3', 'easy', 1, 45, 'E'),

('q_wm24_046', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'If P(A) = 0.3 and P(B) = 0.5, and A and B are independent events, find P(A and B)', 'multiple_choice',
'[{"id":"A","text":"0.15"},{"id":"B","text":"0.8"},{"id":"C","text":"0.2"},{"id":"D","text":"0.35"}]',
'0.15', 'For independent events: P(A and B) = P(A) × P(B) = 0.3 × 0.5 = 0.15', 'medium', 1, 46, 'E'),

('q_wm24_047', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'A bag contains 4 red and 6 blue balls. If a ball is picked at random, what is the probability that it is blue?', 'multiple_choice',
'[{"id":"A","text":"3/5"},{"id":"B","text":"2/5"},{"id":"C","text":"1/2"},{"id":"D","text":"2/3"}]',
'3/5', 'P(blue) = 6/(4+6) = 6/10 = 3/5', 'easy', 1, 47, 'E'),

('q_wm24_048', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'The variance of a set of data is 16. Find the standard deviation.', 'multiple_choice',
'[{"id":"A","text":"4"},{"id":"B","text":"8"},{"id":"C","text":"256"},{"id":"D","text":"2"}]',
'4', 'Standard deviation = √variance = √16 = 4', 'easy', 1, 48, 'E'),

('q_wm24_049', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'In a class of 40 students, 25 study French, 20 study German, and 5 study neither. How many study both?', 'multiple_choice',
'[{"id":"A","text":"10"},{"id":"B","text":"15"},{"id":"C","text":"5"},{"id":"D","text":"20"}]',
'10', 'n(F ∪ G) = 40 - 5 = 35. n(F) + n(G) - n(F ∩ G) = 35, 25 + 20 - x = 35, x = 10', 'medium', 1, 49, 'E'),

('q_wm24_050', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2024_1',
'A coin is tossed 3 times. What is the probability of getting exactly 2 heads?', 'multiple_choice',
'[{"id":"A","text":"3/8"},{"id":"B","text":"1/4"},{"id":"C","text":"1/2"},{"id":"D","text":"1/8"}]',
'3/8', 'Favorable outcomes: HHT, HTH, THH = 3. Total outcomes = 8. P = 3/8', 'medium', 1, 50, 'E');

-- WASSCE Core Mathematics 2023 Paper 1 Questions (50 questions)
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number, section) VALUES

('q_wm23_001', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Evaluate: 25 - 3 × 4 + 8 ÷ 2', 'multiple_choice',
'[{"id":"A","text":"17"},{"id":"B","text":"92"},{"id":"C","text":"21"},{"id":"D","text":"15"}]',
'17', 'BODMAS: 25 - 12 + 4 = 17', 'easy', 1, 1, 'A'),

('q_wm23_002', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Simplify: 2/5 × 15/8', 'multiple_choice',
'[{"id":"A","text":"3/4"},{"id":"B","text":"3/8"},{"id":"C","text":"5/8"},{"id":"D","text":"1/4"}]',
'3/4', '(2 × 15)/(5 × 8) = 30/40 = 3/4', 'easy', 1, 2, 'A'),

('q_wm23_003', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Express 45 as a product of prime factors', 'multiple_choice',
'[{"id":"A","text":"3² × 5"},{"id":"B","text":"3 × 15"},{"id":"C","text":"5 × 9"},{"id":"D","text":"3 × 5²"}]',
'3² × 5', '45 = 9 × 5 = 3 × 3 × 5 = 3² × 5', 'easy', 1, 3, 'A'),

('q_wm23_004', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the HCF of 24 and 36', 'multiple_choice',
'[{"id":"A","text":"12"},{"id":"B","text":"6"},{"id":"C","text":"72"},{"id":"D","text":"18"}]',
'12', '24 = 2³ × 3, 36 = 2² × 3². HCF = 2² × 3 = 12', 'easy', 1, 4, 'A'),

('q_wm23_005', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Convert 11011₂ to base 10', 'multiple_choice',
'[{"id":"A","text":"27"},{"id":"B","text":"23"},{"id":"C","text":"29"},{"id":"D","text":"25"}]',
'27', '1(16) + 1(8) + 0(4) + 1(2) + 1(1) = 16 + 8 + 2 + 1 = 27', 'medium', 1, 5, 'A'),

('q_wm23_006', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Evaluate: (0.04)^(1/2)', 'multiple_choice',
'[{"id":"A","text":"0.2"},{"id":"B","text":"0.02"},{"id":"C","text":"2"},{"id":"D","text":"0.4"}]',
'0.2', '√0.04 = 0.2', 'easy', 1, 6, 'A'),

('q_wm23_007', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'If 3ˣ = 81, find x', 'multiple_choice',
'[{"id":"A","text":"4"},{"id":"B","text":"3"},{"id":"C","text":"27"},{"id":"D","text":"5"}]',
'4', '81 = 3⁴, so x = 4', 'easy', 1, 7, 'A'),

('q_wm23_008', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Express 7/20 as a percentage', 'multiple_choice',
'[{"id":"A","text":"35%"},{"id":"B","text":"3.5%"},{"id":"C","text":"0.35%"},{"id":"D","text":"70%"}]',
'35%', '7/20 × 100% = 35%', 'easy', 1, 8, 'A'),

('q_wm23_009', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Simplify: log₁₀100 - log₁₀10', 'multiple_choice',
'[{"id":"A","text":"1"},{"id":"B","text":"10"},{"id":"C","text":"90"},{"id":"D","text":"2"}]',
'1', 'log₁₀100 - log₁₀10 = 2 - 1 = 1', 'medium', 1, 9, 'A'),

('q_wm23_010', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Round 3.4567 to 2 decimal places', 'multiple_choice',
'[{"id":"A","text":"3.46"},{"id":"B","text":"3.45"},{"id":"C","text":"3.5"},{"id":"D","text":"3.47"}]',
'3.46', '3.4567 ≈ 3.46 (round up because 6 > 5)', 'easy', 1, 10, 'A'),

('q_wm23_011', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Solve: 5x + 3 = 2x + 18', 'multiple_choice',
'[{"id":"A","text":"5"},{"id":"B","text":"3"},{"id":"C","text":"7"},{"id":"D","text":"15"}]',
'5', '5x - 2x = 18 - 3, 3x = 15, x = 5', 'easy', 1, 11, 'B'),

('q_wm23_012', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Factorize completely: 2x² - 8', 'multiple_choice',
'[{"id":"A","text":"2(x+2)(x-2)"},{"id":"B","text":"2(x²-4)"},{"id":"C","text":"(2x+4)(x-2)"},{"id":"D","text":"2x(x-4)"}]',
'2(x+2)(x-2)', '2x² - 8 = 2(x² - 4) = 2(x+2)(x-2)', 'medium', 1, 12, 'B'),

('q_wm23_013', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'If y = 3x - 5, find y when x = 4', 'multiple_choice',
'[{"id":"A","text":"7"},{"id":"B","text":"12"},{"id":"C","text":"2"},{"id":"D","text":"17"}]',
'7', 'y = 3(4) - 5 = 12 - 5 = 7', 'easy', 1, 13, 'B'),

('q_wm23_014', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Expand: (x + 3)(x - 2)', 'multiple_choice',
'[{"id":"A","text":"x² + x - 6"},{"id":"B","text":"x² - x - 6"},{"id":"C","text":"x² + 5x - 6"},{"id":"D","text":"x² - 5x + 6"}]',
'x² + x - 6', '(x+3)(x-2) = x² - 2x + 3x - 6 = x² + x - 6', 'easy', 1, 14, 'B'),

('q_wm23_015', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Solve: x² - 7x + 12 = 0', 'multiple_choice',
'[{"id":"A","text":"x = 3 or x = 4"},{"id":"B","text":"x = -3 or x = -4"},{"id":"C","text":"x = 2 or x = 6"},{"id":"D","text":"x = 1 or x = 12"}]',
'x = 3 or x = 4', '(x-3)(x-4) = 0, x = 3 or x = 4', 'medium', 1, 15, 'B'),

('q_wm23_016', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Make x the subject: y = (x + 3)/2', 'multiple_choice',
'[{"id":"A","text":"x = 2y - 3"},{"id":"B","text":"x = 2y + 3"},{"id":"C","text":"x = y/2 - 3"},{"id":"D","text":"x = (y - 3)/2"}]',
'x = 2y - 3', '2y = x + 3, x = 2y - 3', 'easy', 1, 16, 'B'),

('q_wm23_017', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the 10th term of the AP: 5, 8, 11, 14, ...', 'multiple_choice',
'[{"id":"A","text":"32"},{"id":"B","text":"35"},{"id":"C","text":"29"},{"id":"D","text":"38"}]',
'32', 'a = 5, d = 3. T₁₀ = 5 + (10-1)×3 = 5 + 27 = 32', 'medium', 1, 17, 'B'),

('q_wm23_018', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Solve the inequality: 4x - 7 ≤ 5', 'multiple_choice',
'[{"id":"A","text":"x ≤ 3"},{"id":"B","text":"x ≥ 3"},{"id":"C","text":"x ≤ -3"},{"id":"D","text":"x < 3"}]',
'x ≤ 3', '4x ≤ 12, x ≤ 3', 'easy', 1, 18, 'B'),

('q_wm23_019', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Simplify: (x³)² ÷ x⁴', 'multiple_choice',
'[{"id":"A","text":"x²"},{"id":"B","text":"x⁶"},{"id":"C","text":"x¹⁰"},{"id":"D","text":"x"}]',
'x²', 'x⁶ ÷ x⁴ = x^(6-4) = x²', 'easy', 1, 19, 'B'),

('q_wm23_020', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'If f(x) = x² - 2x + 3, find f(-1)', 'multiple_choice',
'[{"id":"A","text":"6"},{"id":"B","text":"0"},{"id":"C","text":"4"},{"id":"D","text":"2"}]',
'6', 'f(-1) = 1 + 2 + 3 = 6', 'easy', 1, 20, 'B'),

('q_wm23_021', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Calculate the area of a rectangle with length 12 cm and width 5 cm', 'multiple_choice',
'[{"id":"A","text":"60 cm²"},{"id":"B","text":"34 cm²"},{"id":"C","text":"17 cm²"},{"id":"D","text":"120 cm²"}]',
'60 cm²', 'Area = length × width = 12 × 5 = 60 cm²', 'easy', 1, 21, 'C'),

('q_wm23_022', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the area of a circle with diameter 14 cm (Take π = 22/7)', 'multiple_choice',
'[{"id":"A","text":"154 cm²"},{"id":"B","text":"44 cm²"},{"id":"C","text":"616 cm²"},{"id":"D","text":"308 cm²"}]',
'154 cm²', 'r = 7, A = πr² = 22/7 × 49 = 154 cm²', 'easy', 1, 22, 'C'),

('q_wm23_023', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'The interior angle of a regular polygon is 120°. How many sides does it have?', 'multiple_choice',
'[{"id":"A","text":"6"},{"id":"B","text":"5"},{"id":"C","text":"8"},{"id":"D","text":"4"}]',
'6', 'Interior angle = (n-2)×180/n = 120, solving gives n = 6', 'medium', 1, 23, 'C'),

('q_wm23_024', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Calculate the volume of a cube with side 5 cm', 'multiple_choice',
'[{"id":"A","text":"125 cm³"},{"id":"B","text":"25 cm³"},{"id":"C","text":"75 cm³"},{"id":"D","text":"150 cm³"}]',
'125 cm³', 'V = s³ = 5³ = 125 cm³', 'easy', 1, 24, 'C'),

('q_wm23_025', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the perimeter of a square with area 64 cm²', 'multiple_choice',
'[{"id":"A","text":"32 cm"},{"id":"B","text":"16 cm"},{"id":"C","text":"64 cm"},{"id":"D","text":"8 cm"}]',
'32 cm', 'Side = √64 = 8 cm. Perimeter = 4 × 8 = 32 cm', 'easy', 1, 25, 'C'),

('q_wm23_026', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'A triangle has sides 5 cm, 12 cm, and 13 cm. Is it a right-angled triangle?', 'multiple_choice',
'[{"id":"A","text":"Yes"},{"id":"B","text":"No"},{"id":"C","text":"Cannot be determined"},{"id":"D","text":"Only if one angle is 90°"}]',
'Yes', '5² + 12² = 25 + 144 = 169 = 13². Satisfies Pythagoras theorem.', 'medium', 1, 26, 'C'),

('q_wm23_027', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the total surface area of a cuboid with dimensions 4 cm × 3 cm × 2 cm', 'multiple_choice',
'[{"id":"A","text":"52 cm²"},{"id":"B","text":"24 cm²"},{"id":"C","text":"26 cm²"},{"id":"D","text":"48 cm²"}]',
'52 cm²', 'TSA = 2(lb + bh + hl) = 2(12 + 6 + 8) = 52 cm²', 'medium', 1, 27, 'C'),

('q_wm23_028', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'The scale of a map is 1:50000. If the distance between two towns on the map is 4 cm, find the actual distance in km', 'multiple_choice',
'[{"id":"A","text":"2 km"},{"id":"B","text":"20 km"},{"id":"C","text":"200 km"},{"id":"D","text":"0.2 km"}]',
'2 km', 'Actual = 4 × 50000 = 200000 cm = 2 km', 'medium', 1, 28, 'C'),

('q_wm23_029', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the length of an arc of a circle with radius 14 cm if the angle is 90° (Take π = 22/7)', 'multiple_choice',
'[{"id":"A","text":"22 cm"},{"id":"B","text":"44 cm"},{"id":"C","text":"11 cm"},{"id":"D","text":"88 cm"}]',
'22 cm', 'Arc length = θ/360 × 2πr = 90/360 × 2 × 22/7 × 14 = 22 cm', 'medium', 1, 29, 'C'),

('q_wm23_030', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'A cylindrical tank has radius 7 m and height 10 m. Find its capacity in litres (Take π = 22/7)', 'multiple_choice',
'[{"id":"A","text":"1540000 litres"},{"id":"B","text":"154000 litres"},{"id":"C","text":"15400 litres"},{"id":"D","text":"1540 litres"}]',
'1540000 litres', 'V = πr²h = 22/7 × 49 × 10 = 1540 m³ = 1540000 litres', 'hard', 1, 30, 'C'),

('q_wm23_031', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the distance between points P(3, 4) and Q(6, 8)', 'multiple_choice',
'[{"id":"A","text":"5"},{"id":"B","text":"7"},{"id":"C","text":"25"},{"id":"D","text":"3"}]',
'5', 'd = √[(6-3)² + (8-4)²] = √(9+16) = √25 = 5', 'medium', 1, 31, 'C'),

('q_wm23_032', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the midpoint of the line segment joining A(2, 5) and B(8, 11)', 'multiple_choice',
'[{"id":"A","text":"(5, 8)"},{"id":"B","text":"(10, 16)"},{"id":"C","text":"(3, 3)"},{"id":"D","text":"(6, 6)"}]',
'(5, 8)', 'Midpoint = ((2+8)/2, (5+11)/2) = (5, 8)', 'easy', 1, 32, 'C'),

('q_wm23_033', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the equation of the line with gradient 2 passing through (1, 3)', 'multiple_choice',
'[{"id":"A","text":"y = 2x + 1"},{"id":"B","text":"y = 2x - 1"},{"id":"C","text":"y = 2x + 3"},{"id":"D","text":"y = x + 2"}]',
'y = 2x + 1', 'y - 3 = 2(x - 1), y = 2x - 2 + 3 = 2x + 1', 'medium', 1, 33, 'C'),

('q_wm23_034', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'A ship sails 12 km due North and then 5 km due East. Find the distance from the starting point', 'multiple_choice',
'[{"id":"A","text":"13 km"},{"id":"B","text":"17 km"},{"id":"C","text":"7 km"},{"id":"D","text":"60 km"}]',
'13 km', 'd = √(12² + 5²) = √(144 + 25) = √169 = 13 km', 'medium', 1, 34, 'C'),

('q_wm23_035', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'The bearing of Q from P is 135°. What is the bearing of P from Q?', 'multiple_choice',
'[{"id":"A","text":"315°"},{"id":"B","text":"225°"},{"id":"C","text":"45°"},{"id":"D","text":"270°"}]',
'315°', 'Back bearing = 135° + 180° = 315°', 'medium', 1, 35, 'C'),

('q_wm23_036', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the value of cos 60°', 'multiple_choice',
'[{"id":"A","text":"1/2"},{"id":"B","text":"√3/2"},{"id":"C","text":"1"},{"id":"D","text":"0"}]',
'1/2', 'cos 60° = 1/2 (standard value)', 'easy', 1, 36, 'D'),

('q_wm23_037', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'In a right triangle, if the adjacent side is 4 and hypotenuse is 5, find cos θ', 'multiple_choice',
'[{"id":"A","text":"4/5"},{"id":"B","text":"3/5"},{"id":"C","text":"5/4"},{"id":"D","text":"3/4"}]',
'4/5', 'cos θ = adjacent/hypotenuse = 4/5', 'easy', 1, 37, 'D'),

('q_wm23_038', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find sin 90°', 'multiple_choice',
'[{"id":"A","text":"1"},{"id":"B","text":"0"},{"id":"C","text":"∞"},{"id":"D","text":"-1"}]',
'1', 'sin 90° = 1 (standard value)', 'easy', 1, 38, 'D'),

('q_wm23_039', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'If tan θ = 3/4, find sin θ', 'multiple_choice',
'[{"id":"A","text":"3/5"},{"id":"B","text":"4/5"},{"id":"C","text":"3/4"},{"id":"D","text":"5/3"}]',
'3/5', 'If tan θ = 3/4, opposite = 3, adjacent = 4, hypotenuse = 5. sin θ = 3/5', 'medium', 1, 39, 'D'),

('q_wm23_040', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'A tree casts a shadow 20 m long when the angle of elevation of the sun is 45°. Find the height of the tree', 'multiple_choice',
'[{"id":"A","text":"20 m"},{"id":"B","text":"10 m"},{"id":"C","text":"40 m"},{"id":"D","text":"20√2 m"}]',
'20 m', 'tan 45° = h/20, h = 20 × 1 = 20 m', 'medium', 1, 40, 'D'),

('q_wm23_041', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the mean of: 12, 15, 18, 21, 24', 'multiple_choice',
'[{"id":"A","text":"18"},{"id":"B","text":"15"},{"id":"C","text":"21"},{"id":"D","text":"90"}]',
'18', 'Mean = (12+15+18+21+24)/5 = 90/5 = 18', 'easy', 1, 41, 'E'),

('q_wm23_042', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the median of: 8, 12, 5, 9, 6', 'multiple_choice',
'[{"id":"A","text":"8"},{"id":"B","text":"9"},{"id":"C","text":"6"},{"id":"D","text":"12"}]',
'8', 'Arranged: 5, 6, 8, 9, 12. Median = 8', 'easy', 1, 42, 'E'),

('q_wm23_043', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Find the mode of: 4, 5, 6, 5, 7, 5, 8, 4', 'multiple_choice',
'[{"id":"A","text":"5"},{"id":"B","text":"4"},{"id":"C","text":"6"},{"id":"D","text":"7"}]',
'5', '5 appears most frequently (3 times)', 'easy', 1, 43, 'E'),

('q_wm23_044', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'The range of a set of numbers is 12. If the largest number is 20, find the smallest', 'multiple_choice',
'[{"id":"A","text":"8"},{"id":"B","text":"32"},{"id":"C","text":"12"},{"id":"D","text":"6"}]',
'8', 'Range = Largest - Smallest, 12 = 20 - S, S = 8', 'easy', 1, 44, 'E'),

('q_wm23_045', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'A card is drawn from a standard deck of 52 cards. What is the probability that it is a King?', 'multiple_choice',
'[{"id":"A","text":"1/13"},{"id":"B","text":"1/4"},{"id":"C","text":"4/13"},{"id":"D","text":"1/52"}]',
'1/13', 'P(King) = 4/52 = 1/13', 'easy', 1, 45, 'E'),

('q_wm23_046', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'Two dice are thrown. What is the probability that the sum is 7?', 'multiple_choice',
'[{"id":"A","text":"1/6"},{"id":"B","text":"1/12"},{"id":"C","text":"7/36"},{"id":"D","text":"1/36"}]',
'1/6', 'Favorable: (1,6)(2,5)(3,4)(4,3)(5,2)(6,1) = 6. P = 6/36 = 1/6', 'medium', 1, 46, 'E'),

('q_wm23_047', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'A box contains 5 red, 3 blue, and 2 green balls. What is the probability of picking a red ball?', 'multiple_choice',
'[{"id":"A","text":"1/2"},{"id":"B","text":"1/3"},{"id":"C","text":"1/5"},{"id":"D","text":"2/5"}]',
'1/2', 'P(red) = 5/10 = 1/2', 'easy', 1, 47, 'E'),

('q_wm23_048', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'The standard deviation of a data set is 5. Find the variance.', 'multiple_choice',
'[{"id":"A","text":"25"},{"id":"B","text":"10"},{"id":"C","text":"√5"},{"id":"D","text":"2.5"}]',
'25', 'Variance = (Standard deviation)² = 5² = 25', 'easy', 1, 48, 'E'),

('q_wm23_049', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'In a class, 60% of students passed Mathematics and 70% passed English. If 50% passed both subjects, what percentage passed at least one subject?', 'multiple_choice',
'[{"id":"A","text":"80%"},{"id":"B","text":"130%"},{"id":"C","text":"100%"},{"id":"D","text":"90%"}]',
'80%', 'P(M ∪ E) = P(M) + P(E) - P(M ∩ E) = 60 + 70 - 50 = 80%', 'medium', 1, 49, 'E'),

('q_wm23_050', 'subj_wassce_core_math', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_math_2023_1',
'A fair coin is tossed twice. What is the probability of getting at least one head?', 'multiple_choice',
'[{"id":"A","text":"3/4"},{"id":"B","text":"1/2"},{"id":"C","text":"1/4"},{"id":"D","text":"1"}]',
'3/4', 'P(at least 1 head) = 1 - P(no heads) = 1 - 1/4 = 3/4', 'medium', 1, 50, 'E');
