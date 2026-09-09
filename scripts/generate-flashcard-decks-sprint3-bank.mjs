import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Flashcard deck fill, content sprint 3 (flashcard-decks-sprint3-001).
// Original BrillaPrep revision cards only: fills the 5 remaining empty public
// deck_sys_topic_* shells confirmed empty in prod (card_count = 0):
// biochemistry (subj_wassce_biology), calculus (subj_wassce_core_math),
// electrochemistry and equilibrium (subj_wassce_chemistry) and
// thermodynamics (subj_wassce_physics). No new decks are created; a foundation
// migration re-asserts the 5 shell rows with INSERT OR IGNORE using the
// prod-canonical ids/names (no-op on prod and on fresh baselines from seed.sql).
// Self-validates because the question batch validator (question-content-lib.mjs)
// does not cover flashcards; limits mirror workers/api/flashcard-decks.ts.
// Duplicate-front rejection covers seed.sql, flashcards-beta-001 and
// flashcards-beta-002.

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = process.argv.includes('--output-root')
  ? resolve(process.argv[process.argv.indexOf('--output-root') + 1])
  : repoRoot;

const generatedAt = '2026-09-10T00:00:00Z';
const batchId = 'flashcard-decks-sprint3-001';
const contentLabel = 'Original BrillaPrep revision flashcards aligned to Ghana’s published NaCCA curriculum and the WAEC/WASSCE syllabus scope; not official WAEC or NaCCA material. Use the enabled feedback channel to report corrections.';
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
// Decks. All 5 deck_sys_topic_* rows exist in prod as empty public shells
// (verified read-only: card_count = 0, subject ids below are the prod values;
// the older seed.sql copies carry nsmq subject ids). This batch inserts only
// cards. Batch-1 shells (algebra, trigonometry, mechanics, electricity, atomic,
// stoichiometry, cells, genetics) and batch-2 shells (geometry, quadratic,
// statistics, kinematics, waves, modern_physics, bonding, organic, ecology,
// physiology) are excluded.
// ---------------------------------------------------------------------------
const existingShells = [
  {
    key: 'biochemistry',
    deckId: 'deck_sys_topic_biochemistry',
    name: 'Biochemistry - Key Concepts',
    description: 'Important formulas and concepts for Biochemistry',
    subjectId: 'subj_wassce_biology',
    topicId: 'topic_biochemistry',
  },
  {
    key: 'calculus',
    deckId: 'deck_sys_topic_calculus',
    name: 'Calculus - Key Concepts',
    description: 'Important formulas and concepts for Calculus',
    subjectId: 'subj_wassce_core_math',
    topicId: 'topic_calculus',
  },
  {
    key: 'electrochemistry',
    deckId: 'deck_sys_topic_electrochemistry',
    name: 'Electrochemistry - Key Concepts',
    description: 'Important formulas and concepts for Electrochemistry',
    subjectId: 'subj_wassce_chemistry',
    topicId: 'topic_electrochemistry',
  },
  {
    key: 'equilibrium',
    deckId: 'deck_sys_topic_equilibrium',
    name: 'Chemical Equilibrium - Key Concepts',
    description: 'Important formulas and concepts for Chemical Equilibrium',
    subjectId: 'subj_wassce_chemistry',
    topicId: 'topic_equilibrium',
  },
  {
    key: 'thermodynamics',
    deckId: 'deck_sys_topic_thermodynamics',
    name: 'Thermodynamics - Key Concepts',
    description: 'Important formulas and concepts for Thermodynamics',
    subjectId: 'subj_wassce_physics',
    topicId: 'topic_thermodynamics',
  },
];

// card(front, back, difficulty, hint?) — hint optional, difficulty 1-5.
const card = (front, back, difficulty, hint = null) => ({ front, back, difficulty, hint });

const cardsByDeck = {
  biochemistry: [
    card('Name the three main classes of carbohydrates and give one example of each.', 'Monosaccharides (e.g. glucose), disaccharides (e.g. sucrose and maltose) and polysaccharides (e.g. starch, glycogen and cellulose).', 1),
    card('Describe the iodine test for starch and state the positive result.', 'Add a few drops of brown iodine solution to the sample; if starch is present the colour changes from yellow-brown to blue-black.', 1),
    card('Describe the Benedict’s test for a reducing sugar and state the positive result.', 'Heat the solution with blue Benedict’s solution; a reducing sugar reduces the copper(II) ions to copper(I) oxide, giving a brick-red precipitate (through green and orange as the sugar concentration rises).', 2),
    card('What are the monomers of proteins, and what bond joins them?', 'Amino acids, joined by peptide bonds in condensation reactions to form polypeptide chains.', 1),
    card('Describe the Biuret test for protein and state the positive result.', 'Add sodium hydroxide solution, then a few drops of dilute copper(II) sulphate solution; a purple (violet) colour indicates that protein is present.', 2),
    card('What type of reaction builds biological polymers from monomers, and what small molecule is eliminated?', 'Condensation: each new bond formed between monomers eliminates one molecule of water. The reverse process, hydrolysis, adds water to break polymers back into monomers.', 2),
    card('What is an enzyme, and what is it made of?', 'A biological catalyst that speeds up metabolic reactions without being used up or changed; enzymes are proteins folded into a specific three-dimensional shape with an active site.', 1),
    card('Explain enzyme specificity using the lock-and-key model.', 'Only a substrate whose shape is complementary to the enzyme’s active site can bind and react, just as only the correct key fits a lock; this is why each enzyme catalyses one reaction or a small group of related reactions.', 3),
    card('Name four factors that affect the rate of an enzyme-catalysed reaction.', 'Temperature, pH, substrate concentration and enzyme concentration. (Where present, inhibitors also reduce the rate.)', 2),
    card('What happens to most enzymes well above their optimum temperature, and why?', 'They are denatured: the bonds holding the protein’s shape break, the active site changes shape and the substrate can no longer bind, so the rate falls sharply. Denaturation is usually permanent, unlike the temporary slowing at low temperature.', 2),
    card('Describe the emulsion test for lipids and state the positive result.', 'Dissolve the sample in ethanol, then pour the ethanol solution into water; a cloudy white emulsion forms if lipid is present. (Sudan III stain, which colours lipids red, is an alternative test.)', 2),
    card('Write the word equation for the hydrolysis of maltose and name the bond broken.', 'Maltose + water → glucose + glucose. Hydrolysis adds a water molecule to break the glycosidic bond linking the two glucose units of the disaccharide.', 3),
  ],
  calculus: [
    card('What does the derivative dy/dx of a function represent?', 'The rate of change of y with respect to x; geometrically, the gradient of the tangent to the curve y = f(x) at each point.', 1),
    card('State the power rule for differentiating xⁿ with respect to x.', 'd/dx(xⁿ) = nxⁿ⁻¹: multiply by the power and reduce the power by one.', 1),
    card('Differentiate y = 3x² + 5x − 7 with respect to x.', 'dy/dx = 6x + 5. Differentiate term by term: 3x² → 6x, 5x → 5, and the constant −7 → 0.', 1),
    card('What is the derivative of a constant, and why?', 'Zero. A constant does not change as x changes, so its rate of change is 0; graphically its graph is a horizontal line with gradient 0.', 1),
    card('Write the definition of the derivative f′(x) from first principles.', 'f′(x) = lim(h→0) [f(x + h) − f(x)]/h — the limiting value of the gradient of the chord as the step h shrinks to zero.', 4),
    card('How do you locate the stationary (turning) points of y = f(x)?', 'Solve dy/dx = 0 to find the x-values where the gradient is zero, then substitute back into the original equation for the corresponding y-values.', 2),
    card('How does the sign of the second derivative classify a stationary point?', 'If d²y/dx² > 0 at the stationary point it is a minimum; if d²y/dx² < 0 it is a maximum; if d²y/dx² = 0 the test is inconclusive (the point may be a point of inflexion).', 3),
    card('State the power rule for integration, ∫xⁿ dx where n ≠ −1.', 'xⁿ⁺¹/(n + 1) + c: increase the power by one, divide by the new power, and add the constant of integration.', 2),
    card('Why does an indefinite integral include the constant of integration c?', 'Because differentiation destroys constants: infinitely many functions differing only by a constant share the same derivative, so the reverse operation must allow for any constant.', 2),
    card('What does the definite integral ∫ₐᵇ f(x) dx represent when f(x) ≥ 0?', 'The area enclosed between the curve y = f(x), the x-axis and the vertical lines x = a and x = b.', 3),
    card('Evaluate ∫₀² 3x² dx.', '[x³]₀² = 2³ − 0³ = 8 − 0 = 8. Integrate 3x² to x³, substitute the upper and lower limits and subtract.', 2),
    card('A particle moves with displacement s = 2t³ − 9t² + 12t metres. What is its velocity at t = 1 s?', 'v = ds/dt = 6t² − 18t + 12; at t = 1, v = 6 − 18 + 12 = 0 m/s — the particle is momentarily at rest.', 3, 'Velocity is the derivative of displacement with respect to time.'),
  ],
  electrochemistry: [
    card('What is electrolysis?', 'The decomposition of an electrolyte — a molten or aqueous ionic compound — by passing a direct electric current through it.', 1),
    card('What is an electrolyte? Give two examples.', 'A substance which, when molten or dissolved in water, conducts electricity and is decomposed by it — e.g. sodium chloride solution and dilute sulphuric acid. (Metals such as copper conduct but are not electrolytes, because they are not decomposed.)', 1),
    card('In electrolysis, which electrode is the anode, and which ions migrate to it?', 'The anode is the positive electrode; negatively charged anions migrate to it and are discharged there. The cathode is the negative electrode and attracts the positively charged cations.', 2),
    card('State what happens at each electrode during electrolysis in terms of oxidation and reduction.', 'Oxidation (loss of electrons) occurs at the anode, where anions discharge; reduction (gain of electrons) occurs at the cathode, where cations discharge. Memory aid: OIL RIG — Oxidation Is Loss, Reduction Is Gain.', 2),
    card('Name the products of the electrolysis of molten sodium chloride, with the half-equations.', 'Sodium metal at the cathode: Na⁺ + e⁻ → Na; chlorine gas at the anode: 2Cl⁻ → Cl₂ + 2e⁻.', 2),
    card('Name the products of the electrolysis of concentrated sodium chloride solution (brine) using inert electrodes.', 'Hydrogen at the cathode, chlorine at the anode, and sodium hydroxide left in solution — the basis of the chlor-alkali industry.', 3),
    card('State Faraday’s first law of electrolysis.', 'The mass of a substance discharged (deposited or liberated) at an electrode is directly proportional to the quantity of electricity passed: m ∝ Q, where Q = It.', 3),
    card('What quantity of electricity deposits one mole of a singly charged ion such as Ag⁺?', 'One faraday, 96,500 coulombs — the charge on one mole of electrons. A doubly charged ion such as Cu²⁺ needs two faradays (2 × 96,500 C) per mole deposited.', 3),
    card('Describe the set-up for electroplating an iron spoon with silver.', 'The spoon is made the cathode, a rod of pure silver the anode, and a solution of a silver salt (e.g. silver nitrate) the electrolyte; silver dissolves from the anode and deposits in an even layer on the spoon.', 2),
    card('How is impure copper purified by electrolysis?', 'The impure copper is made the anode, a thin sheet of pure copper the cathode, and copper(II) sulphate solution the electrolyte; copper dissolves from the anode and deposits on the cathode, while less reactive impurities fall as anode mud.', 3),
    card('How is aluminium extracted from its oxide, and why must electrolysis be used?', 'Aluminium is too reactive for carbon reduction, so aluminium oxide is dissolved in molten cryolite (to lower the working temperature) and electrolysed: aluminium forms at the carbon cathode and oxygen at the carbon anodes, which burn away.', 3),
    card('State three factors that determine which ion is preferentially discharged at an electrode.', 'The position of the ion in the electrochemical (discharge) series, the relative concentration of the ions in solution, and the nature of the electrodes (inert or active).', 3),
  ],
  equilibrium: [
    card('What is a reversible reaction? Give one example.', 'A reaction in which the products can react to re-form the reactants, so the reaction proceeds in both directions — e.g. N₂ + 3H₂ ⇌ 2NH₃ in the Haber process.', 1),
    card('Define dynamic equilibrium in a chemical system.', 'The state reached in a closed system when the forward and reverse reactions occur at equal rates, so the concentrations of reactants and products remain constant even though both reactions continue.', 2),
    card('Why must a system be closed for a chemical equilibrium to be established?', 'So that no reactant or product can escape or be added; in an open system the loss of a product (for example a gas) drives the forward reaction towards completion instead of a balance.', 2),
    card('State Le Chatelier’s principle.', 'If a constraint — a change of concentration, pressure or temperature — is imposed on a system at equilibrium, the system adjusts itself so as to annul (oppose) the constraint.', 2),
    card('Predict the effect of adding more reactant to a system at equilibrium.', 'The equilibrium shifts to the right (towards the products), consuming part of the added reactant until a new equilibrium position is established.', 2),
    card('For N₂(g) + 3H₂(g) ⇌ 2NH₃(g), what is the effect of increasing the pressure?', 'The equilibrium shifts to the right: the side with fewer gas molecules (2 mol of NH₃ against 4 mol of reactants) is favoured, which reduces the pressure.', 3),
    card('For an exothermic reaction at equilibrium, what is the effect of raising the temperature?', 'The equilibrium shifts to the left (towards the reactants): the system favours the reverse, endothermic direction to absorb the added heat, so the yield of product falls.', 3),
    card('What is the effect of a catalyst on a system at equilibrium?', 'No shift in position: a catalyst speeds up the forward and reverse reactions equally, so equilibrium is reached faster but the equilibrium composition is unchanged.', 2),
    card('State the industrial conditions used in the Haber process for manufacturing ammonia.', 'A temperature of about 450 °C (a compromise between rate and yield), a high pressure of about 200 atm, an iron catalyst, and nitrogen and hydrogen in a 1 : 3 ratio; the ammonia formed is liquefied and removed.', 3),
    card('Write the expression for the equilibrium constant Kc for aA + bB ⇌ cC + dD.', 'Kc = [C]ᶜ[D]ᵈ / [A]ᵃ[B]ᵇ, where the square brackets denote equilibrium concentrations in mol/dm³ and the powers are the balancing numbers of the equation.', 3),
    card('What does the magnitude of Kc tell you about an equilibrium?', 'A large Kc (≫ 1) means products predominate — the equilibrium lies well to the right; a small Kc (≪ 1) means reactants predominate — it lies to the left. Kc changes only with temperature.', 3),
    card('List three observable characteristics of a system at dynamic equilibrium.', 'The concentrations of all species remain constant; the rates of the forward and reverse reactions are equal; and macroscopic properties such as colour, pressure and density are constant, even though molecular activity continues.', 2),
  ],
  thermodynamics: [
    card('Distinguish between heat and temperature.', 'Heat is the thermal energy transferred from a hotter body to a colder one, measured in joules; temperature is the degree of hotness — a measure of the average kinetic energy of the particles — measured in kelvin or degrees Celsius.', 1),
    card('Define the specific heat capacity of a substance and write the heat equation that uses it.', 'The heat energy required to raise the temperature of 1 kg of the substance by 1 °C (1 K). The heat equation is Q = mcΔθ, where m is the mass and Δθ the temperature change.', 2),
    card('State the SI unit of specific heat capacity, and give the value for water.', 'Joules per kilogram per kelvin, J/(kg·K) (equivalently J/(kg·°C)); for water c ≈ 4200 J/(kg·°C) — an unusually high value, which is why water heats up and cools down slowly.', 2),
    card('Define the specific latent heat of fusion.', 'The heat energy required to change 1 kg of a substance from solid to liquid at its melting point, without any change of temperature. The heat involved is Q = ml, where l is the specific latent heat.', 2),
    card('Why does the temperature of a pure substance stay constant while it is melting or boiling?', 'The heat supplied is used to break the bonds between particles — increasing their potential energy — rather than to raise their average kinetic energy, which determines temperature. This hidden heat is the latent heat.', 3),
    card('Which is larger for a given substance, the specific latent heat of vaporisation or of fusion, and why?', 'The latent heat of vaporisation is larger, because separating the molecules completely into the gas phase takes far more energy than merely loosening them into the liquid state (for water, about 2.26 × 10⁶ J/kg against 3.34 × 10⁵ J/kg).', 3),
    card('Describe conduction of heat, and name a good conductor and a poor conductor.', 'Heat transfer through a material without any movement of the material itself, by the vibration of particles and — in metals — the movement of free electrons; copper is a good conductor, wood (or air) a poor conductor (an insulator).', 2),
    card('Explain convection and state where it can occur.', 'Heat transfer by the bulk movement of a fluid: heated fluid expands, becomes less dense and rises, while cooler, denser fluid sinks to replace it, setting up a convection current. It occurs only in liquids and gases.', 2),
    card('What is thermal radiation, and which surfaces emit and absorb it best?', 'Heat transfer by infra-red electromagnetic waves, which needs no medium and can cross a vacuum; dull black surfaces are the best emitters and absorbers, while shiny silvery surfaces are the poorest.', 2),
    card('Distinguish between evaporation and boiling.', 'Evaporation occurs at all temperatures, only at the liquid surface, and causes cooling; boiling occurs throughout the liquid at one fixed temperature — the boiling point — when the vapour pressure equals the external pressure.', 3),
    card('Calculate the heat needed to raise the temperature of 2 kg of water by 15 °C. (c = 4200 J/(kg·°C))', 'Q = mcΔθ = 2 × 4200 × 15 = 126,000 J = 126 kJ.', 2, 'Use Q = mcΔθ: mass × specific heat capacity × temperature rise.'),
    card('Calculate the heat released when 0.5 kg of steam at 100 °C condenses to water at the same temperature. (l = 2.26 × 10⁶ J/kg)', 'Q = ml = 0.5 × 2.26 × 10⁶ = 1.13 × 10⁶ J = 1.13 MJ.', 3, 'Latent heat only: Q = ml; the temperature does not change.'),
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

function existingBatchFronts(batchJson, expectedBatchId) {
  const batch = JSON.parse(batchJson);
  if (batch.batchId !== expectedBatchId) throw new Error(`Unexpected batchId in ${expectedBatchId}.json`);
  return batch.decks.flatMap((deck) => deck.cards.map((item) => item.front));
}

function validate() {
  const errors = [];
  const decks = existingShells;
  const seenFronts = new Map();
  let total = 0;

  for (const deck of decks) {
    const cards = cardsByDeck[deck.key];
    if (!cards) errors.push(`Missing cards for deck ${deck.key}`);
    if (cards.length !== 12) errors.push(`Deck ${deck.deckId} has ${cards.length} cards, expected 12`);
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
  if (total !== 60) errors.push(`Expected 60 cards in total, found ${total}`);

  return Promise.all([
    readFile(resolve(repoRoot, 'database/seed.sql'), 'utf8'),
    readFile(resolve(repoRoot, 'content/batches/flashcards-beta-001.json'), 'utf8'),
    readFile(resolve(repoRoot, 'content/batches/flashcards-beta-002.json'), 'utf8'),
  ]).then(([seedSql, batch1Json, batch2Json]) => {
    const prior = new Set([
      ...existingSeedFronts(seedSql),
      ...existingBatchFronts(batch1Json, 'flashcards-beta-001'),
      ...existingBatchFronts(batch2Json, 'flashcards-beta-002'),
    ].map(normalize));
    for (const [front, where] of seenFronts) {
      if (prior.has(front)) errors.push(`${where}: front duplicates an existing seeded or prior-batch card: "${front}"`);
    }
    return errors;
  });
}

// ---------------------------------------------------------------------------
// Emission.
// ---------------------------------------------------------------------------
const sql = (value) => (value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`);

const decks = existingShells;
const allCards = decks.flatMap((deck) => cardsByDeck[deck.key].map((item, index) => ({
  id: `fc_s3_${deck.key}_${String(index + 1).padStart(2, '0')}`,
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
    isNewDeck: false,
    cards: cardsByDeck[deck.key].map((item, index) => ({
      id: `fc_s3_${deck.key}_${String(index + 1).padStart(2, '0')}`,
      front: item.front,
      back: item.back,
      hint: item.hint,
      difficulty: item.difficulty,
    })),
  })),
};

const migrationFiles = [];

// Foundation: re-assert the 5 prod-canonical shell rows. INSERT OR IGNORE
// no-ops on prod and on fresh baselines seeded from database/seed.sql.
migrationFiles.push(['628_flashcard_decks_sprint3_foundation.sql', [
  `-- 628: Foundation for sprint 3 flashcard batch ${batchId}.`,
  '-- Original BrillaPrep revision content; not official WAEC or NaCCA material.',
  '-- Re-asserts the 5 empty public deck_sys_topic_* shells with their prod-canonical',
  '-- ids, names and subject/topic bindings; INSERT OR IGNORE no-ops where the rows',
  '-- already exist (prod, and fresh baselines seeded from database/seed.sql).',
  'PRAGMA foreign_keys = ON;',
  ...decks.map((deck) => `INSERT OR IGNORE INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count) VALUES (${sql(deck.deckId)}, NULL, ${sql(deck.name)}, ${sql(deck.description)}, ${sql(deck.subjectId)}, ${sql(deck.topicId)}, 1, 0);`),
]]);

const CARDS_PER_PART = 24;
const partCount = Math.ceil(allCards.length / CARDS_PER_PART);
for (let part = 0; part < partCount; part += 1) {
  const number = 629 + part;
  const slice = allCards.slice(part * CARDS_PER_PART, (part + 1) * CARDS_PER_PART);
  migrationFiles.push([`${number}_flashcard_decks_sprint3_part_${part + 1}.sql`, [
    `-- ${number}: Original BrillaPrep flashcards, batch ${batchId}, part ${part + 1} of ${partCount}.`,
    '-- Curriculum-aligned revision content; not official WAEC or NaCCA material.',
    'PRAGMA foreign_keys = ON;',
    ...slice.map(cardInsert),
  ]]);
}

const finalNumber = 629 + partCount;
const deckIds = decks.map((deck) => deck.deckId);
const guardName = `_migration_${finalNumber}_guard`;
migrationFiles.push([`${finalNumber}_flashcard_decks_sprint3_final_guard.sql`, [
  `-- ${finalNumber}: Recompute card_count from actual rows and guard batch ${batchId}.`,
  '-- card_count is maintained app-side on card add/delete (no trigger), so the seed-written',
  '-- static values are reconciled here against the actual card rows.',
  'PRAGMA foreign_keys = ON;',
  `UPDATE flashcard_decks SET card_count = (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = flashcard_decks.id), updated_at = datetime('now') WHERE id IN (${deckIds.map(sql).join(', ')});`,
  `CREATE TABLE IF NOT EXISTS ${guardName} (valid INTEGER NOT NULL CHECK (valid = 1));`,
  `DELETE FROM ${guardName};`,
  `INSERT INTO ${guardName}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM flashcards WHERE id LIKE 'fc_s3_%') = ${allCards.length} AND (SELECT COUNT(*) FROM flashcard_decks d WHERE d.id IN (${deckIds.map(sql).join(', ')}) AND d.card_count = 12 AND (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id) = 12) = ${deckIds.length} THEN 1 ELSE 0 END;`,
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
  outBatch,
  migrations: written,
}, null, 2));
