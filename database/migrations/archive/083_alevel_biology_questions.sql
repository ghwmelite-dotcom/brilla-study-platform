-- A-Level Biology Questions (40 questions)

-- Cell Structure and Ultrastructure
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_001', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is the function of the rough endoplasmic reticulum?', 'short_answer', NULL, 'Synthesis of proteins destined for secretion or membrane insertion. Ribosomes on its surface synthesise proteins that enter the RER for modification and transport.', 'Proteins are then transported to Golgi for further processing.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_002', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Describe the structure and function of the Golgi apparatus.', 'short_answer', NULL, 'Stack of flattened membrane-bound sacs (cisternae). Functions: modifies proteins (glycosylation), packages them into vesicles, and sorts for transport to destinations or secretion.', 'Part of the endomembrane system.', 'medium', 4, 4, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_003', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is the resolution limit of a light microscope and why?', 'short_answer', NULL, 'Approximately 200 nm. Limited by the wavelength of visible light. Objects closer than half the wavelength cannot be distinguished as separate.', 'Electron microscopes use shorter wavelengths for higher resolution.', 'hard', 4, 3, NULL, 'board_cambridge', 'Explain');

-- Biological Molecules
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_004', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Describe the four levels of protein structure.', 'short_answer', NULL, 'Primary: sequence of amino acids. Secondary: local folding (alpha helix, beta sheet) by H-bonds. Tertiary: 3D shape by various bonds. Quaternary: multiple polypeptide chains together.', 'Structure determines function in proteins.', 'medium', 4, 4, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_005', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What type of bond forms between amino acids in a polypeptide chain?', 'multiple_choice', '["A. Hydrogen bond", "B. Ionic bond", "C. Peptide bond", "D. Disulfide bridge"]', 'C', 'Peptide bonds form by condensation reaction between amino and carboxyl groups.', 'easy', 4, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_006', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Explain why enzymes are specific to their substrates.', 'short_answer', NULL, 'The active site has a specific 3D shape that is complementary to the shape of the substrate (induced fit model). Only substrates with matching shape can bind and react.', 'Enzyme specificity is due to tertiary structure.', 'medium', 4, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_007', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is competitive inhibition?', 'short_answer', NULL, 'An inhibitor molecule with similar shape to the substrate competes for the active site. Can be overcome by increasing substrate concentration. Increases Km but Vmax unchanged.', 'Example: malonate inhibiting succinate dehydrogenase.', 'hard', 4, 3, NULL, 'board_cambridge', 'Define');

-- Nucleic Acids
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_008', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Describe three differences between DNA and RNA.', 'short_answer', NULL, 'DNA: deoxyribose sugar, double-stranded, thymine. RNA: ribose sugar, single-stranded, uracil. DNA is stable and permanent; RNA is temporary.', 'Both are polynucleotides with phosphodiester bonds.', 'medium', 4, 3, NULL, 'board_cambridge', 'Compare');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_009', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Explain the process of semi-conservative DNA replication.', 'short_answer', NULL, 'DNA helicase unwinds and separates strands. Each strand acts as template. DNA polymerase adds complementary nucleotides. Each new molecule has one original and one new strand.', 'Proved by Meselson-Stahl experiment.', 'hard', 4, 5, NULL, 'board_cambridge', 'Explain');

-- Cell Division
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_010', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What are the key events of metaphase in mitosis?', 'short_answer', NULL, 'Chromosomes align at the cell equator (metaphase plate). Spindle fibres attach to centromeres. Each chromosome has sister chromatids still joined.', 'Allows equal separation in anaphase.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_011', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is crossing over and when does it occur?', 'short_answer', NULL, 'Exchange of genetic material between homologous chromosomes during prophase I of meiosis. Chromatids break and rejoin, creating new allele combinations.', 'Increases genetic variation in gametes.', 'hard', 4, 3, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_012', 'topic_biology', 'subj_alevel_biology', 'alevel', 'How many chromosomes are in a human gamete?', 'multiple_choice', '["A. 23", "B. 46", "C. 92", "D. 12"]', 'A', 'Gametes are haploid (n) with 23 chromosomes. Body cells are diploid (2n) with 46.', 'easy', 4, 1, NULL, 'board_cambridge', 'State');

-- Gas Exchange
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_013', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Describe the structure of haemoglobin and explain how it transports oxygen.', 'short_answer', NULL, 'Four polypeptide chains (2 alpha, 2 beta), each with a haem group containing iron. Oxygen binds reversibly to iron. Cooperative binding: binding of first O2 makes subsequent binding easier.', 'Results in sigmoidal oxygen dissociation curve.', 'hard', 4, 5, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_014', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is the Bohr effect?', 'short_answer', NULL, 'At lower pH (higher CO2), haemoglobin has reduced affinity for oxygen and releases it more readily. This ensures oxygen is delivered to actively respiring tissues.', 'The dissociation curve shifts right.', 'hard', 4, 3, NULL, 'board_cambridge', 'Define');

-- Genetics and Inheritance
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_015', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Outline the process of transcription.', 'short_answer', NULL, 'RNA polymerase binds to promoter, unwinds DNA. Template strand read 3 to 5. mRNA synthesised 5 to 3 with complementary bases. mRNA released when terminator reached.', 'Occurs in nucleus in eukaryotes.', 'medium', 4, 4, NULL, 'board_cambridge', 'Outline');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_016', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is a codon?', 'multiple_choice', '["A. Three bases on DNA coding for an amino acid", "B. Three bases on mRNA coding for an amino acid", "C. Three bases on tRNA", "D. A single nucleotide"]', 'B', 'Codons are triplets of bases on mRNA. 64 possible codons code for 20 amino acids plus stop signals.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_017', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Explain what is meant by X-linked inheritance.', 'short_answer', NULL, 'Genes located on the X chromosome. Males have only one X so express any allele present. Females need two copies of recessive allele to show phenotype. More common in males.', 'Examples: haemophilia, red-green colour blindness.', 'hard', 4, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_018', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is a dihybrid cross?', 'short_answer', NULL, 'A genetic cross considering two genes simultaneously. For two heterozygotes (AaBb × AaBb), offspring ratio is 9:3:3:1 if genes are independently assorted.', 'Follows Mendels law of independent assortment.', 'medium', 4, 2, NULL, 'board_cambridge', 'Define');

-- Homeostasis
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_019', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Describe negative feedback in blood glucose regulation.', 'short_answer', NULL, 'High glucose: beta cells release insulin, stimulates glucose uptake and glycogen formation, glucose falls. Low glucose: alpha cells release glucagon, stimulates glycogenolysis, glucose rises. Return to set point.', 'Negative feedback maintains homeostasis.', 'medium', 4, 4, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_020', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is the role of ADH in osmoregulation?', 'short_answer', NULL, 'ADH increases water permeability of collecting duct. When blood is too concentrated, more ADH released, more water reabsorbed, smaller volume of concentrated urine produced.', 'Released from posterior pituitary.', 'hard', 4, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_021', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Where is ultrafiltration carried out in the kidney?', 'multiple_choice', '["A. Loop of Henle", "B. Collecting duct", "C. Bowmans capsule", "D. Distal tubule"]', 'C', 'High pressure in glomerulus forces small molecules through fenestrated capillaries and basement membrane into Bowmans capsule.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

-- Nervous System
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_022', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Explain how an action potential is generated.', 'short_answer', NULL, 'Stimulus causes Na+ channels to open. Na+ enters, membrane depolarises. At threshold, more Na+ channels open (positive feedback). Membrane reaches +40mV. Na+ channels close, K+ channels open. K+ leaves, repolarisation occurs.', 'All-or-nothing response.', 'hard', 4, 5, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_023', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is the role of acetylcholine at a synapse?', 'short_answer', NULL, 'Neurotransmitter released from presynaptic membrane, diffuses across synaptic cleft, binds to receptors on postsynaptic membrane, opens ion channels causing depolarisation or hyperpolarisation.', 'Broken down by acetylcholinesterase.', 'medium', 4, 3, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_024', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is the resting potential of a neurone?', 'multiple_choice', '["A. +40 mV", "B. 0 mV", "C. -70 mV", "D. -90 mV"]', 'C', 'Maintained by Na+/K+ ATPase pump (3 Na+ out, 2 K+ in) and K+ leak channels.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

-- Immunity
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_025', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Describe the difference between cell-mediated and humoral immunity.', 'short_answer', NULL, 'Cell-mediated: T lymphocytes directly attack infected cells. Humoral: B lymphocytes produce antibodies that circulate in blood and lymph to neutralise pathogens.', 'Both require antigen presentation.', 'hard', 4, 4, NULL, 'board_cambridge', 'Compare');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_026', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What are memory cells and why are they important?', 'short_answer', NULL, 'Long-lived B and T cells that remain after primary immune response. On re-exposure to same antigen, they enable faster and stronger secondary response, providing immunity.', 'Basis of vaccination effectiveness.', 'medium', 4, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_027', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is an antigen?', 'multiple_choice', '["A. A protein that destroys pathogens", "B. A molecule that triggers an immune response", "C. A type of white blood cell", "D. An antibody"]', 'B', 'Antigens are usually proteins or glycoproteins on pathogen surfaces that are recognised as foreign.', 'easy', 4, 1, NULL, 'board_cambridge', 'Define');

-- Ecology
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_028', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Explain why only about 10% of energy is transferred between trophic levels.', 'short_answer', NULL, 'Energy is lost through respiration (heat), in egested waste, excretion, and parts not eaten. Only energy stored in biomass is available to next level.', 'Limits length of food chains.', 'medium', 4, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_029', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is the nitrogen cycle?', 'short_answer', NULL, 'Cycling of nitrogen: nitrogen fixation (N2 to NH3), nitrification (NH3 to NO3-), assimilation by plants, decomposition, denitrification (NO3- to N2). Involves bacteria at key stages.', 'Essential for amino acid and nucleotide synthesis.', 'hard', 4, 4, NULL, 'board_cambridge', 'Describe');

-- Evolution
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_030', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Explain the process of natural selection.', 'short_answer', NULL, 'Variation exists in population. Some variations give survival advantage. Better-adapted individuals more likely to survive, reproduce, pass on alleles. Over generations, advantageous alleles increase in frequency.', 'Mechanism of evolution.', 'medium', 4, 4, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_031', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is genetic drift?', 'short_answer', NULL, 'Random changes in allele frequencies in a population, more significant in small populations. Can lead to loss of alleles regardless of their selective value.', 'Bottleneck and founder effects are examples.', 'hard', 4, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_032', 'topic_biology', 'subj_alevel_biology', 'alevel', 'How can speciation occur?', 'short_answer', NULL, 'Geographical or reproductive isolation prevents gene flow between populations. Different selection pressures and genetic drift cause populations to diverge. Eventually they cannot interbreed.', 'Allopatric (geographical) vs sympatric speciation.', 'hard', 4, 4, NULL, 'board_cambridge', 'Explain');

-- Photosynthesis
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_033', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Where does the light-dependent reaction of photosynthesis occur?', 'multiple_choice', '["A. Stroma", "B. Thylakoid membrane", "C. Cytoplasm", "D. Matrix"]', 'B', 'Photosystems I and II in thylakoid membrane capture light energy for ATP and NADPH production.', 'easy', 4, 1, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_034', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Describe the Calvin cycle.', 'short_answer', NULL, 'CO2 fixed by RuBisCO to RuBP, forming 2 GP. GP reduced using ATP and NADPH to form triose phosphate. Some TP used to make glucose, rest regenerates RuBP.', 'Occurs in stroma of chloroplast.', 'hard', 4, 5, NULL, 'board_cambridge', 'Describe');

-- Respiration
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_035', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is the role of NAD in respiration?', 'short_answer', NULL, 'NAD is a coenzyme that accepts hydrogen atoms (electrons) during glycolysis and Krebs cycle, forming NADH. NADH carries electrons to electron transport chain for ATP synthesis.', 'Essential for oxidative phosphorylation.', 'medium', 4, 3, NULL, 'board_cambridge', 'Explain');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_036', 'topic_biology', 'subj_alevel_biology', 'alevel', 'How many ATP molecules are theoretically produced from one glucose molecule in aerobic respiration?', 'multiple_choice', '["A. 2", "B. 4", "C. 32-38", "D. 100"]', 'C', 'Glycolysis: 2 ATP. Krebs: 2 ATP. Oxidative phosphorylation: 28-34 ATP. Total: 32-38 ATP.', 'medium', 4, 1, NULL, 'board_cambridge', 'State');

-- Biotechnology
INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_037', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is PCR and what is it used for?', 'short_answer', NULL, 'Polymerase Chain Reaction amplifies small DNA samples. Uses heating to denature, cooling for primer annealing, and Taq polymerase for extension. Doubles DNA each cycle.', 'Used in forensics, diagnosis, research.', 'medium', 4, 3, NULL, 'board_cambridge', 'Describe');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_038', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is gel electrophoresis used for?', 'short_answer', NULL, 'Separating DNA or protein fragments by size. Molecules move through gel matrix in electric field; smaller fragments move faster. Used in DNA fingerprinting and protein analysis.', 'Distance moved is proportional to log of molecular weight.', 'medium', 4, 2, NULL, 'board_cambridge', 'State');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_039', 'topic_biology', 'subj_alevel_biology', 'alevel', 'What is a restriction enzyme?', 'short_answer', NULL, 'Enzyme that cuts DNA at specific recognition sequences. Produces fragments with sticky or blunt ends. Used to cut genes for genetic engineering and in DNA fingerprinting.', 'Derived from bacteria as defence mechanism.', 'medium', 4, 2, NULL, 'board_cambridge', 'Define');

INSERT OR IGNORE INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, options, correct_answer, explanation, difficulty, points, marks, syllabus_topic_id, exam_board_id, command_word) VALUES
('q_alevel_bio_040', 'topic_biology', 'subj_alevel_biology', 'alevel', 'Explain how CRISPR-Cas9 is used for gene editing.', 'short_answer', NULL, 'Guide RNA directs Cas9 enzyme to specific DNA sequence. Cas9 cuts both strands. Cells repair mechanism can be used to delete, modify or insert genes at the cut site.', 'Revolutionary tool for genetic modification.', 'hard', 4, 4, NULL, 'board_cambridge', 'Explain');
