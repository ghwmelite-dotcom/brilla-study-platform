import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-09T00:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'nsmq-expansion-beta-001';
const contentLabel = 'Original BrillaPrep practice content aligned to the published NaCCA Ghana secondary curriculum; not official NSMQ or Primetime material.';
const releaseSourceUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';

const nsmqSource = (title) => ({
  publisher: 'National Council for Curriculum and Assessment, Ghana',
  title,
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
});

// Round conventions follow the seeded NSMQ rows in database/seed.sql:
// problem_of_day = multi-step 'problem' (5 pts, 120 s), speed_race = quick
// 'direct_answer' (2 pts, 15 s), round_one = four-option 'multiple_choice'
// (3 pts, 30 s).
const rounds = {
  pod: { roundType: 'problem_of_day', type: 'problem', points: 5, timeLimit: 120, migrationName: 'problem_of_day' },
  sr: { roundType: 'speed_race', type: 'direct_answer', points: 2, timeLimit: 15, migrationName: 'speed_race' },
  r1: { roundType: 'round_one', type: 'multiple_choice', points: 3, timeLimit: 30, migrationName: 'round_one' },
};

const pod = (topicCode, difficulty, prompt, answer, solution, commandWord = 'Calculate', assessmentObjective = 'AO2') => ({ topicCode, difficulty, prompt, answer, solution, commandWord, assessmentObjective });
const sr = (topicCode, difficulty, prompt, answer, solution) => ({ topicCode, difficulty, prompt, answer, solution, commandWord: 'State', assessmentObjective: 'AO1' });
const r1 = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord = 'Identify', assessmentObjective = 'AO2') => ({ topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const riddle = (id, subjectId, answer, clues, difficulty) => ({ id, subjectId, answer, clues, difficulty });

const subjects = [
  {
    key: 'math',
    subjectId: 'subj_nsmq_math',
    source: nsmqSource('Secondary Education Curriculum — Core Mathematics'),
    topics: [
      ['NSMQ-MATH-ALG', 'topic_algebra', 'Algebra', 'Manipulate symbols, solve equations and work with algebraic expressions.'],
      ['NSMQ-MATH-QUAD', 'topic_quadratic', 'Quadratic Equations', 'Solve and analyse quadratic equations and their roots.'],
      ['NSMQ-MATH-GEO', 'topic_geometry', 'Geometry', 'Apply properties of shapes, angles and solids to measurements.'],
      ['NSMQ-MATH-TRIG', 'topic_trigonometry', 'Trigonometry', 'Use trigonometric ratios and identities for triangles and angles.'],
      ['NSMQ-MATH-STAT', 'topic_statistics', 'Statistics & Probability', 'Analyse data and compute probabilities of events.'],
      ['NSMQ-MATH-CALC', 'topic_calculus', 'Calculus', 'Differentiate and integrate elementary functions.'],
    ],
    pod: [
      pod('NSMQ-MATH-ALG', 'medium', 'Solve for x: 2(x − 3) + 4 = 3x − 7', 'x = 5',
        'Expand the brackets: 2x − 6 + 4 = 3x − 7, so 2x − 2 = 3x − 7. Subtract 2x from both sides: −2 = x − 7. Add 7 to both sides: x = 5. Check: 2(5 − 3) + 4 = 4 + 4 = 8 and 3(5) − 7 = 15 − 7 = 8, so the solution x = 5 is consistent.',
        'Solve'),
      pod('NSMQ-MATH-QUAD', 'medium', 'Find the sum of the squares of the roots of x² − 7x + 12 = 0', '25',
        'Factorise: (x − 3)(x − 4) = 0, so the roots are x = 3 and x = 4. Their squares are 9 and 16, giving a sum of 25. Cross-check with root relations: sum of roots = 7 and product = 12, so sum of squares = 7² − 2(12) = 49 − 24 = 25.'),
      pod('NSMQ-MATH-GEO', 'medium', 'A cylinder has radius 7 cm and height 10 cm. Using π = 22/7, calculate its volume.', '1540 cm³',
        'Volume of a cylinder V = πr²h. Substitute r = 7 cm and h = 10 cm: V = (22/7) × 7² × 10 = (22/7) × 49 × 10 = 22 × 7 × 10 = 1540 cm³. The 7 in the denominator cancels with the 49 from r², which is why 22/7 is a convenient approximation here.'),
      pod('NSMQ-MATH-STAT', 'hard', 'A bag contains 3 red and 2 blue balls. Two balls are drawn at random without replacement. What is the probability that both are red?', '3/10',
        'P(first red) = 3/5. After removing one red ball, 2 red remain out of 4 balls, so P(second red | first red) = 2/4 = 1/2. Multiply because the draws are dependent: P(both red) = 3/5 × 1/2 = 3/10 = 0.3.',
        'Calculate', 'AO3'),
    ],
    sr: [
      sr('NSMQ-MATH-ALG', 'easy', 'Evaluate log base 10 of 1000.', '3',
        'Since 1000 = 10³, log₁₀ 1000 = 3 by the definition of a logarithm as the power to which the base must be raised.'),
      sr('NSMQ-MATH-CALC', 'easy', 'What is the derivative of x³ with respect to x?', '3x²',
        'By the power rule d/dx(xⁿ) = nxⁿ⁻¹ with n = 3, the derivative is 3x². This gives the gradient of the cubic curve at any point x.'),
      sr('NSMQ-MATH-TRIG', 'easy', 'What is the exact value of cos 60°?', '1/2',
        'From the standard 30-60-90 triangle, cos 60° = adjacent/hypotenuse = 1/2. It is one of the exact trigonometric values expected to be recalled instantly.'),
      sr('NSMQ-MATH-STAT', 'easy', 'What is the next term of the sequence 2, 5, 8, 11, …?', '14',
        'Each term increases by a common difference of 3, so the sequence is arithmetic. The next term is 11 + 3 = 14.'),
    ],
    r1: [
      r1('NSMQ-MATH-ALG', 'easy', 'If 3x − 7 = 11, what is the value of x?', '6', ['4', '8', '18'],
        'Add 7 to both sides: 3x = 18. Divide both sides by 3: x = 6. Substitution confirms it: 3(6) − 7 = 18 − 7 = 11.', 'Solve', 'AO2'),
      r1('NSMQ-MATH-ALG', 'easy', 'Simplify the expression 2³ × 2⁴.', '128', ['32', '64', '256'],
        'When multiplying powers with the same base, add the indices: 2³ × 2⁴ = 2⁷ = 128. A common error is multiplying the bases or the indices, giving wrong values such as 4¹².'),
      r1('NSMQ-MATH-GEO', 'medium', 'What is the size of each exterior angle of a regular octagon?', '45°', ['40°', '60°', '135°'],
        'The exterior angles of any convex polygon sum to 360°. A regular octagon has 8 equal exterior angles, so each is 360° ÷ 8 = 45°. (Each interior angle is then 180° − 45° = 135°.)'),
      r1('NSMQ-MATH-TRIG', 'medium', 'If tan θ = 1 and θ is acute, what is the value of θ?', '45°', ['30°', '60°', '90°'],
        'tan θ = sin θ / cos θ = 1 means sin θ = cos θ, which for an acute angle occurs only at θ = 45°. At 90° tangent is undefined, and at 30° and 60° it equals 1/√3 and √3 respectively.'),
    ],
  },
  {
    key: 'phys',
    subjectId: 'subj_nsmq_physics',
    source: nsmqSource('Secondary Education Curriculum — Physics'),
    topics: [
      ['NSMQ-PHYS-MECH', 'topic_mechanics', 'Mechanics', 'Apply the laws of motion, forces and energy to physical systems.'],
      ['NSMQ-PHYS-KIN', 'topic_kinematics', 'Kinematics', 'Describe motion using displacement, velocity, acceleration and time.'],
      ['NSMQ-PHYS-ELEC', 'topic_electricity', 'Electricity & Magnetism', 'Analyse circuits, fields and electromagnetic interactions.'],
      ['NSMQ-PHYS-WAVES', 'topic_waves', 'Waves & Optics', 'Relate wave speed, frequency, wavelength and light behaviour.'],
      ['NSMQ-PHYS-THERMO', 'topic_thermodynamics', 'Thermodynamics', 'Quantify heat, work, temperature and energy transfer.'],
      ['NSMQ-PHYS-MOD', 'topic_modern_physics', 'Modern Physics', 'Apply quantum and nuclear concepts to radiation and matter.'],
    ],
    pod: [
      pod('NSMQ-PHYS-KIN', 'medium', 'A car starts from rest and accelerates uniformly at 4 m/s² for 5 s. How far does it travel?', '50 m',
        'Use s = ut + ½at² with u = 0, a = 4 m/s² and t = 5 s: s = 0 + ½ × 4 × 5² = 2 × 25 = 50 m. The final speed would be v = u + at = 20 m/s, but the question asks only for distance.'),
      pod('NSMQ-PHYS-ELEC', 'hard', 'A 12 V battery is connected across a 4 Ω and an 8 Ω resistor in series. Calculate the power dissipated in the 8 Ω resistor.', '8 W',
        'Series resistances add: R = 4 + 8 = 12 Ω. Circuit current I = V/R = 12/12 = 1 A, and the same current flows through each resistor in series. Power in the 8 Ω resistor: P = I²R = 1² × 8 = 8 W.',
        'Calculate', 'AO3'),
      pod('NSMQ-PHYS-THERMO', 'medium', 'Calculate the heat required to raise the temperature of 0.5 kg of water from 20 °C to 70 °C. (c = 4200 J/kg°C)', '105 000 J (105 kJ)',
        'Q = mcΔT with m = 0.5 kg, c = 4200 J/kg°C and ΔT = 70 − 20 = 50 °C: Q = 0.5 × 4200 × 50 = 105 000 J = 105 kJ. Note the temperature change is used, not the final temperature.'),
      pod('NSMQ-PHYS-WAVES', 'hard', 'A wave covers 340 m in 2.0 s. If its frequency is 85 Hz, what is its wavelength?', '2.0 m',
        'First find the speed: v = distance/time = 340/2.0 = 170 m/s. Then apply the wave equation v = fλ, so λ = v/f = 170/85 = 2.0 m. Two steps are required: speed from kinematics, then wavelength from the wave relation.',
        'Calculate', 'AO3'),
    ],
    sr: [
      sr('NSMQ-PHYS-MECH', 'easy', 'What is the SI unit of energy?', 'Joule',
        'The joule (J) is the SI unit of energy and work; 1 J = 1 N·m = 1 kg·m²/s². It is named after James Prescott Joule.'),
      sr('NSMQ-PHYS-ELEC', 'easy', 'What is the SI unit of electrical power?', 'Watt',
        'The watt (W) is the SI unit of power, equal to one joule per second. In circuits P = IV = I²R = V²/R, all giving watts.'),
      sr('NSMQ-PHYS-WAVES', 'easy', 'What is the bending of light as it passes from air into water called?', 'Refraction',
        'Refraction is the change in direction of a wave when its speed changes at a boundary between media. Snell’s law, n₁sinθ₁ = n₂sinθ₂, quantifies it.'),
      sr('NSMQ-PHYS-MOD', 'medium', 'Which particle is emitted from a nucleus during beta-minus decay?', 'Electron',
        'In beta-minus decay a neutron converts to a proton and emits an electron (the beta particle) plus an antineutrino. The atomic number rises by one while the mass number is unchanged.'),
    ],
    r1: [
      r1('NSMQ-PHYS-MECH', 'easy', 'Which of the following quantities is a vector?', 'Velocity', ['Speed', 'Mass', 'Temperature'],
        'A vector has both magnitude and direction. Velocity includes direction, unlike speed (its magnitude), mass and temperature, which are scalars. Other common vectors are force, acceleration and displacement.'),
      r1('NSMQ-PHYS-ELEC', 'easy', 'According to Ohm’s law, the voltage V across a resistor of resistance R carrying current I equals', 'IR', ['I/R', 'I²R', 'R/I'],
        'Ohm’s law states V = IR: voltage equals current times resistance for an ohmic conductor at constant temperature. I²R is power dissipated, not voltage.'),
      r1('NSMQ-PHYS-WAVES', 'medium', 'Which colour of visible light has the longest wavelength?', 'Red', ['Violet', 'Green', 'Blue'],
        'In the visible spectrum, red light has the longest wavelength (about 700 nm) and violet the shortest (about 400 nm). Frequency runs the opposite way because v = fλ for a fixed speed of light.'),
      r1('NSMQ-PHYS-MOD', 'medium', 'The photoelectric effect provides evidence that light can behave as', 'A stream of particles (photons)', ['Only a continuous wave', 'A longitudinal sound wave', 'A standing wave'],
        'Einstein explained the photoelectric effect by treating light as quanta (photons) with energy E = hf. The existence of a threshold frequency cannot be explained by a purely continuous wave model.'),
    ],
  },
  {
    key: 'chem',
    subjectId: 'subj_nsmq_chemistry',
    source: nsmqSource('Secondary Education Curriculum — Chemistry'),
    topics: [
      ['NSMQ-CHEM-ATOM', 'topic_atomic', 'Atomic Structure', 'Describe subatomic particles and electron arrangements in atoms.'],
      ['NSMQ-CHEM-BOND', 'topic_bonding', 'Chemical Bonding', 'Explain how ionic, covalent and metallic bonds form compounds.'],
      ['NSMQ-CHEM-STOICH', 'topic_stoichiometry', 'Stoichiometry', 'Calculate reacting quantities using moles and balanced equations.'],
      ['NSMQ-CHEM-EQUIL', 'topic_equilibrium', 'Chemical Equilibrium', 'Apply equilibrium expressions and Le Chatelier’s principle.'],
      ['NSMQ-CHEM-ORG', 'topic_organic', 'Organic Chemistry', 'Name and classify carbon compounds and their reactions.'],
      ['NSMQ-CHEM-ELEC', 'topic_electrochemistry', 'Electrochemistry', 'Relate electric charge to chemical change in cells and electrolysis.'],
    ],
    pod: [
      pod('NSMQ-CHEM-STOICH', 'medium', 'Calculate the number of moles in 20.0 g of sodium hydroxide, NaOH. (Na = 23, O = 16, H = 1)', '0.5 mol',
        'Molar mass of NaOH = 23 + 16 + 1 = 40 g/mol. Moles n = mass/molar mass = 20.0/40 = 0.5 mol. This is the standard n = m/M relationship used throughout quantitative chemistry.'),
      pod('NSMQ-CHEM-STOICH', 'medium', 'What volume does 0.25 mol of an ideal gas occupy at s.t.p.? (Molar volume = 22.4 dm³/mol)', '5.6 dm³',
        'Volume = moles × molar volume = 0.25 × 22.4 = 5.6 dm³. At standard temperature and pressure one mole of any ideal gas occupies 22.4 dm³, so a quarter mole occupies a quarter of that volume.'),
      pod('NSMQ-CHEM-ELEC', 'hard', 'A current of 2.0 A is passed through a solution of AgNO₃ for 965 s. Calculate the mass of silver deposited. (F = 96 500 C/mol, Ag = 108 g/mol)', '2.16 g',
        'Charge Q = It = 2.0 × 965 = 1930 C. Moles of electrons = Q/F = 1930/96 500 = 0.02 mol. The half-equation Ag⁺ + e⁻ → Ag shows one electron deposits one silver atom, so n(Ag) = 0.02 mol. Mass = 0.02 × 108 = 2.16 g.',
        'Calculate', 'AO3'),
      pod('NSMQ-CHEM-EQUIL', 'hard', 'For N₂(g) + 3H₂(g) ⇌ 2NH₃(g) at equilibrium, [N₂] = 0.10 M, [H₂] = 0.10 M and [NH₃] = 0.20 M. Calculate the value of Kc.', '400 mol⁻² dm⁶',
        'Kc = [NH₃]²/([N₂][H₂]³) using the stoichiometric coefficients as powers. Substituting: Kc = (0.20)²/(0.10 × (0.10)³) = 0.04/0.0001 = 400. The units are (mol dm⁻³)²/(mol dm⁻³)⁴ = mol⁻² dm⁶.',
        'Calculate', 'AO3'),
    ],
    sr: [
      sr('NSMQ-CHEM-ATOM', 'easy', 'How many protons are in the nucleus of a carbon atom?', '6',
        'The atomic number Z counts the protons in the nucleus. Carbon has 6 protons, so Z = 6; this fixes its position in group 14 of the periodic table.'),
      sr('NSMQ-CHEM-BOND', 'easy', 'What type of bond holds the atoms together within a water molecule?', 'Covalent bond',
        'Within H₂O, hydrogen and oxygen share electron pairs, forming covalent bonds. (The attraction between separate water molecules is hydrogen bonding, a much weaker intermolecular force.)'),
      sr('NSMQ-CHEM-ORG', 'easy', 'What is the general molecular formula of alkenes?', 'CₙH₂ₙ',
        'Alkenes contain one carbon–carbon double bond and follow the general formula CₙH₂ₙ; for n = 2 the compound is ethene, C₂H₄. Alkanes are CₙH₂ₙ₊₂ and alkynes CₙH₂ₙ₋₂.'),
      sr('NSMQ-CHEM-EQUIL', 'medium', 'What is the pH of a 0.001 M solution of hydrochloric acid?', '3',
        'HCl is a strong acid and ionises fully, so [H⁺] = 0.001 = 10⁻³ M. Then pH = −log₁₀[H⁺] = −log₁₀(10⁻³) = 3.'),
    ],
    r1: [
      r1('NSMQ-CHEM-ATOM', 'easy', 'Which subatomic particle carries a negative charge?', 'Electron', ['Proton', 'Neutron', 'Atomic nucleus'],
        'Electrons carry a charge of −1.6 × 10⁻¹⁹ C and occupy the region around the nucleus. Protons are positively charged, neutrons are neutral, and the nucleus as a whole is positive.'),
      r1('NSMQ-CHEM-BOND', 'medium', 'Which type of bond forms when electrons are completely transferred from a metal atom to a non-metal atom?', 'Ionic bond', ['Covalent bond', 'Metallic bond', 'Hydrogen bond'],
        'Complete transfer of electrons produces oppositely charged ions that attract electrostatically — an ionic bond, as in NaCl. Covalent bonding involves sharing, and metallic bonding involves a sea of delocalised electrons.'),
      r1('NSMQ-CHEM-ORG', 'medium', 'What is the IUPAC name of CH₃CH(OH)CH₃?', 'Propan-2-ol', ['Propan-1-ol', 'Ethanol', 'Propanone'],
        'The longest chain has three carbons (propan-) and the −OH group sits on carbon 2, so the name is propan-2-ol. Propan-1-ol is the straight-chain isomer CH₃CH₂CH₂OH, and propanone is the ketone CH₃COCH₃.'),
      r1('NSMQ-CHEM-STOICH', 'medium', 'How many moles are present in 54 g of water? (H₂O = 18 g/mol)', '3', ['1', '2', '6'],
        'n = m/M = 54/18 = 3 mol. This uses the defining mole relation; each mole of water contains 6.02 × 10²³ molecules, so 54 g holds about 1.8 × 10²⁴ molecules.'),
    ],
  },
  {
    key: 'bio',
    subjectId: 'subj_nsmq_biology',
    source: nsmqSource('Secondary Education Curriculum — Biology'),
    topics: [
      ['NSMQ-BIO-CELL', 'topic_cells', 'Cell Biology', 'Explain cell structure, organelles and transport across membranes.'],
      ['NSMQ-BIO-GEN', 'topic_genetics', 'Genetics', 'Apply Mendelian and molecular principles of heredity.'],
      ['NSMQ-BIO-ECO', 'topic_ecology', 'Ecology', 'Analyse energy flow and relationships within ecosystems.'],
      ['NSMQ-BIO-PHYS', 'topic_physiology', 'Human Physiology', 'Explain how human organ systems function and are regulated.'],
      ['NSMQ-BIO-BIOCHEM', 'topic_biochemistry', 'Biochemistry', 'Relate enzymes, respiration and molecular processes in cells.'],
    ],
    pod: [
      pod('NSMQ-BIO-GEN', 'hard', 'In a population in Hardy-Weinberg equilibrium, 9% of individuals show a recessive phenotype. What percentage of the population are heterozygous carriers?', '42%',
        'Recessive phenotype frequency q² = 0.09, so q = √0.09 = 0.3. Then p = 1 − q = 0.7. Heterozygote frequency = 2pq = 2 × 0.7 × 0.3 = 0.42, so 42% of the population are carriers.',
        'Calculate', 'AO3'),
      pod('NSMQ-BIO-PHYS', 'medium', 'A student’s heart beats 72 times per minute with a stroke volume of 75 mL. Calculate the cardiac output in litres per minute.', '5.4 L/min',
        'Cardiac output = heart rate × stroke volume = 72 × 75 mL = 5400 mL per minute. Converting to litres: 5400/1000 = 5.4 L/min, a typical resting value for a healthy young adult.'),
      pod('NSMQ-BIO-BIOCHEM', 'medium', 'A DNA molecule contains 30% guanine. What percentage of its bases are adenine?', '20%',
        'By Chargaff’s base-pairing rules G = C, so cytosine is also 30% and G + C = 60%. The remaining 40% is shared equally between A and T because A = T, giving adenine = 20%.'),
      pod('NSMQ-BIO-ECO', 'medium', 'Producers in an ecosystem store 50 000 kJ of energy. If only 10% of energy is transferred between trophic levels, how much energy reaches the secondary consumers?', '500 kJ',
        'Each transfer passes on 10%: producers 50 000 kJ → primary consumers 5000 kJ → secondary consumers 500 kJ. The rest is lost mainly as heat through respiration and in undigested material.'),
    ],
    sr: [
      sr('NSMQ-BIO-CELL', 'easy', 'Which pigment captures light energy for photosynthesis?', 'Chlorophyll',
        'Chlorophyll, located in the thylakoid membranes of chloroplasts, absorbs mainly red and blue light and reflects green, which is why leaves appear green.'),
      sr('NSMQ-BIO-PHYS', 'easy', 'Which blood cells transport oxygen around the body?', 'Red blood cells',
        'Red blood cells (erythrocytes) contain haemoglobin, which binds oxygen in the lungs and releases it in the tissues. They lose their nucleus when mature to carry more haemoglobin.'),
      sr('NSMQ-BIO-GEN', 'easy', 'What is the basic unit of heredity?', 'Gene',
        'A gene is a section of DNA that codes for a protein (or functional RNA) and is passed from parents to offspring. Genes occur in alternative forms called alleles.'),
      sr('NSMQ-BIO-CELL', 'easy', 'What is the movement of water across a partially permeable membrane called?', 'Osmosis',
        'Osmosis is the diffusion of water from a region of higher water potential to lower water potential across a partially permeable membrane; it needs no metabolic energy.'),
    ],
    r1: [
      r1('NSMQ-BIO-PHYS', 'medium', 'Which vessel returns oxygen-rich blood to the left atrium of the heart?', 'Pulmonary vein', ['Pulmonary artery', 'Vena cava', 'Aorta'],
        'The pulmonary vein returns oxygenated blood from the lungs to the left atrium. The pulmonary artery is unusual in carrying deoxygenated blood (from the heart to the lungs), and the aorta distributes blood from the heart to the body.'),
      r1('NSMQ-BIO-BIOCHEM', 'easy', 'Which enzyme in saliva begins the digestion of starch?', 'Amylase', ['Pepsin', 'Lipase', 'Trypsin'],
        'Salivary amylase hydrolyses starch into maltose in the mouth. Pepsin and trypsin digest proteins (in the stomach and small intestine), and lipase digests fats.'),
      r1('NSMQ-BIO-PHYS', 'medium', 'Which product forms in human muscles during anaerobic respiration?', 'Lactic acid', ['Ethanol and carbon dioxide', 'Oxygen', 'Glucose'],
        'When oxygen supply cannot meet demand, muscles respire anaerobically, converting glucose to lactic acid and releasing a small amount of energy. Ethanol and CO₂ are produced by anaerobic respiration in yeast, not humans.'),
      r1('NSMQ-BIO-ECO', 'easy', 'To which kingdom do mushrooms belong?', 'Fungi', ['Plantae', 'Protista', 'Animalia'],
        'Mushrooms are the fruiting bodies of fungi, which have chitin cell walls, lack chlorophyll and feed by absorbing nutrients from decaying matter. They are neither plants nor animals.'),
    ],
  },
];

const riddles = [
  riddle('riddle_011', 'subj_nsmq_math', 'Prime number', [
    'I am a whole number greater than one',
    'I have exactly two factors: one and myself',
    'Two is my smallest member and the only even one',
    'Euclid proved that my family is infinite',
    'Modern encryption multiplies large members of my family together',
  ], 'easy'),
  riddle('riddle_012', 'subj_nsmq_math', 'Imaginary unit i', [
    'I am a number, yet I am not real',
    'Squaring me produces a negative result',
    'My square is exactly minus one',
    'Electrical engineers write me as j in circuit analysis',
    'Euler’s identity links me with e and π',
  ], 'hard'),
  riddle('riddle_013', 'subj_nsmq_physics', 'Inertia', [
    'I am a resistance to change',
    'Newton’s first law of motion describes me',
    'Mass is the measure of me',
    'You feel me when a moving bus suddenly brakes',
  ], 'medium'),
  riddle('riddle_014', 'subj_nsmq_physics', 'Electron', [
    'I am a subatomic particle',
    'I carry a negative electric charge',
    'J. J. Thomson discovered me in 1897',
    'My drift through a wire is an electric current',
    'My charge is about −1.6 × 10⁻¹⁹ coulombs',
  ], 'easy'),
  riddle('riddle_015', 'subj_nsmq_chemistry', 'Periodic table', [
    'I am a chart, not a piece of furniture',
    'I organise all known chemical elements',
    'Mendeleev published my first recognisable form in 1869',
    'My rows are called periods and my columns are called groups',
    'Elements in the same column of mine tend to react alike',
  ], 'easy'),
  riddle('riddle_016', 'subj_nsmq_chemistry', 'Catalyst', [
    'I make a chemical reaction go faster',
    'I am not consumed in the reaction',
    'I work by providing a path of lower activation energy',
    'Enzymes are my biological relatives',
    'Catalytic converters in car exhausts contain me',
  ], 'medium'),
  riddle('riddle_017', 'subj_nsmq_chemistry', 'pH', [
    'I am a number that tells you how acidic something is',
    'My usual scale runs from 0 to 14',
    'Seven on my scale means neutral',
    'Litmus paper changes colour because of what I measure',
    'I am the negative logarithm of the hydrogen-ion concentration',
  ], 'medium'),
  riddle('riddle_018', 'subj_nsmq_biology', 'Chlorophyll', [
    'I am a pigment',
    'I make leaves look green',
    'I absorb mainly red and blue light',
    'Photosynthesis cannot proceed without me',
    'I sit in the thylakoid membranes inside chloroplasts',
  ], 'easy'),
  riddle('riddle_019', 'subj_nsmq_biology', 'Neuron', [
    'I am a cell that carries messages',
    'My signals are both electrical and chemical',
    'I have dendrites that receive and an axon that transmits',
    'I pass information across junctions called synapses',
    'Some of my kind run from your spinal cord to your toes',
  ], 'medium'),
  riddle('riddle_020', 'subj_nsmq_biology', 'Ribosome', [
    'I am a tiny machine inside every cell',
    'I am built from RNA and protein',
    'I read messenger RNA codon by codon',
    'I am the site of protein synthesis',
    'I float free in the cytoplasm or stud the rough endoplasmic reticulum',
  ], 'hard'),
];

const roundKeys = ['pod', 'sr', 'r1'];

function mcq(subject, index, source) {
  const correctIndex = index % 4;
  const rawOptions = [...source.wrong];
  rawOptions.splice(correctIndex, 0, source.correct);
  const options = rawOptions.map((text, optionIndex) => ({
    label: labels[optionIndex],
    text,
    rationale: optionIndex === correctIndex
      ? `This is the supported answer. ${source.solution}`
      : 'This option is a plausible misconception, but it does not follow the scientific or mathematical principle established in the worked solution.',
  }));
  return { options, correctAnswer: labels[correctIndex] };
}

const batch = {
  batchId,
  status: 'approved_for_beta',
  examTypeId: 'exam_nsmq',
  provenance: [nsmqSource('Secondary Education Curriculum (SHS core mathematics and sciences)')],
  review: {
    authoringMethod: 'original_curriculum_aligned',
    qualityAssurance: 'automated_beta',
    automatedChecksAt: generatedAt,
  },
  release: {
    channel: 'beta',
    contentLabel,
    officialExamBoardContent: false,
    feedbackEnabled: true,
  },
  subjects: subjects.map((subject) => ({
    subjectId: subject.subjectId,
    specificationCode: `BRILLA-NSMQ-${subject.key.toUpperCase()}-BETA-001`,
    sources: [subject.source],
    topics: subject.topics.map(([code, , title, objective]) => ({ code, title, objective })),
    questions: roundKeys.flatMap((roundKey) => {
      const round = rounds[roundKey];
      return subject[roundKey].map((source, index) => {
        const base = {
          id: `q_nsmq_${subject.key}_${roundKey}_b001_${String(index + 1).padStart(3, '0')}`,
          original: true,
          topicCode: source.topicCode,
          roundType: round.roundType,
          type: round.type,
          prompt: source.prompt,
          correctAnswer: roundKey === 'r1' ? undefined : source.answer,
          workedSolution: source.solution,
          difficulty: source.difficulty,
          marks: 1,
          points: round.points,
          timeLimit: round.timeLimit,
          commandWord: source.commandWord,
          assessmentObjective: source.assessmentObjective,
          provenance: [subject.source],
        };
        if (roundKey === 'r1') {
          const built = mcq(subject, index, source);
          base.options = built.options;
          base.correctAnswer = built.correctAnswer;
        }
        return base;
      });
    }),
  })),
  riddles: riddles.map((entry) => ({ ...entry, provenance: [nsmqSource('Secondary Education Curriculum (SHS core mathematics and sciences)')] })),
};

// --- Validation -------------------------------------------------------------
// question-content-lib.mjs covers the shared question shape (provenance,
// options, duplicates, difficulty) in draft mode; 'direct_answer' and
// 'problem' were added to its VALID_TYPES additively for this NSMQ batch.
// Round-type conventions and the separate riddles table are NOT covered by
// the library, so they are validated here in the same check style.
const validation = validateQuestionBatch(batch, { mode: 'draft' });

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!/not official/i.test(batch.release.contentLabel)) errors.push('release.contentLabel must disclaim official status');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');

  const expectedPerSubject = { problem_of_day: 4, speed_race: 4, round_one: 4 };
  const difficulties = new Set(['easy', 'medium', 'hard']);
  for (const subject of batch.subjects) {
    const counts = { problem_of_day: 0, speed_race: 0, round_one: 0 };
    for (const question of subject.questions) {
      const round = Object.values(rounds).find((entry) => entry.roundType === question.roundType);
      if (!round) { errors.push(`${question.id}: unknown roundType`); continue; }
      counts[question.roundType] += 1;
      if (question.type !== round.type) errors.push(`${question.id}: type must be ${round.type} for ${question.roundType}`);
      if (question.points !== round.points) errors.push(`${question.id}: points must be ${round.points}`);
      if (question.timeLimit !== round.timeLimit) errors.push(`${question.id}: timeLimit must be ${round.timeLimit}`);
      if (question.marks !== 1) errors.push(`${question.id}: marks must be 1`);
      if (question.roundType === 'problem_of_day' && !['medium', 'hard'].includes(question.difficulty)) errors.push(`${question.id}: problem_of_day difficulty must be medium or hard`);
      if (question.roundType === 'speed_race' && !['easy', 'medium'].includes(question.difficulty)) errors.push(`${question.id}: speed_race difficulty must be easy or medium`);
      if (!difficulties.has(question.difficulty)) errors.push(`${question.id}: difficulty invalid`);
      if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
    }
    for (const [roundType, expected] of Object.entries(expectedPerSubject)) {
      if (counts[roundType] !== expected) errors.push(`${subject.subjectId}: expected ${expected} ${roundType} questions, found ${counts[roundType]}`);
    }
  }

  const riddleIds = new Set();
  const riddleAnswers = new Set();
  for (const entry of batch.riddles) {
    if (!/^riddle_\d{3}$/.test(entry.id)) errors.push(`${entry.id}: riddle id must match riddle_NNN`);
    if (riddleIds.has(entry.id)) errors.push(`${entry.id}: duplicated riddle id`);
    riddleIds.add(entry.id);
    if (!batch.subjects.some((subject) => subject.subjectId === entry.subjectId)) errors.push(`${entry.id}: unknown subject ${entry.subjectId}`);
    if (typeof entry.answer !== 'string' || entry.answer.trim().length < 2) errors.push(`${entry.id}: answer too short`);
    const normalizedAnswer = normalizeQuestionText(entry.answer);
    if (riddleAnswers.has(normalizedAnswer)) errors.push(`${entry.id}: duplicated riddle answer`);
    riddleAnswers.add(normalizedAnswer);
    if (!Array.isArray(entry.clues) || entry.clues.length < 4 || entry.clues.length > 5) errors.push(`${entry.id}: riddles need 4-5 clues`);
    for (const clue of entry.clues ?? []) {
      if (typeof clue !== 'string' || clue.trim().length < 10) errors.push(`${entry.id}: clue too short`);
      if (normalizeQuestionText(clue).includes(normalizedAnswer)) errors.push(`${entry.id}: a clue gives away the answer`);
    }
    if (!difficulties.has(entry.difficulty)) errors.push(`${entry.id}: difficulty invalid`);
  }
  if (batch.riddles.length !== 10) errors.push(`expected 10 riddles, found ${batch.riddles.length}`);
}

const houseErrors = [];
inHouseValidation(houseErrors);
validation.errors.push(...houseErrors);
if (!validation.valid) throw new Error(`Generated batch failed validation:\n${validation.errors.join('\n')}`);

async function collectExistingContent() {
  const existing = new Map();
  const seedSql = await readFile(resolve(sourceRoot, 'database/seed.sql'), 'utf8');
  for (const match of seedSql.matchAll(/'(?:''|[^'])*'/g)) {
    const literal = match[0].slice(1, -1).replaceAll("''", "'");
    const normalized = normalizeQuestionText(literal);
    if (normalized.length >= 18) existing.set(normalized, 'database/seed.sql');
  }
  for (const match of seedSql.matchAll(/\('(riddle_\d+)',\s*'(?:''|[^'])*',\s*'((?:''|[^'])*)'/g)) {
    existing.set(`riddle-id:${match[1]}`, 'database/seed.sql');
    existing.set(`riddle-answer:${normalizeQuestionText(match[2].replaceAll("''", "'"))}`, 'database/seed.sql');
  }
  const batchesDir = resolve(sourceRoot, 'content/batches');
  for (const name of await readdir(batchesDir)) {
    if (!name.endsWith('.json') || name === `${batchId}.json`) continue;
    const candidate = JSON.parse(await readFile(resolve(batchesDir, name), 'utf8'));
    for (const subject of candidate.subjects ?? []) {
      for (const question of subject.questions ?? []) {
        const normalized = normalizeQuestionText(question.prompt);
        if (normalized) existing.set(normalized, `content/batches/${name}`);
      }
    }
  }
  return existing;
}

const existingContent = await collectExistingContent();
const duplicatePrompts = batch.subjects.flatMap((subject) => subject.questions)
  .map((question) => ({ id: question.id, source: existingContent.get(normalizeQuestionText(question.prompt)) }))
  .filter(({ source }) => source);
const duplicateRiddles = batch.riddles
  .map((entry) => ({
    id: entry.id,
    source: existingContent.get(`riddle-id:${entry.id}`) ?? existingContent.get(`riddle-answer:${normalizeQuestionText(entry.answer)}`),
  }))
  .filter(({ source }) => source);
if (duplicatePrompts.length || duplicateRiddles.length) {
  throw new Error(`Generated content duplicates existing rows:\n${[...duplicatePrompts, ...duplicateRiddles].map(({ id, source }) => `${id}: ${source}`).join('\n')}`);
}

// --- SQL emission -----------------------------------------------------------
const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const topicId = (subject, code) => subject.topics.find(([topicCode]) => topicCode === code)[1];
const canonicalQuestionFields = [
  'topic_id', 'subject_id', 'exam_type_id', 'paper_type_id', 'past_paper_id',
  'question_text', 'question_type', 'round_type', 'options', 'correct_answer',
  'explanation', 'difficulty', 'points', 'marks', 'time_limit', 'question_number',
  'section', 'is_compulsory', 'image_url', 'syllabus_topic_id', 'command_word',
  'assessment_objective', 'source_paper_code', 'source_question_number', 'exam_board_id',
];

function questionValues(subject, question) {
  const options = question.options
    ? JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`))
    : null;
  return {
    topic_id: topicId(subject, question.topicCode),
    subject_id: subject.subjectId,
    exam_type_id: 'exam_nsmq',
    paper_type_id: null,
    past_paper_id: null,
    question_text: question.prompt,
    question_type: question.type,
    round_type: question.roundType,
    options,
    correct_answer: question.correctAnswer,
    explanation: question.workedSolution,
    difficulty: question.difficulty,
    points: question.points,
    marks: question.marks,
    time_limit: question.timeLimit,
    question_number: null,
    section: null,
    is_compulsory: 1,
    image_url: null,
    syllabus_topic_id: null,
    command_word: question.commandWord,
    assessment_objective: question.assessmentObjective,
    source_paper_code: null,
    source_question_number: null,
    exam_board_id: null,
  };
}

function canonicalMatch(alias, values) {
  return canonicalQuestionFields.map((field) => `${alias}.${field} IS ${sql(values[field])}`).join(' AND ');
}

function releaseMatch(alias) {
  return [
    `${alias}.batch_id IS '${batchId}'`,
    `${alias}.quality_assurance IS 'automated_beta'`,
    `${alias}.release_channel IS 'beta'`,
    `${alias}.content_label IS ${sql(contentLabel)}`,
    `${alias}.source_url IS ${sql(releaseSourceUrl)}`,
    `${alias}.official_exam_board_content IS 0`,
    `${alias}.feedback_enabled IS 1`,
  ].join(' AND ');
}

function assertWithinD1Limit(name, lines) {
  const crlf = `${lines.join('\n')}\n`.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
  const bytes = Buffer.byteLength(crlf + ledger, 'utf8');
  if (bytes >= 19_500) throw new Error(`${name} exceeds the remote D1 query limit (${bytes} bytes)`);
}

const outBatch = resolve(outputRoot, `content/batches/${batchId}.json`);
await mkdir(dirname(outBatch), { recursive: true });
await writeFile(outBatch, `${JSON.stringify(batch, null, 2)}\n`);

const migrationPaths = [];
async function emitMigration(name, lines) {
  assertWithinD1Limit(name, lines);
  const output = resolve(outputRoot, `database/migrations/${name}`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${lines.join('\n')}\n`);
  migrationPaths.push(output);
}

let migrationNumber = 387;
{
  const name = `${migrationNumber}_nsmq_expansion_beta_foundation.sql`;
  const allTopicIds = subjects.flatMap((subject) => subject.topics.map(([, id]) => id));
  const lines = [
    `-- ${migrationNumber}: Foundation guard for NSMQ question bank expansion beta batch 001.`,
    '-- Original BrillaPrep practice content; not official NSMQ (Primetime) material.',
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS question_content_releases (
    question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    quality_assurance TEXT NOT NULL CHECK (quality_assurance IN ('automated_beta', 'human_reviewed')),
    release_channel TEXT NOT NULL CHECK (release_channel IN ('beta', 'production')),
    content_label TEXT NOT NULL,
    source_url TEXT NOT NULL,
    official_exam_board_content INTEGER NOT NULL DEFAULT 0 CHECK (official_exam_board_content IN (0, 1)),
    feedback_enabled INTEGER NOT NULL DEFAULT 1 CHECK (feedback_enabled IN (0, 1)),
    released_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
    'CREATE INDEX IF NOT EXISTS idx_question_content_releases_batch ON question_content_releases(batch_id);',
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_nsmq') AND (SELECT COUNT(*) FROM subjects WHERE id IN ('subj_nsmq_math', 'subj_nsmq_physics', 'subj_nsmq_chemistry', 'subj_nsmq_biology') AND exam_type_id = 'exam_nsmq') = 4 AND (SELECT COUNT(*) FROM topics WHERE id IN (${allTopicIds.map(sql).join(', ')})) = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

for (const subject of subjects) {
  const questions = batch.subjects.find((entry) => entry.subjectId === subject.subjectId).questions;
  for (const roundKey of roundKeys) {
    const round = rounds[roundKey];
    const partQuestions = questions.filter((question) => question.roundType === round.roundType);
    const ids = partQuestions.map((question) => question.id);
    const guardTable = `_migration_${migrationNumber}_guard`;
    const name = `${migrationNumber}_nsmq_${subject.key}_${round.migrationName}.sql`;
    const lines = [
      `-- ${migrationNumber}: Original BrillaPrep NSMQ ${subject.subjectId} ${round.migrationName} beta questions (batch 001).`,
      '-- Curriculum-aligned practice content; not official NSMQ (Primetime) material.',
      'PRAGMA foreign_keys = ON;',
      `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
      `DELETE FROM ${guardTable};`,
    ];
    for (const question of partQuestions) {
      const values = questionValues(subject, question);
      lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = ${sql(question.id)} AND NOT (${canonicalMatch('q', values)})) AND NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = ${sql(question.id)} AND NOT (${releaseMatch('r')})) THEN 1 ELSE 0 END;`);
    }
    for (const question of partQuestions) {
      const values = questionValues(subject, question);
      lines.push(`INSERT OR IGNORE INTO questions (id, ${canonicalQuestionFields.join(', ')}) VALUES (${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')});`);
    }
    lines.push(`INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, '${batchId}', 'automated_beta', 'beta', ${sql(contentLabel)}, ${sql(releaseSourceUrl)}, 0, 1 FROM questions WHERE id IN (${ids.map(sql).join(', ')});`);
    lines.push(`DELETE FROM ${guardTable};`);
    lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id IN (${ids.map(sql).join(', ')})) = ${ids.length} AND (SELECT COUNT(*) FROM question_content_releases r WHERE r.question_id IN (${ids.map(sql).join(', ')}) AND ${releaseMatch('r')}) = ${ids.length} THEN 1 ELSE 0 END;`);
    lines.push(`DROP TABLE ${guardTable};`);
    await emitMigration(name, lines);
    migrationNumber += 1;
  }
}

{
  const name = `${migrationNumber}_nsmq_riddles.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const riddleFields = ['subject_id', 'answer', 'clue_1', 'clue_2', 'clue_3', 'clue_4', 'clue_5', 'difficulty'];
  const riddleValues = (entry) => ({
    subject_id: entry.subjectId,
    answer: entry.answer,
    clue_1: entry.clues[0],
    clue_2: entry.clues[1],
    clue_3: entry.clues[2],
    clue_4: entry.clues[3] ?? null,
    clue_5: entry.clues[4] ?? null,
    difficulty: entry.difficulty,
  });
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep NSMQ riddles beta content (batch 001).`,
    '-- Curriculum-aligned practice content; not official NSMQ (Primetime) material.',
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
  ];
  for (const entry of batch.riddles) {
    const values = riddleValues(entry);
    const match = riddleFields.map((field) => `r.${field} IS ${sql(values[field])}`).join(' AND ');
    lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM riddles r WHERE r.id = ${sql(entry.id)} AND NOT (${match})) THEN 1 ELSE 0 END;`);
  }
  for (const entry of batch.riddles) {
    const values = riddleValues(entry);
    lines.push(`INSERT OR IGNORE INTO riddles (id, ${riddleFields.join(', ')}) VALUES (${sql(entry.id)}, ${riddleFields.map((field) => sql(values[field])).join(', ')});`);
  }
  const ids = batch.riddles.map((entry) => entry.id);
  lines.push(`DELETE FROM ${guardTable};`);
  lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM riddles WHERE id IN (${ids.map(sql).join(', ')})) = ${ids.length} THEN 1 ELSE 0 END;`);
  lines.push(`DROP TABLE ${guardTable};`);
  await emitMigration(name, lines);
  migrationNumber += 1;
}

{
  const name = `${migrationNumber}_nsmq_expansion_beta_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = batch.subjects.flatMap((entry) => entry.questions.map((question) => question.id));
  const riddleIdList = batch.riddles.map((entry) => entry.id);
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for NSMQ expansion beta batch 001.`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.exam_type_id = 'exam_nsmq' AND q.round_type IN ('problem_of_day', 'speed_race', 'round_one') AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 48 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.round_type = 'problem_of_day' AND q.question_type = 'problem') = 16 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.round_type = 'speed_race' AND q.question_type = 'direct_answer') = 16 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.round_type = 'round_one' AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = 16 AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 48 AND (SELECT COUNT(*) FROM riddles WHERE id IN (${riddleIdList.map(sql).join(', ')})) = 10 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
