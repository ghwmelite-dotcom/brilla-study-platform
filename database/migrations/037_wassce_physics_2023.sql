-- Migration 037: WASSCE Physics 2023 Questions (50 questions)
-- Covers: Mechanics, Waves, Electricity, Magnetism, Heat, Modern Physics

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, time_limit) VALUES

-- Mechanics (Questions 1-10)
('q_wassce_phy_2023_01', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'A car accelerates uniformly from rest to a velocity of 20 m/s in 5 seconds. What is its acceleration?', 'multiple_choice', '["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"]', 'B', 'Acceleration = (v - u)/t = (20 - 0)/5 = 4 m/s². Using the formula for uniform acceleration where u = initial velocity (0), v = final velocity (20 m/s), and t = time (5 s).', 'medium', 2, 90),

('q_wassce_phy_2023_02', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'Which of the following is a vector quantity?', 'multiple_choice', '["Speed", "Mass", "Temperature", "Velocity"]', 'D', 'Velocity is a vector quantity because it has both magnitude and direction. Speed, mass, and temperature are scalar quantities - they have magnitude only.', 'easy', 2, 60),

('q_wassce_phy_2023_03', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'A ball is thrown vertically upward with a velocity of 30 m/s. What is the maximum height reached? (g = 10 m/s²)', 'multiple_choice', '["30 m", "45 m", "60 m", "90 m"]', 'B', 'At maximum height, v = 0. Using v² = u² - 2gh: 0 = 30² - 2(10)h. Therefore h = 900/20 = 45 m.', 'medium', 2, 120),

('q_wassce_phy_2023_04', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'Newton''s first law of motion is also known as the law of:', 'multiple_choice', '["Acceleration", "Action and reaction", "Inertia", "Gravitation"]', 'C', 'Newton''s first law states that a body remains at rest or in uniform motion unless acted upon by an external force. This property of matter to resist change in its state of motion is called inertia.', 'easy', 2, 60),

('q_wassce_phy_2023_05', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'A force of 50 N acts on a body of mass 10 kg. What is the acceleration produced?', 'multiple_choice', '["0.5 m/s²", "5 m/s²", "50 m/s²", "500 m/s²"]', 'B', 'Using Newton''s second law: F = ma. Therefore a = F/m = 50/10 = 5 m/s².', 'easy', 2, 60),

('q_wassce_phy_2023_06', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'The moment of a force about a point is measured in:', 'multiple_choice', '["Newton", "Joule", "Newton-meter", "Watt"]', 'C', 'Moment = Force × perpendicular distance. The unit is Newton × meter = Newton-meter (Nm). Note: While Nm is dimensionally equivalent to Joule, moment is conventionally expressed in Nm.', 'easy', 2, 60),

('q_wassce_phy_2023_07', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'A body of mass 2 kg moving with velocity 6 m/s collides with a stationary body of mass 4 kg. If they stick together after collision, what is their common velocity?', 'multiple_choice', '["1 m/s", "2 m/s", "3 m/s", "4 m/s"]', 'B', 'Using conservation of momentum: m₁u₁ + m₂u₂ = (m₁ + m₂)v. 2(6) + 4(0) = (2 + 4)v. 12 = 6v. v = 2 m/s.', 'medium', 2, 120),

('q_wassce_phy_2023_08', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'Work done is said to be zero when:', 'multiple_choice', '["Force is applied in the direction of motion", "Force is applied at an angle to the direction of motion", "Force is perpendicular to the direction of motion", "Force causes the body to accelerate"]', 'C', 'Work = Force × displacement × cos θ. When force is perpendicular to displacement (θ = 90°), cos 90° = 0, so work done = 0.', 'medium', 2, 90),

('q_wassce_phy_2023_09', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'The efficiency of a machine is 75%. If the work input is 200 J, what is the work output?', 'multiple_choice', '["75 J", "100 J", "150 J", "175 J"]', 'C', 'Efficiency = (Work output/Work input) × 100%. 75 = (Work output/200) × 100. Work output = (75 × 200)/100 = 150 J.', 'medium', 2, 90),

('q_wassce_phy_2023_10', 'topic_mechanics', 'subj_physics', 'pp_wassce_phy_2023_1', 'A machine has a velocity ratio of 5 and an efficiency of 80%. What is its mechanical advantage?', 'multiple_choice', '["4", "5", "6.25", "8"]', 'A', 'Efficiency = (MA/VR) × 100%. 80 = (MA/5) × 100. MA = (80 × 5)/100 = 4.', 'medium', 2, 90),

-- Waves (Questions 11-20)
('q_wassce_phy_2023_11', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'A wave has a frequency of 500 Hz and wavelength of 0.6 m. Calculate the velocity of the wave.', 'multiple_choice', '["30 m/s", "300 m/s", "500 m/s", "3000 m/s"]', 'B', 'Wave velocity v = fλ = 500 × 0.6 = 300 m/s.', 'easy', 2, 60),

('q_wassce_phy_2023_12', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'Which of the following waves requires a material medium for propagation?', 'multiple_choice', '["Light waves", "Radio waves", "Sound waves", "X-rays"]', 'C', 'Sound waves are mechanical waves that require a material medium (solid, liquid, or gas) to propagate. Light, radio waves, and X-rays are electromagnetic waves that can travel through vacuum.', 'easy', 2, 60),

('q_wassce_phy_2023_13', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'The phenomenon of sound waves bending around corners is called:', 'multiple_choice', '["Reflection", "Refraction", "Diffraction", "Interference"]', 'C', 'Diffraction is the bending of waves around obstacles or through openings. Sound waves can bend around corners because their wavelength is comparable to the size of typical obstacles.', 'easy', 2, 60),

('q_wassce_phy_2023_14', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'Two waves of the same frequency and amplitude traveling in the same direction undergo superposition. If they are in phase, the resulting amplitude is:', 'multiple_choice', '["Zero", "Half the original", "Same as original", "Twice the original"]', 'D', 'When two waves of equal amplitude A are in phase (constructive interference), the resultant amplitude = A + A = 2A, which is twice the original amplitude.', 'medium', 2, 90),

('q_wassce_phy_2023_15', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'An object placed 20 cm in front of a plane mirror produces an image at a distance of:', 'multiple_choice', '["10 cm behind the mirror", "20 cm behind the mirror", "40 cm behind the mirror", "20 cm in front of the mirror"]', 'B', 'For a plane mirror, the image distance equals the object distance. If the object is 20 cm in front, the image appears 20 cm behind the mirror.', 'easy', 2, 60),

('q_wassce_phy_2023_16', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'The critical angle for a medium is 42°. What is its refractive index?', 'multiple_choice', '["0.67", "1.00", "1.49", "1.67"]', 'C', 'Refractive index n = 1/sin C = 1/sin 42° = 1/0.669 ≈ 1.49.', 'medium', 2, 90),

('q_wassce_phy_2023_17', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'A convex lens has a focal length of 20 cm. What is its power?', 'multiple_choice', '["0.05 D", "2 D", "5 D", "20 D"]', 'C', 'Power P = 1/f (where f is in meters). P = 1/0.20 = 5 D (diopters).', 'easy', 2, 60),

('q_wassce_phy_2023_18', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'Which color of light has the longest wavelength?', 'multiple_choice', '["Violet", "Blue", "Green", "Red"]', 'D', 'In the visible spectrum, red light has the longest wavelength (approximately 700 nm), while violet has the shortest (approximately 400 nm).', 'easy', 2, 60),

('q_wassce_phy_2023_19', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'A vibrating tuning fork produces 256 vibrations in 2 seconds. The frequency of the fork is:', 'multiple_choice', '["64 Hz", "128 Hz", "256 Hz", "512 Hz"]', 'B', 'Frequency = number of vibrations/time = 256/2 = 128 Hz.', 'easy', 2, 60),

('q_wassce_phy_2023_20', 'topic_waves', 'subj_physics', 'pp_wassce_phy_2023_1', 'The quality of sound that distinguishes between two notes of the same pitch and loudness is called:', 'multiple_choice', '["Pitch", "Loudness", "Timbre", "Frequency"]', 'C', 'Timbre (or quality) is the characteristic that allows us to distinguish between sounds of the same pitch and loudness from different sources. It depends on the presence and relative intensities of overtones.', 'medium', 2, 90),

-- Electricity (Questions 21-30)
('q_wassce_phy_2023_21', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'Three resistors of 2 Ω, 3 Ω, and 6 Ω are connected in parallel. What is the equivalent resistance?', 'multiple_choice', '["0.5 Ω", "1 Ω", "2 Ω", "11 Ω"]', 'B', '1/R = 1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 6/6 = 1. Therefore R = 1 Ω.', 'medium', 2, 120),

('q_wassce_phy_2023_22', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'A current of 2 A flows through a conductor for 5 minutes. What is the total charge that flows?', 'multiple_choice', '["10 C", "100 C", "600 C", "1000 C"]', 'C', 'Q = It = 2 × (5 × 60) = 2 × 300 = 600 C. Remember to convert minutes to seconds.', 'easy', 2, 60),

('q_wassce_phy_2023_23', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'The unit of electrical resistance is:', 'multiple_choice', '["Ampere", "Volt", "Ohm", "Watt"]', 'C', 'The SI unit of electrical resistance is the Ohm (Ω), named after Georg Ohm. 1 Ohm = 1 Volt/1 Ampere.', 'easy', 2, 60),

('q_wassce_phy_2023_24', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'A 60 W bulb is used for 5 hours daily. How many kilowatt-hours of energy does it consume in 30 days?', 'multiple_choice', '["3 kWh", "9 kWh", "30 kWh", "90 kWh"]', 'B', 'Energy = Power × time = 60 W × 5 h × 30 days = 9000 Wh = 9 kWh.', 'medium', 2, 90),

('q_wassce_phy_2023_25', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'Which of the following materials is the best conductor of electricity?', 'multiple_choice', '["Wood", "Glass", "Rubber", "Copper"]', 'D', 'Copper is an excellent conductor of electricity due to its low resistivity and the availability of free electrons. Wood, glass, and rubber are insulators.', 'easy', 2, 60),

('q_wassce_phy_2023_26', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'In a circuit, a voltmeter is always connected:', 'multiple_choice', '["In series with the component", "In parallel with the component", "Before the ammeter", "After the power source only"]', 'B', 'A voltmeter measures potential difference and must be connected in parallel with the component across which voltage is to be measured. It has high resistance to minimize current drawn.', 'easy', 2, 60),

('q_wassce_phy_2023_27', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'The e.m.f of a cell is 2 V and its internal resistance is 0.5 Ω. What is the current when connected to an external resistance of 1.5 Ω?', 'multiple_choice', '["0.5 A", "1 A", "2 A", "4 A"]', 'B', 'I = E/(R + r) = 2/(1.5 + 0.5) = 2/2 = 1 A. Where E is e.m.f, R is external resistance, and r is internal resistance.', 'medium', 2, 90),

('q_wassce_phy_2023_28', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'The relationship between current (I), voltage (V), and resistance (R) is given by:', 'multiple_choice', '["V = I/R", "V = IR", "I = VR", "R = VI"]', 'B', 'Ohm''s law states that V = IR, where V is voltage in volts, I is current in amperes, and R is resistance in ohms.', 'easy', 2, 60),

('q_wassce_phy_2023_29', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'The heating effect of electric current is used in:', 'multiple_choice', '["Electric motor", "Electric bell", "Electric iron", "Electric generator"]', 'C', 'An electric iron uses the heating effect of current (Joule heating). Current flowing through a high-resistance element converts electrical energy to heat energy.', 'easy', 2, 60),

('q_wassce_phy_2023_30', 'topic_electricity', 'subj_physics', 'pp_wassce_phy_2023_1', 'A capacitor of capacitance 10 μF is connected to a 100 V supply. What is the charge stored?', 'multiple_choice', '["0.001 C", "0.01 C", "0.1 C", "1 C"]', 'A', 'Q = CV = 10 × 10⁻⁶ × 100 = 1000 × 10⁻⁶ = 0.001 C = 1 mC.', 'medium', 2, 90),

-- Magnetism and Electromagnetism (Questions 31-40)
('q_wassce_phy_2023_31', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'The region around a magnet where its influence can be felt is called:', 'multiple_choice', '["Magnetic pole", "Magnetic domain", "Magnetic field", "Magnetic axis"]', 'C', 'The magnetic field is the region around a magnet where magnetic forces can be detected. It can be represented by magnetic field lines.', 'easy', 2, 60),

('q_wassce_phy_2023_32', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'Which of the following is NOT a magnetic material?', 'multiple_choice', '["Iron", "Nickel", "Cobalt", "Aluminum"]', 'D', 'Iron, nickel, and cobalt are ferromagnetic materials that can be strongly magnetized. Aluminum is paramagnetic and shows only weak magnetic properties.', 'easy', 2, 60),

('q_wassce_phy_2023_33', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'The principle of an electric motor is based on:', 'multiple_choice', '["Electromagnetic induction", "Heating effect of current", "Force on a current-carrying conductor in a magnetic field", "Electrolysis"]', 'C', 'An electric motor works on the principle that a current-carrying conductor placed in a magnetic field experiences a force (F = BIL). This force causes the rotation of the motor coil.', 'medium', 2, 90),

('q_wassce_phy_2023_34', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'Electromagnetic induction was discovered by:', 'multiple_choice', '["Ohm", "Faraday", "Newton", "Ampere"]', 'B', 'Michael Faraday discovered electromagnetic induction in 1831. He showed that a changing magnetic field induces an electromotive force (e.m.f) in a conductor.', 'easy', 2, 60),

('q_wassce_phy_2023_35', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'The device that converts mechanical energy to electrical energy is called:', 'multiple_choice', '["Motor", "Generator", "Transformer", "Capacitor"]', 'B', 'A generator (dynamo) converts mechanical energy to electrical energy using electromagnetic induction. A motor does the opposite - converts electrical energy to mechanical energy.', 'easy', 2, 60),

('q_wassce_phy_2023_36', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'A transformer has 200 turns in the primary coil and 1000 turns in the secondary coil. If the primary voltage is 240 V, what is the secondary voltage?', 'multiple_choice', '["48 V", "240 V", "1000 V", "1200 V"]', 'D', 'Vs/Vp = Ns/Np. Vs = Vp × Ns/Np = 240 × 1000/200 = 1200 V. This is a step-up transformer.', 'medium', 2, 90),

('q_wassce_phy_2023_37', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'Lenz''s law is a consequence of the law of conservation of:', 'multiple_choice', '["Mass", "Charge", "Energy", "Momentum"]', 'C', 'Lenz''s law states that induced current opposes the change that produces it. This is a consequence of the conservation of energy - if induced current aided the change, energy would be created from nothing.', 'medium', 2, 90),

('q_wassce_phy_2023_38', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'In a step-down transformer:', 'multiple_choice', '["Secondary voltage is greater than primary voltage", "Secondary voltage is less than primary voltage", "Number of turns in secondary is greater than primary", "Current in secondary is less than in primary"]', 'B', 'A step-down transformer reduces voltage. It has more turns in the primary coil than the secondary, resulting in lower secondary voltage but higher secondary current.', 'easy', 2, 60),

('q_wassce_phy_2023_39', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'The direction of induced current in a conductor moving in a magnetic field can be determined using:', 'multiple_choice', '["Faraday''s law", "Lenz''s law", "Fleming''s right-hand rule", "Fleming''s left-hand rule"]', 'C', 'Fleming''s right-hand rule is used for generators (induced current). The thumb represents motion, first finger represents field, and second finger represents induced current direction.', 'medium', 2, 90),

('q_wassce_phy_2023_40', 'topic_magnetism', 'subj_physics', 'pp_wassce_phy_2023_1', 'An electromagnet can be strengthened by:', 'multiple_choice', '["Decreasing the number of turns", "Decreasing the current", "Using a soft iron core", "Increasing the resistance"]', 'C', 'A soft iron core increases the magnetic field strength because iron has high permeability. More turns and higher current also strengthen an electromagnet.', 'easy', 2, 60),

-- Heat and Modern Physics (Questions 41-50)
('q_wassce_phy_2023_41', 'topic_heat', 'subj_physics', 'pp_wassce_phy_2023_1', 'The SI unit of temperature is:', 'multiple_choice', '["Degree Celsius", "Degree Fahrenheit", "Kelvin", "Joule"]', 'C', 'The SI unit of temperature is the Kelvin (K). While Celsius is commonly used, Kelvin is the fundamental SI unit and is used in scientific calculations.', 'easy', 2, 60),

('q_wassce_phy_2023_42', 'topic_heat', 'subj_physics', 'pp_wassce_phy_2023_1', 'Heat energy required to change the state of a substance without changing its temperature is called:', 'multiple_choice', '["Specific heat capacity", "Latent heat", "Sensible heat", "Thermal capacity"]', 'B', 'Latent heat is the heat energy absorbed or released during a change of state (phase change) at constant temperature. It can be latent heat of fusion or latent heat of vaporization.', 'easy', 2, 60),

('q_wassce_phy_2023_43', 'topic_heat', 'subj_physics', 'pp_wassce_phy_2023_1', 'How much heat is required to raise the temperature of 2 kg of water from 20°C to 70°C? (Specific heat capacity of water = 4200 J/kg°C)', 'multiple_choice', '["42,000 J", "84,000 J", "420,000 J", "840,000 J"]', 'C', 'Q = mcΔT = 2 × 4200 × (70 - 20) = 2 × 4200 × 50 = 420,000 J.', 'medium', 2, 90),

('q_wassce_phy_2023_44', 'topic_heat', 'subj_physics', 'pp_wassce_phy_2023_1', 'The transfer of heat through a vacuum occurs by:', 'multiple_choice', '["Conduction", "Convection", "Radiation", "All of the above"]', 'C', 'Only radiation can transfer heat through a vacuum. Conduction requires a medium, and convection requires a fluid. The Sun''s heat reaches Earth through radiation.', 'easy', 2, 60),

('q_wassce_phy_2023_45', 'topic_heat', 'subj_physics', 'pp_wassce_phy_2023_1', 'A good absorber of heat is also:', 'multiple_choice', '["A poor emitter", "A good emitter", "A poor conductor", "A good reflector"]', 'B', 'According to Kirchhoff''s law, a good absorber of radiation is also a good emitter. Black surfaces are good absorbers and emitters, while shiny surfaces are poor absorbers and emitters.', 'medium', 2, 90),

('q_wassce_phy_2023_46', 'topic_modern_physics', 'subj_physics', 'pp_wassce_phy_2023_1', 'The particles emitted during beta decay are:', 'multiple_choice', '["Alpha particles", "Electrons or positrons", "Neutrons", "Protons"]', 'B', 'Beta decay involves emission of electrons (β⁻) or positrons (β⁺). In β⁻ decay, a neutron converts to a proton and an electron is emitted.', 'medium', 2, 90),

('q_wassce_phy_2023_47', 'topic_modern_physics', 'subj_physics', 'pp_wassce_phy_2023_1', 'The half-life of a radioactive substance is 4 hours. What fraction of the substance remains after 12 hours?', 'multiple_choice', '["1/2", "1/4", "1/8", "1/16"]', 'C', 'After 12 hours = 3 half-lives. Remaining fraction = (1/2)³ = 1/8.', 'medium', 2, 90),

('q_wassce_phy_2023_48', 'topic_modern_physics', 'subj_physics', 'pp_wassce_phy_2023_1', 'The photoelectric effect demonstrates that light:', 'multiple_choice', '["Has wave properties only", "Has particle properties only", "Has both wave and particle properties", "Has neither wave nor particle properties"]', 'C', 'The photoelectric effect shows that light behaves as particles (photons). Combined with interference and diffraction (wave properties), this demonstrates wave-particle duality.', 'medium', 2, 90),

('q_wassce_phy_2023_49', 'topic_modern_physics', 'subj_physics', 'pp_wassce_phy_2023_1', 'The nucleus of an atom contains:', 'multiple_choice', '["Protons only", "Neutrons only", "Electrons only", "Protons and neutrons"]', 'D', 'The nucleus contains protons (positively charged) and neutrons (neutral). Electrons orbit the nucleus in energy levels. The mass of an atom is concentrated in the nucleus.', 'easy', 2, 60),

('q_wassce_phy_2023_50', 'topic_modern_physics', 'subj_physics', 'pp_wassce_phy_2023_1', 'The energy of a photon is directly proportional to its:', 'multiple_choice', '["Wavelength", "Frequency", "Speed", "Amplitude"]', 'B', 'E = hf (Einstein''s photoelectric equation), where h is Planck''s constant and f is frequency. Energy is directly proportional to frequency and inversely proportional to wavelength.', 'medium', 2, 90);

-- Update past paper total questions
UPDATE past_papers SET total_questions = 50 WHERE id = 'pp_wassce_phy_2023_1';
