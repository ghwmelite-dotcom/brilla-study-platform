'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'database', 'manifests', 'nsmq-topic-remediation');
const RELEASE = 'nsmq-null-topic-remediation-audit-2026-08-26';
const DECLARED_OPERATIONAL_TOTAL = 375;
const REPOSITORY_RECONSTRUCTED_TOTAL = 370;

const SUBJECTS = {
  subj_nsmq_math: {
    label: 'Mathematics',
    sourceSubjectId: 'subj_wassce_core_math',
    file: 'mathematics.json',
    topics: ['topic_algebra', 'topic_geometry', 'topic_trigonometry', 'topic_calculus', 'topic_statistics', 'topic_quadratic'],
  },
  subj_nsmq_physics: {
    label: 'Physics',
    sourceSubjectId: 'subj_wassce_physics',
    file: 'physics.json',
    topics: ['topic_mechanics', 'topic_electricity', 'topic_waves', 'topic_thermodynamics', 'topic_modern_physics'],
  },
  subj_nsmq_chemistry: {
    label: 'Chemistry',
    sourceSubjectId: 'subj_wassce_chemistry',
    file: 'chemistry.json',
    topics: ['topic_atomic', 'topic_bonding', 'topic_stoichiometry', 'topic_equilibrium', 'topic_organic', 'topic_electrochemistry'],
  },
  subj_nsmq_biology: {
    label: 'Biology',
    sourceSubjectId: 'subj_wassce_biology',
    file: 'biology.json',
    topics: ['topic_cells', 'topic_genetics', 'topic_ecology', 'topic_physiology', 'topic_biochemistry'],
  },
};

const ROUND_PROVENANCE = {
  round_one: 'database/migrations/archive/040_nsmq_round_one.sql',
  speed_race: 'database/migrations/archive/041_nsmq_speed_race.sql',
  problem_of_day: 'database/migrations/archive/042_nsmq_problem_of_day.sql',
  true_false: 'database/migrations/archive/043_nsmq_true_false.sql',
  riddles: 'database/migrations/archive/044_nsmq_riddles.sql',
};

const ids = (prefix, values) => values.map((value) => `${prefix}${String(value).padStart(3, '0')}`);
const add = (subjectId, roundType, topicId, prefix, values, evidence) => ({
  subjectId,
  roundType,
  topicId,
  evidence,
  questionIds: ids(prefix, values),
});

const GROUPS = [
  // Mathematics — broad legacy taxonomy intentionally follows the repository's
  // existing convention of grouping elementary number theory, sequences and
  // combinatorics under Statistics & Probability.
  add('subj_nsmq_math', 'problem_of_day', 'topic_algebra', 'nsmq_math_pod_', [1, 2, 5, 7, 9, 12, 16, 18], 'Equations, rates, indices, financial growth, radicals and logarithms are explicit in the prompt and worked solution.'),
  add('subj_nsmq_math', 'problem_of_day', 'topic_quadratic', 'nsmq_math_pod_', [11], 'The equal-roots discriminant condition is explicitly assessed.'),
  add('subj_nsmq_math', 'problem_of_day', 'topic_geometry', 'nsmq_math_pod_', [3, 6, 10, 13, 15, 19], 'Pythagoras, mensuration, angles or coordinate geometry is explicit in the prompt and solution.'),
  add('subj_nsmq_math', 'problem_of_day', 'topic_calculus', 'nsmq_math_pod_', [14], 'The prompt explicitly requires a definite integral.'),
  add('subj_nsmq_math', 'problem_of_day', 'topic_statistics', 'nsmq_math_pod_', [4, 8, 17, 20], 'Sequences, probability, averages or permutations are explicit; these follow the repository Statistics & Probability grouping convention.'),
  add('subj_nsmq_math', 'riddles', 'topic_algebra', 'nsmq_math_rid_', [1, 5, 7, 8, 14], 'The riddle has an explicit numerical or algebraic constraint with a determinate solution.'),
  add('subj_nsmq_math', 'riddles', 'topic_geometry', 'nsmq_math_rid_', [6], 'The answer is explicitly the geometric definition of an angle.'),
  add('subj_nsmq_math', 'round_one', 'topic_algebra', 'nsmq_math_r1_', [1, 2, 4, 6, 8, 11, 15, 16, 18, 19, 22, 24, 25, 29], 'The prompt explicitly assesses algebraic evaluation, number operations, ratios, indices, logarithms or functions.'),
  add('subj_nsmq_math', 'round_one', 'topic_quadratic', 'nsmq_math_r1_', [23], 'The question explicitly asks for the quadratic formula.'),
  add('subj_nsmq_math', 'round_one', 'topic_geometry', 'nsmq_math_r1_', [3, 7, 13, 21, 26, 27], 'The prompt explicitly assesses polygon angles, mensuration or coordinate geometry.'),
  add('subj_nsmq_math', 'round_one', 'topic_trigonometry', 'nsmq_math_r1_', [10, 20, 30], 'Trigonometric ratios or identities are explicit in the prompt.'),
  add('subj_nsmq_math', 'round_one', 'topic_calculus', 'nsmq_math_r1_', [5, 14], 'Differentiation or integration is explicit in the prompt.'),
  add('subj_nsmq_math', 'round_one', 'topic_statistics', 'nsmq_math_r1_', [9, 12, 17, 28], 'Sequences, probability, factorial counting or descriptive statistics are explicit.'),
  add('subj_nsmq_math', 'speed_race', 'topic_algebra', 'nsmq_math_sr_', [21, 23, 24], 'Logarithms, roots and index laws are explicit in the prompt and solution.'),
  add('subj_nsmq_math', 'speed_race', 'topic_statistics', 'nsmq_math_sr_', [25], 'The Fibonacci sequence is explicit and follows the repository sequence-grouping convention.'),
  add('subj_nsmq_math', 'true_false', 'topic_algebra', 'nsmq_math_tf_', [1, 2, 4, 7, 8, 9, 13, 19], 'The statement explicitly concerns number properties, algebraic signs, logarithms, functions or roots.'),
  add('subj_nsmq_math', 'true_false', 'topic_geometry', 'nsmq_math_tf_', [3, 6, 10, 15, 16, 18], 'The statement explicitly concerns Euclidean shapes, angles, gradients or symmetry.'),
  add('subj_nsmq_math', 'true_false', 'topic_trigonometry', 'nsmq_math_tf_', [12], 'The statement is explicitly a trigonometric identity.'),
  add('subj_nsmq_math', 'true_false', 'topic_calculus', 'nsmq_math_tf_', [5, 17], 'The statement explicitly concerns a derivative or integral.'),
  add('subj_nsmq_math', 'true_false', 'topic_statistics', 'nsmq_math_tf_', [11, 14], 'The statement concerns a median or factorial, matching the existing statistics/counting grouping.'),

  // Physics.
  add('subj_nsmq_physics', 'problem_of_day', 'topic_mechanics', 'nsmq_phy_pod_', [1, 2, 6, 9, 11, 12, 13, 17, 19], 'The worked solution explicitly uses kinematics, energy, momentum, force, buoyancy or oscillation mechanics.'),
  add('subj_nsmq_physics', 'problem_of_day', 'topic_electricity', 'nsmq_phy_pod_', [3, 5, 7, 10, 16, 18, 20], 'The prompt explicitly assesses circuits, transformers, capacitance, fields or electrical energy.'),
  add('subj_nsmq_physics', 'problem_of_day', 'topic_waves', 'nsmq_phy_pod_', [4, 8, 14], 'Wave speed or geometrical optics is explicit in the prompt and solution.'),
  add('subj_nsmq_physics', 'problem_of_day', 'topic_thermodynamics', 'nsmq_phy_pod_', [15], 'The prompt explicitly applies specific heat capacity.'),
  add('subj_nsmq_physics', 'riddles', 'topic_mechanics', 'nsmq_phy_rid_', [2, 6, 7, 10, 14], 'The answer explicitly identifies gravity, mass, wind motion or mechanical potential energy.'),
  add('subj_nsmq_physics', 'riddles', 'topic_electricity', 'nsmq_phy_rid_', [8, 13], 'The answer explicitly concerns magnetism/electron flow.'),
  add('subj_nsmq_physics', 'riddles', 'topic_waves', 'nsmq_phy_rid_', [5, 11, 15], 'The answer explicitly identifies light or sound and its wave behaviour.'),
  add('subj_nsmq_physics', 'riddles', 'topic_thermodynamics', 'nsmq_phy_rid_', [4], 'Combustion, oxygen and heat are the explicit physical clues.'),
  add('subj_nsmq_physics', 'riddles', 'topic_modern_physics', 'nsmq_phy_rid_', [9], 'The answer explicitly identifies an atom and nuclear fission.'),
  add('subj_nsmq_physics', 'round_one', 'topic_mechanics', 'nsmq_phy_r1_', [3, 5, 10, 12, 15, 16, 19, 20, 21, 22, 24], 'The prompt explicitly assesses force, motion, energy, pressure, momentum or vector mechanics.'),
  add('subj_nsmq_physics', 'round_one', 'topic_electricity', 'nsmq_phy_r1_', [1, 8, 13, 17, 26, 27, 30], 'The prompt explicitly concerns current, resistance, charge, circuits or magnetic flux.'),
  add('subj_nsmq_physics', 'round_one', 'topic_waves', 'nsmq_phy_r1_', [2, 4, 7, 9, 11, 14, 18, 23, 25, 28, 29], 'The prompt explicitly concerns light, sound, frequency, wavelength, mirrors, lenses or refraction.'),
  add('subj_nsmq_physics', 'round_one', 'topic_modern_physics', 'nsmq_phy_r1_', [6], 'The prompt explicitly identifies a subatomic particle.'),
  add('subj_nsmq_physics', 'speed_race', 'topic_mechanics', 'nsmq_phy_sr_', [1, 3, 4, 6, 7, 10, 14, 17, 18, 20, 21], 'The prompt explicitly asks for a mechanics quantity, law, unit or machine relation.'),
  add('subj_nsmq_physics', 'speed_race', 'topic_electricity', 'nsmq_phy_sr_', [5, 16, 19, 22, 23, 24], 'The prompt explicitly concerns resistance, capacitance, generation, charge, voltage or circuits.'),
  add('subj_nsmq_physics', 'speed_race', 'topic_waves', 'nsmq_phy_sr_', [2, 8, 12, 15, 25], 'The prompt explicitly concerns sound, mirrors, wavelength, incidence or refraction.'),
  add('subj_nsmq_physics', 'speed_race', 'topic_thermodynamics', 'nsmq_phy_sr_', [9, 13], 'The prompt explicitly converts or identifies temperature.'),
  add('subj_nsmq_physics', 'speed_race', 'topic_modern_physics', 'nsmq_phy_sr_', [11], 'The prompt explicitly identifies a subatomic particle.'),
  add('subj_nsmq_physics', 'true_false', 'topic_mechanics', 'nsmq_phy_tf_', [2, 4, 7, 11, 12, 13, 17, 18], 'The statement explicitly concerns momentum, energy, gravity, vectors, machines, density or equilibrium.'),
  add('subj_nsmq_physics', 'true_false', 'topic_electricity', 'nsmq_phy_tf_', [5, 6, 10, 16, 20], 'The statement explicitly concerns charge, circuits, transformers or current.'),
  add('subj_nsmq_physics', 'true_false', 'topic_waves', 'nsmq_phy_tf_', [1, 3, 8, 9, 14, 19], 'The statement explicitly concerns propagation, optics, wavelength, reflection or refraction.'),
  add('subj_nsmq_physics', 'true_false', 'topic_modern_physics', 'nsmq_phy_tf_', [15], 'The statement explicitly compares ionising radiation.'),

  // Chemistry.
  add('subj_nsmq_chemistry', 'problem_of_day', 'topic_atomic', 'nsmq_chem_pod_', [13, 17], 'The calculation explicitly concerns electron count or electron mass.'),
  add('subj_nsmq_chemistry', 'problem_of_day', 'topic_bonding', 'nsmq_chem_pod_', [20], 'The prompt explicitly asks for molecular bond order.'),
  add('subj_nsmq_chemistry', 'problem_of_day', 'topic_stoichiometry', 'nsmq_chem_pod_', [1, 2, 3, 4, 5, 7, 10, 11, 12, 14], 'The worked solution explicitly uses moles, formulae, balancing, concentration, gas volume or reacting masses.'),
  add('subj_nsmq_chemistry', 'problem_of_day', 'topic_equilibrium', 'nsmq_chem_pod_', [6, 15, 16, 18], 'The prompt explicitly concerns pH, thermodynamic spontaneity or entropy.'),
  add('subj_nsmq_chemistry', 'problem_of_day', 'topic_organic', 'nsmq_chem_pod_', [8, 19], 'The prompt explicitly concerns a hydrocarbon formula or structural isomers.'),
  add('subj_nsmq_chemistry', 'problem_of_day', 'topic_electrochemistry', 'nsmq_chem_pod_', [9], 'The prompt explicitly determines an oxidation state.'),
  add('subj_nsmq_chemistry', 'riddles', 'topic_atomic', 'nsmq_chem_rid_', [3, 4, 5, 8, 9, 12, 15], 'The clues explicitly identify an element by atomic number, physical properties or periodic group.'),
  add('subj_nsmq_chemistry', 'riddles', 'topic_bonding', 'nsmq_chem_rid_', [7, 10, 14], 'The clues explicitly identify a molecular/ionic compound and its composition or molecular behaviour.'),
  add('subj_nsmq_chemistry', 'riddles', 'topic_stoichiometry', 'nsmq_chem_rid_', [6], 'The clues identify carbon dioxide through reactions and composition.'),
  add('subj_nsmq_chemistry', 'riddles', 'topic_equilibrium', 'nsmq_chem_rid_', [11, 13], 'The clues explicitly concern acid-base indication or catalysis/kinetics.'),
  add('subj_nsmq_chemistry', 'riddles', 'topic_organic', 'nsmq_chem_rid_', [2], 'The clue explicitly identifies carbon as the basis of organic chemistry.'),
  add('subj_nsmq_chemistry', 'riddles', 'topic_electrochemistry', 'nsmq_chem_rid_', [1], 'Rusting is explicitly identified as oxidation.'),
  add('subj_nsmq_chemistry', 'round_one', 'topic_atomic', 'nsmq_chem_r1_', [1, 3, 5, 12, 17, 21, 22, 27, 29], 'The prompt explicitly assesses atomic number, shells, elements, periodic groups or electron configuration.'),
  add('subj_nsmq_chemistry', 'round_one', 'topic_bonding', 'nsmq_chem_r1_', [6, 8, 9, 14, 26], 'The prompt explicitly concerns compound identity, valency, bonding or molecular geometry.'),
  add('subj_nsmq_chemistry', 'round_one', 'topic_stoichiometry', 'nsmq_chem_r1_', [2, 7, 10, 11, 13, 24, 28, 30], 'The prompt explicitly concerns formulae, moles, reaction products, gas volume or percentage composition.'),
  add('subj_nsmq_chemistry', 'round_one', 'topic_equilibrium', 'nsmq_chem_r1_', [4, 15, 20, 25], 'The prompt explicitly concerns pH, phase equilibrium, neutralisation or catalysis.'),
  add('subj_nsmq_chemistry', 'round_one', 'topic_organic', 'nsmq_chem_r1_', [16, 23], 'The prompt explicitly concerns an organic functional group or IUPAC name.'),
  add('subj_nsmq_chemistry', 'round_one', 'topic_electrochemistry', 'nsmq_chem_r1_', [18], 'The prompt explicitly determines an oxidation state.'),
  add('subj_nsmq_chemistry', 'true_false', 'topic_atomic', 'nsmq_chem_tf_', [1, 2, 5, 7, 10, 11], 'The statement explicitly concerns elements, isotopes, atomic number, valence shells, allotropes or electron location.'),
  add('subj_nsmq_chemistry', 'true_false', 'topic_bonding', 'nsmq_chem_tf_', [4, 16, 18], 'The statement explicitly concerns covalent, ionic or hydrogen bonding.'),
  add('subj_nsmq_chemistry', 'true_false', 'topic_stoichiometry', 'nsmq_chem_tf_', [17], 'The statement explicitly concerns molar gas volume.'),
  add('subj_nsmq_chemistry', 'true_false', 'topic_equilibrium', 'nsmq_chem_tf_', [3, 6, 9, 12, 13, 15, 20], 'The statement explicitly concerns acids, reversibility, kinetics, pH, energetics, catalysts or proton donation.'),
  add('subj_nsmq_chemistry', 'true_false', 'topic_organic', 'nsmq_chem_tf_', [14], 'The statement explicitly concerns alkane saturation.'),
  add('subj_nsmq_chemistry', 'true_false', 'topic_electrochemistry', 'nsmq_chem_tf_', [8, 19], 'The statement explicitly concerns oxidation/reduction or electrolysis.'),

  // Biology.
  add('subj_nsmq_biology', 'problem_of_day', 'topic_cells', 'nsmq_bio_pod_', [10, 17], 'The calculation explicitly concerns mitotic cell number or microscopy magnification.'),
  add('subj_nsmq_biology', 'problem_of_day', 'topic_genetics', 'nsmq_bio_pod_', [1, 2, 3, 4, 6, 8, 11, 13, 15], 'The prompt explicitly concerns meiosis, inheritance, allele frequency, DNA/RNA or genetic crosses.'),
  add('subj_nsmq_biology', 'problem_of_day', 'topic_ecology', 'nsmq_bio_pod_', [9, 19], 'The calculation explicitly concerns trophic energy transfer or population growth.'),
  add('subj_nsmq_biology', 'problem_of_day', 'topic_physiology', 'nsmq_bio_pod_', [5, 12, 14, 16, 20], 'The calculation explicitly concerns cardiac, plant-water, respiratory, transpiration or neural physiology.'),
  add('subj_nsmq_biology', 'problem_of_day', 'topic_biochemistry', 'nsmq_bio_pod_', [7, 18], 'The prompt explicitly concerns aerobic respiration or photosynthesis chemistry.'),
  add('subj_nsmq_biology', 'riddles', 'topic_cells', 'nsmq_bio_rid_', [2, 5, 15], 'The clues explicitly identify an organelle, cell or acellular infectious agent in cell-biology context.'),
  add('subj_nsmq_biology', 'riddles', 'topic_genetics', 'nsmq_bio_rid_', [1, 3, 10, 11], 'The clues explicitly concern gametes, DNA, inherited traits or mRNA.'),
  add('subj_nsmq_biology', 'riddles', 'topic_ecology', 'nsmq_bio_rid_', [8], 'The organism-level clues identify a fungus, fitting the broad ecology/diversity taxonomy.'),
  add('subj_nsmq_biology', 'riddles', 'topic_physiology', 'nsmq_bio_rid_', [4, 6, 9, 12, 13, 14], 'The clues explicitly identify a human organ, tissue, blood cell or hormone by physiological function.'),
  add('subj_nsmq_biology', 'riddles', 'topic_biochemistry', 'nsmq_bio_rid_', [7], 'The clues explicitly identify the photosynthetic organelle and pigment.'),
  add('subj_nsmq_biology', 'round_one', 'topic_cells', 'nsmq_bio_r1_', [1, 4, 10, 19, 22, 30], 'The prompt explicitly concerns cells, organelles, membranes or cellular structure.'),
  add('subj_nsmq_biology', 'round_one', 'topic_genetics', 'nsmq_bio_r1_', [3, 7, 14, 26], 'The prompt explicitly concerns chromosomes, meiosis, DNA base pairing or inherited identity.'),
  add('subj_nsmq_biology', 'round_one', 'topic_ecology', 'nsmq_bio_r1_', [16, 23, 27, 29], 'The prompt explicitly concerns trophic roles, biodiversity, decomposition or taxonomy.'),
  add('subj_nsmq_biology', 'round_one', 'topic_physiology', 'nsmq_bio_r1_', [5, 6, 8, 9, 11, 12, 13, 15, 17, 18, 20, 24, 25], 'The prompt explicitly concerns organ systems, nutrition, transport, hormones, plant water relations or neural control.'),
  add('subj_nsmq_biology', 'round_one', 'topic_biochemistry', 'nsmq_bio_r1_', [2, 21, 28], 'The prompt explicitly concerns photosynthesis or glucose metabolism.'),
  add('subj_nsmq_biology', 'true_false', 'topic_cells', 'nsmq_bio_tf_', [1, 6, 9], 'The statement explicitly concerns cell nuclei or virus replication in cells.'),
  add('subj_nsmq_biology', 'true_false', 'topic_genetics', 'nsmq_bio_tf_', [2, 7, 12, 18, 19], 'The statement explicitly concerns nucleic acids, meiosis, dominance, mutation or X-linked inheritance.'),
  add('subj_nsmq_biology', 'true_false', 'topic_ecology', 'nsmq_bio_tf_', [14], 'The statement concerns the ecological roles of bacteria.'),
  add('subj_nsmq_biology', 'true_false', 'topic_physiology', 'nsmq_bio_tf_', [3, 8, 11, 13, 16, 17, 20], 'The statement explicitly concerns circulation, hormones, plant transport, neural control or blood physiology.'),
  add('subj_nsmq_biology', 'true_false', 'topic_biochemistry', 'nsmq_bio_tf_', [4, 5, 10, 15], 'The statement explicitly concerns photosynthesis, enzymes or respiration.'),
];

const EXCEPTIONS = [
  ...[2, 3, 4, 9, 10, 11, 13, 15].map((number) => ({
    questionId: ids('nsmq_math_rid_', [number])[0], subjectId: 'subj_nsmq_math', roundType: 'riddles',
    reasonCode: 'OUTSIDE_CURRENT_TAXONOMY', reviewNote: 'Wordplay, general-knowledge or lateral-logic riddle; assigning Algebra/Geometry/Statistics would guess rather than follow assessed content.',
  })),
  { questionId: 'nsmq_math_rid_012', subjectId: 'subj_nsmq_math', roundType: 'riddles', reasonCode: 'CONTENT_DEFECT_BLOCKS_CLASSIFICATION', reviewNote: 'The stated answer and worked explanation contradict the riddle constraints; topic assignment must wait for content correction.' },
  { questionId: 'nsmq_math_sr_022', subjectId: 'subj_nsmq_math', roundType: 'speed_race', reasonCode: 'OUTSIDE_CURRENT_TAXONOMY', reviewNote: 'Roman numerals are not represented by the current Algebra/Geometry/Trigonometry/Calculus/Statistics taxonomy.' },
  { questionId: 'nsmq_math_tf_020', subjectId: 'subj_nsmq_math', roundType: 'true_false', reasonCode: 'TAXONOMY_GAP', reviewNote: 'The statement assesses set theory, for which the current NSMQ Mathematics taxonomy has no topic.' },
  { questionId: 'nsmq_phy_rid_001', subjectId: 'subj_nsmq_physics', roundType: 'riddles', reasonCode: 'OUTSIDE_CURRENT_TAXONOMY', reviewNote: 'The postage-stamp answer is general wordplay and does not assess Physics.' },
  { questionId: 'nsmq_phy_rid_003', subjectId: 'subj_nsmq_physics', roundType: 'riddles', reasonCode: 'OUTSIDE_CURRENT_TAXONOMY', reviewNote: 'The footsteps answer is lateral wordplay and does not assess Physics.' },
  { questionId: 'nsmq_phy_rid_012', subjectId: 'subj_nsmq_physics', roundType: 'riddles', reasonCode: 'AMBIGUOUS_BETWEEN_TOPICS', reviewNote: 'The answer is explicitly “Kinetic energy / Heat,” spanning Mechanics and Thermodynamics; selecting one would discard the source ambiguity.' },
  { questionId: 'nsmq_chem_r1_019', subjectId: 'subj_nsmq_chemistry', roundType: 'round_one', reasonCode: 'TAXONOMY_GAP', reviewNote: 'The item assesses greenhouse-gas identity/environmental chemistry, which is not represented by the current six Chemistry topics.' },
];

const ALIGNMENT_UPDATE = `
WITH subject_map(source_subject_id, target_subject_id) AS (
  VALUES
    ('subj_wassce_core_math', 'subj_nsmq_math'),
    ('subj_wassce_physics', 'subj_nsmq_physics'),
    ('subj_wassce_chemistry', 'subj_nsmq_chemistry'),
    ('subj_wassce_biology', 'subj_nsmq_biology')
)
UPDATE questions
SET topic_id = CASE
      WHEN topic_id IS NOT NULL AND (
        SELECT COUNT(*) FROM topics candidate JOIN topics old_topic ON old_topic.id = questions.topic_id
        WHERE candidate.subject_id = (SELECT target_subject_id FROM subject_map WHERE source_subject_id = questions.subject_id)
          AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
      ) = 1 THEN (
        SELECT MIN(candidate.id) FROM topics candidate JOIN topics old_topic ON old_topic.id = questions.topic_id
        WHERE candidate.subject_id = (SELECT target_subject_id FROM subject_map WHERE source_subject_id = questions.subject_id)
          AND lower(trim(candidate.name)) = lower(trim(old_topic.name))
      ) ELSE NULL END,
    subject_id = (SELECT target_subject_id FROM subject_map WHERE source_subject_id = questions.subject_id),
    exam_type_id = 'exam_nsmq'
WHERE round_type IS NOT NULL AND subject_id IN (SELECT source_subject_id FROM subject_map);
`;

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(row) {
  return crypto.createHash('sha256').update(JSON.stringify({
    id: row.id,
    subjectId: row.subject_id,
    roundType: row.round_type,
    questionText: row.question_text,
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
  })).digest('hex');
}

function countBy(rows, key) {
  return Object.fromEntries([...new Set(rows.map((row) => row[key]))].sort().map((value) => [value, rows.filter((row) => row[key] === value).length]));
}

function loadInventory() {
  const db = new Database(':memory:');
  db.exec(fs.readFileSync(path.join(ROOT, 'database', 'schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(ROOT, 'database', 'seed.sql'), 'utf8'));
  db.exec(ALIGNMENT_UPDATE);
  const rows = db.prepare(`
    SELECT id, subject_id, round_type, question_text, correct_answer, explanation
    FROM questions
    WHERE exam_type_id = 'exam_nsmq' AND round_type IS NOT NULL AND topic_id IS NULL
    ORDER BY subject_id, round_type, id
  `).all();
  const topics = db.prepare(`SELECT id, subject_id, name FROM topics WHERE subject_id LIKE 'subj_nsmq_%' ORDER BY subject_id, id`).all();
  db.close();
  return { rows, topics };
}

function buildAudit() {
  const { rows, topics } = loadInventory();
  if (rows.length !== REPOSITORY_RECONSTRUCTED_TOTAL) throw new Error(`Repository inventory drift: expected ${REPOSITORY_RECONSTRUCTED_TOTAL}, found ${rows.length}`);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const seen = new Set();
  const mappings = [];

  for (const group of GROUPS) {
    const subject = SUBJECTS[group.subjectId];
    if (!subject || !subject.topics.includes(group.topicId)) throw new Error(`Out-of-bound topic ${group.topicId} for ${group.subjectId}`);
    const topic = topicById.get(group.topicId);
    if (!topic || topic.subject_id !== group.subjectId) throw new Error(`Taxonomy ownership drift for ${group.topicId}`);
    for (const questionId of group.questionIds) {
      if (seen.has(questionId)) throw new Error(`Duplicate review disposition: ${questionId}`);
      const row = byId.get(questionId);
      if (!row) throw new Error(`Reviewed mapping is not in reconstructed inventory: ${questionId}`);
      if (row.subject_id !== group.subjectId || row.round_type !== group.roundType) throw new Error(`Subject/round drift for ${questionId}`);
      seen.add(questionId);
      mappings.push({
        questionId,
        subjectId: group.subjectId,
        roundType: group.roundType,
        topicId: group.topicId,
        classificationSource: 'prompt-answer-explanation-human-review',
        evidence: group.evidence,
        provenance: ROUND_PROVENANCE[group.roundType],
        contentFingerprint: fingerprint(row),
      });
    }
  }

  const exceptions = EXCEPTIONS.map((exception) => {
    if (seen.has(exception.questionId)) throw new Error(`Duplicate review disposition: ${exception.questionId}`);
    const row = byId.get(exception.questionId);
    if (!row) throw new Error(`Reviewed exception is not in reconstructed inventory: ${exception.questionId}`);
    if (row.subject_id !== exception.subjectId || row.round_type !== exception.roundType) throw new Error(`Subject/round drift for ${exception.questionId}`);
    seen.add(exception.questionId);
    return {
      ...exception,
      provenance: ROUND_PROVENANCE[exception.roundType],
      contentFingerprint: fingerprint(row),
    };
  });

  const missing = rows.filter((row) => !seen.has(row.id));
  if (missing.length) throw new Error(`Unreviewed reconstructed questions: ${missing.map((row) => row.id).join(', ')}`);
  if (seen.size !== rows.length) throw new Error(`Review cardinality mismatch: dispositions=${seen.size}, inventory=${rows.length}`);

  mappings.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.roundType.localeCompare(b.roundType) || a.questionId.localeCompare(b.questionId));
  exceptions.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.roundType.localeCompare(b.roundType) || a.questionId.localeCompare(b.questionId));

  const subjectManifests = {};
  for (const [subjectId, subject] of Object.entries(SUBJECTS)) {
    const subjectRows = rows.filter((row) => row.subject_id === subjectId);
    const subjectMappings = mappings.filter((row) => row.subjectId === subjectId);
    const subjectExceptions = exceptions.filter((row) => row.subjectId === subjectId);
    subjectManifests[subject.file] = {
      release: RELEASE,
      status: 'reviewed-audit-no-migrations',
      subjectId,
      subjectName: subject.label,
      sourceSubjectId: subject.sourceSubjectId,
      sourceNullTopicCount: subjectRows.length,
      mappedCount: subjectMappings.length,
      exceptionCount: subjectExceptions.length,
      roundTotals: countBy(subjectRows, 'round_type'),
      mappedRoundTotals: countBy(subjectMappings, 'roundType'),
      topicCounts: countBy(subjectMappings, 'topicId'),
      mappings: subjectMappings,
    };
  }

  const exceptionLedger = {
    release: RELEASE,
    status: 'reviewed-exceptions-no-guessing',
    exceptionCount: exceptions.length,
    reasonCounts: countBy(exceptions, 'reasonCode'),
    exceptions,
  };

  const subjectTotals = Object.fromEntries(Object.entries(SUBJECTS).map(([subjectId, subject]) => {
    const manifest = subjectManifests[subject.file];
    return [subjectId, {
      sourceNullTopicCount: manifest.sourceNullTopicCount,
      mappedCount: manifest.mappedCount,
      exceptionCount: manifest.exceptionCount,
      roundTotals: manifest.roundTotals,
    }];
  }));

  const summary = {
    release: RELEASE,
    status: DECLARED_OPERATIONAL_TOTAL === rows.length ? 'inventory-reconciled-reviewed-audit-no-migrations' : 'inventory-reconciliation-required-no-migrations',
    declaredOperationalNullTopicCount: DECLARED_OPERATIONAL_TOTAL,
    repositoryReconstructedNullTopicCount: rows.length,
    unreconciledInventoryCount: DECLARED_OPERATIONAL_TOTAL - rows.length,
    mappedCount: mappings.length,
    exceptionCount: exceptions.length,
    reviewedDispositionCount: mappings.length + exceptions.length,
    rootCause: 'Legacy round-specific NSMQ inserts retained subject and round provenance but did not consistently bind canonical NSMQ topics. Migration 102 aligns source subjects and preserves only a unique same-name topic; the squashed repository seed reconstructs 370 unresolved rows, five fewer than the declared operational audit total.',
    evidenceBasis: [
      'database/seed.sql (materialized legacy question rows)',
      'database/migrations/102_nsmq_question_alignment.sql (subject alignment and unique-name topic preservation)',
      'database/migrations/archive/040_nsmq_round_one.sql through 044_nsmq_riddles.sql (round-specific provenance)',
      'database/seed.sql NSMQ topics (current canonical taxonomy and subject ownership)',
    ],
    generationContract: 'Subject and round must match the reconstructed source row; target topic must be owned by that subject; every reconstructed null-topic row must have exactly one mapping or reviewed exception; prompt/answer/explanation drift changes the SHA-256 fingerprint.',
    migrationArtifactsCreated: false,
    subjectTotals,
  };

  return { summary, subjectManifests, exceptionLedger };
}

function renderFiles(audit) {
  return {
    'summary.json': stableJson(audit.summary),
    ...Object.fromEntries(Object.entries(audit.subjectManifests).map(([file, value]) => [file, stableJson(value)])),
    'reviewed-exceptions.json': stableJson(audit.exceptionLedger),
  };
}

function writeOrCheck(files, check) {
  if (!check) fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(OUT_DIR, file);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) throw new Error(`Generated manifest drift: ${path.relative(ROOT, target)}`);
    } else {
      fs.writeFileSync(target, content);
    }
  }
}

function main() {
  const check = process.argv.includes('--check');
  const audit = buildAudit();
  writeOrCheck(renderFiles(audit), check);
  process.stdout.write(`${JSON.stringify(audit.summary, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = {
  DECLARED_OPERATIONAL_TOTAL,
  RELEASE,
  REPOSITORY_RECONSTRUCTED_TOTAL,
  SUBJECTS,
  buildAudit,
  renderFiles,
};
