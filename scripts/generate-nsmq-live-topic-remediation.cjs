'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const core = require('./generate-nsmq-topic-remediation.cjs');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'database', 'manifests', 'nsmq-topic-remediation');
const LIVE_TOTAL = 375;
const LIVE_ONLY = [
  { questionId: 'q_speed_002', subjectId: 'subj_nsmq_math', roundType: 'speed_race', topicId: 'topic_algebra' },
  { questionId: 'q_speed_006', subjectId: 'subj_nsmq_math', roundType: 'speed_race', topicId: 'topic_trigonometry' },
  { questionId: 'q_speed_003', subjectId: 'subj_nsmq_physics', roundType: 'speed_race', topicId: 'topic_mechanics' },
  { questionId: 'q_speed_004', subjectId: 'subj_nsmq_chemistry', roundType: 'speed_race', topicId: 'topic_atomic' },
  { questionId: 'q_speed_005', subjectId: 'subj_nsmq_biology', roundType: 'speed_race', topicId: 'topic_cells' },
];

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

function loadRows(seedFile) {
  const db = new Database(':memory:');
  db.exec(fs.readFileSync(path.join(ROOT, 'database', 'schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(seedFile, 'utf8'));
  const placeholders = LIVE_ONLY.map(() => '?').join(', ');
  const rows = db.prepare(`
    SELECT id, subject_id, round_type, topic_id, question_text, correct_answer, explanation
    FROM questions WHERE id IN (${placeholders}) ORDER BY id
  `).all(...LIVE_ONLY.map((row) => row.questionId));
  db.close();
  return rows;
}

function increment(record, key, amount = 1) {
  record[key] = (record[key] || 0) + amount;
}

function buildLiveAudit() {
  const audit = core.buildAudit();
  const baseRows = loadRows(path.join(ROOT, 'database', 'seeds', 'seed_base.sql'));
  const materializedRows = loadRows(path.join(ROOT, 'database', 'seed.sql'));
  const baseById = new Map(baseRows.map((row) => [row.id, row]));
  const materializedById = new Map(materializedRows.map((row) => [row.id, row]));

  if (baseRows.length !== LIVE_ONLY.length || materializedRows.length !== LIVE_ONLY.length) {
    throw new Error(`Live-only source reconstruction drift: base=${baseRows.length}, materialized=${materializedRows.length}`);
  }

  for (const expected of LIVE_ONLY) {
    const base = baseById.get(expected.questionId);
    const materialized = materializedById.get(expected.questionId);
    if (!base || !materialized) throw new Error(`Missing live-only source row ${expected.questionId}`);
    if (base.subject_id !== expected.subjectId || base.round_type !== expected.roundType || base.topic_id !== expected.topicId) {
      throw new Error(`Base-seed identity/topic drift for ${expected.questionId}`);
    }
    if (materialized.subject_id !== expected.subjectId || materialized.round_type !== expected.roundType) {
      throw new Error(`Materialized seed identity drift for ${expected.questionId}`);
    }
    for (const field of ['question_text', 'correct_answer', 'explanation']) {
      if (base[field] !== materialized[field]) throw new Error(`Base/materialized content drift for ${expected.questionId}.${field}`);
    }

    const subject = core.SUBJECTS[expected.subjectId];
    if (!subject.topics.includes(expected.topicId)) throw new Error(`Out-of-bound live-only topic ${expected.topicId}`);
    const manifest = audit.subjectManifests[subject.file];
    manifest.mappings.push({
      questionId: expected.questionId,
      subjectId: expected.subjectId,
      roundType: expected.roundType,
      topicId: expected.topicId,
      classificationSource: 'production-inventory-plus-base-seed-explicit-topic',
      evidence: `The preserved pre-squash base seed explicitly binds this exact subject/round/content row to ${expected.topicId}; the production read-only inventory confirms the same ID is currently null-topic.`,
      provenance: 'database/seeds/seed_base.sql',
      contentFingerprint: fingerprint(materialized),
    });
    manifest.sourceNullTopicCount += 1;
    manifest.mappedCount += 1;
    increment(manifest.roundTotals, expected.roundType);
    increment(manifest.mappedRoundTotals, expected.roundType);
    increment(manifest.topicCounts, expected.topicId);
    manifest.mappings.sort((a, b) => a.roundType.localeCompare(b.roundType) || a.questionId.localeCompare(b.questionId));
  }

  audit.summary.status = 'inventory-reconciled-reviewed-audit-no-migrations';
  audit.summary.declaredOperationalNullTopicCount = LIVE_TOTAL;
  audit.summary.repositoryReconstructedNullTopicCount = core.REPOSITORY_RECONSTRUCTED_TOTAL;
  audit.summary.liveOnlyRowsRecoveredFromBaseSeed = LIVE_ONLY.length;
  audit.summary.unreconciledInventoryCount = 0;
  audit.summary.mappedCount += LIVE_ONLY.length;
  audit.summary.reviewedDispositionCount += LIVE_ONLY.length;
  audit.summary.rootCause = 'Legacy round-specific NSMQ inserts retained subject and round provenance but did not consistently bind canonical topics. Migration 102 preserves only a unique same-name topic. The squashed seed reconstructs 370 unresolved rows; five additional production-null speed rows are recoverable without guessing because database/seeds/seed_base.sql preserves their exact subject, content and original canonical topic.';
  audit.summary.evidenceBasis.push('database/seeds/seed_base.sql (explicit original topic bindings for five production-only null-topic speed rows)');
  audit.summary.evidenceBasis.push('authoritative production read-only D1 inventory supplied 2026-08-26 (375 IDs and subject totals; no content copied from production)');
  audit.summary.subjectTotals = Object.fromEntries(Object.entries(core.SUBJECTS).map(([subjectId, subject]) => {
    const manifest = audit.subjectManifests[subject.file];
    return [subjectId, {
      sourceNullTopicCount: manifest.sourceNullTopicCount,
      mappedCount: manifest.mappedCount,
      exceptionCount: manifest.exceptionCount,
      roundTotals: manifest.roundTotals,
    }];
  }));

  const total = Object.values(audit.summary.subjectTotals).reduce((sum, subject) => sum + subject.sourceNullTopicCount, 0);
  if (total !== LIVE_TOTAL || audit.summary.mappedCount + audit.summary.exceptionCount !== LIVE_TOTAL) {
    throw new Error(`Live inventory cardinality drift: total=${total}, dispositions=${audit.summary.mappedCount + audit.summary.exceptionCount}`);
  }
  return audit;
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
  const audit = buildLiveAudit();
  writeOrCheck(core.renderFiles(audit), check);
  process.stdout.write(`${JSON.stringify(audit.summary, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = { LIVE_ONLY, LIVE_TOTAL, buildLiveAudit };
