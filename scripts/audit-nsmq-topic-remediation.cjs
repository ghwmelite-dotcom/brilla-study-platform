'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const core = require('./generate-nsmq-topic-remediation.cjs');
const { LIVE_TOTAL, buildLiveAudit } = require('./generate-nsmq-live-topic-remediation.cjs');
const { buildProposal, deriveDigitSolutions } = require('./generate-nsmq-topic-taxonomy-proposals.cjs');

const ROOT = path.join(__dirname, '..');
const MANIFEST_DIR = path.join(ROOT, 'database', 'manifests', 'nsmq-topic-remediation');
const EXPECTED_SUBJECT_TOTALS = { subj_nsmq_biology: 86, subj_nsmq_chemistry: 86, subj_nsmq_math: 92, subj_nsmq_physics: 111 };

function audit() {
  const generated = buildLiveAudit();
  const proposal = buildProposal();
  const problems = [];
  for (const [file, expected] of Object.entries(core.renderFiles(generated))) {
    const target = path.join(MANIFEST_DIR, file);
    if (!fs.existsSync(target)) problems.push(`missing manifest ${path.relative(ROOT, target)}`);
    else if (fs.readFileSync(target, 'utf8') !== expected) problems.push(`manifest drift ${path.relative(ROOT, target)}`);
  }
  const proposalFile = path.join(MANIFEST_DIR, 'taxonomy-proposals.json');
  if (!fs.existsSync(proposalFile) || fs.readFileSync(proposalFile, 'utf8') !== `${JSON.stringify(proposal, null, 2)}\n`) problems.push('manifest drift database/manifests/nsmq-topic-remediation/taxonomy-proposals.json');

  const dispositions = [];
  for (const [subjectId, subject] of Object.entries(core.SUBJECTS)) {
    const manifest = generated.subjectManifests[subject.file];
    if (manifest.sourceNullTopicCount !== EXPECTED_SUBJECT_TOTALS[subjectId]) problems.push(`${subjectId} total ${manifest.sourceNullTopicCount}, expected ${EXPECTED_SUBJECT_TOTALS[subjectId]}`);
    dispositions.push(...manifest.mappings);
  }
  dispositions.push(...generated.exceptionLedger.exceptions);
  const ids = dispositions.map((row) => row.questionId);
  if (ids.length !== LIVE_TOTAL || new Set(ids).size !== LIVE_TOTAL) problems.push(`inventory cardinality rows=${ids.length}, unique=${new Set(ids).size}, expected=${LIVE_TOTAL}`);

  const proposalIds = proposal.proposals.flatMap((row) => row.affectedQuestionIds);
  const existingResolutionIds = proposal.existingTopicResolutions.map((row) => row.questionId);
  const reviewedExceptionIds = proposal.resolvedWithExceptions.map((row) => row.questionId);
  const finalExceptionDispositions = [...proposalIds, ...existingResolutionIds, ...reviewedExceptionIds];
  const currentExceptionIds = generated.exceptionLedger.exceptions.map((row) => row.questionId).sort();
  if (JSON.stringify([...finalExceptionDispositions].sort()) !== JSON.stringify(currentExceptionIds)) problems.push('final proposal does not cover every current exception exactly once');
  if (proposal.finalDefensibleDispositionCount !== LIVE_TOTAL || proposal.unresolvedDispositionCount !== 0) problems.push(`final dispositions=${proposal.finalDefensibleDispositionCount}, unresolved=${proposal.unresolvedDispositionCount}`);
  if (proposal.proposals.some((row) => row.subjectId === 'subj_nsmq_physics' && /general.reasoning/i.test(row.proposedTopicId))) problems.push('misleading Physics General Reasoning topic proposed');
  if (reviewedExceptionIds.length !== 2 || proposal.resolvedWithExceptions.some((row) => row.reasonCode !== 'misclassified_general_riddle')) problems.push('misclassified general-riddle exceptions drifted');

  const correction = proposal.contentCorrections.find((row) => row.questionId === 'nsmq_math_rid_012');
  if (!correction) problems.push('missing nsmq_math_rid_012 content correction');
  else {
    const db = new Database(':memory:');
    db.exec(fs.readFileSync(path.join(ROOT, 'database', 'schema.sql'), 'utf8'));
    db.exec(fs.readFileSync(path.join(ROOT, 'database', 'seed.sql'), 'utf8'));
    const source = db.prepare('SELECT question_text, correct_answer, explanation FROM questions WHERE id = ?').get(correction.questionId);
    db.close();
    for (const change of correction.changes) if (source[change.field] !== change.before) problems.push(`content-correction before-value drift ${correction.questionId}.${change.field}`);
    if (JSON.stringify(deriveDigitSolutions()) !== JSON.stringify([6542, 9863])) problems.push('digit-constraint solution derivation drift');
    if (correction.changes.find((change) => change.field === 'correct_answer')?.after !== '6542 or 9863') problems.push('content-correction answer is incomplete');
  }

  return {
    ok: problems.length === 0,
    release: generated.summary.release,
    inventory: LIVE_TOTAL,
    currentMapped: generated.summary.mappedCount,
    currentExceptions: generated.summary.exceptionCount,
    proposedTopicDispositions: proposal.rowsCoveredByProposedTopics,
    correctedContentMappings: proposal.correctedContentMappingCount,
    resolvedWithExceptions: proposal.resolvedWithExceptionCount,
    finalDefensibleDispositions: proposal.finalDefensibleDispositionCount,
    unresolvedDispositions: proposal.unresolvedDispositionCount,
    proposedTopics: proposal.proposedNewTopicCount,
    migrationArtifactsCreated: false,
    sourceContentMutated: false,
    problems,
  };
}

function main() {
  const report = audit();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { EXPECTED_SUBJECT_TOTALS, audit };
