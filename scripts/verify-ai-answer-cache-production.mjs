import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const deployments = JSON.parse(
  readFileSync(new URL('../config/deployments.json', import.meta.url), 'utf8'),
);

export const EXPECTED_AI_ANSWER_CACHE_COLUMNS = [
  { cid: 0, name: 'id', type: 'TEXT', notnull: 0, dflt_value: null, pk: 1 },
  { cid: 1, name: 'topic_id', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
  { cid: 2, name: 'subject_id', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
  { cid: 3, name: 'exam_type', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
  { cid: 4, name: 'question_text', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
  { cid: 5, name: 'answer_text', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
  { cid: 6, name: 'model', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
  { cid: 7, name: 'embedding_id', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
  { cid: 8, name: 'hit_count', type: 'INTEGER', notnull: 0, dflt_value: '0', pk: 0 },
  { cid: 9, name: 'created_at', type: 'TEXT', notnull: 0, dflt_value: "datetime('now')", pk: 0 },
  { cid: 10, name: 'last_hit_at', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
];

const EXPECTED_INDEXES = [
  { name: 'idx_ai_answer_cache_topic', unique: 0, origin: 'c', partial: 0 },
  { name: 'sqlite_autoindex_ai_answer_cache_1', unique: 1, origin: 'pk', partial: 0 },
];

function comparableIndex(row) {
  return { name: row.name, unique: row.unique, origin: row.origin, partial: row.partial };
}

export function validateAnswerCacheSchema(payload) {
  if (!Array.isArray(payload) || payload.length !== 4 || payload.some((result) => result?.success !== true)) {
    throw new Error('Production cache preflight did not return four successful result sets');
  }

  const columns = payload[0].results;
  const indexes = payload[1].results?.map(comparableIndex);
  const indexColumns = payload[2].results;
  const rowCount = payload[3].results?.[0]?.row_count;
  if (JSON.stringify(columns) !== JSON.stringify(EXPECTED_AI_ANSWER_CACHE_COLUMNS)) {
    throw new Error('Production ai_answer_cache column contract does not match migration 098');
  }
  if (JSON.stringify(indexes) !== JSON.stringify(EXPECTED_INDEXES)) {
    throw new Error('Production ai_answer_cache index contract does not match migration 098');
  }
  if (JSON.stringify(indexColumns) !== JSON.stringify([{ seqno: 0, cid: 1, name: 'topic_id' }])) {
    throw new Error('Production ai_answer_cache topic index has unexpected columns');
  }
  if (!Number.isInteger(rowCount) || rowCount < 0) {
    throw new Error('Production ai_answer_cache row count is invalid');
  }
  return { rowCount };
}

function assertProductionBinding() {
  const production = deployments.production;
  if (
    production.database !== 'brilla-db'
    || production.databaseId !== 'aa806d65-d3dd-4cf9-9cac-e3ddd252f937'
  ) {
    throw new Error('Production deployment manifest does not match the approved D1 target');
  }
  const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  if (
    !wrangler.includes(`database_name = "${production.database}"`)
    || !wrangler.includes(`database_id = "${production.databaseId}"`)
  ) {
    throw new Error('Wrangler production D1 binding does not match the deployment manifest');
  }
  return production;
}

function main() {
  const production = assertProductionBinding();
  const wranglerCli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
  const sql = [
    'PRAGMA table_info(ai_answer_cache);',
    'PRAGMA index_list(ai_answer_cache);',
    'PRAGMA index_info(idx_ai_answer_cache_topic);',
    'SELECT COUNT(*) AS row_count FROM ai_answer_cache;',
  ].join(' ');
  const result = spawnSync(
    process.execPath,
    [wranglerCli, 'd1', 'execute', production.database, '--remote', '--command', sql, '--json'],
    { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } },
  );
  if (result.status !== 0) {
    throw new Error('Unable to read the production ai_answer_cache schema');
  }
  const evidence = validateAnswerCacheSchema(JSON.parse(result.stdout));
  console.log(`Production ai_answer_cache preflight passed; preserved rows: ${evidence.rowCount}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
