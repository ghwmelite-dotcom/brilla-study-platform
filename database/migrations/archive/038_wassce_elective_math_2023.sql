-- Migration 038: WASSCE Elective Mathematics 2023 Questions (50 questions)
-- Covers: Algebra, Trigonometry, Calculus, Vectors, Matrices, Probability, Statistics

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES

-- Algebra (Questions 1-10)
('q_wassce_emath_2023_01', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the value of x if 3^(2x+1) = 27.', 'multiple_choice', '["0", "1", "2", "3"]', 'B', '27 = 3³, so 3^(2x+1) = 3³. Therefore 2x + 1 = 3, giving 2x = 2, so x = 1.', 'medium', 2, 90),

('q_wassce_emath_2023_02', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Simplify: (x² - 9)/(x + 3)', 'multiple_choice', '["x - 3", "x + 3", "x² - 3", "x - 9"]', 'A', 'x² - 9 = (x+3)(x-3) is a difference of squares. So (x² - 9)/(x + 3) = (x+3)(x-3)/(x+3) = x - 3.', 'easy', 2, 60),

('q_wassce_emath_2023_03', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'The roots of the equation x² - 5x + 6 = 0 are:', 'multiple_choice', '["2 and 3", "-2 and -3", "1 and 6", "-1 and -6"]', 'A', 'Factoring: x² - 5x + 6 = (x - 2)(x - 3) = 0. Therefore x = 2 or x = 3.', 'easy', 2, 60),

('q_wassce_emath_2023_04', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'If α and β are roots of x² - 7x + 12 = 0, find αβ.', 'multiple_choice', '["7", "12", "-7", "-12"]', 'B', 'For ax² + bx + c = 0, the product of roots αβ = c/a = 12/1 = 12.', 'medium', 2, 90),

('q_wassce_emath_2023_05', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Solve the inequality: 2x - 5 < 3x + 1', 'multiple_choice', '["x > -6", "x < -6", "x > 6", "x < 6"]', 'A', '2x - 5 < 3x + 1. Rearranging: -5 - 1 < 3x - 2x, so -6 < x, meaning x > -6.', 'easy', 2, 60),

('q_wassce_emath_2023_06', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Express in partial fractions: 5/(x(x+1))', 'multiple_choice', '["5/x - 5/(x+1)", "5/x + 5/(x+1)", "1/x - 1/(x+1)", "1/(x+1) - 1/x"]', 'A', '5/(x(x+1)) = A/x + B/(x+1). Solving: A = 5, B = -5. So it equals 5/x - 5/(x+1).', 'hard', 3, 120),

('q_wassce_emath_2023_07', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the remainder when 2x³ - 3x² + x - 4 is divided by (x - 2).', 'multiple_choice', '["-2", "0", "2", "6"]', 'C', 'By remainder theorem, substitute x = 2: 2(8) - 3(4) + 2 - 4 = 16 - 12 + 2 - 4 = 2.', 'medium', 2, 90),

('q_wassce_emath_2023_08', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'If log₂ 8 = x, find the value of x.', 'multiple_choice', '["2", "3", "4", "8"]', 'B', 'log₂ 8 = x means 2^x = 8. Since 8 = 2³, we have x = 3.', 'easy', 2, 60),

('q_wassce_emath_2023_09', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Solve: |2x - 3| = 5', 'multiple_choice', '["x = 4 or x = -1", "x = -4 or x = 1", "x = 4 only", "x = -1 only"]', 'A', '|2x - 3| = 5 gives 2x - 3 = 5 or 2x - 3 = -5. So 2x = 8 or 2x = -2, giving x = 4 or x = -1.', 'medium', 2, 90),

('q_wassce_emath_2023_10', 'topic_algebra', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'The first three terms of a GP are 2, 6, and 18. Find the 5th term.', 'multiple_choice', '["54", "108", "162", "324"]', 'C', 'Common ratio r = 6/2 = 3. The nth term = ar^(n-1). 5th term = 2 × 3⁴ = 2 × 81 = 162.', 'medium', 2, 90),

-- Trigonometry (Questions 11-20)
('q_wassce_emath_2023_11', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Convert 135° to radians.', 'multiple_choice', '["π/4", "π/2", "3π/4", "π"]', 'C', '135° × (π/180°) = 135π/180 = 3π/4 radians.', 'easy', 2, 60),

('q_wassce_emath_2023_12', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the value of sin 30° × cos 60°.', 'multiple_choice', '["0", "1/4", "1/2", "1"]', 'B', 'sin 30° = 1/2 and cos 60° = 1/2. Therefore sin 30° × cos 60° = (1/2) × (1/2) = 1/4.', 'easy', 2, 60),

('q_wassce_emath_2023_13', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'If tan θ = 3/4 and θ is acute, find cos θ.', 'multiple_choice', '["3/5", "4/5", "5/4", "5/3"]', 'B', 'If tan θ = 3/4, opposite = 3, adjacent = 4. Hypotenuse = √(9+16) = 5. So cos θ = 4/5.', 'medium', 2, 90),

('q_wassce_emath_2023_14', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Simplify: sin²θ + cos²θ', 'multiple_choice', '["0", "1", "2", "sin 2θ"]', 'B', 'This is the Pythagorean identity. sin²θ + cos²θ = 1 for all values of θ.', 'easy', 2, 60),

('q_wassce_emath_2023_15', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the general solution of sin x = 1/2.', 'multiple_choice', '["x = nπ + (-1)^n(π/6)", "x = 2nπ ± π/6", "x = nπ + π/6", "x = nπ/6"]', 'A', 'The general solution of sin x = sin α is x = nπ + (-1)^n α. Here α = π/6, so x = nπ + (-1)^n(π/6).', 'hard', 3, 120),

('q_wassce_emath_2023_16', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Express cos 2θ in terms of cos θ only.', 'multiple_choice', '["2cos²θ - 1", "1 - 2cos²θ", "cos²θ - 1", "2cos θ - 1"]', 'A', 'cos 2θ = cos²θ - sin²θ = cos²θ - (1 - cos²θ) = 2cos²θ - 1.', 'medium', 2, 90),

('q_wassce_emath_2023_17', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'In triangle ABC, if a = 7, b = 8, and C = 60°, find c using the cosine rule.', 'multiple_choice', '["√57", "√67", "√77", "√87"]', 'A', 'c² = a² + b² - 2ab cos C = 49 + 64 - 2(7)(8)cos 60° = 113 - 112(0.5) = 113 - 56 = 57. So c = √57.', 'medium', 2, 120),

('q_wassce_emath_2023_18', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'What is the period of the function y = sin 3x?', 'multiple_choice', '["π/3", "2π/3", "π", "2π"]', 'B', 'The period of sin bx is 2π/b. Here b = 3, so period = 2π/3.', 'medium', 2, 90),

('q_wassce_emath_2023_19', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the value of tan 45° + sin 90°.', 'multiple_choice', '["0", "1", "2", "3"]', 'C', 'tan 45° = 1 and sin 90° = 1. Therefore tan 45° + sin 90° = 1 + 1 = 2.', 'easy', 2, 60),

('q_wassce_emath_2023_20', 'topic_trigonometry', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'If sec θ = 2, find cos θ.', 'multiple_choice', '["2", "1/2", "-2", "-1/2"]', 'B', 'sec θ = 1/cos θ. If sec θ = 2, then cos θ = 1/2.', 'easy', 2, 60),

-- Calculus (Questions 21-30)
('q_wassce_emath_2023_21', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find dy/dx if y = x³ + 2x² - 5x + 3.', 'multiple_choice', '["3x² + 4x - 5", "3x² + 2x - 5", "x² + 4x - 5", "3x² + 4x + 5"]', 'A', 'Differentiating term by term: dy/dx = 3x² + 4x - 5.', 'easy', 2, 60),

('q_wassce_emath_2023_22', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the derivative of y = sin 2x.', 'multiple_choice', '["cos 2x", "2 cos 2x", "-sin 2x", "-2 sin 2x"]', 'B', 'Using chain rule: dy/dx = cos 2x × 2 = 2 cos 2x.', 'medium', 2, 90),

('q_wassce_emath_2023_23', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Evaluate: ∫ (3x² + 2x) dx', 'multiple_choice', '["x³ + x² + C", "6x + 2 + C", "x³ + x + C", "3x³ + x² + C"]', 'A', 'Integrating: ∫ 3x² dx + ∫ 2x dx = x³ + x² + C.', 'easy', 2, 60),

('q_wassce_emath_2023_24', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the gradient of the curve y = x² - 4x + 3 at x = 2.', 'multiple_choice', '["-2", "0", "2", "4"]', 'B', 'dy/dx = 2x - 4. At x = 2: dy/dx = 2(2) - 4 = 0.', 'medium', 2, 90),

('q_wassce_emath_2023_25', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Evaluate: ∫₀² x² dx', 'multiple_choice', '["4/3", "8/3", "4", "8"]', 'B', '∫₀² x² dx = [x³/3]₀² = 8/3 - 0 = 8/3.', 'medium', 2, 90),

('q_wassce_emath_2023_26', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the stationary point of y = x² - 6x + 8.', 'multiple_choice', '["(3, -1)", "(3, 1)", "(-3, 1)", "(-3, -1)"]', 'A', 'dy/dx = 2x - 6 = 0, so x = 3. When x = 3, y = 9 - 18 + 8 = -1. Stationary point is (3, -1).', 'medium', 2, 90),

('q_wassce_emath_2023_27', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'If y = e^(2x), find dy/dx.', 'multiple_choice', '["e^(2x)", "2e^(2x)", "e^x", "2e^x"]', 'B', 'Using chain rule: dy/dx = e^(2x) × 2 = 2e^(2x).', 'medium', 2, 90),

('q_wassce_emath_2023_28', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find dy/dx if y = ln(3x).', 'multiple_choice', '["1/x", "1/(3x)", "3/x", "3"]', 'A', 'y = ln(3x) = ln 3 + ln x. dy/dx = 0 + 1/x = 1/x. Or using chain rule: (1/3x) × 3 = 1/x.', 'medium', 2, 90),

('q_wassce_emath_2023_29', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'The second derivative of y = x⁴ - 3x² + 2 is:', 'multiple_choice', '["4x³ - 6x", "12x² - 6", "4x² - 3", "12x - 6"]', 'B', 'First derivative: dy/dx = 4x³ - 6x. Second derivative: d²y/dx² = 12x² - 6.', 'medium', 2, 90),

('q_wassce_emath_2023_30', 'topic_calculus', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Evaluate: ∫ cos x dx', 'multiple_choice', '["sin x + C", "-sin x + C", "cos x + C", "-cos x + C"]', 'A', 'The integral of cos x is sin x + C.', 'easy', 2, 60),

-- Vectors and Matrices (Questions 31-40)
('q_wassce_emath_2023_31', 'topic_vectors', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the magnitude of vector a = 3i + 4j.', 'multiple_choice', '["5", "7", "12", "25"]', 'A', '|a| = √(3² + 4²) = √(9 + 16) = √25 = 5.', 'easy', 2, 60),

('q_wassce_emath_2023_32', 'topic_vectors', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'If a = 2i + 3j and b = i - 2j, find a + b.', 'multiple_choice', '["3i + j", "3i + 5j", "i + j", "i + 5j"]', 'A', 'a + b = (2 + 1)i + (3 + (-2))j = 3i + j.', 'easy', 2, 60),

('q_wassce_emath_2023_33', 'topic_vectors', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the dot product of a = 2i + j and b = 3i - 4j.', 'multiple_choice', '["2", "10", "-2", "-10"]', 'A', 'a · b = (2)(3) + (1)(-4) = 6 - 4 = 2.', 'medium', 2, 90),

('q_wassce_emath_2023_34', 'topic_matrices', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the determinant of the matrix [[2, 3], [1, 4]].', 'multiple_choice', '["5", "8", "11", "14"]', 'A', 'det = (2)(4) - (3)(1) = 8 - 3 = 5.', 'easy', 2, 60),

('q_wassce_emath_2023_35', 'topic_matrices', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'If A = [[1, 2], [3, 4]], find 2A.', 'multiple_choice', '["[[2, 4], [6, 8]]", "[[3, 4], [5, 6]]", "[[1, 4], [3, 8]]", "[[2, 2], [6, 4]]"]', 'A', 'Multiply each element by 2: 2A = [[2, 4], [6, 8]].', 'easy', 2, 60),

('q_wassce_emath_2023_36', 'topic_matrices', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'For two vectors to be perpendicular, their dot product is:', 'multiple_choice', '["1", "0", "-1", "Undefined"]', 'B', 'Two vectors are perpendicular if and only if their dot product equals zero: a · b = |a||b|cos 90° = 0.', 'easy', 2, 60),

('q_wassce_emath_2023_37', 'topic_matrices', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the inverse of the matrix [[2, 1], [5, 3]].', 'multiple_choice', '["[[3, -1], [-5, 2]]", "[[-3, 1], [5, -2]]", "[[3, 1], [5, 2]]", "[[-3, -1], [-5, -2]]"]', 'A', 'For [[a,b],[c,d]], inverse = (1/det)[[d,-b],[-c,a]]. det = 6-5 = 1. Inverse = [[3,-1],[-5,2]].', 'hard', 3, 120),

('q_wassce_emath_2023_38', 'topic_vectors', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the position vector of the midpoint of A(2, 4) and B(6, 8).', 'multiple_choice', '["4i + 6j", "2i + 2j", "8i + 12j", "3i + 5j"]', 'A', 'Midpoint = ((2+6)/2, (4+8)/2) = (4, 6). Position vector = 4i + 6j.', 'easy', 2, 60),

('q_wassce_emath_2023_39', 'topic_matrices', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'A matrix that equals its transpose is called:', 'multiple_choice', '["Identity matrix", "Symmetric matrix", "Diagonal matrix", "Null matrix"]', 'B', 'A symmetric matrix is one where A = Aᵀ, meaning aᵢⱼ = aⱼᵢ for all i and j.', 'medium', 2, 90),

('q_wassce_emath_2023_40', 'topic_vectors', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the unit vector in the direction of a = 6i + 8j.', 'multiple_choice', '["0.6i + 0.8j", "3i + 4j", "6i + 8j", "i + j"]', 'A', '|a| = √(36+64) = 10. Unit vector = a/|a| = (6i + 8j)/10 = 0.6i + 0.8j.', 'medium', 2, 90),

-- Probability and Statistics (Questions 41-50)
('q_wassce_emath_2023_41', 'topic_probability', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'A fair die is thrown once. What is the probability of getting a number greater than 4?', 'multiple_choice', '["1/6", "1/3", "1/2", "2/3"]', 'B', 'Numbers greater than 4 are 5 and 6. Probability = 2/6 = 1/3.', 'easy', 2, 60),

('q_wassce_emath_2023_42', 'topic_probability', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Two fair coins are tossed. What is the probability of getting at least one head?', 'multiple_choice', '["1/4", "1/2", "3/4", "1"]', 'C', 'P(at least one head) = 1 - P(no heads) = 1 - 1/4 = 3/4. Or count: HH, HT, TH = 3 outcomes out of 4.', 'medium', 2, 90),

('q_wassce_emath_2023_43', 'topic_statistics', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the mean of the data: 4, 6, 8, 10, 12.', 'multiple_choice', '["6", "7", "8", "10"]', 'C', 'Mean = (4 + 6 + 8 + 10 + 12)/5 = 40/5 = 8.', 'easy', 2, 60),

('q_wassce_emath_2023_44', 'topic_statistics', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'The mode of the data set 2, 3, 4, 4, 5, 4, 6, 7 is:', 'multiple_choice', '["2", "3", "4", "5"]', 'C', 'The mode is the most frequent value. 4 appears 3 times, more than any other value.', 'easy', 2, 60),

('q_wassce_emath_2023_45', 'topic_statistics', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find the median of: 3, 7, 2, 9, 5, 8, 1.', 'multiple_choice', '["3", "5", "7", "9"]', 'B', 'Arranged: 1, 2, 3, 5, 7, 8, 9. Median is the middle value = 5.', 'easy', 2, 60),

('q_wassce_emath_2023_46', 'topic_probability', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'If P(A) = 0.6 and P(B) = 0.3, and A and B are independent, find P(A ∩ B).', 'multiple_choice', '["0.18", "0.3", "0.6", "0.9"]', 'A', 'For independent events: P(A ∩ B) = P(A) × P(B) = 0.6 × 0.3 = 0.18.', 'medium', 2, 90),

('q_wassce_emath_2023_47', 'topic_statistics', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'The variance of data is 16. What is the standard deviation?', 'multiple_choice', '["2", "4", "8", "256"]', 'B', 'Standard deviation = √variance = √16 = 4.', 'easy', 2, 60),

('q_wassce_emath_2023_48', 'topic_probability', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'In how many ways can 4 different books be arranged on a shelf?', 'multiple_choice', '["4", "12", "24", "256"]', 'C', 'Number of arrangements = 4! = 4 × 3 × 2 × 1 = 24.', 'easy', 2, 60),

('q_wassce_emath_2023_49', 'topic_probability', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'Find ⁵C₂ (5 choose 2).', 'multiple_choice', '["5", "10", "20", "25"]', 'B', '⁵C₂ = 5!/(2! × 3!) = (5 × 4)/(2 × 1) = 20/2 = 10.', 'medium', 2, 90),

('q_wassce_emath_2023_50', 'topic_probability', 'subj_elective_math', 'pp_wassce_emath_2023_1', 'A bag contains 5 red balls and 3 blue balls. If two balls are drawn at random without replacement, what is the probability that both are red?', 'multiple_choice', '["5/14", "25/64", "5/8", "10/28"]', 'A', 'P(both red) = (5/8) × (4/7) = 20/56 = 5/14Jean.', 'medium', 2, 90);

-- Update past paper total questions
UPDATE past_papers SET total_questions = 50 WHERE id = 'pp_wassce_emath_2023_1';
