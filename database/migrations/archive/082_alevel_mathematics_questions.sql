-- Migration: A-Level Mathematics Questions (Cambridge 9709)
-- Covers Pure Mathematics, Mechanics, and Statistics
-- 55 questions across all difficulty levels

-- =============================================
-- PURE MATHEMATICS 1 - Algebra & Functions
-- =============================================

INSERT OR IGNORE INTO questions (id, subject_id, topic_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, time_limit) VALUES

-- Quadratics and Polynomials
('q_alevel_math_001', 'subj_alevel_math', NULL, 'Solve the equation x² - 5x + 6 = 0', 'multiple_choice', '["A. x = 2 or x = 3", "B. x = -2 or x = -3", "C. x = 1 or x = 6", "D. x = -1 or x = -6"]', 'A', 'Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3', 'easy', 10, 2, 60),

('q_alevel_math_002', 'subj_alevel_math', NULL, 'Find the discriminant of 2x² + 3x - 5 = 0 and determine the nature of the roots.', 'short_answer', NULL, 'Discriminant = 49, two distinct real roots', 'b² - 4ac = 9 - 4(2)(-5) = 9 + 40 = 49 > 0, so two distinct real roots', 'easy', 10, 3, 90),

('q_alevel_math_003', 'subj_alevel_math', NULL, 'Express 2x² + 8x + 5 in the form a(x + b)² + c', 'calculation', NULL, '2(x + 2)² - 3', 'Complete the square: 2(x² + 4x) + 5 = 2(x² + 4x + 4 - 4) + 5 = 2(x + 2)² - 8 + 5 = 2(x + 2)² - 3', 'medium', 15, 4, 120),

('q_alevel_math_004', 'subj_alevel_math', NULL, 'The roots of 2x² - 7x + 3 = 0 are α and β. Find the value of α² + β².', 'calculation', NULL, '37/4 or 9.25', 'α + β = 7/2, αβ = 3/2. α² + β² = (α + β)² - 2αβ = 49/4 - 3 = 37/4', 'hard', 20, 5, 150),

('q_alevel_math_005', 'subj_alevel_math', NULL, 'Divide x³ + 2x² - 5x - 6 by (x + 1) and find the quotient.', 'calculation', NULL, 'x² + x - 6', 'Using polynomial division or synthetic division: x³ + 2x² - 5x - 6 = (x + 1)(x² + x - 6)', 'medium', 15, 4, 120),

-- Functions
('q_alevel_math_006', 'subj_alevel_math', NULL, 'If f(x) = 2x + 3 and g(x) = x², find fg(x).', 'multiple_choice', '["A. 2x² + 3", "B. (2x + 3)²", "C. 4x² + 12x + 9", "D. 2x² + 6x + 3"]', 'A', 'fg(x) = f(g(x)) = f(x²) = 2(x²) + 3 = 2x² + 3', 'easy', 10, 2, 60),

('q_alevel_math_007', 'subj_alevel_math', NULL, 'Find the inverse function of f(x) = (2x - 1)/(x + 3), x ≠ -3', 'calculation', NULL, 'f⁻¹(x) = (3x + 1)/(2 - x)', 'Let y = (2x-1)/(x+3). Then y(x+3) = 2x-1, yx + 3y = 2x - 1, yx - 2x = -1 - 3y, x(y-2) = -1-3y, x = (-1-3y)/(y-2) = (3y+1)/(2-y)', 'hard', 20, 5, 180),

('q_alevel_math_008', 'subj_alevel_math', NULL, 'The function f is defined by f(x) = |2x - 4|. Solve f(x) = 6.', 'multiple_choice', '["A. x = 5 or x = -1", "B. x = 5 or x = 1", "C. x = -5 or x = 1", "D. x = 5 only"]', 'A', '|2x - 4| = 6 means 2x - 4 = 6 or 2x - 4 = -6. So x = 5 or x = -1', 'medium', 15, 3, 90),

-- =============================================
-- PURE MATHEMATICS 1 - Coordinate Geometry
-- =============================================

('q_alevel_math_009', 'subj_alevel_math', NULL, 'Find the equation of the line passing through (2, 5) and (4, 11).', 'multiple_choice', '["A. y = 3x - 1", "B. y = 3x + 1", "C. y = 2x + 1", "D. y = 3x - 2"]', 'A', 'Gradient = (11-5)/(4-2) = 6/2 = 3. Using point-slope: y - 5 = 3(x - 2), y = 3x - 1', 'easy', 10, 3, 90),

('q_alevel_math_010', 'subj_alevel_math', NULL, 'Find the perpendicular distance from the point (3, 4) to the line 3x + 4y - 10 = 0.', 'calculation', NULL, '3 units', 'Distance = |3(3) + 4(4) - 10|/√(9+16) = |9 + 16 - 10|/5 = 15/5 = 3', 'medium', 15, 4, 120),

('q_alevel_math_011', 'subj_alevel_math', NULL, 'The circle has equation x² + y² - 6x + 4y - 12 = 0. Find its centre and radius.', 'calculation', NULL, 'Centre (3, -2), radius 5', 'Complete squares: (x-3)² - 9 + (y+2)² - 4 - 12 = 0, (x-3)² + (y+2)² = 25. Centre (3,-2), r = 5', 'medium', 15, 4, 120),

('q_alevel_math_012', 'subj_alevel_math', NULL, 'Find the equation of the tangent to the circle x² + y² = 25 at the point (3, 4).', 'calculation', NULL, '3x + 4y = 25', 'Gradient of radius = 4/3. Gradient of tangent = -3/4. Equation: y - 4 = -3/4(x - 3), 4y - 16 = -3x + 9, 3x + 4y = 25', 'hard', 20, 5, 150),

-- =============================================
-- PURE MATHEMATICS 1 - Trigonometry
-- =============================================

('q_alevel_math_013', 'subj_alevel_math', NULL, 'Convert 150° to radians.', 'multiple_choice', '["A. 5π/6", "B. 2π/3", "C. 3π/4", "D. π/3"]', 'A', '150° × π/180° = 150π/180 = 5π/6 radians', 'easy', 10, 2, 45),

('q_alevel_math_014', 'subj_alevel_math', NULL, 'Find the exact value of sin 75°.', 'multiple_choice', '["A. (√6 + √2)/4", "B. (√6 - √2)/4", "C. (√3 + 1)/2", "D. √3/2"]', 'A', 'sin 75° = sin(45° + 30°) = sin45°cos30° + cos45°sin30° = (√2/2)(√3/2) + (√2/2)(1/2) = (√6 + √2)/4', 'medium', 15, 3, 90),

('q_alevel_math_015', 'subj_alevel_math', NULL, 'Solve 2sin²x - sinx - 1 = 0 for 0° ≤ x ≤ 360°.', 'calculation', NULL, 'x = 90°, 210°, 330°', 'Let u = sinx: 2u² - u - 1 = 0, (2u+1)(u-1) = 0, u = -1/2 or u = 1. sinx = 1 gives x = 90°. sinx = -1/2 gives x = 210°, 330°', 'hard', 20, 5, 180),

('q_alevel_math_016', 'subj_alevel_math', NULL, 'Express 3sinθ + 4cosθ in the form Rsin(θ + α).', 'calculation', NULL, '5sin(θ + 53.13°) or 5sin(θ + arctan(4/3))', 'R = √(9+16) = 5, tanα = 4/3, α = 53.13°. So 3sinθ + 4cosθ = 5sin(θ + 53.13°)', 'hard', 20, 5, 150),

-- =============================================
-- PURE MATHEMATICS 1 - Calculus (Differentiation)
-- =============================================

('q_alevel_math_017', 'subj_alevel_math', NULL, 'Differentiate y = 3x⁴ - 2x³ + 5x - 7', 'multiple_choice', '["A. 12x³ - 6x² + 5", "B. 12x³ - 6x² + 5x", "C. 12x⁴ - 6x³ + 5", "D. 3x³ - 2x² + 5"]', 'A', 'dy/dx = 12x³ - 6x² + 5', 'easy', 10, 2, 60),

('q_alevel_math_018', 'subj_alevel_math', NULL, 'Find dy/dx if y = (2x + 1)⁵', 'multiple_choice', '["A. 5(2x + 1)⁴", "B. 10(2x + 1)⁴", "C. 10(2x + 1)⁵", "D. 2(2x + 1)⁴"]', 'B', 'Using chain rule: dy/dx = 5(2x + 1)⁴ × 2 = 10(2x + 1)⁴', 'medium', 15, 3, 90),

('q_alevel_math_019', 'subj_alevel_math', NULL, 'Find the gradient of the curve y = x³ - 3x² + 2 at x = 2.', 'calculation', NULL, '0', 'dy/dx = 3x² - 6x. At x = 2: 3(4) - 6(2) = 12 - 12 = 0', 'easy', 10, 3, 90),

('q_alevel_math_020', 'subj_alevel_math', NULL, 'Find the stationary points of y = x³ - 6x² + 9x + 2 and determine their nature.', 'calculation', NULL, 'Maximum at (1, 6), minimum at (3, 2)', 'dy/dx = 3x² - 12x + 9 = 3(x-1)(x-3) = 0, x = 1 or 3. d²y/dx² = 6x - 12. At x=1: -6 < 0 (max). At x=3: 6 > 0 (min).', 'hard', 20, 6, 180),

('q_alevel_math_021', 'subj_alevel_math', NULL, 'Differentiate y = sin(3x²)', 'multiple_choice', '["A. cos(3x²)", "B. 6x cos(3x²)", "C. 3x² cos(3x²)", "D. 6 cos(3x²)"]', 'B', 'Using chain rule: dy/dx = cos(3x²) × 6x = 6x cos(3x²)', 'medium', 15, 3, 90),

-- =============================================
-- PURE MATHEMATICS 1 - Calculus (Integration)
-- =============================================

('q_alevel_math_022', 'subj_alevel_math', NULL, 'Find ∫(4x³ - 3x² + 2) dx', 'multiple_choice', '["A. x⁴ - x³ + 2x + c", "B. 12x² - 6x + c", "C. x⁴ - x³ + 2x", "D. 4x⁴ - 3x³ + 2x + c"]', 'A', '∫(4x³ - 3x² + 2) dx = x⁴ - x³ + 2x + c', 'easy', 10, 2, 60),

('q_alevel_math_023', 'subj_alevel_math', NULL, 'Evaluate ∫₀² (3x² + 2x) dx', 'calculation', NULL, '12', '∫(3x² + 2x) dx = x³ + x². [x³ + x²]₀² = (8 + 4) - 0 = 12', 'easy', 10, 3, 90),

('q_alevel_math_024', 'subj_alevel_math', NULL, 'Find ∫ sin(2x) dx', 'multiple_choice', '["A. 2cos(2x) + c", "B. -2cos(2x) + c", "C. -½cos(2x) + c", "D. ½cos(2x) + c"]', 'C', '∫ sin(2x) dx = -½cos(2x) + c', 'medium', 15, 3, 90),

('q_alevel_math_025', 'subj_alevel_math', NULL, 'Find the area enclosed between y = x² and y = 4.', 'calculation', NULL, '32/3 square units', 'Intersection: x² = 4, x = ±2. Area = ∫₋₂² (4 - x²) dx = [4x - x³/3]₋₂² = (8 - 8/3) - (-8 + 8/3) = 32/3', 'hard', 20, 5, 150),

('q_alevel_math_026', 'subj_alevel_math', NULL, 'Find ∫ xe^x dx using integration by parts.', 'calculation', NULL, 'xe^x - e^x + c or e^x(x - 1) + c', 'Let u = x, dv = e^x dx. Then du = dx, v = e^x. ∫xe^x dx = xe^x - ∫e^x dx = xe^x - e^x + c', 'hard', 20, 5, 150),

-- =============================================
-- PURE MATHEMATICS 3 - Further Algebra
-- =============================================

('q_alevel_math_027', 'subj_alevel_math', NULL, 'Express (3x + 5)/((x-1)(x+2)) in partial fractions.', 'calculation', NULL, '8/(3(x-1)) + 1/(3(x+2)) or equivalent', 'Let (3x+5)/((x-1)(x+2)) = A/(x-1) + B/(x+2). 3x+5 = A(x+2) + B(x-1). x=1: 8 = 3A, A = 8/3. x=-2: -1 = -3B, B = 1/3', 'medium', 15, 4, 120),

('q_alevel_math_028', 'subj_alevel_math', NULL, 'Find the first three terms of the binomial expansion of (1 + 2x)^(1/2).', 'calculation', NULL, '1 + x - x²/2', '(1+2x)^(1/2) = 1 + (1/2)(2x) + (1/2)(-1/2)/2!(2x)² + ... = 1 + x - x²/2 + ...', 'hard', 20, 5, 150),

('q_alevel_math_029', 'subj_alevel_math', NULL, 'Simplify ln(e³) + ln(e²).', 'multiple_choice', '["A. 5", "B. 6", "C. e⁵", "D. ln(5)"]', 'A', 'ln(e³) + ln(e²) = 3 + 2 = 5', 'easy', 10, 2, 45),

('q_alevel_math_030', 'subj_alevel_math', NULL, 'Solve the equation 3^(2x-1) = 27.', 'multiple_choice', '["A. x = 1", "B. x = 2", "C. x = 3", "D. x = 4"]', 'B', '3^(2x-1) = 3³, so 2x - 1 = 3, 2x = 4, x = 2', 'easy', 10, 2, 60),

-- =============================================
-- PURE MATHEMATICS 3 - Differential Equations
-- =============================================

('q_alevel_math_031', 'subj_alevel_math', NULL, 'Solve the differential equation dy/dx = 2xy, given y = 1 when x = 0.', 'calculation', NULL, 'y = e^(x²)', '∫dy/y = ∫2x dx, ln|y| = x² + c. When x=0, y=1: ln(1) = 0 + c, c = 0. So ln y = x², y = e^(x²)', 'hard', 20, 6, 180),

('q_alevel_math_032', 'subj_alevel_math', NULL, 'Find the general solution of dy/dx = y/x.', 'multiple_choice', '["A. y = cx", "B. y = x + c", "C. y = ce^x", "D. y = x²/2 + c"]', 'A', '∫dy/y = ∫dx/x, ln|y| = ln|x| + ln|c|, y = cx', 'medium', 15, 4, 120),

-- =============================================
-- PURE MATHEMATICS 3 - Vectors
-- =============================================

('q_alevel_math_033', 'subj_alevel_math', NULL, 'Find the magnitude of the vector a = 3i - 4j + 12k.', 'multiple_choice', '["A. 11", "B. 13", "C. 19", "D. √169"]', 'B', '|a| = √(9 + 16 + 144) = √169 = 13', 'easy', 10, 2, 60),

('q_alevel_math_034', 'subj_alevel_math', NULL, 'Find the scalar product of a = 2i + 3j - k and b = i - 2j + 4k.', 'calculation', NULL, '-8', 'a · b = (2)(1) + (3)(-2) + (-1)(4) = 2 - 6 - 4 = -8', 'easy', 10, 3, 90),

('q_alevel_math_035', 'subj_alevel_math', NULL, 'Find the angle between vectors a = i + j and b = i - j + k.', 'calculation', NULL, '60° or π/3 radians', 'a · b = 1 - 1 + 0 = 0... Actually: a · b = 1(1) + 1(-1) + 0(1) = 0. |a| = √2, |b| = √3. cosθ = 0/(√2×√3) = 0, θ = 90°', 'medium', 15, 4, 120),

('q_alevel_math_036', 'subj_alevel_math', NULL, 'The position vectors of A and B are 2i + 3j - k and 5i + j + 2k. Find the vector AB.', 'multiple_choice', '["A. 3i - 2j + 3k", "B. 7i + 4j + k", "C. -3i + 2j - 3k", "D. 3i + 2j - 3k"]', 'A', 'AB = OB - OA = (5-2)i + (1-3)j + (2-(-1))k = 3i - 2j + 3k', 'easy', 10, 2, 60),

-- =============================================
-- MECHANICS - Kinematics
-- =============================================

('q_alevel_math_037', 'subj_alevel_math', NULL, 'A particle moves with velocity v = 3t² - 2t m/s. Find its acceleration when t = 2s.', 'calculation', NULL, '10 m/s²', 'a = dv/dt = 6t - 2. At t = 2: a = 12 - 2 = 10 m/s²', 'easy', 10, 3, 90),

('q_alevel_math_038', 'subj_alevel_math', NULL, 'A ball is thrown vertically upward with velocity 20 m/s. Find the maximum height reached. (g = 10 m/s²)', 'calculation', NULL, '20 m', 'At max height, v = 0. v² = u² - 2gs, 0 = 400 - 20s, s = 20 m', 'easy', 10, 3, 90),

('q_alevel_math_039', 'subj_alevel_math', NULL, 'A car starts from rest and accelerates uniformly at 2 m/s² for 10 seconds, then travels at constant velocity. Find the total distance covered in 25 seconds.', 'calculation', NULL, '400 m', 'Phase 1: s₁ = ½at² = ½(2)(100) = 100 m, v = at = 20 m/s. Phase 2: s₂ = vt = 20 × 15 = 300 m. Total = 400 m', 'medium', 15, 4, 120),

('q_alevel_math_040', 'subj_alevel_math', NULL, 'A particle has displacement s = t³ - 6t² + 9t metres. Find when the particle is at rest.', 'calculation', NULL, 't = 1s and t = 3s', 'v = ds/dt = 3t² - 12t + 9 = 3(t² - 4t + 3) = 3(t-1)(t-3) = 0. At rest when t = 1 or t = 3', 'medium', 15, 4, 120),

-- =============================================
-- MECHANICS - Forces and Newton''s Laws
-- =============================================

('q_alevel_math_041', 'subj_alevel_math', NULL, 'A 5 kg mass is accelerated at 3 m/s² along a rough horizontal surface. If friction is 10 N, find the applied force.', 'calculation', NULL, '25 N', 'F - friction = ma, F - 10 = 5 × 3 = 15, F = 25 N', 'easy', 10, 3, 90),

('q_alevel_math_042', 'subj_alevel_math', NULL, 'A lift of mass 800 kg accelerates upward at 2 m/s². Find the tension in the cable. (g = 10 m/s²)', 'calculation', NULL, '9600 N', 'T - mg = ma, T = m(g + a) = 800(10 + 2) = 9600 N', 'medium', 15, 4, 120),

('q_alevel_math_043', 'subj_alevel_math', NULL, 'Two particles of mass 3 kg and 5 kg are connected by a light string over a smooth pulley. Find the acceleration of the system. (g = 10 m/s²)', 'calculation', NULL, '2.5 m/s²', 'For 5kg: 50 - T = 5a. For 3kg: T - 30 = 3a. Adding: 20 = 8a, a = 2.5 m/s²', 'hard', 20, 5, 150),

('q_alevel_math_044', 'subj_alevel_math', NULL, 'A 2 kg block rests on a plane inclined at 30° to the horizontal. The coefficient of friction is 0.3. Find the friction force.', 'calculation', NULL, '10 N or mg sin30° = 10 N', 'Component down plane = mg sin30° = 2 × 10 × 0.5 = 10 N. Max friction = μR = 0.3 × 2 × 10 × cos30° = 5.2 N. Since 10 > 5.2, friction = 5.2 N (block slides)', 'hard', 20, 5, 150),

-- =============================================
-- STATISTICS - Probability
-- =============================================

('q_alevel_math_045', 'subj_alevel_math', NULL, 'A fair die is rolled twice. Find the probability of getting a sum of 7.', 'multiple_choice', '["A. 1/6", "B. 1/12", "C. 5/36", "D. 7/36"]', 'A', 'Favorable outcomes: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 outcomes. Total = 36. P = 6/36 = 1/6', 'easy', 10, 2, 60),

('q_alevel_math_046', 'subj_alevel_math', NULL, 'In a class, 60% are boys. 30% of boys and 40% of girls wear glasses. Find the probability that a randomly chosen student wears glasses.', 'calculation', NULL, '0.34 or 34%', 'P(glasses) = P(boy)P(glasses|boy) + P(girl)P(glasses|girl) = 0.6 × 0.3 + 0.4 × 0.4 = 0.18 + 0.16 = 0.34', 'medium', 15, 4, 120),

('q_alevel_math_047', 'subj_alevel_math', NULL, 'Events A and B are independent with P(A) = 0.4 and P(B) = 0.5. Find P(A ∪ B).', 'multiple_choice', '["A. 0.9", "B. 0.7", "C. 0.2", "D. 0.3"]', 'B', 'P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.4 + 0.5 - 0.4 × 0.5 = 0.9 - 0.2 = 0.7', 'medium', 15, 3, 90),

('q_alevel_math_048', 'subj_alevel_math', NULL, 'A bag contains 4 red and 6 blue balls. Two balls are drawn without replacement. Find the probability that both are red.', 'calculation', NULL, '2/15', 'P = (4/10) × (3/9) = 12/90 = 2/15', 'easy', 10, 3, 90),

-- =============================================
-- STATISTICS - Distributions
-- =============================================

('q_alevel_math_049', 'subj_alevel_math', NULL, 'X ~ B(10, 0.3). Find E(X) and Var(X).', 'calculation', NULL, 'E(X) = 3, Var(X) = 2.1', 'For binomial: E(X) = np = 10 × 0.3 = 3. Var(X) = np(1-p) = 10 × 0.3 × 0.7 = 2.1', 'easy', 10, 3, 90),

('q_alevel_math_050', 'subj_alevel_math', NULL, 'X ~ N(50, 16). Find P(X < 54).', 'multiple_choice', '["A. 0.8413", "B. 0.6915", "C. 0.9772", "D. 0.5"]', 'A', 'Z = (54-50)/4 = 1. P(Z < 1) = 0.8413', 'medium', 15, 3, 90),

('q_alevel_math_051', 'subj_alevel_math', NULL, 'The heights of students are normally distributed with mean 165 cm and standard deviation 8 cm. Find the probability that a student is taller than 173 cm.', 'calculation', NULL, '0.1587 or 15.87%', 'Z = (173-165)/8 = 1. P(X > 173) = P(Z > 1) = 1 - 0.8413 = 0.1587', 'medium', 15, 4, 120),

('q_alevel_math_052', 'subj_alevel_math', NULL, 'If X ~ Po(4), find P(X = 3).', 'calculation', NULL, '0.1954', 'P(X = 3) = e⁻⁴ × 4³/3! = e⁻⁴ × 64/6 = 0.0183 × 10.67 ≈ 0.1954', 'hard', 20, 4, 120),

-- =============================================
-- ADDITIONAL PURE MATHEMATICS
-- =============================================

('q_alevel_math_053', 'subj_alevel_math', NULL, 'Find the general solution of the equation cos 2x = 0.5 for 0 ≤ x ≤ 2π.', 'calculation', NULL, 'x = π/6, 5π/6, 7π/6, 11π/6', '2x = π/3, 5π/3, 7π/3, 11π/3. So x = π/6, 5π/6, 7π/6, 11π/6', 'hard', 20, 5, 150),

('q_alevel_math_054', 'subj_alevel_math', NULL, 'Prove that d/dx(tan x) = sec²x.', 'short_answer', NULL, 'Using quotient rule on sinx/cosx gives (cos²x + sin²x)/cos²x = 1/cos²x = sec²x', 'tanx = sinx/cosx. d/dx = (cosx·cosx - sinx·(-sinx))/cos²x = (cos²x + sin²x)/cos²x = 1/cos²x = sec²x', 'medium', 15, 4, 120),

('q_alevel_math_055', 'subj_alevel_math', NULL, 'Find ∫ 1/(x² + 4) dx.', 'multiple_choice', '["A. ½arctan(x/2) + c", "B. arctan(x/2) + c", "C. ½ln(x² + 4) + c", "D. arctan(2x) + c"]', 'A', '∫ 1/(x² + 4) dx = ∫ 1/(4((x/2)² + 1)) dx = ¼ · 2arctan(x/2) + c = ½arctan(x/2) + c', 'hard', 20, 4, 120);
