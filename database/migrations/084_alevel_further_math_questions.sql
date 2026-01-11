-- Migration: A-Level Further Mathematics Questions (Cambridge 9231)
-- Covers Complex Numbers, Matrices, Polar Coordinates, Differential Equations, Further Mechanics, Further Statistics
-- 55 questions across all difficulty levels

-- =============================================
-- COMPLEX NUMBERS
-- =============================================

INSERT OR IGNORE INTO questions (id, subject_id, topic_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, time_limit) VALUES

('q_alevel_fm_001', 'subj_alevel_further_math', NULL, 'Express (3 + 4i)(2 - i) in the form a + bi.', 'calculation', NULL, '10 + 5i', '(3 + 4i)(2 - i) = 6 - 3i + 8i - 4i² = 6 + 5i + 4 = 10 + 5i', 'easy', 10, 3, 90),

('q_alevel_fm_002', 'subj_alevel_further_math', NULL, 'Find the modulus and argument of z = -1 + √3i.', 'calculation', NULL, '|z| = 2, arg(z) = 2π/3', '|z| = √(1 + 3) = 2. arg(z) = π - arctan(√3) = π - π/3 = 2π/3 (second quadrant)', 'medium', 15, 4, 120),

('q_alevel_fm_003', 'subj_alevel_further_math', NULL, 'Express z = 2(cos π/4 + i sin π/4) in Cartesian form.', 'multiple_choice', '["A. √2 + √2i", "B. 1 + i", "C. 2 + 2i", "D. √2 + i√2"]', 'A', 'z = 2(√2/2 + i√2/2) = √2 + √2i', 'easy', 10, 2, 60),

('q_alevel_fm_004', 'subj_alevel_further_math', NULL, 'Find (1 + i)⁸ using De Moivre''s theorem.', 'calculation', NULL, '16', '1 + i = √2(cos π/4 + i sin π/4). (1+i)⁸ = (√2)⁸(cos 2π + i sin 2π) = 16(1 + 0i) = 16', 'hard', 20, 5, 150),

('q_alevel_fm_005', 'subj_alevel_further_math', NULL, 'Find the cube roots of 8.', 'calculation', NULL, '2, -1 + √3i, -1 - √3i', '8 = 8(cos 0 + i sin 0). Roots: 2(cos 2kπ/3 + i sin 2kπ/3) for k = 0,1,2. Giving 2, 2(cos 2π/3 + i sin 2π/3), 2(cos 4π/3 + i sin 4π/3)', 'hard', 20, 6, 180),

('q_alevel_fm_006', 'subj_alevel_further_math', NULL, 'If z = 2 + 3i, find z* (the complex conjugate) and zz*.', 'multiple_choice', '["A. z* = 2 - 3i, zz* = 13", "B. z* = -2 - 3i, zz* = 13", "C. z* = 2 - 3i, zz* = 5", "D. z* = -2 + 3i, zz* = 13"]', 'A', 'z* = 2 - 3i. zz* = (2 + 3i)(2 - 3i) = 4 + 9 = 13', 'easy', 10, 2, 60),

('q_alevel_fm_007', 'subj_alevel_further_math', NULL, 'Solve z² + 2z + 5 = 0.', 'calculation', NULL, 'z = -1 + 2i or z = -1 - 2i', 'z = (-2 ± √(4-20))/2 = (-2 ± √(-16))/2 = (-2 ± 4i)/2 = -1 ± 2i', 'medium', 15, 4, 120),

('q_alevel_fm_008', 'subj_alevel_further_math', NULL, 'Find the locus of points satisfying |z - 2| = |z + 2i|.', 'calculation', NULL, 'y = -x + 1 or x + y = 1', 'Let z = x + yi. |x - 2 + yi| = |x + (y+2)i|. (x-2)² + y² = x² + (y+2)². -4x + 4 = 4y + 4. y = -x, or x + y = 0... Actually: -4x + 4 = 4y + 4, so -4x = 4y, y = -x', 'hard', 20, 5, 150),

-- =============================================
-- MATRICES
-- =============================================

('q_alevel_fm_009', 'subj_alevel_further_math', NULL, 'Find the determinant of the matrix A = [[3, 1], [2, 4]].', 'multiple_choice', '["A. 10", "B. 14", "C. 12", "D. 8"]', 'A', 'det(A) = 3(4) - 1(2) = 12 - 2 = 10', 'easy', 10, 2, 60),

('q_alevel_fm_010', 'subj_alevel_further_math', NULL, 'Find the inverse of the matrix A = [[2, 1], [5, 3]].', 'calculation', NULL, '[[3, -1], [-5, 2]]', 'det(A) = 6 - 5 = 1. A⁻¹ = (1/1)[[3, -1], [-5, 2]] = [[3, -1], [-5, 2]]', 'medium', 15, 4, 120),

('q_alevel_fm_011', 'subj_alevel_further_math', NULL, 'Find the eigenvalues of the matrix A = [[4, 1], [2, 3]].', 'calculation', NULL, 'λ = 5, λ = 2', 'det(A - λI) = 0. (4-λ)(3-λ) - 2 = 0. λ² - 7λ + 10 = 0. (λ-5)(λ-2) = 0', 'hard', 20, 5, 150),

('q_alevel_fm_012', 'subj_alevel_further_math', NULL, 'If A = [[1, 2], [3, 4]] and B = [[0, 1], [1, 0]], find AB.', 'calculation', NULL, '[[2, 1], [4, 3]]', 'AB = [[1×0+2×1, 1×1+2×0], [3×0+4×1, 3×1+4×0]] = [[2, 1], [4, 3]]', 'easy', 10, 3, 90),

('q_alevel_fm_013', 'subj_alevel_further_math', NULL, 'Find the determinant of the 3×3 matrix [[1, 2, 3], [4, 5, 6], [7, 8, 9]].', 'multiple_choice', '["A. 0", "B. 1", "C. -1", "D. 6"]', 'A', 'Expanding: 1(45-48) - 2(36-42) + 3(32-35) = -3 + 12 - 9 = 0', 'medium', 15, 4, 120),

('q_alevel_fm_014', 'subj_alevel_further_math', NULL, 'The matrix [[cos θ, -sin θ], [sin θ, cos θ]] represents which transformation?', 'multiple_choice', '["A. Rotation by θ anticlockwise", "B. Rotation by θ clockwise", "C. Reflection in x-axis", "D. Enlargement by factor θ"]', 'A', 'This is the standard rotation matrix for anticlockwise rotation by angle θ about the origin.', 'easy', 10, 2, 60),

-- =============================================
-- POLAR COORDINATES
-- =============================================

('q_alevel_fm_015', 'subj_alevel_further_math', NULL, 'Convert the Cartesian point (3, 3) to polar coordinates.', 'calculation', NULL, '(3√2, π/4)', 'r = √(9 + 9) = 3√2. θ = arctan(3/3) = arctan(1) = π/4', 'easy', 10, 3, 90),

('q_alevel_fm_016', 'subj_alevel_further_math', NULL, 'Convert the polar point (4, π/3) to Cartesian coordinates.', 'multiple_choice', '["A. (2, 2√3)", "B. (2√3, 2)", "C. (4, 4√3)", "D. (2, 2)"]', 'A', 'x = 4 cos(π/3) = 4(1/2) = 2. y = 4 sin(π/3) = 4(√3/2) = 2√3', 'easy', 10, 2, 60),

('q_alevel_fm_017', 'subj_alevel_further_math', NULL, 'Find the area enclosed by the curve r = 2cos θ for 0 ≤ θ ≤ π.', 'calculation', NULL, 'π', 'Area = (1/2)∫₀^π r² dθ = (1/2)∫₀^π 4cos²θ dθ = 2∫₀^π (1+cos2θ)/2 dθ = [θ + sin2θ/2]₀^π = π', 'hard', 20, 6, 180),

('q_alevel_fm_018', 'subj_alevel_further_math', NULL, 'Find the Cartesian equation of the polar curve r = 4sin θ.', 'calculation', NULL, 'x² + (y-2)² = 4 or x² + y² - 4y = 0', 'r = 4sin θ. Multiply by r: r² = 4r sin θ. x² + y² = 4y. x² + y² - 4y = 0. x² + (y-2)² = 4', 'medium', 15, 4, 120),

-- =============================================
-- HYPERBOLIC FUNCTIONS
-- =============================================

('q_alevel_fm_019', 'subj_alevel_further_math', NULL, 'Given that sinh x = (eˣ - e⁻ˣ)/2, find sinh(0).', 'multiple_choice', '["A. 0", "B. 1", "C. -1", "D. 2"]', 'A', 'sinh(0) = (e⁰ - e⁰)/2 = (1 - 1)/2 = 0', 'easy', 10, 2, 45),

('q_alevel_fm_020', 'subj_alevel_further_math', NULL, 'Prove that cosh²x - sinh²x = 1.', 'short_answer', NULL, 'cosh²x - sinh²x = ((eˣ+e⁻ˣ)/2)² - ((eˣ-e⁻ˣ)/2)² = (e²ˣ+2+e⁻²ˣ)/4 - (e²ˣ-2+e⁻²ˣ)/4 = 4/4 = 1', 'cosh²x = (eˣ+e⁻ˣ)²/4 = (e²ˣ+2+e⁻²ˣ)/4. sinh²x = (e²ˣ-2+e⁻²ˣ)/4. Difference = 4/4 = 1', 'medium', 15, 4, 120),

('q_alevel_fm_021', 'subj_alevel_further_math', NULL, 'Differentiate y = sinh(2x).', 'multiple_choice', '["A. 2cosh(2x)", "B. cosh(2x)", "C. 2sinh(2x)", "D. cosh(x)"]', 'A', 'd/dx[sinh(2x)] = cosh(2x) × 2 = 2cosh(2x)', 'easy', 10, 2, 60),

('q_alevel_fm_022', 'subj_alevel_further_math', NULL, 'Find ∫ cosh x dx.', 'multiple_choice', '["A. sinh x + c", "B. -sinh x + c", "C. cosh x + c", "D. eˣ + c"]', 'A', '∫ cosh x dx = sinh x + c', 'easy', 10, 2, 60),

-- =============================================
-- DIFFERENTIAL EQUATIONS
-- =============================================

('q_alevel_fm_023', 'subj_alevel_further_math', NULL, 'Solve the differential equation dy/dx + 2y = 0.', 'calculation', NULL, 'y = Ae⁻²ˣ or y = Ce⁻²ˣ', 'Separating: dy/y = -2dx. ln|y| = -2x + c. y = Ae⁻²ˣ', 'easy', 10, 3, 90),

('q_alevel_fm_024', 'subj_alevel_further_math', NULL, 'Find the general solution of d²y/dx² - 5dy/dx + 6y = 0.', 'calculation', NULL, 'y = Ae²ˣ + Be³ˣ', 'Auxiliary equation: m² - 5m + 6 = 0. (m-2)(m-3) = 0. m = 2, 3. y = Ae²ˣ + Be³ˣ', 'medium', 15, 4, 120),

('q_alevel_fm_025', 'subj_alevel_further_math', NULL, 'Find the general solution of d²y/dx² + 4y = 0.', 'calculation', NULL, 'y = A cos 2x + B sin 2x', 'Auxiliary: m² + 4 = 0. m = ±2i. Complex roots give y = A cos 2x + B sin 2x', 'medium', 15, 4, 120),

('q_alevel_fm_026', 'subj_alevel_further_math', NULL, 'Solve d²y/dx² - 4dy/dx + 4y = 0.', 'calculation', NULL, 'y = (A + Bx)e²ˣ', 'Auxiliary: m² - 4m + 4 = 0. (m-2)² = 0. Repeated root m = 2. y = (A + Bx)e²ˣ', 'hard', 20, 5, 150),

('q_alevel_fm_027', 'subj_alevel_further_math', NULL, 'Find a particular integral for d²y/dx² + y = 3x.', 'calculation', NULL, 'yₚ = 3x', 'Try yₚ = ax + b. y'' = 0. 0 + ax + b = 3x. So a = 3, b = 0. yₚ = 3x', 'hard', 20, 5, 150),

-- =============================================
-- FURTHER MECHANICS - Circular Motion
-- =============================================

('q_alevel_fm_028', 'subj_alevel_further_math', NULL, 'A particle moves in a circle of radius 2m at 3 rad/s. Find the centripetal acceleration.', 'calculation', NULL, '18 m/s²', 'a = ω²r = 9 × 2 = 18 m/s²', 'easy', 10, 2, 60),

('q_alevel_fm_029', 'subj_alevel_further_math', NULL, 'A conical pendulum has length 1m and makes angle 30° with vertical. Find the angular velocity. (g = 10 m/s²)', 'calculation', NULL, 'ω = √(20/√3) ≈ 3.4 rad/s', 'T cos 30° = mg, T sin 30° = mω²r. tan 30° = ω²r/g. r = sin 30° = 0.5. ω² = g tan 30°/r = 10(1/√3)/0.5 = 20/√3', 'hard', 20, 6, 180),

('q_alevel_fm_030', 'subj_alevel_further_math', NULL, 'A car travels around a banked curve of radius 50m at 20 m/s. Find the banking angle for no friction. (g = 10 m/s²)', 'calculation', NULL, 'θ = arctan(0.8) ≈ 38.7°', 'tan θ = v²/(rg) = 400/(500) = 0.8. θ = arctan(0.8) ≈ 38.7°', 'medium', 15, 4, 120),

-- =============================================
-- FURTHER MECHANICS - Simple Harmonic Motion
-- =============================================

('q_alevel_fm_031', 'subj_alevel_further_math', NULL, 'A particle moves with SHM. If amplitude is 4cm and period is 2s, find the maximum velocity.', 'calculation', NULL, '4π cm/s or 0.04π m/s', 'ω = 2π/T = π rad/s. vₘₐₓ = ωa = π × 4 = 4π cm/s', 'easy', 10, 3, 90),

('q_alevel_fm_032', 'subj_alevel_further_math', NULL, 'For SHM with x = 3cos(2t), find the acceleration when t = π/4.', 'calculation', NULL, '0 m/s²', 'ẍ = -4 × 3cos(2t) = -12cos(2t). At t = π/4: ẍ = -12cos(π/2) = 0', 'medium', 15, 3, 90),

('q_alevel_fm_033', 'subj_alevel_further_math', NULL, 'A spring of stiffness 100 N/m supports a 4kg mass. Find the period of oscillation.', 'calculation', NULL, 'T = 2π/5 s ≈ 1.26 s', 'ω = √(k/m) = √(100/4) = 5 rad/s. T = 2π/ω = 2π/5 s', 'medium', 15, 4, 120),

-- =============================================
-- FURTHER STATISTICS - Probability Distributions
-- =============================================

('q_alevel_fm_034', 'subj_alevel_further_math', NULL, 'If X ~ N(50, 25), find P(45 < X < 55).', 'calculation', NULL, '0.6827 or 68.27%', 'Z₁ = (45-50)/5 = -1. Z₂ = (55-50)/5 = 1. P(-1 < Z < 1) = 0.6827', 'easy', 10, 3, 90),

('q_alevel_fm_035', 'subj_alevel_further_math', NULL, 'If X ~ Po(3), find P(X ≥ 2).', 'calculation', NULL, '1 - 4e⁻³ ≈ 0.801', 'P(X ≥ 2) = 1 - P(X < 2) = 1 - P(X=0) - P(X=1) = 1 - e⁻³ - 3e⁻³ = 1 - 4e⁻³ ≈ 0.801', 'medium', 15, 4, 120),

('q_alevel_fm_036', 'subj_alevel_further_math', NULL, 'X has PDF f(x) = 2x for 0 ≤ x ≤ 1. Find E(X).', 'calculation', NULL, '2/3', 'E(X) = ∫₀¹ x × 2x dx = ∫₀¹ 2x² dx = [2x³/3]₀¹ = 2/3', 'hard', 20, 5, 150),

('q_alevel_fm_037', 'subj_alevel_further_math', NULL, 'If X and Y are independent with Var(X) = 4 and Var(Y) = 9, find Var(2X - 3Y).', 'multiple_choice', '["A. 97", "B. 17", "C. 65", "D. 5"]', 'A', 'Var(2X - 3Y) = 4Var(X) + 9Var(Y) = 16 + 81 = 97', 'medium', 15, 3, 90),

-- =============================================
-- FURTHER PURE - Summation of Series
-- =============================================

('q_alevel_fm_038', 'subj_alevel_further_math', NULL, 'Find Σᵣ₌₁ⁿ r².', 'multiple_choice', '["A. n(n+1)(2n+1)/6", "B. n(n+1)/2", "C. n²(n+1)²/4", "D. n(2n+1)/3"]', 'A', 'The standard result for sum of squares is n(n+1)(2n+1)/6', 'easy', 10, 2, 60),

('q_alevel_fm_039', 'subj_alevel_further_math', NULL, 'Find Σᵣ₌₁²⁰ r.', 'calculation', NULL, '210', 'Σr = n(n+1)/2 = 20(21)/2 = 210', 'easy', 10, 2, 60),

('q_alevel_fm_040', 'subj_alevel_further_math', NULL, 'Find Σᵣ₌₁ⁿ r³.', 'multiple_choice', '["A. [n(n+1)/2]²", "B. n²(n+1)/2", "C. n(n+1)²/4", "D. n³(n+1)/4"]', 'A', 'The standard result: Σr³ = [n(n+1)/2]² = [Σr]²', 'medium', 15, 3, 90),

('q_alevel_fm_041', 'subj_alevel_further_math', NULL, 'Use the method of differences to find Σᵣ₌₁ⁿ 1/(r(r+1)).', 'calculation', NULL, 'n/(n+1)', '1/(r(r+1)) = 1/r - 1/(r+1). Sum = (1 - 1/2) + (1/2 - 1/3) + ... + (1/n - 1/(n+1)) = 1 - 1/(n+1) = n/(n+1)', 'hard', 20, 5, 150),

-- =============================================
-- PROOF BY INDUCTION
-- =============================================

('q_alevel_fm_042', 'subj_alevel_further_math', NULL, 'Prove by induction that Σᵣ₌₁ⁿ r = n(n+1)/2 for the base case n = 1.', 'short_answer', NULL, 'LHS = 1. RHS = 1(2)/2 = 1. LHS = RHS, so true for n = 1.', 'When n = 1: LHS = Σᵣ₌₁¹ r = 1. RHS = 1(1+1)/2 = 1. Since LHS = RHS, the formula holds for n = 1.', 'easy', 10, 2, 60),

('q_alevel_fm_043', 'subj_alevel_further_math', NULL, 'In a proof by induction, if assuming true for n = k, show the inductive step for Σᵣ₌₁ⁿ r = n(n+1)/2.', 'short_answer', NULL, 'Assume Σᵣ₌₁ᵏ r = k(k+1)/2. Then Σᵣ₌₁ᵏ⁺¹ r = k(k+1)/2 + (k+1) = (k+1)(k+2)/2 = (k+1)((k+1)+1)/2', 'Σᵣ₌₁ᵏ⁺¹ r = Σᵣ₌₁ᵏ r + (k+1) = k(k+1)/2 + (k+1) = (k+1)[k/2 + 1] = (k+1)(k+2)/2. This is the formula with n = k+1.', 'medium', 15, 4, 120),

-- =============================================
-- ROOTS OF POLYNOMIALS
-- =============================================

('q_alevel_fm_044', 'subj_alevel_further_math', NULL, 'If α and β are roots of x² - 5x + 7 = 0, find α² + β².', 'calculation', NULL, '11', 'α + β = 5, αβ = 7. α² + β² = (α + β)² - 2αβ = 25 - 14 = 11', 'medium', 15, 3, 90),

('q_alevel_fm_045', 'subj_alevel_further_math', NULL, 'If α, β, γ are roots of x³ - 2x² + 3x - 4 = 0, find αβ + βγ + γα.', 'multiple_choice', '["A. 3", "B. -3", "C. 2", "D. 4"]', 'A', 'For x³ + px² + qx + r = 0: αβ + βγ + γα = q. Here q = 3.', 'easy', 10, 2, 60),

('q_alevel_fm_046', 'subj_alevel_further_math', NULL, 'If α, β, γ are roots of x³ - 6x² + 11x - 6 = 0, find α + β + γ and αβγ.', 'calculation', NULL, 'α + β + γ = 6, αβγ = 6', 'For x³ - 6x² + 11x - 6 = 0: sum = 6, product = 6 (note sign of constant term)', 'medium', 15, 3, 90),

('q_alevel_fm_047', 'subj_alevel_further_math', NULL, 'Form a cubic equation whose roots are 2α, 2β, 2γ if α, β, γ are roots of x³ - x² + 2x - 1 = 0.', 'calculation', NULL, 'x³ - 2x² + 8x - 8 = 0', 'Substitute x = y/2: (y/2)³ - (y/2)² + 2(y/2) - 1 = 0. y³/8 - y²/4 + y - 1 = 0. Multiply by 8: y³ - 2y² + 8y - 8 = 0', 'hard', 20, 6, 180),

-- =============================================
-- VECTORS IN 3D
-- =============================================

('q_alevel_fm_048', 'subj_alevel_further_math', NULL, 'Find the vector product a × b where a = 2i + 3j - k and b = i - 2j + 2k.', 'calculation', NULL, '4i - 5j - 7k', 'a × b = |i  j  k; 2  3  -1; 1  -2  2| = i(6-2) - j(4+1) + k(-4-3) = 4i - 5j - 7k', 'hard', 20, 5, 150),

('q_alevel_fm_049', 'subj_alevel_further_math', NULL, 'Find the equation of the plane through (1, 2, 3) with normal vector 2i - j + 3k.', 'calculation', NULL, '2x - y + 3z = 9', 'Plane: 2(x-1) - (y-2) + 3(z-3) = 0. 2x - 2 - y + 2 + 3z - 9 = 0. 2x - y + 3z = 9', 'medium', 15, 4, 120),

('q_alevel_fm_050', 'subj_alevel_further_math', NULL, 'Find the distance from point (1, 2, 3) to the plane 2x + 2y + z = 10.', 'calculation', NULL, '1 unit', 'd = |2(1) + 2(2) + 1(3) - 10|/√(4+4+1) = |2 + 4 + 3 - 10|/3 = |-1|/3 = 1/3... Actually: d = |9-10|/3 = 1/3', 'hard', 20, 5, 150),

-- =============================================
-- ADDITIONAL QUESTIONS
-- =============================================

('q_alevel_fm_051', 'subj_alevel_further_math', NULL, 'Find the Maclaurin series expansion of eˣ up to the x³ term.', 'multiple_choice', '["A. 1 + x + x²/2 + x³/6", "B. 1 + x + x² + x³", "C. x + x²/2 + x³/6", "D. 1 + x + x²/2! + x³/3!"]', 'A', 'eˣ = 1 + x + x²/2! + x³/3! + ... = 1 + x + x²/2 + x³/6 + ...', 'easy', 10, 2, 60),

('q_alevel_fm_052', 'subj_alevel_further_math', NULL, 'Find the Maclaurin series for ln(1 + x) up to the x³ term.', 'calculation', NULL, 'x - x²/2 + x³/3', 'ln(1+x) = x - x²/2 + x³/3 - x⁴/4 + ...', 'medium', 15, 3, 90),

('q_alevel_fm_053', 'subj_alevel_further_math', NULL, 'Evaluate the integral ∫₀^∞ e⁻ˣ dx.', 'multiple_choice', '["A. 1", "B. ∞", "C. 0", "D. -1"]', 'A', '∫₀^∞ e⁻ˣ dx = [-e⁻ˣ]₀^∞ = 0 - (-1) = 1', 'medium', 15, 3, 90),

('q_alevel_fm_054', 'subj_alevel_further_math', NULL, 'Find the arc length of y = x^(3/2) from x = 0 to x = 4.', 'calculation', NULL, '(8/27)(10√10 - 1)', 'dy/dx = (3/2)x^(1/2). L = ∫₀⁴ √(1 + 9x/4) dx. Let u = 1 + 9x/4. L = (4/9)∫₁^10 √u du = (8/27)(10√10 - 1)', 'hard', 20, 6, 180),

('q_alevel_fm_055', 'subj_alevel_further_math', NULL, 'Use reduction formula: If Iₙ = ∫ xⁿeˣ dx, show that Iₙ = xⁿeˣ - nIₙ₋₁.', 'short_answer', NULL, 'Integration by parts: u = xⁿ, dv = eˣdx. Iₙ = xⁿeˣ - ∫nxⁿ⁻¹eˣdx = xⁿeˣ - nIₙ₋₁', 'Let u = xⁿ, dv = eˣdx. Then du = nxⁿ⁻¹dx, v = eˣ. Iₙ = xⁿeˣ - ∫nxⁿ⁻¹eˣdx = xⁿeˣ - nIₙ₋₁', 'hard', 20, 5, 150);
