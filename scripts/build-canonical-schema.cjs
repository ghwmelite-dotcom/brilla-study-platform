/**
 * Canonical Schema Generator (database reckoning, Task 2)
 *
 * Regenerates database/schema.sql as the single canonical schema by squashing
 * the legacy database/schema.sql plus every migration in database/migrations/.
 *
 * Method (per .superpowers/sdd/2026-08-03-fix-05-database-reckoning/task-2-brief.md):
 *   1. Parse the legacy schema.sql for its CREATE TABLE / CREATE INDEX statements.
 *   2. Walk database/migrations/*.sql in lexical order, extracting
 *      CREATE TABLE / CREATE [UNIQUE] INDEX statements with a state machine that
 *      tracks paren depth and string literals. ALTER TABLE ADD COLUMN statements
 *      are merged into the winning table definition (required: workers/api and
 *      src reference ALTER-added columns such as is_demo_data, expires_at,
 *      is_affiliate, trial_started_at — CREATE-only extraction would drop them).
 *      DROP TABLE and ALTER TABLE ... RENAME TO are simulated so the final shapes
 *      match the historical replay (016_fix recreates, 028's questions_v2 rename).
 *   3. Last-definition-wins for name collisions, then a union pass appends any
 *      column an earlier definition had that the winner lacks (the canonical
 *      schema is a superset; both sides of several collisions are referenced by
 *      code, e.g. audit_log.target_id AND chat_messages.file_url).
 *   4. Scratch tables matching /(_backup|_v2|_old|_tmp)$/ are discarded.
 *   5. An explicit override map (below, each citing its evidence) fixes the
 *      load-bearing tables: questions, subscription_tiers, past_papers,
 *      the two parent-link tables, users.school_level, and the 087 triggers
 *      (never extracted — hosted D1 rejects them).
 *   6. Output: header banner, tables in dependency-safe topological order
 *      (REFERENCES graph, parents before children), then all indexes.
 *
 * Usage: node scripts/build-canonical-schema.cjs > database/schema.sql.new
 * Diagnostics (collision log, merges, parity check) go to stderr.
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'database');
const MIGRATIONS_DIR = path.join(DB_DIR, 'migrations', 'archive');
const LIVE_MIGRATIONS_DIR = path.join(DB_DIR, 'migrations');
const LEGACY_SCHEMA = path.join(DB_DIR, 'schema.sql');

// Live DDL folded into the canonical schema (data-only 088/088a and the
// 089 baseline marker stay out — an explicit list, not a directory scan,
// so 089_baseline_marker.sql's schema_baseline INSERT can never leak in).
const LIVE_DDL_FILES = ['090_growth_loop.sql'];

const SCRATCH_RE = /(_backup|_v2|_old|_tmp)$/i;

// Historical banner-only entries: these files lived in database/migrations/
// when the canonical squash was first generated, so their banner lines are
// part of the committed schema.sql. Neither contributes DDL (088 is
// data-only UPDATEs; seed_chat_rooms.sql is INSERT-only and now lives in
// database/seeds/). Kept so regeneration stays byte-identical.
const BANNER_TRAILING_FILES = ['088_normalize_datetime_to_iso.sql', 'seed_chat_rooms.sql'];

// ---------------------------------------------------------------------------
// SQL statement splitter: string-literal aware, paren-depth tracking.
// Splits on ';' at depth 0 outside string literals. Trigger bodies
// (CREATE TRIGGER ... BEGIN ...; END;) split into pieces that never match the
// DDL classifiers below, so the 087 triggers are skipped by construction.
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
      cur += c;
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      cur += c;
      if (c === '*' && sql[i + 1] === '/') {
        cur += '/';
        i++;
        inBlockComment = false;
      }
      continue;
    }
    if (inStr) {
      cur += c;
      if (c === "'") {
        if (sql[i + 1] === "'") {
          cur += sql[++i]; // '' escape
        } else {
          inStr = false;
        }
      }
      continue;
    }
    if (c === '-' && sql[i + 1] === '-') {
      inLineComment = true;
      cur += c;
      continue;
    }
    if (c === '/' && sql[i + 1] === '*') {
      inBlockComment = true;
      cur += c;
      continue;
    }
    if (c === "'") {
      inStr = true;
      cur += c;
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

/** Strip SQL comments (-- line and block) for classification/parsing. */
function stripComments(s) {
  return s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Remove leading comment/blank lines from a statement for clean output. */
function stripLeadingComments(s) {
  const lines = s.split('\n');
  let i = 0;
  while (i < lines.length && (/^\s*--/.test(lines[i]) || /^\s*$/.test(lines[i]))) i++;
  return lines.slice(i).join('\n').trim();
}

/** Parse the top-level comma-separated body of a CREATE TABLE statement. */
function parseTableBody(stmt) {
  const open = stmt.indexOf('(');
  if (open === -1) return [];
  const parts = [];
  let depth = 0;
  let inStr = false;
  let inLineComment = false;
  let seg = '';
  for (let i = open; i < stmt.length; i++) {
    const c = stmt[i];
    if (inLineComment) {
      seg += c;
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inStr) {
      seg += c;
      if (c === "'") {
        if (stmt[i + 1] === "'") {
          seg += stmt[++i];
        } else {
          inStr = false;
        }
      }
      continue;
    }
    if (c === '-' && stmt[i + 1] === '-') {
      inLineComment = true;
      seg += c;
      continue;
    }
    if (c === "'") {
      inStr = true;
      seg += c;
      continue;
    }
    if (c === '(') {
      depth++;
      if (depth === 1) continue; // skip the body's opening paren
    }
    if (c === ')') depth--;
    if (depth === 0) break; // closing paren of the table body
    if (c === ',' && depth === 1) {
      parts.push(seg);
      seg = '';
      continue;
    }
    seg += c;
  }
  if (seg.trim()) parts.push(seg);
  return parts;
}

/** Column names defined by a CREATE TABLE statement (constraints excluded). */
function columnNamesOf(stmt) {
  const names = [];
  for (const part of parseTableBody(stripComments(stmt))) {
    const m = part.trim().match(/^([A-Za-z_][A-Za-z_0-9]*)\s/);
    if (m && !/^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)$/i.test(m[1])) {
      names.push(m[1].toLowerCase());
    }
  }
  return names;
}

/** Append a column definition to a CREATE TABLE statement.
 *  SQLite requires all column-defs to precede table-level constraints
 *  (PRIMARY KEY / UNIQUE / CHECK / FOREIGN KEY), so the column is inserted
 *  before the first table-level constraint, or at the end if there is none. */
function appendColumn(stmt, columnDef) {
  const open = stmt.indexOf('(');
  if (open === -1) throw new Error('malformed CREATE TABLE: no body');
  // Scan top-level body parts, recording where each starts.
  const partStarts = [];
  let depth = 0;
  let inStr = false;
  let inLineComment = false;
  let partStart = open + 1;
  let closeIdx = -1;
  for (let i = open; i < stmt.length; i++) {
    const c = stmt[i];
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inStr) {
      if (c === "'") {
        if (stmt[i + 1] === "'") i++;
        else inStr = false;
      }
      continue;
    }
    if (c === '-' && stmt[i + 1] === '-') {
      inLineComment = true;
      continue;
    }
    if (c === "'") {
      inStr = true;
      continue;
    }
    if (c === '(') depth++;
    if (c === ')') {
      depth--;
      if (depth === 0) {
        closeIdx = i;
        break;
      }
      continue;
    }
    if (c === ',' && depth === 1) {
      partStarts.push(partStart);
      partStart = i + 1;
    }
  }
  if (closeIdx === -1) throw new Error('malformed CREATE TABLE: no closing paren');
  partStarts.push(partStart);
  // First part that is a table-level constraint.
  for (const start of partStarts) {
    const head = stripComments(stmt.slice(start, start + 400)).trimStart();
    if (/^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)\b/i.test(head)) {
      const indent = (stmt.slice(start).match(/^\s*/) || ['    '])[0] || '    ';
      return stmt.slice(0, start) + indent + columnDef + ',\n' + stmt.slice(start);
    }
  }
  return stmt.slice(0, closeIdx).replace(/\s*$/, '') + ',\n    ' + columnDef + '\n' + stmt.slice(closeIdx);
}

// ---------------------------------------------------------------------------
// Table / index stores
// ---------------------------------------------------------------------------
const tables = new Map(); // name -> { sql, columns:Set, source, order, history:[{source, columns}] }
const indexes = new Map(); // name -> { sql, table, columns:[], source, order }
let orderCounter = 0;
const pendingAlters = []; // { table, columnName, columnDef, source }
const diagnostics = {
  collisions: [],
  alterMerges: [],
  alterSkips: [],
  drops: [],
  renames: [],
  scratch: [],
  droppedIndexes: [],
  indexSkips: [],
  triggersSkipped: [],
  unionMerges: [],
  warnings: [],
};

function warn(msg) {
  diagnostics.warnings.push(msg);
}

function handleCreateTable(name, stmt, source) {
  const clean = stripLeadingComments(stmt);
  const cols = columnNamesOf(stmt);
  const existing = tables.get(name);
  if (existing) {
    existing.history.push({ source, columns: cols });
    diagnostics.collisions.push({ table: name, kept: source, previous: existing.source });
  } else {
    tables.set(name, { sql: clean, columns: new Set(cols), source, order: orderCounter++, history: [{ source, columns: cols }] });
    return;
  }
  // Last-definition-wins (task-2 brief, step 3).
  const entry = tables.get(name);
  entry.sql = clean;
  entry.columns = new Set(cols);
  entry.source = source;
  entry.order = orderCounter++;
}

function applyAlter(table, columnName, columnDef, source) {
  const entry = tables.get(table);
  if (!entry) return false;
  if (entry.columns.has(columnName)) {
    diagnostics.alterSkips.push(`${table}.${columnName} (${source}: column already present — historical duplicate-column no-op)`);
    return true;
  }
  if (/NOT\s+NULL/i.test(columnDef) && !/DEFAULT/i.test(columnDef)) {
    warn(`ALTER merge ${table}.${columnName} (${source}) is NOT NULL without DEFAULT — review before publishing`);
  }
  entry.sql = appendColumn(entry.sql, `-- added by ${source}\n    ${columnDef}`);
  entry.columns.add(columnName);
  diagnostics.alterMerges.push(`${table}.${columnName} (${source})`);
  return true;
}

function handleDropTable(name, source) {
  if (tables.delete(name)) {
    diagnostics.drops.push(`${name} (${source})`);
    for (const [idxName, idx] of indexes) {
      if (idx.table === name) indexes.delete(idxName);
    }
  }
}

function handleRename(oldName, newName, source) {
  const entry = tables.get(oldName);
  if (!entry) {
    warn(`RENAME ${oldName} -> ${newName} (${source}): source table not tracked`);
    return;
  }
  tables.delete(oldName);
  entry.sql = entry.sql.replace(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[A-Za-z_0-9]+/i,
    `CREATE TABLE IF NOT EXISTS ${newName}`
  );
  entry.source = `${source} (renamed from ${oldName})`;
  entry.order = orderCounter++;
  entry.renamedFrom = oldName;
  tables.set(newName, entry);
  diagnostics.renames.push(`${oldName} -> ${newName} (${source})`);
}

function handleCreateIndex(name, stmt, table, source) {
  const clean = stripLeadingComments(stmt);
  const onMatch = stmt.match(/\bON\s+([A-Za-z_0-9]+)\s*\(([^)]*)\)/i);
  const cols = onMatch
    ? onMatch[2].split(',').map((c) => stripComments(c).trim().split(/\s+/)[0].replace(/["`\[\]]/g, '').toLowerCase())
    : [];
  const prev = indexes.get(name);
  if (prev) {
    // First-definition-wins for index name collisions: CREATE INDEX IF NOT
    // EXISTS is a historical no-op when the name exists, and the same name is
    // reused across different tables (e.g. idx_audit_log_target on audit_log in
    // 003/schema.sql vs moderation_audit_log in 015). Keeping the first keeps
    // the index on the table the name was historically bound to.
    diagnostics.indexSkips.push(`${name} (${source}: name already bound to ${prev.table} via ${prev.source} — first definition kept)`);
    return;
  }
  indexes.set(name, { sql: clean, table, columns: cols, source, order: orderCounter++ });
}

function processFile(filePath, label) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitStatements(sql);
  let ddlCount = 0;
  for (const raw of statements) {
    const s = stripComments(raw).trim();
    let m;
    if ((m = s.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_0-9]+)/i))) {
      handleCreateTable(m[1].toLowerCase(), raw, label);
      ddlCount++;
    } else if ((m = s.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_0-9]+)\s+ON\s+([A-Za-z_0-9]+)/i))) {
      handleCreateIndex(m[1].toLowerCase(), raw, m[2].toLowerCase(), label);
      ddlCount++;
    } else if ((m = s.match(/^ALTER\s+TABLE\s+([A-Za-z_0-9]+)\s+ADD\s+COLUMN\s+([A-Za-z_0-9]+)\s+([\s\S]+)$/i))) {
      const table = m[1].toLowerCase();
      const columnName = m[2].toLowerCase();
      const columnDef = `${m[2]} ${m[3].trim()}`;
      if (!applyAlter(table, columnName, columnDef, label)) {
        pendingAlters.push({ table, columnName, columnDef, source: label });
      }
      ddlCount++;
    } else if ((m = s.match(/^ALTER\s+TABLE\s+([A-Za-z_0-9]+)\s+RENAME\s+TO\s+([A-Za-z_0-9]+)/i))) {
      handleRename(m[1].toLowerCase(), m[2].toLowerCase(), label);
      ddlCount++;
    } else if ((m = s.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([A-Za-z_0-9]+)/i))) {
      handleDropTable(m[1].toLowerCase(), label);
      ddlCount++;
    } else if (/^CREATE\s+(?:TEMP\s+|TEMPORARY\s+)?TRIGGER/i.test(s)) {
      diagnostics.triggersSkipped.push(label);
    } else if (/^ALTER\s+TABLE/i.test(s)) {
      warn(`unhandled ALTER TABLE form in ${label}: ${s.slice(0, 100)}`);
    }
    // INSERT/UPDATE/DELETE/PRAGMA/etc. are data statements — never carried into
    // the canonical schema (this also excludes 021:361's DELETE FROM
    // subscription_tiers by construction).
  }
  return { statements: statements.length, ddl: ddlCount };
}

// ---------------------------------------------------------------------------
// 1-2. Parse legacy schema.sql, then migrations in lexical order
// ---------------------------------------------------------------------------
const fileStats = [];
fileStats.push({ file: 'schema.sql', ...processFile(LEGACY_SCHEMA, 'schema.sql') });

const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
for (const f of migrationFiles) {
  fileStats.push({ file: f, ...processFile(path.join(MIGRATIONS_DIR, f), `migrations/${f}`) });
}

// Live (post-archive) DDL files, applied after the archive so their ALTERs
// merge through the same applyAlter machinery.
for (const f of LIVE_DDL_FILES) {
  fileStats.push({ file: f, ...processFile(path.join(LIVE_MIGRATIONS_DIR, f), `migrations/${f}`) });
}

// Retry ALTERs whose table did not exist yet (created by a later file).
for (const p of pendingAlters) {
  if (!applyAlter(p.table, p.columnName, p.columnDef, p.source)) {
    warn(`pending ALTER never resolved: ${p.table}.${p.columnName} (${p.source})`);
  }
}

// ---------------------------------------------------------------------------
// 3b. Union pass: append columns from earlier definitions the winner lacks.
// Required because code references both sides of several collisions (e.g.
// audit_log.target_id from schema.sql AND chat_messages.file_url from 014).
// ---------------------------------------------------------------------------
for (const [name, entry] of tables) {
  if (entry.history.length < 2) continue;
  for (const h of entry.history.slice(0, -1)) {
    for (const col of h.columns) {
      if (!entry.columns.has(col)) {
        // Recover the column definition text from the earlier definition.
        const earlierStmt = stripComments(
          stripLeadingComments(
            splitStatements(fs.readFileSync(h.source === 'schema.sql' ? LEGACY_SCHEMA : path.join(MIGRATIONS_DIR, path.basename(h.source)), 'utf8'))
              .find((st) => new RegExp(`^\\s*CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${name}\\b`, 'i').test(stripComments(st))) || ''
          )
        );
        const part = parseTableBody(earlierStmt).find((p) => p.trim().toLowerCase().startsWith(col + ' '));
        if (!part) continue;
        const def = part.trim();
        if (/NOT\s+NULL/i.test(def) && !/DEFAULT/i.test(def)) {
          warn(`union merge ${name}.${col} (${h.source}) is NOT NULL without DEFAULT — review before publishing`);
        }
        entry.sql = appendColumn(entry.sql, `-- merged from earlier definition in ${h.source}\n    ${def}`);
        entry.columns.add(col);
        diagnostics.unionMerges.push(`${name}.${col} (from ${h.source})`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Discard scratch tables
// ---------------------------------------------------------------------------
for (const [name, entry] of [...tables]) {
  if (SCRATCH_RE.test(name)) {
    tables.delete(name);
    for (const [idxName, idx] of indexes) {
      if (idx.table === name) indexes.delete(idxName);
    }
    diagnostics.scratch.push(`${name} (${entry.source})`);
  }
}

// ---------------------------------------------------------------------------
// 5. Override map (each cites its evidence)
// ---------------------------------------------------------------------------

// questions: 028's rebuild shape (028_add_paper_columns.sql:11-37, renamed from
// questions_v2 at :48) + 072's six O/A-level columns (072_o_a_level_system.sql:238-243)
// + FK clauses restored from legacy schema.sql:317-321 — but topic_id stays
// NULLABLE (~600 existing rows lack topic_id; restoring NOT NULL would orphan them).
const QUESTIONS_OVERRIDE = `CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    -- topic_id deliberately NULLABLE (FK restored from legacy schema.sql:317 without
    -- NOT NULL): ~600 migrated rows have no topic. Do NOT add NOT NULL here.
    topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type_id TEXT REFERENCES exam_types(id),
    paper_type_id TEXT REFERENCES paper_types(id),
    past_paper_id TEXT REFERENCES past_papers(id),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN (
        'multiple_choice', 'true_false', 'direct_answer', 'problem', 'riddle',
        'essay', 'short_answer', 'structured', 'practical', 'calculation', 'diagram', 'comprehension'
    )),
    round_type TEXT CHECK (round_type IN ('round_one', 'speed_race', 'problem_of_day', 'true_false', 'riddles')),
    options TEXT, -- JSON array for multiple choice options
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    points INTEGER DEFAULT 3,
    marks INTEGER DEFAULT 1,
    time_limit INTEGER DEFAULT 30, -- seconds
    question_number INTEGER,
    section TEXT,
    is_compulsory INTEGER DEFAULT 1,
    image_url TEXT,
    -- O/A-level columns (072_o_a_level_system.sql:238-243)
    syllabus_topic_id TEXT REFERENCES syllabus_topics(id),
    command_word TEXT,
    assessment_objective TEXT,
    source_paper_code TEXT,
    source_question_number TEXT,
    exam_board_id TEXT REFERENCES exam_boards(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);`;

// subscription_tiers: legacy schema.sql:193-204 + user_type from
// 021_subscription_affiliate_system.sql:20 (the API expects it). 021:361's
// DELETE FROM subscription_tiers is a data statement and is never carried over.
// daily_question_limit arrives via 070_freemium_daily_limits.sql:21's ALTER.
const SUBSCRIPTION_TIERS_OVERRIDE = `CREATE TABLE IF NOT EXISTS subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly REAL DEFAULT 0,
    price_yearly REAL DEFAULT 0,
    currency TEXT DEFAULT 'GHS',
    ai_grading_quota INTEGER DEFAULT 0,
    features TEXT,
    user_type TEXT DEFAULT 'student', -- from 021_subscription_affiliate_system.sql:20 (API expects it)
    daily_question_limit INTEGER DEFAULT -1, -- from 070_freemium_daily_limits.sql:21 (-1 = unlimited)
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);`;

// past_papers: legacy schema.sql:52-72 + 072's ALTERed columns
// (072_o_a_level_system.sql:224-231) with the UNIQUE constraint extended to
// include variant and session. NOTE: SQLite treats NULLs as distinct in UNIQUE
// constraints, so the NULL-month hole from schema.sql:71 persists; that is
// accepted — enforcement moves to db:verify + application upserts.
const PAST_PAPERS_OVERRIDE = `CREATE TABLE IF NOT EXISTS past_papers (
    id TEXT PRIMARY KEY,
    exam_type_id TEXT NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    paper_type_id TEXT NOT NULL REFERENCES paper_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month TEXT,
    series TEXT,
    title TEXT NOT NULL,
    description TEXT,
    total_questions INTEGER DEFAULT 0,
    total_marks INTEGER,
    time_allowed INTEGER,
    instructions TEXT,
    is_complete INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    source_url TEXT,
    -- O/A-level columns (072_o_a_level_system.sql:224-231)
    exam_board_id TEXT REFERENCES exam_boards(id),
    specification_id TEXT REFERENCES subject_specifications(id),
    paper_component_id TEXT REFERENCES paper_components(id),
    variant TEXT,
    session TEXT,
    tier TEXT CHECK (tier IN ('core', 'extended', 'foundation', 'higher', NULL)),
    has_mark_scheme INTEGER DEFAULT 0,
    has_examiner_report INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    -- variant/session added to close the duplicate-paper hole for O/A-level rows.
    -- SQLite treats NULLs as distinct in UNIQUE, so the NULL-month hole persists;
    -- accepted: enforcement moves to db:verify + application upserts.
    UNIQUE(exam_type_id, subject_id, paper_type_id, year, month, variant, session)
);`;

function replaceTable(name, sql, source) {
  const entry = tables.get(name);
  tables.set(name, {
    sql,
    columns: new Set(columnNamesOf(sql)),
    source,
    order: entry ? entry.order : orderCounter++,
    history: entry ? entry.history : [{ source, columns: columnNamesOf(sql) }],
    overridden: true,
  });
}

replaceTable('questions', QUESTIONS_OVERRIDE, 'override: 028 rebuild shape + 072 columns + schema.sql FKs (task-2 brief)');
replaceTable('subscription_tiers', SUBSCRIPTION_TIERS_OVERRIDE, 'override: schema.sql:193-204 + 021 user_type + 070 daily_question_limit (task-2 brief)');
replaceTable('past_papers', PAST_PAPERS_OVERRIDE, 'override: schema.sql:52-72 + 072 columns + extended UNIQUE (task-2 brief)');

// users.school_level CHECK kept deliberately (schema.sql:250): no code or data
// writes 'olevel'/'alevel' to users.school_level (src/lib/api.ts:193 types it
// 'jhs'|'shs'; 072's level values live on exam_types.level). O/A-level students
// store NULL. Annotate the decision in place.
const usersEntry = tables.get('users');
if (usersEntry && /school_level TEXT CHECK/.test(usersEntry.sql)) {
  if (!/school_level CHECK deliberately kept/.test(usersEntry.sql)) {
    usersEntry.sql = usersEntry.sql.replace(
      /(\r?\n(\s*)school_level TEXT CHECK)/,
      '\n$2-- school_level CHECK deliberately kept at (jhs, shs): O/A-level students store NULL\n$2-- here; O/A-level values live on exam_types.level (src/lib/api.ts:193).\n$1'
    );
  }
} else {
  warn('users.school_level CHECK not found — investigate before publishing');
}

// The 8 questions indexes from legacy schema.sql:517-524 (topic, subject, round,
// difficulty, exam_type, paper_type, past_paper, type) must all survive.
const QUESTIONS_INDEXES = [
  'idx_questions_topic',
  'idx_questions_subject',
  'idx_questions_round',
  'idx_questions_difficulty',
  'idx_questions_exam_type',
  'idx_questions_paper_type',
  'idx_questions_past_paper',
  'idx_questions_type',
];
const QUESTIONS_INDEX_SQL = {
  idx_questions_topic: 'CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);',
  idx_questions_subject: 'CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);',
  idx_questions_round: 'CREATE INDEX IF NOT EXISTS idx_questions_round ON questions(round_type);',
  idx_questions_difficulty: 'CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);',
  idx_questions_exam_type: 'CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type_id);',
  idx_questions_paper_type: 'CREATE INDEX IF NOT EXISTS idx_questions_paper_type ON questions(paper_type_id);',
  idx_questions_past_paper: 'CREATE INDEX IF NOT EXISTS idx_questions_past_paper ON questions(past_paper_id);',
  idx_questions_type: 'CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);',
};
for (const idxName of QUESTIONS_INDEXES) {
  if (!indexes.has(idxName)) {
    const col = QUESTIONS_INDEX_SQL[idxName].match(/ON\s+questions\(([^)]*)\)/i)[1].toLowerCase();
    indexes.set(idxName, {
      sql: QUESTIONS_INDEX_SQL[idxName],
      table: 'questions',
      columns: [col],
      source: 'override: restored from legacy schema.sql:517-524',
      order: orderCounter++,
    });
  }
}

// ---------------------------------------------------------------------------
// Index validation: drop indexes whose table or columns no longer exist
// ---------------------------------------------------------------------------
for (const [idxName, idx] of [...indexes]) {
  const entry = tables.get(idx.table);
  if (!entry) {
    indexes.delete(idxName);
    diagnostics.droppedIndexes.push(`${idxName} (table ${idx.table} not in canonical set; from ${idx.source})`);
    continue;
  }
  const missing = idx.columns.filter((c) => c && !entry.columns.has(c));
  if (missing.length > 0) {
    indexes.delete(idxName);
    diagnostics.droppedIndexes.push(`${idxName} (columns [${missing.join(', ')}] not in final ${idx.table}; from ${idx.source})`);
  }
}

// ---------------------------------------------------------------------------
// 6. Topological sort on REFERENCES (parents before children)
// ---------------------------------------------------------------------------
function referencedTables(sql) {
  const refs = new Set();
  const re = /\bREFERENCES\s+([A-Za-z_0-9]+)/gi;
  let m;
  const clean = stripComments(sql);
  while ((m = re.exec(clean))) refs.add(m[1].toLowerCase());
  return refs;
}

function topoSort() {
  const names = [...tables.keys()];
  const deps = new Map(); // name -> Set of names that must come first
  for (const [name, entry] of tables) {
    const d = new Set();
    for (const ref of referencedTables(entry.sql)) {
      if (ref !== name && tables.has(ref)) d.add(ref);
    }
    deps.set(name, d);
  }
  const byOrder = (a, b) => tables.get(a).order - tables.get(b).order;
  const result = [];
  const placed = new Set();
  let stalled = false;
  while (result.length < names.length) {
    const ready = names.filter((n) => !placed.has(n) && [...deps.get(n)].every((r) => placed.has(r))).sort(byOrder);
    if (ready.length === 0) {
      // Cycle: append the rest in insertion order (SQLite resolves FKs lazily).
      const rest = names.filter((n) => !placed.has(n)).sort(byOrder);
      warn(`topological sort cycle among: ${rest.join(', ')} — emitted in insertion order`);
      result.push(...rest);
      stalled = true;
      break;
    }
    for (const n of ready) {
      result.push(n);
      placed.add(n);
    }
  }
  return { sorted: result, stalled };
}

const { sorted } = topoSort();

// ---------------------------------------------------------------------------
// Output-only idempotency normalization.
// Some last-definition-wins sources use bare CREATE TABLE / CREATE INDEX
// (e.g. migrations/016_fix_parent_counselor_messaging.sql's recreations of
// report_schedules, parent_counselor_messages, report_access_logs and their
// indexes). Emitting them bare makes a second application of the canonical
// schema fail with "table/index already exists", which breaks ops rehearsals
// that re-apply schema.sql. Every emitted statement is therefore rewritten to
// its IF NOT EXISTS form here, at the emission boundary only — the stored
// source text used by the collision/union/parity logic above is deliberately
// left untouched.
// ---------------------------------------------------------------------------
function ensureIfNotExists(sql) {
  return sql
    .replace(/^(\s*CREATE\s+TABLE\s+)(?!IF\s+NOT\s+EXISTS\s)/i, '$1IF NOT EXISTS ')
    .replace(/^(\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+)(?!IF\s+NOT\s+EXISTS\s)/i, '$1IF NOT EXISTS ');
}

// ---------------------------------------------------------------------------
// Validation: table-set parity
// ---------------------------------------------------------------------------
// Expected = union of legacy schema.sql tables and non-scratch migration tables
// (both computed from raw text, independent of the simulation above).
function rawCreateTableNames(filePath) {
  const names = new Set();
  for (const st of splitStatements(fs.readFileSync(filePath, 'utf8'))) {
    const m = stripComments(st).trim().match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_0-9]+)/i);
    if (m) names.add(m[1].toLowerCase());
  }
  return names;
}

const expectedTables = new Set();
for (const n of rawCreateTableNames(LEGACY_SCHEMA)) expectedTables.add(n);
let migrationUniqueCount = 0;
{
  const migrationNames = new Set();
  for (const f of migrationFiles) {
    for (const n of rawCreateTableNames(path.join(MIGRATIONS_DIR, f))) migrationNames.add(n);
  }
  migrationUniqueCount = migrationNames.size;
  for (const n of migrationNames) {
    if (!SCRATCH_RE.test(n)) expectedTables.add(n);
  }
  // questions_v2 is renamed to questions by 028, so it is not scratch in the
  // historical sense — but it is still excluded from the expected set because
  // the rename means no table literally named questions_v2 survives.
}

const missingTables = [...expectedTables].filter((t) => !tables.has(t));

// FK target existence
const missingFkTargets = [];
for (const [name, entry] of tables) {
  for (const ref of referencedTables(entry.sql)) {
    if (!tables.has(ref)) missingFkTargets.push(`${name} -> ${ref}`);
  }
}

// ---------------------------------------------------------------------------
// Diagnostics (stderr)
// ---------------------------------------------------------------------------
const out = [];
out.push('=== build-canonical-schema diagnostics ===');
out.push(`files parsed: ${fileStats.length} (1 schema + ${migrationFiles.length} migrations)`);
out.push(`migration CREATE TABLE unique names: ${migrationUniqueCount} (brief expects 178)`);
out.push(`final table count: ${tables.size}, final index count: ${indexes.size}`);
out.push('');
out.push(`-- collisions (last-definition-wins): ${diagnostics.collisions.length}`);
for (const c of diagnostics.collisions) out.push(`   ${c.table}: kept ${c.kept} over ${c.previous}`);
out.push(`-- union merges from earlier definitions: ${diagnostics.unionMerges.length}`);
for (const c of diagnostics.unionMerges) out.push(`   ${c}`);
out.push(`-- ALTER ADD COLUMN merges: ${diagnostics.alterMerges.length}`);
for (const c of diagnostics.alterMerges) out.push(`   ${c}`);
out.push(`-- ALTER skips (column already present): ${diagnostics.alterSkips.length}`);
for (const c of diagnostics.alterSkips) out.push(`   ${c}`);
out.push(`-- DROPs: ${diagnostics.drops.join('; ') || '(none)'}`);
out.push(`-- RENAMEs: ${diagnostics.renames.join('; ') || '(none)'}`);
out.push(`-- scratch tables discarded: ${diagnostics.scratch.join('; ') || '(none)'}`);
out.push(`-- triggers skipped: ${diagnostics.triggersSkipped.join('; ') || '(none)'}`);
out.push(`-- indexes dropped: ${diagnostics.droppedIndexes.length}`);
for (const c of diagnostics.droppedIndexes) out.push(`   ${c}`);
out.push(`-- index collisions skipped (first definition kept): ${diagnostics.indexSkips.length}`);
for (const c of diagnostics.indexSkips) out.push(`   ${c}`);
out.push('');
out.push(`-- table-set parity: expected ${expectedTables.size}, missing ${missingTables.length}`);
for (const t of missingTables) out.push(`   MISSING: ${t}`);
out.push(`-- FK targets missing: ${missingFkTargets.length}`);
for (const t of missingFkTargets) out.push(`   ${t}`);
out.push(`-- warnings: ${diagnostics.warnings.length}`);
for (const w of diagnostics.warnings) out.push(`   ${w}`);
console.error(out.join('\n'));

if (missingTables.length > 0) {
  console.error('\nFATAL: table-set parity failed — refusing to emit schema.');
  process.exit(1);
}
if (migrationUniqueCount !== 178) {
  console.error(`\nFATAL: expected 178 unique migration CREATE TABLE names, got ${migrationUniqueCount}.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Emit the canonical schema (stdout)
// ---------------------------------------------------------------------------
const banner = `-- ============================================================================
-- BRILLA STUDY PLATFORM — CANONICAL DATABASE SCHEMA
-- ============================================================================
-- GENERATED FILE — DO NOT EDIT BY HAND.
-- Regenerate with: node scripts/build-canonical-schema.cjs > database/schema.sql.new
-- (see .superpowers/sdd/2026-08-03-fix-05-database-reckoning/task-2-brief.md)
--
-- Squash of the legacy database/schema.sql plus all migrations below, with
-- last-definition-wins collision resolution, ALTER TABLE ADD COLUMN folding,
-- scratch-table removal, and the task-2 override map (questions /
-- subscription_tiers / past_papers / parent-link tables / 087 triggers).
--
-- Sources (in application order):
--   database/schema.sql (legacy)
${[...migrationFiles, ...BANNER_TRAILING_FILES, ...LIVE_DDL_FILES].map((f) => `--   database/migrations/${f}`).join('\n')}
--
-- PRAGMA foreign_keys = ON;  -- enforced by db:verify and D1; a schema file
-- cannot set PRAGMAs on D1, so this is documented here as a comment.
-- ============================================================================
`;

const sections = [banner];

sections.push('\n-- =============================================\n-- TABLES (dependency order: parents before children)\n-- =============================================\n');
for (const name of sorted) {
  const entry = tables.get(name);
  const header = [`-- Source: ${entry.source}`];
  if (name === 'student_parent_links') {
    header.push('-- LIVE parent-link table: used by workers/api/counselor.ts (~lines 1018-1500).');
  }
  if (name === 'parent_student_links') {
    header.push('-- LEGACY parent-link table (schema.sql / 002_add_parent_system.sql:11): kept because');
    header.push('-- workers/api/index.ts still references it. Candidate for a future data-merge');
    header.push('-- migration into student_parent_links (out of scope for the reckoning).');
  }
  if (name === 'questions_new') {
    header.push('-- LEFTOVER scratch table from 028_seed_past_papers_questions.sql:6 (an aborted');
    header.push('-- table-rebuild: created and INSERTed into, never renamed or dropped). It does not');
    header.push('-- match the task-2 scratch regex /(_backup|_v2|_old|_tmp)$/ so table-set parity');
    header.push('-- requires keeping it; no code references it. Candidate for a future DROP migration.');
  }
  sections.push(header.join('\n') + '\n' + ensureIfNotExists(entry.sql.replace(/;\s*$/, '')) + ';\n');
}

sections.push('\n-- =============================================\n-- INDEXES\n-- =============================================\n');
const sortedIndexes = [...indexes.values()].sort((a, b) => {
  const ta = sorted.indexOf(a.table);
  const tb = sorted.indexOf(b.table);
  if (ta !== tb) return ta - tb;
  return a.order - b.order;
});
for (const idx of sortedIndexes) {
  sections.push(ensureIfNotExists(idx.sql.replace(/;\s*$/, '')) + ';');
}

process.stdout.write(sections.join('\n') + '\n');
