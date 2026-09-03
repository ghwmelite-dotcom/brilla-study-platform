/**
 * Fresh-Bootstrap Gate for Brilla Prep
 *
 * Simulates the documented fresh-environment provisioning path in an
 * in-memory SQLite DB (node:sqlite, zero deps) and proves it reaches the
 * current shape with zero errors:
 *
 *   1. database/schema.sql            (canonical squash of 001-087 + folds)
 *   2. database/seed.sql              (canonical data seed)
 *   3. database/seeds/seed_chat_rooms.sql
 *   4. topic-seed prod patches        (094/095/096 — the guarded topic-mapping
 *                                      migrations 225+ require these topics)
 *   5. database/record_folded_migrations.sql
 *                                     (records the non-idempotent folded
 *                                      migrations in wrangler's d1_migrations
 *                                      bookkeeping table, exactly as
 *                                      `npm run db:baseline:fresh` does)
 *   6. replay of the full live chain in database/migrations/ in lexical order,
 *      skipping recorded migrations the way `wrangler d1 migrations apply`
 *      does (one transaction per file, name inserted on success)
 *
 * Two additional checks keep the record-only baseline honest:
 *   - every recorded migration must STILL FAIL to apply on the schema.sql
 *     baseline (otherwise it is no longer folded and must be removed from
 *     database/record_folded_migrations.sql);
 *   - every recorded migration's DDL (tables, ALTER-added columns, indexes)
 *     must be present in the final database (otherwise the fold is partial
 *     and schema.sql must be completed).
 *
 * Exit 0 = all checks pass. Exit 1 = any failure.
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'database');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');
const SEED_FILE = path.join(DB_DIR, 'seed.sql');
const CHAT_SEED_FILE = path.join(DB_DIR, 'seeds', 'seed_chat_rooms.sql');
const BASELINE_FILE = path.join(DB_DIR, 'record_folded_migrations.sql');
const MIGRATIONS_DIR = path.join(DB_DIR, 'migrations');
const TOPIC_SEED_PATCHES = [
  path.join(DB_DIR, 'prod-patches', '094_seed_missing_subjects_topics.sql'),
  path.join(DB_DIR, 'prod-patches', '095_clone_topics_to_current_subjects.sql'),
  path.join(DB_DIR, 'prod-patches', '096_seed_topics_for_empty_subjects.sql'),
];

const results = [];

function record(name, count, detail) {
  results.push({ name, count, detail: detail || '' });
}

/**
 * Apply a whole SQL file via db.exec(). Returns null on success, or an error
 * description string.
 */
function applySqlFile(db, filePath, label) {
  try {
    db.exec(fs.readFileSync(filePath, 'utf8'));
    return null;
  } catch (err) {
    return `${label} failed to apply: ${err.message}`;
  }
}

// ---------------------------------------------------------------------------
// Minimal SQL helpers for the fold-completeness check (string-literal aware).
// ---------------------------------------------------------------------------
function splitStatements(sql) {
  const statements = [];
  let cur = '';
  let inStr = false;
  let inLineComment = false;
  let inBlockComment = false;
  let depth = 0;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && sql[i + 1] === '/') {
        i++;
        inBlockComment = false;
      }
      continue;
    }
    if (inStr) {
      if (c === "'") {
        if (sql[i + 1] === "'") i++;
        else inStr = false;
      }
      continue;
    }
    if (c === '-' && sql[i + 1] === '-') {
      inLineComment = true;
      continue;
    }
    if (c === '/' && sql[i + 1] === '*') {
      inBlockComment = true;
      continue;
    }
    if (c === "'") {
      inStr = true;
      continue;
    }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ';' && depth <= 0) {
      if (cur.trim()) statements.push(cur);
      cur = '';
      depth = 0;
      continue;
    }
    cur += c;
  }
  if (cur.trim()) statements.push(cur);
  return statements;
}

function stripComments(s) {
  return s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Column names defined by a CREATE TABLE statement (constraints excluded). */
function columnNamesOf(stmt) {
  const s = stripComments(stmt);
  const open = s.indexOf('(');
  if (open === -1) return [];
  const names = [];
  let depth = 0;
  let inStr = false;
  let seg = '';
  const parts = [];
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === "'") {
        if (s[i + 1] === "'") i++;
        else inStr = false;
      }
      continue;
    }
    if (c === "'") {
      inStr = true;
      continue;
    }
    if (c === '(') {
      depth++;
      if (depth === 1) continue;
    }
    if (c === ')') {
      depth--;
      if (depth === 0) break;
    }
    if (c === ',' && depth === 1) {
      parts.push(seg);
      seg = '';
      continue;
    }
    seg += c;
  }
  if (seg.trim()) parts.push(seg);
  for (const part of parts) {
    const m = part.trim().match(/^([A-Za-z_][A-Za-z_0-9]*)\s/);
    if (m && !/^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)$/i.test(m[1])) {
      names.push(m[1].toLowerCase());
    }
  }
  return names;
}

/**
 * Extract the DDL a recorded migration must have contributed to schema.sql:
 * created tables (with columns), ALTER-added columns, and indexes. Table
 * rebuilds (CREATE x_new ... DROP x ... RENAME x_new TO x) are resolved so the
 * requirement lands on the final table name. Scratch tables created and
 * dropped within the same file are ignored, as are all data statements.
 */
function ddlRequirements(sql) {
  const created = new Map(); // name -> column names
  const renameTo = new Map(); // old -> new
  const dropped = new Set();
  const alters = []; // { table, column }
  const indexes = [];
  for (const raw of splitStatements(sql)) {
    const s = stripComments(raw).trim();
    let m;
    if ((m = s.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_0-9]+)/i))) {
      created.set(m[1].toLowerCase(), columnNamesOf(raw));
    } else if ((m = s.match(/^ALTER\s+TABLE\s+([A-Za-z_0-9]+)\s+ADD\s+COLUMN\s+([A-Za-z_0-9]+)/i))) {
      alters.push({ table: m[1].toLowerCase(), column: m[2].toLowerCase() });
    } else if ((m = s.match(/^ALTER\s+TABLE\s+([A-Za-z_0-9]+)\s+RENAME\s+TO\s+([A-Za-z_0-9]+)/i))) {
      renameTo.set(m[1].toLowerCase(), m[2].toLowerCase());
    } else if ((m = s.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([A-Za-z_0-9]+)/i))) {
      dropped.add(m[1].toLowerCase());
    } else if ((m = s.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_0-9]+)/i))) {
      indexes.push(m[1].toLowerCase());
    }
  }
  const resolve = (t) => {
    while (renameTo.has(t)) t = renameTo.get(t);
    return t;
  };
  const requirements = [];
  for (const [t, cols] of created) {
    if (dropped.has(t) && !renameTo.has(t)) continue; // in-file scratch table
    requirements.push({ kind: 'table', name: resolve(t), columns: cols });
  }
  for (const a of alters) {
    requirements.push({ kind: 'column', table: resolve(a.table), column: a.column });
  }
  for (const i of indexes) requirements.push({ kind: 'index', name: i });
  return requirements;
}

/** Migration names recorded by database/record_folded_migrations.sql. */
function parseRecordedMigrations(fileSql) {
  const names = [];
  const noComments = fileSql.replace(/--[^\n]*/g, '');
  const insertRe = /INSERT\s+OR\s+IGNORE\s+INTO\s+d1_migrations\s*\([^)]*\)\s*VALUES([\s\S]*?);/gi;
  let block;
  while ((block = insertRe.exec(noComments))) {
    const nameRe = /\(\s*'([^']+\.sql)'\s*\)/g;
    let m;
    while ((m = nameRe.exec(block[1]))) names.push(m[1]);
  }
  return names;
}

function tableExists(db, table) {
  return Boolean(
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)
  );
}

function indexExists(db, index) {
  return Boolean(
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?").get(index)
  );
}

function columnExists(db, table, column) {
  if (!tableExists(db, table)) return false;
  return db
    .prepare(`SELECT name FROM pragma_table_info('${table}')`)
    .all()
    .some((r) => r.name === column);
}

function main() {
  console.log('\n🌱 Verifying fresh-environment bootstrap (schema → seeds → baseline → chain)\n');
  console.log('='.repeat(50));

  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');

  // --- 1-4. Baseline files ---------------------------------------------------
  const baselineSteps = [
    [SCHEMA_FILE, 'schema.sql'],
    [SEED_FILE, 'seed.sql'],
    [CHAT_SEED_FILE, 'seeds/seed_chat_rooms.sql'],
  ];
  let baselineFailed = false;
  for (const [file, label] of baselineSteps) {
    const err = applySqlFile(db, file, label);
    record(`fresh baseline: ${label} applies cleanly`, err ? 1 : 0, err || '');
    console.log(`  ${err ? '✗' : '✓'} ${err || `${label} applied`}`);
    if (err) baselineFailed = true;
  }
  for (const patchFile of TOPIC_SEED_PATCHES) {
    const label = `prod-patches/${path.basename(patchFile)}`;
    const err = applySqlFile(db, patchFile, label);
    record(`fresh baseline: ${label} applies cleanly`, err ? 1 : 0, err || '');
    console.log(`  ${err ? '✗' : '✓'} ${err || `${label} applied`}`);
    if (err) baselineFailed = true;
  }

  if (baselineFailed) {
    record('recorded folded migrations still fail on the baseline (genuinely folded)', 1, 'not attempted (baseline failed)');
    record('live migration chain applies cleanly after baseline record', 1, 'not attempted (baseline failed)');
    return finish(db);
  }

  // --- 5. Record the folded migrations (mirrors db:baseline:fresh) -----------
  console.log('\n📖 Recording folded migrations (database/record_folded_migrations.sql)...');
  const baselineSql = fs.readFileSync(BASELINE_FILE, 'utf8');
  const foldedNames = parseRecordedMigrations(baselineSql);
  const baselineErr = applySqlFile(db, BASELINE_FILE, 'record_folded_migrations.sql');
  record(
    'record_folded_migrations.sql parses (≥1 entry) and applies',
    baselineErr || foldedNames.length === 0 ? 1 : 0,
    baselineErr || (foldedNames.length === 0 ? 'no migration names found in file' : '')
  );
  console.log(`  ${baselineErr ? '✗' : '✓'} ${baselineErr || `${foldedNames.length} folded migrations recorded`}`);
  if (baselineErr || foldedNames.length === 0) {
    record('recorded folded migrations still fail on the baseline (genuinely folded)', 1, 'not attempted (record step failed)');
    record('live migration chain applies cleanly after baseline record', 1, 'not attempted (record step failed)');
    return finish(db);
  }

  // --- 6. Honesty: every recorded migration must still FAIL on the baseline --
  // If one applies cleanly it is no longer (fully) folded into schema.sql and
  // must be removed from record_folded_migrations.sql so wrangler runs it.
  console.log('\n🧪 Checking recorded migrations are genuinely folded (each must still fail)...');
  let notFolded = 0;
  const notFoldedDetails = [];
  for (const name of foldedNames) {
    const file = path.join(MIGRATIONS_DIR, name);
    if (!fs.existsSync(file)) {
      notFolded++;
      notFoldedDetails.push(`${name}: recorded but missing from database/migrations/`);
      console.log(`  ✗ ${name}: missing from database/migrations/`);
      continue;
    }
    db.exec('BEGIN');
    let applied = true;
    try {
      db.exec(fs.readFileSync(file, 'utf8'));
    } catch {
      applied = false;
    }
    db.exec('ROLLBACK');
    if (applied) {
      notFolded++;
      notFoldedDetails.push(`${name}: applies cleanly on the baseline — remove it from record_folded_migrations.sql`);
      console.log(`  ✗ ${name}: applies cleanly (no longer folded — remove from baseline)`);
    } else {
      console.log(`  ✓ ${name}: still fails on the baseline (genuinely folded)`);
    }
  }
  record(
    'recorded folded migrations still fail on the baseline (genuinely folded)',
    notFolded,
    notFoldedDetails.join('; ')
  );

  // --- 7. Replay the full live chain the way wrangler d1 migrations apply does
  console.log('\n🧭 Replaying the live migration chain (database/migrations/)...');
  const allFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const isRecorded = (name) =>
    Boolean(db.prepare('SELECT name FROM d1_migrations WHERE name = ?').get(name));

  let chainFailures = 0;
  const chainFailureDetails = [];
  let appliedCount = 0;
  for (const f of allFiles) {
    if (isRecorded(f)) continue;
    db.exec('BEGIN');
    try {
      db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8'));
      db.prepare('INSERT INTO d1_migrations (name) VALUES (?)').run(f);
      db.exec('COMMIT');
      appliedCount++;
    } catch (err) {
      db.exec('ROLLBACK');
      chainFailures++;
      chainFailureDetails.push(`${f}: ${err.message}`);
      console.log(`  ✗ ${f}: ${err.message}`);
    }
  }
  record(
    'live migration chain applies cleanly after baseline record',
    chainFailures,
    chainFailureDetails.join('\n')
  );
  console.log(
    `  ${chainFailures === 0 ? '✓' : '✗'} ${appliedCount} applied, ${allFiles.length - appliedCount} recorded as folded, ${chainFailures} failed`
  );

  // --- 8. Fold completeness: recorded DDL present in the final shape ---------
  console.log('\n🧩 Checking recorded migrations are FULLY folded into the final shape...');
  let missingFolds = 0;
  const missingFoldDetails = [];
  for (const name of foldedNames) {
    const file = path.join(MIGRATIONS_DIR, name);
    if (!fs.existsSync(file)) continue;
    for (const req of ddlRequirements(fs.readFileSync(file, 'utf8'))) {
      let ok;
      if (req.kind === 'table') {
        ok = tableExists(db, req.name) && req.columns.every((c) => columnExists(db, req.name, c));
      } else if (req.kind === 'column') {
        ok = columnExists(db, req.table, req.column);
      } else {
        ok = indexExists(db, req.name);
      }
      if (!ok) {
        missingFolds++;
        const what =
          req.kind === 'table'
            ? `table ${req.name} (or its columns)`
            : req.kind === 'column'
              ? `column ${req.table}.${req.column}`
              : `index ${req.name}`;
        missingFoldDetails.push(`${name}: missing ${what} — complete the fold in schema.sql`);
      }
    }
  }
  record(
    'recorded migrations are fully folded (tables/columns/indexes present)',
    missingFolds,
    missingFoldDetails.join('\n')
  );
  console.log(`  ${missingFolds === 0 ? '✓' : '✗'} ${missingFolds} missing fold(s)`);

  // --- 9. Final invariants ----------------------------------------------------
  console.log('\n🏁 Final shape invariants...');
  const recordedRows = db.prepare('SELECT COUNT(*) AS n FROM d1_migrations').get().n;
  record(
    'd1_migrations covers the entire live chain',
    recordedRows === allFiles.length ? 0 : 1,
    `${recordedRows}/${allFiles.length} migrations recorded/applied`
  );

  const spotTables = [
    'schools',
    'practice_session_attempts',
    'marketing_email_preferences',
    'marketing_consent_events',
    'marketing_email_suppressions',
    'marketing_campaigns',
    'marketing_campaign_recipients',
    'marketing_webhook_events',
  ];
  const spotColumns = [
    ['users', 'school_id'],
    ['users', 'session_version'],
    ['users', 'longest_streak'],
    ['users', 'rejected_by'],
    ['users', 'rejected_at'],
    ['practice_sessions', 'client_request_id'],
    ['question_attempts', 'client_request_id'],
    ['battles', 'is_demo_data'],
  ];
  let spotMissing = 0;
  const spotDetails = [];
  for (const t of spotTables) {
    if (!tableExists(db, t)) {
      spotMissing++;
      spotDetails.push(`table ${t} missing`);
    }
  }
  for (const [t, c] of spotColumns) {
    if (!columnExists(db, t, c)) {
      spotMissing++;
      spotDetails.push(`column ${t}.${c} missing`);
    }
  }
  record('final shape spot-checks (folded + 358 artifacts present)', spotMissing, spotDetails.join('; '));
  console.log(`  ${spotMissing === 0 ? '✓' : '✗'} ${spotTables.length + spotColumns.length} artifacts checked, ${spotMissing} missing`);

  finish(db);
}

/**
 * Print the summary table and exit with the appropriate code.
 */
function finish(db) {
  try {
    db.close();
  } catch {
    // already closed — ignore
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary\n');
  console.log('  '.padEnd(2) + 'CHECK'.padEnd(72) + 'VIOLATIONS');
  console.log('  ' + '-'.repeat(80));
  let failures = 0;
  for (const r of results) {
    const status = r.count === 0 ? 'PASS' : 'FAIL';
    console.log(`  [${status}] ${r.name.padEnd(66)}${r.count}`);
    failures += r.count;
    if (r.detail && r.count > 0) {
      console.log(`         ${r.detail.split('\n').join('\n         ')}`);
    }
  }
  console.log('  ' + '-'.repeat(80));

  if (failures > 0) {
    console.log(`\n❌ fresh-bootstrap verify FAILED — ${failures} total violation(s) across ${results.length} checks\n`);
    process.exit(1);
  }
  console.log(`\n✅ fresh-bootstrap verify PASSED — ${results.length} checks clean\n`);
  process.exit(0);
}

main();
