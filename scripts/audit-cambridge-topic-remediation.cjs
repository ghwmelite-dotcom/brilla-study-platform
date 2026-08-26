'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const {
  ALEVEL_MANIFEST,
  EXCEPTION_LEDGER,
  IGCSE_MANIFEST,
  buildArtifacts,
} = require('./generate-cambridge-topic-remediation.cjs');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const SOURCE_EXECUTION_ORDER = [
  'database/migrations/archive/077_seed_oalevel_questions.sql',
  'database/migrations/archive/078_more_biology_questions.sql',
  'database/migrations/archive/079_more_chemistry_questions.sql',
  'database/migrations/archive/080_more_maths_questions.sql',
  'database/migrations/archive/081_alevel_physics_questions.sql',
  'database/migrations/archive/082_alevel_chemistry_questions.sql',
  'database/migrations/archive/082_alevel_mathematics_questions.sql',
  'database/migrations/archive/083_alevel_biology_questions.sql',
  'database/migrations/archive/083_igcse_add_math_questions.sql',
  'database/migrations/archive/084_alevel_further_math_questions.sql',
];

function parseSqlTuple(line) {
  const body = line.trim().replace(/^\(/, '').replace(/[,;]?\s*$/, '').replace(/\)$/, '');
  const values = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];
    if (character === "'") {
      if (quoted && body[index + 1] === "'") {
        current += "''";
        index += 1;
      } else {
        quoted = !quoted;
        current += character;
      }
    } else if (character === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }
  values.push(current.trim());
  return values.map((value) => {
    if (value === 'NULL') return null;
    if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
    return value;
  });
}

function extractSourceRows(relativePath) {
  const rows = [];
  let columns = [];
  for (const line of read(relativePath).split(/\r?\n/)) {
    const insert = /^INSERT(?: OR IGNORE)? INTO questions \(([^)]+)\)/i.exec(line.trim());
    if (insert) {
      columns = insert[1].split(',').map((column) => column.trim());
      continue;
    }
    if (!line.trim().startsWith("('q_")) continue;
    assert.ok(columns.length > 0, `${relativePath}: question row appeared before an INSERT column list`);
    const values = parseSqlTuple(line);
    const row = Object.fromEntries(columns.map((column, index) => [column, values[index]]));
    assert.equal(typeof row.id, 'string', `${relativePath}: could not parse question ID`);
    assert.equal(typeof row.subject_id, 'string', `${relativePath}: could not parse subject ID for ${row.id}`);
    rows.push({ questionId: row.id, subjectId: row.subject_id, sourceFile: relativePath });
  }
  return rows;
}

function uniqueSourceRows(manifest) {
  const subjectIds = new Set(manifest.subjects.map((subject) => subject.subjectId));
  const sourceFiles = [...new Set(manifest.subjects.flatMap((subject) => subject.sourceFiles))].sort();
  const byId = new Map();
  for (const sourceFile of sourceFiles) {
    for (const row of extractSourceRows(sourceFile).filter((candidate) => subjectIds.has(candidate.subjectId))) {
      const prior = byId.get(row.questionId);
      if (prior) assert.equal(prior.subjectId, row.subjectId, `${row.questionId}: conflicting source subjects`);
      else byId.set(row.questionId, row);
    }
  }
  return [...byId.values()].sort((left, right) => left.questionId.localeCompare(right.questionId));
}

function createFixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(read('database/schema.sql'));
  db.exec(read('database/seed.sql'));
  db.exec(read('database/prod-patches/094_seed_missing_subjects_topics.sql'));
  db.exec(read('database/prod-patches/096_seed_topics_for_empty_subjects.sql'));
  for (const sourceFile of SOURCE_EXECUTION_ORDER) db.exec(read(sourceFile));
  db.exec(read('database/prod-patches/088c_fix_orphan_refs.sql'));
  return db;
}

function mappingsFor(manifest) {
  return manifest.subjects.flatMap((subject) => subject.mappingGroups.flatMap((entry) => entry.questionIds.map((questionId) => ({
    questionId,
    subjectId: subject.subjectId,
    topicId: entry.topicId,
    sourceFiles: entry.sourceFiles,
  }))));
}

function auditFamily(db, manifest, exceptionLedger) {
  const sourceRows = uniqueSourceRows(manifest);
  const mappings = mappingsFor(manifest);
  const exceptions = exceptionLedger.exceptions.filter((row) => row.examFamily === manifest.examFamily);
  const mappingIds = mappings.map((row) => row.questionId);
  const exceptionIds = exceptions.map((row) => row.questionId);
  const coveredIds = [...mappingIds, ...exceptionIds].sort();
  const sourceIds = sourceRows.map((row) => row.questionId);

  assert.equal(sourceRows.length, manifest.expectedNullTopicCohort, `${manifest.examFamily}: source cohort drift`);
  assert.equal(new Set(mappingIds).size, mappingIds.length, `${manifest.examFamily}: duplicate mapped question ID`);
  assert.equal(new Set(exceptionIds).size, exceptionIds.length, `${manifest.examFamily}: duplicate exception question ID`);
  assert.equal(new Set(coveredIds).size, coveredIds.length, `${manifest.examFamily}: mapped/exception overlap`);
  assert.deepEqual(coveredIds, sourceIds, `${manifest.examFamily}: source cohort is not covered exactly once`);
  assert.equal(mappingIds.length, manifest.mappedQuestionCount);
  assert.equal(exceptionIds.length, manifest.exceptionCount);
  assert.equal(mappingIds.length + exceptionIds.length, manifest.expectedNullTopicCohort);

  const sourceFilesByQuestion = new Map();
  for (const sourceFile of [...new Set(manifest.subjects.flatMap((subject) => subject.sourceFiles))]) {
    for (const row of extractSourceRows(sourceFile)) {
      sourceFilesByQuestion.set(row.questionId, new Set([...(sourceFilesByQuestion.get(row.questionId) || []), sourceFile]));
    }
  }

  for (const subject of manifest.subjects) {
    const subjectSources = sourceRows.filter((row) => row.subjectId === subject.subjectId);
    const subjectMappings = mappings.filter((row) => row.subjectId === subject.subjectId);
    const subjectExceptions = exceptions.filter((row) => row.subjectId === subject.subjectId);
    assert.equal(subjectSources.length, subject.expectedQuestionCount, `${subject.subjectId}: source count drift`);
    assert.equal(subjectMappings.length, subject.mappedQuestionCount, `${subject.subjectId}: mapped count drift`);
    assert.equal(subjectExceptions.length, subject.exceptionCount, `${subject.subjectId}: exception count drift`);
    assert.equal(subjectMappings.length + subjectExceptions.length, subject.expectedQuestionCount, `${subject.subjectId}: incomplete coverage`);
  }

  for (const mapping of mappings) {
    const question = db.prepare('SELECT subject_id, topic_id FROM questions WHERE id=?').get(mapping.questionId);
    assert.ok(question, `${mapping.questionId}: question missing from reconstructed fixture`);
    assert.equal(question.subject_id, mapping.subjectId, `${mapping.questionId}: subject drift`);
    assert.equal(question.topic_id, null, `${mapping.questionId}: expected source topic to remain NULL before remediation`);
    const topic = db.prepare('SELECT subject_id FROM topics WHERE id=?').get(mapping.topicId);
    assert.ok(topic, `${mapping.questionId}: topic ${mapping.topicId} is missing`);
    assert.equal(topic.subject_id, mapping.subjectId, `${mapping.questionId}: cross-subject topic mapping`);
    const provenance = sourceFilesByQuestion.get(mapping.questionId);
    assert.ok(provenance && mapping.sourceFiles.some((sourceFile) => provenance.has(sourceFile)), `${mapping.questionId}: mapping group does not cite a source containing the question`);
  }

  for (const exception of exceptions) {
    const question = db.prepare('SELECT subject_id, topic_id FROM questions WHERE id=?').get(exception.questionId);
    assert.ok(question, `${exception.questionId}: exception question missing from reconstructed fixture`);
    assert.equal(question.subject_id, exception.subjectId, `${exception.questionId}: exception subject drift`);
    assert.equal(question.topic_id, null, `${exception.questionId}: exception is no longer a null-topic row`);
    assert.equal(exception.reasonCode, 'taxonomy-gap');
    assert.equal(exception.reviewStatus, 'reviewed-unmapped');
    assert.ok(exception.missingConcept.length >= 8, `${exception.questionId}: missing concept is not explicit`);
    assert.ok(exception.reason.includes('no matching topic'), `${exception.questionId}: exception reason is not fail-closed`);
    assert.ok(exception.requiredTaxonomyAction.startsWith('Add and review'), `${exception.questionId}: no explicit next action`);
    assert.ok((sourceFilesByQuestion.get(exception.questionId) || new Set()).has(exception.sourceFile), `${exception.questionId}: exception source file does not contain the question`);
  }

  return {
    examFamily: manifest.examFamily,
    sourceQuestionCount: sourceRows.length,
    mappedQuestionCount: mappings.length,
    exceptionCount: exceptions.length,
    subjects: manifest.subjects.map((subject) => ({
      subjectId: subject.subjectId,
      sourceQuestionCount: subject.expectedQuestionCount,
      mappedQuestionCount: subject.mappedQuestionCount,
      exceptionCount: subject.exceptionCount,
    })),
  };
}

function audit() {
  const generated = buildArtifacts();
  for (const relativePath of [IGCSE_MANIFEST, ALEVEL_MANIFEST, EXCEPTION_LEDGER]) {
    assert.deepEqual(JSON.parse(read(relativePath)), generated[relativePath], `${relativePath}: checked artifact differs from generator`);
  }
  const igcse = generated[IGCSE_MANIFEST];
  const alevel = generated[ALEVEL_MANIFEST];
  const exceptionLedger = generated[EXCEPTION_LEDGER];
  assert.equal(igcse.expectedNullTopicCohort, 225);
  assert.equal(alevel.expectedNullTopicCohort, 230);
  assert.equal(exceptionLedger.expectedExceptionCount, igcse.exceptionCount + alevel.exceptionCount);
  assert.equal(exceptionLedger.exceptions.every((row) => row.reviewStatus === 'reviewed-unmapped'), true);

  const db = createFixture();
  const result = {
    release: igcse.release,
    taxonomySource: igcse.taxonomySource,
    families: [auditFamily(db, igcse, exceptionLedger), auditFamily(db, alevel, exceptionLedger)],
    totalSourceQuestions: igcse.expectedNullTopicCohort + alevel.expectedNullTopicCohort,
    totalMappedQuestions: igcse.mappedQuestionCount + alevel.mappedQuestionCount,
    totalExceptions: exceptionLedger.expectedExceptionCount,
  };
  db.close();
  return result;
}

if (require.main === module) process.stdout.write(`${JSON.stringify(audit(), null, 2)}\n`);

module.exports = { audit, extractSourceRows, parseSqlTuple, uniqueSourceRows };
