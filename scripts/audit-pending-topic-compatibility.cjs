#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SCOPES = [
  ['nsmq267', 'nsmq', 'database/manifests/nsmq-topic-remediation/migration-plan-267-270.json'],
  ['cambridge271', 'cambridge', 'database/manifests/271_275_cambridge_topic_remediation.json'],
  ['nsmq278', 'nsmq', 'database/manifests/nsmq-topic-remediation/legacy-null-topic-plan-278-280.json'],
  ['cambridge281', 'cambridge', 'database/manifests/281_cambridge_legacy_topic_remediation.json'],
];

const sql = (value) => `'${String(value).replaceAll("'", "''")}'`;
const readManifest = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

function parseArgs(argv) {
  const result = { env: 'production', family: null, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--env' || arg === '--family') {
      result[arg.slice(2)] = argv[index + 1];
      index += 1;
    } else if (arg === '--check') result.check = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['production', 'staging'].includes(result.env)) throw new Error('--env must be production or staging');
  if (result.family && !['nsmq', 'cambridge'].includes(result.family)) {
    throw new Error('--family must be nsmq or cambridge');
  }
  return result;
}

function collectExpected(family) {
  const declaredTopics = new Map();
  SCOPES.forEach(([scope, , file], scopeIndex) => {
    const manifest = readManifest(file);
    for (const topic of manifest.newTopics || []) {
      declaredTopics.set(topic.id, {
        scope,
        scopeIndex,
        subjectId: topic.subjectId,
      });
    }
  });
  const expected = new Map();
  for (const [scope, scopeFamily, file] of SCOPES) {
    if (family && scopeFamily !== family) continue;
    const manifest = readManifest(file);
    const newTopics = new Map((manifest.newTopics || []).map((topic) => [topic.id, topic]));
    for (const row of [...(manifest.mappings || []), ...(manifest.newTopics || [])]) {
      const topicId = row.topicId || row.id;
      if (!topicId || !row.subjectId) continue;
      const proposed = newTopics.get(topicId);
      const scopeIndex = SCOPES.findIndex(([candidateScope]) => candidateScope === scope);
      const dependency = declaredTopics.get(topicId);
      const dependencyNew = !proposed && dependency && dependency.scopeIndex < scopeIndex;
      if (dependencyNew && dependency.subjectId !== row.subjectId) {
        throw new Error(`Pending topic dependency ownership drift for ${topicId}`);
      }
      expected.set(`${scope}\u0000${topicId}\u0000${row.subjectId}`, {
        scope, family: scopeFamily, topicId, expectedSubject: row.subjectId,
        kind: proposed ? 'declared_new' : dependencyNew ? 'dependency_new' : 'existing', desiredName: proposed?.name || '',
      });
    }
  }
  return [...expected.values()].sort((left, right) =>
    left.scope.localeCompare(right.scope) || left.topicId.localeCompare(right.topicId),
  );
}

function normalizedName(expression) {
  return `lower(replace(replace(replace(replace(replace(trim(${expression}),' ',''),'-',''),'_',''),'&','and'),'/',''))`;
}

function buildQuery(expected) {
  const values = expected.map((row) =>
    `(${sql(row.scope)},${sql(row.family)},${sql(row.topicId)},${sql(row.expectedSubject)},${sql(row.kind)},${sql(row.desiredName)})`,
  ).join(',');
  const targetName = `coalesce(nullif(e.desired_name,''),t.name)`;
  return `WITH expected(scope,family,topic_id,expected_subject,kind,desired_name) AS (VALUES ${values})
SELECT e.scope,e.family,e.topic_id,e.expected_subject,e.kind,
  t.subject_id AS actual_subject,actual_subject.exam_type_id AS actual_exam,
  actual_subject.is_active AS actual_subject_active,
  expected_subject.exam_type_id AS expected_exam,
  expected_subject.is_active AS expected_subject_active,
  (SELECT group_concat(candidate.id, ',') FROM topics candidate
   JOIN subjects candidate_subject ON candidate_subject.id=candidate.subject_id
   WHERE candidate.subject_id=e.expected_subject AND candidate_subject.is_active=1
     AND candidate_subject.exam_type_id=expected_subject.exam_type_id
     AND ${normalizedName('candidate.name')}=${normalizedName(targetName)}) AS normalized_subject_candidates
FROM expected e
LEFT JOIN topics t ON t.id=e.topic_id
LEFT JOIN subjects actual_subject ON actual_subject.id=t.subject_id
LEFT JOIN subjects expected_subject ON expected_subject.id=e.expected_subject
ORDER BY e.scope,e.topic_id;`;
}

function executeRemoteQuery(env, query) {
  const database = env === 'staging' ? 'brilla-db-staging' : 'brilla-db';
  const wrangler = path.join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const args = [wrangler, 'd1', 'execute', database,
    '--remote', '--command', query, '--json'];
  if (env === 'staging') args.push('--env', 'staging');
  const payload = JSON.parse(execFileSync(process.execPath, args, {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  }));
  if (!payload[0]?.success || !Array.isArray(payload[0]?.results)) {
    throw new Error('Wrangler did not return a successful D1 result');
  }
  return { rows: payload[0].results, meta: payload[0].meta };
}

function executeRemote(env, expected) {
  const results = [];
  for (let index = 0; index < expected.length; index += 20) {
    results.push(executeRemoteQuery(env, buildQuery(expected.slice(index, index + 20))));
  }
  return {
    rows: results.flatMap((result) => result.rows),
    meta: {
      rows_read: results.reduce((sum, result) => sum + (result.meta?.rows_read || 0), 0),
      rows_written: results.reduce((sum, result) => sum + (result.meta?.rows_written || 0), 0),
      changed_db: results.some((result) => result.meta?.changed_db),
    },
  };
}

function summarize(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.scope}:${row.kind}`;
    const group = groups.get(key) || {
      scope: row.scope, kind: row.kind, total: 0, present: 0, correctOwner: 0,
      missing: 0, wrongOwner: 0, invalidExpectedSubject: 0,
    };
    group.total += 1;
    group.present += row.actual_subject ? 1 : 0;
    group.correctOwner += row.actual_subject === row.expected_subject ? 1 : 0;
    group.missing += row.actual_subject ? 0 : 1;
    group.wrongOwner += row.actual_subject && row.actual_subject !== row.expected_subject ? 1 : 0;
    group.invalidExpectedSubject += row.expected_subject_active === 1 && row.expected_exam ? 0 : 1;
    groups.set(key, group);
  }
  return [...groups.values()];
}

function isAnomaly(row, environment) {
  if (row.expected_subject_active !== 1 || !row.expected_exam) return true;
  if (row.kind === 'declared_new' || row.kind === 'dependency_new') {
    return environment === 'staging'
      ? row.actual_subject !== row.expected_subject
      : Boolean(row.actual_subject);
  }
  if (row.actual_subject === row.expected_subject) return false;
  const alternatives = row.normalized_subject_candidates
    ? row.normalized_subject_candidates.split(',').filter(Boolean)
    : [];
  return alternatives.length !== 1;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const expected = collectExpected(options.family);
  const { rows, meta } = executeRemote(options.env, expected);
  const anomalies = rows.filter((row) => isAnomaly(row, options.env)).map((row) => ({
    scope: row.scope, topicId: row.topic_id, kind: row.kind,
    expectedSubject: row.expected_subject, expectedExam: row.expected_exam,
    actualSubject: row.actual_subject, actualExam: row.actual_exam,
    actualSubjectActive: row.actual_subject_active,
    normalizedSubjectCandidates: row.normalized_subject_candidates
      ? row.normalized_subject_candidates.split(',') : [],
  }));
  const report = {
    environment: options.env, rowsRead: meta.rows_read, rowsWritten: meta.rows_written,
    changedDb: meta.changed_db, summary: summarize(rows), anomalies,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (options.check && anomalies.length > 0) process.exitCode = 1;
}

main();
