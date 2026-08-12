-- Link Speed Race Questions to Their Respective Topics
-- Based on question content analysis

-- =============================================
-- MATHEMATICS TOPICS MAPPING
-- =============================================
-- topic_algebra: Basic algebra, equations, expressions, factoring
-- topic_quadratic: Quadratic equations specifically
-- topic_geometry: Shapes, areas, perimeters, volumes, angles
-- topic_trigonometry: Trig functions, angles, sin/cos/tan
-- topic_calculus: Derivatives, integrals, limits
-- topic_statistics: Probability, sequences, number theory

-- Algebra questions (basic equations, expressions, percentages, powers)
UPDATE questions SET topic_id = 'topic_algebra' WHERE id IN (
  'nsmq_math_sr_005', -- If 2x = 14, what is x?
  'nsmq_math_sr_027', -- Simplify: 3x + 5x - 2x
  'nsmq_math_sr_028', -- What is the value of 2^5?
  'nsmq_math_sr_029', -- Solve: 4x = 28
  'nsmq_math_sr_026', -- What is 15% of 200?
  'nsmq_math_sr_031', -- What is 3/4 as a percentage?
  'nsmq_math_sr_033', -- Evaluate: (-3) × (-4)
  'nsmq_math_sr_035', -- Convert 0.25 to fraction
  'nsmq_math_sr_046', -- If y = 3x + 2, find y when x = 4
  'nsmq_math_sr_048', -- What is the gradient of y = 2x + 5?
  'nsmq_math_sr_049', -- Solve: x + 7 = 15
  'nsmq_math_sr_051', -- What is the y-intercept of y = 4x - 7?
  'nsmq_math_sr_052', -- Simplify: (2x³)²
  'nsmq_math_sr_053', -- If f(x) = x² - 1, find f(3)
  'nsmq_math_sr_054', -- What is √81?
  'nsmq_math_sr_055', -- Solve: 2x - 5 = 11
  'nsmq_math_sr_064', -- What is 3⁰?
  'nsmq_math_sr_072', -- What is the reciprocal of 5?
  'nsmq_math_sr_073', -- Simplify: √50
  'nsmq_math_sr_074', -- What is the absolute value of -15?
  'nsmq_math_sr_075', -- If x:y = 2:3 and x = 10, find y
  'q_speed_003' -- Basic algebra
);

-- Quadratic equations
UPDATE questions SET topic_id = 'topic_quadratic' WHERE id IN (
  'nsmq_math_sr_047', -- Factorize: x² - 9
  'nsmq_math_sr_050' -- Expand: (x + 2)(x + 3)
);

-- Geometry questions (shapes, areas, perimeters, volumes)
UPDATE questions SET topic_id = 'topic_geometry' WHERE id IN (
  'nsmq_math_sr_020', -- What is the area of a triangle with base 10 and height 6?
  'nsmq_math_sr_036', -- What is the perimeter of a square with side 7 cm?
  'nsmq_math_sr_037', -- How many degrees are in a right angle?
  'nsmq_math_sr_038', -- What is the area of a rectangle with length 8 and width 5?
  'nsmq_math_sr_039', -- How many sides does a hexagon have?
  'nsmq_math_sr_040', -- What is the sum of interior angles of a triangle?
  'nsmq_math_sr_041', -- What is the circumference of a circle with radius 7?
  'nsmq_math_sr_042', -- What is the volume of a cube with edge 3 cm?
  'nsmq_math_sr_043', -- How many vertices does a triangular prism have?
  'nsmq_math_sr_044', -- What is the diameter of a circle with radius 9?
  'nsmq_math_sr_045' -- What type of triangle has all sides equal?
);

-- Trigonometry questions
UPDATE questions SET topic_id = 'topic_trigonometry' WHERE id IN (
  'nsmq_math_sr_066', -- What is sin 30°?
  'nsmq_math_sr_067', -- What is cos 60°?
  'nsmq_math_sr_068', -- What is tan 45°?
  'nsmq_math_sr_069', -- Convert 180° to radians
  'nsmq_math_sr_071' -- In a right triangle, if one angle is 30°
);

-- Calculus questions
UPDATE questions SET topic_id = 'topic_calculus' WHERE id IN (
  'nsmq_math_sr_070' -- What is log₁₀(100)?
);

-- Statistics, Number Theory, Sequences (grouped under statistics)
UPDATE questions SET topic_id = 'topic_statistics' WHERE id IN (
  'nsmq_math_sr_030', -- What is the LCM of 4 and 6?
  'nsmq_math_sr_032', -- What is the square of 12?
  'nsmq_math_sr_034', -- What is the HCF of 18 and 24?
  'nsmq_math_sr_056', -- What is the next prime number after 17?
  'nsmq_math_sr_057', -- Find the 10th term of the sequence: 2, 4, 6, 8, ...
  'nsmq_math_sr_058', -- What is 5 factorial (5!)?
  'nsmq_math_sr_059', -- Express 36 as a product of prime factors
  'nsmq_math_sr_060', -- What is the sum of the first 5 positive integers?
  'nsmq_math_sr_061', -- Is 51 a prime number?
  'nsmq_math_sr_062', -- What is the 7th triangular number?
  'nsmq_math_sr_063', -- Find the common difference in: 5, 9, 13, 17
  'nsmq_math_sr_065' -- How many factors does 12 have?
);

-- =============================================
-- PHYSICS TOPICS MAPPING
-- =============================================
-- topic_mechanics: Motion, forces, energy, momentum, power
-- topic_electricity: Current, voltage, resistance, circuits, magnetism
-- topic_waves: Light, sound, frequency, wavelength, optics
-- topic_thermodynamics: Heat, temperature, thermal expansion
-- topic_modern_physics: Atomic structure, radioactivity, nuclear

-- Mechanics questions (motion, forces, energy, momentum)
UPDATE questions SET topic_id = 'topic_mechanics' WHERE id IN (
  'nsmq_phys_sr_026', -- What is the SI unit of force?
  'nsmq_phys_sr_027', -- What is the formula for speed?
  'nsmq_phys_sr_028', -- What is the acceleration due to gravity on Earth?
  'nsmq_phys_sr_029', -- What is the SI unit of work?
  'nsmq_phys_sr_030', -- What is the formula for kinetic energy?
  'nsmq_phys_sr_031', -- What type of energy does a stretched spring have?
  'nsmq_phys_sr_032', -- What is momentum equal to?
  'nsmq_phys_sr_033', -- What is the unit of power?
  'nsmq_phys_sr_034', -- What is Newton's first law also known as?
  'nsmq_phys_sr_035', -- What is the formula for pressure?
  'q_speed_002', -- A car accelerates from rest
  'q_speed_006' -- Mechanics question
);

-- Waves & Optics questions
UPDATE questions SET topic_id = 'topic_waves' WHERE id IN (
  'nsmq_phys_sr_036', -- What is the speed of light in vacuum?
  'nsmq_phys_sr_037', -- What type of wave is sound?
  'nsmq_phys_sr_038', -- What type of wave is light?
  'nsmq_phys_sr_039', -- What is the unit of frequency?
  'nsmq_phys_sr_040', -- What happens to light when it passes from air to glass?
  'nsmq_phys_sr_041', -- What color of light has the longest wavelength?
  'nsmq_phys_sr_042', -- What is the relationship between frequency and wavelength?
  'nsmq_phys_sr_043', -- What type of mirror is used in car headlights?
  'nsmq_phys_sr_044', -- What is the angle of incidence equal to?
  'nsmq_phys_sr_045' -- What phenomenon causes a rainbow?
);

-- Electricity & Magnetism questions
UPDATE questions SET topic_id = 'topic_electricity' WHERE id IN (
  'nsmq_phys_sr_046', -- What is the SI unit of electric current?
  'nsmq_phys_sr_047', -- What is Ohm's Law?
  'nsmq_phys_sr_048', -- What is the unit of resistance?
  'nsmq_phys_sr_049', -- What particle carries negative charge?
  'nsmq_phys_sr_050', -- What is the formula for electrical power?
  'nsmq_phys_sr_051', -- What happens to total resistance in a series circuit?
  'nsmq_phys_sr_052', -- What device converts mechanical energy to electrical energy?
  'nsmq_phys_sr_053', -- What is electromagnetic induction?
  'nsmq_phys_sr_054', -- What are the two types of electric charge?
  'nsmq_phys_sr_055' -- What is the unit of electrical energy?
);

-- Thermodynamics questions
UPDATE questions SET topic_id = 'topic_thermodynamics' WHERE id IN (
  'nsmq_phys_sr_056', -- What is absolute zero in Celsius?
  'nsmq_phys_sr_057', -- What are the three methods of heat transfer?
  'nsmq_phys_sr_058', -- What is the SI unit of temperature?
  'nsmq_phys_sr_059', -- What happens to the volume when heated?
  'nsmq_phys_sr_060', -- What is specific heat capacity?
  'nsmq_phys_sr_061', -- At what temperature does water boil?
  'nsmq_phys_sr_062', -- What is latent heat?
  'nsmq_phys_sr_063', -- Convert 25°C to Kelvin
  'nsmq_phys_sr_064', -- What is the melting point of ice?
  'nsmq_phys_sr_065' -- What type of heat transfer occurs in fluids?
);

-- Modern Physics (atomic, nuclear, radioactivity)
UPDATE questions SET topic_id = 'topic_modern_physics' WHERE id IN (
  'nsmq_phys_sr_066', -- What is the charge of a proton?
  'nsmq_phys_sr_067', -- What is the nucleus made of?
  'nsmq_phys_sr_068', -- What type of radiation is stopped by paper?
  'nsmq_phys_sr_069', -- What is the atomic number?
  'nsmq_phys_sr_070', -- What is E = mc² known as?
  'nsmq_phys_sr_071', -- What is radioactive half-life?
  'nsmq_phys_sr_072', -- What particle has no charge?
  'nsmq_phys_sr_073', -- What is the mass number?
  'nsmq_phys_sr_074', -- What are isotopes?
  'nsmq_phys_sr_075' -- What is nuclear fission?
);

-- =============================================
-- CHEMISTRY TOPICS MAPPING
-- =============================================
-- topic_atomic: Atomic structure, electron configuration, periodic table
-- topic_bonding: Ionic, covalent, metallic bonding
-- topic_stoichiometry: Moles, calculations, reactions, acids/bases
-- topic_organic: Hydrocarbons, polymers, organic compounds
-- topic_electrochemistry: Redox, electrolysis

-- Atomic Structure & Periodic Table
UPDATE questions SET topic_id = 'topic_atomic' WHERE id IN (
  'nsmq_chem_sr_026', -- How many electrons can the first shell hold?
  'nsmq_chem_sr_027', -- What is the atomic number of carbon?
  'nsmq_chem_sr_028', -- Which group contains the noble gases?
  'nsmq_chem_sr_029', -- What is the symbol for potassium?
  'nsmq_chem_sr_030', -- How many electrons can the second shell hold?
  'nsmq_chem_sr_031', -- What element has atomic number 1?
  'nsmq_chem_sr_032', -- Which group contains the alkali metals?
  'nsmq_chem_sr_033', -- What is the symbol for sodium?
  'nsmq_chem_sr_034', -- Which subatomic particle determines the element?
  'nsmq_chem_sr_035', -- What is the electronic configuration of oxygen?
  'q_speed_008', -- What is Avogadro's number?
  'nsmq_chem_sr_024' -- What color flame does sodium produce?
);

-- Chemical Bonding
UPDATE questions SET topic_id = 'topic_bonding' WHERE id IN (
  'nsmq_chem_sr_036', -- What type of bond forms between metals and non-metals?
  'nsmq_chem_sr_037', -- What type of bond involves sharing of electrons?
  'nsmq_chem_sr_038', -- What is the valency of oxygen?
  'nsmq_chem_sr_039', -- How many covalent bonds can carbon form?
  'nsmq_chem_sr_040', -- What holds atoms together in a metal?
  'nsmq_chem_sr_041', -- What is the charge on a chloride ion?
  'nsmq_chem_sr_042', -- What is the formula of water?
  'nsmq_chem_sr_043', -- What is the valency of sodium?
  'nsmq_chem_sr_044', -- What type of bond is in NaCl?
  'nsmq_chem_sr_045' -- What is a cation?
);

-- Acids, Bases, Salts & Reactions (under stoichiometry)
UPDATE questions SET topic_id = 'topic_stoichiometry' WHERE id IN (
  'nsmq_chem_sr_046', -- What is the pH of a neutral solution?
  'nsmq_chem_sr_047', -- What gas is produced when acid reacts with metal?
  'nsmq_chem_sr_048', -- What is the formula of sulfuric acid?
  'nsmq_chem_sr_049', -- What color does litmus paper turn in acid?
  'nsmq_chem_sr_050', -- What is formed when acid reacts with base?
  'nsmq_chem_sr_051', -- What is the formula of hydrochloric acid?
  'nsmq_chem_sr_052', -- Is sodium hydroxide an acid or base?
  'nsmq_chem_sr_053', -- What gas is released when acid reacts with carbonate?
  'nsmq_chem_sr_054', -- What is the pH range for acids?
  'nsmq_chem_sr_055', -- What is the chemical name of common salt?
  'nsmq_chem_sr_056', -- What is the law of conservation of mass?
  'nsmq_chem_sr_057', -- What type of reaction produces heat?
  'nsmq_chem_sr_058', -- What is oxidation in terms of electrons?
  'nsmq_chem_sr_059', -- What is reduction in terms of electrons?
  'nsmq_chem_sr_060', -- Balance: H₂ + O₂ → H₂O
  'nsmq_chem_sr_061', -- What catalyst is used in the Haber process?
  'nsmq_chem_sr_062', -- What is a catalyst?
  'nsmq_chem_sr_063', -- What type of reaction absorbs heat?
  'nsmq_chem_sr_064', -- What is the test for hydrogen gas?
  'nsmq_chem_sr_065', -- What is the test for oxygen gas?
  'q_speed_003' -- Molar mass of H₂SO₄
);

-- Organic Chemistry
UPDATE questions SET topic_id = 'topic_organic' WHERE id IN (
  'nsmq_chem_sr_066', -- What is the first alkane?
  'nsmq_chem_sr_067', -- What is the general formula for alkanes?
  'nsmq_chem_sr_068', -- What functional group do alcohols contain?
  'nsmq_chem_sr_069', -- What is the molecular formula of ethanol?
  'nsmq_chem_sr_070', -- What products form when hydrocarbons burn completely?
  'nsmq_chem_sr_071', -- What is crude oil?
  'nsmq_chem_sr_072', -- What process separates crude oil?
  'nsmq_chem_sr_073', -- What is a polymer?
  'nsmq_chem_sr_074', -- What is the monomer of polyethene?
  'nsmq_chem_sr_075' -- What type of reaction makes polymers?
);

-- =============================================
-- BIOLOGY TOPICS MAPPING
-- =============================================
-- topic_cells: Cell structure, organelles, cell division
-- topic_genetics: DNA, heredity, evolution
-- topic_ecology: Ecosystems, food chains, environment
-- topic_physiology: Human body systems
-- topic_biochemistry: Photosynthesis, respiration

-- Cell Biology
UPDATE questions SET topic_id = 'topic_cells' WHERE id IN (
  'nsmq_bio_sr_026', -- What is the powerhouse of the cell?
  'nsmq_bio_sr_027', -- What organelle controls the cell?
  'nsmq_bio_sr_028', -- What is the cell membrane made of?
  'nsmq_bio_sr_029', -- What organelle is responsible for photosynthesis?
  'nsmq_bio_sr_030', -- What is the function of ribosomes?
  'nsmq_bio_sr_031', -- What structure is found in plant cells but not animal cells?
  'nsmq_bio_sr_032', -- What is the jelly-like substance inside cells?
  'nsmq_bio_sr_033', -- What type of cell division produces identical cells?
  'nsmq_bio_sr_034', -- What type of cell division produces gametes?
  'nsmq_bio_sr_035', -- How many chromosomes do human body cells have?
  'q_speed_004' -- What organelle is responsible for ATP production?
);

-- Human Physiology
UPDATE questions SET topic_id = 'topic_physiology' WHERE id IN (
  'nsmq_bio_sr_036', -- What organ pumps blood?
  'nsmq_bio_sr_037', -- What is the largest organ in the human body?
  'nsmq_bio_sr_038', -- What blood vessels carry blood away from the heart?
  'nsmq_bio_sr_039', -- What is the function of white blood cells?
  'nsmq_bio_sr_040', -- What gas do we breathe in?
  'nsmq_bio_sr_041', -- What gas do we breathe out?
  'nsmq_bio_sr_042', -- Where does digestion begin?
  'nsmq_bio_sr_043', -- What enzyme breaks down starch?
  'nsmq_bio_sr_044', -- What organ filters blood and produces urine?
  'nsmq_bio_sr_045' -- What is the smallest bone in the human body?
);

-- Biochemistry (photosynthesis, plant biology)
UPDATE questions SET topic_id = 'topic_biochemistry' WHERE id IN (
  'nsmq_bio_sr_046', -- What is the equation for photosynthesis?
  'nsmq_bio_sr_047', -- What green pigment absorbs light?
  'nsmq_bio_sr_048', -- What do plants absorb through their roots?
  'nsmq_bio_sr_049', -- What is the function of xylem?
  'nsmq_bio_sr_050', -- What is the function of phloem?
  'nsmq_bio_sr_051', -- What gas enters leaves through stomata?
  'nsmq_bio_sr_052', -- What is transpiration?
  'nsmq_bio_sr_053', -- What type of reproduction involves one parent?
  'nsmq_bio_sr_054', -- What is the male part of a flower?
  'nsmq_bio_sr_055' -- What is the female part of a flower?
);

-- Genetics & Evolution
UPDATE questions SET topic_id = 'topic_genetics' WHERE id IN (
  'nsmq_bio_sr_056', -- What does DNA stand for?
  'nsmq_bio_sr_057', -- What are the four bases in DNA?
  'nsmq_bio_sr_058', -- What base pairs with Adenine in DNA?
  'nsmq_bio_sr_059', -- What is a gene?
  'nsmq_bio_sr_060', -- What is a dominant allele?
  'nsmq_bio_sr_061', -- Who proposed the theory of evolution by natural selection?
  'nsmq_bio_sr_062', -- What is natural selection?
  'nsmq_bio_sr_063', -- What is a mutation?
  'nsmq_bio_sr_064', -- What determines biological sex in humans?
  'nsmq_bio_sr_065' -- What is the phenotype?
);

-- Ecology & Environment
UPDATE questions SET topic_id = 'topic_ecology' WHERE id IN (
  'nsmq_bio_sr_066', -- What is an ecosystem?
  'nsmq_bio_sr_067', -- What is a food chain?
  'nsmq_bio_sr_068', -- What are organisms that make their own food called?
  'nsmq_bio_sr_069', -- What are organisms that eat other organisms called?
  'nsmq_bio_sr_070', -- What organisms break down dead matter?
  'nsmq_bio_sr_071', -- What is the carbon cycle?
  'nsmq_bio_sr_072', -- What causes global warming?
  'nsmq_bio_sr_073', -- What is biodiversity?
  'nsmq_bio_sr_074', -- What is a habitat?
  'nsmq_bio_sr_075' -- What is the nitrogen cycle?
);

-- =============================================
-- OLDER SPEED QUESTIONS (q_speed_* format)
-- =============================================
-- These are the original questions from migration 041

-- Math questions
UPDATE questions SET topic_id = 'topic_algebra' WHERE id = 'q_speed_001'; -- Solve for x: x² - 5x + 6 = 0
UPDATE questions SET topic_id = 'topic_trigonometry' WHERE id = 'q_speed_005'; -- If sin θ = 3/5

-- Physics questions
UPDATE questions SET topic_id = 'topic_mechanics' WHERE id = 'q_speed_002'; -- Car acceleration

-- Chemistry questions
UPDATE questions SET topic_id = 'topic_stoichiometry' WHERE id = 'q_speed_003'; -- Molar mass of H₂SO₄

-- Biology questions
UPDATE questions SET topic_id = 'topic_cells' WHERE id = 'q_speed_004'; -- Mitochondria

-- Additional older speed race questions
UPDATE questions SET topic_id = 'topic_algebra' WHERE id LIKE 'nsmq_math_sr_0%' AND topic_id IS NULL AND id < 'nsmq_math_sr_020';
UPDATE questions SET topic_id = 'topic_mechanics' WHERE id LIKE 'nsmq_phys_sr_0%' AND topic_id IS NULL AND id < 'nsmq_phys_sr_026';
UPDATE questions SET topic_id = 'topic_atomic' WHERE id LIKE 'nsmq_chem_sr_0%' AND topic_id IS NULL AND id < 'nsmq_chem_sr_026';
UPDATE questions SET topic_id = 'topic_cells' WHERE id LIKE 'nsmq_bio_sr_0%' AND topic_id IS NULL AND id < 'nsmq_bio_sr_026';
