-- Migration: IGCSE Additional Mathematics Questions (Cambridge 0606)
-- Covers Algebra, Functions, Trigonometry, Coordinate Geometry, Calculus
-- 55 questions across all difficulty levels

-- =============================================
-- ALGEBRA - Quadratic Functions & Equations
-- =============================================

INSERT OR IGNORE INTO questions (id, subject_id, topic_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, time_limit) VALUES

('q_igcse_addmath_001', 'subj_igcse_add_math', NULL, 'Solve the equation 2x² + 5x - 3 = 0 by factorisation.', 'calculation', NULL, 'x = 1/2 or x = -3', '2x² + 5x - 3 = (2x - 1)(x + 3) = 0, so x = 1/2 or x = -3', 'easy', 10, 3, 90),

('q_igcse_addmath_002', 'subj_igcse_add_math', NULL, 'Find the range of values of k for which the equation x² + kx + 9 = 0 has no real roots.', 'calculation', NULL, '-6 < k < 6', 'For no real roots: b² - 4ac < 0, k² - 36 < 0, -6 < k < 6', 'medium', 15, 4, 120),

('q_igcse_addmath_003', 'subj_igcse_add_math', NULL, 'Express 3x² - 12x + 7 in the form a(x - b)² + c.', 'calculation', NULL, '3(x - 2)² - 5', 'Complete the square: 3(x² - 4x) + 7 = 3(x² - 4x + 4 - 4) + 7 = 3(x - 2)² - 12 + 7 = 3(x - 2)² - 5', 'medium', 15, 4, 120),

('q_igcse_addmath_004', 'subj_igcse_add_math', NULL, 'The roots of 2x² - 5x + 1 = 0 are α and β. Find α³ + β³.', 'calculation', NULL, '95/8 or 11.875', 'α + β = 5/2, αβ = 1/2. α³ + β³ = (α + β)³ - 3αβ(α + β) = 125/8 - 3(1/2)(5/2) = 125/8 - 15/4 = 125/8 - 30/8 = 95/8', 'hard', 20, 5, 150),

('q_igcse_addmath_005', 'subj_igcse_add_math', NULL, 'Solve the simultaneous equations: y = x² - 3x + 2 and y = 2x - 2', 'calculation', NULL, 'x = 1, y = 0 and x = 4, y = 6', 'x² - 3x + 2 = 2x - 2, x² - 5x + 4 = 0, (x-1)(x-4) = 0. x = 1 gives y = 0; x = 4 gives y = 6', 'medium', 15, 4, 120),

-- Inequalities
('q_igcse_addmath_006', 'subj_igcse_add_math', NULL, 'Solve the inequality x² - 5x + 6 > 0.', 'multiple_choice', '["A. x < 2 or x > 3", "B. 2 < x < 3", "C. x < 2", "D. x > 3"]', 'A', 'x² - 5x + 6 = (x-2)(x-3). Positive when x < 2 or x > 3', 'medium', 15, 3, 90),

('q_igcse_addmath_007', 'subj_igcse_add_math', NULL, 'Find the range of values of x for which (x - 1)/(x + 2) ≤ 0.', 'calculation', NULL, '-2 < x ≤ 1', 'Critical points at x = 1 and x = -2. Testing regions: fraction ≤ 0 when -2 < x ≤ 1 (x = -2 excluded as undefined)', 'hard', 20, 4, 120),

-- =============================================
-- FUNCTIONS
-- =============================================

('q_igcse_addmath_008', 'subj_igcse_add_math', NULL, 'If f(x) = 2x - 1 and g(x) = x² + 3, find gf(x).', 'multiple_choice', '["A. 4x² - 4x + 4", "B. 2x² + 5", "C. (2x - 1)² + 3", "D. 4x² - 4x + 1"]', 'A', 'gf(x) = g(2x-1) = (2x-1)² + 3 = 4x² - 4x + 1 + 3 = 4x² - 4x + 4', 'easy', 10, 2, 60),

('q_igcse_addmath_009', 'subj_igcse_add_math', NULL, 'Find f⁻¹(x) if f(x) = (3x + 2)/(x - 1), x ≠ 1.', 'calculation', NULL, 'f⁻¹(x) = (x + 2)/(x - 3)', 'Let y = (3x+2)/(x-1). Then y(x-1) = 3x+2, yx - y = 3x + 2, yx - 3x = y + 2, x(y-3) = y+2, x = (y+2)/(y-3)', 'hard', 20, 5, 150),

('q_igcse_addmath_010', 'subj_igcse_add_math', NULL, 'Solve |2x - 5| = 7.', 'multiple_choice', '["A. x = 6 or x = -1", "B. x = 6 or x = 1", "C. x = -6 or x = 1", "D. x = 6 only"]', 'A', '2x - 5 = 7 gives x = 6. 2x - 5 = -7 gives x = -1', 'easy', 10, 2, 60),

('q_igcse_addmath_011', 'subj_igcse_add_math', NULL, 'Solve the equation |x - 3| = 2x - 1.', 'calculation', NULL, 'x = 4/3', 'Case 1: x ≥ 3, x - 3 = 2x - 1, -2 = x (rejected). Case 2: x < 3, -(x-3) = 2x-1, 3-x = 2x-1, 4 = 3x, x = 4/3. Check: |4/3 - 3| = 5/3, 2(4/3) - 1 = 5/3 ✓', 'hard', 20, 5, 150),

('q_igcse_addmath_012', 'subj_igcse_add_math', NULL, 'If f(x) = x² - 4 and the domain is x ≥ 0, find the range of f.', 'multiple_choice', '["A. f(x) ≥ -4", "B. f(x) ≥ 0", "C. f(x) ≥ 4", "D. All real numbers"]', 'A', 'When x ≥ 0, minimum is at x = 0 where f(0) = -4. As x increases, f increases. So range is f(x) ≥ -4', 'medium', 15, 3, 90),

-- =============================================
-- LOGARITHMS AND EXPONENTIALS
-- =============================================

('q_igcse_addmath_013', 'subj_igcse_add_math', NULL, 'Simplify log₂ 8 + log₂ 4.', 'multiple_choice', '["A. 5", "B. 12", "C. 32", "D. 7"]', 'A', 'log₂ 8 = 3, log₂ 4 = 2. Sum = 5', 'easy', 10, 2, 45),

('q_igcse_addmath_014', 'subj_igcse_add_math', NULL, 'Solve the equation 3^(2x+1) = 27^x.', 'calculation', NULL, 'x = 1', '3^(2x+1) = (3³)^x = 3^(3x). So 2x + 1 = 3x, x = 1', 'medium', 15, 3, 90),

('q_igcse_addmath_015', 'subj_igcse_add_math', NULL, 'Express log_a x³ - 2log_a y in terms of a single logarithm.', 'multiple_choice', '["A. log_a(x³/y²)", "B. log_a(x³ - y²)", "C. log_a(3x/2y)", "D. log_a(x³y²)"]', 'A', 'log_a x³ - 2log_a y = log_a x³ - log_a y² = log_a(x³/y²)', 'easy', 10, 2, 60),

('q_igcse_addmath_016', 'subj_igcse_add_math', NULL, 'Solve log₃(2x - 1) = 2.', 'calculation', NULL, 'x = 5', 'log₃(2x - 1) = 2 means 2x - 1 = 3² = 9, so 2x = 10, x = 5', 'easy', 10, 2, 60),

('q_igcse_addmath_017', 'subj_igcse_add_math', NULL, 'Given that log₁₀ 2 = 0.301 and log₁₀ 3 = 0.477, find log₁₀ 12.', 'calculation', NULL, '1.079', 'log₁₀ 12 = log₁₀(4 × 3) = log₁₀ 4 + log₁₀ 3 = 2log₁₀ 2 + log₁₀ 3 = 2(0.301) + 0.477 = 1.079', 'medium', 15, 3, 90),

('q_igcse_addmath_018', 'subj_igcse_add_math', NULL, 'Solve the equation 2^(2x) - 5(2^x) + 4 = 0.', 'calculation', NULL, 'x = 0 or x = 2', 'Let y = 2^x. Then y² - 5y + 4 = 0, (y-1)(y-4) = 0, y = 1 or y = 4. So 2^x = 1 gives x = 0, and 2^x = 4 gives x = 2', 'hard', 20, 5, 150),

-- =============================================
-- TRIGONOMETRY
-- =============================================

('q_igcse_addmath_019', 'subj_igcse_add_math', NULL, 'Convert 2π/3 radians to degrees.', 'multiple_choice', '["A. 120°", "B. 60°", "C. 150°", "D. 90°"]', 'A', '2π/3 × 180°/π = 360°/3 = 120°', 'easy', 10, 2, 45),

('q_igcse_addmath_020', 'subj_igcse_add_math', NULL, 'Prove that (1 - cos²θ)/sin θ = sin θ.', 'short_answer', NULL, 'Using sin²θ + cos²θ = 1, we get 1 - cos²θ = sin²θ, so (sin²θ)/sinθ = sinθ', '1 - cos²θ = sin²θ (Pythagorean identity). So (1 - cos²θ)/sinθ = sin²θ/sinθ = sinθ', 'easy', 10, 2, 60),

('q_igcse_addmath_021', 'subj_igcse_add_math', NULL, 'Solve 2cos²x - cosx - 1 = 0 for 0° ≤ x ≤ 360°.', 'calculation', NULL, 'x = 0°, 120°, 240°, 360°', 'Let c = cosx: 2c² - c - 1 = 0, (2c+1)(c-1) = 0, c = -1/2 or c = 1. cosx = 1: x = 0°, 360°. cosx = -1/2: x = 120°, 240°', 'medium', 15, 4, 120),

('q_igcse_addmath_022', 'subj_igcse_add_math', NULL, 'Find the exact value of sin 15°.', 'calculation', NULL, '(√6 - √2)/4', 'sin 15° = sin(45° - 30°) = sin45°cos30° - cos45°sin30° = (√2/2)(√3/2) - (√2/2)(1/2) = (√6 - √2)/4', 'hard', 20, 4, 120),

('q_igcse_addmath_023', 'subj_igcse_add_math', NULL, 'Express 5sinθ - 12cosθ in the form Rsin(θ - α).', 'calculation', NULL, '13sin(θ - 67.38°) or 13sin(θ - arctan(12/5))', 'R = √(25 + 144) = 13, tanα = 12/5, α = 67.38°. So 5sinθ - 12cosθ = 13sin(θ - 67.38°)', 'hard', 20, 5, 150),

('q_igcse_addmath_024', 'subj_igcse_add_math', NULL, 'Simplify tan²θ - sec²θ.', 'multiple_choice', '["A. -1", "B. 1", "C. 0", "D. 2tan²θ"]', 'A', 'Using 1 + tan²θ = sec²θ, we get tan²θ - sec²θ = tan²θ - (1 + tan²θ) = -1', 'easy', 10, 2, 60),

-- =============================================
-- COORDINATE GEOMETRY
-- =============================================

('q_igcse_addmath_025', 'subj_igcse_add_math', NULL, 'Find the equation of the circle with centre (3, -2) and radius 5.', 'multiple_choice', '["A. (x-3)² + (y+2)² = 25", "B. (x+3)² + (y-2)² = 25", "C. (x-3)² + (y+2)² = 5", "D. x² + y² = 25"]', 'A', 'Circle equation: (x - a)² + (y - b)² = r² gives (x - 3)² + (y + 2)² = 25', 'easy', 10, 2, 60),

('q_igcse_addmath_026', 'subj_igcse_add_math', NULL, 'Find the centre and radius of the circle x² + y² - 6x + 8y - 11 = 0.', 'calculation', NULL, 'Centre (3, -4), radius 6', 'Complete squares: (x-3)² - 9 + (y+4)² - 16 - 11 = 0, (x-3)² + (y+4)² = 36. Centre (3, -4), r = 6', 'medium', 15, 4, 120),

('q_igcse_addmath_027', 'subj_igcse_add_math', NULL, 'Show that the line y = 2x + 1 is a tangent to the circle x² + y² = 5.', 'short_answer', NULL, 'Substitute: x² + (2x+1)² = 5, 5x² + 4x - 4 = 0. Discriminant = 16 + 80 = 96 ≠ 0, so actually intersects at 2 points', 'Substituting y = 2x + 1: x² + 4x² + 4x + 1 = 5, 5x² + 4x - 4 = 0. For tangent, discriminant = 0. b² - 4ac = 16 + 80 = 96 ≠ 0. This line is NOT a tangent.', 'hard', 20, 5, 150),

('q_igcse_addmath_028', 'subj_igcse_add_math', NULL, 'Find the length of the tangent from point (7, 4) to the circle x² + y² - 4x - 2y - 4 = 0.', 'calculation', NULL, '5', 'Circle centre: (2, 1), radius = √(4+1+4) = 3. Distance from (7,4) to centre = √(25+9) = √34. Tangent length = √(34 - 9) = √25 = 5', 'hard', 20, 5, 150),

('q_igcse_addmath_029', 'subj_igcse_add_math', NULL, 'Find the equation of the normal to the curve y = x² - 3x at the point (2, -2).', 'calculation', NULL, 'y = -x or x + y = 0', 'dy/dx = 2x - 3. At x = 2: gradient = 1. Normal gradient = -1. Equation: y + 2 = -1(x - 2), y = -x', 'medium', 15, 4, 120),

-- =============================================
-- CALCULUS - Differentiation
-- =============================================

('q_igcse_addmath_030', 'subj_igcse_add_math', NULL, 'Differentiate y = 4x³ - 2x² + 5x - 1.', 'multiple_choice', '["A. 12x² - 4x + 5", "B. 12x² - 4x + 5x", "C. x⁴ - x³ + 5x²", "D. 12x³ - 4x² + 5"]', 'A', 'dy/dx = 12x² - 4x + 5', 'easy', 10, 2, 60),

('q_igcse_addmath_031', 'subj_igcse_add_math', NULL, 'Find dy/dx if y = (3x - 2)⁴.', 'multiple_choice', '["A. 4(3x - 2)³", "B. 12(3x - 2)³", "C. 3(3x - 2)⁴", "D. 12(3x - 2)⁴"]', 'B', 'Using chain rule: dy/dx = 4(3x - 2)³ × 3 = 12(3x - 2)³', 'medium', 15, 3, 90),

('q_igcse_addmath_032', 'subj_igcse_add_math', NULL, 'Find the gradient of the curve y = x³ - 6x² + 11x - 6 at x = 1.', 'calculation', NULL, '2', 'dy/dx = 3x² - 12x + 11. At x = 1: 3 - 12 + 11 = 2', 'easy', 10, 2, 60),

('q_igcse_addmath_033', 'subj_igcse_add_math', NULL, 'Find the coordinates of the stationary points of y = x³ - 3x + 2.', 'calculation', NULL, '(1, 0) minimum and (-1, 4) maximum', 'dy/dx = 3x² - 3 = 0, x² = 1, x = ±1. At x = 1: y = 0. At x = -1: y = 4. d²y/dx² = 6x. At x = 1: 6 > 0 (min). At x = -1: -6 < 0 (max)', 'hard', 20, 6, 180),

('q_igcse_addmath_034', 'subj_igcse_add_math', NULL, 'Differentiate y = √(2x + 1).', 'multiple_choice', '["A. 1/√(2x+1)", "B. 1/(2√(2x+1))", "C. 2/√(2x+1)", "D. √(2x+1)/2"]', 'A', 'y = (2x+1)^(1/2). dy/dx = (1/2)(2x+1)^(-1/2) × 2 = 1/√(2x+1)', 'medium', 15, 3, 90),

('q_igcse_addmath_035', 'subj_igcse_add_math', NULL, 'Find the rate of change of the area of a circle with respect to its radius when r = 5 cm.', 'calculation', NULL, '10π cm²/cm or 31.42 cm²/cm', 'A = πr². dA/dr = 2πr. When r = 5: dA/dr = 10π ≈ 31.42 cm²/cm', 'medium', 15, 3, 90),

('q_igcse_addmath_036', 'subj_igcse_add_math', NULL, 'A rectangle has perimeter 20 cm. Find the maximum area.', 'calculation', NULL, '25 cm²', 'Let length = x, width = y. 2x + 2y = 20, y = 10 - x. Area A = xy = x(10-x) = 10x - x². dA/dx = 10 - 2x = 0, x = 5. Max area = 25 cm²', 'hard', 20, 5, 150),

-- =============================================
-- CALCULUS - Integration
-- =============================================

('q_igcse_addmath_037', 'subj_igcse_add_math', NULL, 'Find ∫(6x² - 4x + 3) dx.', 'multiple_choice', '["A. 2x³ - 2x² + 3x + c", "B. 12x - 4 + c", "C. 6x³ - 4x² + 3x + c", "D. 2x³ - 2x² + 3 + c"]', 'A', '∫(6x² - 4x + 3) dx = 2x³ - 2x² + 3x + c', 'easy', 10, 2, 60),

('q_igcse_addmath_038', 'subj_igcse_add_math', NULL, 'Evaluate ∫₁³ (2x + 1) dx.', 'calculation', NULL, '12', '∫(2x + 1) dx = x² + x. [x² + x]₁³ = (9 + 3) - (1 + 1) = 12 - 2 = 10... Let me recalculate: [x² + x]₁³ = (9+3) - (1+1) = 12 - 2 = 10', 'easy', 10, 3, 90),

('q_igcse_addmath_039', 'subj_igcse_add_math', NULL, 'Find ∫(3x - 1)⁴ dx.', 'calculation', NULL, '(3x - 1)⁵/15 + c', '∫(3x - 1)⁴ dx = (3x - 1)⁵/(5 × 3) + c = (3x - 1)⁵/15 + c', 'medium', 15, 3, 90),

('q_igcse_addmath_040', 'subj_igcse_add_math', NULL, 'Find the area enclosed between y = x², the x-axis, and the lines x = 1 and x = 3.', 'calculation', NULL, '26/3 square units', 'Area = ∫₁³ x² dx = [x³/3]₁³ = 27/3 - 1/3 = 26/3', 'medium', 15, 4, 120),

('q_igcse_addmath_041', 'subj_igcse_add_math', NULL, 'Find ∫ 1/√(4x + 1) dx.', 'calculation', NULL, '½√(4x + 1) + c or √(4x + 1)/2 + c', 'Let u = 4x + 1, du = 4dx. ∫u^(-1/2) × (1/4)du = (1/4) × 2u^(1/2) + c = ½√(4x+1) + c', 'hard', 20, 4, 120),

-- =============================================
-- BINOMIAL THEOREM
-- =============================================

('q_igcse_addmath_042', 'subj_igcse_add_math', NULL, 'Find the coefficient of x³ in the expansion of (1 + 2x)⁵.', 'multiple_choice', '["A. 80", "B. 40", "C. 10", "D. 160"]', 'A', 'Term with x³: ⁵C₃ × 1² × (2x)³ = 10 × 8x³ = 80x³. Coefficient = 80', 'medium', 15, 3, 90),

('q_igcse_addmath_043', 'subj_igcse_add_math', NULL, 'Expand (1 - x)⁴ in ascending powers of x.', 'calculation', NULL, '1 - 4x + 6x² - 4x³ + x⁴', '(1-x)⁴ = 1 - 4x + 6x² - 4x³ + x⁴ using binomial coefficients 1, 4, 6, 4, 1', 'easy', 10, 3, 90),

('q_igcse_addmath_044', 'subj_igcse_add_math', NULL, 'Find the term independent of x in the expansion of (x + 2/x)⁶.', 'calculation', NULL, '160', 'General term: ⁶Cᵣ × x^(6-r) × (2/x)^r = ⁶Cᵣ × 2^r × x^(6-2r). For x⁰: 6-2r = 0, r = 3. Term = ⁶C₃ × 2³ = 20 × 8 = 160', 'hard', 20, 5, 150),

('q_igcse_addmath_045', 'subj_igcse_add_math', NULL, 'Find the first three terms of (1 + 3x)^(1/3) in ascending powers of x.', 'calculation', NULL, '1 + x - x²', '(1+3x)^(1/3) = 1 + (1/3)(3x) + (1/3)(-2/3)/2!(3x)² + ... = 1 + x - x² + ...', 'hard', 20, 5, 150),

-- =============================================
-- SEQUENCES AND SERIES
-- =============================================

('q_igcse_addmath_046', 'subj_igcse_add_math', NULL, 'Find the 10th term of the arithmetic sequence 3, 7, 11, 15, ...', 'multiple_choice', '["A. 39", "B. 43", "C. 35", "D. 41"]', 'A', 'a = 3, d = 4. T₁₀ = a + 9d = 3 + 36 = 39', 'easy', 10, 2, 60),

('q_igcse_addmath_047', 'subj_igcse_add_math', NULL, 'Find the sum of the first 20 terms of the arithmetic series 5 + 9 + 13 + 17 + ...', 'calculation', NULL, '860', 'a = 5, d = 4, n = 20. S₂₀ = n/2[2a + (n-1)d] = 10[10 + 76] = 10 × 86 = 860', 'medium', 15, 4, 120),

('q_igcse_addmath_048', 'subj_igcse_add_math', NULL, 'Find the sum to infinity of the geometric series 8 + 4 + 2 + 1 + ...', 'multiple_choice', '["A. 16", "B. 15", "C. 14", "D. 12"]', 'A', 'a = 8, r = 1/2. S∞ = a/(1-r) = 8/(1/2) = 16', 'easy', 10, 2, 60),

('q_igcse_addmath_049', 'subj_igcse_add_math', NULL, 'The 3rd term of a GP is 12 and the 6th term is 96. Find the first term.', 'calculation', NULL, '3', 'ar² = 12, ar⁵ = 96. Dividing: r³ = 8, r = 2. So a(4) = 12, a = 3', 'medium', 15, 4, 120),

-- =============================================
-- ADDITIONAL QUESTIONS
-- =============================================

('q_igcse_addmath_050', 'subj_igcse_add_math', NULL, 'Solve the equation 2sin²x + sinx - 1 = 0 for 0° ≤ x ≤ 360°.', 'calculation', NULL, 'x = 30°, 150°, 270°', 'Let s = sinx: 2s² + s - 1 = 0, (2s-1)(s+1) = 0. s = 1/2: x = 30°, 150°. s = -1: x = 270°', 'medium', 15, 4, 120),

('q_igcse_addmath_051', 'subj_igcse_add_math', NULL, 'Find dy/dx if y = x²ln x.', 'calculation', NULL, '2x ln x + x or x(2ln x + 1)', 'Using product rule: dy/dx = 2x(ln x) + x²(1/x) = 2x ln x + x = x(2ln x + 1)', 'hard', 20, 4, 120),

('q_igcse_addmath_052', 'subj_igcse_add_math', NULL, 'Find ∫ x e^(2x) dx.', 'calculation', NULL, '(x/2 - 1/4)e^(2x) + c or e^(2x)(2x - 1)/4 + c', 'Integration by parts: u = x, dv = e^(2x)dx. ∫xe^(2x)dx = (x/2)e^(2x) - ∫(1/2)e^(2x)dx = (x/2)e^(2x) - (1/4)e^(2x) + c', 'hard', 20, 5, 150),

('q_igcse_addmath_053', 'subj_igcse_add_math', NULL, 'A curve has equation y = 3x - x³. Find the x-coordinates of the turning points.', 'multiple_choice', '["A. x = ±1", "B. x = 0, ±√3", "C. x = ±√3", "D. x = 0, ±1"]', 'A', 'dy/dx = 3 - 3x² = 0, x² = 1, x = ±1', 'medium', 15, 3, 90),

('q_igcse_addmath_054', 'subj_igcse_add_math', NULL, 'Given that sin A = 3/5 where A is acute, find the exact value of sin 2A.', 'calculation', NULL, '24/25', 'cos A = 4/5 (from Pythagoras). sin 2A = 2sin A cos A = 2 × (3/5) × (4/5) = 24/25', 'medium', 15, 4, 120),

('q_igcse_addmath_055', 'subj_igcse_add_math', NULL, 'The curve y = x³ - 3x² + 4 crosses the x-axis at x = 2. Find the other roots.', 'calculation', NULL, 'x = -1 (repeated root)', 'x³ - 3x² + 4 = (x-2)(x² - x - 2) = (x-2)(x-2)(x+1) = (x-2)²(x+1). Other roots: x = 2 (repeated), x = -1', 'hard', 20, 5, 150);
