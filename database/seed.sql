-- Brilla Study Platform Seed Data
-- Sample data for development and testing

-- Insert Subjects
INSERT INTO subjects (id, name, slug, icon, color, description, display_order) VALUES
('subj_math', 'Mathematics', 'mathematics', 'Calculator', '#3B82F6', 'Master mathematical concepts from algebra to calculus', 1),
('subj_physics', 'Physics', 'physics', 'Atom', '#8B5CF6', 'Explore the fundamental laws of the universe', 2),
('subj_chemistry', 'Chemistry', 'chemistry', 'FlaskConical', '#10B981', 'Discover the science of matter and its interactions', 3),
('subj_biology', 'Biology', 'biology', 'Dna', '#F59E0B', 'Study life and living organisms', 4);

-- Insert Topics for Mathematics
INSERT INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order) VALUES
('topic_algebra', 'subj_math', NULL, 'Algebra', 'algebra', 'Fundamental algebraic concepts and operations',
'Algebra is the branch of mathematics dealing with symbols and the rules for manipulating those symbols. It includes solving equations, working with polynomials, and understanding functions.',
'["ax + b = c → x = (c-b)/a", "(a+b)² = a² + 2ab + b²", "(a-b)² = a² - 2ab + b²", "a² - b² = (a+b)(a-b)"]', 1),

('topic_quadratic', 'subj_math', 'topic_algebra', 'Quadratic Equations', 'quadratic-equations', 'Solving and graphing quadratic equations',
'A quadratic equation has the standard form ax² + bx + c = 0. Solutions can be found using factoring, completing the square, or the quadratic formula.',
'["x = (-b ± √(b²-4ac)) / 2a", "Sum of roots = -b/a", "Product of roots = c/a", "Discriminant Δ = b² - 4ac"]', 1),

('topic_geometry', 'subj_math', NULL, 'Geometry', 'geometry', 'Study of shapes, sizes, and properties of space',
'Geometry deals with the properties, measurement, and relationships of points, lines, angles, surfaces, and solids.',
'["Area of circle = πr²", "Circumference = 2πr", "Area of triangle = ½bh", "Pythagorean theorem: a² + b² = c²"]', 2),

('topic_trigonometry', 'subj_math', NULL, 'Trigonometry', 'trigonometry', 'Study of triangles and trigonometric functions',
'Trigonometry studies relationships between side lengths and angles of triangles. The main functions are sine, cosine, and tangent.',
'["sin²θ + cos²θ = 1", "tan θ = sin θ / cos θ", "sin 2θ = 2 sin θ cos θ", "cos 2θ = cos²θ - sin²θ"]', 3),

('topic_calculus', 'subj_math', NULL, 'Calculus', 'calculus', 'Study of rates of change and accumulation',
'Calculus is the mathematical study of continuous change. It has two major branches: differential calculus and integral calculus.',
'["d/dx(xⁿ) = nxⁿ⁻¹", "∫xⁿdx = xⁿ⁺¹/(n+1) + C", "d/dx(sin x) = cos x", "d/dx(eˣ) = eˣ"]', 4),

('topic_statistics', 'subj_math', NULL, 'Statistics & Probability', 'statistics-probability', 'Analysis of data and chance',
'Statistics involves collecting, analyzing, and interpreting data. Probability measures the likelihood of events occurring.',
'["Mean = Σx/n", "Variance = Σ(x-μ)²/n", "P(A∪B) = P(A) + P(B) - P(A∩B)", "P(A|B) = P(A∩B)/P(B)"]', 5);

-- Insert Topics for Physics
INSERT INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order) VALUES
('topic_mechanics', 'subj_physics', NULL, 'Mechanics', 'mechanics', 'Study of motion and forces',
'Mechanics is the branch of physics dealing with motion and the forces that produce motion. It includes kinematics, dynamics, and statics.',
'["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "F = ma"]', 1),

('topic_kinematics', 'subj_physics', 'topic_mechanics', 'Kinematics', 'kinematics', 'Description of motion without considering forces',
'Kinematics describes motion using concepts of displacement, velocity, and acceleration without reference to the forces causing the motion.',
'["Average velocity = Δs/Δt", "Instantaneous velocity = ds/dt", "Acceleration = dv/dt", "Range = u²sin2θ/g"]', 1),

('topic_electricity', 'subj_physics', NULL, 'Electricity & Magnetism', 'electricity-magnetism', 'Study of electric charges and magnetic fields',
'This branch covers electric charges, electric fields, magnetic fields, and electromagnetic interactions.',
'["V = IR (Ohm''s Law)", "P = IV = I²R", "F = qE", "F = BIL"]', 2),

('topic_waves', 'subj_physics', NULL, 'Waves & Optics', 'waves-optics', 'Study of wave motion and light',
'Waves transfer energy without transferring matter. Optics is the study of light behavior including reflection, refraction, and diffraction.',
'["v = fλ", "n = c/v", "n₁sinθ₁ = n₂sinθ₂ (Snell''s Law)", "1/f = 1/u + 1/v"]', 3),

('topic_thermodynamics', 'subj_physics', NULL, 'Thermodynamics', 'thermodynamics', 'Study of heat and energy transfer',
'Thermodynamics studies the relationships between heat, work, temperature, and energy in physical systems.',
'["Q = mcΔT", "PV = nRT", "W = PΔV", "Efficiency = W/Q_in"]', 4),

('topic_modern_physics', 'subj_physics', NULL, 'Modern Physics', 'modern-physics', 'Quantum mechanics and relativity',
'Modern physics covers theories developed in the 20th century including quantum mechanics, special relativity, and atomic physics.',
'["E = mc²", "E = hf", "λ = h/mv", "ΔxΔp ≥ ℏ/2"]', 5);

-- Insert Topics for Chemistry
INSERT INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order) VALUES
('topic_atomic', 'subj_chemistry', NULL, 'Atomic Structure', 'atomic-structure', 'Structure of atoms and electron configuration',
'Atoms consist of protons, neutrons, and electrons. Understanding electron configuration is key to predicting chemical behavior.',
'["Mass number A = Z + N", "E = -13.6/n² eV (hydrogen)", "λ = h/mv (de Broglie)"]', 1),

('topic_bonding', 'subj_chemistry', NULL, 'Chemical Bonding', 'chemical-bonding', 'How atoms combine to form compounds',
'Chemical bonds form when atoms share or transfer electrons. Main types include ionic, covalent, and metallic bonds.',
'["Bond order = (bonding e⁻ - antibonding e⁻)/2", "Electronegativity difference determines bond type"]', 2),

('topic_stoichiometry', 'subj_chemistry', NULL, 'Stoichiometry', 'stoichiometry', 'Quantitative relationships in chemical reactions',
'Stoichiometry involves calculating the quantities of reactants and products in chemical reactions using balanced equations.',
'["n = m/M", "Molarity M = n/V", "PV = nRT", "% yield = (actual/theoretical) × 100"]', 3),

('topic_equilibrium', 'subj_chemistry', NULL, 'Chemical Equilibrium', 'chemical-equilibrium', 'Balance in reversible reactions',
'Chemical equilibrium occurs when the rates of forward and reverse reactions are equal. Le Chatelier''s principle predicts equilibrium shifts.',
'["Kc = [products]/[reactants]", "Kp = Kc(RT)^Δn", "ΔG = -RT ln K"]', 4),

('topic_organic', 'subj_chemistry', NULL, 'Organic Chemistry', 'organic-chemistry', 'Chemistry of carbon compounds',
'Organic chemistry studies carbon-containing compounds. It covers nomenclature, reactions, and properties of organic molecules.',
'["CₙH₂ₙ₊₂ (alkanes)", "CₙH₂ₙ (alkenes)", "CₙH₂ₙ₋₂ (alkynes)"]', 5),

('topic_electrochemistry', 'subj_chemistry', NULL, 'Electrochemistry', 'electrochemistry', 'Chemical reactions involving electricity',
'Electrochemistry studies the relationship between electrical energy and chemical changes, including batteries and electrolysis.',
'["E°cell = E°cathode - E°anode", "ΔG = -nFE°", "Faraday''s laws"]', 6);

-- Insert Topics for Biology
INSERT INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order) VALUES
('topic_cells', 'subj_biology', NULL, 'Cell Biology', 'cell-biology', 'Structure and function of cells',
'The cell is the basic unit of life. Understanding cell structure and organelle functions is fundamental to biology.',
'["Cell theory", "Prokaryotic vs Eukaryotic", "Organelle functions"]', 1),

('topic_genetics', 'subj_biology', NULL, 'Genetics', 'genetics', 'Study of heredity and variation',
'Genetics studies how traits are passed from parents to offspring through genes and DNA.',
'["Mendel''s laws", "Punnett squares", "DNA structure: A-T, G-C"]', 2),

('topic_ecology', 'subj_biology', NULL, 'Ecology', 'ecology', 'Study of organisms and their environment',
'Ecology examines the relationships between organisms and their environment, including ecosystems and biodiversity.',
'["Food chains/webs", "Energy flow (10% rule)", "Population dynamics"]', 3),

('topic_physiology', 'subj_biology', NULL, 'Human Physiology', 'human-physiology', 'Functions of the human body',
'Human physiology studies how the body''s organ systems work together to maintain life and health.',
'["Homeostasis", "Nervous system", "Circulatory system", "Respiratory system"]', 4),

('topic_biochemistry', 'subj_biology', NULL, 'Biochemistry', 'biochemistry', 'Chemical processes in living organisms',
'Biochemistry explores the chemical reactions that occur within living cells, including metabolism and enzyme function.',
'["ATP → ADP + P + energy", "Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "Cellular respiration"]', 5);

-- Insert Sample Questions for Mathematics (Round 1 - Fundamentals)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_math_001', 'topic_quadratic', 'subj_math', 'Solve for x: x² - 5x + 6 = 0', 'direct_answer', 'round_one', NULL, 'x = 2 or x = 3', 'Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3', 'easy', 3, 30),

('q_math_002', 'topic_quadratic', 'subj_math', 'What is the discriminant of 2x² + 3x - 5 = 0?', 'direct_answer', 'round_one', NULL, '49', 'Δ = b² - 4ac = 9 - 4(2)(-5) = 9 + 40 = 49', 'medium', 3, 30),

('q_math_003', 'topic_geometry', 'subj_math', 'A circle has radius 7 cm. What is its area?', 'direct_answer', 'round_one', NULL, '49π cm² or approximately 153.94 cm²', 'Area = πr² = π(7)² = 49π ≈ 153.94 cm²', 'easy', 3, 30),

('q_math_004', 'topic_trigonometry', 'subj_math', 'If sin θ = 3/5, what is cos θ? (θ is acute)', 'direct_answer', 'round_one', NULL, '4/5', 'Using sin²θ + cos²θ = 1: cos²θ = 1 - 9/25 = 16/25, so cos θ = 4/5', 'medium', 3, 30),

('q_math_005', 'topic_calculus', 'subj_math', 'Find d/dx(x³ + 2x² - 5x + 3)', 'direct_answer', 'round_one', NULL, '3x² + 4x - 5', 'Applying power rule: d/dx(xⁿ) = nxⁿ⁻¹', 'medium', 3, 30);

-- Insert Sample Questions for Physics (Round 1)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_phys_001', 'topic_kinematics', 'subj_physics', 'A car accelerates from rest at 2 m/s² for 5 seconds. What is its final velocity?', 'direct_answer', 'round_one', NULL, '10 m/s', 'Using v = u + at: v = 0 + (2)(5) = 10 m/s', 'easy', 3, 30),

('q_phys_002', 'topic_mechanics', 'subj_physics', 'A 10 kg object experiences a net force of 20 N. What is its acceleration?', 'direct_answer', 'round_one', NULL, '2 m/s²', 'Using F = ma: a = F/m = 20/10 = 2 m/s²', 'easy', 3, 30),

('q_phys_003', 'topic_electricity', 'subj_physics', 'A 12V battery is connected to a 4Ω resistor. What current flows?', 'direct_answer', 'round_one', NULL, '3 A', 'Using Ohm''s Law V = IR: I = V/R = 12/4 = 3 A', 'easy', 3, 30),

('q_phys_004', 'topic_waves', 'subj_physics', 'Light travels from air (n=1) into glass (n=1.5) at 30°. What is the angle of refraction?', 'direct_answer', 'round_one', NULL, '19.5° (approximately)', 'Using Snell''s Law: sin30°/sin r = 1.5, sin r = 0.333, r ≈ 19.5°', 'medium', 3, 30),

('q_phys_005', 'topic_thermodynamics', 'subj_physics', 'How much heat is needed to raise 2 kg of water by 10°C? (c = 4200 J/kg°C)', 'direct_answer', 'round_one', NULL, '84,000 J or 84 kJ', 'Q = mcΔT = 2 × 4200 × 10 = 84,000 J', 'medium', 3, 30);

-- Insert Sample Questions for Chemistry (Round 1)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_chem_001', 'topic_atomic', 'subj_chemistry', 'How many protons, neutrons, and electrons are in ²³Na (sodium-23)?', 'direct_answer', 'round_one', NULL, '11 protons, 12 neutrons, 11 electrons', 'Na has atomic number 11, so 11 protons and electrons. Neutrons = 23 - 11 = 12', 'easy', 3, 30),

('q_chem_002', 'topic_stoichiometry', 'subj_chemistry', 'What is the molar mass of H₂SO₄?', 'direct_answer', 'round_one', NULL, '98 g/mol', 'H₂SO₄: 2(1) + 32 + 4(16) = 2 + 32 + 64 = 98 g/mol', 'easy', 3, 30),

('q_chem_003', 'topic_bonding', 'subj_chemistry', 'What type of bond forms between sodium and chlorine?', 'direct_answer', 'round_one', NULL, 'Ionic bond', 'Sodium (metal) transfers an electron to chlorine (non-metal), forming Na⁺ and Cl⁻ ions', 'easy', 3, 30),

('q_chem_004', 'topic_equilibrium', 'subj_chemistry', 'For the reaction N₂ + 3H₂ ⇌ 2NH₃, write the expression for Kc', 'direct_answer', 'round_one', NULL, 'Kc = [NH₃]²/([N₂][H₂]³)', 'Products over reactants, each raised to their stoichiometric coefficient', 'medium', 3, 30),

('q_chem_005', 'topic_organic', 'subj_chemistry', 'What is the IUPAC name of CH₃CH₂CH₂OH?', 'direct_answer', 'round_one', NULL, 'Propan-1-ol or 1-propanol', '3-carbon alcohol with OH on carbon 1', 'medium', 3, 30);

-- Insert Sample Questions for Biology (Round 1)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_bio_001', 'topic_cells', 'subj_biology', 'What organelle is responsible for ATP production in eukaryotic cells?', 'direct_answer', 'round_one', NULL, 'Mitochondria', 'Mitochondria are the powerhouse of the cell, producing ATP through cellular respiration', 'easy', 3, 30),

('q_bio_002', 'topic_genetics', 'subj_biology', 'In humans, what is the diploid chromosome number?', 'direct_answer', 'round_one', NULL, '46', 'Humans have 23 pairs of chromosomes, totaling 46 chromosomes in diploid cells', 'easy', 3, 30),

('q_bio_003', 'topic_genetics', 'subj_biology', 'If a pea plant with genotype Tt is crossed with tt, what percentage of offspring will be tall?', 'direct_answer', 'round_one', NULL, '50%', 'Tt × tt gives Tt and tt in 1:1 ratio, so 50% will be tall (Tt)', 'medium', 3, 30),

('q_bio_004', 'topic_ecology', 'subj_biology', 'What percentage of energy is typically transferred between trophic levels?', 'direct_answer', 'round_one', NULL, '10%', 'The 10% rule states that only about 10% of energy is passed to the next trophic level', 'easy', 3, 30),

('q_bio_005', 'topic_biochemistry', 'subj_biology', 'What is the net ATP yield from glycolysis?', 'direct_answer', 'round_one', NULL, '2 ATP', 'Glycolysis produces 4 ATP but uses 2 ATP, giving a net yield of 2 ATP', 'medium', 3, 30);

-- Insert Speed Race Questions (Round 2)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_speed_001', 'topic_algebra', 'subj_math', 'What is 15² ?', 'direct_answer', 'speed_race', NULL, '225', '15 × 15 = 225', 'easy', 3, 10),
('q_speed_002', 'topic_algebra', 'subj_math', 'Simplify: √144 + √81', 'direct_answer', 'speed_race', NULL, '21', '12 + 9 = 21', 'easy', 3, 10),
('q_speed_003', 'topic_mechanics', 'subj_physics', 'What is the SI unit of force?', 'direct_answer', 'speed_race', NULL, 'Newton (N)', 'Force is measured in Newtons', 'easy', 3, 10),
('q_speed_004', 'topic_atomic', 'subj_chemistry', 'What is the chemical symbol for gold?', 'direct_answer', 'speed_race', NULL, 'Au', 'From Latin "aurum"', 'easy', 3, 10),
('q_speed_005', 'topic_cells', 'subj_biology', 'What is the process by which plants make food using sunlight?', 'direct_answer', 'speed_race', NULL, 'Photosynthesis', 'Plants use light energy to convert CO₂ and H₂O into glucose', 'easy', 3, 10),
('q_speed_006', 'topic_trigonometry', 'subj_math', 'What is sin 30°?', 'direct_answer', 'speed_race', NULL, '0.5 or 1/2', 'sin 30° = 1/2', 'easy', 3, 10),
('q_speed_007', 'topic_waves', 'subj_physics', 'What is the speed of light in vacuum?', 'direct_answer', 'speed_race', NULL, '3 × 10⁸ m/s or 300,000 km/s', 'Light travels at approximately 3 × 10⁸ m/s', 'easy', 3, 10),
('q_speed_008', 'topic_stoichiometry', 'subj_chemistry', 'What is Avogadro''s number?', 'direct_answer', 'speed_race', NULL, '6.02 × 10²³', 'One mole contains 6.02 × 10²³ particles', 'easy', 3, 10);

-- Insert True/False Questions (Round 4)
INSERT INTO questions (id, topic_id, subject_id, question_text, question_type, round_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES
('q_tf_001', 'topic_geometry', 'subj_math', 'The sum of interior angles of a hexagon is 720°', 'true_false', 'true_false', NULL, 'True', 'Sum = (n-2) × 180° = (6-2) × 180° = 720°', 'easy', 2, 30),
('q_tf_002', 'topic_calculus', 'subj_math', 'The derivative of e^x is e^x', 'true_false', 'true_false', NULL, 'True', 'd/dx(eˣ) = eˣ is a unique property of the exponential function', 'easy', 2, 10),
('q_tf_003', 'topic_electricity', 'subj_physics', 'In a series circuit, the current is the same through all components', 'true_false', 'true_false', NULL, 'True', 'Current is constant in series; voltage divides', 'easy', 2, 10),
('q_tf_004', 'topic_thermodynamics', 'subj_physics', 'Heat always flows from cold to hot objects', 'true_false', 'true_false', NULL, 'False', 'Heat naturally flows from hot to cold; the reverse requires work', 'easy', 2, 10),
('q_tf_005', 'topic_bonding', 'subj_chemistry', 'Ionic compounds conduct electricity when dissolved in water', 'true_false', 'true_false', NULL, 'True', 'When dissolved, ions are free to move and carry charge', 'easy', 2, 10),
('q_tf_006', 'topic_organic', 'subj_chemistry', 'All organic compounds must contain carbon and hydrogen only', 'true_false', 'true_false', NULL, 'False', 'Organic compounds contain carbon but can also have O, N, S, etc.', 'easy', 2, 10),
('q_tf_007', 'topic_genetics', 'subj_biology', 'DNA replication is semi-conservative', 'true_false', 'true_false', NULL, 'True', 'Each new DNA molecule contains one original strand and one new strand', 'easy', 2, 10),
('q_tf_008', 'topic_ecology', 'subj_biology', 'Producers form the base of all food chains', 'true_false', 'true_false', NULL, 'True', 'Producers (autotrophs) convert energy and form the first trophic level', 'easy', 2, 10);

-- Insert Riddles (Round 5)
INSERT INTO riddles (id, subject_id, answer, clue_1, clue_2, clue_3, clue_4, clue_5, difficulty) VALUES
('riddle_001', 'subj_math', 'Pi (π)',
'I am a number that never ends and never repeats',
'I am the ratio of a circle''s circumference to its diameter',
'My first digits are 3.14159...',
'I am named after a Greek letter',
'I am approximately 22/7',
'medium'),

('riddle_002', 'subj_physics', 'Black hole',
'I am a region in space from which nothing can escape',
'I am formed when massive stars collapse',
'Light cannot escape my grasp',
'I have an event horizon',
'Stephen Hawking studied me extensively',
'medium'),

('riddle_003', 'subj_chemistry', 'Oxygen',
'I am essential for combustion',
'I make up about 21% of Earth''s atmosphere',
'I was discovered by Joseph Priestley',
'I am produced by photosynthesis',
'My atomic number is 8',
'easy'),

('riddle_004', 'subj_biology', 'DNA',
'I am a double helix',
'I carry genetic information',
'Watson and Crick discovered my structure',
'I am found in the nucleus of cells',
'I am made of nucleotides containing A, T, G, and C',
'easy'),

('riddle_005', 'subj_math', 'Zero',
'I am neither positive nor negative',
'I am the additive identity',
'Any number multiplied by me gives me',
'I was invented in ancient India',
'Division by me is undefined',
'easy'),

('riddle_006', 'subj_physics', 'Gravity',
'I am one of the four fundamental forces',
'I am the weakest of these forces',
'I keep planets in orbit',
'Newton described me with an apple story',
'Einstein explained me as curved spacetime',
'easy'),

('riddle_007', 'subj_chemistry', 'Water',
'I am called the universal solvent',
'I have a bent molecular shape',
'I am densest at 4°C',
'My chemical formula has three atoms',
'I am essential for all known life',
'easy'),

('riddle_008', 'subj_biology', 'Mitochondria',
'I am known as the powerhouse of the cell',
'I have my own DNA',
'I produce ATP through cellular respiration',
'I have a double membrane',
'I may have once been a free-living bacterium',
'medium'),

('riddle_009', 'subj_math', 'Fibonacci sequence',
'I am a sequence where each number is the sum of the two preceding ones',
'I start with 0 and 1',
'I appear in nature in spiral patterns',
'I was introduced to Europe by an Italian mathematician',
'My ratio approaches the golden ratio',
'hard'),

('riddle_010', 'subj_physics', 'Photon',
'I am a quantum of light',
'I have no mass but carry energy',
'I travel at the fastest speed possible in the universe',
'Einstein explained the photoelectric effect using me',
'I exhibit wave-particle duality',
'medium');

-- Insert Achievements
INSERT INTO achievements (id, name, description, icon, requirement_type, requirement_value, xp_reward) VALUES
('ach_first_steps', 'First Steps', 'Answer your first question', 'Footprints', 'questions_answered', 1, 50),
('ach_scholar', 'Scholar', 'Answer 100 questions', 'GraduationCap', 'questions_answered', 100, 200),
('ach_master', 'Quiz Master', 'Answer 500 questions', 'Crown', 'questions_answered', 500, 500),
('ach_streak_3', 'Getting Started', 'Maintain a 3-day streak', 'Flame', 'streak_days', 3, 100),
('ach_streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'Flame', 'streak_days', 7, 250),
('ach_streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'Flame', 'streak_days', 30, 1000),
('ach_mastery_1', 'Topic Explorer', 'Master your first topic (80%+)', 'Star', 'mastery_level', 1, 150),
('ach_mastery_10', 'Knowledge Seeker', 'Master 10 topics', 'Stars', 'mastery_level', 10, 500),
('ach_xp_1000', 'Rising Star', 'Earn 1000 XP', 'TrendingUp', 'xp_earned', 1000, 100),
('ach_xp_10000', 'Superstar', 'Earn 10000 XP', 'Award', 'xp_earned', 10000, 500),
('ach_perfect', 'Perfectionist', 'Get a perfect round (all correct)', 'Target', 'perfect_rounds', 1, 300),
('ach_speed_demon', 'Speed Demon', 'Answer 10 speed questions in under 5 seconds each', 'Zap', 'speed_record', 10, 400);

-- Insert sample user for testing
INSERT INTO users (id, email, password_hash, name, role, house, year_group, xp_points, level, streak_days) VALUES
('user_demo', 'demo@stjohns.edu.gh', '$2a$10$demopasswordhash', 'Demo Student', 'student', 'Blue House', 3, 1500, 2, 5);
