'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const RELEASE = 'cambridge-topic-remediation-audit-2026-08-26';
const TAXONOMY_SOURCE = 'database/prod-patches/096_seed_topics_for_empty_subjects.sql';
const IGCSE_MANIFEST = 'database/manifests/cambridge_igcse_topic_mapping.json';
const ALEVEL_MANIFEST = 'database/manifests/cambridge_alevel_topic_mapping.json';
const EXCEPTION_LEDGER = 'database/manifests/cambridge_topic_mapping_exceptions.json';

const inclusive = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index);
const ids = (prefix, values) => values.map((value) => `${prefix}${String(value).padStart(3, '0')}`);
const q = {
  igPhy: (values) => ids('q_igcse_phy_', values),
  igChem: (values) => ids('q_igcse_chem_', values),
  igBio: (values) => ids('q_igcse_bio_', values),
  igMath: (values) => ids('q_igcse_math_', values),
  igAdd: (values) => ids('q_igcse_addmath_', values),
  alPhy: (values) => ids('q_alevel_phy_', values),
  alChem: (values) => ids('q_alevel_chem_', values),
  alBio: (values) => ids('q_alevel_bio_', values),
  alMath: (values) => ids('q_alevel_math_', values),
  alFurther: (values) => ids('q_alevel_fm_', values),
};

function group(topicId, sourceFiles, sourceSections, evidence, questionIds) {
  return { topicId, sourceFiles, sourceSections, evidence, questionIds: [...questionIds].sort() };
}

function exceptionGroup(subjectId, sourceFile, sourceSection, missingConcept, questionIds) {
  return {
    subjectId,
    sourceFile,
    sourceSection,
    missingConcept,
    questionIds: [...questionIds].sort(),
    reasonCode: 'taxonomy-gap',
    reason: `The reviewed question assesses ${missingConcept}, but the current same-subject topic taxonomy has no matching topic. Assigning a broader topic would be a guess.`,
    requiredTaxonomyAction: `Add and review a same-subject topic covering ${missingConcept} before mapping these rows.`,
    reviewStatus: 'reviewed-unmapped',
  };
}

const igcseSubjects = [
  {
    subjectId: 'subj_igcse_physics',
    subjectName: 'Physics',
    syllabusCode: '0625',
    expectedQuestionCount: 50,
    sourceFiles: ['database/migrations/archive/077_seed_oalevel_questions.sql'],
    mappingGroups: [
      group('topic_igcse_physics_mechanics', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['General Physics', 'Additional topics'], 'Reviewed motion, mass, density, forces, energy, pressure, momentum and deformation questions.', [...q.igPhy(inclusive(1, 20)), ...q.igPhy(inclusive(41, 48))]),
      group('topic_igcse_physics_thermal', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['Thermal Physics', 'Additional topics'], 'Reviewed particle model, heat transfer, specific heat capacity and latent heat questions.', [...q.igPhy(inclusive(21, 25)), ...q.igPhy([49, 50])]),
      group('topic_igcse_physics_waves', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['Waves'], 'Contiguous reviewed waves, light and electromagnetic-spectrum source block.', q.igPhy(inclusive(26, 30))),
      group('topic_igcse_physics_electricity', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['Electricity'], 'Contiguous reviewed current, resistance, circuits, power and transmission source block.', q.igPhy(inclusive(31, 35))),
      group('topic_igcse_physics_nuclear', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['Nuclear Physics'], 'Contiguous reviewed radioactivity and atomic-nucleus source block.', q.igPhy(inclusive(36, 40))),
    ],
  },
  {
    subjectId: 'subj_igcse_chemistry',
    subjectName: 'Chemistry',
    syllabusCode: '0620',
    expectedQuestionCount: 40,
    sourceFiles: ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/079_more_chemistry_questions.sql'],
    mappingGroups: [
      group('topic_igcse_chem_atomic', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['IGCSE Chemistry', 'Atomic Structure'], 'Reviewed atomic-number and isotope questions.', q.igChem([1, 16])),
      group('topic_igcse_chem_bonding', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['IGCSE Chemistry', 'Bonding and Structure'], 'Reviewed ionic/covalent bonding and structure-property questions.', q.igChem([3, 12, 17, 18])),
      group('topic_igcse_chem_stoichiometry', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['IGCSE Chemistry', 'Stoichiometry'], 'Reviewed equation balancing, formula mass, mole and composition questions.', q.igChem([2, 4, 13, 19])),
      group('topic_igcse_chem_reactions', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/079_more_chemistry_questions.sql'], ['IGCSE Chemistry', 'Rates of Reaction'], 'Reviewed rate, catalyst, equilibrium, thermal-decomposition and reversible-reaction questions.', q.igChem([9, 11, 14, 15, 21, 29, 30])),
      group('topic_igcse_chem_acids', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/079_more_chemistry_questions.sql'], ['IGCSE Chemistry', 'Acids, Bases and Salts'], 'Reviewed pH, neutralisation and acid-carbonate questions.', q.igChem([5, 7, 26])),
      group('topic_igcse_chem_metals', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/079_more_chemistry_questions.sql'], ['IGCSE Chemistry', 'Metals and Reactivity'], 'Reviewed metal-acid reactions, reactivity order, extraction and corrosion questions.', q.igChem([25, 28, 33, 34, 35])),
      group('topic_igcse_chem_organic', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/079_more_chemistry_questions.sql'], ['IGCSE Chemistry', 'Organic Chemistry'], 'Reviewed hydrocarbons, crude oil, combustion, addition, polymerisation and cracking questions.', q.igChem([10, 22, 23, 24, 36, 37, 38, 39, 40])),
    ],
  },
  {
    subjectId: 'subj_igcse_biology',
    subjectName: 'Biology',
    syllabusCode: '0610',
    expectedQuestionCount: 40,
    sourceFiles: ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/078_more_biology_questions.sql'],
    mappingGroups: [
      group('topic_igcse_bio_cells', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['IGCSE Biology', 'Cells and Organization'], 'Reviewed nucleus and plant-cell organelle questions.', q.igBio([1, 2])),
      group('topic_igcse_bio_molecules', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['IGCSE Biology', 'Cells and Organization'], 'Reviewed enzyme and biological-molecule questions.', q.igBio([5, 17])),
      group('topic_igcse_bio_nutrition', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['IGCSE Biology', 'Nutrition and Digestion'], 'Reviewed photosynthesis, leaf adaptation and digestion questions.', q.igBio([3, 10, 13])),
      group('topic_igcse_bio_transport', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/078_more_biology_questions.sql'], ['IGCSE Biology', 'Circulation'], 'Reviewed blood, heart, vessel and transpiration questions.', q.igBio([4, 9, 14, 15, 19, 20, 27, 28, 29, 30])),
      group('topic_igcse_bio_respiration', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/078_more_biology_questions.sql'], ['IGCSE Biology', 'Gas Exchange and Respiration'], 'Reviewed respiration, lungs and alveolar gas-exchange questions.', q.igBio([6, 18, 21, 26])),
      group('topic_igcse_bio_reproduction', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/078_more_biology_questions.sql'], ['IGCSE Biology', 'Reproduction'], 'Reviewed gamete formation, fertilisation and placenta questions.', q.igBio([11, 36, 37])),
      group('topic_igcse_bio_genetics', ['database/migrations/archive/077_seed_oalevel_questions.sql'], ['IGCSE Biology'], 'Reviewed chromosome, inheritance and variation/natural-selection questions.', q.igBio([8, 12, 23])),
      group('topic_igcse_bio_ecology', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/078_more_biology_questions.sql'], ['IGCSE Biology', 'Ecology'], 'Reviewed food-chain, trophic-energy, producer, carbon-cycle and biodiversity questions.', q.igBio([24, 25, 38, 39, 40])),
    ],
  },
  {
    subjectId: 'subj_igcse_math',
    subjectName: 'Mathematics',
    syllabusCode: '0580',
    expectedQuestionCount: 40,
    sourceFiles: ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/080_more_maths_questions.sql'],
    mappingGroups: [
      group('topic_igcse_math_number', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/080_more_maths_questions.sql'], ['IGCSE Mathematics', 'Number'], 'Reviewed standard form, percentages, proportion, powers, factors, multiples and fraction questions.', q.igMath([14, 15, 16, 20, 21, 22, 23, 24, 25])),
      group('topic_igcse_math_algebra', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/080_more_maths_questions.sql'], ['IGCSE Mathematics', 'Algebra'], 'Reviewed expressions, equations, sequences, quadratics and inequalities questions.', q.igMath([1, 2, 3, 4, 5, 17, 26, 27, 28, 29])),
      group('topic_igcse_math_functions', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/080_more_maths_questions.sql'], ['IGCSE Mathematics', 'Algebra'], 'Reviewed linear-graph gradient and equation questions.', q.igMath([6, 30])),
      group('topic_igcse_math_geometry', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/080_more_maths_questions.sql'], ['IGCSE Mathematics', 'Geometry'], 'Reviewed triangle/polygon angle and regular-polygon questions.', q.igMath([18, 19, 31, 32, 33])),
      group('topic_igcse_math_mensuration', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/080_more_maths_questions.sql'], ['IGCSE Mathematics', 'Mensuration'], 'Reviewed area, circumference, volume and surface-area questions.', q.igMath([7, 8, 9, 34, 35, 36])),
      group('topic_igcse_math_trig', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/080_more_maths_questions.sql'], ['IGCSE Mathematics', 'Trigonometry'], 'Reviewed trigonometric-ratio and Pythagoras questions.', q.igMath([10, 11, 37, 38])),
      group('topic_igcse_math_stats', ['database/migrations/archive/077_seed_oalevel_questions.sql', 'database/migrations/archive/080_more_maths_questions.sql'], ['IGCSE Mathematics', 'Statistics and Probability'], 'Reviewed mean, median and probability questions.', q.igMath([12, 13, 39, 40])),
    ],
  },
  {
    subjectId: 'subj_igcse_add_math',
    subjectName: 'Additional Mathematics',
    syllabusCode: '0606',
    expectedQuestionCount: 55,
    sourceFiles: ['database/migrations/archive/083_igcse_add_math_questions.sql'],
    mappingGroups: [
      group('topic_igcse_addmath_quadratics', ['database/migrations/archive/083_igcse_add_math_questions.sql'], ['Quadratic Functions & Equations', 'Inequalities', 'Additional Questions'], 'Reviewed quadratics, inequalities, simultaneous-equation and polynomial-root questions.', q.igAdd([...inclusive(1, 7), 55])),
      group('topic_igcse_addmath_functions', ['database/migrations/archive/083_igcse_add_math_questions.sql'], ['Functions'], 'Contiguous reviewed composition, inverse, modulus and range source block.', q.igAdd(inclusive(8, 12))),
      group('topic_igcse_addmath_logs', ['database/migrations/archive/083_igcse_add_math_questions.sql'], ['Logarithms and Exponentials'], 'Contiguous reviewed logarithm and exponential source block.', q.igAdd(inclusive(13, 18))),
      group('topic_igcse_addmath_trig', ['database/migrations/archive/083_igcse_add_math_questions.sql'], ['Trigonometry', 'Additional Questions'], 'Reviewed radians, identities, equations, exact values and double-angle questions.', q.igAdd([...inclusive(19, 24), 50, 54])),
      group('topic_igcse_addmath_coord', ['database/migrations/archive/083_igcse_add_math_questions.sql'], ['Coordinate Geometry'], 'Reviewed circle equation, tangent and coordinate-geometry source block.', q.igAdd(inclusive(25, 28))),
      group('topic_igcse_addmath_differentiation', ['database/migrations/archive/083_igcse_add_math_questions.sql'], ['Coordinate Geometry', 'Calculus - Differentiation', 'Additional Questions'], 'Reviewed normal/tangent, derivative, stationary-point, rate-of-change and optimisation questions.', q.igAdd([...inclusive(29, 36), 51, 53])),
      group('topic_igcse_addmath_integration', ['database/migrations/archive/083_igcse_add_math_questions.sql'], ['Calculus - Integration', 'Additional Questions'], 'Reviewed indefinite, definite, substitution, area and integration-by-parts questions.', q.igAdd([...inclusive(37, 41), 52])),
    ],
  },
];

const alevelSubjects = [
  {
    subjectId: 'subj_alevel_physics', subjectName: 'Physics', syllabusCode: '9702', expectedQuestionCount: 40,
    sourceFiles: ['database/migrations/archive/081_alevel_physics_questions.sql'],
    mappingGroups: [
      group('topic_alevel_phys_mechanics', ['database/migrations/archive/081_alevel_physics_questions.sql'], ['Mechanics'], 'Reviewed projectile, equilibrium and circular-motion questions.', q.alPhy([1, 2, 5])),
      group('topic_alevel_phys_waves', ['database/migrations/archive/081_alevel_physics_questions.sql'], ['Mechanics', 'Additional mechanics/oscillations'], 'Reviewed SHM, resonance, damping, superposition, diffraction and coherence questions.', q.alPhy([3, 4, 31, 32, 33, 34, 35])),
      group('topic_alevel_phys_fields', ['database/migrations/archive/081_alevel_physics_questions.sql'], ['Gravitational Fields', 'Electric Fields'], 'Reviewed gravitational/electric field, potential and orbital questions.', q.alPhy(inclusive(6, 10))),
      group('topic_alevel_phys_em', ['database/migrations/archive/081_alevel_physics_questions.sql'], ['Capacitance', 'Magnetic Fields'], 'Reviewed capacitor, magnetic-force and electromagnetic-induction questions.', q.alPhy(inclusive(11, 16))),
      group('topic_alevel_phys_quantum', ['database/migrations/archive/081_alevel_physics_questions.sql'], ['Waves and Quantum', 'Nuclear Physics'], 'Reviewed matter-wave, photoelectric, radioactivity and nuclear-energy questions.', q.alPhy(inclusive(17, 25))),
      group('topic_alevel_phys_thermal', ['database/migrations/archive/081_alevel_physics_questions.sql'], ['Thermodynamics'], 'Contiguous reviewed thermodynamics and ideal-gas source block.', q.alPhy(inclusive(26, 28))),
    ],
  },
  {
    subjectId: 'subj_alevel_chemistry', subjectName: 'Chemistry', syllabusCode: '9701', expectedQuestionCount: 40,
    sourceFiles: ['database/migrations/archive/082_alevel_chemistry_questions.sql'],
    mappingGroups: [
      group('topic_alevel_chem_atomic', ['database/migrations/archive/082_alevel_chemistry_questions.sql'], ['Atomic Structure', 'Bonding'], 'Reviewed electron configuration, ionisation energy, molecular shape, Lewis-acid and hybridisation questions.', q.alChem(inclusive(1, 5))),
      group('topic_alevel_chem_physical', ['database/migrations/archive/082_alevel_chemistry_questions.sql'], ['Energetics', 'Kinetics', 'Equilibria', 'Acids and Bases', 'Entropy'], 'Reviewed enthalpy, kinetics, equilibrium, pH, buffer and spontaneity questions.', q.alChem([...inclusive(6, 16), 40])),
      group('topic_alevel_chem_redox', ['database/migrations/archive/082_alevel_chemistry_questions.sql'], ['Electrochemistry'], 'Reviewed cell-potential and electrolysis questions.', q.alChem([17, 18])),
      group('topic_alevel_chem_inorganic', ['database/migrations/archive/082_alevel_chemistry_questions.sql'], ['Transition Metals', 'Period 3', 'Group 17'], 'Reviewed transition-metal, periodicity and halogen questions.', q.alChem([19, 20, 21, 36, 37, 38, 39])),
      group('topic_alevel_chem_organic', ['database/migrations/archive/082_alevel_chemistry_questions.sql'], ['Organic Mechanisms', 'Carbonyl Compounds', 'Carboxylic Acids', 'Amines', 'Polymers'], 'Reviewed organic mechanism, functional-group and polymer questions.', q.alChem(inclusive(22, 32))),
      group('topic_alevel_chem_analysis', ['database/migrations/archive/082_alevel_chemistry_questions.sql'], ['Analytical Techniques'], 'Contiguous reviewed mass-spectrometry, IR and NMR source block.', q.alChem(inclusive(33, 35))),
    ],
  },
  {
    subjectId: 'subj_alevel_biology', subjectName: 'Biology', syllabusCode: '9700', expectedQuestionCount: 40,
    sourceFiles: ['database/migrations/archive/083_alevel_biology_questions.sql'],
    mappingGroups: [
      group('topic_alevel_bio_cells', ['database/migrations/archive/083_alevel_biology_questions.sql'], ['Cell Structure and Ultrastructure', 'Biological Molecules', 'Cell Division'], 'Reviewed organelle, microscopy, protein, enzyme and mitosis questions.', q.alBio([1, 2, 3, 4, 5, 6, 7, 10])),
      group('topic_alevel_bio_membranes', ['database/migrations/archive/083_alevel_biology_questions.sql'], ['Gas Exchange'], 'Reviewed haemoglobin oxygen-transport and Bohr-effect questions.', q.alBio([13, 14])),
      group('topic_alevel_bio_metabolism', ['database/migrations/archive/083_alevel_biology_questions.sql'], ['Photosynthesis', 'Respiration'], 'Reviewed light-dependent, Calvin-cycle, NAD and ATP-yield questions.', q.alBio(inclusive(33, 36))),
      group('topic_alevel_bio_genetics', ['database/migrations/archive/083_alevel_biology_questions.sql'], ['Nucleic Acids', 'Cell Division', 'Genetics and Inheritance', 'Evolution'], 'Reviewed DNA/RNA, meiosis, transcription, inheritance, selection, drift and speciation questions.', q.alBio([8, 9, 11, 12, 15, 16, 17, 18, 30, 31, 32])),
      group('topic_alevel_bio_homeostasis', ['database/migrations/archive/083_alevel_biology_questions.sql'], ['Homeostasis', 'Nervous System'], 'Reviewed glucose/osmotic control, kidney and neuronal-control questions.', q.alBio(inclusive(19, 24))),
      group('topic_alevel_bio_biotech', ['database/migrations/archive/083_alevel_biology_questions.sql'], ['Biotechnology'], 'Contiguous reviewed PCR, electrophoresis, restriction-enzyme and CRISPR source block.', q.alBio(inclusive(37, 40))),
    ],
  },
  {
    subjectId: 'subj_alevel_math', subjectName: 'Mathematics', syllabusCode: '9709', expectedQuestionCount: 55,
    sourceFiles: ['database/migrations/archive/082_alevel_mathematics_questions.sql'],
    mappingGroups: [
      group('topic_alevel_math_algebra', ['database/migrations/archive/082_alevel_mathematics_questions.sql'], ['Algebra & Functions', 'Further Algebra'], 'Reviewed quadratics, polynomials, functions and partial-fraction questions.', q.alMath([...inclusive(1, 8), 27])),
      group('topic_alevel_math_coord', ['database/migrations/archive/082_alevel_mathematics_questions.sql'], ['Coordinate Geometry'], 'Contiguous reviewed straight-line and circle source block.', q.alMath(inclusive(9, 12))),
      group('topic_alevel_math_sequences', ['database/migrations/archive/082_alevel_mathematics_questions.sql'], ['Further Algebra'], 'Reviewed generalized binomial-expansion source question.', q.alMath([28])),
      group('topic_alevel_math_trig', ['database/migrations/archive/082_alevel_mathematics_questions.sql'], ['Trigonometry', 'Additional Pure Mathematics'], 'Reviewed radians, identities, equations and trigonometric differentiation questions.', q.alMath([13, 14, 15, 16, 53])),
      group('topic_alevel_math_logs', ['database/migrations/archive/082_alevel_mathematics_questions.sql'], ['Further Algebra'], 'Reviewed logarithm and exponential questions.', q.alMath([29, 30])),
      group('topic_alevel_math_calculus', ['database/migrations/archive/082_alevel_mathematics_questions.sql'], ['Calculus (Differentiation)', 'Calculus (Integration)', 'Additional Pure Mathematics'], 'Reviewed differentiation, integration and area questions.', q.alMath([...inclusive(17, 26), 54, 55])),
      group('topic_alevel_math_vectors', ['database/migrations/archive/082_alevel_mathematics_questions.sql'], ['Vectors'], 'Contiguous reviewed three-dimensional vector source block.', q.alMath(inclusive(33, 36))),
      group('topic_alevel_math_mechanics', ['database/migrations/archive/082_alevel_mathematics_questions.sql'], ['Mechanics - Kinematics', 'Mechanics - Forces and Newtons Laws'], 'Reviewed kinematics, force, friction, connected-particle and equilibrium questions.', q.alMath(inclusive(37, 44))),
      group('topic_alevel_math_stats', ['database/migrations/archive/082_alevel_mathematics_questions.sql'], ['Statistics - Probability', 'Statistics - Distributions'], 'Reviewed probability, binomial, normal and Poisson-distribution questions.', q.alMath(inclusive(45, 52))),
    ],
  },
  {
    subjectId: 'subj_alevel_further_math', subjectName: 'Further Mathematics', syllabusCode: '9231', expectedQuestionCount: 55,
    sourceFiles: ['database/migrations/archive/084_alevel_further_math_questions.sql'],
    mappingGroups: [
      group('topic_alevel_fmath_complex', ['database/migrations/archive/084_alevel_further_math_questions.sql'], ['Complex Numbers'], 'Contiguous reviewed complex-number source block.', q.alFurther(inclusive(1, 8))),
      group('topic_alevel_fmath_matrices', ['database/migrations/archive/084_alevel_further_math_questions.sql'], ['Matrices'], 'Contiguous reviewed matrices and linear-transformations source block.', q.alFurther(inclusive(9, 14))),
      group('topic_alevel_fmath_polar', ['database/migrations/archive/084_alevel_further_math_questions.sql'], ['Polar Coordinates', 'Hyperbolic Functions'], 'Reviewed polar-coordinate and hyperbolic-function questions.', q.alFurther(inclusive(15, 22))),
      group('topic_alevel_fmath_diffeq', ['database/migrations/archive/084_alevel_further_math_questions.sql'], ['Differential Equations'], 'Contiguous reviewed differential-equations source block.', q.alFurther(inclusive(23, 27))),
      group('topic_alevel_fmath_mechanics', ['database/migrations/archive/084_alevel_further_math_questions.sql'], ['Circular Motion', 'Simple Harmonic Motion'], 'Reviewed further circular-motion and SHM questions.', q.alFurther(inclusive(28, 33))),
      group('topic_alevel_fmath_stats', ['database/migrations/archive/084_alevel_further_math_questions.sql'], ['Probability Distributions'], 'Contiguous reviewed probability-distributions source block.', q.alFurther(inclusive(34, 37))),
    ],
  },
];

const exceptionGroups = [
  exceptionGroup('subj_igcse_chemistry', 'database/migrations/archive/077_seed_oalevel_questions.sql', 'IGCSE Chemistry', 'qualitative gas analysis', q.igChem([6, 20])),
  exceptionGroup('subj_igcse_chemistry', 'database/migrations/archive/077_seed_oalevel_questions.sql', 'IGCSE Chemistry', 'electrolysis', q.igChem([8])),
  exceptionGroup('subj_igcse_chemistry', 'database/migrations/archive/079_more_chemistry_questions.sql', 'Acids, Bases and Salts', 'qualitative gas analysis', q.igChem([27])),
  exceptionGroup('subj_igcse_chemistry', 'database/migrations/archive/079_more_chemistry_questions.sql', 'Electrolysis', 'electrolysis', q.igChem([31, 32])),
  exceptionGroup('subj_igcse_biology', 'database/migrations/archive/077_seed_oalevel_questions.sql', 'IGCSE Biology', 'movement of substances across membranes', q.igBio([7, 16])),
  exceptionGroup('subj_igcse_biology', 'database/migrations/archive/077_seed_oalevel_questions.sql', 'IGCSE Biology', 'homeostasis and hormonal control', q.igBio([22])),
  exceptionGroup('subj_igcse_biology', 'database/migrations/archive/078_more_biology_questions.sql', 'Excretion and Homeostasis', 'excretion and homeostasis', q.igBio([31, 32, 33])),
  exceptionGroup('subj_igcse_biology', 'database/migrations/archive/078_more_biology_questions.sql', 'Nervous System', 'coordination and response', q.igBio([34, 35])),
  exceptionGroup('subj_igcse_add_math', 'database/migrations/archive/083_igcse_add_math_questions.sql', 'Binomial Theorem', 'the binomial theorem', q.igAdd(inclusive(42, 45))),
  exceptionGroup('subj_igcse_add_math', 'database/migrations/archive/083_igcse_add_math_questions.sql', 'Sequences and Series', 'sequences and series', q.igAdd(inclusive(46, 49))),
  exceptionGroup('subj_alevel_physics', 'database/migrations/archive/081_alevel_physics_questions.sql', 'Medical Physics / Imaging', 'medical imaging', q.alPhy([29, 30])),
  exceptionGroup('subj_alevel_physics', 'database/migrations/archive/081_alevel_physics_questions.sql', 'Particle Physics', 'particle physics', q.alPhy(inclusive(36, 40))),
  exceptionGroup('subj_alevel_biology', 'database/migrations/archive/083_alevel_biology_questions.sql', 'Immunity', 'immunity', q.alBio(inclusive(25, 27))),
  exceptionGroup('subj_alevel_biology', 'database/migrations/archive/083_alevel_biology_questions.sql', 'Ecology', 'ecosystem energy transfer and nutrient cycles', q.alBio([28, 29])),
  exceptionGroup('subj_alevel_math', 'database/migrations/archive/082_alevel_mathematics_questions.sql', 'Differential Equations', 'differential equations', q.alMath([31, 32])),
  exceptionGroup('subj_alevel_further_math', 'database/migrations/archive/084_alevel_further_math_questions.sql', 'Summation of Series', 'summation of series', q.alFurther(inclusive(38, 41))),
  exceptionGroup('subj_alevel_further_math', 'database/migrations/archive/084_alevel_further_math_questions.sql', 'Proof by Induction', 'proof by induction', q.alFurther([42, 43])),
  exceptionGroup('subj_alevel_further_math', 'database/migrations/archive/084_alevel_further_math_questions.sql', 'Roots of Polynomials', 'roots of polynomials', q.alFurther(inclusive(44, 47))),
  exceptionGroup('subj_alevel_further_math', 'database/migrations/archive/084_alevel_further_math_questions.sql', 'Vectors in 3D', 'three-dimensional vectors', q.alFurther(inclusive(48, 50))),
  exceptionGroup('subj_alevel_further_math', 'database/migrations/archive/084_alevel_further_math_questions.sql', 'Additional Questions', 'Maclaurin series and advanced integration techniques', q.alFurther(inclusive(51, 55))),
];

const familyForSubject = (subjectId) => subjectId.startsWith('subj_igcse_') ? 'cambridge-igcse' : 'cambridge-a-level';

function buildExceptionLedger() {
  const exceptions = exceptionGroups.flatMap((entry) => entry.questionIds.map((questionId) => ({
    questionId,
    examFamily: familyForSubject(entry.subjectId),
    subjectId: entry.subjectId,
    sourceFile: entry.sourceFile,
    sourceSection: entry.sourceSection,
    reasonCode: entry.reasonCode,
    missingConcept: entry.missingConcept,
    reason: entry.reason,
    requiredTaxonomyAction: entry.requiredTaxonomyAction,
    reviewStatus: entry.reviewStatus,
  }))).sort((left, right) => left.questionId.localeCompare(right.questionId));
  return {
    release: RELEASE,
    taxonomySource: TAXONOMY_SOURCE,
    reviewPolicy: 'Rows remain unmapped when the reviewed source concept has no exact same-subject topic; no text-only or nearest-topic guessing is allowed.',
    expectedExceptionCount: exceptions.length,
    familyCounts: Object.fromEntries(['cambridge-igcse', 'cambridge-a-level'].map((family) => [family, exceptions.filter((row) => row.examFamily === family).length])),
    subjectCounts: Object.fromEntries([...new Set(exceptions.map((row) => row.subjectId))].sort().map((subjectId) => [subjectId, exceptions.filter((row) => row.subjectId === subjectId).length])),
    exceptions,
  };
}

function buildFamilyManifest(examFamily, examTypeId, syllabusBoard, subjects) {
  const ledger = buildExceptionLedger();
  const builtSubjects = subjects.map((subject) => {
    const mappedQuestionIds = subject.mappingGroups.flatMap((entry) => entry.questionIds).sort();
    const exceptionIds = ledger.exceptions.filter((row) => row.subjectId === subject.subjectId).map((row) => row.questionId).sort();
    const topicCounts = Object.fromEntries(subject.mappingGroups.map((entry) => [entry.topicId, entry.questionIds.length]));
    return {
      ...subject,
      mappedQuestionCount: mappedQuestionIds.length,
      exceptionCount: exceptionIds.length,
      topicCounts,
      mappedQuestionIds,
      exceptionQuestionIds: exceptionIds,
    };
  });
  const expectedNullTopicCohort = builtSubjects.reduce((sum, subject) => sum + subject.expectedQuestionCount, 0);
  const mappedQuestionCount = builtSubjects.reduce((sum, subject) => sum + subject.mappedQuestionCount, 0);
  const exceptionCount = builtSubjects.reduce((sum, subject) => sum + subject.exceptionCount, 0);
  return {
    release: RELEASE,
    examFamily,
    examTypeId,
    syllabusBoard,
    taxonomySource: TAXONOMY_SOURCE,
    scopeRule: 'Question identity is derived from the reviewed archive source files and canonical subject IDs. Legacy rows that omit questions.exam_type_id remain in-family through their subject identity.',
    mappingPolicy: 'Map only when reviewed source section and assessed concept agree with one existing same-subject topic. Otherwise record a reviewed exception.',
    expectedNullTopicCohort,
    mappedQuestionCount,
    exceptionCount,
    subjects: builtSubjects,
  };
}

function buildArtifacts() {
  return {
    [IGCSE_MANIFEST]: buildFamilyManifest('cambridge-igcse', 'igcse', 'Cambridge International', igcseSubjects),
    [ALEVEL_MANIFEST]: buildFamilyManifest('cambridge-a-level', 'cambridge_a2', 'Cambridge International', alevelSubjects),
    [EXCEPTION_LEDGER]: buildExceptionLedger(),
  };
}

function writeArtifacts() {
  const artifacts = buildArtifacts();
  for (const [relativePath, payload] of Object.entries(artifacts)) {
    fs.mkdirSync(path.dirname(path.join(ROOT, relativePath)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, relativePath), `${JSON.stringify(payload, null, 2)}\n`);
  }
  return Object.keys(artifacts);
}

if (require.main === module) {
  if (process.argv.includes('--write')) {
    process.stdout.write(`${JSON.stringify({ written: writeArtifacts() }, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(buildArtifacts(), null, 2)}\n`);
  }
}

module.exports = {
  ALEVEL_MANIFEST,
  EXCEPTION_LEDGER,
  IGCSE_MANIFEST,
  RELEASE,
  TAXONOMY_SOURCE,
  buildArtifacts,
  buildExceptionLedger,
  buildFamilyManifest,
  writeArtifacts,
};
