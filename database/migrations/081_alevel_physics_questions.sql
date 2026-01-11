-- A-Level Physics Questions (40 questions)

-- Mechanics
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_001', 'topic_physics', 'subj_alevel_physics', 'alevel', 'A projectile is launched at 30° to the horizontal with initial velocity 20 m/s. Calculate the maximum height reached. (g = 10 m/s²)', 'calculation', NULL, '5 m', 'Vertical component = 20sin30° = 10 m/s. Using v² = u² - 2gh, h = 100/20 = 5 m', 'medium', 4, 3, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_002', 'topic_physics', 'subj_alevel_physics', 'alevel', 'State the conditions for a body to be in equilibrium.', 'short_answer', NULL, 'The resultant force must be zero and the resultant moment/torque about any point must be zero', 'Both translational and rotational equilibrium are required.', 'medium', 4, 3, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_003', 'topic_physics', 'subj_alevel_physics', 'alevel', 'A 2 kg mass on a spring oscillates with amplitude 0.1 m and period 0.5 s. Calculate the maximum kinetic energy.', 'calculation', NULL, '0.79 J', 'ω = 2π/T = 4π rad/s. Max KE = ½mω²A² = ½ × 2 × 16π² × 0.01 ≈ 0.79 J', 'hard', 4, 4, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_004', 'topic_physics', 'subj_alevel_physics', 'alevel', 'Define simple harmonic motion.', 'short_answer', NULL, 'Motion where acceleration is proportional to displacement from equilibrium and always directed towards the equilibrium position (a = -ω²x)', 'The negative sign indicates acceleration opposes displacement.', 'medium', 4, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_005', 'topic_physics', 'subj_alevel_physics', 'alevel', 'In circular motion, what provides the centripetal force for a car going around a banked curve?', 'multiple_choice', '["A. Friction only", "B. Normal reaction only", "C. Component of normal reaction and friction", "D. Weight of car"]', 'C', 'The horizontal component of normal reaction plus friction provide centripetal force.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

-- Gravitational Fields
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_006', 'topic_physics', 'subj_alevel_physics', 'alevel', 'State Newtons law of gravitation.', 'short_answer', NULL, 'The gravitational force between two point masses is proportional to the product of their masses and inversely proportional to the square of their separation: F = GMm/r²', 'G is the universal gravitational constant.', 'medium', 4, 3, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_007', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is gravitational potential at a point?', 'short_answer', NULL, 'The work done per unit mass in bringing a small test mass from infinity to that point. φ = -GM/r', 'Gravitational potential is always negative (takes work to escape).', 'hard', 4, 3, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_008', 'topic_physics', 'subj_alevel_physics', 'alevel', 'A satellite orbits Earth at height h above surface. If Earth radius is R, what is the orbital period?', 'multiple_choice', '["A. T = 2π√((R+h)³/GM)", "B. T = 2π√(R³/GM)", "C. T = 2π(R+h)/v", "D. T = 2πR/g"]', 'A', 'From T² = 4π²r³/GM where r = R + h', 'hard', 4, 2, NULL, 'board_cambridge', 'State');

-- Electric Fields
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_009', 'topic_physics', 'subj_alevel_physics', 'alevel', 'State Coulombs law.', 'short_answer', NULL, 'The electric force between two point charges is proportional to the product of charges and inversely proportional to the square of separation: F = kQ₁Q₂/r²', 'k = 1/(4πε₀) ≈ 9 × 10⁹ N m² C⁻²', 'medium', 4, 3, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_010', 'topic_physics', 'subj_alevel_physics', 'alevel', 'Calculate the electric field strength 0.5 m from a point charge of 2 μC.', 'calculation', NULL, '7.2 × 10⁴ N/C', 'E = kQ/r² = 9×10⁹ × 2×10⁻⁶ / 0.25 = 7.2 × 10⁴ N/C', 'medium', 4, 3, NULL, 'board_cambridge', 'Calculate');

-- Capacitance
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_011', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is the energy stored in a 100 μF capacitor charged to 12 V?', 'calculation', NULL, '7.2 mJ', 'E = ½CV² = ½ × 100×10⁻⁶ × 144 = 7.2 × 10⁻³ J', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_012', 'topic_physics', 'subj_alevel_physics', 'alevel', 'Two capacitors 4 μF and 6 μF are connected in series. Calculate total capacitance.', 'calculation', NULL, '2.4 μF', '1/C = 1/4 + 1/6 = 5/12, so C = 12/5 = 2.4 μF', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_013', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is the time constant of a capacitor-resistor circuit?', 'short_answer', NULL, 'The time constant τ = RC, representing the time for charge/voltage to reach 63% of final value (or fall to 37%)', 'After 5τ, the capacitor is considered fully charged/discharged.', 'medium', 4, 2, NULL, 'board_cambridge', 'Define');

-- Magnetic Fields
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_014', 'topic_physics', 'subj_alevel_physics', 'alevel', 'A wire of length 0.2 m carrying 5 A is perpendicular to a magnetic field of 0.3 T. Calculate the force.', 'calculation', NULL, '0.3 N', 'F = BIL = 0.3 × 5 × 0.2 = 0.3 N', 'easy', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_015', 'topic_physics', 'subj_alevel_physics', 'alevel', 'State Faradays law of electromagnetic induction.', 'short_answer', NULL, 'The induced EMF is equal to the rate of change of magnetic flux linkage: ε = -dΦ/dt or ε = -N(dφ/dt)', 'The negative sign indicates the induced EMF opposes the change (Lenzs law).', 'medium', 4, 3, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_016', 'topic_physics', 'subj_alevel_physics', 'alevel', 'A coil of 200 turns has flux through it changing from 5 mWb to 2 mWb in 0.1 s. Calculate the induced EMF.', 'calculation', NULL, '6 V', 'ε = N × Δφ/Δt = 200 × (3×10⁻³)/0.1 = 6 V', 'medium', 4, 3, NULL, 'board_cambridge', 'Calculate');

-- Waves and Quantum
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_017', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is the de Broglie wavelength of an electron with momentum 1.5 × 10⁻²⁴ kg m/s? (h = 6.63 × 10⁻³⁴ J s)', 'calculation', NULL, '4.4 × 10⁻¹⁰ m', 'λ = h/p = 6.63×10⁻³⁴ / 1.5×10⁻²⁴ = 4.4 × 10⁻¹⁰ m', 'hard', 4, 3, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_018', 'topic_physics', 'subj_alevel_physics', 'alevel', 'State what is meant by the photoelectric effect.', 'short_answer', NULL, 'The emission of electrons from a metal surface when electromagnetic radiation of sufficient frequency is incident on it', 'Demonstrates the particle nature of light (photons).', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_019', 'topic_physics', 'subj_alevel_physics', 'alevel', 'The work function of a metal is 2.0 eV. Calculate the threshold frequency. (h = 6.63 × 10⁻³⁴ J s, 1 eV = 1.6 × 10⁻¹⁹ J)', 'calculation', NULL, '4.8 × 10¹⁴ Hz', 'φ = hf₀, so f₀ = φ/h = (2.0 × 1.6×10⁻¹⁹)/(6.63×10⁻³⁴) = 4.8 × 10¹⁴ Hz', 'hard', 4, 3, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_020', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is wave-particle duality?', 'short_answer', NULL, 'The concept that all matter and radiation exhibits both wave and particle properties, depending on how it is observed', 'Light shows diffraction (wave) and photoelectric effect (particle).', 'medium', 4, 2, NULL, 'board_cambridge', 'Explain');

-- Nuclear Physics
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_021', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is binding energy per nucleon?', 'short_answer', NULL, 'The energy required to remove one nucleon from a nucleus, or the energy released when the nucleus is formed divided by the number of nucleons', 'Iron-56 has the highest binding energy per nucleon.', 'medium', 4, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_022', 'topic_physics', 'subj_alevel_physics', 'alevel', 'A radioactive sample has decay constant λ = 0.02 s⁻¹. Calculate the half-life.', 'calculation', NULL, '34.7 s', 't½ = ln2/λ = 0.693/0.02 = 34.7 s', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_023', 'topic_physics', 'subj_alevel_physics', 'alevel', 'In beta-minus decay, what particle is emitted from the nucleus?', 'multiple_choice', '["A. Proton and electron", "B. Electron and antineutrino", "C. Positron and neutrino", "D. Alpha particle"]', 'B', 'β⁻ decay: neutron → proton + electron + antineutrino', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_024', 'topic_physics', 'subj_alevel_physics', 'alevel', 'Calculate the energy equivalent of a mass defect of 0.03 u. (1 u = 931.5 MeV/c²)', 'calculation', NULL, '27.9 MeV', 'E = Δm × 931.5 = 0.03 × 931.5 = 27.9 MeV', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_025', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is the difference between nuclear fission and fusion?', 'short_answer', NULL, 'Fission: heavy nucleus splits into lighter nuclei. Fusion: light nuclei combine to form heavier nucleus. Both release energy due to increased binding energy per nucleon.', 'Fission used in reactors, fusion in stars.', 'medium', 4, 4, NULL, 'board_cambridge', 'Compare');

-- Thermodynamics
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_026', 'topic_physics', 'subj_alevel_physics', 'alevel', 'State the first law of thermodynamics.', 'short_answer', NULL, 'The increase in internal energy of a system equals the heat supplied plus the work done on it: ΔU = Q + W', 'This is conservation of energy for thermodynamic systems.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_027', 'topic_physics', 'subj_alevel_physics', 'alevel', 'An ideal gas expands isothermally. What happens to its internal energy?', 'multiple_choice', '["A. Increases", "B. Decreases", "C. Remains constant", "D. Depends on pressure"]', 'C', 'For an ideal gas, internal energy depends only on temperature.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_028', 'topic_physics', 'subj_alevel_physics', 'alevel', 'Calculate the work done when 2 moles of gas expand at constant pressure 100 kPa from 0.02 m³ to 0.05 m³.', 'calculation', NULL, '3000 J', 'W = pΔV = 100000 × 0.03 = 3000 J', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

-- Medical Physics / Imaging
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_029', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What property of X-rays makes them useful for medical imaging?', 'multiple_choice', '["A. Low penetration", "B. Different absorption by different tissues", "C. High wavelength", "D. Cannot be detected"]', 'B', 'Bone absorbs more X-rays than soft tissue, creating contrast.', 'easy', 4, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_030', 'topic_physics', 'subj_alevel_physics', 'alevel', 'Explain how a CT scan differs from a conventional X-ray.', 'short_answer', NULL, 'CT uses multiple X-ray images from different angles, processed by computer to create cross-sectional or 3D images. Conventional X-ray produces a single 2D projection.', 'CT provides better soft tissue contrast and 3D information.', 'hard', 4, 4, NULL, 'board_cambridge', 'Explain');

-- Additional mechanics/oscillations
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_031', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is resonance?', 'short_answer', NULL, 'When the driving frequency equals the natural frequency of a system, causing maximum amplitude oscillation', 'Resonance can be destructive (bridges) or useful (radio tuning).', 'medium', 4, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_032', 'topic_physics', 'subj_alevel_physics', 'alevel', 'A damped oscillator loses 10% of its energy per cycle. What is the Q-factor?', 'calculation', NULL, '63', 'Q = 2π × (energy stored / energy lost per cycle) = 2π / 0.1 ≈ 63', 'hard', 4, 3, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_033', 'topic_physics', 'subj_alevel_physics', 'alevel', 'State the principle of superposition of waves.', 'short_answer', NULL, 'When two or more waves meet, the resultant displacement is the vector sum of the individual displacements', 'This leads to constructive and destructive interference.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_034', 'topic_physics', 'subj_alevel_physics', 'alevel', 'Light of wavelength 600 nm passes through a diffraction grating with 500 lines/mm. Calculate the angle of the first order maximum.', 'calculation', NULL, '17.5°', 'd = 1/500000 = 2×10⁻⁶ m. sinθ = λ/d = 600×10⁻⁹/2×10⁻⁶ = 0.3. θ = 17.5°', 'hard', 4, 4, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_035', 'topic_physics', 'subj_alevel_physics', 'alevel', 'Explain what is meant by coherent sources.', 'short_answer', NULL, 'Sources that emit waves with a constant phase difference, same frequency, and similar amplitude', 'Required for stable interference patterns.', 'medium', 4, 2, NULL, 'board_cambridge', 'Explain');

-- Particle Physics
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_036', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What are the three generations of quarks?', 'short_answer', NULL, 'First: up, down. Second: charm, strange. Third: top, bottom.', 'Each has different mass, with third generation being heaviest.', 'hard', 4, 3, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_037', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is the quark composition of a proton?', 'multiple_choice', '["A. uuu", "B. uud", "C. udd", "D. ddd"]', 'B', 'Proton = uud (charge = 2/3 + 2/3 - 1/3 = +1)', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_038', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What are the four fundamental forces in nature?', 'short_answer', NULL, 'Gravitational, electromagnetic, strong nuclear, and weak nuclear forces', 'Listed in order of increasing strength (at subatomic scale).', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_039', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What is a lepton? Give two examples.', 'short_answer', NULL, 'A fundamental particle that does not experience the strong force. Examples: electron, muon, tau, neutrinos', 'Leptons have lepton number +1 (antileptons -1).', 'medium', 4, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_phy_040', 'topic_physics', 'subj_alevel_physics', 'alevel', 'What conservation laws must be obeyed in particle interactions?', 'short_answer', NULL, 'Conservation of: energy, momentum, charge, baryon number, lepton number, and strangeness (in strong interactions)', 'These determine which reactions are possible.', 'hard', 4, 4, NULL, 'board_cambridge', 'State');
