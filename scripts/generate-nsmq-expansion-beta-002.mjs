import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-09T12:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'nsmq-expansion-beta-002';
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
// (3 pts, 30 s), true_false = statement judgement (2 pts, 10 s, options NULL,
// correct_answer 'True'/'False').
const rounds = {
  pod: { roundType: 'problem_of_day', type: 'problem', points: 5, timeLimit: 120, migrationName: 'problem_of_day' },
  sr: { roundType: 'speed_race', type: 'direct_answer', points: 2, timeLimit: 15, migrationName: 'speed_race' },
  r1: { roundType: 'round_one', type: 'multiple_choice', points: 3, timeLimit: 30, migrationName: 'round_one' },
  tf: { roundType: 'true_false', type: 'true_false', points: 2, timeLimit: 10, migrationName: 'true_false' },
};

const pod = (topicCode, difficulty, prompt, answer, solution, commandWord = 'Calculate', assessmentObjective = 'AO2') => ({ topicCode, difficulty, prompt, answer, solution, commandWord, assessmentObjective });
const sr = (topicCode, difficulty, prompt, answer, solution) => ({ topicCode, difficulty, prompt, answer, solution, commandWord: 'State', assessmentObjective: 'AO1' });
const r1 = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord = 'Identify', assessmentObjective = 'AO2') => ({ topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });
const tf = (topicCode, difficulty, prompt, answer, solution, commandWord = 'Determine', assessmentObjective = 'AO1') => ({ topicCode, difficulty, prompt, answer, solution, commandWord, assessmentObjective });

const subjects = [
  {
    key: 'math',
    subjectId: 'subj_nsmq_math',
    source: nsmqSource('Secondary Education Curriculum — Core Mathematics'),
    topics: [
      ['NSMQ-MATH-ALG', 'topic_nsmq_math_algebra', 'Algebra', 'Manipulate symbols, solve equations and work with algebraic expressions.'],
      ['NSMQ-MATH-QUAD', 'topic_nsmq_math_quadratic', 'Quadratic Equations', 'Solve and analyse quadratic equations and their roots.'],
      ['NSMQ-MATH-GEO', 'topic_nsmq_math_geometry', 'Geometry', 'Apply properties of shapes, angles and solids to measurements.'],
      ['NSMQ-MATH-TRIG', 'topic_nsmq_math_trigonometry', 'Trigonometry', 'Use trigonometric ratios and identities for triangles and angles.'],
      ['NSMQ-MATH-STAT', 'topic_nsmq_math_statistics', 'Statistics & Probability', 'Analyse data and compute probabilities of events.'],
      ['NSMQ-MATH-CALC', 'topic_nsmq_math_calculus', 'Calculus', 'Differentiate and integrate elementary functions.'],
    ],
    pod: [
      pod('NSMQ-MATH-TRIG', 'hard', 'A ladder 5 m long leans against a vertical wall and makes an angle of 60° with the horizontal ground. Calculate the exact height up the wall that the ladder reaches.', '5√3/2 m (≈ 4.33 m)',
        'The ladder, wall and ground form a right-angled triangle with hypotenuse 5 m. The height h is opposite the 60° angle, so sin 60° = h/5 and h = 5 sin 60° = 5 × √3/2 = 5√3/2 ≈ 4.33 m. The exact surd form uses the standard value sin 60° = √3/2.',
        'Calculate', 'AO3'),
      pod('NSMQ-MATH-CALC', 'hard', 'Find the coordinates of the turning point of the curve y = x² − 6x + 5 and determine its nature.', 'Minimum turning point at (3, −4)',
        'Differentiate: dy/dx = 2x − 6. At a turning point dy/dx = 0, so 2x − 6 = 0 giving x = 3. Then y = 3² − 6(3) + 5 = 9 − 18 + 5 = −4. The second derivative d²y/dx² = 2 is positive, so the turning point (3, −4) is a minimum.',
        'Determine', 'AO3'),
    ],
    sr: [
      sr('NSMQ-MATH-ALG', 'easy', 'Factorise completely: x² − 9.', '(x − 3)(x + 3)',
        'This is a difference of two squares: a² − b² = (a − b)(a + b) with a = x and b = 3, since 9 = 3². Expanding (x − 3)(x + 3) returns x² − 9, confirming the factorisation.'),
      sr('NSMQ-MATH-GEO', 'easy', 'What is the sum of the angles on a straight line, in degrees?', '180°',
        'Angles on a straight line at a point are supplementary and add up to 180°, which is half of the full 360° turn around a point. This is one of the basic angle facts used throughout geometry.'),
      sr('NSMQ-MATH-CALC', 'easy', 'What is the integral of 2x with respect to x?', 'x² + C',
        'By the power rule for integration, ∫2x dx = 2 · x²/2 + C = x² + C. The constant of integration C is required because differentiation of any constant gives zero.'),
      sr('NSMQ-MATH-STAT', 'easy', 'What is the mean of the numbers 4, 8, 10, 12 and 16?', '10',
        'Mean = sum of values ÷ number of values. The sum is 4 + 8 + 10 + 12 + 16 = 50 and there are 5 values, so the mean is 50 ÷ 5 = 10.'),
    ],
    r1: [
      r1('NSMQ-MATH-QUAD', 'medium', 'What is the discriminant of the quadratic equation 2x² − 3x + 5 = 0?', '−31', ['49', '−11', '31'],
        'The discriminant is Δ = b² − 4ac with a = 2, b = −3, c = 5: Δ = (−3)² − 4(2)(5) = 9 − 40 = −31. Because Δ is negative, the equation has no real roots. Squaring −3 correctly gives +9; forgetting the sign change gives the wrong value 49.',
        'Calculate', 'AO2'),
      r1('NSMQ-MATH-CALC', 'easy', 'What is the derivative of sin x with respect to x?', 'cos x', ['−cos x', '−sin x', 'tan x'],
        'The standard derivative is d/dx(sin x) = cos x. The derivative of cos x is −sin x, which is the common confusion; tan x differentiates to sec²x, not sin x.',
        'Identify', 'AO1'),
      r1('NSMQ-MATH-TRIG', 'medium', 'What is the exact value of sin 30°?', '1/2', ['√3/2', '√2/2', '1'],
        'From the standard 30-60-90 triangle, sin 30° = opposite/hypotenuse = 1/2. The value √3/2 is cos 30° (equivalently sin 60°), and √2/2 belongs to the 45° angle.',
        'Identify', 'AO1'),
      r1('NSMQ-MATH-STAT', 'medium', 'What is the median of the data set 3, 7, 9, 12, 15?', '9', ['7', '9.2', '12'],
        'The data are already in ascending order with five values, so the median is the middle (third) value, 9. The value 9.2 is the mean (46 ÷ 5), a common confusion between the two averages.',
        'Identify', 'AO2'),
    ],
    tf: [
      tf('NSMQ-MATH-ALG', 'easy', 'The expansion of (a + b)² is a² + b².', 'False',
        'Expanding properly: (a + b)² = (a + b)(a + b) = a² + 2ab + b². The cross term 2ab is missing from a² + b², so the statement is false in general; equality holds only when ab = 0.'),
      tf('NSMQ-MATH-TRIG', 'easy', 'For every angle θ, sin²θ + cos²θ = 1.', 'True',
        'This is the fundamental Pythagorean identity. It follows directly from the unit-circle definitions sin θ = y and cos θ = x combined with x² + y² = 1, so it holds for all angles without exception.'),
      tf('NSMQ-MATH-GEO', 'medium', 'The diagonals of every parallelogram are equal in length.', 'False',
        'All parallelogram diagonals bisect each other, but they are equal only in special parallelograms such as rectangles and squares. A slanted parallelogram has one long and one short diagonal, so the statement is false in general.'),
      tf('NSMQ-MATH-STAT', 'easy', 'The range of a data set is the difference between the largest and smallest values.', 'True',
        'By definition, range = maximum value − minimum value. It is the simplest measure of spread, although it depends only on the two extreme values and is therefore sensitive to outliers.'),
    ],
  },
  {
    key: 'phys',
    subjectId: 'subj_nsmq_physics',
    source: nsmqSource('Secondary Education Curriculum — Physics'),
    topics: [
      ['NSMQ-PHYS-MECH', 'topic_nsmq_phys_mechanics', 'Mechanics', 'Apply the laws of motion, forces and energy to physical systems.'],
      ['NSMQ-PHYS-KIN', 'topic_nsmq_phys_kinematics', 'Kinematics', 'Describe motion using displacement, velocity, acceleration and time.'],
      ['NSMQ-PHYS-ELEC', 'topic_nsmq_phys_electricity', 'Electricity & Magnetism', 'Analyse circuits, fields and electromagnetic interactions.'],
      ['NSMQ-PHYS-WAVES', 'topic_nsmq_phys_waves', 'Waves & Optics', 'Relate wave speed, frequency, wavelength and light behaviour.'],
      ['NSMQ-PHYS-THERMO', 'topic_nsmq_phys_thermodynamics', 'Thermodynamics', 'Quantify heat, work, temperature and energy transfer.'],
      ['NSMQ-PHYS-MOD', 'topic_nsmq_phys_modern_physics', 'Modern Physics', 'Apply quantum and nuclear concepts to radiation and matter.'],
    ],
    pod: [
      pod('NSMQ-PHYS-KIN', 'hard', 'A ball is thrown vertically upwards with an initial speed of 20 m/s. Taking g = 10 m/s² and neglecting air resistance, calculate the maximum height reached and the total time of flight.', '20 m; total time 4 s',
        'At maximum height v = 0. Using v² = u² − 2gh: 0 = 20² − 2(10)h, so h = 400/20 = 20 m. Time to the peak: t = u/g = 20/10 = 2 s. By symmetry the descent takes another 2 s, giving a total time of flight of 4 s.',
        'Calculate', 'AO3'),
      pod('NSMQ-PHYS-THERMO', 'medium', 'Calculate the heat energy absorbed when 0.2 kg of ice at 0 °C melts completely at the same temperature. (Specific latent heat of fusion of ice = 336 000 J/kg)', '67 200 J (67.2 kJ)',
        'During melting there is no temperature change, so the latent heat formula applies: Q = mL = 0.2 × 336 000 = 67 200 J = 67.2 kJ. The energy breaks the bonds of the solid lattice rather than raising the temperature.',
        'Calculate', 'AO2'),
    ],
    sr: [
      sr('NSMQ-PHYS-ELEC', 'easy', 'What is the SI unit of electrical resistance?', 'Ohm',
        'The ohm (Ω) is the SI unit of electrical resistance; from Ohm’s law R = V/I, one ohm equals one volt per ampere. It is named after the German physicist Georg Simon Ohm.'),
      sr('NSMQ-PHYS-WAVES', 'easy', 'What type of wave is a sound wave travelling through air?', 'A longitudinal wave',
        'Sound in air travels as compressions and rarefactions in which the air particles oscillate parallel to the direction of energy transfer, which defines a longitudinal wave. Light, by contrast, is transverse.'),
      sr('NSMQ-PHYS-KIN', 'easy', 'What physical quantity is given by the gradient of a velocity–time graph?', 'Acceleration',
        'Acceleration is the rate of change of velocity, a = Δv/Δt, which is exactly the gradient (slope) of a velocity–time graph. The area under the same graph gives the displacement.'),
      sr('NSMQ-PHYS-MOD', 'easy', 'Which scientist proposed the mass–energy equivalence equation E = mc²?', 'Albert Einstein',
        'Einstein published E = mc² in 1905 as a consequence of special relativity: mass and energy are equivalent, with c² (about 9 × 10¹⁶ m²/s²) as the conversion factor. It underpins nuclear energy and nuclear binding-energy calculations.'),
    ],
    r1: [
      r1('NSMQ-PHYS-KIN', 'easy', 'Which physical quantity has the SI unit metres per second squared (m/s²)?', 'Acceleration', ['Velocity', 'Force', 'Momentum'],
        'Acceleration is the change in velocity per unit time, so its unit is (m/s)/s = m/s². Velocity is m/s, force is the newton (kg·m/s²), and momentum is kg·m/s.',
        'Identify', 'AO1'),
      r1('NSMQ-PHYS-THERMO', 'medium', 'Which process transfers heat through a solid without any bulk movement of the material itself?', 'Conduction', ['Convection', 'Radiation', 'Evaporation'],
        'In conduction, vibrating particles pass kinetic energy to their neighbours while staying in fixed positions, which is how heat travels through solids. Convection requires bulk fluid movement, and radiation needs no medium at all.',
        'Identify', 'AO2'),
      r1('NSMQ-PHYS-MOD', 'medium', 'The time taken for half of the unstable nuclei in a radioactive sample to decay is called the', 'Half-life', ['Decay constant', 'Activity', 'Binding energy'],
        'The half-life t½ is the average time for half the nuclei to decay, and the activity falls by half in each half-life. The decay constant λ is related by t½ = ln 2/λ, but it is not itself a time.',
        'Identify', 'AO1'),
      r1('NSMQ-PHYS-MECH', 'medium', 'A resultant force of 20 N acts on a body of mass 4 kg. What acceleration is produced?', '5 m/s²', ['80 m/s²', '0.2 m/s²', '24 m/s²'],
        'Newton’s second law gives a = F/m = 20/4 = 5 m/s². Multiplying instead of dividing gives 80 m/s², inverting the ratio gives 0.2 m/s², and adding the numbers gives 24 m/s² — all common slips.',
        'Calculate', 'AO2'),
    ],
    tf: [
      tf('NSMQ-PHYS-MECH', 'easy', 'Total momentum is conserved in both elastic and inelastic collisions, provided no external force acts.', 'True',
        'Conservation of momentum follows from Newton’s third law and holds for every collision in an isolated system. What distinguishes elastic collisions is that kinetic energy is also conserved; in inelastic collisions some kinetic energy becomes heat or sound.'),
      tf('NSMQ-PHYS-ELEC', 'easy', 'The resistance of a metallic conductor increases as its temperature rises.', 'True',
        'In a metal, higher temperature makes the lattice ions vibrate more vigorously, so drifting electrons are scattered more often and resistance increases. This is why a filament lamp has a much higher resistance when hot than when cold.'),
      tf('NSMQ-PHYS-WAVES', 'medium', 'Light waves require a material medium in order to propagate.', 'False',
        'Light is an electromagnetic wave consisting of oscillating electric and magnetic fields, so it travels through a vacuum — which is how sunlight reaches the Earth. Only mechanical waves such as sound require a material medium.'),
      tf('NSMQ-PHYS-THERMO', 'easy', 'Temperature is a measure of the average kinetic energy of the particles in a substance.', 'True',
        'In kinetic theory, the absolute temperature of a substance is proportional to the mean translational kinetic energy of its particles. Heating a substance makes its particles move faster on average, which we register as a higher temperature.'),
    ],
  },
  {
    key: 'chem',
    subjectId: 'subj_nsmq_chemistry',
    source: nsmqSource('Secondary Education Curriculum — Chemistry'),
    topics: [
      ['NSMQ-CHEM-ATOM', 'topic_nsmq_chem_atomic', 'Atomic Structure', 'Describe subatomic particles and electron arrangements in atoms.'],
      ['NSMQ-CHEM-BOND', 'topic_nsmq_chem_bonding', 'Chemical Bonding', 'Explain how ionic, covalent and metallic bonds form compounds.'],
      ['NSMQ-CHEM-STOICH', 'topic_nsmq_chem_stoichiometry', 'Stoichiometry', 'Calculate reacting quantities using moles and balanced equations.'],
      ['NSMQ-CHEM-EQUIL', 'topic_nsmq_chem_equilibrium', 'Chemical Equilibrium', 'Apply equilibrium expressions and Le Chatelier’s principle.'],
      ['NSMQ-CHEM-ORG', 'topic_nsmq_chem_organic', 'Organic Chemistry', 'Name and classify carbon compounds and their reactions.'],
      ['NSMQ-CHEM-ELEC', 'topic_nsmq_chem_electrochemistry', 'Electrochemistry', 'Relate electric charge to chemical change in cells and electrolysis.'],
    ],
    pod: [
      pod('NSMQ-CHEM-STOICH', 'hard', 'Calculate the mass of calcium carbonate that must decompose completely to produce 4.4 g of carbon dioxide. (CaCO₃ → CaO + CO₂; Ca = 40, C = 12, O = 16)', '10 g',
        'M(CO₂) = 12 + 2(16) = 44 g/mol, so n(CO₂) = 4.4/44 = 0.10 mol. The balanced equation shows a 1:1 mole ratio, so n(CaCO₃) = 0.10 mol. M(CaCO₃) = 40 + 12 + 3(16) = 100 g/mol, giving mass = 0.10 × 100 = 10 g.',
        'Calculate', 'AO3'),
      pod('NSMQ-CHEM-EQUIL', 'hard', 'A 0.100 M solution of the weak monoprotic acid HA has [H⁺] = 1.0 × 10⁻³ M at equilibrium. Calculate the acid dissociation constant Ka.', 'Ka ≈ 1.0 × 10⁻⁵ mol dm⁻³',
        'For HA ⇌ H⁺ + A⁻, the dissociation gives [H⁺] = [A⁻] = 1.0 × 10⁻³ M and [HA] = 0.100 − 0.001 = 0.099 M. Then Ka = [H⁺][A⁻]/[HA] = (1.0 × 10⁻³)²/0.099 ≈ 1.01 × 10⁻⁵ ≈ 1.0 × 10⁻⁵ mol dm⁻³.',
        'Calculate', 'AO3'),
    ],
    sr: [
      sr('NSMQ-CHEM-ATOM', 'easy', 'What is the chemical symbol for the element sodium?', 'Na',
        'Sodium’s symbol Na comes from its Latin name natrium. It is element 11, an alkali metal in group 1 whose atoms carry the electron configuration 2,8,1.'),
      sr('NSMQ-CHEM-STOICH', 'easy', 'How many particles are contained in one mole of any substance, to three significant figures?', '6.02 × 10²³',
        'One mole contains the Avogadro constant of particles, NA = 6.02 × 10²³ mol⁻¹. The mole links laboratory masses to numbers of atoms, molecules or ions through n = N/NA.'),
      sr('NSMQ-CHEM-ORG', 'easy', 'What is the molecular formula of methane?', 'CH₄',
        'Methane is the simplest alkane, with one carbon atom bonded to four hydrogen atoms, giving CH₄. It fits the alkane general formula CₙH₂ₙ₊₂ with n = 1.'),
      sr('NSMQ-CHEM-ELEC', 'easy', 'Which gas is liberated at the cathode during the electrolysis of dilute sulphuric acid?', 'Hydrogen',
        'At the inert cathode, hydrogen ions are preferentially discharged and reduced: 2H⁺ + 2e⁻ → H₂. Oxygen is released at the anode from the oxidation of water or hydroxide species.'),
    ],
    r1: [
      r1('NSMQ-CHEM-ELEC', 'easy', 'In electrolysis, the electrode at which oxidation takes place is the', 'Anode', ['Cathode', 'Salt bridge', 'Electrolyte'],
        'Oxidation (loss of electrons) always occurs at the anode, while reduction occurs at the cathode — remembered by the mnemonic OIL RIG or “an ox, red cat”. The electrolyte is the conducting liquid, not an electrode.',
        'Identify', 'AO1'),
      r1('NSMQ-CHEM-EQUIL', 'medium', 'According to Le Chatelier’s principle, increasing the pressure on the equilibrium N₂(g) + 3H₂(g) ⇌ 2NH₃(g) shifts the position of equilibrium', 'Towards ammonia, the side with fewer gas moles', ['Towards nitrogen and hydrogen', 'It does not shift at all', 'Towards the side with more gas moles'],
        'The forward reaction converts 4 moles of gas into 2 moles. Raising the pressure favours the side with fewer gas molecules, so the equilibrium shifts right towards NH₃. This is why the Haber process operates at high pressure.',
        'Identify', 'AO2'),
      r1('NSMQ-CHEM-ORG', 'medium', 'Which homologous series contains at least one carbon–carbon triple bond in every member?', 'Alkynes', ['Alkanes', 'Alkenes', 'Alcohols'],
        'Alkynes are defined by a C≡C triple bond and follow the general formula CₙH₂ₙ₋₂, as in ethyne C₂H₂. Alkanes have only single bonds, alkenes have a C=C double bond, and alcohols are characterised by the −OH group.',
        'Identify', 'AO1'),
      r1('NSMQ-CHEM-BOND', 'medium', 'Which of the following substances has a giant covalent (macromolecular) structure?', 'Diamond', ['Sodium chloride', 'Carbon dioxide', 'Copper'],
        'Diamond is a giant covalent lattice in which every carbon atom is bonded to four others, making it extremely hard. Sodium chloride is giant ionic, copper is giant metallic, and carbon dioxide is a simple molecular solid.',
        'Identify', 'AO2'),
    ],
    tf: [
      tf('NSMQ-CHEM-ATOM', 'easy', 'The mass number of an atom is the sum of its protons and neutrons.', 'True',
        'Mass number A counts the nucleons: A = Z + N, where Z is the proton (atomic) number and N the neutron count. Electrons are excluded because their mass is negligible compared with a proton or neutron.'),
      tf('NSMQ-CHEM-BOND', 'easy', 'A covalent bond involves the complete transfer of electrons from one atom to another.', 'False',
        'Covalent bonding is the sharing of electron pairs between atoms, as in H₂ or CH₄. Complete transfer of electrons produces ions and is the defining feature of ionic bonding, as in sodium chloride.'),
      tf('NSMQ-CHEM-ORG', 'easy', 'Ethene rapidly decolourises bromine water at room temperature.', 'True',
        'Ethene is unsaturated: its C=C double bond undergoes an addition reaction with bromine to form colourless 1,2-dibromoethane, so the orange bromine colour disappears. This is the standard test for unsaturation.'),
      tf('NSMQ-CHEM-STOICH', 'medium', 'One mole of any gas occupies a volume of 22.4 dm³ at standard temperature and pressure.', 'True',
        'At s.t.p. (0 °C and 1 atmosphere) the molar volume of an ideal gas is 22.4 dm³/mol, so one mole of any gas occupies 22.4 dm³. This Avogadro-law result is used constantly in reacting-gas calculations.'),
    ],
  },
  {
    key: 'bio',
    subjectId: 'subj_nsmq_biology',
    source: nsmqSource('Secondary Education Curriculum — Biology'),
    topics: [
      ['NSMQ-BIO-CELL', 'topic_nsmq_bio_cells', 'Cell Biology', 'Explain cell structure, organelles and transport across membranes.'],
      ['NSMQ-BIO-GEN', 'topic_nsmq_bio_genetics', 'Genetics', 'Apply Mendelian and molecular principles of heredity.'],
      ['NSMQ-BIO-ECO', 'topic_nsmq_bio_ecology', 'Ecology', 'Analyse energy flow and relationships within ecosystems.'],
      ['NSMQ-BIO-PHYS', 'topic_nsmq_bio_physiology', 'Human Physiology', 'Explain how human organ systems function and are regulated.'],
      ['NSMQ-BIO-BIOCHEM', 'topic_nsmq_bio_biochemistry', 'Biochemistry', 'Relate enzymes, respiration and molecular processes in cells.'],
    ],
    pod: [
      pod('NSMQ-BIO-GEN', 'hard', 'In humans, both parents have blood group AB. Using the ABO blood-group genetics, determine the probability that their child has blood group O.', '0% (impossible)',
        'Blood groups show codominance: group AB means genotype IᴬIᴮ. The cross IᴬIᴮ × IᴬIᴮ gives offspring genotypes IᴬIᴬ, IᴬIᴮ and IᴮIᴮ only. Group O requires the genotype ii, and neither parent carries an i allele, so the probability is zero.',
        'Determine', 'AO3'),
      pod('NSMQ-BIO-PHYS', 'medium', 'A student’s daily energy intake is 8400 kJ, of which the basal metabolic rate accounts for 70%. Calculate the energy available for physical activity and other processes.', '2520 kJ',
        'Energy used by the basal metabolic rate = 70% × 8400 = 0.70 × 8400 = 5880 kJ. The remainder is available for activity: 8400 − 5880 = 2520 kJ. Basal metabolism covers essential processes such as maintaining body temperature and organ function at rest.',
        'Calculate', 'AO2'),
    ],
    sr: [
      sr('NSMQ-BIO-PHYS', 'easy', 'Name the type of blood vessel that carries blood away from the heart.', 'Arteries',
        'Arteries carry blood away from the heart under high pressure and have thick, elastic, muscular walls to withstand it. Veins return blood to the heart, and capillaries link the two in the tissues.'),
      sr('NSMQ-BIO-GEN', 'easy', 'Which molecule carries the genetic code from the nucleus to the ribosomes during protein synthesis?', 'Messenger RNA (mRNA)',
        'Messenger RNA is transcribed from a DNA template in the nucleus and travels to the ribosomes, where its codons are translated into an amino-acid sequence. Transfer RNA then brings the matching amino acids.'),
      sr('NSMQ-BIO-ECO', 'easy', 'What term describes all the populations of different species living together in the same area?', 'A community',
        'A community is the sum of all populations of different species in a habitat. A population is one species only, while an ecosystem adds the non-living (abiotic) environment to the community.'),
      sr('NSMQ-BIO-CELL', 'easy', 'Which cell structure controls the movement of substances into and out of the cell?', 'The cell membrane',
        'The partially permeable cell (plasma) membrane surrounds every cell and regulates the entry and exit of substances by diffusion, osmosis and active transport. The cell wall of plant cells is fully permeable and only provides support.'),
    ],
    r1: [
      r1('NSMQ-BIO-GEN', 'medium', 'In a monohybrid cross between two heterozygous parents (Tt × Tt), what fraction of the offspring is expected to show the recessive phenotype?', '1/4', ['1/2', '3/4', 'All of them'],
        'The Punnett square for Tt × Tt gives genotypes 1 TT : 2 Tt : 1 tt. Only the tt genotype shows the recessive phenotype, which is 1 of 4 boxes, so the expected fraction is 1/4 (25%). The 3/4 figure is the dominant-phenotype fraction.',
        'Calculate', 'AO2'),
      r1('NSMQ-BIO-CELL', 'medium', 'Which organelle is the main site of aerobic respiration in a eukaryotic cell?', 'Mitochondrion', ['Ribosome', 'Chloroplast', 'Nucleus'],
        'Aerobic respiration occurs in the mitochondria, whose folded inner membranes (cristae) carry the enzymes that release energy from glucose as ATP. Ribosomes make proteins, chloroplasts photosynthesise, and the nucleus stores DNA.',
        'Identify', 'AO1'),
      r1('NSMQ-BIO-ECO', 'medium', 'In a food chain, an organism that feeds on primary consumers is called a', 'Secondary consumer', ['Producer', 'Herbivore', 'Decomposer'],
        'Primary consumers are herbivores feeding on producers, so the next trophic level — carnivores or omnivores eating those herbivores — is the secondary consumer level. Decomposers break down dead material from all levels.',
        'Identify', 'AO1'),
      r1('NSMQ-BIO-BIOCHEM', 'medium', 'At approximately what temperature do most enzymes in the human body work fastest?', '37 °C', ['0 °C', '20 °C', '100 °C'],
        'Human enzymes have an optimum near normal body temperature, about 37 °C: kinetic energy and collision rates are high enough without damaging the enzyme’s shape. Well above this the enzyme denatures; near 0 °C activity almost stops.',
        'Identify', 'AO1'),
    ],
    tf: [
      tf('NSMQ-BIO-GEN', 'easy', 'A gamete contains half the chromosome number found in a normal body cell of the same organism.', 'True',
        'Gametes are produced by meiosis, which halves the chromosome number, so they are haploid (n) while body cells are diploid (2n). Fertilisation of two gametes then restores the diploid number in the zygote.'),
      tf('NSMQ-BIO-ECO', 'easy', 'Energy is recycled between the trophic levels of an ecosystem.', 'False',
        'Energy flows in one direction only: it is captured by producers and progressively lost as heat at each transfer, so it must be continually supplied by the Sun. It is nutrients such as carbon and nitrogen that are recycled.'),
      tf('NSMQ-BIO-PHYS', 'medium', 'The hormone insulin lowers the concentration of glucose in the blood.', 'True',
        'Insulin is secreted by the pancreas when blood glucose rises; it stimulates liver and muscle cells to absorb glucose and convert it to glycogen for storage, thereby lowering blood glucose back towards the set point.'),
      tf('NSMQ-BIO-BIOCHEM', 'easy', 'Oxygen is released as a product of photosynthesis.', 'True',
        'During the light-dependent stage of photosynthesis, water molecules are split (photolysis), releasing oxygen gas. The overall equation 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ shows oxygen as a product alongside glucose.'),
    ],
  },
];

// Prod-canonical NSMQ topic rows. Prod was remediated to per-subject topic ids
// (see scripts/nsmq-topic-identity-resolver.cjs and migrations 267-270/278-280);
// schema.sql/seed.sql still carry the legacy seed-style rows, so the foundation
// migration INSERT OR IGNOREs these copies (content copied from the seed rows)
// for fresh baselines and scratch tests. On prod every id already exists, so
// the inserts no-op. This is also the allowlist of prod-verified topic ids.
// [id, subjectId, parentId, name, slug, description, theoryContent, keyFormulas, displayOrder]
const canonicalTopicRows = [
  ['topic_nsmq_math_algebra', 'subj_nsmq_math', null, 'Algebra', 'algebra', 'Fundamental algebraic concepts and operations', 'Algebra is the branch of mathematics dealing with symbols and the rules for manipulating those symbols. It includes solving equations, working with polynomials, and understanding functions.', '["ax + b = c → x = (c-b)/a", "(a+b)² = a² + 2ab + b²", "(a-b)² = a² - 2ab + b²", "a² - b² = (a+b)(a-b)"]', 1],
  ['topic_nsmq_math_calculus', 'subj_nsmq_math', null, 'Calculus', 'calculus', 'Study of rates of change and accumulation', 'Calculus is the mathematical study of continuous change. It has two major branches: differential calculus and integral calculus.', '["d/dx(xⁿ) = nxⁿ⁻¹", "∫xⁿdx = xⁿ⁺¹/(n+1) + C", "d/dx(sin x) = cos x", "d/dx(eˣ) = eˣ"]', 4],
  ['topic_nsmq_math_geometry', 'subj_nsmq_math', null, 'Geometry', 'geometry', 'Study of shapes, sizes, and properties of space', 'Geometry deals with the properties, measurement, and relationships of points, lines, angles, surfaces, and solids.', '["Area of circle = πr²", "Circumference = 2πr", "Area of triangle = ½bh", "Pythagorean theorem: a² + b² = c²"]', 2],
  ['topic_nsmq_math_statistics', 'subj_nsmq_math', null, 'Statistics & Probability', 'statistics-probability', 'Analysis of data and chance', 'Statistics involves collecting, analyzing, and interpreting data. Probability measures the likelihood of events occurring.', '["Mean = Σx/n", "Variance = Σ(x-μ)²/n", "P(A∪B) = P(A) + P(B) - P(A∩B)", "P(A|B) = P(A∩B)/P(B)"]', 5],
  ['topic_nsmq_math_trigonometry', 'subj_nsmq_math', null, 'Trigonometry', 'trigonometry', 'Study of triangles and trigonometric functions', 'Trigonometry studies relationships between side lengths and angles of triangles. The main functions are sine, cosine, and tangent.', '["sin²θ + cos²θ = 1", "tan θ = sin θ / cos θ", "sin 2θ = 2 sin θ cos θ", "cos 2θ = cos²θ - sin²θ"]', 3],
  ['topic_nsmq_math_quadratic', 'subj_nsmq_math', 'topic_nsmq_math_algebra', 'Quadratic Equations', 'quadratic-equations', 'Solving and graphing quadratic equations', 'A quadratic equation has the standard form ax² + bx + c = 0. Solutions can be found using factoring, completing the square, or the quadratic formula.', '["x = (-b ± √(b²-4ac)) / 2a", "Sum of roots = -b/a", "Product of roots = c/a", "Discriminant Δ = b² - 4ac"]', 1],
  ['topic_nsmq_phys_electricity', 'subj_nsmq_physics', null, 'Electricity & Magnetism', 'electricity-magnetism', 'Study of electric charges and magnetic fields', 'This branch covers electric charges, electric fields, magnetic fields, and electromagnetic interactions.', '["V = IR (Ohm\'s Law)", "P = IV = I²R", "F = qE", "F = BIL"]', 2],
  ['topic_nsmq_phys_mechanics', 'subj_nsmq_physics', null, 'Mechanics', 'mechanics', 'Study of motion and forces', 'Mechanics is the branch of physics dealing with motion and the forces that produce motion. It includes kinematics, dynamics, and statics.', '["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "F = ma"]', 1],
  ['topic_nsmq_phys_kinematics', 'subj_nsmq_physics', 'topic_nsmq_phys_mechanics', 'Kinematics', 'kinematics', 'Description of motion without considering forces', 'Kinematics describes motion using concepts of displacement, velocity, and acceleration without reference to the forces causing the motion.', '["Average velocity = Δs/Δt", "Instantaneous velocity = ds/dt", "Acceleration = dv/dt", "Range = u²sin2θ/g"]', 1],
  ['topic_nsmq_phys_modern_physics', 'subj_nsmq_physics', null, 'Modern Physics', 'modern-physics', 'Quantum mechanics and relativity', 'Modern physics covers theories developed in the 20th century including quantum mechanics, special relativity, and atomic physics.', '["E = mc²", "E = hf", "λ = h/mv", "ΔxΔp ≥ ℏ/2"]', 5],
  ['topic_nsmq_phys_thermodynamics', 'subj_nsmq_physics', null, 'Thermodynamics', 'thermodynamics', 'Study of heat and energy transfer', 'Thermodynamics studies the relationships between heat, work, temperature, and energy in physical systems.', '["Q = mcΔT", "PV = nRT", "W = PΔV", "Efficiency = W/Q_in"]', 4],
  ['topic_nsmq_phys_waves', 'subj_nsmq_physics', null, 'Waves & Optics', 'waves-optics', 'Study of wave motion and light', 'Waves transfer energy without transferring matter. Optics is the study of light behavior including reflection, refraction, and diffraction.', '["v = fλ", "n = c/v", "n₁sinθ₁ = n₂sinθ₂ (Snell\'s Law)", "1/f = 1/u + 1/v"]', 3],
  ['topic_nsmq_chem_atomic', 'subj_nsmq_chemistry', null, 'Atomic Structure', 'atomic-structure', 'Structure of atoms and electron configuration', 'Atoms consist of protons, neutrons, and electrons. Understanding electron configuration is key to predicting chemical behavior.', '["Mass number A = Z + N", "E = -13.6/n² eV (hydrogen)", "λ = h/mv (de Broglie)"]', 1],
  ['topic_nsmq_chem_bonding', 'subj_nsmq_chemistry', null, 'Chemical Bonding', 'chemical-bonding', 'How atoms combine to form compounds', 'Chemical bonds form when atoms share or transfer electrons. Main types include ionic, covalent, and metallic bonds.', '["Bond order = (bonding e⁻ - antibonding e⁻)/2", "Electronegativity difference determines bond type"]', 2],
  ['topic_nsmq_chem_stoichiometry', 'subj_nsmq_chemistry', null, 'Stoichiometry', 'stoichiometry', 'Quantitative relationships in chemical reactions', 'Stoichiometry involves calculating the quantities of reactants and products in chemical reactions using balanced equations.', '["n = m/M", "Molarity M = n/V", "PV = nRT", "% yield = (actual/theoretical) × 100"]', 3],
  ['topic_nsmq_chem_equilibrium', 'subj_nsmq_chemistry', null, 'Chemical Equilibrium', 'chemical-equilibrium', 'Balance in reversible reactions', 'Chemical equilibrium occurs when the rates of forward and reverse reactions are equal. Le Chatelier\'s principle predicts equilibrium shifts.', '["Kc = [products]/[reactants]", "Kp = Kc(RT)^Δn", "ΔG = -RT ln K"]', 4],
  ['topic_nsmq_chem_organic', 'subj_nsmq_chemistry', null, 'Organic Chemistry', 'organic-chemistry', 'Chemistry of carbon compounds', 'Organic chemistry studies carbon-containing compounds. It covers nomenclature, reactions, and properties of organic molecules.', '["CₙH₂ₙ₊₂ (alkanes)", "CₙH₂ₙ (alkenes)", "CₙH₂ₙ₋₂ (alkynes)"]', 5],
  ['topic_nsmq_chem_electrochemistry', 'subj_nsmq_chemistry', null, 'Electrochemistry', 'electrochemistry', 'Chemical reactions involving electricity', 'Electrochemistry studies the relationship between electrical energy and chemical changes, including batteries and electrolysis.', '["E°cell = E°cathode - E°anode", "ΔG = -nFE°", "Faraday\'s laws"]', 6],
  ['topic_nsmq_bio_cells', 'subj_nsmq_biology', null, 'Cell Biology', 'cell-biology', 'Structure and function of cells', 'The cell is the basic unit of life. Understanding cell structure and organelle functions is fundamental to biology.', '["Cell theory", "Prokaryotic vs Eukaryotic", "Organelle functions"]', 1],
  ['topic_nsmq_bio_genetics', 'subj_nsmq_biology', null, 'Genetics', 'genetics', 'Study of heredity and variation', 'Genetics studies how traits are passed from parents to offspring through genes and DNA.', '["Mendel\'s laws", "Punnett squares", "DNA structure: A-T, G-C"]', 2],
  ['topic_nsmq_bio_ecology', 'subj_nsmq_biology', null, 'Ecology', 'ecology', 'Study of organisms and their environment', 'Ecology examines the relationships between organisms and their environment, including ecosystems and biodiversity.', '["Food chains/webs", "Energy flow (10% rule)", "Population dynamics"]', 3],
  ['topic_nsmq_bio_physiology', 'subj_nsmq_biology', null, 'Human Physiology', 'human-physiology', 'Functions of the human body', 'Human physiology studies how the body\'s organ systems work together to maintain life and health.', '["Homeostasis", "Nervous system", "Circulatory system", "Respiratory system"]', 4],
  ['topic_nsmq_bio_biochemistry', 'subj_nsmq_biology', null, 'Biochemistry', 'biochemistry', 'Chemical processes in living organisms', 'Biochemistry explores the chemical reactions that occur within living cells, including metabolism and enzyme function.', '["ATP → ADP + P + energy", "Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "Cellular respiration"]', 5],
];

for (const subject of subjects) {
  for (const [code, id] of subject.topics) {
    const row = canonicalTopicRows.find(([topicId]) => topicId === id);
    if (!row) throw new Error(`${code}: topic id ${id} is not a prod-verified canonical NSMQ topic`);
    if (row[1] !== subject.subjectId) throw new Error(`${code}: topic id ${id} belongs to ${row[1]}, not ${subject.subjectId}`);
  }
}

const roundKeys = ['pod', 'sr', 'r1', 'tf'];

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
    specificationCode: `BRILLA-NSMQ-${subject.key.toUpperCase()}-BETA-002`,
    sources: [subject.source],
    topics: subject.topics.map(([code, , title, objective]) => ({ code, title, objective })),
    questions: roundKeys.flatMap((roundKey) => {
      const round = rounds[roundKey];
      return subject[roundKey].map((source, index) => {
        const base = {
          id: `q_nsmq_${subject.key}_${roundKey}_b002_${String(index + 1).padStart(3, '0')}`,
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
};

// --- Validation -------------------------------------------------------------
// question-content-lib.mjs covers the shared question shape (provenance,
// options, duplicates, difficulty) in draft mode; 'direct_answer', 'problem'
// and 'true_false' were added to its VALID_TYPES additively for these NSMQ
// batches. Round-type conventions are NOT covered by the library, so they are
// validated here in the same check style.
const validation = validateQuestionBatch(batch, { mode: 'draft' });

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!/not official/i.test(batch.release.contentLabel)) errors.push('release.contentLabel must disclaim official status');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');

  const expectedPerSubject = { problem_of_day: 2, speed_race: 4, round_one: 4, true_false: 4 };
  const difficulties = new Set(['easy', 'medium', 'hard']);
  for (const subject of batch.subjects) {
    const counts = { problem_of_day: 0, speed_race: 0, round_one: 0, true_false: 0 };
    const seenDifficulties = new Set();
    for (const question of subject.questions) {
      const round = Object.values(rounds).find((entry) => entry.roundType === question.roundType);
      if (!round) { errors.push(`${question.id}: unknown roundType`); continue; }
      counts[question.roundType] += 1;
      seenDifficulties.add(question.difficulty);
      if (question.type !== round.type) errors.push(`${question.id}: type must be ${round.type} for ${question.roundType}`);
      if (question.points !== round.points) errors.push(`${question.id}: points must be ${round.points}`);
      if (question.timeLimit !== round.timeLimit) errors.push(`${question.id}: timeLimit must be ${round.timeLimit}`);
      if (question.marks !== 1) errors.push(`${question.id}: marks must be 1`);
      if (question.roundType === 'problem_of_day' && !['medium', 'hard'].includes(question.difficulty)) errors.push(`${question.id}: problem_of_day difficulty must be medium or hard`);
      if (question.roundType === 'speed_race' && !['easy', 'medium'].includes(question.difficulty)) errors.push(`${question.id}: speed_race difficulty must be easy or medium`);
      if (question.roundType === 'true_false') {
        if (!['easy', 'medium'].includes(question.difficulty)) errors.push(`${question.id}: true_false difficulty must be easy or medium`);
        if (!['True', 'False'].includes(question.correctAnswer)) errors.push(`${question.id}: true_false correctAnswer must be True or False`);
        if (question.options != null) errors.push(`${question.id}: true_false options must be omitted`);
      }
      if (!difficulties.has(question.difficulty)) errors.push(`${question.id}: difficulty invalid`);
      if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
    }
    for (const [roundType, expected] of Object.entries(expectedPerSubject)) {
      if (counts[roundType] !== expected) errors.push(`${subject.subjectId}: expected ${expected} ${roundType} questions, found ${counts[roundType]}`);
    }
    for (const difficulty of difficulties) {
      if (!seenDifficulties.has(difficulty)) errors.push(`${subject.subjectId}: no ${difficulty} questions in batch`);
    }
  }
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
if (duplicatePrompts.length) {
  throw new Error(`Generated content duplicates existing rows:\n${duplicatePrompts.map(({ id, source }) => `${id}: ${source}`).join('\n')}`);
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

let migrationNumber = 517;
{
  const name = `${migrationNumber}_nsmq_expansion_beta_002_foundation.sql`;
  const allTopicIds = subjects.flatMap((subject) => subject.topics.map(([, id]) => id));
  const orderedTopicRows = [...canonicalTopicRows].sort((a, b) => (a[2] == null ? 0 : 1) - (b[2] == null ? 0 : 1));
  const lines = [
    `-- ${migrationNumber}: Foundation guard for NSMQ question bank expansion beta batch 002.`,
    '-- Original BrillaPrep practice content; not official NSMQ (Primetime) material.',
    '-- Also seeds the prod-canonical per-subject NSMQ topic rows (copied from the legacy',
    '-- seed-style rows) for fresh baselines; INSERT OR IGNORE no-ops on prod where they exist.',
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
    ...orderedTopicRows.map(([id, subjectId, parentId, topicName, , description, theoryContent, keyFormulas, displayOrder]) =>
      // The slug is derived from the canonical id (e.g. 'nsmq-math-algebra') rather than
      // copied from the seed row: the legacy seed-style topics still own the human slugs
      // ('algebra', 'mechanics', ...) on fresh baselines and topics is UNIQUE(subject_id,
      // slug). On prod these rows already exist, so INSERT OR IGNORE no-ops and the slug
      // below never lands there.
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, ${sql(subjectId)}, ${sql(parentId)}, ${sql(topicName)}, ${sql(id.slice(6).replaceAll('_', '-'))}, ${sql(description)}, ${sql(theoryContent)}, ${sql(keyFormulas)}, ${displayOrder}, '2026-08-04T00:00:00.000Z');`),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_nsmq') AND (SELECT COUNT(*) FROM subjects WHERE id IN ('subj_nsmq_math', 'subj_nsmq_physics', 'subj_nsmq_chemistry', 'subj_nsmq_biology') AND exam_type_id = 'exam_nsmq') = 4 AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN (${allTopicIds.map(sql).join(', ')}) AND s.exam_type_id = 'exam_nsmq') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

// Per subject: one migration for round_one (4 questions), one for speed_race
// (4 questions) and one combining true_false (4) with problem_of_day (2) so the
// whole batch fits the allocated 517-531 migration range under the remote D1
// per-query byte limit.
for (const subject of subjects) {
  const questions = batch.subjects.find((entry) => entry.subjectId === subject.subjectId).questions;
  const partGroups = [
    { roundKeys: ['r1'], label: rounds.r1.migrationName },
    { roundKeys: ['sr'], label: rounds.sr.migrationName },
    { roundKeys: ['tf', 'pod'], label: 'true_false_problem_of_day' },
  ];
  for (const { roundKeys: keys, label } of partGroups) {
    const roundTypes = keys.map((key) => rounds[key].roundType);
    const partQuestions = questions.filter((question) => roundTypes.includes(question.roundType));
    const ids = partQuestions.map((question) => question.id);
    const guardTable = `_migration_${migrationNumber}_guard`;
    const name = `${migrationNumber}_nsmq_${subject.key}_b002_${label}.sql`;
    const lines = [
      `-- ${migrationNumber}: Original BrillaPrep NSMQ ${subject.subjectId} ${label} beta questions (batch 002).`,
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
  const name = `${migrationNumber}_nsmq_expansion_beta_002_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const allIds = batch.subjects.flatMap((entry) => entry.questions.map((question) => question.id));
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for NSMQ expansion beta batch 002.`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.exam_type_id = 'exam_nsmq' AND q.round_type IN ('problem_of_day', 'speed_race', 'round_one', 'true_false') AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 56 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.round_type = 'problem_of_day' AND q.question_type = 'problem') = 8 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.round_type = 'speed_race' AND q.question_type = 'direct_answer') = 16 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.round_type = 'round_one' AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D')) = 16 AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.round_type = 'true_false' AND q.question_type = 'true_false' AND q.options IS NULL AND q.correct_answer IN ('True','False')) = 16 AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = 56 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
