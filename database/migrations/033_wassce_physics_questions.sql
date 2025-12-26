-- Migration 033: WASSCE Physics Questions
-- 50 questions for 2024 Paper 1

INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Mechanics (Questions 1-15)
('q_phy_2024_001', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The SI unit of momentum is:', 'multiple_choice', '["A. kg/m/s", "B. kg⋅m/s", "C. kg⋅m/s²", "D. N⋅s²"]', 'B', 'Momentum = mass × velocity = kg × m/s = kg⋅m/s. This is equivalent to N⋅s.', 'easy', 1, 1),

('q_phy_2024_002', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'A body moving with uniform velocity has:', 'multiple_choice', '["A. Zero acceleration", "B. Constant acceleration", "C. Increasing acceleration", "D. Decreasing acceleration"]', 'A', 'Uniform velocity means no change in velocity, hence zero acceleration.', 'easy', 1, 2),

('q_phy_2024_003', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Newton''s first law of motion is also called the law of:', 'multiple_choice', '["A. Acceleration", "B. Action and reaction", "C. Inertia", "D. Conservation"]', 'C', 'Newton''s first law describes inertia - the tendency of objects to resist changes in motion.', 'easy', 1, 3),

('q_phy_2024_004', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'A ball is thrown vertically upward. At the maximum height, its:', 'multiple_choice', '["A. Velocity and acceleration are both zero", "B. Velocity is zero but acceleration is not zero", "C. Velocity is maximum and acceleration is zero", "D. Both velocity and acceleration are maximum"]', 'B', 'At maximum height, velocity is zero but acceleration due to gravity (g) still acts.', 'medium', 1, 4),

('q_phy_2024_005', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'If a force of 10N acts on a body of mass 2kg, the acceleration is:', 'multiple_choice', '["A. 5 m/s²", "B. 20 m/s²", "C. 0.2 m/s²", "D. 12 m/s²"]', 'A', 'F = ma, so a = F/m = 10/2 = 5 m/s².', 'easy', 1, 5),

('q_phy_2024_006', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The principle of conservation of linear momentum applies to:', 'multiple_choice', '["A. Open systems only", "B. Closed or isolated systems", "C. All systems", "D. Systems with external forces"]', 'B', 'Momentum is conserved only in closed/isolated systems with no external forces.', 'medium', 1, 6),

('q_phy_2024_007', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The moment of a force is also known as:', 'multiple_choice', '["A. Impulse", "B. Momentum", "C. Torque", "D. Power"]', 'C', 'Torque (or moment) is the rotational effect of a force about a pivot.', 'easy', 1, 7),

('q_phy_2024_008', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'A machine has mechanical advantage 4 and velocity ratio 5. Its efficiency is:', 'multiple_choice', '["A. 20%", "B. 80%", "C. 125%", "D. 1.25%"]', 'B', 'Efficiency = (MA/VR) × 100% = (4/5) × 100% = 80%.', 'medium', 1, 8),

('q_phy_2024_009', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Work done against gravity in lifting a 5kg mass through 2m is (g = 10m/s²):', 'multiple_choice', '["A. 10 J", "B. 25 J", "C. 100 J", "D. 50 J"]', 'C', 'Work = mgh = 5 × 10 × 2 = 100 J.', 'easy', 1, 9),

('q_phy_2024_010', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The unit of power is:', 'multiple_choice', '["A. Joule", "B. Watt", "C. Newton", "D. Pascal"]', 'B', 'Power is measured in Watts (W), where 1 W = 1 J/s.', 'easy', 1, 10),

('q_phy_2024_011', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'A body of mass 2kg is moving with velocity 3m/s. Its kinetic energy is:', 'multiple_choice', '["A. 3 J", "B. 6 J", "C. 9 J", "D. 18 J"]', 'C', 'KE = ½mv² = ½ × 2 × 3² = ½ × 2 × 9 = 9 J.', 'easy', 1, 11),

('q_phy_2024_012', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The center of gravity of a uniform rod is at its:', 'multiple_choice', '["A. One end", "B. Geometric center", "C. Outer surface", "D. Quarter length"]', 'B', 'For a uniform rod, the center of gravity is at its geometric center.', 'easy', 1, 12),

('q_phy_2024_013', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Projectile motion is an example of:', 'multiple_choice', '["A. Linear motion", "B. Circular motion", "C. Two-dimensional motion", "D. One-dimensional motion"]', 'C', 'Projectile motion involves motion in two dimensions (horizontal and vertical).', 'medium', 1, 13),

('q_phy_2024_014', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The escape velocity of the Earth depends on:', 'multiple_choice', '["A. Mass of the escaping body only", "B. Mass and radius of the Earth", "C. Velocity of Earth''s rotation", "D. Time of the day"]', 'B', 'Escape velocity = √(2GM/R), depending on Earth''s mass and radius.', 'hard', 1, 14),

('q_phy_2024_015', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'A simple pendulum has time period 2s. If its length is doubled, the new time period is:', 'multiple_choice', '["A. 4s", "B. 2√2 s", "C. 1s", "D. √2 s"]', 'B', 'T ∝ √L. If L doubles, T becomes 2 × √2 = 2√2 s.', 'hard', 1, 15),

-- Heat and Thermodynamics (Questions 16-25)
('q_phy_2024_016', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The boiling point of water at standard atmospheric pressure is:', 'multiple_choice', '["A. 373K", "B. 273K", "C. 100K", "D. 0K"]', 'A', '100°C = 100 + 273 = 373K.', 'easy', 1, 16),

('q_phy_2024_017', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Heat transfer by convection occurs in:', 'multiple_choice', '["A. Solids only", "B. Liquids and gases", "C. Vacuum", "D. Solids and vacuum"]', 'B', 'Convection requires fluid movement, occurring in liquids and gases.', 'easy', 1, 17),

('q_phy_2024_018', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The specific heat capacity of a substance is the amount of heat required to:', 'multiple_choice', '["A. Melt 1kg of the substance", "B. Raise the temperature of 1kg by 1°C", "C. Boil 1kg of the substance", "D. Change the state of 1kg"]', 'B', 'Specific heat capacity is heat needed to raise 1kg of a substance by 1K or 1°C.', 'easy', 1, 18),

('q_phy_2024_019', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'When ice melts at 0°C, its temperature:', 'multiple_choice', '["A. Increases", "B. Decreases", "C. Remains constant", "D. First increases then decreases"]', 'C', 'During phase change, temperature remains constant as latent heat is absorbed.', 'easy', 1, 19),

('q_phy_2024_020', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The thermos flask prevents heat loss by:', 'multiple_choice', '["A. Conduction only", "B. Convection only", "C. Radiation only", "D. Conduction, convection, and radiation"]', 'D', 'Thermos flask design minimizes all three modes of heat transfer.', 'medium', 1, 20),

('q_phy_2024_021', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Linear expansivity has units of:', 'multiple_choice', '["A. m/°C", "B. K⁻¹ or °C⁻¹", "C. J/K", "D. m²/K"]', 'B', 'Linear expansivity α = ΔL/(L₀ΔT), with units of per degree (K⁻¹ or °C⁻¹).', 'medium', 1, 21),

('q_phy_2024_022', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'At absolute zero temperature:', 'multiple_choice', '["A. All molecular motion stops", "B. All substances melt", "C. All gases liquefy", "D. Pressure increases"]', 'A', 'Absolute zero (0K = -273.15°C) is where molecular motion theoretically stops.', 'medium', 1, 22),

('q_phy_2024_023', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Evaporation causes cooling because:', 'multiple_choice', '["A. Fast-moving molecules escape", "B. Slow-moving molecules escape", "C. All molecules escape equally", "D. Temperature increases"]', 'A', 'Faster (higher energy) molecules escape, leaving slower ones and lowering temperature.', 'medium', 1, 23),

('q_phy_2024_024', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The gas equation PV = nRT represents:', 'multiple_choice', '["A. Boyle''s law only", "B. Charles'' law only", "C. Ideal gas equation", "D. Gay-Lussac''s law"]', 'C', 'PV = nRT is the ideal gas equation combining Boyle''s and Charles'' laws.', 'medium', 1, 24),

('q_phy_2024_025', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'If 500J of heat is supplied to a system and 300J of work is done by the system, the change in internal energy is:', 'multiple_choice', '["A. 800 J", "B. 200 J", "C. -200 J", "D. 500 J"]', 'B', 'ΔU = Q - W = 500 - 300 = 200 J (First law of thermodynamics).', 'hard', 1, 25),

-- Waves and Optics (Questions 26-35)
('q_phy_2024_026', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The speed of a wave is given by:', 'multiple_choice', '["A. v = λ/f", "B. v = λf", "C. v = f/λ", "D. v = λ + f"]', 'B', 'Wave speed = frequency × wavelength, or v = fλ.', 'easy', 1, 26),

('q_phy_2024_027', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Sound waves are:', 'multiple_choice', '["A. Transverse waves", "B. Electromagnetic waves", "C. Longitudinal waves", "D. Stationary waves"]', 'C', 'Sound waves are longitudinal, with compressions and rarefactions.', 'easy', 1, 27),

('q_phy_2024_028', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The phenomenon of two waves combining is called:', 'multiple_choice', '["A. Refraction", "B. Diffraction", "C. Interference", "D. Polarization"]', 'C', 'Interference occurs when two waves combine constructively or destructively.', 'easy', 1, 28),

('q_phy_2024_029', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The refractive index of a medium is the ratio of:', 'multiple_choice', '["A. Speed of light in medium to speed in vacuum", "B. Speed of light in vacuum to speed in medium", "C. Wavelength in medium to wavelength in vacuum", "D. Frequency in vacuum to frequency in medium"]', 'B', 'n = c/v = speed in vacuum / speed in medium.', 'medium', 1, 29),

('q_phy_2024_030', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Total internal reflection occurs when light travels from:', 'multiple_choice', '["A. Less dense to denser medium", "B. Denser to less dense medium at angle greater than critical angle", "C. Any medium to vacuum", "D. Vacuum to any medium"]', 'B', 'TIR occurs when light goes from denser to less dense medium at angle > critical angle.', 'medium', 1, 30),

('q_phy_2024_031', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'A convex lens can form:', 'multiple_choice', '["A. Only real images", "B. Only virtual images", "C. Both real and virtual images", "D. No images"]', 'C', 'Convex lens forms real images when object is beyond F, virtual when between F and lens.', 'medium', 1, 31),

('q_phy_2024_032', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The power of a lens is measured in:', 'multiple_choice', '["A. Meters", "B. Diopters", "C. Watts", "D. Joules"]', 'B', 'Power of lens P = 1/f (in meters), measured in diopters (D).', 'easy', 1, 32),

('q_phy_2024_033', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Dispersion of light is the separation of white light into:', 'multiple_choice', '["A. Two colors", "B. Three colors", "C. Seven colors", "D. Infinite colors"]', 'C', 'A prism disperses white light into seven colors (ROYGBIV).', 'easy', 1, 33),

('q_phy_2024_034', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Echoes are due to:', 'multiple_choice', '["A. Refraction of sound", "B. Reflection of sound", "C. Diffraction of sound", "D. Absorption of sound"]', 'B', 'Echoes are caused by reflection of sound from surfaces.', 'easy', 1, 34),

('q_phy_2024_035', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The image formed by a concave mirror when object is at the center of curvature is:', 'multiple_choice', '["A. Virtual and magnified", "B. Real, inverted, and same size", "C. Real and diminished", "D. Virtual and same size"]', 'B', 'At C, image is real, inverted, and same size as object.', 'medium', 1, 35),

-- Electricity and Magnetism (Questions 36-45)
('q_phy_2024_036', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Electric current is the flow of:', 'multiple_choice', '["A. Positive charges only", "B. Negative charges only", "C. Both positive and negative charges", "D. Neutral particles"]', 'C', 'Current is the flow of charges (conventionally positive, actually electrons in conductors).', 'easy', 1, 36),

('q_phy_2024_037', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Ohm''s law states that:', 'multiple_choice', '["A. V = I/R", "B. V = IR", "C. R = VI", "D. I = VR"]', 'B', 'Ohm''s law: V = IR (Voltage = Current × Resistance).', 'easy', 1, 37),

('q_phy_2024_038', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'In a series circuit, the total resistance is:', 'multiple_choice', '["A. Less than any individual resistance", "B. Sum of all resistances", "C. Product of all resistances", "D. Average of all resistances"]', 'B', 'In series, R_total = R₁ + R₂ + R₃ + ...', 'easy', 1, 38),

('q_phy_2024_039', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The unit of electric charge is:', 'multiple_choice', '["A. Ampere", "B. Volt", "C. Coulomb", "D. Ohm"]', 'C', 'Electric charge is measured in Coulombs (C).', 'easy', 1, 39),

('q_phy_2024_040', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Electrical energy is given by:', 'multiple_choice', '["A. E = Pt", "B. E = P/t", "C. E = t/P", "D. E = P + t"]', 'A', 'Electrical energy E = Pt (Power × time).', 'easy', 1, 40),

('q_phy_2024_041', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'A transformer works on the principle of:', 'multiple_choice', '["A. Electrostatics", "B. Electromagnetic induction", "C. Thermoelectric effect", "D. Photoelectric effect"]', 'B', 'Transformers use electromagnetic induction to change voltage levels.', 'medium', 1, 41),

('q_phy_2024_042', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The direction of induced current is given by:', 'multiple_choice', '["A. Ohm''s law", "B. Faraday''s law", "C. Lenz''s law", "D. Coulomb''s law"]', 'C', 'Lenz''s law states induced current opposes the change that causes it.', 'medium', 1, 42),

('q_phy_2024_043', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'A step-down transformer:', 'multiple_choice', '["A. Increases voltage", "B. Decreases voltage", "C. Increases current and voltage", "D. Has more primary turns than secondary"]', 'B', 'Step-down transformer decreases voltage (more primary turns than secondary).', 'medium', 1, 43),

('q_phy_2024_044', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The magnetic field around a straight current-carrying conductor is:', 'multiple_choice', '["A. Radial", "B. Circular", "C. Straight", "D. Helical"]', 'B', 'Magnetic field lines form concentric circles around a straight wire carrying current.', 'medium', 1, 44),

('q_phy_2024_045', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'An ammeter is connected in a circuit in:', 'multiple_choice', '["A. Series", "B. Parallel", "C. Either series or parallel", "D. Neither series nor parallel"]', 'A', 'Ammeter is connected in series to measure current flowing through the circuit.', 'easy', 1, 45),

-- Modern Physics (Questions 46-50)
('q_phy_2024_046', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Radioactivity was discovered by:', 'multiple_choice', '["A. Marie Curie", "B. Henri Becquerel", "C. Ernest Rutherford", "D. Albert Einstein"]', 'B', 'Henri Becquerel discovered radioactivity in 1896.', 'medium', 1, 46),

('q_phy_2024_047', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Alpha particles are:', 'multiple_choice', '["A. Electrons", "B. Protons", "C. Helium nuclei", "D. Neutrons"]', 'B', 'Alpha particles are helium nuclei (2 protons + 2 neutrons).', 'easy', 1, 47),

('q_phy_2024_048', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'The half-life of a radioactive element is the time taken for:', 'multiple_choice', '["A. All atoms to decay", "B. Half the atoms to decay", "C. The activity to double", "D. The mass to double"]', 'B', 'Half-life is the time for half the radioactive atoms to decay.', 'easy', 1, 48),

('q_phy_2024_049', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'Einstein''s mass-energy relation is:', 'multiple_choice', '["A. E = mc", "B. E = mc²", "C. E = m²c", "D. E = m/c²"]', 'B', 'E = mc² relates mass and energy in special relativity.', 'easy', 1, 49),

('q_phy_2024_050', 'subj_wassce_physics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_phy_2024_1', 'In a nuclear reactor, the moderator is used to:', 'multiple_choice', '["A. Speed up neutrons", "B. Slow down neutrons", "C. Absorb all neutrons", "D. Produce neutrons"]', 'B', 'The moderator slows down fast neutrons to sustain the chain reaction.', 'medium', 1, 50);
