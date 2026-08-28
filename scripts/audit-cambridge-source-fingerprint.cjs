#!/usr/bin/env node

'use strict';

const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { fixture, fingerprint } = require('./generate-cambridge-topic-release.cjs');

const ROOT = path.resolve(__dirname, '..');
const FIELDS = [
  'id', 'subject_id', 'topic_id', 'question_text', 'question_type', 'options',
  'correct_answer', 'explanation', 'difficulty', 'points', 'marks', 'time_limit',
];
const SCOPE_SQL = "(id GLOB 'q_alevel_bio_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_chem_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_fm_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_math_[0-9][0-9][0-9]' OR id GLOB 'q_alevel_phy_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_addmath_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_bio_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_chem_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_math_[0-9][0-9][0-9]' OR id GLOB 'q_igcse_phy_[0-9][0-9][0-9]')";
const P1 = 2147483647;
const P2 = 2147483629;

function parseArgs(argv) {
  const result = { env: 'production', check: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--env') {
      result.env = argv[index + 1];
      index += 1;
    } else if (argv[index] === '--check') result.check = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!['production', 'staging'].includes(result.env)) {
    throw new Error('--env must be production or staging');
  }
  return result;
}

function executeRemoteQuery(env, query) {
  const database = env === 'staging' ? 'brilla-db-staging' : 'brilla-db';
  const wrangler = path.join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const args = [wrangler, 'd1', 'execute', database, '--remote', '--command', query, '--json'];
  if (env === 'staging') args.push('--env', 'staging');
  const payload = JSON.parse(execFileSync(process.execPath, args, {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  }));
  if (!payload[0]?.success || !Array.isArray(payload[0]?.results)) {
    throw new Error('Wrangler did not return a successful D1 result');
  }
  return { rows: payload[0].results, meta: payload[0].meta };
}

function remoteFieldFingerprints(env, field) {
  const query = `WITH RECURSIVE r(id,i,n,a,b,v) AS (`
    + `SELECT id,0,length(json_array(${field})),7,11,json_array(${field}) FROM questions WHERE ${SCOPE_SQL} `
    + `UNION ALL SELECT id,i+1,n,(a*131+unicode(substr(v,i+1,1)))%${P1},`
    + `(b*137+unicode(substr(v,i+1,1)))%${P2},v FROM r WHERE i<n) `
    + 'SELECT id,n,a,b FROM r WHERE i=n ORDER BY id;';
  return executeRemoteQuery(env, query);
}

function localFieldFingerprints(rows, field) {
  return new Map(rows.map((row) => [row.id, fingerprint(JSON.stringify([row[field] ?? null]))]));
}

function sameFingerprint(local, remote) {
  return local && local[0] === remote.n && local[1] === remote.a && local[2] === remote.b;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const db = fixture();
  let localRows;
  try {
    localRows = db.prepare(`SELECT ${FIELDS.join(',')} FROM questions WHERE ${SCOPE_SQL} ORDER BY id`).all();
  } finally {
    db.close();
  }

  const localIds = new Set(localRows.map((row) => row.id));
  const fieldSummaries = [];
  const remoteIds = new Set();
  let rowsRead = 0;
  let rowsWritten = 0;
  let changedDb = false;

  for (const field of FIELDS) {
    const local = localFieldFingerprints(localRows, field);
    const remote = remoteFieldFingerprints(options.env, field);
    rowsRead += remote.meta?.rows_read || 0;
    rowsWritten += remote.meta?.rows_written || 0;
    changedDb ||= Boolean(remote.meta?.changed_db);
    const differingIds = [];
    for (const row of remote.rows) {
      remoteIds.add(row.id);
      if (!sameFingerprint(local.get(row.id), row)) differingIds.push(row.id);
    }
    fieldSummaries.push({ field, differingCount: differingIds.length, differingIds });
  }

  const missingIds = [...localIds].filter((id) => !remoteIds.has(id)).sort();
  const unexpectedIds = [...remoteIds].filter((id) => !localIds.has(id)).sort();
  const differingRows = new Set(fieldSummaries.flatMap((entry) => entry.differingIds));
  const report = {
    environment: options.env,
    localRowCount: localRows.length,
    remoteRowCount: remoteIds.size,
    differingRowCount: differingRows.size,
    missingIds,
    unexpectedIds,
    fieldSummaries,
    rowsRead,
    rowsWritten,
    changedDb,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (options.check && (differingRows.size || missingIds.length || unexpectedIds.length || rowsWritten || changedDb)) {
    process.exitCode = 1;
  }
}

main();
