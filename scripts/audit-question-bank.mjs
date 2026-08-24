#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, 'config', 'deployments.json');
const wranglerPath = resolve(root, 'wrangler.toml');
const wranglerBin = resolve(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const AUDIT_SQL = `
SELECT
  COUNT(*) AS active_subjects,
  SUM(CASE WHEN EXISTS (SELECT 1 FROM questions q WHERE q.subject_id = s.id) THEN 1 ELSE 0 END) AS populated_subjects,
  SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM questions q WHERE q.subject_id = s.id) THEN 1 ELSE 0 END) AS empty_subjects
FROM subjects s
WHERE s.is_active = 1;

SELECT
  COUNT(*) AS total_questions,
  SUM(CASE WHEN trim(COALESCE(correct_answer, '')) = '' THEN 1 ELSE 0 END) AS missing_answers,
  SUM(CASE WHEN trim(COALESCE(explanation, '')) = '' THEN 1 ELSE 0 END) AS missing_explanations,
  SUM(CASE WHEN length(trim(COALESCE(explanation, ''))) BETWEEN 1 AND 19 THEN 1 ELSE 0 END) AS short_explanations,
  SUM(CASE WHEN topic_id IS NULL THEN 1 ELSE 0 END) AS missing_topics,
  SUM(CASE WHEN exam_type_id IS NULL THEN 1 ELSE 0 END) AS missing_exam_types,
  SUM(CASE WHEN topic_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM topics t WHERE t.id = questions.topic_id AND t.subject_id <> questions.subject_id
  ) THEN 1 ELSE 0 END) AS cross_subject_topic_links
FROM questions;

WITH normalized AS (
  SELECT lower(trim(question_text)) AS normalized_text, COUNT(*) AS row_count
  FROM questions
  GROUP BY lower(trim(question_text))
  HAVING COUNT(*) > 1
)
SELECT
  COUNT(*) AS duplicate_text_groups,
  COALESCE(SUM(row_count - 1), 0) AS extra_duplicate_rows
FROM normalized;

WITH question_counts AS (
  SELECT subject_id, COUNT(*) AS question_count
  FROM questions
  GROUP BY subject_id
), topic_counts AS (
  SELECT subject_id, COUNT(*) AS topic_count
  FROM topics
  GROUP BY subject_id
)
SELECT
  s.id,
  s.name,
  s.slug,
  s.exam_type_id,
  s.category_id,
  COALESCE(qc.question_count, 0) AS question_count,
  COALESCE(tc.topic_count, 0) AS topic_count,
  CASE
    WHEN COALESCE(qc.question_count, 0) = 0 THEN 'unavailable'
    WHEN COALESCE(qc.question_count, 0) < 20 THEN 'limited'
    ELSE 'available'
  END AS availability_status
FROM subjects s
LEFT JOIN question_counts qc ON qc.subject_id = s.id
LEFT JOIN topic_counts tc ON tc.subject_id = s.id
WHERE s.is_active = 1
ORDER BY s.exam_type_id, s.name;

SELECT
  COALESCE(et.slug, 'unassigned') AS exam,
  COUNT(DISTINCT s.id) AS active_subjects,
  COUNT(q.id) AS questions
FROM subjects s
LEFT JOIN exam_types et ON et.id = s.exam_type_id
LEFT JOIN questions q ON q.subject_id = s.id
WHERE s.is_active = 1
GROUP BY COALESCE(et.slug, 'unassigned')
ORDER BY exam;

SELECT question_type, COUNT(*) AS questions
FROM questions
GROUP BY question_type
ORDER BY questions DESC;
`;

function usage() {
  console.log('Usage: npm run db:audit:questions -- --environment staging|production');
}

function fail(message) {
  console.error(`Question-bank audit aborted: ${message}`);
  process.exit(1);
}

function readEnvironment(args) {
  const index = args.indexOf('--environment');
  if (index === -1 || !args[index + 1]) {
    fail('pass --environment staging or --environment production');
  }
  const environment = args[index + 1];
  if (environment !== 'staging' && environment !== 'production') {
    fail('environment must be exactly staging or production');
  }
  return environment;
}

function assertPinnedBinding(environment, target, wranglerText) {
  const scope = environment === 'production'
    ? wranglerText.split('[env.dev.vars]')[0]
    : wranglerText.slice(wranglerText.indexOf('[env.staging.vars]'));

  if (!scope || !scope.includes(`database_name = "${target.database}"`)) {
    fail(`${environment} database name does not match config/deployments.json`);
  }
  if (!scope.includes(`database_id = "${target.databaseId}"`)) {
    fail(`${environment} database ID does not match config/deployments.json`);
  }
}

function extractResultSets(payload) {
  const sets = Array.isArray(payload) ? payload : payload?.result;
  if (!Array.isArray(sets) || sets.length < 6) {
    fail('Wrangler returned an incomplete or unfamiliar JSON result');
  }
  return sets.map((set, index) => {
    if (!set || set.success === false || !Array.isArray(set.results)) {
      fail(`query result set ${index + 1} is missing or unsuccessful`);
    }
    return set.results;
  });
}

if (process.argv.includes('--help')) {
  usage();
  process.exit(0);
}

const environment = readEnvironment(process.argv.slice(2));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const target = manifest[environment];

if (!target?.database || !target?.databaseId) {
  fail(`deployment manifest has no complete ${environment} database binding`);
}

assertPinnedBinding(environment, target, readFileSync(wranglerPath, 'utf8'));

const args = [
  wranglerBin,
  'd1',
  'execute',
  target.database,
  '--remote',
  '--command',
  AUDIT_SQL,
  '--json',
];
if (environment === 'staging') {
  args.push('--env', 'staging');
}

const execution = spawnSync(process.execPath, args, {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
  windowsHide: true,
});

if (execution.status !== 0) {
  const detail = (execution.stderr || execution.stdout || 'Wrangler failed').trim();
  fail(detail);
}

let payload;
try {
  payload = JSON.parse(execution.stdout);
} catch {
  fail('Wrangler output was not valid JSON; no zero values were inferred');
}

const [catalogue, integrity, duplicates, subjects, exams, questionTypes] = extractResultSets(payload);
const summary = {
  environment,
  database: target.database,
  databaseId: target.databaseId,
  observedAt: new Date().toISOString(),
  catalogue: catalogue[0],
  integrity: integrity[0],
  duplicates: duplicates[0],
  exams,
  questionTypes,
  subjects,
};

console.log(JSON.stringify(summary, null, 2));
