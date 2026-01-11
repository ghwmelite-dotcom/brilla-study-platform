-- A-Level Chemistry Questions (40 questions)

-- Physical Chemistry - Atomic Structure
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_001', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is the electronic configuration of a chromium atom (Z=24)?', 'multiple_choice', '["A. [Ar] 3d4 4s2", "B. [Ar] 3d5 4s1", "C. [Ar] 3d6", "D. [Ar] 3d3 4s2 4p1"]', 'B', 'Chromium has an anomalous configuration due to extra stability of half-filled d orbitals.', 'hard', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_002', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Explain why the first ionisation energy of oxygen is lower than that of nitrogen.', 'short_answer', NULL, 'In oxygen, the electron removed is from a paired 2p orbital. The repulsion between paired electrons makes it easier to remove. Nitrogen has all unpaired 2p electrons.', 'Extra stability from half-filled subshells affects ionisation energy.', 'hard', 4, 4, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_003', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is the shape and bond angle of SF6?', 'short_answer', NULL, 'Octahedral with bond angles of 90 degrees', 'SF6 has 6 bonding pairs around sulfur with no lone pairs.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

-- Bonding
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_004', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Explain why BF3 can act as a Lewis acid.', 'short_answer', NULL, 'BF3 has an incomplete octet with only 6 electrons around boron. It can accept a lone pair of electrons from a Lewis base to complete its octet.', 'Lewis acids are electron pair acceptors.', 'medium', 4, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_005', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What type of hybridisation does the carbon atom have in ethene?', 'multiple_choice', '["A. sp", "B. sp2", "C. sp3", "D. sp3d"]', 'B', 'In ethene, carbon forms 3 sigma bonds (2 C-H and 1 C-C) using sp2 hybrid orbitals, plus 1 pi bond.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

-- Energetics
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_006', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Define lattice enthalpy of formation.', 'short_answer', NULL, 'The enthalpy change when one mole of an ionic compound is formed from its gaseous ions under standard conditions', 'Lattice enthalpy is always exothermic (negative) for formation.', 'medium', 4, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_007', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Using bond enthalpies, calculate the enthalpy of combustion of methane. C-H = 412 kJ/mol, O=O = 496 kJ/mol, C=O = 743 kJ/mol, O-H = 463 kJ/mol', 'calculation', NULL, '-818 kJ/mol', 'Bonds broken: 4(C-H) + 2(O=O) = 1648 + 992 = 2640. Bonds formed: 2(C=O) + 4(O-H) = 1486 + 1852 = 3338. ΔH = 2640 - 3338 = -698 kJ/mol (actual varies)', 'hard', 4, 4, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_008', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is Hess Law?', 'short_answer', NULL, 'The total enthalpy change for a reaction is independent of the route taken, provided initial and final conditions are the same', 'This is a consequence of conservation of energy.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

-- Kinetics
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_009', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'For a first-order reaction, the half-life is 20 minutes. What fraction remains after 1 hour?', 'calculation', NULL, '1/8 or 0.125', 'After 3 half-lives (60 min): 1/2 × 1/2 × 1/2 = 1/8 remains', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_010', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Rate = k[A]2[B]. If concentration of A is doubled, by what factor does the rate increase?', 'multiple_choice', '["A. 2", "B. 4", "C. 6", "D. 8"]', 'B', 'Rate is proportional to [A]2, so doubling [A] multiplies rate by 22 = 4', 'medium', 4, 1, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_011', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is the molecularity of the rate-determining step if the rate equation is rate = k[A][B]?', 'short_answer', NULL, 'Bimolecular - two molecules are involved in the rate-determining step', 'Molecularity refers to the number of species in the slowest step.', 'hard', 4, 2, NULL, 'board_cambridge', 'State');

-- Equilibria
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_012', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'For the equilibrium N2 + 3H2 ⇌ 2NH3, write the expression for Kp.', 'short_answer', NULL, 'Kp = (pNH3)2 / (pN2 × (pH2)3)', 'Kp uses partial pressures for gaseous equilibria.', 'medium', 4, 2, NULL, 'board_cambridge', 'Write');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_013', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is Le Chateliers principle?', 'short_answer', NULL, 'If a system at equilibrium is disturbed, the position of equilibrium shifts to counteract the change', 'Applies to changes in concentration, pressure, and temperature.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

-- Acids and Bases
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_014', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Calculate the pH of a 0.01 M HCl solution.', 'calculation', NULL, '2', 'HCl is a strong acid, fully dissociates. [H+] = 0.01 M. pH = -log(0.01) = 2', 'easy', 4, 1, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_015', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'A weak acid HA has Ka = 1.8 × 10-5. Calculate the pH of a 0.1 M solution.', 'calculation', NULL, '2.87', '[H+] = √(Ka × c) = √(1.8×10-5 × 0.1) = 1.34 × 10-3. pH = 2.87', 'hard', 4, 4, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_016', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is a buffer solution and how does it work?', 'short_answer', NULL, 'A solution that resists changes in pH when small amounts of acid or base are added. It works by containing a weak acid and its conjugate base, which react with added H+ or OH- ions.', 'Common buffers: ethanoic acid/sodium ethanoate, ammonia/ammonium chloride.', 'hard', 4, 4, NULL, 'board_cambridge', 'Explain');

-- Electrochemistry
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_017', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Calculate the EMF of a cell: Zn|Zn2+||Cu2+|Cu. E°(Zn2+/Zn) = -0.76V, E°(Cu2+/Cu) = +0.34V', 'calculation', NULL, '+1.10 V', 'EMF = E°(cathode) - E°(anode) = 0.34 - (-0.76) = +1.10 V', 'medium', 4, 2, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_018', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What reaction occurs at the cathode during electrolysis?', 'multiple_choice', '["A. Oxidation", "B. Reduction", "C. Neutralisation", "D. Decomposition"]', 'B', 'Cathode attracts cations which gain electrons (reduction). OILRIG - Reduction Is Gain.', 'easy', 4, 1, NULL, 'board_cambridge', 'State');

-- Transition Metals
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_019', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Why do transition metal compounds often have colour?', 'short_answer', NULL, 'Partially filled d orbitals allow d-d electron transitions. When light is absorbed for these transitions, complementary colours are transmitted.', 'The energy gap corresponds to visible light wavelengths.', 'hard', 4, 4, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_020', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is the oxidation state of manganese in MnO4-?', 'calculation', NULL, '+7', 'Let Mn = x. x + 4(-2) = -1. x = +7', 'medium', 4, 1, NULL, 'board_cambridge', 'Calculate');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_021', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What type of isomerism is shown by [Co(NH3)4Cl2]+?', 'multiple_choice', '["A. Optical isomerism only", "B. Cis-trans isomerism only", "C. Both optical and cis-trans", "D. Neither"]', 'B', 'This complex can exist as cis (Cl atoms adjacent) or trans (Cl atoms opposite) isomers.', 'hard', 4, 2, NULL, 'board_cambridge', 'State');

-- Organic Chemistry - Mechanisms
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_022', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is the mechanism for the reaction of bromine with ethene?', 'short_answer', NULL, 'Electrophilic addition. The pi electrons attract the electrophile Br2, forming a carbocation intermediate, then Br- attacks.', 'Evidence: reaction with aqueous bromine gives mixed products.', 'medium', 4, 3, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_023', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What type of mechanism is involved in the reaction of a tertiary halogenoalkane with aqueous OH-?', 'multiple_choice', '["A. SN1", "B. SN2", "C. E1", "D. E2"]', 'A', 'Tertiary halogenoalkanes undergo SN1 due to steric hindrance and stable tertiary carbocation.', 'hard', 4, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_024', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Draw the mechanism for nucleophilic substitution of bromoethane with hydroxide ion.', 'short_answer', NULL, 'SN2 mechanism: OH- attacks carbon from opposite side to Br, forming transition state with 5 groups around C, then Br leaves as Br-. Single step, inversion of configuration.', 'Primary halogenoalkanes favour SN2 mechanism.', 'hard', 4, 4, NULL, 'board_cambridge', 'Draw');

-- Carbonyl Compounds
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_025', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'How can you distinguish between an aldehyde and a ketone?', 'short_answer', NULL, 'Tollens reagent (silver mirror test): aldehydes give silver mirror, ketones do not. Fehlings solution: aldehydes give red precipitate, ketones do not.', 'Aldehydes are more easily oxidised than ketones.', 'medium', 4, 3, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_026', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What reagent reduces a ketone to a secondary alcohol?', 'multiple_choice', '["A. Concentrated H2SO4", "B. NaBH4 or LiAlH4", "C. K2Cr2O7/H+", "D. Br2"]', 'B', 'NaBH4 and LiAlH4 are reducing agents that add H to the C=O group.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

-- Carboxylic Acids
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_027', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is formed when ethanoic acid reacts with ethanol in the presence of concentrated sulfuric acid?', 'short_answer', NULL, 'Ethyl ethanoate (an ester) and water. This is an esterification reaction.', 'Concentrated H2SO4 acts as a catalyst and removes water.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_028', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Why are carboxylic acids more acidic than alcohols?', 'short_answer', NULL, 'The carboxylate anion is stabilised by delocalisation of the negative charge over both oxygen atoms. This makes deprotonation more favourable.', 'Resonance stabilisation lowers energy of products.', 'hard', 4, 4, NULL, 'board_cambridge', 'Explain');

-- Amines
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_029', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Why are amines basic?', 'short_answer', NULL, 'Amines have a lone pair of electrons on nitrogen that can accept a proton (H+) from acids, acting as a Bronsted-Lowry base.', 'Amines can also act as nucleophiles using this lone pair.', 'medium', 4, 2, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_030', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Compare the basicity of ammonia, methylamine, and phenylamine.', 'short_answer', NULL, 'Order of basicity: methylamine > ammonia > phenylamine. Alkyl groups are electron-donating (increase electron density). The benzene ring in phenylamine delocalises the lone pair, reducing basicity.', 'Inductive and mesomeric effects determine basicity.', 'hard', 4, 4, NULL, 'board_cambridge', 'Compare');

-- Polymers
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_031', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is the difference between addition and condensation polymerisation?', 'short_answer', NULL, 'Addition: monomers join without loss of atoms, requires C=C double bonds. Condensation: monomers join with elimination of a small molecule (usually water), requires two functional groups.', 'Example: polyethene (addition), nylon (condensation).', 'medium', 4, 3, NULL, 'board_cambridge', 'Compare');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_032', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What type of polymerisation produces polyester?', 'multiple_choice', '["A. Addition", "B. Condensation", "C. Free radical", "D. Ionic"]', 'B', 'Polyesters form by condensation between diols and dicarboxylic acids, eliminating water.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

-- Analytical Techniques
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_033', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'In mass spectrometry, what does the m/z value of the molecular ion peak indicate?', 'short_answer', NULL, 'The relative molecular mass of the compound', 'The molecular ion is formed when one electron is removed from the molecule.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_034', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'An IR spectrum shows a broad absorption at 2500-3300 cm-1 and a sharp peak at 1710 cm-1. What functional group is present?', 'multiple_choice', '["A. Alcohol", "B. Aldehyde", "C. Carboxylic acid", "D. Ester"]', 'C', 'Broad O-H stretch (2500-3300) and C=O stretch (~1710) indicate carboxylic acid.', 'hard', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_035', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'In 1H NMR, what causes the splitting of peaks?', 'short_answer', NULL, 'Spin-spin coupling between non-equivalent hydrogen atoms on adjacent carbons. The number of peaks = n + 1, where n is the number of equivalent hydrogens on adjacent carbons.', 'This gives structural information about neighboring groups.', 'hard', 4, 3, NULL, 'board_cambridge', 'Explain');

-- Period 3
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_036', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Describe and explain the trend in melting points of Period 3 elements Na to Ar.', 'short_answer', NULL, 'Melting points increase Na to Si (metallic/covalent bonding gets stronger), then drop sharply for P, S, Cl, Ar (simple molecular with weak van der Waals forces).', 'Structure and bonding determine physical properties.', 'hard', 4, 5, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_037', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What happens when sodium oxide reacts with water?', 'short_answer', NULL, 'Na2O + H2O → 2NaOH. Forms an alkaline solution as NaOH is a strong base.', 'Na2O is a basic oxide.', 'easy', 4, 2, NULL, 'board_cambridge', 'Write');

-- Group 17
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_038', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'Why does chlorine displace bromide ions from solution?', 'short_answer', NULL, 'Chlorine is a stronger oxidising agent than bromine. Cl2 gains electrons more readily because of its smaller atomic radius and higher electronegativity.', 'Cl2 + 2Br- → 2Cl- + Br2', 'medium', 4, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_039', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'What is the trend in boiling points of the hydrogen halides HF, HCl, HBr, HI?', 'short_answer', NULL, 'HF has anomalously high BP due to hydrogen bonding. For HCl, HBr, HI: BP increases with molecular mass due to stronger van der Waals forces.', 'HF has strong intermolecular forces despite being smallest.', 'medium', 4, 3, NULL, 'board_cambridge', 'Describe');

-- Entropy
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_chem_040', 'topic_chemistry', 'subj_alevel_chemistry', 'alevel', 'For a reaction to be spontaneous at all temperatures, what must be true about ΔH and ΔS?', 'multiple_choice', '["A. ΔH positive, ΔS positive", "B. ΔH negative, ΔS negative", "C. ΔH negative, ΔS positive", "D. ΔH positive, ΔS negative"]', 'C', 'ΔG = ΔH - TΔS. For ΔG to always be negative: need ΔH < 0 and ΔS > 0.', 'hard', 4, 2, NULL, 'board_cambridge', 'State');
