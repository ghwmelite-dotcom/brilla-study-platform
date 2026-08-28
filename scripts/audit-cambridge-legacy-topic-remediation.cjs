'use strict';

const assert = require('node:assert/strict');
const {
  buildArtifacts,
  MIGRATION_ID,
} = require('./generate-cambridge-legacy-topic-release.cjs');

function audit() {
  const { model, artifacts } = buildArtifacts();
  const manifest = JSON.parse(artifacts['database/manifests/281_cambridge_legacy_topic_remediation.json']);
  assert.equal(manifest.migrationId, MIGRATION_ID);
  assert.equal(model.source.length, 45);
  assert.equal(model.mappings.filter((row) => row.questionId.startsWith('q_alevel_maths_')).length, 40);
  assert.equal(model.mappings.filter((row) => !row.questionId.startsWith('q_alevel_maths_')).length, 5);
  assert.equal(model.topics.length, 2);
  assert.equal(model.logs.length, 49);
  assert.equal(manifest.retainedExceptionCount, 0);
  assert.equal(manifest.catalogueDecision.filterRequired, false);
  assert.equal(model.target.every((row) => row.topic_id !== null), true);
  return {
    release: manifest.release,
    sourceQuestions: model.source.length,
    legacyMathematicsMapped: 40,
    priorExceptionsResolved: 5,
    retainedExceptions: 0,
    newTopics: 2,
    contentCorrections: 2,
    exactLedgerRows: model.logs.length,
    catalogueFilterRequired: false,
  };
}

if (require.main === module) process.stdout.write(`${JSON.stringify(audit(), null, 2)}\n`);
module.exports = { audit };
