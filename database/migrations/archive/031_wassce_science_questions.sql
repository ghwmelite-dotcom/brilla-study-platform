-- Migration 031: WASSCE Integrated Science Questions
-- 50 questions each for 2024 and 2023 Paper 1

-- WASSCE Integrated Science 2024 Paper 1
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Biology Section (Questions 1-20)
('q_sci_2024_001', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which organelle is responsible for protein synthesis in a cell?', 'multiple_choice', '["A. Mitochondria", "B. Ribosome", "C. Golgi apparatus", "D. Lysosome"]', 'B', 'Ribosomes are the site of protein synthesis, translating mRNA into proteins.', 'medium', 1, 1),

('q_sci_2024_002', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The process by which green plants make their own food is called:', 'multiple_choice', '["A. Respiration", "B. Transpiration", "C. Photosynthesis", "D. Osmosis"]', 'C', 'Photosynthesis is the process where plants convert light energy into chemical energy.', 'easy', 1, 2),

('q_sci_2024_003', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which blood vessel carries oxygenated blood from the heart to the body?', 'multiple_choice', '["A. Pulmonary artery", "B. Aorta", "C. Vena cava", "D. Pulmonary vein"]', 'B', 'The aorta carries oxygen-rich blood from the left ventricle to the body.', 'medium', 1, 3),

('q_sci_2024_004', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The basic unit of life is the:', 'multiple_choice', '["A. Tissue", "B. Organ", "C. Cell", "D. System"]', 'C', 'The cell is the smallest structural and functional unit of all living organisms.', 'easy', 1, 4),

('q_sci_2024_005', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which of the following is a sexually transmitted infection?', 'multiple_choice', '["A. Malaria", "B. Gonorrhea", "C. Typhoid", "D. Cholera"]', 'B', 'Gonorrhea is a bacterial STI caused by Neisseria gonorrhoeae.', 'easy', 1, 5),

('q_sci_2024_006', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The gas released during photosynthesis is:', 'multiple_choice', '["A. Carbon dioxide", "B. Nitrogen", "C. Oxygen", "D. Hydrogen"]', 'C', 'Oxygen is released as a by-product when water molecules are split during photosynthesis.', 'easy', 1, 6),

('q_sci_2024_007', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which part of the human brain controls balance and coordination?', 'multiple_choice', '["A. Cerebrum", "B. Cerebellum", "C. Medulla oblongata", "D. Hypothalamus"]', 'B', 'The cerebellum coordinates voluntary movements and maintains balance.', 'medium', 1, 7),

('q_sci_2024_008', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The type of reproduction that requires only one parent is:', 'multiple_choice', '["A. Sexual reproduction", "B. Asexual reproduction", "C. Fertilization", "D. Pollination"]', 'B', 'Asexual reproduction involves a single parent producing genetically identical offspring.', 'easy', 1, 8),

('q_sci_2024_009', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which vitamin is essential for blood clotting?', 'multiple_choice', '["A. Vitamin A", "B. Vitamin C", "C. Vitamin D", "D. Vitamin K"]', 'D', 'Vitamin K is essential for the synthesis of clotting factors in the liver.', 'medium', 1, 9),

('q_sci_2024_010', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The enzyme in saliva that digests starch is:', 'multiple_choice', '["A. Pepsin", "B. Lipase", "C. Amylase", "D. Trypsin"]', 'C', 'Salivary amylase (ptyalin) breaks down starch into maltose.', 'medium', 1, 10),

('q_sci_2024_011', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'DNA stands for:', 'multiple_choice', '["A. Deoxyribonucleic acid", "B. Deoxynucleic acid", "C. Dinucleic acid", "D. Duonucleic acid"]', 'A', 'DNA (Deoxyribonucleic acid) carries genetic information in all living organisms.', 'easy', 1, 11),

('q_sci_2024_012', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which of the following is NOT a greenhouse gas?', 'multiple_choice', '["A. Carbon dioxide", "B. Methane", "C. Nitrogen", "D. Water vapor"]', 'C', 'Nitrogen makes up 78% of atmosphere but does not trap heat like greenhouse gases.', 'medium', 1, 12),

('q_sci_2024_013', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The exchange of gases in the lungs occurs in the:', 'multiple_choice', '["A. Bronchi", "B. Trachea", "C. Alveoli", "D. Bronchioles"]', 'C', 'Alveoli are tiny air sacs where oxygen and carbon dioxide exchange occurs.', 'medium', 1, 13),

('q_sci_2024_014', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The vector for malaria is:', 'multiple_choice', '["A. Housefly", "B. Female Anopheles mosquito", "C. Tsetse fly", "D. Male Anopheles mosquito"]', 'B', 'Only female Anopheles mosquitoes transmit the Plasmodium parasite that causes malaria.', 'easy', 1, 14),

('q_sci_2024_015', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which hormone regulates blood sugar levels?', 'multiple_choice', '["A. Adrenaline", "B. Insulin", "C. Thyroxine", "D. Estrogen"]', 'B', 'Insulin, produced by the pancreas, lowers blood glucose levels.', 'easy', 1, 15),

('q_sci_2024_016', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The process of water loss from plant leaves is called:', 'multiple_choice', '["A. Evaporation", "B. Transpiration", "C. Condensation", "D. Respiration"]', 'B', 'Transpiration is the loss of water vapor from plant leaves through stomata.', 'easy', 1, 16),

('q_sci_2024_017', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which of the following is a renewable energy source?', 'multiple_choice', '["A. Coal", "B. Petroleum", "C. Solar energy", "D. Natural gas"]', 'C', 'Solar energy is renewable as it comes from the sun and is not depleted.', 'easy', 1, 17),

('q_sci_2024_018', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The powerhouse of the cell is the:', 'multiple_choice', '["A. Nucleus", "B. Mitochondria", "C. Chloroplast", "D. Vacuole"]', 'B', 'Mitochondria produce ATP through cellular respiration.', 'easy', 1, 18),

('q_sci_2024_019', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which type of joint is found in the shoulder?', 'multiple_choice', '["A. Hinge joint", "B. Ball and socket joint", "C. Pivot joint", "D. Gliding joint"]', 'B', 'The shoulder has a ball and socket joint allowing movement in all directions.', 'medium', 1, 19),

('q_sci_2024_020', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The disease caused by deficiency of Vitamin C is:', 'multiple_choice', '["A. Rickets", "B. Scurvy", "C. Beriberi", "D. Night blindness"]', 'B', 'Scurvy is caused by Vitamin C deficiency, leading to bleeding gums and weakness.', 'medium', 1, 20),

-- Chemistry Section (Questions 21-35)
('q_sci_2024_021', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The chemical symbol for sodium is:', 'multiple_choice', '["A. S", "B. Na", "C. So", "D. Sn"]', 'B', 'Na comes from the Latin name Natrium for sodium.', 'easy', 1, 21),

('q_sci_2024_022', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'An atom becomes a positive ion by:', 'multiple_choice', '["A. Gaining electrons", "B. Losing electrons", "C. Gaining protons", "D. Losing protons"]', 'B', 'Losing electrons gives an atom a net positive charge (cation).', 'medium', 1, 22),

('q_sci_2024_023', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The pH of a neutral solution is:', 'multiple_choice', '["A. 0", "B. 7", "C. 14", "D. 1"]', 'B', 'A pH of 7 indicates a neutral solution (neither acidic nor basic).', 'easy', 1, 23),

('q_sci_2024_024', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which of the following is a physical change?', 'multiple_choice', '["A. Burning wood", "B. Rusting of iron", "C. Melting ice", "D. Cooking an egg"]', 'C', 'Melting ice is physical because it can be reversed without changing composition.', 'easy', 1, 24),

('q_sci_2024_025', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The atomic number of an element is determined by the number of:', 'multiple_choice', '["A. Electrons", "B. Protons", "C. Neutrons", "D. Nucleons"]', 'B', 'Atomic number equals the number of protons in the nucleus.', 'medium', 1, 25),

('q_sci_2024_026', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which gas is used in electric bulbs?', 'multiple_choice', '["A. Oxygen", "B. Nitrogen", "C. Argon", "D. Carbon dioxide"]', 'C', 'Argon is an inert gas used to prevent oxidation of the filament.', 'medium', 1, 26),

('q_sci_2024_027', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The process of converting liquid to gas is called:', 'multiple_choice', '["A. Condensation", "B. Evaporation", "C. Sublimation", "D. Freezing"]', 'B', 'Evaporation is the change from liquid to gas at temperatures below boiling point.', 'easy', 1, 27),

('q_sci_2024_028', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which element has the highest electronegativity?', 'multiple_choice', '["A. Oxygen", "B. Chlorine", "C. Fluorine", "D. Nitrogen"]', 'C', 'Fluorine has the highest electronegativity value of 4.0 on the Pauling scale.', 'hard', 1, 28),

('q_sci_2024_029', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The number of moles in 44g of CO₂ (Molar mass = 44g/mol) is:', 'multiple_choice', '["A. 0.5 moles", "B. 1 mole", "C. 2 moles", "D. 44 moles"]', 'B', 'Number of moles = mass/molar mass = 44/44 = 1 mole.', 'medium', 1, 29),

('q_sci_2024_030', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'An example of a compound is:', 'multiple_choice', '["A. Oxygen", "B. Iron", "C. Water", "D. Gold"]', 'C', 'Water (H₂O) is a compound made of hydrogen and oxygen in fixed ratio.', 'easy', 1, 30),

('q_sci_2024_031', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The hardest natural substance is:', 'multiple_choice', '["A. Gold", "B. Iron", "C. Diamond", "D. Platinum"]', 'C', 'Diamond is the hardest known natural material due to its carbon crystal structure.', 'easy', 1, 31),

('q_sci_2024_032', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'A mixture of iron filings and sulfur can be separated by:', 'multiple_choice', '["A. Filtration", "B. Distillation", "C. Using a magnet", "D. Evaporation"]', 'C', 'Iron is magnetic while sulfur is not, so a magnet can separate them.', 'easy', 1, 32),

('q_sci_2024_033', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The gas produced when acids react with metals is:', 'multiple_choice', '["A. Oxygen", "B. Carbon dioxide", "C. Hydrogen", "D. Nitrogen"]', 'C', 'Acids react with reactive metals to produce hydrogen gas and a salt.', 'medium', 1, 33),

('q_sci_2024_034', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which substance is used to test for starch?', 'multiple_choice', '["A. Benedict''s solution", "B. Iodine solution", "C. Lime water", "D. Litmus paper"]', 'B', 'Iodine solution turns blue-black in the presence of starch.', 'easy', 1, 34),

('q_sci_2024_035', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The percentage of oxygen in the atmosphere is approximately:', 'multiple_choice', '["A. 78%", "B. 21%", "C. 1%", "D. 0.04%"]', 'B', 'The atmosphere contains about 21% oxygen and 78% nitrogen.', 'easy', 1, 35),

-- Physics Section (Questions 36-50)
('q_sci_2024_036', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The SI unit of force is:', 'multiple_choice', '["A. Joule", "B. Newton", "C. Watt", "D. Pascal"]', 'B', 'The Newton (N) is the SI unit of force. 1 N = 1 kg·m/s².', 'easy', 1, 36),

('q_sci_2024_037', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which form of energy is stored in a stretched spring?', 'multiple_choice', '["A. Kinetic energy", "B. Potential energy", "C. Chemical energy", "D. Nuclear energy"]', 'B', 'A stretched spring stores elastic potential energy.', 'easy', 1, 37),

('q_sci_2024_038', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The speed of light in vacuum is approximately:', 'multiple_choice', '["A. 3 × 10⁸ m/s", "B. 3 × 10⁶ m/s", "C. 3 × 10⁴ m/s", "D. 3 × 10¹⁰ m/s"]', 'A', 'Light travels at approximately 3 × 10⁸ meters per second in vacuum.', 'medium', 1, 38),

('q_sci_2024_039', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'A simple machine that uses a wheel and axle is the:', 'multiple_choice', '["A. Lever", "B. Pulley", "C. Screwdriver", "D. Inclined plane"]', 'C', 'A screwdriver uses the wheel and axle principle to multiply force.', 'medium', 1, 39),

('q_sci_2024_040', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which of the following is a good conductor of electricity?', 'multiple_choice', '["A. Rubber", "B. Wood", "C. Copper", "D. Plastic"]', 'C', 'Copper is an excellent electrical conductor due to its free electrons.', 'easy', 1, 40),

('q_sci_2024_041', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The image formed by a plane mirror is:', 'multiple_choice', '["A. Real and inverted", "B. Virtual and erect", "C. Real and erect", "D. Virtual and inverted"]', 'B', 'Plane mirrors produce virtual, erect, laterally inverted images of the same size.', 'medium', 1, 41),

('q_sci_2024_042', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The unit of electrical resistance is:', 'multiple_choice', '["A. Ampere", "B. Volt", "C. Ohm", "D. Watt"]', 'C', 'Resistance is measured in Ohms (Ω), named after Georg Simon Ohm.', 'easy', 1, 42),

('q_sci_2024_043', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Sound waves are:', 'multiple_choice', '["A. Transverse waves", "B. Longitudinal waves", "C. Electromagnetic waves", "D. Radio waves"]', 'B', 'Sound waves are longitudinal, with compressions and rarefactions.', 'medium', 1, 43),

('q_sci_2024_044', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The acceleration due to gravity on Earth is approximately:', 'multiple_choice', '["A. 10 m/s²", "B. 100 m/s²", "C. 1 m/s²", "D. 1000 m/s²"]', 'A', 'The acceleration due to gravity (g) is approximately 9.8 m/s² ≈ 10 m/s².', 'easy', 1, 44),

('q_sci_2024_045', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'Which color of light has the longest wavelength?', 'multiple_choice', '["A. Violet", "B. Blue", "C. Green", "D. Red"]', 'D', 'Red light has the longest wavelength (620-750 nm) in the visible spectrum.', 'medium', 1, 45),

('q_sci_2024_046', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The formula for calculating work done is:', 'multiple_choice', '["A. Force × Distance", "B. Mass × Velocity", "C. Force × Time", "D. Mass × Acceleration"]', 'A', 'Work = Force × Distance moved in the direction of the force.', 'easy', 1, 46),

('q_sci_2024_047', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'A transformer is used to:', 'multiple_choice', '["A. Convert AC to DC", "B. Change voltage levels", "C. Store electrical energy", "D. Measure current"]', 'B', 'Transformers step up or step down AC voltage using electromagnetic induction.', 'medium', 1, 47),

('q_sci_2024_048', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The phenomenon responsible for rainbow formation is:', 'multiple_choice', '["A. Reflection", "B. Refraction", "C. Dispersion", "D. Diffraction"]', 'C', 'Dispersion separates white light into its component colors in a rainbow.', 'medium', 1, 48),

('q_sci_2024_049', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'The SI unit of electric current is:', 'multiple_choice', '["A. Volt", "B. Ohm", "C. Ampere", "D. Coulomb"]', 'C', 'Electric current is measured in Amperes (A), representing charge flow per second.', 'easy', 1, 49),

('q_sci_2024_050', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2024_1', 'When light passes from air to water, it:', 'multiple_choice', '["A. Speeds up", "B. Slows down", "C. Maintains speed", "D. Stops"]', 'B', 'Light slows down when entering a denser medium like water.', 'medium', 1, 50),

-- WASSCE Integrated Science 2023 Paper 1
('q_sci_2023_001', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The control center of the cell is the:', 'multiple_choice', '["A. Cytoplasm", "B. Nucleus", "C. Cell membrane", "D. Ribosome"]', 'B', 'The nucleus contains DNA and controls all cell activities.', 'easy', 1, 1),

('q_sci_2023_002', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Which blood cells are responsible for fighting infection?', 'multiple_choice', '["A. Red blood cells", "B. White blood cells", "C. Platelets", "D. Plasma"]', 'B', 'White blood cells (leukocytes) are part of the immune system.', 'easy', 1, 2),

('q_sci_2023_003', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The process of breaking down glucose to release energy is called:', 'multiple_choice', '["A. Photosynthesis", "B. Respiration", "C. Digestion", "D. Excretion"]', 'B', 'Cellular respiration breaks down glucose to release ATP energy.', 'easy', 1, 3),

('q_sci_2023_004', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Which of the following is NOT a function of the skeleton?', 'multiple_choice', '["A. Support", "B. Protection", "C. Digestion", "D. Movement"]', 'C', 'Digestion is not a skeletal function. The skeleton supports, protects, and aids movement.', 'easy', 1, 4),

('q_sci_2023_005', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The organ responsible for filtering blood and producing urine is the:', 'multiple_choice', '["A. Liver", "B. Heart", "C. Kidney", "D. Lungs"]', 'C', 'The kidneys filter blood to remove waste and produce urine.', 'easy', 1, 5),

('q_sci_2023_006', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Chlorophyll is mainly found in:', 'multiple_choice', '["A. Mitochondria", "B. Chloroplasts", "C. Nucleus", "D. Vacuole"]', 'B', 'Chloroplasts contain chlorophyll, the green pigment for photosynthesis.', 'easy', 1, 6),

('q_sci_2023_007', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The part of the eye that controls the amount of light entering is the:', 'multiple_choice', '["A. Cornea", "B. Retina", "C. Iris", "D. Lens"]', 'C', 'The iris adjusts pupil size to control light entry.', 'medium', 1, 7),

('q_sci_2023_008', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Which of the following is an example of a reflex action?', 'multiple_choice', '["A. Reading a book", "B. Walking", "C. Blinking when dust enters the eye", "D. Writing"]', 'C', 'Blinking is an automatic, involuntary reflex action.', 'easy', 1, 8),

('q_sci_2023_009', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The genetic material of organisms is:', 'multiple_choice', '["A. Protein", "B. Carbohydrate", "C. DNA", "D. Lipid"]', 'C', 'DNA (Deoxyribonucleic acid) carries genetic information.', 'easy', 1, 9),

('q_sci_2023_010', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Which of the following is a characteristic of living things?', 'multiple_choice', '["A. Rusting", "B. Melting", "C. Reproduction", "D. Evaporation"]', 'C', 'Reproduction is a characteristic unique to living organisms.', 'easy', 1, 10),

('q_sci_2023_011', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The largest organ in the human body is the:', 'multiple_choice', '["A. Liver", "B. Heart", "C. Skin", "D. Lungs"]', 'C', 'The skin is the largest organ, covering about 2 square meters.', 'medium', 1, 11),

('q_sci_2023_012', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Deficiency of iron in the diet causes:', 'multiple_choice', '["A. Goiter", "B. Anemia", "C. Rickets", "D. Scurvy"]', 'B', 'Iron deficiency leads to anemia due to reduced hemoglobin production.', 'medium', 1, 12),

('q_sci_2023_013', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The movement of water from a region of higher concentration to lower concentration through a semi-permeable membrane is:', 'multiple_choice', '["A. Diffusion", "B. Osmosis", "C. Active transport", "D. Plasmolysis"]', 'B', 'Osmosis is the movement of water across a semi-permeable membrane.', 'medium', 1, 13),

('q_sci_2023_014', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Which of the following causes tooth decay?', 'multiple_choice', '["A. Viruses", "B. Bacteria", "C. Fungi", "D. Protozoa"]', 'B', 'Bacteria like Streptococcus mutans cause tooth decay by producing acids.', 'easy', 1, 14),

('q_sci_2023_015', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The type of teeth used for tearing food is:', 'multiple_choice', '["A. Incisors", "B. Canines", "C. Premolars", "D. Molars"]', 'B', 'Canines are pointed teeth adapted for tearing food.', 'easy', 1, 15),

('q_sci_2023_016', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Carbon dioxide is returned to the atmosphere through:', 'multiple_choice', '["A. Photosynthesis only", "B. Respiration only", "C. Both photosynthesis and respiration", "D. Transpiration"]', 'B', 'Respiration releases CO₂; photosynthesis absorbs it.', 'medium', 1, 16),

('q_sci_2023_017', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The study of heredity is called:', 'multiple_choice', '["A. Ecology", "B. Genetics", "C. Taxonomy", "D. Anatomy"]', 'B', 'Genetics is the branch of biology dealing with heredity and variation.', 'easy', 1, 17),

('q_sci_2023_018', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Which of the following is a monocotyledon?', 'multiple_choice', '["A. Beans", "B. Maize", "C. Groundnut", "D. Mango"]', 'B', 'Maize is a monocot with parallel leaf veins and fibrous roots.', 'medium', 1, 18),

('q_sci_2023_019', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Vaccination helps to:', 'multiple_choice', '["A. Cure diseases", "B. Prevent diseases", "C. Spread diseases", "D. Cause diseases"]', 'B', 'Vaccines stimulate immunity to prevent specific diseases.', 'easy', 1, 19),

('q_sci_2023_020', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The organism that causes AIDS is a:', 'multiple_choice', '["A. Bacterium", "B. Virus", "C. Fungus", "D. Protozoan"]', 'B', 'HIV (Human Immunodeficiency Virus) causes AIDS.', 'easy', 1, 20),

('q_sci_2023_021', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The number of electrons in the outermost shell of a sodium atom is:', 'multiple_choice', '["A. 1", "B. 2", "C. 3", "D. 8"]', 'A', 'Sodium has electronic configuration 2,8,1 - one electron in the outer shell.', 'medium', 1, 21),

('q_sci_2023_022', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Which of the following is an example of an alkali?', 'multiple_choice', '["A. Hydrochloric acid", "B. Sodium hydroxide", "C. Sulphuric acid", "D. Acetic acid"]', 'B', 'Sodium hydroxide (NaOH) is a strong alkali/base.', 'easy', 1, 22),

('q_sci_2023_023', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The chemical formula for water is:', 'multiple_choice', '["A. H₂O", "B. HO₂", "C. H₂O₂", "D. H₃O"]', 'A', 'Water consists of two hydrogen atoms and one oxygen atom: H₂O.', 'easy', 1, 23),

('q_sci_2023_024', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Rusting of iron is an example of:', 'multiple_choice', '["A. Physical change", "B. Chemical change", "C. Temporary change", "D. Reversible change"]', 'B', 'Rusting is a chemical change as iron reacts with oxygen and water.', 'easy', 1, 24),

('q_sci_2023_025', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Elements in the same group of the periodic table have:', 'multiple_choice', '["A. Same atomic number", "B. Same number of neutrons", "C. Same number of valence electrons", "D. Same mass number"]', 'C', 'Elements in the same group have the same number of valence electrons.', 'medium', 1, 25),

('q_sci_2023_026', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The gas used for ripening fruits artificially is:', 'multiple_choice', '["A. Oxygen", "B. Nitrogen", "C. Ethylene", "D. Carbon dioxide"]', 'C', 'Ethylene is a natural plant hormone that promotes fruit ripening.', 'medium', 1, 26),

('q_sci_2023_027', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The method of separating crude oil into fractions is called:', 'multiple_choice', '["A. Filtration", "B. Evaporation", "C. Fractional distillation", "D. Crystallization"]', 'C', 'Fractional distillation separates crude oil based on boiling points.', 'medium', 1, 27),

('q_sci_2023_028', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Which of the following metals is liquid at room temperature?', 'multiple_choice', '["A. Sodium", "B. Mercury", "C. Aluminum", "D. Iron"]', 'B', 'Mercury is the only metal that is liquid at room temperature.', 'easy', 1, 28),

('q_sci_2023_029', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'A substance that speeds up a chemical reaction without being used up is a:', 'multiple_choice', '["A. Reactant", "B. Product", "C. Catalyst", "D. Solvent"]', 'C', 'A catalyst increases reaction rate without being consumed.', 'easy', 1, 29),

('q_sci_2023_030', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The number of protons in carbon is:', 'multiple_choice', '["A. 6", "B. 12", "C. 8", "D. 14"]', 'A', 'Carbon has atomic number 6, meaning it has 6 protons.', 'easy', 1, 30),

('q_sci_2023_031', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The gas that turns lime water milky is:', 'multiple_choice', '["A. Oxygen", "B. Hydrogen", "C. Carbon dioxide", "D. Nitrogen"]', 'C', 'CO₂ reacts with lime water (calcium hydroxide) to form calcium carbonate.', 'easy', 1, 31),

('q_sci_2023_032', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Which of the following is NOT a state of matter?', 'multiple_choice', '["A. Solid", "B. Liquid", "C. Gas", "D. Energy"]', 'D', 'The three common states of matter are solid, liquid, and gas. Energy is not a state of matter.', 'easy', 1, 32),

('q_sci_2023_033', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'An acid has a pH of:', 'multiple_choice', '["A. Less than 7", "B. Equal to 7", "C. Greater than 7", "D. Equal to 14"]', 'A', 'Acids have pH values less than 7 on the pH scale.', 'easy', 1, 33),

('q_sci_2023_034', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The alloy of copper and zinc is called:', 'multiple_choice', '["A. Bronze", "B. Brass", "C. Steel", "D. Solder"]', 'B', 'Brass is an alloy of copper and zinc.', 'medium', 1, 34),

('q_sci_2023_035', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Hard water contains salts of:', 'multiple_choice', '["A. Sodium and potassium", "B. Calcium and magnesium", "C. Iron and aluminum", "D. Lead and zinc"]', 'B', 'Hard water contains dissolved calcium and magnesium compounds.', 'medium', 1, 35),

('q_sci_2023_036', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The unit of energy is:', 'multiple_choice', '["A. Newton", "B. Watt", "C. Joule", "D. Ampere"]', 'C', 'Energy is measured in Joules (J) in the SI system.', 'easy', 1, 36),

('q_sci_2023_037', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The bending of light as it passes from one medium to another is called:', 'multiple_choice', '["A. Reflection", "B. Refraction", "C. Diffraction", "D. Dispersion"]', 'B', 'Refraction is the bending of light due to change in speed between media.', 'easy', 1, 37),

('q_sci_2023_038', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The type of circuit where current has only one path is:', 'multiple_choice', '["A. Parallel circuit", "B. Series circuit", "C. Closed circuit", "D. Open circuit"]', 'B', 'In a series circuit, current flows through one path.', 'easy', 1, 38),

('q_sci_2023_039', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The phenomenon where hot air rises and cold air sinks is called:', 'multiple_choice', '["A. Conduction", "B. Convection", "C. Radiation", "D. Evaporation"]', 'B', 'Convection is heat transfer by movement of fluids (liquids and gases).', 'medium', 1, 39),

('q_sci_2023_040', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'A body is said to be in equilibrium when:', 'multiple_choice', '["A. It is moving fast", "B. The resultant force on it is zero", "C. It is very heavy", "D. It is falling freely"]', 'B', 'Equilibrium occurs when all forces balance out to zero net force.', 'medium', 1, 40),

('q_sci_2023_041', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The formula for calculating pressure is:', 'multiple_choice', '["A. Force × Area", "B. Force ÷ Area", "C. Mass × Velocity", "D. Force × Distance"]', 'B', 'Pressure = Force/Area (P = F/A), measured in Pascals.', 'easy', 1, 41),

('q_sci_2023_042', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'An example of a first-class lever is:', 'multiple_choice', '["A. Wheelbarrow", "B. See-saw", "C. Nutcracker", "D. Fishing rod"]', 'B', 'A see-saw has fulcrum between effort and load (first-class lever).', 'medium', 1, 42),

('q_sci_2023_043', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The property of a body to resist change in motion is called:', 'multiple_choice', '["A. Momentum", "B. Inertia", "C. Velocity", "D. Acceleration"]', 'B', 'Inertia is the tendency of an object to resist changes in its state of motion.', 'medium', 1, 43),

('q_sci_2023_044', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The device used to measure atmospheric pressure is:', 'multiple_choice', '["A. Thermometer", "B. Barometer", "C. Ammeter", "D. Voltmeter"]', 'B', 'A barometer measures atmospheric pressure.', 'easy', 1, 44),

('q_sci_2023_045', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The primary colors of light are:', 'multiple_choice', '["A. Red, yellow, blue", "B. Red, green, blue", "C. Red, orange, yellow", "D. Cyan, magenta, yellow"]', 'B', 'Red, green, and blue (RGB) are the primary colors of light.', 'medium', 1, 45),

('q_sci_2023_046', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'Echo is a phenomenon of:', 'multiple_choice', '["A. Refraction of sound", "B. Reflection of sound", "C. Diffraction of sound", "D. Absorption of sound"]', 'B', 'An echo is caused by reflection of sound waves from a surface.', 'easy', 1, 46),

('q_sci_2023_047', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The unit of frequency is:', 'multiple_choice', '["A. Second", "B. Hertz", "C. Meter", "D. Newton"]', 'B', 'Frequency is measured in Hertz (Hz), cycles per second.', 'easy', 1, 47),

('q_sci_2023_048', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'A fuse is used in electrical circuits to:', 'multiple_choice', '["A. Increase current", "B. Decrease voltage", "C. Prevent overloading", "D. Store energy"]', 'C', 'Fuses protect circuits by melting when current exceeds safe levels.', 'easy', 1, 48),

('q_sci_2023_049', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The force of attraction between the Earth and an object is called:', 'multiple_choice', '["A. Friction", "B. Gravity", "C. Magnetism", "D. Tension"]', 'B', 'Gravity is the force of attraction between masses.', 'easy', 1, 49),

('q_sci_2023_050', 'subj_wassce_int_science', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_sci_2023_1', 'The rate of doing work is called:', 'multiple_choice', '["A. Energy", "B. Force", "C. Power", "D. Momentum"]', 'C', 'Power = Work/Time, measured in Watts.', 'easy', 1, 50);
