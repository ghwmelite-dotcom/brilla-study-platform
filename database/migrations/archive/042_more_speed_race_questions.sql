-- Additional NSMQ Speed Race Questions
-- Adding 50 more questions per subject (200 total new questions)

-- =============================================
-- MATHEMATICS - 50 Additional Questions
-- =============================================

INSERT OR IGNORE INTO questions (id, subject_id, question_text, question_type, round_type, correct_answer, explanation, difficulty, points, marks, time_limit, is_compulsory) VALUES
-- Basic Arithmetic & Algebra
('nsmq_math_sr_026', 'subj_math', 'What is 15% of 200?', 'direct_answer', 'speed_race', '30', '15/100 × 200 = 30', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_027', 'subj_math', 'Simplify: 3x + 5x - 2x', 'direct_answer', 'speed_race', '6x', 'Combine like terms: 3 + 5 - 2 = 6', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_028', 'subj_math', 'What is the value of 2^5?', 'direct_answer', 'speed_race', '32', '2 × 2 × 2 × 2 × 2 = 32', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_029', 'subj_math', 'Solve: 4x = 28', 'direct_answer', 'speed_race', '7', 'x = 28/4 = 7', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_030', 'subj_math', 'What is the LCM of 4 and 6?', 'direct_answer', 'speed_race', '12', 'Multiples of 4: 4,8,12... Multiples of 6: 6,12... LCM = 12', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_031', 'subj_math', 'What is 3/4 as a percentage?', 'direct_answer', 'speed_race', '75%', '3/4 × 100 = 75%', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_032', 'subj_math', 'What is the square of 12?', 'direct_answer', 'speed_race', '144', '12 × 12 = 144', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_033', 'subj_math', 'Evaluate: (-3) × (-4)', 'direct_answer', 'speed_race', '12', 'Negative × Negative = Positive', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_034', 'subj_math', 'What is the HCF of 18 and 24?', 'direct_answer', 'speed_race', '6', 'Factors of 18: 1,2,3,6,9,18. Factors of 24: 1,2,3,4,6,8,12,24. HCF = 6', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_035', 'subj_math', 'Convert 0.25 to a fraction in lowest terms', 'direct_answer', 'speed_race', '1/4', '0.25 = 25/100 = 1/4', 'easy', 2, 1, 15, 1),

-- Geometry
('nsmq_math_sr_036', 'subj_math', 'What is the perimeter of a square with side 7 cm?', 'direct_answer', 'speed_race', '28 cm', 'Perimeter = 4 × side = 4 × 7 = 28 cm', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_037', 'subj_math', 'How many degrees are in a right angle?', 'direct_answer', 'speed_race', '90', 'A right angle = 90°', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_038', 'subj_math', 'What is the area of a rectangle with length 8 and width 5?', 'direct_answer', 'speed_race', '40', 'Area = length × width = 8 × 5 = 40', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_039', 'subj_math', 'How many sides does a hexagon have?', 'direct_answer', 'speed_race', '6', 'A hexagon has 6 sides', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_040', 'subj_math', 'What is the sum of interior angles of a triangle?', 'direct_answer', 'speed_race', '180', 'Sum of angles in a triangle = 180°', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_041', 'subj_math', 'What is the circumference of a circle with radius 7? (Use π = 22/7)', 'direct_answer', 'speed_race', '44', 'C = 2πr = 2 × 22/7 × 7 = 44', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_042', 'subj_math', 'What is the volume of a cube with edge 3 cm?', 'direct_answer', 'speed_race', '27 cm³', 'Volume = edge³ = 3³ = 27 cm³', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_043', 'subj_math', 'How many vertices does a triangular prism have?', 'direct_answer', 'speed_race', '6', 'A triangular prism has 6 vertices', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_044', 'subj_math', 'What is the diameter of a circle with radius 9?', 'direct_answer', 'speed_race', '18', 'Diameter = 2 × radius = 2 × 9 = 18', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_045', 'subj_math', 'What type of triangle has all sides equal?', 'direct_answer', 'speed_race', 'Equilateral', 'An equilateral triangle has all sides equal', 'easy', 2, 1, 15, 1),

-- Algebra & Equations
('nsmq_math_sr_046', 'subj_math', 'If y = 3x + 2, find y when x = 4', 'direct_answer', 'speed_race', '14', 'y = 3(4) + 2 = 12 + 2 = 14', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_047', 'subj_math', 'Factorize: x² - 9', 'direct_answer', 'speed_race', '(x+3)(x-3)', 'Difference of squares: a² - b² = (a+b)(a-b)', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_048', 'subj_math', 'What is the gradient of y = 2x + 5?', 'direct_answer', 'speed_race', '2', 'In y = mx + c, m is the gradient = 2', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_049', 'subj_math', 'Solve: x + 7 = 15', 'direct_answer', 'speed_race', '8', 'x = 15 - 7 = 8', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_050', 'subj_math', 'Expand: (x + 2)(x + 3)', 'direct_answer', 'speed_race', 'x² + 5x + 6', 'x² + 3x + 2x + 6 = x² + 5x + 6', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_051', 'subj_math', 'What is the y-intercept of y = 4x - 7?', 'direct_answer', 'speed_race', '-7', 'In y = mx + c, c is the y-intercept = -7', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_052', 'subj_math', 'Simplify: (2x³)²', 'direct_answer', 'speed_race', '4x⁶', '(2x³)² = 4x⁶', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_053', 'subj_math', 'If f(x) = x² - 1, find f(3)', 'direct_answer', 'speed_race', '8', 'f(3) = 3² - 1 = 9 - 1 = 8', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_054', 'subj_math', 'What is √81?', 'direct_answer', 'speed_race', '9', '9 × 9 = 81, so √81 = 9', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_055', 'subj_math', 'Solve: 2x - 5 = 11', 'direct_answer', 'speed_race', '8', '2x = 16, x = 8', 'easy', 2, 1, 15, 1),

-- Number Theory & Sequences
('nsmq_math_sr_056', 'subj_math', 'What is the next prime number after 17?', 'direct_answer', 'speed_race', '19', '18 is not prime, 19 is prime', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_057', 'subj_math', 'Find the 10th term of the sequence: 2, 4, 6, 8, ...', 'direct_answer', 'speed_race', '20', 'This is 2n, so 10th term = 2(10) = 20', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_058', 'subj_math', 'What is 5 factorial (5!)?', 'direct_answer', 'speed_race', '120', '5! = 5×4×3×2×1 = 120', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_059', 'subj_math', 'Express 36 as a product of prime factors', 'direct_answer', 'speed_race', '2² × 3²', '36 = 4 × 9 = 2² × 3²', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_060', 'subj_math', 'What is the sum of the first 5 positive integers?', 'direct_answer', 'speed_race', '15', '1+2+3+4+5 = 15', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_061', 'subj_math', 'Is 51 a prime number?', 'direct_answer', 'speed_race', 'No', '51 = 3 × 17, so it is not prime', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_062', 'subj_math', 'What is the 7th triangular number?', 'direct_answer', 'speed_race', '28', '1+2+3+4+5+6+7 = 28', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_063', 'subj_math', 'Find the common difference in: 5, 9, 13, 17, ...', 'direct_answer', 'speed_race', '4', '9-5 = 4, 13-9 = 4', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_064', 'subj_math', 'What is 3⁰?', 'direct_answer', 'speed_race', '1', 'Any number to the power 0 equals 1', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_065', 'subj_math', 'How many factors does 12 have?', 'direct_answer', 'speed_race', '6', 'Factors: 1, 2, 3, 4, 6, 12', 'easy', 2, 1, 15, 1),

-- Trigonometry & Advanced
('nsmq_math_sr_066', 'subj_math', 'What is sin 30°?', 'direct_answer', 'speed_race', '0.5 or 1/2', 'sin 30° = 1/2', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_067', 'subj_math', 'What is cos 60°?', 'direct_answer', 'speed_race', '0.5 or 1/2', 'cos 60° = 1/2', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_068', 'subj_math', 'What is tan 45°?', 'direct_answer', 'speed_race', '1', 'tan 45° = 1', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_069', 'subj_math', 'Convert 180° to radians', 'direct_answer', 'speed_race', 'π', '180° = π radians', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_070', 'subj_math', 'What is log₁₀(100)?', 'direct_answer', 'speed_race', '2', '10² = 100, so log₁₀(100) = 2', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_071', 'subj_math', 'In a right triangle, if one angle is 30°, what is the other acute angle?', 'direct_answer', 'speed_race', '60°', '90° + 30° + x = 180°, x = 60°', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_072', 'subj_math', 'What is the reciprocal of 5?', 'direct_answer', 'speed_race', '1/5 or 0.2', 'Reciprocal of n is 1/n', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_073', 'subj_math', 'Simplify: √50', 'direct_answer', 'speed_race', '5√2', '√50 = √(25×2) = 5√2', 'medium', 2, 1, 15, 1),
('nsmq_math_sr_074', 'subj_math', 'What is the absolute value of -15?', 'direct_answer', 'speed_race', '15', '|-15| = 15', 'easy', 2, 1, 15, 1),
('nsmq_math_sr_075', 'subj_math', 'If x:y = 2:3 and x = 10, find y', 'direct_answer', 'speed_race', '15', '10/y = 2/3, y = 15', 'medium', 2, 1, 15, 1);

-- =============================================
-- PHYSICS - 50 Additional Questions
-- =============================================

INSERT OR IGNORE INTO questions (id, subject_id, question_text, question_type, round_type, correct_answer, explanation, difficulty, points, marks, time_limit, is_compulsory) VALUES
-- Mechanics
('nsmq_phys_sr_026', 'subj_physics', 'What is the SI unit of force?', 'direct_answer', 'speed_race', 'Newton', 'Force is measured in Newtons (N)', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_027', 'subj_physics', 'What is the formula for speed?', 'direct_answer', 'speed_race', 'Distance/Time', 'Speed = Distance ÷ Time', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_028', 'subj_physics', 'What is the acceleration due to gravity on Earth?', 'direct_answer', 'speed_race', '9.8 m/s² or 10 m/s²', 'g ≈ 9.8 m/s² (often approximated as 10 m/s²)', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_029', 'subj_physics', 'What is the SI unit of work?', 'direct_answer', 'speed_race', 'Joule', 'Work is measured in Joules (J)', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_030', 'subj_physics', 'What is the formula for kinetic energy?', 'direct_answer', 'speed_race', '½mv²', 'KE = ½mv²', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_031', 'subj_physics', 'What type of energy does a stretched spring have?', 'direct_answer', 'speed_race', 'Elastic potential energy', 'A stretched spring stores elastic potential energy', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_032', 'subj_physics', 'What is momentum equal to?', 'direct_answer', 'speed_race', 'Mass × Velocity', 'p = mv', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_033', 'subj_physics', 'What is the unit of power?', 'direct_answer', 'speed_race', 'Watt', 'Power is measured in Watts (W)', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_034', 'subj_physics', 'What is Newton''s first law also known as?', 'direct_answer', 'speed_race', 'Law of Inertia', 'Newton''s first law describes inertia', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_035', 'subj_physics', 'What is the formula for pressure?', 'direct_answer', 'speed_race', 'Force/Area', 'P = F/A', 'easy', 2, 1, 15, 1),

-- Waves & Optics
('nsmq_phys_sr_036', 'subj_physics', 'What is the speed of light in vacuum?', 'direct_answer', 'speed_race', '3 × 10⁸ m/s', 'c = 3 × 10⁸ m/s', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_037', 'subj_physics', 'What type of wave is sound?', 'direct_answer', 'speed_race', 'Longitudinal', 'Sound is a longitudinal wave', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_038', 'subj_physics', 'What type of wave is light?', 'direct_answer', 'speed_race', 'Transverse', 'Light is a transverse electromagnetic wave', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_039', 'subj_physics', 'What is the unit of frequency?', 'direct_answer', 'speed_race', 'Hertz', 'Frequency is measured in Hertz (Hz)', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_040', 'subj_physics', 'What happens to light when it passes from air to glass?', 'direct_answer', 'speed_race', 'It slows down and bends toward normal', 'Light refracts toward the normal in denser medium', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_041', 'subj_physics', 'What color of light has the longest wavelength?', 'direct_answer', 'speed_race', 'Red', 'Red light has the longest wavelength in visible spectrum', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_042', 'subj_physics', 'What is the relationship between frequency and wavelength?', 'direct_answer', 'speed_race', 'Inversely proportional', 'v = fλ, so f ∝ 1/λ', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_043', 'subj_physics', 'What type of mirror is used in car headlights?', 'direct_answer', 'speed_race', 'Concave', 'Concave mirrors focus light into a beam', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_044', 'subj_physics', 'What is the angle of incidence equal to?', 'direct_answer', 'speed_race', 'Angle of reflection', 'Law of reflection: angle i = angle r', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_045', 'subj_physics', 'What phenomenon causes a rainbow?', 'direct_answer', 'speed_race', 'Dispersion', 'Dispersion of light by water droplets', 'easy', 2, 1, 15, 1),

-- Electricity & Magnetism
('nsmq_phys_sr_046', 'subj_physics', 'What is the SI unit of electric current?', 'direct_answer', 'speed_race', 'Ampere', 'Current is measured in Amperes (A)', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_047', 'subj_physics', 'What is Ohm''s Law?', 'direct_answer', 'speed_race', 'V = IR', 'Voltage = Current × Resistance', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_048', 'subj_physics', 'What is the unit of resistance?', 'direct_answer', 'speed_race', 'Ohm', 'Resistance is measured in Ohms (Ω)', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_049', 'subj_physics', 'What particle carries negative charge?', 'direct_answer', 'speed_race', 'Electron', 'Electrons carry negative charge', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_050', 'subj_physics', 'What is the formula for electrical power?', 'direct_answer', 'speed_race', 'P = IV', 'Power = Current × Voltage', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_051', 'subj_physics', 'What happens to total resistance in a series circuit?', 'direct_answer', 'speed_race', 'It increases', 'R_total = R₁ + R₂ + R₃ ...', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_052', 'subj_physics', 'What device converts mechanical energy to electrical energy?', 'direct_answer', 'speed_race', 'Generator', 'A generator converts mechanical to electrical energy', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_053', 'subj_physics', 'What is electromagnetic induction?', 'direct_answer', 'speed_race', 'Generating EMF by changing magnetic flux', 'Faraday''s law of electromagnetic induction', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_054', 'subj_physics', 'What are the two types of electric charge?', 'direct_answer', 'speed_race', 'Positive and negative', 'Electric charge can be positive or negative', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_055', 'subj_physics', 'What is the unit of electrical energy?', 'direct_answer', 'speed_race', 'Joule or kilowatt-hour', 'Energy = Power × Time', 'easy', 2, 1, 15, 1),

-- Heat & Thermodynamics
('nsmq_phys_sr_056', 'subj_physics', 'What is absolute zero in Celsius?', 'direct_answer', 'speed_race', '-273°C', 'Absolute zero = 0 K = -273.15°C', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_057', 'subj_physics', 'What are the three methods of heat transfer?', 'direct_answer', 'speed_race', 'Conduction, convection, radiation', 'Heat transfers by conduction, convection, and radiation', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_058', 'subj_physics', 'What is the SI unit of temperature?', 'direct_answer', 'speed_race', 'Kelvin', 'Temperature in SI is measured in Kelvin (K)', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_059', 'subj_physics', 'What happens to the volume of most substances when heated?', 'direct_answer', 'speed_race', 'It increases', 'Thermal expansion causes volume to increase', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_060', 'subj_physics', 'What is specific heat capacity?', 'direct_answer', 'speed_race', 'Heat needed to raise 1 kg by 1°C', 'c = Q/(mΔT)', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_061', 'subj_physics', 'At what temperature does water boil at standard pressure?', 'direct_answer', 'speed_race', '100°C', 'Water boils at 100°C at 1 atm', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_062', 'subj_physics', 'What is latent heat?', 'direct_answer', 'speed_race', 'Heat absorbed during phase change', 'Latent heat is released/absorbed during state change', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_063', 'subj_physics', 'Convert 25°C to Kelvin', 'direct_answer', 'speed_race', '298 K', 'K = °C + 273 = 25 + 273 = 298 K', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_064', 'subj_physics', 'What is the melting point of ice?', 'direct_answer', 'speed_race', '0°C', 'Ice melts at 0°C at standard pressure', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_065', 'subj_physics', 'What type of heat transfer occurs in fluids?', 'direct_answer', 'speed_race', 'Convection', 'Convection occurs in liquids and gases', 'easy', 2, 1, 15, 1),

-- Modern Physics & Atomic
('nsmq_phys_sr_066', 'subj_physics', 'What is the charge of a proton?', 'direct_answer', 'speed_race', 'Positive', 'Protons have positive charge', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_067', 'subj_physics', 'What is the nucleus made of?', 'direct_answer', 'speed_race', 'Protons and neutrons', 'The nucleus contains protons and neutrons', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_068', 'subj_physics', 'What type of radiation is stopped by paper?', 'direct_answer', 'speed_race', 'Alpha', 'Alpha particles are stopped by paper', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_069', 'subj_physics', 'What is the atomic number?', 'direct_answer', 'speed_race', 'Number of protons', 'Atomic number = number of protons', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_070', 'subj_physics', 'What is E = mc² known as?', 'direct_answer', 'speed_race', 'Mass-energy equivalence', 'Einstein''s famous equation relating mass and energy', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_071', 'subj_physics', 'What is radioactive half-life?', 'direct_answer', 'speed_race', 'Time for half the nuclei to decay', 'Half-life is the time for half the sample to decay', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_072', 'subj_physics', 'What particle has no charge?', 'direct_answer', 'speed_race', 'Neutron', 'Neutrons are electrically neutral', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_073', 'subj_physics', 'What is the mass number?', 'direct_answer', 'speed_race', 'Protons + Neutrons', 'Mass number = protons + neutrons', 'easy', 2, 1, 15, 1),
('nsmq_phys_sr_074', 'subj_physics', 'What are isotopes?', 'direct_answer', 'speed_race', 'Atoms with same protons but different neutrons', 'Isotopes have same atomic number, different mass number', 'medium', 2, 1, 15, 1),
('nsmq_phys_sr_075', 'subj_physics', 'What is nuclear fission?', 'direct_answer', 'speed_race', 'Splitting of heavy nucleus', 'Fission splits heavy nuclei into lighter ones', 'medium', 2, 1, 15, 1);

-- =============================================
-- CHEMISTRY - 50 Additional Questions
-- =============================================

INSERT OR IGNORE INTO questions (id, subject_id, question_text, question_type, round_type, correct_answer, explanation, difficulty, points, marks, time_limit, is_compulsory) VALUES
-- Atomic Structure & Periodic Table
('nsmq_chem_sr_026', 'subj_chemistry', 'How many electrons can the first shell hold?', 'direct_answer', 'speed_race', '2', 'First shell holds maximum 2 electrons', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_027', 'subj_chemistry', 'What is the atomic number of carbon?', 'direct_answer', 'speed_race', '6', 'Carbon has 6 protons', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_028', 'subj_chemistry', 'Which group contains the noble gases?', 'direct_answer', 'speed_race', 'Group 18 or Group 0', 'Noble gases are in Group 18 (or 0)', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_029', 'subj_chemistry', 'What is the symbol for potassium?', 'direct_answer', 'speed_race', 'K', 'From Latin Kalium', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_030', 'subj_chemistry', 'How many electrons can the second shell hold?', 'direct_answer', 'speed_race', '8', 'Second shell holds maximum 8 electrons', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_031', 'subj_chemistry', 'What element has atomic number 1?', 'direct_answer', 'speed_race', 'Hydrogen', 'Hydrogen is the first element', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_032', 'subj_chemistry', 'Which group contains the alkali metals?', 'direct_answer', 'speed_race', 'Group 1', 'Alkali metals are in Group 1', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_033', 'subj_chemistry', 'What is the symbol for sodium?', 'direct_answer', 'speed_race', 'Na', 'From Latin Natrium', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_034', 'subj_chemistry', 'Which subatomic particle determines the element?', 'direct_answer', 'speed_race', 'Proton', 'Number of protons defines the element', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_035', 'subj_chemistry', 'What is the electronic configuration of oxygen?', 'direct_answer', 'speed_race', '2,6', 'Oxygen: 8 electrons = 2 + 6', 'medium', 2, 1, 15, 1),

-- Chemical Bonding
('nsmq_chem_sr_036', 'subj_chemistry', 'What type of bond forms between metals and non-metals?', 'direct_answer', 'speed_race', 'Ionic', 'Metals transfer electrons to non-metals', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_037', 'subj_chemistry', 'What type of bond involves sharing of electrons?', 'direct_answer', 'speed_race', 'Covalent', 'Covalent bonds share electron pairs', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_038', 'subj_chemistry', 'What is the valency of oxygen?', 'direct_answer', 'speed_race', '2', 'Oxygen needs 2 electrons to fill outer shell', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_039', 'subj_chemistry', 'How many covalent bonds can carbon form?', 'direct_answer', 'speed_race', '4', 'Carbon has 4 valence electrons', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_040', 'subj_chemistry', 'What holds atoms together in a metal?', 'direct_answer', 'speed_race', 'Metallic bonding', 'Metallic bonds involve sea of electrons', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_041', 'subj_chemistry', 'What is the charge on a chloride ion?', 'direct_answer', 'speed_race', '-1 or 1-', 'Chlorine gains one electron', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_042', 'subj_chemistry', 'What is the formula of water?', 'direct_answer', 'speed_race', 'H₂O', 'Two hydrogen atoms bonded to one oxygen', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_043', 'subj_chemistry', 'What is the valency of sodium?', 'direct_answer', 'speed_race', '1', 'Sodium has 1 valence electron', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_044', 'subj_chemistry', 'What type of bond is in NaCl?', 'direct_answer', 'speed_race', 'Ionic', 'NaCl is formed by ionic bonding', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_045', 'subj_chemistry', 'What is a cation?', 'direct_answer', 'speed_race', 'Positive ion', 'A cation is a positively charged ion', 'easy', 2, 1, 15, 1),

-- Acids, Bases & Salts
('nsmq_chem_sr_046', 'subj_chemistry', 'What is the pH of a neutral solution?', 'direct_answer', 'speed_race', '7', 'Neutral pH = 7', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_047', 'subj_chemistry', 'What gas is produced when acid reacts with metal?', 'direct_answer', 'speed_race', 'Hydrogen', 'Acid + Metal → Salt + Hydrogen', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_048', 'subj_chemistry', 'What is the formula of sulfuric acid?', 'direct_answer', 'speed_race', 'H₂SO₄', 'Sulfuric acid: H₂SO₄', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_049', 'subj_chemistry', 'What color does litmus paper turn in acid?', 'direct_answer', 'speed_race', 'Red', 'Acids turn blue litmus red', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_050', 'subj_chemistry', 'What is formed when an acid reacts with a base?', 'direct_answer', 'speed_race', 'Salt and water', 'Neutralization: Acid + Base → Salt + Water', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_051', 'subj_chemistry', 'What is the formula of hydrochloric acid?', 'direct_answer', 'speed_race', 'HCl', 'Hydrochloric acid: HCl', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_052', 'subj_chemistry', 'Is sodium hydroxide an acid or base?', 'direct_answer', 'speed_race', 'Base', 'NaOH is a strong base', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_053', 'subj_chemistry', 'What gas is released when acid reacts with carbonate?', 'direct_answer', 'speed_race', 'Carbon dioxide', 'Acid + Carbonate → Salt + Water + CO₂', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_054', 'subj_chemistry', 'What is the pH range for acids?', 'direct_answer', 'speed_race', 'Below 7 or 0-6', 'Acids have pH less than 7', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_055', 'subj_chemistry', 'What is the chemical name of common salt?', 'direct_answer', 'speed_race', 'Sodium chloride', 'Table salt is NaCl', 'easy', 2, 1, 15, 1),

-- Reactions & Equations
('nsmq_chem_sr_056', 'subj_chemistry', 'What is the law of conservation of mass?', 'direct_answer', 'speed_race', 'Mass is neither created nor destroyed', 'Total mass before = total mass after reaction', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_057', 'subj_chemistry', 'What type of reaction produces heat?', 'direct_answer', 'speed_race', 'Exothermic', 'Exothermic reactions release heat', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_058', 'subj_chemistry', 'What is oxidation in terms of electrons?', 'direct_answer', 'speed_race', 'Loss of electrons', 'OIL RIG: Oxidation Is Loss', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_059', 'subj_chemistry', 'What is reduction in terms of electrons?', 'direct_answer', 'speed_race', 'Gain of electrons', 'OIL RIG: Reduction Is Gain', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_060', 'subj_chemistry', 'Balance: H₂ + O₂ → H₂O', 'direct_answer', 'speed_race', '2H₂ + O₂ → 2H₂O', 'Balance atoms on both sides', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_061', 'subj_chemistry', 'What catalyst is used in the Haber process?', 'direct_answer', 'speed_race', 'Iron', 'Iron catalyst in ammonia production', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_062', 'subj_chemistry', 'What is a catalyst?', 'direct_answer', 'speed_race', 'Substance that speeds up reaction without being used up', 'Catalysts lower activation energy', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_063', 'subj_chemistry', 'What type of reaction absorbs heat?', 'direct_answer', 'speed_race', 'Endothermic', 'Endothermic reactions absorb heat', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_064', 'subj_chemistry', 'What is the test for hydrogen gas?', 'direct_answer', 'speed_race', 'Burns with a pop', 'Hydrogen gives a squeaky pop with lit splint', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_065', 'subj_chemistry', 'What is the test for oxygen gas?', 'direct_answer', 'speed_race', 'Relights a glowing splint', 'Oxygen relights a glowing splint', 'easy', 2, 1, 15, 1),

-- Organic Chemistry & Materials
('nsmq_chem_sr_066', 'subj_chemistry', 'What is the first alkane?', 'direct_answer', 'speed_race', 'Methane', 'Methane (CH₄) is the simplest alkane', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_067', 'subj_chemistry', 'What is the general formula for alkanes?', 'direct_answer', 'speed_race', 'CₙH₂ₙ₊₂', 'Alkanes: CₙH₂ₙ₊₂', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_068', 'subj_chemistry', 'What functional group do alcohols contain?', 'direct_answer', 'speed_race', '-OH or hydroxyl', 'Alcohols contain the -OH group', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_069', 'subj_chemistry', 'What is the molecular formula of ethanol?', 'direct_answer', 'speed_race', 'C₂H₅OH', 'Ethanol: C₂H₅OH or C₂H₆O', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_070', 'subj_chemistry', 'What products form when hydrocarbons burn completely?', 'direct_answer', 'speed_race', 'Carbon dioxide and water', 'Complete combustion: CO₂ + H₂O', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_071', 'subj_chemistry', 'What is crude oil?', 'direct_answer', 'speed_race', 'Mixture of hydrocarbons', 'Crude oil is unrefined petroleum', 'easy', 2, 1, 15, 1),
('nsmq_chem_sr_072', 'subj_chemistry', 'What process separates crude oil?', 'direct_answer', 'speed_race', 'Fractional distillation', 'Crude oil is separated by fractional distillation', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_073', 'subj_chemistry', 'What is a polymer?', 'direct_answer', 'speed_race', 'Large molecule made of repeating units', 'Polymers are chains of monomers', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_074', 'subj_chemistry', 'What is the monomer of polyethene?', 'direct_answer', 'speed_race', 'Ethene', 'Polyethene is made from ethene monomers', 'medium', 2, 1, 15, 1),
('nsmq_chem_sr_075', 'subj_chemistry', 'What type of reaction makes polymers?', 'direct_answer', 'speed_race', 'Polymerization', 'Polymerization joins monomers together', 'easy', 2, 1, 15, 1);

-- =============================================
-- BIOLOGY - 50 Additional Questions
-- =============================================

INSERT OR IGNORE INTO questions (id, subject_id, question_text, question_type, round_type, correct_answer, explanation, difficulty, points, marks, time_limit, is_compulsory) VALUES
-- Cell Biology
('nsmq_bio_sr_026', 'subj_biology', 'What is the powerhouse of the cell?', 'direct_answer', 'speed_race', 'Mitochondria', 'Mitochondria produce ATP', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_027', 'subj_biology', 'What organelle controls the cell?', 'direct_answer', 'speed_race', 'Nucleus', 'The nucleus contains genetic material', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_028', 'subj_biology', 'What is the cell membrane made of?', 'direct_answer', 'speed_race', 'Phospholipid bilayer', 'Cell membrane is a phospholipid bilayer', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_029', 'subj_biology', 'What organelle is responsible for photosynthesis?', 'direct_answer', 'speed_race', 'Chloroplast', 'Chloroplasts contain chlorophyll', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_030', 'subj_biology', 'What is the function of ribosomes?', 'direct_answer', 'speed_race', 'Protein synthesis', 'Ribosomes make proteins', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_031', 'subj_biology', 'What structure is found in plant cells but not animal cells?', 'direct_answer', 'speed_race', 'Cell wall', 'Plant cells have rigid cell walls', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_032', 'subj_biology', 'What is the jelly-like substance inside cells?', 'direct_answer', 'speed_race', 'Cytoplasm', 'Cytoplasm fills the cell', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_033', 'subj_biology', 'What type of cell division produces identical cells?', 'direct_answer', 'speed_race', 'Mitosis', 'Mitosis produces identical daughter cells', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_034', 'subj_biology', 'What type of cell division produces gametes?', 'direct_answer', 'speed_race', 'Meiosis', 'Meiosis produces sex cells', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_035', 'subj_biology', 'How many chromosomes do human body cells have?', 'direct_answer', 'speed_race', '46', 'Humans have 46 chromosomes (23 pairs)', 'easy', 2, 1, 15, 1),

-- Human Biology
('nsmq_bio_sr_036', 'subj_biology', 'What organ pumps blood?', 'direct_answer', 'speed_race', 'Heart', 'The heart pumps blood through the body', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_037', 'subj_biology', 'What is the largest organ in the human body?', 'direct_answer', 'speed_race', 'Skin', 'Skin is the largest organ', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_038', 'subj_biology', 'What blood vessels carry blood away from the heart?', 'direct_answer', 'speed_race', 'Arteries', 'Arteries carry blood from the heart', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_039', 'subj_biology', 'What is the function of white blood cells?', 'direct_answer', 'speed_race', 'Fight infection', 'White blood cells are part of immune system', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_040', 'subj_biology', 'What gas do we breathe in?', 'direct_answer', 'speed_race', 'Oxygen', 'We inhale oxygen for respiration', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_041', 'subj_biology', 'What gas do we breathe out?', 'direct_answer', 'speed_race', 'Carbon dioxide', 'We exhale carbon dioxide', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_042', 'subj_biology', 'Where does digestion begin?', 'direct_answer', 'speed_race', 'Mouth', 'Mechanical and chemical digestion starts in mouth', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_043', 'subj_biology', 'What enzyme breaks down starch?', 'direct_answer', 'speed_race', 'Amylase', 'Amylase breaks starch into maltose', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_044', 'subj_biology', 'What organ filters blood and produces urine?', 'direct_answer', 'speed_race', 'Kidney', 'Kidneys filter waste from blood', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_045', 'subj_biology', 'What is the smallest bone in the human body?', 'direct_answer', 'speed_race', 'Stapes', 'The stapes is in the middle ear', 'medium', 2, 1, 15, 1),

-- Plants & Photosynthesis
('nsmq_bio_sr_046', 'subj_biology', 'What is the equation for photosynthesis?', 'direct_answer', 'speed_race', 'CO₂ + H₂O → Glucose + O₂', '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_047', 'subj_biology', 'What green pigment absorbs light?', 'direct_answer', 'speed_race', 'Chlorophyll', 'Chlorophyll absorbs light for photosynthesis', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_048', 'subj_biology', 'What do plants absorb through their roots?', 'direct_answer', 'speed_race', 'Water and minerals', 'Roots absorb water and nutrients', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_049', 'subj_biology', 'What is the function of xylem?', 'direct_answer', 'speed_race', 'Transport water upward', 'Xylem carries water from roots to leaves', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_050', 'subj_biology', 'What is the function of phloem?', 'direct_answer', 'speed_race', 'Transport sugars', 'Phloem carries food throughout plant', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_051', 'subj_biology', 'What gas enters leaves through stomata?', 'direct_answer', 'speed_race', 'Carbon dioxide', 'CO₂ enters for photosynthesis', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_052', 'subj_biology', 'What is transpiration?', 'direct_answer', 'speed_race', 'Water loss from leaves', 'Transpiration is evaporation from leaves', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_053', 'subj_biology', 'What type of reproduction involves one parent?', 'direct_answer', 'speed_race', 'Asexual', 'Asexual reproduction needs one parent', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_054', 'subj_biology', 'What is the male part of a flower?', 'direct_answer', 'speed_race', 'Stamen', 'Stamen produces pollen', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_055', 'subj_biology', 'What is the female part of a flower?', 'direct_answer', 'speed_race', 'Pistil or Carpel', 'Pistil contains the ovary', 'easy', 2, 1, 15, 1),

-- Genetics & Evolution
('nsmq_bio_sr_056', 'subj_biology', 'What does DNA stand for?', 'direct_answer', 'speed_race', 'Deoxyribonucleic acid', 'DNA carries genetic information', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_057', 'subj_biology', 'What are the four bases in DNA?', 'direct_answer', 'speed_race', 'Adenine, Thymine, Guanine, Cytosine', 'A, T, G, C are DNA bases', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_058', 'subj_biology', 'What base pairs with Adenine in DNA?', 'direct_answer', 'speed_race', 'Thymine', 'A pairs with T', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_059', 'subj_biology', 'What is a gene?', 'direct_answer', 'speed_race', 'Section of DNA coding for a protein', 'Genes contain instructions for proteins', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_060', 'subj_biology', 'What is a dominant allele?', 'direct_answer', 'speed_race', 'Allele that is always expressed', 'Dominant alleles mask recessive ones', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_061', 'subj_biology', 'Who proposed the theory of evolution by natural selection?', 'direct_answer', 'speed_race', 'Charles Darwin', 'Darwin published Origin of Species', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_062', 'subj_biology', 'What is natural selection?', 'direct_answer', 'speed_race', 'Survival of the fittest', 'Best adapted organisms survive and reproduce', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_063', 'subj_biology', 'What is a mutation?', 'direct_answer', 'speed_race', 'Change in DNA sequence', 'Mutations are random genetic changes', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_064', 'subj_biology', 'What determines biological sex in humans?', 'direct_answer', 'speed_race', 'Sex chromosomes (X and Y)', 'XX = female, XY = male', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_065', 'subj_biology', 'What is the phenotype?', 'direct_answer', 'speed_race', 'Observable characteristics', 'Phenotype is the physical expression of genes', 'medium', 2, 1, 15, 1),

-- Ecology & Environment
('nsmq_bio_sr_066', 'subj_biology', 'What is an ecosystem?', 'direct_answer', 'speed_race', 'Community of organisms and their environment', 'Ecosystem includes living and non-living things', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_067', 'subj_biology', 'What is a food chain?', 'direct_answer', 'speed_race', 'Sequence of who eats whom', 'Food chains show energy flow', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_068', 'subj_biology', 'What are organisms that make their own food called?', 'direct_answer', 'speed_race', 'Producers or Autotrophs', 'Plants are producers', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_069', 'subj_biology', 'What are organisms that eat other organisms called?', 'direct_answer', 'speed_race', 'Consumers or Heterotrophs', 'Animals are consumers', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_070', 'subj_biology', 'What organisms break down dead matter?', 'direct_answer', 'speed_race', 'Decomposers', 'Bacteria and fungi decompose organic matter', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_071', 'subj_biology', 'What is the carbon cycle?', 'direct_answer', 'speed_race', 'Movement of carbon through ecosystems', 'Carbon cycles through living and non-living things', 'medium', 2, 1, 15, 1),
('nsmq_bio_sr_072', 'subj_biology', 'What causes global warming?', 'direct_answer', 'speed_race', 'Greenhouse gases', 'CO₂ and other gases trap heat', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_073', 'subj_biology', 'What is biodiversity?', 'direct_answer', 'speed_race', 'Variety of life in an area', 'Biodiversity measures species richness', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_074', 'subj_biology', 'What is a habitat?', 'direct_answer', 'speed_race', 'Place where an organism lives', 'Habitat is an organism''s home', 'easy', 2, 1, 15, 1),
('nsmq_bio_sr_075', 'subj_biology', 'What is the nitrogen cycle?', 'direct_answer', 'speed_race', 'Movement of nitrogen through ecosystems', 'Nitrogen cycles through air, soil, and organisms', 'medium', 2, 1, 15, 1);
