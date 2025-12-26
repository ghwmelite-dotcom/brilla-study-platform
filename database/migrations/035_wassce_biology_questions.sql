-- Migration 035: WASSCE Biology Questions
-- 50 questions for 2024 Paper 1

INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Cell Biology (Questions 1-10)
('q_bio_2024_001', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The cell membrane is primarily made up of:', 'multiple_choice', '["A. Proteins only", "B. Lipids only", "C. Phospholipid bilayer and proteins", "D. Carbohydrates only"]', 'C', 'The cell membrane consists of a phospholipid bilayer with embedded proteins.', 'medium', 1, 1),

('q_bio_2024_002', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Which organelle is responsible for aerobic respiration?', 'multiple_choice', '["A. Nucleus", "B. Ribosome", "C. Mitochondrion", "D. Golgi apparatus"]', 'C', 'Mitochondria are the sites of aerobic respiration, producing ATP.', 'easy', 1, 2),

('q_bio_2024_003', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The rough endoplasmic reticulum has ribosomes attached to it and is involved in:', 'multiple_choice', '["A. Lipid synthesis", "B. Protein synthesis", "C. Carbohydrate storage", "D. Cell division"]', 'B', 'Rough ER with ribosomes synthesizes proteins for secretion.', 'easy', 1, 3),

('q_bio_2024_004', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'During mitosis, chromosomes are visible in which phase?', 'multiple_choice', '["A. Interphase", "B. Prophase", "C. Metaphase", "D. Cytokinesis"]', 'B', 'Chromosomes condense and become visible in prophase.', 'medium', 1, 4),

('q_bio_2024_005', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The cell wall is present in:', 'multiple_choice', '["A. Animal cells only", "B. Plant cells only", "C. Both plant and animal cells", "D. Neither plant nor animal cells"]', 'B', 'Plant cells have cell walls made of cellulose; animal cells do not.', 'easy', 1, 5),

('q_bio_2024_006', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The process by which cells obtain energy without oxygen is:', 'multiple_choice', '["A. Aerobic respiration", "B. Photosynthesis", "C. Anaerobic respiration", "D. Transpiration"]', 'C', 'Anaerobic respiration releases energy without using oxygen.', 'easy', 1, 6),

('q_bio_2024_007', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Active transport differs from diffusion because it:', 'multiple_choice', '["A. Does not require energy", "B. Moves substances down a concentration gradient", "C. Requires energy to move substances against concentration gradient", "D. Only occurs in plants"]', 'C', 'Active transport uses ATP to move substances against their gradient.', 'medium', 1, 7),

('q_bio_2024_008', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The stage of mitosis where chromosomes align at the cell''s equator is:', 'multiple_choice', '["A. Prophase", "B. Metaphase", "C. Anaphase", "D. Telophase"]', 'B', 'In metaphase, chromosomes line up at the metaphase plate/equator.', 'medium', 1, 8),

('q_bio_2024_009', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Chloroplasts are found in:', 'multiple_choice', '["A. All cells", "B. Only animal cells", "C. Only plant cells and algae", "D. Only bacteria"]', 'C', 'Chloroplasts are the sites of photosynthesis in plants and algae.', 'easy', 1, 9),

('q_bio_2024_010', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Meiosis produces:', 'multiple_choice', '["A. Two identical cells", "B. Four identical cells", "C. Four genetically different cells", "D. One large cell"]', 'C', 'Meiosis produces four genetically different haploid cells.', 'medium', 1, 10),

-- Genetics and Heredity (Questions 11-20)
('q_bio_2024_011', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The basic unit of heredity is the:', 'multiple_choice', '["A. Chromosome", "B. Cell", "C. Gene", "D. Nucleotide"]', 'C', 'Genes are segments of DNA that code for specific traits.', 'easy', 1, 11),

('q_bio_2024_012', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'If both parents are heterozygous (Aa), the probability of having an offspring with genotype aa is:', 'multiple_choice', '["A. 25%", "B. 50%", "C. 75%", "D. 100%"]', 'A', 'Aa × Aa gives AA:Aa:Aa:aa = 1:2:1, so 25% are aa.', 'medium', 1, 12),

('q_bio_2024_013', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The complementary base pair to Adenine in DNA is:', 'multiple_choice', '["A. Guanine", "B. Cytosine", "C. Thymine", "D. Uracil"]', 'C', 'In DNA, Adenine pairs with Thymine (A-T).', 'easy', 1, 13),

('q_bio_2024_014', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Sex-linked traits are usually carried on the:', 'multiple_choice', '["A. Y chromosome only", "B. X chromosome", "C. Autosomes", "D. Mitochondrial DNA"]', 'B', 'Most sex-linked traits are on the X chromosome.', 'medium', 1, 14),

('q_bio_2024_015', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'A mutation is:', 'multiple_choice', '["A. Normal cell division", "B. A change in DNA sequence", "C. Protein synthesis", "D. Cell death"]', 'B', 'Mutations are changes in the nucleotide sequence of DNA.', 'easy', 1, 15),

('q_bio_2024_016', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Sickle cell disease is caused by:', 'multiple_choice', '["A. Viral infection", "B. Bacterial infection", "C. Gene mutation", "D. Nutritional deficiency"]', 'C', 'Sickle cell disease results from a mutation in the hemoglobin gene.', 'easy', 1, 16),

('q_bio_2024_017', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The genotype of a carrier of a recessive trait is:', 'multiple_choice', '["A. Homozygous dominant", "B. Homozygous recessive", "C. Heterozygous", "D. None of the above"]', 'C', 'Carriers are heterozygous - they carry one recessive allele but don''t express it.', 'medium', 1, 17),

('q_bio_2024_018', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The Human Genome Project aimed to:', 'multiple_choice', '["A. Clone humans", "B. Map all human genes", "C. Create new species", "D. Cure all diseases"]', 'B', 'The Human Genome Project mapped the entire human genetic sequence.', 'medium', 1, 18),

('q_bio_2024_019', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Blood type in humans is an example of:', 'multiple_choice', '["A. Simple dominance", "B. Incomplete dominance", "C. Codominance", "D. Sex linkage"]', 'C', 'ABO blood types show codominance (A and B) and multiple alleles.', 'hard', 1, 19),

('q_bio_2024_020', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Down syndrome is caused by:', 'multiple_choice', '["A. Gene mutation", "B. Extra copy of chromosome 21", "C. Missing X chromosome", "D. Extra Y chromosome"]', 'B', 'Down syndrome (Trisomy 21) results from three copies of chromosome 21.', 'medium', 1, 20),

-- Ecology and Environment (Questions 21-30)
('q_bio_2024_021', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'A food chain always starts with:', 'multiple_choice', '["A. Consumers", "B. Decomposers", "C. Producers", "D. Predators"]', 'C', 'Producers (autotrophs) form the base of food chains.', 'easy', 1, 21),

('q_bio_2024_022', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'An ecosystem consists of:', 'multiple_choice', '["A. Only living organisms", "B. Only non-living factors", "C. Both living organisms and their physical environment", "D. Only plants"]', 'C', 'An ecosystem includes biotic (living) and abiotic (non-living) components.', 'easy', 1, 22),

('q_bio_2024_023', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The nitrogen cycle involves:', 'multiple_choice', '["A. Only plants", "B. Only bacteria", "C. Plants, animals, bacteria, and the atmosphere", "D. Only animals"]', 'C', 'The nitrogen cycle involves various organisms and the atmosphere.', 'medium', 1, 23),

('q_bio_2024_024', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Organisms that break down dead organic matter are called:', 'multiple_choice', '["A. Producers", "B. Consumers", "C. Decomposers", "D. Parasites"]', 'C', 'Decomposers (bacteria and fungi) break down dead organic matter.', 'easy', 1, 24),

('q_bio_2024_025', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Symbiosis where both organisms benefit is called:', 'multiple_choice', '["A. Parasitism", "B. Commensalism", "C. Mutualism", "D. Predation"]', 'C', 'Mutualism is a symbiotic relationship benefiting both organisms.', 'easy', 1, 25),

('q_bio_2024_026', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Eutrophication is caused by:', 'multiple_choice', '["A. Lack of nutrients", "B. Excess nutrients in water bodies", "C. High oxygen levels", "D. Cold temperatures"]', 'B', 'Eutrophication results from excess nutrients causing algal blooms.', 'medium', 1, 26),

('q_bio_2024_027', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The greenhouse effect is primarily caused by:', 'multiple_choice', '["A. Oxygen", "B. Nitrogen", "C. Carbon dioxide and other greenhouse gases", "D. Hydrogen"]', 'C', 'CO₂ and other greenhouse gases trap heat in the atmosphere.', 'easy', 1, 27),

('q_bio_2024_028', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'A population is defined as:', 'multiple_choice', '["A. All organisms in an area", "B. Organisms of the same species in an area", "C. All plants in an area", "D. All animals in an area"]', 'B', 'A population consists of organisms of the same species in a defined area.', 'easy', 1, 28),

('q_bio_2024_029', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Primary succession occurs on:', 'multiple_choice', '["A. Existing soil", "B. Bare rock with no soil", "C. Farmland", "D. Forest floors"]', 'B', 'Primary succession begins on bare surfaces with no prior soil.', 'medium', 1, 29),

('q_bio_2024_030', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The ozone layer protects living things from:', 'multiple_choice', '["A. Infrared radiation", "B. Ultraviolet radiation", "C. Visible light", "D. Radio waves"]', 'B', 'The ozone layer absorbs harmful UV radiation from the sun.', 'easy', 1, 30),

-- Human Physiology (Questions 31-40)
('q_bio_2024_031', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The largest organ in the human body is the:', 'multiple_choice', '["A. Heart", "B. Liver", "C. Skin", "D. Lungs"]', 'C', 'The skin is the largest organ, covering about 2 square meters.', 'easy', 1, 31),

('q_bio_2024_032', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Red blood cells are produced in the:', 'multiple_choice', '["A. Liver", "B. Spleen", "C. Bone marrow", "D. Heart"]', 'C', 'Red blood cells are produced in the red bone marrow.', 'easy', 1, 32),

('q_bio_2024_033', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The hormone insulin is produced by the:', 'multiple_choice', '["A. Thyroid gland", "B. Pancreas", "C. Adrenal gland", "D. Pituitary gland"]', 'B', 'Insulin is produced by beta cells in the pancreatic islets.', 'easy', 1, 33),

('q_bio_2024_034', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The functional unit of the kidney is the:', 'multiple_choice', '["A. Alveolus", "B. Nephron", "C. Neuron", "D. Villus"]', 'B', 'Nephrons filter blood and produce urine.', 'easy', 1, 34),

('q_bio_2024_035', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The part of the brain responsible for memory and learning is the:', 'multiple_choice', '["A. Cerebellum", "B. Medulla oblongata", "C. Cerebrum", "D. Hypothalamus"]', 'C', 'The cerebrum is responsible for higher functions including memory and learning.', 'medium', 1, 35),

('q_bio_2024_036', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Digestion of starch begins in the:', 'multiple_choice', '["A. Stomach", "B. Small intestine", "C. Mouth", "D. Large intestine"]', 'C', 'Salivary amylase begins starch digestion in the mouth.', 'easy', 1, 36),

('q_bio_2024_037', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The chamber of the heart that pumps blood to the lungs is the:', 'multiple_choice', '["A. Left atrium", "B. Left ventricle", "C. Right atrium", "D. Right ventricle"]', 'D', 'The right ventricle pumps deoxygenated blood to the lungs.', 'medium', 1, 37),

('q_bio_2024_038', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The function of white blood cells is to:', 'multiple_choice', '["A. Carry oxygen", "B. Fight infections", "C. Clot blood", "D. Transport nutrients"]', 'B', 'White blood cells (leukocytes) are part of the immune system.', 'easy', 1, 38),

('q_bio_2024_039', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The gas exchange in humans takes place in the:', 'multiple_choice', '["A. Trachea", "B. Bronchi", "C. Alveoli", "D. Pharynx"]', 'C', 'Gas exchange occurs across the thin walls of alveoli.', 'easy', 1, 39),

('q_bio_2024_040', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Pepsin digests:', 'multiple_choice', '["A. Carbohydrates", "B. Proteins", "C. Fats", "D. Vitamins"]', 'B', 'Pepsin is a protease enzyme that digests proteins in the stomach.', 'easy', 1, 40),

-- Evolution and Classification (Questions 41-50)
('q_bio_2024_041', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The theory of evolution by natural selection was proposed by:', 'multiple_choice', '["A. Gregor Mendel", "B. Charles Darwin", "C. Louis Pasteur", "D. Robert Hooke"]', 'B', 'Charles Darwin proposed the theory of evolution by natural selection.', 'easy', 1, 41),

('q_bio_2024_042', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The correct order of classification from largest to smallest is:', 'multiple_choice', '["A. Kingdom, Phylum, Class, Order, Family, Genus, Species", "B. Species, Genus, Family, Order, Class, Phylum, Kingdom", "C. Kingdom, Class, Phylum, Order, Family, Genus, Species", "D. Phylum, Kingdom, Class, Order, Family, Genus, Species"]', 'A', 'The hierarchy is: Kingdom, Phylum, Class, Order, Family, Genus, Species.', 'medium', 1, 42),

('q_bio_2024_043', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Homologous structures suggest:', 'multiple_choice', '["A. Convergent evolution", "B. Common ancestry", "C. No relationship", "D. Different functions only"]', 'B', 'Homologous structures indicate common ancestry.', 'medium', 1, 43),

('q_bio_2024_044', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Bacteria belong to the kingdom:', 'multiple_choice', '["A. Animalia", "B. Plantae", "C. Fungi", "D. Monera/Prokaryotae"]', 'D', 'Bacteria are prokaryotes in the kingdom Monera (or domain Bacteria).', 'easy', 1, 44),

('q_bio_2024_045', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Fossils provide evidence for evolution because they show:', 'multiple_choice', '["A. How organisms look today", "B. Changes in organisms over time", "C. Only living species", "D. Only extinct species"]', 'B', 'Fossils show how organisms have changed over millions of years.', 'easy', 1, 45),

('q_bio_2024_046', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The binomial nomenclature system was developed by:', 'multiple_choice', '["A. Charles Darwin", "B. Gregor Mendel", "C. Carolus Linnaeus", "D. Robert Hooke"]', 'C', 'Linnaeus developed the binomial naming system for organisms.', 'medium', 1, 46),

('q_bio_2024_047', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Variation in a population is important for evolution because it:', 'multiple_choice', '["A. Makes all organisms identical", "B. Provides raw material for natural selection", "C. Eliminates weak organisms", "D. Stops evolution"]', 'B', 'Variation provides the diversity on which natural selection acts.', 'medium', 1, 47),

('q_bio_2024_048', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Organisms that can interbreed and produce fertile offspring belong to the same:', 'multiple_choice', '["A. Genus", "B. Family", "C. Species", "D. Order"]', 'C', 'A species is defined by the ability to interbreed and produce fertile offspring.', 'easy', 1, 48),

('q_bio_2024_049', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'The adaptation of organisms to their environment over time is called:', 'multiple_choice', '["A. Mutation", "B. Evolution", "C. Variation", "D. Hybridization"]', 'B', 'Evolution is the change in heritable characteristics of populations over generations.', 'easy', 1, 49),

('q_bio_2024_050', 'subj_wassce_biology', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_bio_2024_1', 'Which of the following is NOT a kingdom of life?', 'multiple_choice', '["A. Animalia", "B. Plantae", "C. Insecta", "D. Fungi"]', 'C', 'Insecta is a class within Animalia, not a kingdom.', 'easy', 1, 50);
