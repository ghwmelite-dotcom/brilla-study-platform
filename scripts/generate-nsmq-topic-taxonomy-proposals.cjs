'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildLiveAudit, LIVE_ONLY } = require('./generate-nsmq-live-topic-remediation.cjs');

const ROOT = path.join(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'database', 'manifests', 'nsmq-topic-remediation', 'taxonomy-proposals.json');

const PROPOSALS = [
  {
    subjectId: 'subj_nsmq_math', proposedTopicId: 'topic_nsmq_math_general_reasoning', proposedName: 'General Reasoning', roundScope: ['riddles'],
    affectedQuestionIds: ['nsmq_math_rid_002', 'nsmq_math_rid_003', 'nsmq_math_rid_004', 'nsmq_math_rid_009', 'nsmq_math_rid_010', 'nsmq_math_rid_011', 'nsmq_math_rid_012', 'nsmq_math_rid_013'],
    rationale: 'These Mathematics-owned Riddle rows assess lateral, constraint-based or word reasoning rather than Algebra, Geometry, Trigonometry, Calculus or Statistics. A Riddle-bounded General Reasoning topic is more truthful than forcing an academic topic.',
  },
  {
    subjectId: 'subj_nsmq_math', proposedTopicId: 'topic_nsmq_math_numeration', proposedName: 'Numeration & Number Systems', roundScope: ['riddles', 'speed_race'],
    affectedQuestionIds: ['nsmq_math_rid_015', 'nsmq_math_sr_022'],
    rationale: 'Number-word representation and Roman numerals are explicit, coherent Mathematics content but are absent from the current taxonomy.',
  },
  {
    subjectId: 'subj_nsmq_math', proposedTopicId: 'topic_nsmq_math_sets', proposedName: 'Sets', roundScope: ['true_false'],
    affectedQuestionIds: ['nsmq_math_tf_020'],
    rationale: 'The item explicitly assesses the empty-set subset rule; none of the current Mathematics topics represents set theory.',
  },
  {
    subjectId: 'subj_nsmq_chemistry', proposedTopicId: 'topic_nsmq_chem_environmental', proposedName: 'Environmental Chemistry', roundScope: ['round_one'],
    affectedQuestionIds: ['nsmq_chem_r1_019'],
    rationale: 'The item explicitly assesses carbon dioxide as a greenhouse gas; Environmental Chemistry avoids misclassifying it as Atomic Structure or Stoichiometry.',
  },
];

const EXISTING_TOPIC_RESOLUTIONS = [
  {
    questionId: 'nsmq_phy_rid_012', subjectId: 'subj_nsmq_physics', topicId: 'topic_thermodynamics',
    rationale: 'The clues “hot,” “cold,” and molecular speed make temperature and thermal energy the dominant assessed concept; Thermodynamics is an existing same-subject topic.',
  },
];

const RESOLVED_WITH_EXCEPTIONS = [
  {
    questionId: 'nsmq_phy_rid_001', subjectId: 'subj_nsmq_physics', roundType: 'riddles', reasonCode: 'misclassified_general_riddle',
    disposition: 'pending_separate_general_reasoning_bank',
    rationale: 'The postage-stamp answer is general wordplay with no Physics signal. Creating a Physics topic for it would mislead students; retain it as an explicit reviewed exception until a separate general-reasoning bank exists.',
  },
  {
    questionId: 'nsmq_phy_rid_003', subjectId: 'subj_nsmq_physics', roundType: 'riddles', reasonCode: 'misclassified_general_riddle',
    disposition: 'pending_separate_general_reasoning_bank',
    rationale: 'The footsteps answer is lateral wordplay with no Physics signal. Creating a Physics topic for it would mislead students; retain it as an explicit reviewed exception until a separate general-reasoning bank exists.',
  },
];

const CONTENT_CORRECTIONS = [
  {
    questionId: 'nsmq_math_rid_012', subjectId: 'subj_nsmq_math', roundType: 'riddles', proposedTopicId: 'topic_nsmq_math_general_reasoning',
    derivation: 'Let the last digit be d. The digits are 3d, 3d-1, 2d, d. Since the first digit is nonzero and at most 9, d is 1, 2 or 3. d=1 repeats 2; d=2 gives 6542; d=3 gives 9863.',
    changes: [
      { field: 'question_text', before: 'I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What number am I?', after: 'I am a 4-digit number. All my digits are different. My first digit is 3 times my last digit. My second digit is one less than my first. My third digit is double my last digit. What numbers can I be?' },
      { field: 'correct_answer', before: '3624', after: '6542 or 9863' },
      { field: 'explanation', before: 'Last=2, First=6, no wait... Let me recalculate: 3×1=3, 3-1=2, 2×1=2, last=1 → but not 4 digits. Try: 6521 (6=3×2, 5=6-1, 2=2×1, 1). Actually: 3624', after: 'Let the last digit be d, so the digits are 3d, 3d−1, 2d, d. The only possible last digits are 1, 2, and 3. When d=1, the digit 2 repeats, so it is invalid. When d=2, the number is 6542; when d=3, the number is 9863. Both satisfy every stated constraint.' },
    ],
    evidence: 'The complete finite digit search proves two solutions. The prompt is pluralized so the corrected answer is complete without adding or silently changing a constraint.',
  },
];

function deriveDigitSolutions() {
  const solutions = [];
  for (let last = 0; last <= 9; last += 1) {
    const digits = [3 * last, 3 * last - 1, 2 * last, last];
    if (digits[0] < 1 || digits.some((digit) => digit < 0 || digit > 9) || new Set(digits).size !== 4) continue;
    solutions.push(Number(digits.join('')));
  }
  return solutions;
}

function buildProposal() {
  const audit = buildLiveAudit();
  const exceptions = new Map(audit.exceptionLedger.exceptions.map((row) => [row.questionId, row]));
  const proposalIds = PROPOSALS.flatMap((row) => row.affectedQuestionIds);
  const existingIds = EXISTING_TOPIC_RESOLUTIONS.map((row) => row.questionId);
  const reviewedExceptionIds = RESOLVED_WITH_EXCEPTIONS.map((row) => row.questionId);
  const finalIds = [...proposalIds, ...existingIds, ...reviewedExceptionIds];
  if (finalIds.length !== audit.exceptionLedger.exceptionCount || new Set(finalIds).size !== finalIds.length) throw new Error('Final proposal must cover each current exception exactly once');
  for (const id of finalIds) if (!exceptions.has(id)) throw new Error(`Final proposal references non-exception ${id}`);
  for (const proposal of PROPOSALS) for (const id of proposal.affectedQuestionIds) {
    const exception = exceptions.get(id);
    if (exception.subjectId !== proposal.subjectId || !proposal.roundScope.includes(exception.roundType)) throw new Error(`Subject/round proposal drift for ${id}`);
  }
  for (const reviewed of RESOLVED_WITH_EXCEPTIONS) {
    const exception = exceptions.get(reviewed.questionId);
    if (exception.subjectId !== reviewed.subjectId || exception.roundType !== reviewed.roundType || reviewed.reasonCode !== 'misclassified_general_riddle') throw new Error(`Reviewed-exception drift for ${reviewed.questionId}`);
  }
  if (PROPOSALS.some((proposal) => proposal.subjectId === 'subj_nsmq_physics' && /general.reasoning/i.test(proposal.proposedTopicId))) throw new Error('General-reasoning riddles must not be placed in the Physics taxonomy');
  if (JSON.stringify(deriveDigitSolutions()) !== JSON.stringify([6542, 9863])) throw new Error('Digit-constraint derivation drift');
  const correction = CONTENT_CORRECTIONS[0];
  if (correction.changes.find((change) => change.field === 'correct_answer').after !== deriveDigitSolutions().join(' or ')) throw new Error('Corrected answer does not contain the complete solution set');

  return {
    release: audit.summary.release,
    status: 'proposal-only-final-dispositions-no-migrations',
    authoritativeInventoryCount: 375,
    existingTopicMappingCount: audit.summary.mappedCount,
    currentExceptionCount: audit.exceptionLedger.exceptionCount,
    proposedNewTopicCount: PROPOSALS.length,
    rowsCoveredByProposedTopics: proposalIds.length,
    rowsResolvedByExistingTopicAfterReview: existingIds.length,
    correctedContentMappingCount: CONTENT_CORRECTIONS.length,
    resolvedWithExceptionCount: reviewedExceptionIds.length,
    finalDefensibleDispositionCount: audit.summary.mappedCount + finalIds.length,
    unresolvedDispositionCount: 0,
    proposals: PROPOSALS,
    existingTopicResolutions: EXISTING_TOPIC_RESOLUTIONS,
    resolvedWithExceptions: RESOLVED_WITH_EXCEPTIONS,
    contentCorrections: CONTENT_CORRECTIONS,
    liveOnlyRowsRecoveredWithoutTaxonomyAddition: LIVE_ONLY,
    migrationArtifactsCreated: false,
    sourceContentMutated: false,
  };
}

function main() {
  const check = process.argv.includes('--check');
  const content = `${JSON.stringify(buildProposal(), null, 2)}\n`;
  if (check) {
    if (!fs.existsSync(OUT_FILE) || fs.readFileSync(OUT_FILE, 'utf8') !== content) throw new Error(`Generated proposal drift: ${path.relative(ROOT, OUT_FILE)}`);
  } else {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, content);
  }
  process.stdout.write(content);
}

if (require.main === module) main();

module.exports = { CONTENT_CORRECTIONS, EXISTING_TOPIC_RESOLUTIONS, PROPOSALS, RESOLVED_WITH_EXCEPTIONS, buildProposal, deriveDigitSolutions };
