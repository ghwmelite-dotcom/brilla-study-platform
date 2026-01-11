-- Additional IGCSE Chemistry Questions (16-40)

-- Atomic Structure
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_016', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What is an isotope?', 'short_answer', NULL, 'Atoms of the same element with the same number of protons but different numbers of neutrons', 'Isotopes have the same atomic number but different mass numbers.', 'medium', 3, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_017', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'How many electrons can the first shell hold?', 'multiple_choice', '["A. 1", "B. 2", "C. 8", "D. 18"]', 'B', 'First shell holds max 2 electrons, second shell holds 8.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_018', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What is the electron configuration of sodium (Na, atomic number 11)?', 'multiple_choice', '["A. 2,8,2", "B. 2,8,1", "C. 2,9", "D. 2,8,8"]', 'B', 'Sodium has 11 electrons arranged as 2,8,1.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

-- Bonding and Structure
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_019', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What type of bonding is in a water molecule?', 'multiple_choice', '["A. Ionic", "B. Covalent", "C. Metallic", "D. Hydrogen"]', 'B', 'Water has covalent bonds where electrons are shared between atoms.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_020', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'Why do metals conduct electricity?', 'short_answer', NULL, 'Metals have delocalised (free) electrons that can move and carry charge through the structure', 'The sea of electrons can flow when a voltage is applied.', 'medium', 3, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_021', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'Why do ionic compounds conduct electricity when molten but not when solid?', 'short_answer', NULL, 'When molten, ions are free to move and carry charge. In solid form, ions are fixed in position in the lattice.', 'Electrical conduction requires mobile charged particles.', 'hard', 3, 4, NULL, 'board_cambridge', 'Explain');

-- Stoichiometry
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_022', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What is the molar mass of water (H₂O)? (H=1, O=16)', 'calculation', NULL, '18 g/mol', 'Mr = (2×1) + 16 = 18', 'easy', 3, 1, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_023', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'How many moles are in 4.0 g of hydrogen gas (H₂)?', 'calculation', NULL, '2 moles', 'Mr of H₂ = 2. Moles = 4.0/2 = 2 moles', 'medium', 3, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_024', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What volume does 1 mole of any gas occupy at room temperature and pressure?', 'multiple_choice', '["A. 12 dm³", "B. 22.4 dm³", "C. 24 dm³", "D. 48 dm³"]', 'C', 'At RTP (25°C, 1 atm), molar volume is approximately 24 dm³.', 'medium', 3, 1, NULL, 'board_cambridge', 'State');

-- Acids, Bases and Salts
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_025', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What is produced when an acid reacts with a base?', 'multiple_choice', '["A. Salt + hydrogen", "B. Salt + water", "C. Salt + oxygen", "D. Salt + carbon dioxide"]', 'B', 'Acid + Base → Salt + Water (neutralisation reaction)', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_026', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'Write the equation for the reaction of HCl with NaOH.', 'short_answer', NULL, 'HCl + NaOH → NaCl + H₂O', 'This is a neutralisation reaction producing sodium chloride and water.', 'medium', 3, 2, NULL, 'board_cambridge', 'Write');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_027', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'Describe the test for carbon dioxide gas.', 'short_answer', NULL, 'Bubble gas through limewater (calcium hydroxide solution) - it turns cloudy/milky', 'CO₂ + Ca(OH)₂ → CaCO₃ + H₂O', 'easy', 3, 2, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_028', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What gas is produced when zinc reacts with dilute sulfuric acid?', 'multiple_choice', '["A. Oxygen", "B. Carbon dioxide", "C. Hydrogen", "D. Chlorine"]', 'C', 'Zn + H₂SO₄ → ZnSO₄ + H₂. Metals react with acids to produce hydrogen.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

-- Rates of Reaction
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_029', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'How does a catalyst affect a chemical reaction?', 'short_answer', NULL, 'A catalyst speeds up a reaction without being used up, by providing an alternative pathway with lower activation energy', 'Catalysts are not consumed and can be reused.', 'medium', 3, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_030', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'Why does increasing surface area increase reaction rate?', 'short_answer', NULL, 'More surface area means more particles are exposed for collisions, increasing collision frequency', 'Smaller pieces have larger surface area to volume ratio.', 'medium', 3, 3, NULL, 'board_cambridge', 'Explain');

-- Electrolysis
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_031', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'At which electrode does reduction occur during electrolysis?', 'multiple_choice', '["A. Anode", "B. Cathode", "C. Both", "D. Neither"]', 'B', 'Reduction (gain of electrons) occurs at the cathode (negative electrode).', 'medium', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_032', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What products form during electrolysis of dilute sulfuric acid?', 'multiple_choice', '["A. Hydrogen and oxygen", "B. Hydrogen and sulfur", "C. Oxygen and sulfur dioxide", "D. Water vapor only"]', 'A', 'Water is decomposed: 2H₂O → 2H₂ + O₂', 'medium', 3, 1, NULL, 'board_cambridge', 'State');

-- Metals and Reactivity
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_033', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'Place these metals in order of reactivity (most to least): zinc, copper, magnesium, iron', 'short_answer', NULL, 'Magnesium, zinc, iron, copper', 'The reactivity series: K, Na, Ca, Mg, Al, Zn, Fe, Pb, Cu, Ag, Au', 'medium', 3, 2, NULL, 'board_cambridge', 'Arrange');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_034', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'Why is aluminium extracted by electrolysis rather than carbon reduction?', 'short_answer', NULL, 'Aluminium is more reactive than carbon, so carbon cannot reduce aluminium oxide', 'Only metals below carbon in reactivity can be extracted by carbon reduction.', 'hard', 3, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_035', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What is corrosion of iron called?', 'multiple_choice', '["A. Oxidation", "B. Reduction", "C. Rusting", "D. Galvanising"]', 'C', 'Rusting requires iron, oxygen, and water: 4Fe + 3O₂ + 6H₂O → 4Fe(OH)₃', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

-- Organic Chemistry
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_036', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What is the molecular formula of ethene?', 'multiple_choice', '["A. CH₄", "B. C₂H₄", "C. C₂H₆", "D. C₃H₆"]', 'B', 'Ethene is an alkene with formula C₂H₄ containing a C=C double bond.', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_037', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What is the test to distinguish alkenes from alkanes?', 'short_answer', NULL, 'Add bromine water - alkenes decolourise it (orange to colourless), alkanes do not', 'The C=C double bond in alkenes reacts with bromine in an addition reaction.', 'medium', 3, 2, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_038', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What is polymerisation?', 'short_answer', NULL, 'The joining of many small monomer molecules to form a long chain polymer molecule', 'Examples: ethene → polyethene, propene → polypropene', 'medium', 3, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_039', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What products form when ethanol burns completely?', 'multiple_choice', '["A. Carbon and water", "B. Carbon monoxide and water", "C. Carbon dioxide and water", "D. Carbon dioxide only"]', 'C', 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O', 'easy', 3, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_igcse_chem_040', 'topic_chemistry', 'subj_igcse_chemistry', 'igcse', 'What is cracking and why is it used?', 'short_answer', NULL, 'Breaking down large hydrocarbon molecules into smaller, more useful ones using heat and a catalyst. Used to produce more petrol and alkenes for making plastics.', 'Long-chain alkanes are less useful than shorter ones.', 'hard', 3, 4, NULL, 'board_cambridge', 'Explain');
