/**
 * DB Verify Gate for Brilla Prep
 * Applies database/schema.sql + database/seed.sql + data-dependent migrations
 * 100 and 101 to an in-memory SQLite DB (node:sqlite, zero deps), then runs
 * integrity checks over the final result.
 *
 * Exit 0 = all checks pass. Exit 1 = any failure (this IS the expected state
 * until the database reckoning tasks land — the failing baseline is the proof
 * the gate works).
 *
 * Checks:
 *   1. schema.sql applies cleanly
 *   2. seed.sql applies cleanly (with PRAGMA foreign_keys = ON)
 *   3. Answer-format checks over questions
 *   4. Referential integrity checks (FK resolution)
 *   5. Post-migration relationship and trigger invariants
 *   6. Duplicate-subject detection
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'database');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');
const SEED_FILE = path.join(DB_DIR, 'seed.sql');
const POST_SEED_MIGRATIONS = [
  path.join(DB_DIR, 'migrations', '100_question_bank_integrity.sql'),
  path.join(DB_DIR, 'migrations', '101_atomic_question_allowance.sql'),
];

const results = [];

/**
 * Record a check result.
 * @param {string} name
 * @param {number} count - number of violations (0 = pass)
 * @param {string} [detail]
 */
function record(name, count, detail) {
  results.push({ name, count, detail: detail || '' });
}

/**
 * Record a check that could not run (e.g. missing table).
 */
function recordSkipped(name, reason) {
  results.push({ name, count: 0, detail: `SKIPPED: ${reason}`, skipped: true });
}

function tableExists(db, table) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);
  return Boolean(row);
}

/**
 * Apply a whole SQL file via db.exec(). On failure, re-apply statement by
 * statement to locate the first failing statement for an informative report.
 * Returns null on success, or an error description string.
 */
function applySqlFile(db, filePath, label, preambleSql) {
  const sql = fs.readFileSync(filePath, 'utf8');
  try {
    db.exec(sql);
    return null;
  } catch (err) {
    // Locate the failing statement. The canonical schema has no triggers, so a
    // naive split on statement boundaries is adequate for error reporting.
    // The probe replays any already-applied files (e.g. schema before seed) so
    // statement numbers line up with the real failure.
    const probe = new DatabaseSync(':memory:');
    let location = 'unknown statement';
    try {
      if (preambleSql) probe.exec(preambleSql);
      const statements = sql.split(/;\s*\n/).filter((s) => s.trim().length > 0);
      for (let i = 0; i < statements.length; i++) {
        try {
          probe.exec(statements[i]);
        } catch (stmtErr) {
          const snippet = statements[i].trim().split('\n').slice(0, 3).join(' ').slice(0, 160);
          location = `statement #${i + 1} of ~${statements.length}: ${snippet}... (${stmtErr.message})`;
          break;
        }
      }
    } finally {
      probe.close();
    }
    return `${label} failed to apply: ${err.message}\n    First failing ${location}`;
  }
}

function main() {
  console.log('\n🗄️  Verifying Brilla Prep Database (schema + seed)\n');
  console.log('='.repeat(50));

  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');

  // --- 1 & 2. Apply schema.sql, seed.sql, then data migrations -------------
  console.log('\n📐 Applying schema.sql...');
  const schemaError = applySqlFile(db, SCHEMA_FILE, 'schema.sql');
  if (schemaError) {
    record('schema.sql applies cleanly', 1, schemaError);
    console.log(`  ✗ ${schemaError}`);
    // Seed cannot meaningfully apply without the schema — record and bail.
    record('seed.sql applies cleanly', 1, 'not attempted (schema failed)');
    return finish(db);
  }
  record('schema.sql applies cleanly', 0);
  console.log('  ✓ schema.sql applied');

  console.log('\n🌱 Applying seed.sql (PRAGMA foreign_keys = ON)...');
  const seedError = applySqlFile(
    db,
    SEED_FILE,
    'seed.sql',
    fs.readFileSync(SCHEMA_FILE, 'utf8')
  );
  if (seedError) {
    record('seed.sql applies cleanly', 1, seedError);
    console.log(`  ✗ ${seedError}`);
    // Continue: content checks over a partially-seeded DB are still useful
    // evidence for the baseline.
  } else {
    record('seed.sql applies cleanly', 0);
    console.log('  ✓ seed.sql applied');
  }

  if (!seedError) {
    console.log('\n🧭 Applying post-seed data migrations...');
    for (const migrationFile of POST_SEED_MIGRATIONS) {
      const label = path.basename(migrationFile);
      const migrationError = applySqlFile(db, migrationFile, label);
      record(`${label} applies cleanly`, migrationError ? 1 : 0, migrationError || '');
      console.log(`  ${migrationError ? '✗' : '✓'} ${migrationError || `${label} applied`}`);
    }
  } else {
    for (const migrationFile of POST_SEED_MIGRATIONS) {
      record(`${path.basename(migrationFile)} applies cleanly`, 1, 'not attempted (seed failed)');
    }
  }

  if (!tableExists(db, 'questions')) {
    recordSkipped('answer-format checks', 'questions table missing');
    recordSkipped('referential checks', 'questions table missing');
    return finish(db);
  }

  // --- 3. Answer-format checks ---------------------------------------------
  console.log('\n📝 Running answer-format checks over questions...');

  const questions = db
    .prepare('SELECT id, question_type, options, correct_answer FROM questions')
    .all();

  let numericMcqAnswers = 0;
  let letterOutOfRange = 0;
  let fullTextNoOptionMatch = 0;
  let firstLetterCollisions = 0;
  let malformedOptionsJson = 0;
  const collisionExamples = [];
  const malformedExamples = [];

  for (const q of questions) {
    const answer = q.correct_answer == null ? '' : String(q.correct_answer).trim();

    // Numeric MCQ answers are their own violation class — count and stop, so
    // they are not double-counted by the full-text checks below.
    if (q.question_type === 'multiple_choice' && /^\d+$/.test(answer)) {
      numericMcqAnswers++;
      continue;
    }

    // Letter / full-text checks require options; free-text rows are legal.
    if (q.options == null) continue;

    let options;
    try {
      options = JSON.parse(q.options);
    } catch {
      // Malformed JSON options break grading outright — count and FAIL the
      // gate below instead of silently skipping.
      malformedOptionsJson++;
      if (malformedExamples.length < 6) malformedExamples.push(q.id);
      continue;
    }
    if (!Array.isArray(options) || options.length === 0) continue;

    if (/^[A-F]$/i.test(answer)) {
      const idx = answer.toUpperCase().charCodeAt(0) - 65;
      if (idx >= options.length) letterOutOfRange++;
      continue;
    }

    if (answer.length === 0) continue;

    // Full-text answer on an MCQ-style row: must exactly equal one option...
    const matchIdx = options.findIndex((o) => String(o).trim() === answer);
    if (matchIdx === -1) {
      fullTextNoOptionMatch++;
      continue;
    }
    // ...and its first letter must not collide with the positional letter of
    // a DIFFERENT option (the q_em_029 / q_ca_001 class of bug).
    const firstLetter = answer.charAt(0).toUpperCase();
    for (let i = 0; i < options.length; i++) {
      if (i === matchIdx) continue;
      if (String.fromCharCode(65 + i) === firstLetter) {
        firstLetterCollisions++;
        if (collisionExamples.length < 6) {
          collisionExamples.push(
            `${q.id}: answer "${answer.slice(0, 40)}" collides with option ${String.fromCharCode(65 + i)}`
          );
        }
        break;
      }
    }
  }

  record('numeric correct_answer on multiple_choice rows', numericMcqAnswers);
  record('single-letter answers outside options range', letterOutOfRange);
  record('full-text answers not matching any option', fullTextNoOptionMatch);
  record(
    'full-text answers with first-letter positional collision',
    firstLetterCollisions,
    collisionExamples.join('; ')
  );
  record('rows with malformed options JSON', malformedOptionsJson, malformedExamples.join('; '));
  console.log(
    `  numeric MCQ answers: ${numericMcqAnswers}, out-of-range letters: ${letterOutOfRange}, ` +
      `no-option-match: ${fullTextNoOptionMatch}, first-letter collisions: ${firstLetterCollisions}, ` +
      `malformed options JSON: ${malformedOptionsJson}`
  );

  // --- 4. Referential checks ------------------------------------------------
  console.log('\n🔗 Running referential integrity checks...');

  const refChecks = [
    ['questions.subject_id → subjects', 'questions', 'subject_id', 'subjects'],
    ['questions.topic_id → topics', 'questions', 'topic_id', 'topics'],
    ['questions.past_paper_id → past_papers', 'questions', 'past_paper_id', 'past_papers'],
    ['questions.exam_type_id → exam_types', 'questions', 'exam_type_id', 'exam_types'],
    ['questions.paper_type_id → paper_types', 'questions', 'paper_type_id', 'paper_types'],
    ['topics.subject_id → subjects', 'topics', 'subject_id', 'subjects'],
    ['past_papers.subject_id → subjects', 'past_papers', 'subject_id', 'subjects'],
    ['flashcard_decks.subject_id → subjects', 'flashcard_decks', 'subject_id', 'subjects'],
    ['user_exam_preferences.user_id → users', 'user_exam_preferences', 'user_id', 'users'],
  ];

  for (const [name, table, column, refTable] of refChecks) {
    if (!tableExists(db, table)) {
      recordSkipped(name, `${table} table not in schema.sql`);
      console.log(`  ⊘ ${name} — skipped (${table} table missing)`);
      continue;
    }
    if (!tableExists(db, refTable)) {
      recordSkipped(name, `${refTable} table not in schema.sql`);
      console.log(`  ⊘ ${name} — skipped (${refTable} table missing)`);
      continue;
    }
    const row = db
      .prepare(
        `SELECT COUNT(*) AS n FROM ${table} t ` +
          `WHERE t.${column} IS NOT NULL ` +
          `AND NOT EXISTS (SELECT 1 FROM ${refTable} r WHERE r.id = t.${column})`
      )
      .get();
    record(name, row.n);
    console.log(`  ${row.n === 0 ? '✓' : '✗'} ${name}: ${row.n} unresolved`);
  }

  // List the unresolved subject IDs for the baseline evidence.
  if (tableExists(db, 'subjects')) {
    const badSubjects = db
      .prepare(
        `SELECT DISTINCT subject_id FROM questions ` +
          `WHERE subject_id IS NOT NULL ` +
          `AND NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = questions.subject_id) ` +
          `ORDER BY subject_id`
      )
      .all();
    if (badSubjects.length > 0) {
      console.log(`    unresolved question subject_ids: ${badSubjects.map((r) => r.subject_id).join(', ')}`);
    }
  }

  // --- 5. Post-migration integrity -------------------------------------------
  const examMismatches = db.prepare(
    `SELECT COUNT(*) AS n FROM questions q JOIN subjects s ON s.id = q.subject_id ` +
      `WHERE q.exam_type_id IS NOT NULL AND q.exam_type_id IS NOT s.exam_type_id`
  ).get().n;
  const topicMismatches = db.prepare(
    `SELECT COUNT(*) AS n FROM questions q JOIN topics t ON t.id = q.topic_id ` +
      `WHERE q.topic_id IS NOT NULL AND t.subject_id <> q.subject_id`
  ).get().n;
  const expectedTriggers = [
    'trg_daily_usage_question_limit_insert',
    'trg_daily_usage_question_limit_update',
    'trg_questions_subject_exam_insert',
    'trg_questions_subject_exam_update',
    'trg_questions_subject_topic_insert',
    'trg_questions_subject_topic_update',
    'trg_subject_exam_update_with_questions',
    'trg_topic_subject_update_with_questions',
  ];
  const triggerPlaceholders = expectedTriggers.map(() => '?').join(', ');
  const installedTriggerCount = db.prepare(
    `SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'trigger' AND name IN (${triggerPlaceholders})`
  ).get(...expectedTriggers).n;

  record('question/subject exam mismatches after migration', examMismatches);
  record('question/topic subject mismatches after migration', topicMismatches);
  record(
    'question-bank and allowance integrity triggers installed',
    installedTriggerCount === expectedTriggers.length ? 0 : 1,
    `${installedTriggerCount}/${expectedTriggers.length} expected triggers installed`
  );
  console.log(`\n🛡️  Post-migration integrity: exam=${examMismatches}, topic=${topicMismatches}, triggers=${installedTriggerCount}/${expectedTriggers.length}`);

  // --- 6. Duplicate-subject detection ---------------------------------------
  console.log('\n👯 Running duplicate-subject detection...');

  if (!tableExists(db, 'subjects')) {
    recordSkipped('duplicate Business Management subjects', 'subjects table missing');
    recordSkipped('duplicate A-Level math subjects', 'subjects table missing');
  } else {
    const busMgmt = db
      .prepare(
        `SELECT id FROM subjects WHERE id IN ('subj_wassce_bus_mgmt', 'subj_wassce_business_mgt') ORDER BY id`
      )
      .all();
    // XOR: exactly one of the two IDs may exist — both present = fail.
    const busMgmtViolations = busMgmt.length > 1 ? 1 : 0;
    record(
      'duplicate Business Management subjects (subj_wassce_bus_mgmt XOR subj_wassce_business_mgt)',
      busMgmtViolations,
      busMgmt.length > 1 ? `both present: ${busMgmt.map((r) => r.id).join(', ')}` : ''
    );
    console.log(
      `  ${busMgmtViolations === 0 ? '✓' : '✗'} Business Management IDs present: ` +
        `${busMgmt.length === 0 ? '(none)' : busMgmt.map((r) => r.id).join(', ')}`
    );

    const alevelMath = db
      .prepare(`SELECT id FROM subjects WHERE id LIKE 'subj_alevel_math%' ORDER BY id`)
      .all();
    const alevelViolations = alevelMath.filter((r) => r.id !== 'subj_alevel_math').length;
    record(
      'duplicate A-Level math subjects (subj_alevel_math only)',
      alevelViolations,
      alevelViolations > 0
        ? `unexpected IDs: ${alevelMath.map((r) => r.id).filter((id) => id !== 'subj_alevel_math').join(', ')}`
        : ''
    );
    console.log(
      `  ${alevelViolations === 0 ? '✓' : '✗'} A-Level math IDs present: ` +
        `${alevelMath.length === 0 ? '(none)' : alevelMath.map((r) => r.id).join(', ')}`
    );
  }

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
    const status = r.skipped ? 'SKIP' : r.count === 0 ? 'PASS' : 'FAIL';
    console.log(`  [${status}] ${r.name.padEnd(66)}${r.skipped ? '-' : r.count}`);
    if (!r.skipped && r.count > 0) failures += r.count;
    if (r.detail && !r.skipped && r.count > 0) {
      console.log(`         ${r.detail.split('\n').join('\n         ')}`);
    }
  }
  console.log('  ' + '-'.repeat(80));

  if (failures > 0) {
    console.log(`\n❌ db:verify FAILED — ${failures} total violation(s) across ${results.length} checks\n`);
    process.exit(1);
  }
  console.log(`\n✅ db:verify PASSED — ${results.length} checks clean\n`);
  process.exit(0);
}

main();
