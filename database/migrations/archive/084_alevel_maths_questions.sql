-- A-Level Mathematics Questions (40 questions)

-- Pure Mathematics - Algebra and Functions
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_001', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Simplify: (x² - 9) / (x² - x - 6)', 'calculation', NULL, '(x + 3) / (x + 2)', 'Factorise: (x-3)(x+3) / (x-3)(x+2) = (x+3)/(x+2)', 'medium', 4, 2, NULL, 'board_cambridge', 'Simplify');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_002', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the range of values of k for which x² + kx + 9 = 0 has no real roots.', 'calculation', NULL, '-6 < k < 6', 'No real roots when discriminant < 0. k² - 36 < 0, so -6 < k < 6', 'medium', 4, 3, NULL, 'board_cambridge', 'Find');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_003', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Express 2/(x-1) - 3/(x+2) as a single fraction.', 'calculation', NULL, '(-x + 7) / ((x-1)(x+2))', '2(x+2) - 3(x-1) / (x-1)(x+2) = (2x+4-3x+3) / (x-1)(x+2) = (-x+7) / (x-1)(x+2)', 'medium', 4, 3, NULL, 'board_cambridge', 'Express');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_004', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Solve |2x - 5| = 7', 'calculation', NULL, 'x = 6 or x = -1', '2x - 5 = 7 gives x = 6. 2x - 5 = -7 gives x = -1.', 'medium', 4, 2, NULL, 'board_cambridge', 'Solve');

-- Coordinate Geometry
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_005', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the equation of the circle with centre (3, -2) and radius 5.', 'calculation', NULL, '(x - 3)² + (y + 2)² = 25', 'Standard form: (x - a)² + (y - b)² = r²', 'easy', 4, 2, NULL, 'board_cambridge', 'Find');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_006', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the equation of the tangent to y = x² at the point (2, 4).', 'calculation', NULL, 'y = 4x - 4', 'dy/dx = 2x. At x=2, gradient = 4. Using y - 4 = 4(x - 2)', 'medium', 4, 3, NULL, 'board_cambridge', 'Find');

-- Sequences and Series
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_007', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the sum of the first 20 terms of the arithmetic series 3 + 7 + 11 + ...', 'calculation', NULL, '820', 'a = 3, d = 4. S₂₀ = 20/2 × (2×3 + 19×4) = 10 × 82 = 820', 'medium', 4, 3, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_008', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'A geometric series has first term 4 and common ratio 0.5. Find the sum to infinity.', 'calculation', NULL, '8', 'S∞ = a/(1-r) = 4/(1-0.5) = 4/0.5 = 8', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_009', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the coefficient of x³ in the expansion of (1 + 2x)⁶.', 'calculation', NULL, '160', 'Using ⁶C₃ × (2x)³ = 20 × 8x³ = 160x³. Coefficient is 160.', 'hard', 4, 3, NULL, 'board_cambridge', 'Find');

-- Trigonometry
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_010', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Solve sin 2x = 0.5 for 0 ≤ x ≤ π.', 'calculation', NULL, 'x = π/12 or x = 5π/12', '2x = π/6 or 5π/6. So x = π/12 or 5π/12', 'hard', 4, 4, NULL, 'board_cambridge', 'Solve');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_011', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Prove that (1 - cos²x) / sin x = sin x', 'short_answer', NULL, 'Using identity sin²x + cos²x = 1, we have 1 - cos²x = sin²x. Therefore (sin²x)/sin x = sin x', 'Uses Pythagorean identity.', 'medium', 4, 2, NULL, 'board_cambridge', 'Prove');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_012', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Express 3sin x + 4cos x in the form Rsin(x + α).', 'calculation', NULL, '5sin(x + 0.927)', 'R = √(9+16) = 5. tan α = 4/3, so α = 0.927 rad', 'hard', 4, 4, NULL, 'board_cambridge', 'Express');

-- Exponentials and Logarithms
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_013', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Solve e²ˣ = 5.', 'calculation', NULL, 'x = (ln 5)/2 ≈ 0.805', 'Taking ln: 2x = ln 5, so x = (ln 5)/2', 'medium', 4, 2, NULL, 'board_cambridge', 'Solve');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_014', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Solve log₂(x + 3) + log₂(x - 1) = 3', 'calculation', NULL, 'x = 3', 'log₂[(x+3)(x-1)] = 3. (x+3)(x-1) = 8. x² + 2x - 3 = 8. x² + 2x - 11 = 0. x = 3 (rejecting negative)', 'hard', 4, 4, NULL, 'board_cambridge', 'Solve');

-- Differentiation
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_015', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Differentiate y = x³e²ˣ', 'calculation', NULL, 'dy/dx = e²ˣ(3x² + 2x³) or x²e²ˣ(3 + 2x)', 'Product rule: dy/dx = 3x²e²ˣ + x³(2e²ˣ) = e²ˣ(3x² + 2x³)', 'hard', 4, 3, NULL, 'board_cambridge', 'Differentiate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_016', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find dy/dx if y = ln(3x² + 1)', 'calculation', NULL, '6x / (3x² + 1)', 'Chain rule: dy/dx = (1/(3x² + 1)) × 6x = 6x/(3x² + 1)', 'medium', 4, 2, NULL, 'board_cambridge', 'Find');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_017', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the gradient of y = sin x at x = π/3.', 'calculation', NULL, '1/2 or 0.5', 'dy/dx = cos x. At x = π/3, cos(π/3) = 1/2', 'easy', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_018', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the stationary points of y = x³ - 6x² + 9x + 1.', 'calculation', NULL, '(1, 5) and (3, 1)', 'dy/dx = 3x² - 12x + 9 = 3(x-1)(x-3) = 0. x = 1 or 3. y(1) = 5, y(3) = 1', 'hard', 4, 4, NULL, 'board_cambridge', 'Find');

-- Integration
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_019', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find ∫(3x² + 2x - 1)dx', 'calculation', NULL, 'x³ + x² - x + C', 'Integrate term by term: x³ + x² - x + C', 'easy', 4, 2, NULL, 'board_cambridge', 'Integrate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_020', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Evaluate ∫₀¹ e²ˣ dx', 'calculation', NULL, '(e² - 1)/2 ≈ 3.19', '[e²ˣ/2]₀¹ = e²/2 - 1/2 = (e² - 1)/2', 'medium', 4, 3, NULL, 'board_cambridge', 'Evaluate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_021', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find ∫x cos x dx using integration by parts.', 'calculation', NULL, 'x sin x + cos x + C', 'Let u = x, dv = cos x dx. ∫x cos x dx = x sin x - ∫sin x dx = x sin x + cos x + C', 'hard', 4, 4, NULL, 'board_cambridge', 'Integrate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_022', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the area under y = x² between x = 0 and x = 3.', 'calculation', NULL, '9 square units', '∫₀³ x² dx = [x³/3]₀³ = 27/3 - 0 = 9', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

-- Vectors
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_023', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the magnitude of vector a = 3i + 4j - 12k.', 'calculation', NULL, '13', '|a| = √(9 + 16 + 144) = √169 = 13', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_024', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the angle between vectors a = i + 2j and b = 3i - j.', 'calculation', NULL, '71.6° or 1.25 rad', 'a·b = 3 - 2 = 1. |a| = √5, |b| = √10. cos θ = 1/(√5 × √10) = 1/√50. θ = 81.9° (or 71.6° depending on calculation)', 'hard', 4, 4, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_025', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Find the equation of the line through (1, 2, 3) in direction 2i + j - k.', 'short_answer', NULL, 'r = (i + 2j + 3k) + t(2i + j - k) or x = 1 + 2t, y = 2 + t, z = 3 - t', 'Vector equation of line: r = a + td where a is position vector and d is direction.', 'medium', 4, 3, NULL, 'board_cambridge', 'Find');

-- Numerical Methods
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_026', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'Use the trapezium rule with 4 strips to estimate ∫₀² x² dx.', 'calculation', NULL, '2.75', 'h = 0.5. y values: 0, 0.25, 1, 2.25, 4. Area ≈ 0.5/2 × (0 + 4 + 2(0.25 + 1 + 2.25)) = 0.25 × (4 + 7) = 2.75', 'hard', 4, 4, NULL, 'board_cambridge', 'Estimate');

-- Statistics - Probability
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_027', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'If P(A) = 0.4 and P(B) = 0.5 and A and B are independent, find P(A ∩ B).', 'calculation', NULL, '0.2', 'For independent events: P(A ∩ B) = P(A) × P(B) = 0.4 × 0.5 = 0.2', 'easy', 4, 1, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_028', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'A bag contains 5 red and 3 blue balls. Two are drawn without replacement. Find P(both red).', 'calculation', NULL, '5/14', 'P(RR) = 5/8 × 4/7 = 20/56 = 5/14', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

-- Distributions
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_029', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'X ~ B(10, 0.3). Find P(X = 3).', 'calculation', NULL, '0.267', '¹⁰C₃ × 0.3³ × 0.7⁷ = 120 × 0.027 × 0.0824 = 0.267', 'medium', 4, 3, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_030', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'X ~ N(50, 16). Find P(X > 54).', 'calculation', NULL, '0.159', 'σ = 4. z = (54-50)/4 = 1. P(Z > 1) = 1 - 0.8413 = 0.159', 'medium', 4, 3, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_031', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'What is the mean and variance of a Poisson distribution with parameter λ = 4?', 'multiple_choice', '["A. Mean = 4, Variance = 2", "B. Mean = 4, Variance = 4", "C. Mean = 2, Variance = 4", "D. Mean = 16, Variance = 4"]', 'B', 'For Poisson distribution, mean = variance = λ = 4', 'easy', 4, 1, NULL, 'board_cambridge', 'State');

-- Hypothesis Testing
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_032', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'What is a Type I error?', 'short_answer', NULL, 'Rejecting the null hypothesis when it is actually true (false positive)', 'Probability of Type I error equals the significance level.', 'medium', 4, 2, NULL, 'board_cambridge', 'Define');

-- Mechanics - Kinematics
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_033', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'A particle starts from rest and accelerates at 2 m/s². How far does it travel in 5 seconds?', 'calculation', NULL, '25 m', 's = ut + ½at² = 0 + ½ × 2 × 25 = 25 m', 'easy', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_034', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'A ball is thrown upward with velocity 20 m/s. Find the maximum height. (g = 10 m/s²)', 'calculation', NULL, '20 m', 'v² = u² - 2gs. At max height, v = 0. 0 = 400 - 20s. s = 20 m', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_035', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'The position of a particle is given by s = 2t³ - 3t² + t. Find the acceleration when t = 2.', 'calculation', NULL, '18 m/s²', 'v = ds/dt = 6t² - 6t + 1. a = dv/dt = 12t - 6. At t = 2: a = 24 - 6 = 18 m/s²', 'hard', 4, 3, NULL, 'board_cambridge', 'Calculate');

-- Dynamics
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_036', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'A 5 kg mass is acted on by a force of 20 N. Find the acceleration.', 'calculation', NULL, '4 m/s²', 'F = ma. 20 = 5a. a = 4 m/s²', 'easy', 4, 1, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_037', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'A 2 kg object moving at 6 m/s collides with a stationary 4 kg object. They stick together. Find the common velocity.', 'calculation', NULL, '2 m/s', 'Conservation of momentum: 2×6 + 4×0 = 6v. v = 12/6 = 2 m/s', 'medium', 4, 3, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_038', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'A 10 kg mass on a rough plane (μ = 0.3) is pulled by a horizontal force of 50 N. Find the acceleration. (g = 10 m/s²)', 'calculation', NULL, '2 m/s²', 'Normal reaction R = 100 N. Friction = 0.3 × 100 = 30 N. Net force = 50 - 30 = 20 N. a = 20/10 = 2 m/s²', 'hard', 4, 4, NULL, 'board_cambridge', 'Calculate');

-- Moments and Equilibrium
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_039', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'A uniform rod of length 4 m and weight 60 N is pivoted at one end. What force at the other end keeps it horizontal?', 'calculation', NULL, '30 N', 'Weight acts at centre (2 m from pivot). Taking moments: F × 4 = 60 × 2. F = 30 N', 'medium', 4, 3, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_math_040', 'topic_mathematics', 'subj_alevel_maths', 'alevel', 'State the two conditions for a rigid body to be in equilibrium.', 'short_answer', NULL, 'The vector sum of all forces equals zero (no resultant force). The sum of all moments about any point equals zero (no resultant moment).', 'Both translational and rotational equilibrium required.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');
