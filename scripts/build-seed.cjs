/**
 * build-seed.cjs — regenerate database/seed.sql (idempotent squashed seed)
 *
 * Phase 5 Task 4 of the database reckoning. DO NOT hand-edit database/seed.sql;
 * edit the sources and re-run:  node scripts/build-seed.cjs
 *
 * Approach
 * --------
 * Rather than hand-editing ~3.6k INSERTs, this script REPLAYS history onto the
 * canonical schema and dumps the resulting reference dataset:
 *
 *   1. Apply database/schema.sql to an in-memory DB (node:sqlite, FK OFF).
 *   2. Apply base database/seed.sql INSERTs (its old destructive DELETE
 *      prologue is dropped).
 *   3. Replay every database/migrations/archive/*.sql (the squashed 001-087
 *      chain) plus the live 088_normalize_datetime_to_iso.sql and
 *      088a_data_fixes.sql, in filename order, executing only data statements
 *      (INSERT/UPDATE/DELETE); DDL is skipped because the canonical schema
 *      already encodes the final shape. 088/088a MUST be replayed — their
 *      UPDATE/DELETE effects are part of the committed seed (without 088a,
 *      724 numeric answers are unresolvable). 089_baseline_marker.sql is NOT
 *      replayed: its INSERT targets schema_baseline, which the canonical
 *      schema deliberately does not carry. This ordering is
 *      prod-faithful (migrations ran after the original seed) and 088a's data
 *      fixes therefore land exactly as they do on production. Source fixes are
 *      applied as text transforms where Task 3/4 require the seed to differ
 *      from raw history:
 *        - 069: dev-machine user IDs -> student_1 / teacher_1
 *        - 084_alevel_maths: q_alevel_math_0NN -> q_alevel_maths_0NN (its
 *          INSERT OR IGNORE rows collided with 082's PKs and were silently
 *          dropped on prod; the squashed seed restores these 40 questions)
 *        - seed_chat_rooms.sql: EXCLUDED (moved to database/seeds/)
 *   4. Post-passes:
 *        a. Re-insert the canonical subj_wassce_elect_math subject row (063
 *           deleted it; 088a repoints refs to it but creates nothing) and
 *           remap 038/039's phantom subj_elective_math to it.
 *        b. Convert every all-digit multiple_choice correct_answer to its
 *           positional letter form (the 88 rows documented in 088a: each is
 *           verified to exactly equal one option, so this is mechanical).
 *           Without this the db:verify numeric gate trips.
 *        c. Convert full-text answers on OBJECT-form options
 *           ([{"id":"A","text":"..."}]) to letters — full text can never equal
 *           String(object) so the gate's full-text check would flag them.
 *        d. Convert full-text answers whose first letter collides with the
 *           positional letter of a DIFFERENT option to letter form (safety
 *           net; 088a already fixed the known 6).
 *        e. NULL out phantom questions.topic_id values (topic_mathematics /
 *           topic_physics / topic_chemistry / topic_biology from 077-084 are
 *           never created; topic_id is nullable by design — see schema.sql).
 *   5. Validate by re-running the db:verify check classes in-process.
 *   6. Dump every non-empty table in FK-topological order as
 *      INSERT ... ON CONFLICT(id) DO NOTHING, except:
 *        - questions:          ON CONFLICT(id) DO UPDATE SET <mutable cols>
 *                              (replaces 037-039/050-054's OR REPLACE, which
 *                              deleted rows and cascaded into question_attempts)
 *        - subscription_tiers: ON CONFLICT(id) DO UPDATE SET <mutable cols>
 *                              (folds 021's catalog without its FK-breaking
 *                              DELETE FROM subscription_tiers)
 *      "Mutable cols" EXCLUDES created_at: re-seeding an existing DB must not
 *      overwrite row creation timestamps (review finding 2).
 *
 * Determinism (review finding 1): the replay bakes datetime('now') defaults
 * into created_at/updated_at, which would make every regeneration differ.
 * The dump therefore emits a FIXED literal (FIXED_TIMESTAMP below, the squash
 * date) for every non-NULL created_at/updated_at value. Verified safe: the
 * replayed sources contain zero explicit timestamp literals — every dumped
 * timestamp is a replay-time default. Two consecutive runs are byte-identical.
 *   7. Self-test: apply schema + generated seed to a fresh DB with
 *      PRAGMA foreign_keys = ON (mirrors scripts/verify-db.cjs), then apply
 *      the seed twice more to prove idempotency (row counts must be stable).
 *
 * Conflict policy on replay errors: UNIQUE violations on plain INSERTs are
 * logged and skipped (equivalent to OR IGNORE); anything else aborts so the
 * failure is reviewed, unless whitelisted below.
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');
const MIGRATIONS_DIR = path.join(DB_DIR, 'migrations', 'archive');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');
// The pre-Task-4 base seed (exam types, subjects, NSMQ topics/questions,
// riddles, achievements, houses, demo users). Preserved verbatim as the
// generator's base input because database/seed.sql itself is overwritten.
const BASE_SEED_FILE = path.join(DB_DIR, 'seeds', 'seed_base.sql');
const OUT_FILE = path.join(DB_DIR, 'seed.sql');

// Files excluded from the replay (with reasons).
const EXCLUDED_FILES = new Set([
  'seed_chat_rooms.sql', // moved to database/seeds/ (Task 4) — not folded in
  // Belt-and-braces: 089 must never enter the replay (main() already selects
  // replay files explicitly — listed here in case selection ever reverts to a
  // directory scan).
  '089_baseline_marker.sql', // baseline marker for wrangler d1_migrations; its
  //                          INSERT targets schema_baseline, which the canonical
  //                          schema deliberately does not carry.
]);

// Statements whose failure is expected and safe to skip (table-rebuild scratch
// copies that are data-neutral against the canonical schema).
const SKIP_ERROR_PATTERNS = [
  /\bquestions_backup\b/, // 018: rebuild scratch table, copy is data-neutral
  /\bquestions_v2\b/, //     028_add_paper_columns: rebuild scratch table
];

// ---------------------------------------------------------------------------
// SQL statement splitting (handles '--' and '/* */' comments and '' escapes)
// ---------------------------------------------------------------------------
function splitStatements(sql) {
  const statements = [];
  let cur = '';
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const ch = sql[i];
    const next = sql[i + 1];
    if (ch === '-' && next === '-') {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (ch === "'") {
      cur += ch;
      i++;
      while (i < n) {
        cur += sql[i];
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            cur += sql[i + 1];
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (ch === ';') {
      if (cur.trim().length > 0) statements.push(cur.trim());
      cur = '';
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.trim().length > 0) statements.push(cur.trim());
  return statements;
}

function classify(stmt) {
  const m = stmt.match(/^\s*([a-zA-Z]+)/);
  return m ? m[1].toUpperCase() : '';
}

// ---------------------------------------------------------------------------
// Source transforms (Task 3/4 fixes applied at the source)
// ---------------------------------------------------------------------------
const transformLog = [];
function applySourceTransforms(file, sql) {
  if (file === '069_seed_demo_exam_preferences.sql') {
    const before = sql;
    sql = sql.split("'student_1766327981521'").join("'student_1'");
    sql = sql.split("'teacher_1766327981453'").join("'teacher_1'");
    transformLog.push(`${file}: dev-machine user IDs -> student_1/teacher_1 (${before.length - sql.length === 0 ? 'ok' : 'ok'})`);
  }
  if (file === '084_alevel_maths_questions.sql') {
    const count = (sql.match(/q_alevel_math_/g) || []).length;
    sql = sql.split('q_alevel_math_').join('q_alevel_maths_');
    transformLog.push(`${file}: renumbered ${count} q_alevel_math_* id refs -> q_alevel_maths_* (082/084 PK collision fix at source)`);
  }
  if (file === '021_subscription_affiliate_system.sql') {
    // Canonical subscription_tiers.slug is UNIQUE NOT NULL (base schema), but
    // 021's catalog INSERT predates that column. Derive each slug from the
    // tier id ('tier_student_monthly' -> 'student-monthly') at the source.
    const marker = 'INSERT INTO subscription_tiers';
    const start = sql.indexOf(marker);
    if (start !== -1) {
      const end = sql.indexOf(';', start);
      let seg = sql.slice(start, end);
      seg = seg.replace('INSERT INTO subscription_tiers (id, name,', 'INSERT INTO subscription_tiers (id, slug, name,');
      seg = seg.replace(/\('tier_([a-z_]+)',/g, (m, rest) => `('tier_${rest}', '${rest.replace(/_/g, '-')}',`);
      sql = sql.slice(0, start) + seg + sql.slice(end);
      transformLog.push(`${file}: injected derived slug values into tier catalog INSERT (canonical schema requires slug NOT NULL)`);
    }
  }
  return sql;
}

// ---------------------------------------------------------------------------
// Replay
// ---------------------------------------------------------------------------
const replayStats = { inserted: {}, updated: 0, deleted: 0, conflictSkips: [], errorSkips: [] };

function replayFile(db, file, sql) {
  const statements = splitStatements(sql);
  for (const stmt of statements) {
    const kind = classify(stmt);
    if (kind === 'INSERT') {
      try {
        db.exec(stmt);
        const t = stmt.match(/INTO\s+"?(\w+)"?/i);
        if (t) replayStats.inserted[t[1]] = (replayStats.inserted[t[1]] || 0) + 1;
      } catch (err) {
        if (/UNIQUE constraint failed/.test(err.message)) {
          replayStats.conflictSkips.push(`${file}: ${stmt.slice(0, 80).replace(/\s+/g, ' ')}...`);
        } else if (SKIP_ERROR_PATTERNS.some((re) => re.test(stmt))) {
          replayStats.errorSkips.push(`${file}: [whitelisted] ${err.message} :: ${stmt.slice(0, 60).replace(/\s+/g, ' ')}...`);
        } else {
          throw new Error(`Replay failed in ${file}: ${err.message}\nStatement: ${stmt.slice(0, 300)}`);
        }
      }
    } else if (kind === 'UPDATE' || kind === 'DELETE') {
      try {
        db.exec(stmt);
        replayStats[kind === 'UPDATE' ? 'updated' : 'deleted']++;
      } catch (err) {
        throw new Error(`Replay failed in ${file}: ${err.message}\nStatement: ${stmt.slice(0, 300)}`);
      }
    }
    // All other statements (DDL, PRAGMA, ...) are skipped: the canonical
    // schema already encodes the final shape.
  }
}

function naturalMigrationOrder(files) {
  return files.sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (na !== nb) return na - nb;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

// ---------------------------------------------------------------------------
// Post-passes
// ---------------------------------------------------------------------------
const postPassLog = [];

function postPassElectMathSubject(db) {
  // 063 deleted subj_wassce_elect_math (after renaming refs to its duplicate);
  // 088a reversed the rename but nothing re-creates the subject row itself.
  // Re-insert the canonical row (base seed metadata) when missing.
  db.exec(
    `INSERT INTO subjects (id, name, slug, icon, color, description, display_order, ` +
      `exam_type_id, category_id, waec_code, is_active) ` +
      `SELECT 'subj_wassce_elect_math', 'Elective Mathematics', 'wassce-elective-mathematics', ` +
      `'FunctionSquare', '#8B5CF6', 'Advanced mathematical concepts including calculus and statistics', ` +
      `4, 'exam_wassce', 'cat_wassce_science', 'EMA', 1 ` +
      `WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_wassce_elect_math')`
  );
  // 038/039's 100 questions reference phantom subj_elective_math (never created
  // anywhere) — same fix class as 088a's 3b remaps; canonical target is
  // subj_wassce_elect_math.
  const r = db
    .prepare(`UPDATE questions SET subject_id = 'subj_wassce_elect_math' WHERE subject_id = 'subj_elective_math'`)
    .run();
  postPassLog.push(
    `subj_wassce_elect_math: re-inserted canonical subject row; remapped ${r.changes} phantom subj_elective_math questions to it`
  );
}

function optionText(o) {
  if (o && typeof o === 'object') return o.text == null ? '' : String(o.text);
  return String(o);
}

function toLetter(idx) {
  if (idx < 0 || idx > 25) throw new Error(`option index ${idx} out of letter range`);
  return String.fromCharCode(65 + idx);
}

// Convert all-digit MCQ answers (and object-option full-text answers, and
// first-letter collisions) to positional letter form.
function postPassAnswerLetters(db) {
  const rows = db
    .prepare(`SELECT id, question_type, options, correct_answer FROM questions WHERE options IS NOT NULL`)
    .all();
  let digitConversions = 0;
  let objectOptionConversions = 0;
  let collisionConversions = 0;
  const unresolvable = [];

  const update = db.prepare(`UPDATE questions SET correct_answer = ? WHERE id = ?`);

  for (const q of rows) {
    const answer = q.correct_answer == null ? '' : String(q.correct_answer).trim();
    if (answer.length === 0) continue;
    let options;
    try {
      options = JSON.parse(q.options);
    } catch {
      continue;
    }
    if (!Array.isArray(options) || options.length === 0) continue;
    if (/^[A-F]$/i.test(answer)) continue; // already letter form

    const isObjectForm = options.some((o) => o && typeof o === 'object');
    const isDigit = /^\d+$/.test(answer);

    // Find options whose text exactly equals the answer.
    const matchIdxs = [];
    options.forEach((o, i) => {
      if (optionText(o).trim() === answer) matchIdxs.push(i);
    });

    if (q.question_type === 'multiple_choice' && isDigit) {
      // The 88 documented rows: digit answer that exactly equals one option.
      if (matchIdxs.length === 1) {
        update.run(toLetter(matchIdxs[0]), q.id);
        digitConversions++;
      } else {
        unresolvable.push(`${q.id}: digit answer '${answer}' matches ${matchIdxs.length} options`);
      }
      continue;
    }

    if (isObjectForm) {
      // Full-text can never equal String(object) — gate would flag it.
      if (matchIdxs.length === 1) {
        update.run(toLetter(matchIdxs[0]), q.id);
        objectOptionConversions++;
      } else {
        unresolvable.push(`${q.id}: object-form options, answer '${answer.slice(0, 40)}' matches ${matchIdxs.length}`);
      }
      continue;
    }

    // String-form options, full-text answer.
    if (matchIdxs.length === 0) {
      unresolvable.push(`${q.id}: full-text answer '${answer.slice(0, 40)}' matches no option`);
      continue;
    }
    // When 2+ options share identical text (matchIdxs.length > 1) the first
    // match is used: identical option text makes the choice grading-equivalent.
    const matchIdx = matchIdxs[0];
    const firstLetter = answer.charAt(0).toUpperCase();
    const collides = options.some((_, i) => i !== matchIdx && toLetter(i) === firstLetter);
    if (collides) {
      update.run(toLetter(matchIdx), q.id);
      collisionConversions++;
    }
  }

  postPassLog.push(`letter conversions: ${digitConversions} digit, ${objectOptionConversions} object-option, ${collisionConversions} first-letter collision`);
  if (unresolvable.length > 0) {
    postPassLog.push(`UNRESOLVABLE answers (${unresolvable.length}):\n  ` + unresolvable.slice(0, 50).join('\n  '));
  }
  return unresolvable;
}

function postPassPhantomTopics(db) {
  const phantom = db
    .prepare(
      `SELECT DISTINCT topic_id FROM questions WHERE topic_id IS NOT NULL ` +
        `AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id = questions.topic_id) ORDER BY topic_id`
    )
    .all()
    .map((r) => r.topic_id);
  if (phantom.length > 0) {
    const res = db
      .prepare(
        `UPDATE questions SET topic_id = NULL WHERE topic_id IS NOT NULL ` +
          `AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id = questions.topic_id)`
      )
      .run();
    postPassLog.push(`nulled phantom questions.topic_id (${res.changes} rows): ${phantom.join(', ')}`);
  } else {
    postPassLog.push('no phantom questions.topic_id values');
  }
  // Same sweep for topics.parent_id (self-FK is enforced with FK ON).
  const badParents = db
    .prepare(
      `SELECT COUNT(*) n FROM topics WHERE parent_id IS NOT NULL ` +
        `AND NOT EXISTS (SELECT 1 FROM topics p WHERE p.id = topics.parent_id)`
    )
    .get().n;
  if (badParents > 0) {
    db.exec(
      `UPDATE topics SET parent_id = NULL WHERE parent_id IS NOT NULL ` +
        `AND NOT EXISTS (SELECT 1 FROM topics p WHERE p.id = topics.parent_id)`
    );
    postPassLog.push(`nulled ${badParents} phantom topics.parent_id values`);
  }
}

// ---------------------------------------------------------------------------
// Validation (mirrors scripts/verify-db.cjs check classes)
// ---------------------------------------------------------------------------
function validate(db) {
  const problems = [];
  const questions = db.prepare('SELECT id, question_type, options, correct_answer FROM questions').all();
  let numeric = 0;
  let outOfRange = 0;
  let noMatch = 0;
  let collisions = 0;
  for (const q of questions) {
    const answer = q.correct_answer == null ? '' : String(q.correct_answer).trim();
    if (q.question_type === 'multiple_choice' && /^\d+$/.test(answer)) {
      numeric++;
      continue;
    }
    if (q.options == null) continue;
    let options;
    try {
      options = JSON.parse(q.options);
    } catch {
      continue;
    }
    if (!Array.isArray(options) || options.length === 0) continue;
    if (/^[A-F]$/i.test(answer)) {
      if (answer.toUpperCase().charCodeAt(0) - 65 >= options.length) outOfRange++;
      continue;
    }
    if (answer.length === 0) continue;
    const matchIdx = options.findIndex((o) => String(o).trim() === answer);
    if (matchIdx === -1) {
      noMatch++;
      continue;
    }
    const firstLetter = answer.charAt(0).toUpperCase();
    for (let i = 0; i < options.length; i++) {
      if (i !== matchIdx && String.fromCharCode(65 + i) === firstLetter) {
        collisions++;
        break;
      }
    }
  }
  if (numeric) problems.push(`numeric MCQ answers: ${numeric}`);
  if (outOfRange) problems.push(`letters out of range: ${outOfRange}`);
  if (noMatch) problems.push(`full-text answers matching no option: ${noMatch}`);
  if (collisions) problems.push(`first-letter collisions: ${collisions}`);

  const refChecks = [
    ['questions', 'subject_id', 'subjects'],
    ['questions', 'topic_id', 'topics'],
    ['questions', 'past_paper_id', 'past_papers'],
    ['questions', 'exam_type_id', 'exam_types'],
    ['questions', 'paper_type_id', 'paper_types'],
    ['topics', 'subject_id', 'subjects'],
    ['past_papers', 'subject_id', 'subjects'],
    ['flashcard_decks', 'subject_id', 'subjects'],
    ['user_exam_preferences', 'user_id', 'users'],
  ];
  for (const [table, column, refTable] of refChecks) {
    const n = db
      .prepare(
        `SELECT COUNT(*) n FROM ${table} t WHERE t.${column} IS NOT NULL ` +
          `AND NOT EXISTS (SELECT 1 FROM ${refTable} r WHERE r.id = t.${column})`
      )
      .get().n;
    if (n) {
      const ids = db
        .prepare(
          `SELECT DISTINCT t.${column} v FROM ${table} t WHERE t.${column} IS NOT NULL ` +
            `AND NOT EXISTS (SELECT 1 FROM ${refTable} r WHERE r.id = t.${column}) ORDER BY v`
        )
        .all()
        .map((r) => r.v);
      problems.push(`${table}.${column} -> ${refTable}: ${n} unresolved [${ids.join(', ')}]`);
    }
  }
  const dupBus = db
    .prepare(`SELECT COUNT(*) n FROM subjects WHERE id IN ('subj_wassce_bus_mgmt','subj_wassce_business_mgt')`)
    .get().n;
  if (dupBus > 1) problems.push('duplicate Business Management subjects');
  const dupAlevel = db
    .prepare(`SELECT id FROM subjects WHERE id LIKE 'subj_alevel_math%' AND id != 'subj_alevel_math'`)
    .all();
  if (dupAlevel.length) problems.push(`unexpected A-Level math subjects: ${dupAlevel.map((r) => r.id).join(', ')}`);
  return problems;
}

// ---------------------------------------------------------------------------
// Dump
// ---------------------------------------------------------------------------
function sqlLiteral(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'bigint') return v.toString();
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function tableMeta(db, table) {
  const cols = db.prepare(`PRAGMA table_info("${table}")`).all();
  const pkCols = cols.filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk).map((c) => c.name);
  return { cols: cols.map((c) => c.name), pkCols };
}

function topoOrder(db, tables) {
  // table -> set of referenced tables (excluding self-references)
  const deps = new Map(tables.map((t) => [t, new Set()]));
  for (const t of tables) {
    for (const fk of db.prepare(`PRAGMA foreign_key_list("${t}")`).all()) {
      if (fk.table !== t && deps.has(fk.table)) deps.get(t).add(fk.table);
    }
  }
  const order = [];
  const remaining = new Set(tables);
  while (remaining.size > 0) {
    const ready = [...remaining].filter((t) => [...deps.get(t)].every((d) => !remaining.has(d))).sort();
    if (ready.length === 0) {
      // Cycle — break alphabetically; the FK-ON self-test will catch problems.
      const first = [...remaining].sort()[0];
      ready.push(first);
    }
    for (const t of ready) {
      order.push(t);
      remaining.delete(t);
    }
  }
  return order;
}

function sortedRows(db, table, meta) {
  const selfFk = db
    .prepare(`PRAGMA foreign_key_list("${table}")`)
    .all()
    .find((fk) => fk.table === table);
  const rows = db.prepare(`SELECT * FROM "${table}"`).all();
  if (!selfFk) {
    const key = meta.pkCols[0] || meta.cols[0];
    return rows.sort((a, b) => String(a[key]).localeCompare(String(b[key])));
  }
  // Self-referencing table (e.g. topics.parent_id): parents before children.
  const idCol = meta.pkCols[0] || 'id';
  const parentCol = selfFk.from;
  const byId = new Map(rows.map((r) => [r[idCol], r]));
  const depthCache = new Map();
  const depth = (r, seen = new Set()) => {
    if (depthCache.has(r[idCol])) return depthCache.get(r[idCol]);
    const p = r[parentCol];
    if (p == null || !byId.has(p) || seen.has(r[idCol])) return 0;
    seen.add(r[idCol]);
    const d = 1 + depth(byId.get(p), seen);
    depthCache.set(r[idCol], d);
    return d;
  };
  return rows.sort((a, b) => depth(a) - depth(b) || String(a[idCol]).localeCompare(String(b[idCol])));
}

const DO_UPDATE_TABLES = new Set(['questions', 'subscription_tiers']);
// Squash date: fixed literal emitted for every non-NULL created_at/updated_at
// (see "Determinism" in the file header).
const FIXED_TIMESTAMP = '2026-08-04T00:00:00.000Z';
const NORMALIZED_TS_COLS = new Set(['created_at', 'updated_at']);
// Columns never touched by DO UPDATE on re-seed (identity + creation time).
const DO_UPDATE_EXCLUDED_COLS = new Set(['created_at']);
const CHUNK = 100;

function dumpTable(db, table) {
  const meta = tableMeta(db, table);
  const rows = sortedRows(db, table, meta);
  if (rows.length === 0) return null;

  let conflict;
  if (DO_UPDATE_TABLES.has(table) && meta.pkCols.length === 1) {
    const mutable = meta.cols.filter((c) => c !== meta.pkCols[0] && !DO_UPDATE_EXCLUDED_COLS.has(c));
    conflict =
      `ON CONFLICT(${meta.pkCols[0]}) DO UPDATE SET\n` +
      mutable.map((c) => `  ${c} = excluded.${c}`).join(',\n');
  } else if (meta.pkCols.length === 1) {
    conflict = `ON CONFLICT(${meta.pkCols[0]}) DO NOTHING`;
  } else {
    conflict = `ON CONFLICT DO NOTHING`;
  }

  const colList = meta.cols.join(', ');
  const parts = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const values = chunk.map(
      (r) =>
        '(' +
        meta.cols
          .map((c) =>
            NORMALIZED_TS_COLS.has(c) && r[c] !== null && r[c] !== undefined
              ? sqlLiteral(FIXED_TIMESTAMP)
              : sqlLiteral(r[c])
          )
          .join(', ') +
        ')'
    );
    parts.push(`INSERT INTO "${table}" (${colList}) VALUES\n${values.join(',\n')}\n${conflict};`);
  }
  return { table, count: rows.length, sql: parts.join('\n\n') };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log('🏗️  build-seed: replaying schema + base seed + migrations...\n');
  const db = new DatabaseSync(':memory:');
  // Replay is deliberately FK-OFF: migrations ran in an order that assumes the
  // old (pre-canonical) schema, and 021 legitimately DELETEs+reinserts the tier
  // catalog. FK integrity is enforced later by the FK-ON self-test.
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec(fs.readFileSync(SCHEMA_FILE, 'utf8'));

  // Base seed (INSERTs only — the old DELETE prologue is intentionally dropped).
  replayFile(db, 'seed.sql (base)', fs.readFileSync(BASE_SEED_FILE, 'utf8'));

  // Replay set: the squashed 001-087 chain from migrations/archive/ PLUS the
  // live 088/088a data mutations (their UPDATE/DELETE effects are part of the
  // committed seed — dropping them leaves 724 unresolvable numeric answers).
  // 089_baseline_marker is deliberately NOT replayed: it INSERTs into
  // schema_baseline, a table the canonical schema intentionally does not carry.
  const LIVE_REPLAY_FILES = ['088_normalize_datetime_to_iso.sql', '088a_data_fixes.sql'];
  const liveDir = path.join(DB_DIR, 'migrations');
  const files = naturalMigrationOrder([
    ...fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql') && !EXCLUDED_FILES.has(f)),
    ...LIVE_REPLAY_FILES,
  ]);
  for (const file of files) {
    const dir = LIVE_REPLAY_FILES.includes(file) ? liveDir : MIGRATIONS_DIR;
    const sql = applySourceTransforms(file, fs.readFileSync(path.join(dir, file), 'utf8'));
    replayFile(db, file, sql);
  }

  console.log('Replay complete. Inserted-row counts by target table (statement counts):');
  for (const [t, n] of Object.entries(replayStats.inserted).sort()) {
    console.log(`  ${t}: ${n} INSERT statements`);
  }
  console.log(`  UPDATE statements: ${replayStats.updated}, DELETE statements: ${replayStats.deleted}`);
  console.log(`  UNIQUE-conflict skips (plain INSERT treated as OR IGNORE): ${replayStats.conflictSkips.length}`);
  for (const s of replayStats.conflictSkips.slice(0, 20)) console.log(`    - ${s}`);
  console.log(`  whitelisted error skips: ${replayStats.errorSkips.length}`);
  for (const s of replayStats.errorSkips) console.log(`    - ${s}`);
  console.log('\nSource transforms:');
  for (const s of transformLog) console.log(`  ${s}`);

  console.log('\n🔧 Post-passes...');
  postPassElectMathSubject(db);
  const unresolvable = postPassAnswerLetters(db);
  postPassPhantomTopics(db);
  for (const s of postPassLog) console.log(`  ${s}`);
  if (unresolvable.length > 0) {
    console.error(`\n❌ ${unresolvable.length} unresolvable answers — review before regenerating.`);
    process.exit(1);
  }

  console.log('\n✅ Validating (mirror of db:verify checks)...');
  const problems = validate(db);
  if (problems.length > 0) {
    console.error('❌ validation failed:\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  console.log('  all checks clean');

  // Dump
  console.log('\n📦 Dumping...');
  const allTables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
    .all()
    .map((r) => r.name);
  const nonEmpty = allTables.filter((t) => db.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n > 0);
  const order = topoOrder(db, nonEmpty);

  const header = [
    '-- Brilla Study Platform Seed Data (IDEMPOTENT — safe to re-run)',
    '-- NEVER run this file against production casually. It writes demo users',
    '-- (admin_1, teacher_1, student_1) and reference content. For production,',
    '-- run only database/migrations/088a_data_fixes.sql.',
    '--',
    '-- GENERATED FILE — do not hand-edit. Regenerate with:',
    '--   node scripts/build-seed.cjs',
    '-- Sources: database/schema.sql shape + base seed + migrations 001-088a',
    '-- (data statements replayed in order, Task 3 fixes included). See the',
    '-- generator header for the full transform list.',
    '',
  ].join('\n');

  const sections = [header];
  const counts = [];
  for (const table of order) {
    const dumped = dumpTable(db, table);
    if (!dumped) continue;
    counts.push(`${table}=${dumped.count}`);
    sections.push(
      `-- =============================================\n-- ${table.toUpperCase()} (${dumped.count} rows)\n-- =============================================\n${dumped.sql}`
    );
  }
  const out = sections.join('\n\n') + '\n';
  fs.writeFileSync(OUT_FILE, out);
  console.log(`  wrote ${OUT_FILE} (${(out.length / 1024 / 1024).toFixed(2)} MB)`);
  console.log('  table counts: ' + counts.join(', '));

  // Self-test: fresh DB, FK ON, apply schema + generated seed 3x.
  console.log('\n🧪 Self-test: schema + seed x3 with PRAGMA foreign_keys = ON...');
  const test = new DatabaseSync(':memory:');
  test.exec('PRAGMA foreign_keys = ON');
  test.exec(fs.readFileSync(SCHEMA_FILE, 'utf8'));
  test.exec(out);
  const countOf = (d) =>
    Object.fromEntries(
      ['questions', 'subjects', 'topics', 'past_papers', 'users', 'subscription_tiers'].map((t) => [
        t,
        d.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n,
      ])
    );
  const c1 = countOf(test);
  test.exec(out);
  const c2 = countOf(test);
  test.exec(out);
  const c3 = countOf(test);
  const fkViolations = test.prepare('PRAGMA foreign_key_check').all();
  const stable = JSON.stringify(c1) === JSON.stringify(c2) && JSON.stringify(c2) === JSON.stringify(c3);
  console.log(`  after 1x: ${JSON.stringify(c1)}`);
  console.log(`  after 2x: ${JSON.stringify(c2)}`);
  console.log(`  after 3x: ${JSON.stringify(c3)}`);
  if (!stable) {
    console.error('❌ idempotency self-test FAILED — counts changed across re-runs');
    process.exit(1);
  }
  if (fkViolations.length > 0) {
    console.error(`❌ foreign_key_check reported ${fkViolations.length} violation(s):`);
    for (const v of fkViolations.slice(0, 20)) console.error(`  ${JSON.stringify(v)}`);
    process.exit(1);
  }
  console.log('  ✓ idempotent; foreign_key_check clean');
  console.log('\n✅ build-seed complete.');
}

main();
