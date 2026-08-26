'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  EXCEPTION_LEDGER,
  buildArtifacts: buildBaselineArtifacts,
} = require('./generate-cambridge-topic-remediation.cjs');

const ROOT = path.resolve(__dirname, '..');
const RELEASE = 'cambridge-topic-taxonomy-proposal-2026-08-26';
const PROPOSAL_MANIFEST = 'database/manifests/cambridge_topic_taxonomy_proposals.json';

const sourceDocuments = {
  igcseChemistry: {
    title: 'Cambridge IGCSE Chemistry 0620 syllabus for 2026, 2027 and 2028',
    url: 'https://www.cambridgeinternational.org/Images/697205-2026-2028-syllabus.pdf',
  },
  igcseBiology: {
    title: 'Cambridge IGCSE Biology 0610 syllabus for 2026, 2027 and 2028',
    url: 'https://www.cambridgeinternational.org/Images/697203-2026-2028-syllabus.pdf',
  },
  igcseAdditionalMathematics: {
    title: 'Cambridge IGCSE Additional Mathematics 0606 syllabus for 2025, 2026 and 2027',
    url: 'https://www.cambridgeinternational.org/Images/662470-2025-2027-syllabus.pdf',
  },
  alevelPhysics: {
    title: 'Cambridge International AS & A Level Physics 9702 syllabus for 2025, 2026 and 2027',
    url: 'https://www.cambridgeinternational.org/Images/664565-2025-2027-syllabus.pdf',
  },
  alevelBiology: {
    title: 'Cambridge International AS & A Level Biology 9700 syllabus for 2025, 2026 and 2027',
    url: 'https://www.cambridgeinternational.org/Images/664560-2025-2027-syllabus.pdf',
  },
  alevelMathematics: {
    title: 'Cambridge International AS & A Level Mathematics 9709 syllabus for 2026 and 2027',
    url: 'https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf',
  },
  alevelFurtherMathematics: {
    title: 'Cambridge International AS & A Level Further Mathematics 9231 syllabus for 2026 and 2027',
    url: 'https://www.cambridgeinternational.org/Images/697357-2026-2027-syllabus.pdf',
  },
};

const ids = (prefix, values) => values.map((value) => `${prefix}${String(value).padStart(3, '0')}`);
const inclusive = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index);

function topic({ proposedTopicId, subjectId, examFamily, title, syllabusCode, syllabusSection, sourceDocument, rationale, questionIds, contentGateQuestionIds = [] }) {
  return {
    proposedTopicId,
    subjectId,
    examFamily,
    title,
    syllabusCode,
    syllabusSection,
    sourceDocument,
    rationale,
    questionIds: [...questionIds].sort(),
    contentGateQuestionIds: [...contentGateQuestionIds].sort(),
    status: contentGateQuestionIds.length ? 'taxonomy-proposed-content-gated' : 'taxonomy-proposed',
  };
}

const proposedTopics = [
  topic({
    proposedTopicId: 'topic_igcse_chem_electrolysis', subjectId: 'subj_igcse_chemistry', examFamily: 'cambridge-igcse', title: 'Electrolysis', syllabusCode: '0620', syllabusSection: '4.1 Electrolysis', sourceDocument: 'igcseChemistry',
    rationale: 'The official Chemistry syllabus names Electrolysis as a discrete content section, so these electrode-product questions do not require a broader inferred label.',
    questionIds: ids('q_igcse_chem_', [8, 31, 32]),
  }),
  topic({
    proposedTopicId: 'topic_igcse_chem_analysis', subjectId: 'subj_igcse_chemistry', examFamily: 'cambridge-igcse', title: 'Experimental Techniques and Chemical Analysis', syllabusCode: '0620', syllabusSection: '12 Experimental techniques and chemical analysis', sourceDocument: 'igcseChemistry',
    rationale: 'The official Chemistry syllabus includes qualitative analysis and tests for gases in this section.',
    questionIds: ids('q_igcse_chem_', [6, 20, 27]),
  }),
  topic({
    proposedTopicId: 'topic_igcse_bio_cell_transport', subjectId: 'subj_igcse_biology', examFamily: 'cambridge-igcse', title: 'Movement into and out of Cells', syllabusCode: '0610', syllabusSection: '3 Movement into and out of cells', sourceDocument: 'igcseBiology',
    rationale: 'Diffusion and osmosis are expressly grouped under the official Movement into and out of cells section.',
    questionIds: ids('q_igcse_bio_', [7, 16]),
  }),
  topic({
    proposedTopicId: 'topic_igcse_bio_excretion', subjectId: 'subj_igcse_biology', examFamily: 'cambridge-igcse', title: 'Excretion in Humans', syllabusCode: '0610', syllabusSection: '13 Excretion in humans', sourceDocument: 'igcseBiology',
    rationale: 'The official Biology syllabus has a discrete Excretion in humans section covering kidney and urea questions.',
    questionIds: ids('q_igcse_bio_', [31, 32, 33]),
  }),
  topic({
    proposedTopicId: 'topic_igcse_bio_coordination', subjectId: 'subj_igcse_biology', examFamily: 'cambridge-igcse', title: 'Coordination and Response', syllabusCode: '0610', syllabusSection: '14 Coordination and response', sourceDocument: 'igcseBiology',
    rationale: 'The official top-level section includes nervous control, hormones and homeostasis, matching all three reviewed rows without inventing narrower local topics.',
    questionIds: ids('q_igcse_bio_', [22, 34, 35]),
  }),
  topic({
    proposedTopicId: 'topic_igcse_addmath_series', subjectId: 'subj_igcse_add_math', examFamily: 'cambridge-igcse', title: 'Series', syllabusCode: '0606', syllabusSection: '12 Series', sourceDocument: 'igcseAdditionalMathematics',
    rationale: 'The official Series section contains arithmetic and geometric progressions and the binomial theorem assessed by this contiguous source block.',
    questionIds: ids('q_igcse_addmath_', inclusive(42, 49)),
  }),
  topic({
    proposedTopicId: 'topic_alevel_phys_medical', subjectId: 'subj_alevel_physics', examFamily: 'cambridge-a-level', title: 'Medical Physics', syllabusCode: '9702', syllabusSection: '24 Medical physics', sourceDocument: 'alevelPhysics',
    rationale: 'The official Physics syllabus names Medical physics as a discrete A Level topic.',
    questionIds: ids('q_alevel_phy_', [29, 30]),
  }),
  topic({
    proposedTopicId: 'topic_alevel_phys_particles', subjectId: 'subj_alevel_physics', examFamily: 'cambridge-a-level', title: 'Particle Physics', syllabusCode: '9702', syllabusSection: '11 Particle physics', sourceDocument: 'alevelPhysics',
    rationale: 'The official Physics syllabus names Particle physics as a discrete content topic matching the particle-model source block.',
    questionIds: ids('q_alevel_phy_', inclusive(36, 40)),
  }),
  topic({
    proposedTopicId: 'topic_alevel_bio_immunity', subjectId: 'subj_alevel_biology', examFamily: 'cambridge-a-level', title: 'Immunity', syllabusCode: '9700', syllabusSection: '11 Immunity', sourceDocument: 'alevelBiology',
    rationale: 'The official Biology syllabus expressly covers immune responses, antigens, memory cells and vaccination under Immunity.',
    questionIds: ids('q_alevel_bio_', [25, 26, 27]),
  }),
  topic({
    proposedTopicId: 'topic_alevel_math_diffeq', subjectId: 'subj_alevel_math', examFamily: 'cambridge-a-level', title: 'Differential Equations', syllabusCode: '9709', syllabusSection: '3.8 Differential equations', sourceDocument: 'alevelMathematics',
    rationale: 'The official Mathematics syllabus defines Differential equations as a discrete Pure Mathematics 3 section.',
    questionIds: ids('q_alevel_math_', [31, 32]),
  }),
  topic({
    proposedTopicId: 'topic_alevel_fmath_summation', subjectId: 'subj_alevel_further_math', examFamily: 'cambridge-a-level', title: 'Summation of Series', syllabusCode: '9231', syllabusSection: '1.3 Summation of series', sourceDocument: 'alevelFurtherMathematics',
    rationale: 'The official Further Mathematics syllabus separately names Summation of series.',
    questionIds: ids('q_alevel_fm_', inclusive(38, 41)),
  }),
  topic({
    proposedTopicId: 'topic_alevel_fmath_induction', subjectId: 'subj_alevel_further_math', examFamily: 'cambridge-a-level', title: 'Proof by Induction', syllabusCode: '9231', syllabusSection: '1.7 Proof by induction', sourceDocument: 'alevelFurtherMathematics',
    rationale: 'The official Further Mathematics syllabus separately names Proof by induction.',
    questionIds: ids('q_alevel_fm_', [42, 43]),
  }),
  topic({
    proposedTopicId: 'topic_alevel_fmath_polynomial_roots', subjectId: 'subj_alevel_further_math', examFamily: 'cambridge-a-level', title: 'Roots of Polynomial Equations', syllabusCode: '9231', syllabusSection: '1.1 Roots of polynomial equations', sourceDocument: 'alevelFurtherMathematics',
    rationale: 'The official Further Mathematics syllabus separately names Roots of polynomial equations.',
    questionIds: ids('q_alevel_fm_', inclusive(44, 47)),
  }),
  topic({
    proposedTopicId: 'topic_alevel_fmath_vectors', subjectId: 'subj_alevel_further_math', examFamily: 'cambridge-a-level', title: 'Vectors', syllabusCode: '9231', syllabusSection: '1.6 Vectors', sourceDocument: 'alevelFurtherMathematics',
    rationale: 'The official Vectors section covers vector products, planes and distances; q_alevel_fm_050 remains content-gated until its answer is corrected.',
    questionIds: ids('q_alevel_fm_', [48, 49, 50]), contentGateQuestionIds: ids('q_alevel_fm_', [50]),
  }),
  topic({
    proposedTopicId: 'topic_alevel_fmath_integration', subjectId: 'subj_alevel_further_math', examFamily: 'cambridge-a-level', title: 'Integration', syllabusCode: '9231', syllabusSection: '2.4 Integration', sourceDocument: 'alevelFurtherMathematics',
    rationale: 'The official Integration section explicitly covers arc lengths and reduction formulae.',
    questionIds: ids('q_alevel_fm_', [54, 55]),
  }),
];

const retainedExceptionDefinitions = {
  q_alevel_bio_028: {
    classification: 'out-of-current-syllabus-general-biology', sourceDocument: 'alevelBiology',
    rationale: 'Trophic-level energy transfer is general ecology content but is not a named content point in the current 9700 topic overview; creating a broad Ecology topic would overstate current-syllabus alignment.',
  },
  q_alevel_bio_029: {
    classification: 'out-of-current-syllabus-general-biology', sourceDocument: 'alevelBiology',
    rationale: 'The nitrogen cycle is general ecology content but is not a named content point in the current 9700 topic overview; no bounded current-syllabus topic supports it.',
  },
  q_alevel_fm_051: {
    classification: 'out-of-current-syllabus-additional-pure', sourceDocument: 'alevelFurtherMathematics',
    rationale: 'Maclaurin or Taylor series are not listed in the current 9231 content sections. A generic Additional Pure topic would not be an official syllabus topic.',
  },
  q_alevel_fm_052: {
    classification: 'out-of-current-syllabus-additional-pure', sourceDocument: 'alevelFurtherMathematics',
    rationale: 'Maclaurin or Taylor series are not listed in the current 9231 content sections. A generic Additional Pure topic would not be an official syllabus topic.',
  },
  q_alevel_fm_053: {
    classification: 'out-of-current-syllabus-additional-pure', sourceDocument: 'alevelFurtherMathematics',
    rationale: 'Improper integration with an infinite limit is not specified in the current 9231 Integration section, so this row remains supplemental rather than being forced into the official topic.',
  },
};

const contentCorrectionProposals = [
  {
    questionId: 'q_alevel_fm_050',
    sourceFile: 'database/migrations/archive/084_alevel_further_math_questions.sql',
    defect: 'incorrect-correct-answer',
    mappingGate: 'topic_alevel_fmath_vectors',
    before: {
      correctAnswer: '1 unit',
      explanation: 'd = |2(1) + 2(2) + 1(3) - 10|/√(4+4+1) = |2 + 4 + 3 - 10|/3 = |-1|/3 = 1/3... Actually: d = |9-10|/3 = 1/3',
    },
    after: {
      correctAnswer: '1/3 unit',
      explanation: 'For 2x + 2y + z - 10 = 0, d = |2(1) + 2(2) + 3 - 10|/√(2² + 2² + 1²) = |9 - 10|/3 = 1/3 unit.',
    },
    proof: 'The point-to-plane distance formula gives |Ax0 + By0 + Cz0 + D|/√(A²+B²+C²) = |2+4+3-10|/√9 = 1/3, not 1.',
    status: 'correction-proposed-not-applied',
  },
  {
    questionId: 'q_alevel_fm_051',
    sourceFile: 'database/migrations/archive/084_alevel_further_math_questions.sql',
    defect: 'duplicate-equivalent-options',
    mappingGate: null,
    before: {
      optionA: 'A. 1 + x + x²/2 + x³/6',
      optionD: 'D. 1 + x + x²/2! + x³/3!',
      correctAnswer: 'A',
    },
    after: {
      optionA: 'A. 1 + x + x²/2 + x³/6',
      optionD: 'D. 1 + x + x²/2 + x³/3',
      correctAnswer: 'A',
      explanation: 'Since eˣ = Σ(xⁿ/n!), its expansion through x³ is 1 + x + x²/2! + x³/3! = 1 + x + x²/2 + x³/6.',
    },
    proof: 'The original D is identical to A because 2! = 2 and 3! = 6. Replacing only D with a cubic coefficient of 1/3 restores one unambiguous correct option while preserving A.',
    status: 'correction-proposed-not-applied',
  },
];

function buildProposalManifest() {
  const baseline = buildBaselineArtifacts()[EXCEPTION_LEDGER];
  const exceptionById = new Map(baseline.exceptions.map((row) => [row.questionId, row]));
  const proposedMappings = proposedTopics.flatMap((entry) => entry.questionIds.map((questionId) => {
    const exception = exceptionById.get(questionId);
    if (!exception) throw new Error(`${questionId}: proposed mapping is not in the reviewed exception ledger`);
    if (exception.subjectId !== entry.subjectId || exception.examFamily !== entry.examFamily) throw new Error(`${questionId}: proposed topic crosses subject or exam family`);
    return {
      questionId,
      examFamily: entry.examFamily,
      subjectId: entry.subjectId,
      proposedTopicId: entry.proposedTopicId,
      status: entry.contentGateQuestionIds.includes(questionId) ? 'blocked-content-correction' : 'ready-after-taxonomy-approval',
    };
  })).sort((left, right) => left.questionId.localeCompare(right.questionId));
  const retainedExceptions = Object.entries(retainedExceptionDefinitions).map(([questionId, definition]) => {
    const exception = exceptionById.get(questionId);
    if (!exception) throw new Error(`${questionId}: retained exception is not in the reviewed exception ledger`);
    return { ...exception, ...definition, reviewStatus: 'reviewed-retained-exception' };
  }).sort((left, right) => left.questionId.localeCompare(right.questionId));
  const covered = [...proposedMappings.map((row) => row.questionId), ...retainedExceptions.map((row) => row.questionId)].sort();
  const expected = baseline.exceptions.map((row) => row.questionId).sort();
  if (new Set(covered).size !== covered.length || JSON.stringify(covered) !== JSON.stringify(expected)) throw new Error('Proposal and retained sets must cover the 54 reviewed exceptions exactly once');

  const familyCounts = Object.fromEntries(['cambridge-igcse', 'cambridge-a-level'].map((examFamily) => {
    const proposed = proposedMappings.filter((row) => row.examFamily === examFamily).length;
    const retained = retainedExceptions.filter((row) => row.examFamily === examFamily).length;
    const baselineMapped = examFamily === 'cambridge-igcse' ? 203 : 198;
    const sourceQuestions = examFamily === 'cambridge-igcse' ? 225 : 230;
    return [examFamily, { sourceQuestions, baselineMapped, proposedMappings: proposed, retainedExceptions: retained, projectedMappedAfterApprovalAndCorrections: baselineMapped + proposed }];
  }));
  const subjectCounts = Object.fromEntries([...new Set(baseline.exceptions.map((row) => row.subjectId))].sort().map((subjectId) => [subjectId, {
    proposedMappings: proposedMappings.filter((row) => row.subjectId === subjectId).length,
    retainedExceptions: retainedExceptions.filter((row) => row.subjectId === subjectId).length,
  }]));

  return {
    release: RELEASE,
    status: 'proposal-only-no-migration',
    policy: 'Add only bounded same-subject topics named by an official current Cambridge syllabus. Do not use generic General Reasoning, Additional Pure or Ecology buckets to conceal out-of-syllabus rows.',
    baseline: { sourceQuestionCount: 455, mappedQuestionCount: 401, exceptionCount: 54 },
    proposal: {
      topicCount: proposedTopics.length,
      mappingCount: proposedMappings.length,
      readyAfterTaxonomyApprovalCount: proposedMappings.filter((row) => row.status === 'ready-after-taxonomy-approval').length,
      contentGatedMappingCount: proposedMappings.filter((row) => row.status === 'blocked-content-correction').length,
      retainedExceptionCount: retainedExceptions.length,
      projectedMappedAfterApprovalAndCorrections: 401 + proposedMappings.length,
      projectedExceptionCount: retainedExceptions.length,
    },
    familyCounts,
    subjectCounts,
    sourceDocuments,
    proposedTopics,
    proposedMappings,
    retainedExceptions,
    contentCorrectionProposals,
  };
}

function writeArtifact() {
  const payload = buildProposalManifest();
  const target = path.join(ROOT, PROPOSAL_MANIFEST);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
  return PROPOSAL_MANIFEST;
}

if (require.main === module) {
  if (process.argv.includes('--write')) process.stdout.write(`${JSON.stringify({ written: writeArtifact() }, null, 2)}\n`);
  else process.stdout.write(`${JSON.stringify(buildProposalManifest(), null, 2)}\n`);
}

module.exports = {
  PROPOSAL_MANIFEST,
  RELEASE,
  buildProposalManifest,
  contentCorrectionProposals,
  proposedTopics,
  retainedExceptionDefinitions,
  sourceDocuments,
  writeArtifact,
};
