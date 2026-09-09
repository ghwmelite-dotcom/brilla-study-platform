import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Flashcard bank expansion, batch 1 (flashcards-beta-001).
// Original BrillaPrep revision cards only: fills 8 empty deck_sys_topic_* NSMQ
// shells and creates 4 new public WASSCE decks. Self-validates because the
// question batch validator (question-content-lib.mjs) does not cover
// flashcards; limits mirror workers/api/flashcard-decks.ts.

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = process.argv.includes('--output-root')
  ? resolve(process.argv[process.argv.indexOf('--output-root') + 1])
  : repoRoot;

const generatedAt = '2026-09-05T00:00:00Z';
const batchId = 'flashcards-beta-001';
const contentLabel = 'Original BrillaPrep revision flashcards aligned to Ghana’s published NaCCA curriculum and WAEC WASSCE syllabus scope; not official WAEC or NaCCA examination material.';
const provenance = [
  {
    publisher: 'National Council for Curriculum and Assessment, Ghana',
    title: 'Secondary Education Curriculum (Common Core Programme and SHS subject curricula)',
    url: 'https://nacca.gov.gh/',
    use: 'curriculum_blueprint_only',
  },
  {
    publisher: 'West African Examinations Council, Ghana',
    title: 'WASSCE for School Candidates subject catalogue and syllabus scope',
    url: 'https://waecgh.org/home/wassce-school/',
    use: 'curriculum_blueprint_only',
  },
];

// ---------------------------------------------------------------------------
// Decks. The 8 deck_sys_topic_* rows already exist in seed.sql as empty
// system shells (card_count = 0); only the 4 new WASSCE decks are inserted.
// ---------------------------------------------------------------------------
const existingShells = [
  { key: 'algebra', deckId: 'deck_sys_topic_algebra' },
  { key: 'trigonometry', deckId: 'deck_sys_topic_trigonometry' },
  { key: 'mechanics', deckId: 'deck_sys_topic_mechanics' },
  { key: 'electricity', deckId: 'deck_sys_topic_electricity' },
  { key: 'atomic', deckId: 'deck_sys_topic_atomic' },
  { key: 'stoichiometry', deckId: 'deck_sys_topic_stoichiometry' },
  { key: 'cells', deckId: 'deck_sys_topic_cells' },
  { key: 'genetics', deckId: 'deck_sys_topic_genetics' },
];

const newDecks = [
  { key: 'literature', deckId: 'deck_literature_devices', name: 'Literary Devices', description: 'Figures of speech and literary techniques for WASSCE Literature in English', subjectId: 'subj_wassce_literature' },
  { key: 'human_biology', deckId: 'deck_int_science_human_biology', name: 'Human Biology Essentials', description: 'Body systems and life processes for WASSCE Integrated Science', subjectId: 'subj_wassce_int_science' },
  { key: 'core_trig', deckId: 'deck_core_math_trigonometry', name: 'Trigonometry Essentials', description: 'Ratios, rules and angle problems for WASSCE Core Mathematics', subjectId: 'subj_wassce_core_math' },
  { key: 'governance', deckId: 'deck_social_governance', name: 'Governance & Civics', description: 'Government, rights and citizenship for WASSCE Social Studies', subjectId: 'subj_wassce_social' },
];

// card(front, back, difficulty, hint?) — hint optional, difficulty 1-5.
const card = (front, back, difficulty, hint = null) => ({ front, back, difficulty, hint });

const cardsByDeck = {
  algebra: [
    card('What is a variable in algebra?', 'A symbol (usually a letter such as x or y) that represents an unknown or changeable numerical value.', 1),
    card('What are like terms?', 'Terms that have exactly the same variable(s) raised to the same power(s); only like terms can be combined by adding or subtracting their coefficients, e.g. 3x² and 5x².', 1),
    card('Expand (a + b)².', 'a² + 2ab + b²', 1),
    card('Expand (a − b)².', 'a² − 2ab + b²', 1),
    card('Factorise a² − b².', '(a + b)(a − b) — the difference of two squares.', 2),
    card('Solve for x: ax + b = c.', 'x = (c − b)/a, provided a ≠ 0. Subtract b from both sides, then divide by a.', 1),
    card('What is a polynomial?', 'An algebraic expression consisting of variables and coefficients combined using only addition, subtraction, multiplication and non-negative integer exponents, e.g. 3x² − 2x + 5.', 2),
    card('What is the degree of a polynomial?', 'The highest power (exponent) of the variable in the polynomial; for example, 4x³ + x − 7 has degree 3.', 2),
    card('What is a function?', 'A relation that assigns exactly one output value to each input value; written f(x), where x is the input (argument).', 2),
    card('Solve: 2(x − 3) = 10.', 'x = 8. Divide both sides by 2 to get x − 3 = 5, then add 3 to both sides.', 2, 'Clear the bracket first.'),
  ],
  trigonometry: [
    card('In a right-angled triangle, how is sin θ defined?', 'sin θ = opposite / hypotenuse.', 1),
    card('In a right-angled triangle, how is cos θ defined?', 'cos θ = adjacent / hypotenuse.', 1),
    card('In a right-angled triangle, how is tan θ defined?', 'tan θ = opposite / adjacent, which equals sin θ / cos θ.', 1),
    card('State the identity linking sin θ and cos θ.', 'sin²θ + cos²θ = 1 for every angle θ (the Pythagorean identity).', 2),
    card('What is the double-angle formula for sin 2θ?', 'sin 2θ = 2 sin θ cos θ.', 3),
    card('What is the double-angle formula for cos 2θ?', 'cos 2θ = cos²θ − sin²θ, equivalently 2cos²θ − 1 or 1 − 2sin²θ.', 3),
    card('Convert 60° to radians.', 'π/3 radians, since 180° = π radians, so 60° = 60π/180 = π/3.', 2),
    card('State the sine rule for any triangle.', 'a/sin A = b/sin B = c/sin C, where side a is opposite angle A, and so on.', 3),
    card('State the cosine rule for any triangle.', 'a² = b² + c² − 2bc cos A, where side a is opposite angle A.', 3),
    card('What is the period of y = sin θ?', '360° (2π radians): the sine graph repeats one full wave every 360°.', 2),
  ],
  mechanics: [
    card('State Newton’s first law of motion.', 'A body remains at rest or continues in uniform motion in a straight line unless acted upon by a resultant external force (the law of inertia).', 2),
    card('State Newton’s second law of motion.', 'The resultant force on a body equals the rate of change of its momentum; for constant mass this reduces to F = ma.', 1),
    card('State Newton’s third law of motion.', 'For every action there is an equal and opposite reaction: the forces two bodies exert on each other are equal in magnitude and opposite in direction.', 1),
    card('In v = u + at, what does each symbol represent?', 'u = initial velocity, v = final velocity, a = constant acceleration, t = time taken. The equation gives the velocity after accelerating for time t.', 1),
    card('Which kinematic equation links displacement to initial velocity, acceleration and time?', 's = ut + ½at².', 2),
    card('Which kinematic equation does not involve time?', 'v² = u² + 2as.', 2),
    card('What is the SI unit of force?', 'The newton (N); 1 N = 1 kg·m/s², the force that gives a 1 kg mass an acceleration of 1 m/s².', 1),
    card('What is the difference between speed and velocity?', 'Speed is a scalar quantity (magnitude only); velocity is a vector quantity (magnitude and direction).', 1),
    card('Define linear momentum.', 'The product of a body’s mass and its velocity: p = mv. It is a vector with SI unit kg·m/s (equivalently N·s).', 2),
    card('What does the gradient of a velocity–time graph represent?', 'The acceleration of the body. (The area under the graph gives the displacement.)', 2, 'Gradient = rate of change.'),
  ],
  electricity: [
    card('State Ohm’s law.', 'The current through a metallic conductor is directly proportional to the potential difference across it, provided temperature and other physical conditions remain constant: V = IR.', 1),
    card('Define electric current and state its SI unit.', 'Current is the rate of flow of electric charge, I = Q/t; its SI unit is the ampere (A), where 1 A = 1 C/s.', 1),
    card('What is the SI unit of electric charge?', 'The coulomb (C); 1 C = 1 A·s, the charge passing a point when a current of 1 A flows for 1 s.', 1),
    card('Write the formula for electrical power in terms of current and voltage.', 'P = IV. Combined with Ohm’s law this also gives P = I²R and P = V²/R.', 2),
    card('What is the SI unit of resistance?', 'The ohm (Ω); 1 Ω = 1 V/A.', 1),
    card('How do resistors combine in series?', 'Their resistances add: R_total = R₁ + R₂ + R₃ + …, and the same current flows through each resistor.', 2),
    card('How do resistors combine in parallel?', 'Their reciprocals add: 1/R_total = 1/R₁ + 1/R₂ + …, so the total resistance is less than the smallest branch resistance.', 2),
    card('Define the potential difference between two points.', 'The work done (energy transferred) per unit charge in moving charge between the two points: V = W/Q, measured in volts.', 2),
    card('What is the force on a charge q placed in an electric field E?', 'F = qE, in the direction of the field for a positive charge and opposite to it for a negative charge.', 3),
    card('What is the force on a current-carrying conductor in a magnetic field?', 'F = BIL sin θ, where B is the magnetic flux density, I the current, L the conductor length and θ the angle between the conductor and the field; the force is maximum when θ = 90°.', 3),
  ],
  atomic: [
    card('Which subatomic particles make up an atom, and where is each found?', 'Protons and neutrons are packed in the tiny central nucleus; electrons occupy energy levels (shells) around the nucleus.', 1),
    card('Define the atomic number, Z.', 'The number of protons in the nucleus of an atom. It identifies the element and equals the number of electrons in a neutral atom.', 1),
    card('Define the mass number, A, and relate it to Z and N.', 'A is the total number of protons and neutrons in the nucleus: A = Z + N, where N is the number of neutrons.', 1),
    card('What are isotopes?', 'Atoms of the same element (same atomic number Z) that have different numbers of neutrons and therefore different mass numbers; they share chemical properties but differ in mass.', 2),
    card('Give the relative charge and approximate relative mass of the proton, neutron and electron.', 'Proton: charge +1, mass ≈ 1; neutron: charge 0, mass ≈ 1; electron: charge −1, mass ≈ 1/1836 (effectively negligible).', 2),
    card('What does the Aufbau principle state about electron configuration?', 'Electrons fill orbitals in order of increasing energy — 1s, 2s, 2p, 3s, 3p, 4s, 3d, … — occupying the lowest available energy level first.', 2),
    card('Write the electron configuration of sodium (Na, Z = 11).', '1s² 2s² 2p⁶ 3s¹, or in shorthand [Ne] 3s¹.', 2),
    card('What does the Bohr model say about electrons in the hydrogen atom?', 'Electrons move in fixed energy levels (shells) labelled n = 1, 2, 3, … and absorb or emit energy only when they jump between levels.', 3),
    card('What is the energy of an electron in level n of a hydrogen atom (Bohr model)?', 'E = −13.6/n² eV. The negative sign means the electron is bound to the nucleus; E approaches 0 as n → ∞, which corresponds to ionisation.', 4),
    card('State the de Broglie wavelength relation.', 'λ = h/mv = h/p: every moving particle has an associated wavelength, where h is Planck’s constant and p = mv is its momentum.', 4),
  ],
  stoichiometry: [
    card('Write the formula relating moles, mass and molar mass.', 'n = m/M: moles = mass in grams divided by molar mass in g/mol.', 1),
    card('Define one mole of a substance.', 'The amount of substance that contains as many particles (atoms, molecules or ions) as there are atoms in exactly 12 g of carbon-12 — that is, Avogadro’s number, 6.02 × 10²³ particles.', 2),
    card('Write the formula for concentration (molarity).', 'Concentration C = n/V in mol/dm³ (mol/L), where n is the moles of solute and V is the volume of solution in dm³.', 1),
    card('State the ideal gas equation and the meaning of each symbol.', 'PV = nRT, where P is pressure, V is volume, n is moles of gas, R is the gas constant (8.314 J·K⁻¹·mol⁻¹) and T is absolute temperature in kelvin.', 3),
    card('What is the percentage yield formula?', '% yield = (actual yield ÷ theoretical yield) × 100%.', 1),
    card('What is a limiting reagent?', 'The reactant that is completely used up first in a reaction; it determines the maximum amount of product that can form.', 2),
    card('Why must a chemical equation be balanced before stoichiometric calculations?', 'Balancing conserves atoms (mass), and the coefficients give the mole ratios in which species react and form — every mole calculation depends on those ratios.', 2),
    card('How many moles are there in 8 g of methane, CH₄? (C = 12, H = 1)', 'M(CH₄) = 12 + 4(1) = 16 g/mol, so n = 8/16 = 0.5 mol.', 2),
    card('What volume does one mole of any gas occupy at s.t.p.?', '22.4 dm³ (22.4 L) at standard temperature and pressure (0 °C and 1 atm).', 2),
    card('In N₂ + 3H₂ → 2NH₃, how many moles of NH₃ form from 6 mol of H₂ with N₂ in excess?', '4 mol NH₃: the mole ratio H₂ : NH₃ is 3 : 2, so 6 × (2/3) = 4.', 2, 'Use the coefficient ratio.'),
  ],
  cells: [
    card('State the cell theory.', 'All living organisms are composed of one or more cells; the cell is the basic structural and functional unit of life; all cells arise from pre-existing cells.', 2),
    card('Name three structural differences between prokaryotic and eukaryotic cells.', 'Prokaryotes have no membrane-bound nucleus (DNA lies free in a nucleoid region), no membrane-bound organelles, and are generally smaller; eukaryotes have a true nucleus and organelles such as mitochondria.', 2),
    card('What is the function of the nucleus?', 'It stores the cell’s genetic material (DNA) and controls the cell’s activities, including growth and reproduction.', 1),
    card('What is the function of mitochondria?', 'They carry out aerobic respiration, releasing energy from glucose and producing ATP, the cell’s usable energy currency.', 1),
    card('Which organelle is the site of photosynthesis in plant cells?', 'The chloroplast, which contains the green pigment chlorophyll that traps light energy.', 1),
    card('State three features found in plant cells but absent from animal cells.', 'A cellulose cell wall, chloroplasts, and a large permanent central vacuole.', 1),
    card('What is the function of the cell (plasma) membrane?', 'It is selectively (partially) permeable: it controls which substances enter and leave the cell.', 1),
    card('What is the role of ribosomes?', 'They are the sites of protein synthesis, translating messenger RNA into polypeptide chains.', 1),
    card('Distinguish between rough and smooth endoplasmic reticulum.', 'Rough ER is studded with ribosomes and processes newly made proteins; smooth ER lacks ribosomes and is involved in lipid synthesis and detoxification.', 3),
    card('What is the function of the Golgi apparatus?', 'It modifies, sorts and packages proteins and lipids received from the endoplasmic reticulum into vesicles for secretion or delivery within the cell.', 2),
  ],
  genetics: [
    card('Define a gene.', 'A section of DNA that codes for a particular protein (polypeptide) and so influences a specific heritable characteristic.', 1),
    card('What is an allele?', 'One of the alternative forms of a gene, found at the same locus (position) on homologous chromosomes — for example, the alleles for tallness and dwarfness in pea plants.', 2),
    card('Distinguish between genotype and phenotype.', 'Genotype is the genetic makeup of an organism (the alleles it carries); phenotype is the observable characteristic produced by the genotype interacting with the environment.', 2),
    card('Distinguish between homozygous and heterozygous.', 'Homozygous means both alleles of a gene are identical (e.g. TT or tt); heterozygous means the two alleles are different (e.g. Tt).', 1),
    card('State Mendel’s law of segregation.', 'The two alleles of a gene separate (segregate) during gamete formation, so that each gamete carries only one allele of each gene.', 3),
    card('State Mendel’s law of independent assortment.', 'Alleles of different genes are distributed to gametes independently of one another, provided the genes are located on different (non-homologous) chromosomes.', 3),
    card('In DNA, which bases pair together, and how are they held?', 'Adenine pairs with thymine (two hydrogen bonds) and guanine pairs with cytosine (three hydrogen bonds) — complementary base pairing.', 2),
    card('A heterozygous tall pea plant (Tt) is crossed with a dwarf plant (tt). What offspring ratio is expected?', '1 tall : 1 dwarf — half the offspring are Tt (tall) and half are tt (dwarf), as shown by a Punnett square for this test cross.', 3, 'Draw the Punnett square.'),
    card('What is a mutation?', 'A sudden, heritable change in the structure or amount of DNA; gene mutations alter the base sequence, while chromosome mutations change chromosome structure or number.', 2),
    card('What determines the sex of a child in humans?', 'The sex chromosomes: females are XX and males are XY. Eggs always carry X, so the sperm (carrying X or Y) determines whether the zygote is female or male.', 2),
  ],
  literature: [
    card('What is a metaphor?', 'A direct comparison that states one thing IS another, without using “like” or “as”: “He is a lion in battle.”', 1),
    card('What is a simile?', 'A comparison between two unlike things using “like” or “as”: “Her voice is as sweet as honey.”', 1),
    card('What is personification?', 'Giving human qualities, feelings or actions to non-human things or abstract ideas: “The wind whispered through the trees.”', 1),
    card('What is alliteration?', 'The repetition of the same initial consonant sound in closely placed words: “Peter Piper picked a peck of pickled peppers.”', 1),
    card('What is onomatopoeia?', 'A word whose sound imitates the thing it names, such as “buzz”, “hiss” or “bang”.', 1),
    card('What is hyperbole?', 'Deliberate exaggeration used for emphasis or effect and not meant literally: “I have told you a million times.”', 1),
    card('What is symbolism?', 'Using an object, person, place or action to represent a deeper abstract idea beyond its literal meaning — for example, a dove symbolising peace.', 2),
    card('What is an oxymoron?', 'A figure of speech that joins two contradictory terms in one expression, such as “bittersweet” or “deafening silence”.', 2),
    card('What is a soliloquy?', 'A speech in drama in which a character, alone on stage, speaks their inner thoughts aloud, revealing feelings and motives directly to the audience.', 2),
    card('What are the three types of irony?', 'Verbal irony — saying the opposite of what is meant; situational irony — events turning out contrary to expectation; dramatic irony — the audience knowing more than the characters.', 3),
  ],
  human_biology: [
    card('What are the main functions of the human skeleton?', 'Support of the body, protection of delicate organs (the skull protects the brain), movement together with muscles, production of blood cells in the bone marrow, and storage of minerals such as calcium.', 2),
    card('Name the four main components of blood and one function of each.', 'Red blood cells transport oxygen; white blood cells defend the body against infection; platelets are responsible for blood clotting; plasma carries nutrients, hormones and waste products.', 2),
    card('Describe the double circulation of blood in humans.', 'The right side of the heart pumps deoxygenated blood to the lungs (pulmonary circulation); oxygenated blood returns to the left side, which pumps it around the body (systemic circulation) before it returns to the right side.', 3),
    card('What is the function of the alveoli in the lungs?', 'They are the site of gas exchange: oxygen diffuses into the blood and carbon dioxide diffuses out. Their large surface area, thin walls and rich capillary network make diffusion fast.', 2),
    card('Where does the digestion of carbohydrates, proteins and fats each begin?', 'Carbohydrates in the mouth (salivary amylase); proteins in the stomach (pepsin, in acid conditions); fats in the small intestine (bile emulsifies them, then pancreatic lipase digests them).', 3),
    card('What is the role of the kidneys?', 'They filter the blood to remove urea, excess salts and excess water (excretion) and they regulate the body’s water and salt balance (osmoregulation).', 2),
    card('Distinguish between arteries and veins.', 'Arteries carry blood away from the heart under high pressure and have thick, elastic, muscular walls; veins carry blood towards the heart under low pressure and have thinner walls with valves that prevent backflow.', 2),
    card('What is homeostasis? Give one example.', 'The maintenance of a constant internal environment despite external changes — for example, the regulation of blood glucose by insulin, or temperature control through sweating and shivering.', 2),
    card('What are the roles of sensory and motor neurones?', 'Sensory neurones carry impulses from receptors to the central nervous system; motor neurones carry impulses from the central nervous system to effectors (muscles and glands).', 3),
    card('Name the main classes of food nutrients and the role of each.', 'Carbohydrates supply energy; proteins are for growth and repair; fats provide concentrated energy and insulation; vitamins and minerals perform protective and regulatory roles; water is the transport medium, and roughage (fibre) keeps digestion healthy.', 2),
  ],
  core_trig: [
    card('State the three primary trigonometric ratios for a right-angled triangle.', 'sin θ = opposite/hypotenuse, cos θ = adjacent/hypotenuse, tan θ = opposite/adjacent (remembered as SOH CAH TOA).', 1),
    card('What is the exact value of sin 30°?', '½', 1),
    card('What is the exact value of cos 60°?', '½', 1),
    card('What is the exact value of tan 45°?', '1', 1),
    card('When do you use the sine rule, and what does it state?', 'a/sin A = b/sin B = c/sin C. Use it when a matching side–angle pair is known, for any triangle (not only right-angled ones).', 2),
    card('When do you use the cosine rule, and what does it state?', 'a² = b² + c² − 2bc cos A. Use it when two sides and the included angle are known, or when all three sides are known.', 2),
    card('Write the formula for the area of a triangle given two sides and the included angle.', 'Area = ½ab sin C, where C is the angle between sides a and b.', 2),
    card('Define the angle of elevation.', 'The angle measured upward from the horizontal to the line of sight of an object above the observer.', 1),
    card('Define the angle of depression.', 'The angle measured downward from the horizontal to the line of sight of an object below the observer; it equals the angle of elevation from the object back to the observer (alternate angles).', 2),
    card('A 10 m ladder leans against a wall and reaches 8 m up the wall. What angle does it make with the ground?', 'sin θ = 8/10 = 0.8, so θ = sin⁻¹(0.8) ≈ 53.1°.', 3, 'Which ratio links opposite and hypotenuse?'),
  ],
  governance: [
    card('What is democracy?', 'A system of government in which political power belongs to the people, who exercise it directly or through freely elected representatives chosen in periodic elections.', 1),
    card('Name the three arms of government in Ghana and the role of each.', 'The Legislature (Parliament) makes laws; the Executive (the President and ministers) implements laws and runs the state; the Judiciary interprets the laws and administers justice.', 1),
    card('What is the Constitution?', 'The supreme law of the land, which sets out the structure of government, the powers of state institutions and the fundamental rights of citizens; every other law must conform to it.', 1),
    card('What is the rule of law?', 'The principle that everyone — citizens and leaders alike — is subject to and equal before the law, and that power is exercised according to known laws rather than arbitrary decisions.', 2),
    card('What is the separation of powers?', 'The division of government power among the executive, legislature and judiciary so that no single arm becomes all-powerful; each arm checks the others (checks and balances).', 2),
    card('List three fundamental human rights guaranteed to Ghanaians.', 'Any three of: the right to life; personal liberty; freedom of speech and expression; freedom of association and assembly; equality before the law; freedom from discrimination.', 1),
    card('List three responsibilities of a good citizen.', 'Any three of: obeying the laws of the land; paying taxes; voting in elections; protecting public property; taking part in community development; defending the country when called upon.', 1),
    card('What makes an election free and fair?', 'Universal adult suffrage, a secret ballot, equal access for candidates, independent administration by the Electoral Commission, and transparent counting and declaration of results.', 2),
    card('What is decentralisation in Ghana’s system of governance?', 'The transfer of power, functions and resources from central government to local assemblies — the Metropolitan, Municipal and District Assemblies — so that decisions are taken closer to the people.', 2),
    card('What is the role of the Electoral Commission of Ghana?', 'It is the independent body responsible for conducting and supervising all public elections and referenda, compiling the voters’ register, and declaring results.', 2),
  ],
};

// ---------------------------------------------------------------------------
// Self-validation (mirrors workers/api/flashcard-decks.ts field caps).
// ---------------------------------------------------------------------------
const FRONT_MAX = 1000;
const BACK_MAX = 2000;
const HINT_MAX = 500;

const normalize = (value) => value.trim().toLowerCase();

function existingSeedFronts(seedSql) {
  const section = seedSql.match(/INSERT INTO "flashcards"[\s\S]*?ON CONFLICT\(id\) DO NOTHING;/);
  if (!section) throw new Error('Could not locate FLASHCARDS insert in database/seed.sql');
  const fronts = [];
  for (const line of section[0].split('\n')) {
    if (!line.trimStart().startsWith("('fc_")) continue;
    const fields = [...line.matchAll(/'((?:[^']|'')*)'/g)].map((match) => match[1].replaceAll("''", "'"));
    fronts.push(fields[2]); // (id, deck_id, front, ...)
  }
  if (fronts.length !== 40) throw new Error(`Expected 40 seeded flashcard fronts, parsed ${fronts.length}`);
  return fronts;
}

function validate() {
  const errors = [];
  const seedSqlPath = resolve(repoRoot, 'database/seed.sql');
  const decks = [...existingShells, ...newDecks];
  const deckKeys = new Set(decks.map((deck) => deck.key));
  const seenFronts = new Map();
  let total = 0;

  for (const deck of decks) {
    const cards = cardsByDeck[deck.key];
    if (!deckKeys.has(deck.key) || !cards) errors.push(`Missing cards for deck ${deck.key}`);
    if (cards.length !== 10) errors.push(`Deck ${deck.deckId} has ${cards.length} cards, expected 10`);
    cards.forEach((item, index) => {
      total += 1;
      const where = `${deck.deckId} card ${index + 1}`;
      if (typeof item.front !== 'string' || item.front.trim().length === 0) errors.push(`${where}: front is required`);
      else if (item.front.length > FRONT_MAX) errors.push(`${where}: front exceeds ${FRONT_MAX} chars (${item.front.length})`);
      if (typeof item.back !== 'string' || item.back.trim().length === 0) errors.push(`${where}: back is required`);
      else if (item.back.length > BACK_MAX) errors.push(`${where}: back exceeds ${BACK_MAX} chars (${item.back.length})`);
      if (item.hint !== null && (typeof item.hint !== 'string' || item.hint.length > HINT_MAX || item.hint.trim().length === 0)) {
        errors.push(`${where}: hint must be a non-empty string of at most ${HINT_MAX} chars`);
      }
      if (!Number.isInteger(item.difficulty) || item.difficulty < 1 || item.difficulty > 5) {
        errors.push(`${where}: difficulty must be an integer 1-5, got ${item.difficulty}`);
      }
      const key = normalize(item.front);
      if (seenFronts.has(key)) errors.push(`${where}: duplicate front within batch (also in ${seenFronts.get(key)})`);
      seenFronts.set(key, where);
    });
  }
  if (total !== 120) errors.push(`Expected 120 cards in total, found ${total}`);

  return readFile(seedSqlPath, 'utf8').then((seedSql) => {
    const seeded = new Set(existingSeedFronts(seedSql).map(normalize));
    for (const [front, where] of seenFronts) {
      if (seeded.has(front)) errors.push(`${where}: front duplicates an existing seeded card: "${front}"`);
    }
    return errors;
  });
}

// ---------------------------------------------------------------------------
// Emission.
// ---------------------------------------------------------------------------
const sql = (value) => (value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`);

const decks = [...existingShells, ...newDecks];
const allCards = decks.flatMap((deck) => cardsByDeck[deck.key].map((item, index) => ({
  id: `fc_b001_${deck.key}_${String(index + 1).padStart(2, '0')}`,
  deckId: deck.deckId,
  front: item.front,
  back: item.back,
  hint: item.hint,
  difficulty: item.difficulty,
})));

const cardInsert = (item) => `INSERT OR IGNORE INTO flashcards (id, deck_id, front, back, image_url, hint, difficulty) VALUES (${sql(item.id)}, ${sql(item.deckId)}, ${sql(item.front)}, ${sql(item.back)}, NULL, ${sql(item.hint)}, ${item.difficulty});`;

const errors = await validate();
if (errors.length > 0) throw new Error(`Generated batch failed self-validation:\n${errors.join('\n')}`);

const batch = {
  batchId,
  status: 'automated_beta',
  generatedAt,
  provenance,
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
  decks: decks.map((deck) => ({
    deckId: deck.deckId,
    isNewDeck: !existingShells.some((shell) => shell.deckId === deck.deckId),
    ...(deck.subjectId ? { subjectId: deck.subjectId, name: deck.name, description: deck.description } : {}),
    cards: cardsByDeck[deck.key].map((item, index) => ({
      id: `fc_b001_${deck.key}_${String(index + 1).padStart(2, '0')}`,
      front: item.front,
      back: item.back,
      hint: item.hint,
      difficulty: item.difficulty,
    })),
  })),
};

const migrationFiles = [];

const deckMigration = [
  '-- 380: Four new public WASSCE flashcard decks (flashcards-beta-001).',
  '-- Original BrillaPrep revision content; not official WAEC or NaCCA material.',
  '-- The 8 deck_sys_topic_* shells already exist in seed.sql; this inserts only new decks.',
  'PRAGMA foreign_keys = ON;',
  ...newDecks.map((deck) => `INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES (${sql(deck.deckId)}, NULL, ${sql(deck.name)}, ${sql(deck.description)}, ${sql(deck.subjectId)}, NULL, 1, 0);`),
];
migrationFiles.push(['380_flashcards_beta_decks.sql', deckMigration]);

const CARDS_PER_PART = 24;
const partCount = Math.ceil(allCards.length / CARDS_PER_PART);
for (let part = 0; part < partCount; part += 1) {
  const number = 381 + part;
  const slice = allCards.slice(part * CARDS_PER_PART, (part + 1) * CARDS_PER_PART);
  migrationFiles.push([`${number}_flashcards_beta_part_${part + 1}.sql`, [
    `-- ${number}: Original BrillaPrep flashcards, batch flashcards-beta-001, part ${part + 1} of ${partCount}.`,
    '-- Curriculum-aligned revision content; not official WAEC or NaCCA examination material.',
    'PRAGMA foreign_keys = ON;',
    ...slice.map(cardInsert),
  ]]);
}

const finalNumber = 381 + partCount;
const deckIds = decks.map((deck) => deck.deckId);
const guardName = `_migration_${finalNumber}_guard`;
migrationFiles.push([`${finalNumber}_flashcards_beta_counts_guard.sql`, [
  `-- ${finalNumber}: Recompute card_count from actual rows and guard batch flashcards-beta-001.`,
  '-- card_count is maintained app-side on card add/delete (no trigger), so the seed-written',
  '-- static values are reconciled here against the actual card rows.',
  'PRAGMA foreign_keys = ON;',
  `UPDATE flashcard_decks SET card_count = (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = flashcard_decks.id), updated_at = datetime('now') WHERE id IN (${deckIds.map(sql).join(', ')});`,
  `CREATE TABLE IF NOT EXISTS ${guardName} (valid INTEGER NOT NULL CHECK (valid = 1));`,
  `DELETE FROM ${guardName};`,
  `INSERT INTO ${guardName}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM flashcards WHERE id LIKE 'fc_b001_%') = ${allCards.length} AND (SELECT COUNT(*) FROM flashcard_decks d WHERE d.id IN (${deckIds.map(sql).join(', ')}) AND d.card_count = 10 AND (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id) = 10) = ${deckIds.length} THEN 1 ELSE 0 END;`,
  `DROP TABLE ${guardName};`,
]]);

await mkdir(resolve(outputRoot, 'content/batches'), { recursive: true });
await mkdir(resolve(outputRoot, 'database/migrations'), { recursive: true });
const outBatch = resolve(outputRoot, `content/batches/${batchId}.json`);
await writeFile(outBatch, `${JSON.stringify(batch, null, 2)}\n`);

const written = [];
for (const [name, lines] of migrationFiles) {
  const content = `${lines.join('\n')}\n`;
  const crlfBytes = Buffer.byteLength(content.replace(/\n/g, '\r\n'), 'utf8');
  if (crlfBytes > 19_000) throw new Error(`Migration ${name} would exceed the remote D1 query limit (${crlfBytes} bytes with CRLF)`);
  const path = resolve(outputRoot, 'database/migrations', name);
  await writeFile(path, content);
  written.push(path);
}

console.log(JSON.stringify({
  batchId,
  cards: allCards.length,
  decks: deckIds,
  newDecks: newDecks.map((deck) => deck.deckId),
  outBatch,
  migrations: written,
}, null, 2));
