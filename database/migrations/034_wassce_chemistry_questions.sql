-- Migration 034: WASSCE Chemistry Questions
-- 50 questions for 2024 Paper 1

INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Atomic Structure and Bonding (Questions 1-12)
('q_chem_2024_001', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The number of protons in an atom determines its:', 'multiple_choice', '["A. Mass number", "B. Atomic number", "C. Number of neutrons", "D. Isotope type"]', 'B', 'Atomic number = number of protons, which defines the element.', 'easy', 1, 1),

('q_chem_2024_002', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Isotopes of an element have:', 'multiple_choice', '["A. Same mass number but different atomic number", "B. Same atomic number but different mass number", "C. Different number of electrons", "D. Different chemical properties"]', 'B', 'Isotopes have the same number of protons but different numbers of neutrons.', 'easy', 1, 2),

('q_chem_2024_003', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'An ionic bond is formed by:', 'multiple_choice', '["A. Sharing of electrons", "B. Transfer of electrons", "C. Sharing of protons", "D. Transfer of protons"]', 'B', 'Ionic bonds form when electrons are transferred from one atom to another.', 'easy', 1, 3),

('q_chem_2024_004', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The electronic configuration of sodium (Na, Z=11) is:', 'multiple_choice', '["A. 2,8", "B. 2,8,1", "C. 2,8,2", "D. 2,9"]', 'B', 'Sodium has 11 electrons distributed as 2,8,1.', 'easy', 1, 4),

('q_chem_2024_005', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Covalent bonds are formed between:', 'multiple_choice', '["A. Metals only", "B. Non-metals only", "C. Metals and non-metals", "D. Noble gases only"]', 'B', 'Covalent bonds form between non-metals by electron sharing.', 'easy', 1, 5),

('q_chem_2024_006', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Which of the following has a giant covalent structure?', 'multiple_choice', '["A. Sodium chloride", "B. Diamond", "C. Carbon dioxide", "D. Water"]', 'B', 'Diamond has a giant covalent structure with each carbon bonded to four others.', 'medium', 1, 6),

('q_chem_2024_007', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The shape of a methane (CH₄) molecule is:', 'multiple_choice', '["A. Linear", "B. Triangular", "C. Tetrahedral", "D. Square planar"]', 'C', 'Methane has a tetrahedral shape with bond angles of 109.5°.', 'medium', 1, 7),

('q_chem_2024_008', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Van der Waals forces are:', 'multiple_choice', '["A. Very strong forces", "B. Weak intermolecular forces", "C. Forces within molecules", "D. Nuclear forces"]', 'B', 'Van der Waals forces are weak intermolecular attractions.', 'medium', 1, 8),

('q_chem_2024_009', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Electronegativity increases across a period because:', 'multiple_choice', '["A. Atomic size increases", "B. Nuclear charge increases while size decreases", "C. Number of shells increases", "D. Number of protons decreases"]', 'B', 'Across a period, nuclear charge increases and atomic radius decreases.', 'hard', 1, 9),

('q_chem_2024_010', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'A hydrogen bond is a special type of:', 'multiple_choice', '["A. Covalent bond", "B. Ionic bond", "C. Dipole-dipole attraction", "D. Metallic bond"]', 'C', 'Hydrogen bonding is a strong dipole-dipole attraction involving H bonded to N, O, or F.', 'medium', 1, 10),

('q_chem_2024_011', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Which element has the highest first ionization energy?', 'multiple_choice', '["A. Sodium", "B. Magnesium", "C. Neon", "D. Chlorine"]', 'C', 'Noble gases like neon have the highest ionization energies due to stable configurations.', 'hard', 1, 11),

('q_chem_2024_012', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Metallic bonding involves:', 'multiple_choice', '["A. Transfer of electrons", "B. Sharing of electrons between two atoms", "C. Sea of delocalized electrons", "D. Ionic attractions"]', 'C', 'In metallic bonding, electrons are delocalized throughout the metal lattice.', 'medium', 1, 12),

-- Stoichiometry and Calculations (Questions 13-20)
('q_chem_2024_013', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The molar mass of H₂SO₄ is (H=1, S=32, O=16):', 'multiple_choice', '["A. 96 g/mol", "B. 98 g/mol", "C. 100 g/mol", "D. 94 g/mol"]', 'B', 'H₂SO₄ = 2(1) + 32 + 4(16) = 2 + 32 + 64 = 98 g/mol.', 'easy', 1, 13),

('q_chem_2024_014', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Avogadro''s number is approximately:', 'multiple_choice', '["A. 6.02 × 10²³", "B. 6.02 × 10²²", "C. 6.02 × 10²⁴", "D. 6.02 × 10²¹"]', 'A', 'Avogadro''s constant = 6.02 × 10²³ particles per mole.', 'easy', 1, 14),

('q_chem_2024_015', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'At STP, the molar volume of a gas is:', 'multiple_choice', '["A. 22.4 L", "B. 24.0 L", "C. 11.2 L", "D. 44.8 L"]', 'A', 'At STP (0°C, 1 atm), one mole of any gas occupies 22.4 L.', 'easy', 1, 15),

('q_chem_2024_016', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The empirical formula of a compound with 40% carbon, 6.7% hydrogen, and 53.3% oxygen is:', 'multiple_choice', '["A. CHO", "B. CH₂O", "C. C₂H₄O₂", "D. C₃H₆O₃"]', 'B', 'Mole ratios: C:H:O = 3.33:6.7:3.33 = 1:2:1, so CH₂O.', 'hard', 1, 16),

('q_chem_2024_017', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The percentage of nitrogen in ammonium nitrate NH₄NO₃ is (N=14, H=1, O=16):', 'multiple_choice', '["A. 28%", "B. 35%", "C. 40%", "D. 17.5%"]', 'B', 'Molar mass = 80g. N = 28g. %N = (28/80) × 100 = 35%.', 'medium', 1, 17),

('q_chem_2024_018', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'In the reaction 2H₂ + O₂ → 2H₂O, the mole ratio of H₂ to O₂ is:', 'multiple_choice', '["A. 1:1", "B. 1:2", "C. 2:1", "D. 2:2"]', 'C', 'From the equation, 2 moles H₂ react with 1 mole O₂.', 'easy', 1, 18),

('q_chem_2024_019', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The concentration of a solution containing 4g of NaOH in 500cm³ is (NaOH=40):', 'multiple_choice', '["A. 0.1 M", "B. 0.2 M", "C. 0.5 M", "D. 1.0 M"]', 'B', 'Moles = 4/40 = 0.1. Concentration = 0.1/0.5 = 0.2 M.', 'medium', 1, 19),

('q_chem_2024_020', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The limiting reagent in a reaction is:', 'multiple_choice', '["A. The reagent in excess", "B. The reagent that is completely consumed", "C. The catalyst", "D. The product formed"]', 'B', 'The limiting reagent is completely used up and determines the amount of product.', 'medium', 1, 20),

-- Acids, Bases, and Salts (Questions 21-28)
('q_chem_2024_021', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'According to Brønsted-Lowry theory, an acid is:', 'multiple_choice', '["A. An electron pair acceptor", "B. A proton donor", "C. A proton acceptor", "D. An electron pair donor"]', 'B', 'A Brønsted-Lowry acid donates protons (H⁺).', 'medium', 1, 21),

('q_chem_2024_022', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The pH of a 0.01M HCl solution is:', 'multiple_choice', '["A. 1", "B. 2", "C. 12", "D. 13"]', 'B', 'pH = -log[H⁺] = -log(0.01) = 2.', 'medium', 1, 22),

('q_chem_2024_023', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'A buffer solution:', 'multiple_choice', '["A. Has pH of exactly 7", "B. Resists changes in pH when small amounts of acid or base are added", "C. Contains only a strong acid", "D. Always has a high pH"]', 'B', 'Buffers maintain relatively constant pH upon addition of small amounts of acid or base.', 'hard', 1, 23),

('q_chem_2024_024', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Neutralization produces:', 'multiple_choice', '["A. Salt and hydrogen", "B. Salt and water", "C. Salt and oxygen", "D. Salt and carbon dioxide"]', 'B', 'Acid + Base → Salt + Water (neutralization).', 'easy', 1, 24),

('q_chem_2024_025', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Which is a strong acid?', 'multiple_choice', '["A. Acetic acid", "B. Carbonic acid", "C. Hydrochloric acid", "D. Citric acid"]', 'C', 'HCl is a strong acid that completely dissociates in water.', 'easy', 1, 25),

('q_chem_2024_026', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'An indicator that is red in acid and blue in base is:', 'multiple_choice', '["A. Phenolphthalein", "B. Litmus", "C. Methyl orange", "D. Bromothymol blue"]', 'B', 'Litmus is red in acid and blue in base/alkali.', 'easy', 1, 26),

('q_chem_2024_027', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Efflorescence is:', 'multiple_choice', '["A. Absorption of water from air", "B. Loss of water of crystallization to the atmosphere", "C. Dissolution in water", "D. Formation of crystals"]', 'B', 'Efflorescent substances lose water of crystallization to the air.', 'medium', 1, 27),

('q_chem_2024_028', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Deliquescence is:', 'multiple_choice', '["A. Loss of water to atmosphere", "B. Absorption of water from air to form a solution", "C. Evaporation", "D. Crystallization"]', 'B', 'Deliquescent substances absorb moisture and eventually dissolve.', 'medium', 1, 28),

-- Redox Reactions and Electrochemistry (Questions 29-35)
('q_chem_2024_029', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Oxidation is defined as:', 'multiple_choice', '["A. Loss of electrons", "B. Gain of electrons", "C. Loss of protons", "D. Gain of protons"]', 'A', 'Oxidation is loss of electrons (OIL RIG - Oxidation Is Loss).', 'easy', 1, 29),

('q_chem_2024_030', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'In electrolysis, reduction occurs at the:', 'multiple_choice', '["A. Anode", "B. Cathode", "C. Both electrodes", "D. Electrolyte"]', 'B', 'Cations move to cathode where they gain electrons (reduction).', 'easy', 1, 30),

('q_chem_2024_031', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The oxidation state of sulfur in H₂SO₄ is:', 'multiple_choice', '["A. +4", "B. +6", "C. -2", "D. +2"]', 'B', 'In H₂SO₄: 2(+1) + S + 4(-2) = 0, so S = +6.', 'medium', 1, 31),

('q_chem_2024_032', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'A reducing agent is a substance that:', 'multiple_choice', '["A. Gains electrons", "B. Loses electrons", "C. Gains protons", "D. Loses protons"]', 'B', 'A reducing agent loses electrons (gets oxidized) to reduce something else.', 'medium', 1, 32),

('q_chem_2024_033', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'During the electrolysis of brine, chlorine gas is produced at the:', 'multiple_choice', '["A. Cathode", "B. Anode", "C. Both electrodes", "D. Neither electrode"]', 'B', 'Chloride ions are oxidized at the anode: 2Cl⁻ → Cl₂ + 2e⁻.', 'medium', 1, 33),

('q_chem_2024_034', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Electroplating is used for:', 'multiple_choice', '["A. Extracting metals", "B. Coating metals with other metals", "C. Producing electricity", "D. Breaking down compounds"]', 'B', 'Electroplating deposits a thin layer of metal on an object.', 'easy', 1, 34),

('q_chem_2024_035', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'A galvanic cell converts:', 'multiple_choice', '["A. Electrical energy to chemical energy", "B. Chemical energy to electrical energy", "C. Heat energy to electrical energy", "D. Light energy to electrical energy"]', 'B', 'Galvanic/voltaic cells convert chemical energy to electrical energy.', 'medium', 1, 35),

-- Organic Chemistry (Questions 36-45)
('q_chem_2024_036', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The functional group of alcohols is:', 'multiple_choice', '["A. -CHO", "B. -OH", "C. -COOH", "D. -CO-"]', 'B', 'Alcohols contain the hydroxyl (-OH) functional group.', 'easy', 1, 36),

('q_chem_2024_037', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Alkenes contain:', 'multiple_choice', '["A. Only single bonds", "B. At least one double bond", "C. At least one triple bond", "D. No carbon-hydrogen bonds"]', 'B', 'Alkenes have at least one C=C double bond.', 'easy', 1, 37),

('q_chem_2024_038', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The general formula for alkanes is:', 'multiple_choice', '["A. CₙH₂ₙ", "B. CₙH₂ₙ₊₂", "C. CₙH₂ₙ₋₂", "D. CₙHₙ"]', 'B', 'Alkanes have the general formula CₙH₂ₙ₊₂ (saturated hydrocarbons).', 'easy', 1, 38),

('q_chem_2024_039', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Isomers are compounds that have:', 'multiple_choice', '["A. Same molecular formula but different structures", "B. Same structure but different formula", "C. Different atoms", "D. Same properties"]', 'A', 'Isomers have the same molecular formula but different structural arrangements.', 'easy', 1, 39),

('q_chem_2024_040', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Fermentation of glucose produces:', 'multiple_choice', '["A. Ethanol and oxygen", "B. Ethanol and carbon dioxide", "C. Methanol and water", "D. Ethanoic acid and water"]', 'B', 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ (fermentation).', 'easy', 1, 40),

('q_chem_2024_041', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The IUPAC name of CH₃CH₂OH is:', 'multiple_choice', '["A. Methanol", "B. Ethanol", "C. Propanol", "D. Ethene"]', 'B', 'CH₃CH₂OH is ethanol (2 carbons with -OH group).', 'easy', 1, 41),

('q_chem_2024_042', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Cracking of hydrocarbons produces:', 'multiple_choice', '["A. Larger molecules", "B. Smaller molecules", "C. The same molecules", "D. Only alkanes"]', 'B', 'Cracking breaks larger hydrocarbons into smaller, more useful ones.', 'easy', 1, 42),

('q_chem_2024_043', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Polymerization of ethene produces:', 'multiple_choice', '["A. Polystyrene", "B. Polyethene (polyethylene)", "C. PVC", "D. Nylon"]', 'B', 'Ethene monomers join to form polyethene.', 'easy', 1, 43),

('q_chem_2024_044', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Carboxylic acids have the functional group:', 'multiple_choice', '["A. -OH", "B. -CHO", "C. -COOH", "D. -CO-"]', 'C', 'Carboxylic acids contain the -COOH group.', 'easy', 1, 44),

('q_chem_2024_045', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Esterification is a reaction between:', 'multiple_choice', '["A. Acid and base", "B. Alcohol and carboxylic acid", "C. Two alcohols", "D. Two acids"]', 'B', 'Ester = Alcohol + Carboxylic acid (with loss of water).', 'medium', 1, 45),

-- Environmental and Industrial Chemistry (Questions 46-50)
('q_chem_2024_046', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The Contact Process is used to manufacture:', 'multiple_choice', '["A. Ammonia", "B. Nitric acid", "C. Sulfuric acid", "D. Hydrochloric acid"]', 'C', 'The Contact Process produces sulfuric acid industrially.', 'medium', 1, 46),

('q_chem_2024_047', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'The Haber Process produces:', 'multiple_choice', '["A. Ammonia", "B. Sulfuric acid", "C. Nitric acid", "D. Chlorine"]', 'A', 'Haber Process: N₂ + 3H₂ ⇌ 2NH₃ (ammonia synthesis).', 'easy', 1, 47),

('q_chem_2024_048', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Acid rain is caused mainly by:', 'multiple_choice', '["A. Carbon dioxide only", "B. Sulfur dioxide and nitrogen oxides", "C. Oxygen", "D. Water vapor"]', 'B', 'SO₂ and NOₓ dissolve in rainwater to form acids.', 'easy', 1, 48),

('q_chem_2024_049', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Hard water contains compounds of:', 'multiple_choice', '["A. Sodium and potassium", "B. Calcium and magnesium", "C. Iron and zinc", "D. Lead and copper"]', 'B', 'Hard water contains dissolved calcium and magnesium salts.', 'easy', 1, 49),

('q_chem_2024_050', 'subj_wassce_chemistry', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_chem_2024_1', 'Chlorination of water is done to:', 'multiple_choice', '["A. Soften the water", "B. Remove odor", "C. Kill microorganisms", "D. Add minerals"]', 'C', 'Chlorine disinfects water by killing harmful microorganisms.', 'easy', 1, 50);
