-- Migration 038: BECE Integrated Science Questions
-- 40 questions each for 2024 and 2023 Paper 1

INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- BECE Integrated Science 2024 Paper 1
('q_bece_sci_2024_001', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The basic unit of life is the:', 'multiple_choice', '["A. Tissue", "B. Organ", "C. Cell", "D. System"]', 'C', 'The cell is the smallest unit of life.', 'easy', 1, 1),

('q_bece_sci_2024_002', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'Water boils at:', 'multiple_choice', '["A. 0°C", "B. 50°C", "C. 100°C", "D. 200°C"]', 'C', 'Water boils at 100°C at standard atmospheric pressure.', 'easy', 1, 2),

('q_bece_sci_2024_003', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The gas needed for burning is:', 'multiple_choice', '["A. Carbon dioxide", "B. Nitrogen", "C. Oxygen", "D. Hydrogen"]', 'C', 'Oxygen is required for combustion (burning).', 'easy', 1, 3),

('q_bece_sci_2024_004', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The organ that pumps blood in the body is the:', 'multiple_choice', '["A. Brain", "B. Lungs", "C. Heart", "D. Kidney"]', 'C', 'The heart pumps blood throughout the body.', 'easy', 1, 4),

('q_bece_sci_2024_005', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'Plants make their food through:', 'multiple_choice', '["A. Respiration", "B. Photosynthesis", "C. Transpiration", "D. Digestion"]', 'B', 'Photosynthesis is the process plants use to make food.', 'easy', 1, 5),

('q_bece_sci_2024_006', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'A magnet attracts:', 'multiple_choice', '["A. Wood", "B. Plastic", "C. Iron", "D. Glass"]', 'C', 'Iron is a magnetic material attracted by magnets.', 'easy', 1, 6),

('q_bece_sci_2024_007', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The SI unit of force is:', 'multiple_choice', '["A. Meter", "B. Kilogram", "C. Newton", "D. Joule"]', 'C', 'Force is measured in Newtons (N).', 'easy', 1, 7),

('q_bece_sci_2024_008', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The chemical symbol for water is:', 'multiple_choice', '["A. CO₂", "B. H₂O", "C. NaCl", "D. O₂"]', 'B', 'Water is H₂O (two hydrogen and one oxygen).', 'easy', 1, 8),

('q_bece_sci_2024_009', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The function of the roots of a plant is to:', 'multiple_choice', '["A. Make food", "B. Absorb water and minerals", "C. Produce flowers", "D. Release oxygen"]', 'B', 'Roots absorb water and minerals from the soil.', 'easy', 1, 9),

('q_bece_sci_2024_010', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'An example of a simple machine is:', 'multiple_choice', '["A. Car engine", "B. Lever", "C. Computer", "D. Television"]', 'B', 'A lever is a simple machine that helps lift loads.', 'easy', 1, 10),

('q_bece_sci_2024_011', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'Malaria is caused by:', 'multiple_choice', '["A. Bacteria", "B. Virus", "C. Plasmodium", "D. Fungus"]', 'C', 'Malaria is caused by Plasmodium parasites.', 'easy', 1, 11),

('q_bece_sci_2024_012', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The process by which water changes to vapor is called:', 'multiple_choice', '["A. Condensation", "B. Evaporation", "C. Precipitation", "D. Freezing"]', 'B', 'Evaporation is the change from liquid to gas.', 'easy', 1, 12),

('q_bece_sci_2024_013', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The teeth used for biting are called:', 'multiple_choice', '["A. Canines", "B. Incisors", "C. Molars", "D. Premolars"]', 'B', 'Incisors are the front teeth used for biting.', 'easy', 1, 13),

('q_bece_sci_2024_014', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'Light travels in:', 'multiple_choice', '["A. Curved lines", "B. Straight lines", "C. Zigzag lines", "D. Circular paths"]', 'B', 'Light travels in straight lines.', 'easy', 1, 14),

('q_bece_sci_2024_015', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The gas that plants use for photosynthesis is:', 'multiple_choice', '["A. Oxygen", "B. Nitrogen", "C. Carbon dioxide", "D. Hydrogen"]', 'C', 'Plants use carbon dioxide for photosynthesis.', 'easy', 1, 15),

('q_bece_sci_2024_016', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The part of the blood that fights infection is:', 'multiple_choice', '["A. Red blood cells", "B. White blood cells", "C. Platelets", "D. Plasma"]', 'B', 'White blood cells protect against infection.', 'easy', 1, 16),

('q_bece_sci_2024_017', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'A solution with pH less than 7 is:', 'multiple_choice', '["A. Basic", "B. Neutral", "C. Acidic", "D. Alkaline"]', 'C', 'Acids have pH less than 7.', 'easy', 1, 17),

('q_bece_sci_2024_018', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The skeleton provides:', 'multiple_choice', '["A. Food for the body", "B. Support and protection", "C. Hormones", "D. Digestion"]', 'B', 'The skeleton supports the body and protects organs.', 'easy', 1, 18),

('q_bece_sci_2024_019', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'Sound travels fastest through:', 'multiple_choice', '["A. Air", "B. Water", "C. Vacuum", "D. Solids"]', 'D', 'Sound travels fastest through solids.', 'medium', 1, 19),

('q_bece_sci_2024_020', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'An example of a renewable energy source is:', 'multiple_choice', '["A. Coal", "B. Oil", "C. Solar energy", "D. Natural gas"]', 'C', 'Solar energy is renewable because the sun continues to shine.', 'easy', 1, 20),

('q_bece_sci_2024_021', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The process of breathing in is called:', 'multiple_choice', '["A. Exhalation", "B. Inhalation", "C. Respiration", "D. Inspiration"]', 'B', 'Inhalation is breathing in; exhalation is breathing out.', 'easy', 1, 21),

('q_bece_sci_2024_022', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The three states of matter are:', 'multiple_choice', '["A. Solid, liquid, gas", "B. Hot, warm, cold", "C. Light, heavy, medium", "D. Large, small, tiny"]', 'A', 'Matter exists in solid, liquid, and gas states.', 'easy', 1, 22),

('q_bece_sci_2024_023', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The organ for hearing is the:', 'multiple_choice', '["A. Eye", "B. Nose", "C. Ear", "D. Tongue"]', 'C', 'The ear is the organ for hearing.', 'easy', 1, 23),

('q_bece_sci_2024_024', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'Rusting of iron is a:', 'multiple_choice', '["A. Physical change", "B. Chemical change", "C. Temporary change", "D. Reversible change"]', 'B', 'Rusting is a chemical change as iron reacts with oxygen and water.', 'easy', 1, 24),

('q_bece_sci_2024_025', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'An animal that eats only plants is called a:', 'multiple_choice', '["A. Carnivore", "B. Omnivore", "C. Herbivore", "D. Scavenger"]', 'C', 'Herbivores eat only plants.', 'easy', 1, 25),

('q_bece_sci_2024_026', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The force that pulls objects towards the Earth is called:', 'multiple_choice', '["A. Friction", "B. Gravity", "C. Magnetism", "D. Tension"]', 'B', 'Gravity pulls objects toward Earth.', 'easy', 1, 26),

('q_bece_sci_2024_027', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The vitamin needed for healthy bones is:', 'multiple_choice', '["A. Vitamin A", "B. Vitamin B", "C. Vitamin C", "D. Vitamin D"]', 'D', 'Vitamin D helps the body absorb calcium for strong bones.', 'easy', 1, 27),

('q_bece_sci_2024_028', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'An electrical circuit must be:', 'multiple_choice', '["A. Open", "B. Closed", "C. Broken", "D. Disconnected"]', 'B', 'A closed circuit allows electricity to flow.', 'easy', 1, 28),

('q_bece_sci_2024_029', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The human body has _____ senses.', 'multiple_choice', '["A. Three", "B. Four", "C. Five", "D. Six"]', 'C', 'The five senses are sight, hearing, smell, taste, and touch.', 'easy', 1, 29),

('q_bece_sci_2024_030', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'Water freezes at:', 'multiple_choice', '["A. -10°C", "B. 0°C", "C. 10°C", "D. 100°C"]', 'B', 'Water freezes at 0°C.', 'easy', 1, 30),

('q_bece_sci_2024_031', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The planet closest to the Sun is:', 'multiple_choice', '["A. Venus", "B. Earth", "C. Mercury", "D. Mars"]', 'C', 'Mercury is the closest planet to the Sun.', 'easy', 1, 31),

('q_bece_sci_2024_032', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The organ that filters blood and produces urine is the:', 'multiple_choice', '["A. Liver", "B. Heart", "C. Kidney", "D. Stomach"]', 'C', 'Kidneys filter blood and produce urine.', 'easy', 1, 32),

('q_bece_sci_2024_033', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The hardest natural substance is:', 'multiple_choice', '["A. Gold", "B. Iron", "C. Diamond", "D. Silver"]', 'C', 'Diamond is the hardest known natural substance.', 'easy', 1, 33),

('q_bece_sci_2024_034', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'Cholera is caused by drinking:', 'multiple_choice', '["A. Clean water", "B. Contaminated water", "C. Mineral water", "D. Distilled water"]', 'B', 'Cholera is caused by bacteria in contaminated water.', 'easy', 1, 34),

('q_bece_sci_2024_035', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'An animal that is active at night is called:', 'multiple_choice', '["A. Diurnal", "B. Nocturnal", "C. Aquatic", "D. Terrestrial"]', 'B', 'Nocturnal animals are active at night.', 'medium', 1, 35),

('q_bece_sci_2024_036', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'A mixture of iron filings and sand can be separated by:', 'multiple_choice', '["A. Filtration", "B. Using a magnet", "C. Evaporation", "D. Distillation"]', 'B', 'A magnet attracts iron but not sand.', 'easy', 1, 36),

('q_bece_sci_2024_037', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The green pigment in leaves is called:', 'multiple_choice', '["A. Hemoglobin", "B. Chlorophyll", "C. Carotene", "D. Melanin"]', 'B', 'Chlorophyll is the green pigment in plants.', 'easy', 1, 37),

('q_bece_sci_2024_038', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'Which of the following is a conductor of electricity?', 'multiple_choice', '["A. Rubber", "B. Wood", "C. Copper", "D. Plastic"]', 'C', 'Copper is a good conductor of electricity.', 'easy', 1, 38),

('q_bece_sci_2024_039', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The part of the eye that controls the amount of light entering is the:', 'multiple_choice', '["A. Retina", "B. Lens", "C. Iris", "D. Cornea"]', 'C', 'The iris controls the size of the pupil and light entry.', 'medium', 1, 39),

('q_bece_sci_2024_040', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2024_1', 'The moon is a:', 'multiple_choice', '["A. Star", "B. Planet", "C. Satellite", "D. Comet"]', 'C', 'The moon is a natural satellite orbiting Earth.', 'easy', 1, 40),

-- BECE Integrated Science 2023 Paper 1
('q_bece_sci_2023_001', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The process by which living things produce young ones is called:', 'multiple_choice', '["A. Growth", "B. Reproduction", "C. Respiration", "D. Excretion"]', 'B', 'Reproduction is the production of offspring.', 'easy', 1, 1),

('q_bece_sci_2023_002', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The smallest particle of an element is an:', 'multiple_choice', '["A. Molecule", "B. Atom", "C. Ion", "D. Compound"]', 'B', 'An atom is the smallest particle of an element.', 'easy', 1, 2),

('q_bece_sci_2023_003', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The energy in food is measured in:', 'multiple_choice', '["A. Meters", "B. Kilograms", "C. Joules or calories", "D. Newtons"]', 'C', 'Food energy is measured in joules or calories.', 'easy', 1, 3),

('q_bece_sci_2023_004', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The organ responsible for digesting food in the stomach produces:', 'multiple_choice', '["A. Bile", "B. Hydrochloric acid", "C. Insulin", "D. Saliva"]', 'B', 'The stomach produces hydrochloric acid for digestion.', 'easy', 1, 4),

('q_bece_sci_2023_005', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'An object placed in water floats if it is:', 'multiple_choice', '["A. Heavier than water", "B. Denser than water", "C. Less dense than water", "D. Made of metal"]', 'C', 'Objects float if they are less dense than water.', 'easy', 1, 5),

('q_bece_sci_2023_006', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The blood vessel that carries blood away from the heart is the:', 'multiple_choice', '["A. Vein", "B. Artery", "C. Capillary", "D. Valve"]', 'B', 'Arteries carry blood away from the heart.', 'easy', 1, 6),

('q_bece_sci_2023_007', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'Friction can be reduced by:', 'multiple_choice', '["A. Making surfaces rougher", "B. Using lubricants", "C. Increasing weight", "D. Using brakes"]', 'B', 'Lubricants like oil reduce friction between surfaces.', 'easy', 1, 7),

('q_bece_sci_2023_008', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The chemical formula for carbon dioxide is:', 'multiple_choice', '["A. CO", "B. CO₂", "C. C₂O", "D. O₂C"]', 'B', 'Carbon dioxide is CO₂.', 'easy', 1, 8),

('q_bece_sci_2023_009', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The part of the plant that transports water from roots to leaves is the:', 'multiple_choice', '["A. Phloem", "B. Xylem", "C. Stomata", "D. Root hair"]', 'B', 'Xylem transports water and minerals upward.', 'medium', 1, 9),

('q_bece_sci_2023_010', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The percentage of oxygen in the atmosphere is about:', 'multiple_choice', '["A. 50%", "B. 78%", "C. 21%", "D. 1%"]', 'C', 'The atmosphere contains about 21% oxygen.', 'easy', 1, 10),

('q_bece_sci_2023_011', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'An example of an insect is:', 'multiple_choice', '["A. Spider", "B. Mosquito", "C. Earthworm", "D. Snail"]', 'B', 'Mosquitoes are insects with 6 legs and 3 body parts.', 'easy', 1, 11),

('q_bece_sci_2023_012', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'A thermometer is used to measure:', 'multiple_choice', '["A. Length", "B. Mass", "C. Temperature", "D. Time"]', 'C', 'Thermometers measure temperature.', 'easy', 1, 12),

('q_bece_sci_2023_013', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'Which of the following is a communicable disease?', 'multiple_choice', '["A. Diabetes", "B. Measles", "C. Cancer", "D. Asthma"]', 'B', 'Measles is contagious and spreads from person to person.', 'easy', 1, 13),

('q_bece_sci_2023_014', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The image formed by a plane mirror is:', 'multiple_choice', '["A. Real and inverted", "B. Virtual and erect", "C. Real and erect", "D. Virtual and inverted"]', 'B', 'Plane mirrors form virtual, erect images.', 'medium', 1, 14),

('q_bece_sci_2023_015', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The main gas in the atmosphere is:', 'multiple_choice', '["A. Oxygen", "B. Carbon dioxide", "C. Nitrogen", "D. Hydrogen"]', 'C', 'Nitrogen makes up about 78% of the atmosphere.', 'easy', 1, 15),

('q_bece_sci_2023_016', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'An example of a vertebrate is:', 'multiple_choice', '["A. Butterfly", "B. Fish", "C. Grasshopper", "D. Spider"]', 'B', 'Fish are vertebrates (have backbones).', 'easy', 1, 16),

('q_bece_sci_2023_017', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'Energy cannot be:', 'multiple_choice', '["A. Transferred", "B. Transformed", "C. Created or destroyed", "D. Measured"]', 'C', 'Energy cannot be created or destroyed (law of conservation).', 'medium', 1, 17),

('q_bece_sci_2023_018', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The process by which plants lose water through their leaves is:', 'multiple_choice', '["A. Respiration", "B. Photosynthesis", "C. Transpiration", "D. Germination"]', 'C', 'Transpiration is water loss through leaf stomata.', 'easy', 1, 18),

('q_bece_sci_2023_019', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'A balanced diet contains:', 'multiple_choice', '["A. Only proteins", "B. Only carbohydrates", "C. All classes of food in right proportions", "D. Only vitamins"]', 'C', 'A balanced diet has all nutrients in proper amounts.', 'easy', 1, 19),

('q_bece_sci_2023_020', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'Which instrument is used to measure mass?', 'multiple_choice', '["A. Ruler", "B. Beam balance", "C. Thermometer", "D. Measuring cylinder"]', 'B', 'A beam balance measures mass.', 'easy', 1, 20),

('q_bece_sci_2023_021', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The gas produced when acids react with metals is:', 'multiple_choice', '["A. Oxygen", "B. Carbon dioxide", "C. Hydrogen", "D. Nitrogen"]', 'C', 'Acids react with metals to produce hydrogen gas.', 'easy', 1, 21),

('q_bece_sci_2023_022', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The nervous system is made up of:', 'multiple_choice', '["A. Heart and blood vessels", "B. Brain, spinal cord, and nerves", "C. Bones and muscles", "D. Lungs and windpipe"]', 'B', 'The nervous system includes brain, spinal cord, and nerves.', 'easy', 1, 22),

('q_bece_sci_2023_023', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'Speed is calculated by:', 'multiple_choice', '["A. Distance × time", "B. Distance ÷ time", "C. Time ÷ distance", "D. Distance + time"]', 'B', 'Speed = distance ÷ time.', 'easy', 1, 23),

('q_bece_sci_2023_024', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The movement of molecules from high to low concentration is called:', 'multiple_choice', '["A. Osmosis", "B. Diffusion", "C. Active transport", "D. Absorption"]', 'B', 'Diffusion is movement from high to low concentration.', 'medium', 1, 24),

('q_bece_sci_2023_025', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'An example of a mammal is:', 'multiple_choice', '["A. Lizard", "B. Frog", "C. Cow", "D. Eagle"]', 'C', 'Cows are mammals (warm-blooded, have fur, nurse young).', 'easy', 1, 25),

('q_bece_sci_2023_026', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'A rainbow is formed due to:', 'multiple_choice', '["A. Reflection of light", "B. Refraction and dispersion of light", "C. Absorption of light", "D. Diffraction of light"]', 'B', 'Rainbows form from refraction and dispersion in water droplets.', 'medium', 1, 26),

('q_bece_sci_2023_027', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The removal of waste products from the body is called:', 'multiple_choice', '["A. Digestion", "B. Excretion", "C. Secretion", "D. Absorption"]', 'B', 'Excretion is the removal of metabolic waste.', 'easy', 1, 27),

('q_bece_sci_2023_028', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'An element is made up of:', 'multiple_choice', '["A. Different types of atoms", "B. Only one type of atom", "C. Molecules", "D. Compounds"]', 'B', 'An element contains only one type of atom.', 'easy', 1, 28),

('q_bece_sci_2023_029', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The primary colors of light are:', 'multiple_choice', '["A. Red, blue, yellow", "B. Red, green, blue", "C. Red, yellow, green", "D. Blue, yellow, green"]', 'B', 'Primary colors of light are red, green, and blue.', 'easy', 1, 29),

('q_bece_sci_2023_030', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The part of the flower that attracts insects is the:', 'multiple_choice', '["A. Sepal", "B. Petal", "C. Stamen", "D. Pistil"]', 'B', 'Colorful petals attract pollinators.', 'easy', 1, 30),

('q_bece_sci_2023_031', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'Which of the following is an acid?', 'multiple_choice', '["A. Sodium hydroxide", "B. Potassium hydroxide", "C. Hydrochloric acid", "D. Ammonia"]', 'C', 'Hydrochloric acid is an acid; the others are bases.', 'easy', 1, 31),

('q_bece_sci_2023_032', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The unit of electric current is:', 'multiple_choice', '["A. Volt", "B. Ohm", "C. Ampere", "D. Watt"]', 'C', 'Electric current is measured in Amperes.', 'easy', 1, 32),

('q_bece_sci_2023_033', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'An organism that makes its own food is called a:', 'multiple_choice', '["A. Consumer", "B. Producer", "C. Decomposer", "D. Predator"]', 'B', 'Producers (like plants) make their own food.', 'easy', 1, 33),

('q_bece_sci_2023_034', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The process by which rocks are broken down is called:', 'multiple_choice', '["A. Erosion", "B. Weathering", "C. Deposition", "D. Transportation"]', 'B', 'Weathering breaks down rocks in place.', 'easy', 1, 34),

('q_bece_sci_2023_035', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'An example of a non-renewable resource is:', 'multiple_choice', '["A. Wind", "B. Solar energy", "C. Petroleum", "D. Water"]', 'C', 'Petroleum is non-renewable (takes millions of years to form).', 'easy', 1, 35),

('q_bece_sci_2023_036', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The instrument used to measure volume of liquids is:', 'multiple_choice', '["A. Beam balance", "B. Thermometer", "C. Measuring cylinder", "D. Ruler"]', 'C', 'Measuring cylinders measure liquid volume.', 'easy', 1, 36),

('q_bece_sci_2023_037', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The layer of the atmosphere closest to Earth is the:', 'multiple_choice', '["A. Stratosphere", "B. Troposphere", "C. Mesosphere", "D. Thermosphere"]', 'B', 'The troposphere is the lowest atmospheric layer.', 'medium', 1, 37),

('q_bece_sci_2023_038', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'Deficiency of vitamin A causes:', 'multiple_choice', '["A. Scurvy", "B. Night blindness", "C. Rickets", "D. Beriberi"]', 'B', 'Vitamin A deficiency causes night blindness.', 'medium', 1, 38),

('q_bece_sci_2023_039', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'The type of joint found at the elbow is:', 'multiple_choice', '["A. Ball and socket", "B. Hinge", "C. Pivot", "D. Gliding"]', 'B', 'The elbow has a hinge joint for back-and-forth motion.', 'easy', 1, 39),

('q_bece_sci_2023_040', 'subj_bece_science', 'exam_bece', 'paper_bece_1', 'pp_bece_sci_2023_1', 'Washing hands helps prevent the spread of:', 'multiple_choice', '["A. Noise pollution", "B. Air pollution", "C. Diseases", "D. Water pollution"]', 'C', 'Hand washing prevents spread of germs and diseases.', 'easy', 1, 40);
