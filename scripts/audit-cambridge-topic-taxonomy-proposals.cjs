'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  EXCEPTION_LEDGER,
  buildArtifacts: buildBaselineArtifacts,
} = require('./generate-cambridge-topic-remediation.cjs');
const {
  PROPOSAL_MANIFEST,
  buildProposalManifest,
} = require('./generate-cambridge-topic-taxonomy-proposals.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

function audit() {
  const generated = buildProposalManifest();
  const checked = JSON.parse(read(PROPOSAL_MANIFEST));
  assert.deepEqual(checked, generated, `${PROPOSAL_MANIFEST}: checked artifact differs from generator`);
  assert.equal(generated.status, 'proposal-only-no-migration');
  assert.deepEqual(generated.baseline, { sourceQuestionCount: 455, mappedQuestionCount: 401, exceptionCount: 54 });
  assert.deepEqual(generated.proposal, {
    topicCount: 15,
    mappingCount: 49,
    readyAfterTaxonomyApprovalCount: 48,
    contentGatedMappingCount: 1,
    retainedExceptionCount: 5,
    projectedMappedAfterApprovalAndCorrections: 450,
    projectedExceptionCount: 5,
  });

  const baseline = buildBaselineArtifacts()[EXCEPTION_LEDGER];
  const baselineById = new Map(baseline.exceptions.map((row) => [row.questionId, row]));
  const proposedIds = generated.proposedMappings.map((row) => row.questionId);
  const retainedIds = generated.retainedExceptions.map((row) => row.questionId);
  assert.equal(new Set(proposedIds).size, proposedIds.length, 'duplicate proposed question ID');
  assert.equal(new Set(retainedIds).size, retainedIds.length, 'duplicate retained question ID');
  assert.equal(proposedIds.some((id) => new Set(retainedIds).has(id)), false, 'proposed/retained overlap');
  assert.deepEqual([...proposedIds, ...retainedIds].sort(), baseline.exceptions.map((row) => row.questionId).sort(), 'proposal does not cover the reviewed exception cohort exactly');

  const topicIds = generated.proposedTopics.map((row) => row.proposedTopicId);
  assert.equal(new Set(topicIds).size, topicIds.length, 'duplicate proposed topic ID');
  const currentTaxonomy = read('database/prod-patches/096_seed_topics_for_empty_subjects.sql');
  for (const topic of generated.proposedTopics) {
    assert.equal(currentTaxonomy.includes(`'${topic.proposedTopicId}'`), false, `${topic.proposedTopicId}: already exists in current taxonomy`);
    assert.ok(topic.rationale.length >= 60, `${topic.proposedTopicId}: rationale is too short`);
    assert.ok(/^\d+(?:\.\d+)?\s/.test(topic.syllabusSection), `${topic.proposedTopicId}: no exact syllabus section`);
    const source = generated.sourceDocuments[topic.sourceDocument];
    assert.ok(source, `${topic.proposedTopicId}: missing official source document`);
    assert.match(source.url, /^https:\/\/www\.cambridgeinternational\.org\/Images\/\d+-\d{4}-\d{4}-syllabus\.pdf$/);
    for (const questionId of topic.questionIds) {
      const baselineRow = baselineById.get(questionId);
      assert.ok(baselineRow, `${questionId}: proposed row missing from baseline exceptions`);
      assert.equal(baselineRow.subjectId, topic.subjectId, `${questionId}: cross-subject proposed topic`);
      assert.equal(baselineRow.examFamily, topic.examFamily, `${questionId}: cross-family proposed topic`);
    }
  }

  assert.deepEqual(retainedIds.sort(), [
    'q_alevel_bio_028',
    'q_alevel_bio_029',
    'q_alevel_fm_051',
    'q_alevel_fm_052',
    'q_alevel_fm_053',
  ]);
  assert.equal(generated.retainedExceptions.every((row) => row.reviewStatus === 'reviewed-retained-exception'), true);
  assert.equal(generated.retainedExceptions.every((row) => row.classification.startsWith('out-of-current-syllabus-')), true);
  assert.equal(generated.retainedExceptions.every((row) => row.rationale.length >= 100), true);

  assert.deepEqual(generated.familyCounts, {
    'cambridge-igcse': { sourceQuestions: 225, baselineMapped: 203, proposedMappings: 22, retainedExceptions: 0, projectedMappedAfterApprovalAndCorrections: 225 },
    'cambridge-a-level': { sourceQuestions: 230, baselineMapped: 198, proposedMappings: 27, retainedExceptions: 5, projectedMappedAfterApprovalAndCorrections: 225 },
  });
  assert.deepEqual(generated.subjectCounts, {
    subj_alevel_biology: { proposedMappings: 3, retainedExceptions: 2 },
    subj_alevel_further_math: { proposedMappings: 15, retainedExceptions: 3 },
    subj_alevel_math: { proposedMappings: 2, retainedExceptions: 0 },
    subj_alevel_physics: { proposedMappings: 7, retainedExceptions: 0 },
    subj_igcse_add_math: { proposedMappings: 8, retainedExceptions: 0 },
    subj_igcse_biology: { proposedMappings: 8, retainedExceptions: 0 },
    subj_igcse_chemistry: { proposedMappings: 6, retainedExceptions: 0 },
  });

  const correction050 = generated.contentCorrectionProposals.find((row) => row.questionId === 'q_alevel_fm_050');
  assert.ok(correction050);
  assert.equal(correction050.before.correctAnswer, '1 unit');
  assert.equal(correction050.after.correctAnswer, '1/3 unit');
  assert.ok(correction050.proof.includes('|2+4+3-10|/√9 = 1/3'));
  assert.equal(generated.proposedMappings.find((row) => row.questionId === 'q_alevel_fm_050').status, 'blocked-content-correction');

  const correction051 = generated.contentCorrectionProposals.find((row) => row.questionId === 'q_alevel_fm_051');
  assert.ok(correction051);
  assert.equal(correction051.before.optionA.replace('A. ', ''), '1 + x + x²/2 + x³/6');
  assert.equal(correction051.before.optionD.replace('D. ', '').replace('2!', '2').replace('3!', '6'), '1 + x + x²/2 + x³/6');
  assert.notEqual(correction051.after.optionA.replace('A. ', ''), correction051.after.optionD.replace('D. ', ''));
  assert.ok(correction051.proof.includes('2! = 2 and 3! = 6'));

  assert.equal(Object.keys(generated).some((key) => /migration/i.test(key)), false);
  assert.equal(PROPOSAL_MANIFEST.includes('/migrations/'), false);
  return {
    release: generated.release,
    status: generated.status,
    baseline: generated.baseline,
    proposal: generated.proposal,
    familyCounts: generated.familyCounts,
    retainedQuestionIds: retainedIds.sort(),
    contentCorrectionQuestionIds: generated.contentCorrectionProposals.map((row) => row.questionId).sort(),
  };
}

if (require.main === module) process.stdout.write(`${JSON.stringify(audit(), null, 2)}\n`);

module.exports = { audit };
