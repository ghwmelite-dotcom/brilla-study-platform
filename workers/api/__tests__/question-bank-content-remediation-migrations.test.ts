import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const migration102 = readFileSync(
  new URL('../../../database/migrations/102_nsmq_question_alignment.sql', import.meta.url),
  'utf8',
);
const rollback102 = readFileSync(
  new URL('../../../database/rollbacks/102_nsmq_question_alignment.sql', import.meta.url),
  'utf8',
);
const migration103 = readFileSync(
  new URL('../../../database/migrations/103_exact_question_deduplication.sql', import.meta.url),
  'utf8',
);
const rollback103 = readFileSync(
  new URL('../../../database/rollbacks/103_exact_question_deduplication.sql', import.meta.url),
  'utf8',
);
const contentPreflight = readFileSync(
  new URL('../../../database/preflight/102_103_question_content.sql', import.meta.url),
  'utf8',
);

const subjectMappings = [
  ['subj_wassce_core_math', 'subj_nsmq_math'],
  ['subj_wassce_physics', 'subj_nsmq_physics'],
  ['subj_wassce_chemistry', 'subj_nsmq_chemistry'],
  ['subj_wassce_biology', 'subj_nsmq_biology'],
] as const;

function createFixture(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
    CREATE TABLE subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      exam_type_id TEXT REFERENCES exam_types(id),
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      UNIQUE(subject_id, slug)
    );
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      topic_id TEXT REFERENCES topics(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      exam_type_id TEXT REFERENCES exam_types(id),
      paper_type_id TEXT,
      past_paper_id TEXT,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      round_type TEXT,
      options TEXT,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      difficulty TEXT NOT NULL DEFAULT 'medium',
      points INTEGER DEFAULT 3,
      marks INTEGER DEFAULT 1,
      time_limit INTEGER DEFAULT 30,
      question_number INTEGER,
      section TEXT,
      is_compulsory INTEGER DEFAULT 1,
      image_url TEXT,
      syllabus_topic_id TEXT,
      command_word TEXT,
      assessment_objective TEXT,
      source_paper_code TEXT,
      source_question_number TEXT,
      exam_board_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE question_bank_remediation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_id TEXT NOT NULL,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('subject', 'question')),
      entity_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (migration_id, entity_type, entity_id, field_name)
    );
    CREATE TABLE question_attempts (id TEXT PRIMARY KEY, question_id TEXT REFERENCES questions(id) ON DELETE CASCADE);
    CREATE TABLE assessment_questions (id TEXT PRIMARY KEY, question_id TEXT REFERENCES questions(id) ON DELETE SET NULL);
    CREATE TABLE tutor_messages (id TEXT PRIMARY KEY, question_id TEXT REFERENCES questions(id));
    CREATE TABLE brain_teasers (id TEXT PRIMARY KEY, question_id TEXT REFERENCES questions(id));
    CREATE TABLE essay_attempts (id TEXT PRIMARY KEY, question_id TEXT REFERENCES questions(id) ON DELETE CASCADE);
    CREATE TABLE essay_questions (id TEXT PRIMARY KEY, question_id TEXT UNIQUE REFERENCES questions(id) ON DELETE CASCADE);
    CREATE TABLE structured_question_parts (id TEXT PRIMARY KEY, question_id TEXT REFERENCES questions(id) ON DELETE CASCADE);
    CREATE TABLE guidance_session_answers (id TEXT PRIMARY KEY, question_id TEXT REFERENCES questions(id) ON DELETE RESTRICT);
    CREATE TABLE guidance_sessions (id TEXT PRIMARY KEY, status TEXT NOT NULL, questions TEXT NOT NULL);
    CREATE TABLE paper_attempt_answers (id TEXT PRIMARY KEY, question_id TEXT REFERENCES questions(id) ON DELETE CASCADE);
    CREATE TABLE daily_challenges (id TEXT PRIMARY KEY, question_ids TEXT NOT NULL);
    CREATE TABLE team_battles (id TEXT PRIMARY KEY, question_ids TEXT);

    CREATE TRIGGER trg_questions_subject_exam_update
    BEFORE UPDATE OF subject_id, exam_type_id ON questions
    WHEN NEW.exam_type_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = NEW.subject_id AND s.exam_type_id IS NEW.exam_type_id)
    BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_EXAM_MISMATCH'); END;
    CREATE TRIGGER trg_questions_subject_topic_update
    BEFORE UPDATE OF subject_id, topic_id ON questions
    WHEN NEW.topic_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.id = NEW.topic_id AND t.subject_id = NEW.subject_id)
    BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_TOPIC_MISMATCH'); END;

    INSERT INTO exam_types(id) VALUES ('exam_wassce'), ('exam_nsmq');
  `);

  const insertSubject = db.prepare(
    'INSERT INTO subjects(id, name, slug, exam_type_id) VALUES (?, ?, ?, ?)',
  );
  for (const [source, target] of subjectMappings) {
    insertSubject.run(source, source, source.replaceAll('_', '-'), 'exam_wassce');
    insertSubject.run(target, target, target.replaceAll('_', '-'), 'exam_nsmq');
  }
  for (const id of ['subj_math', 'subj_physics', 'subj_chemistry', 'subj_biology']) {
    insertSubject.run(id, id, id.replaceAll('_', '-'), null);
  }

  db.exec(`
    INSERT INTO topics(id, subject_id, name, slug) VALUES
      ('topic_wassce_math_algebra', 'subj_wassce_core_math', ' Algebra ', 'algebra'),
      ('topic_nsmq_math_algebra', 'subj_nsmq_math', 'algebra', 'algebra'),
      ('topic_wassce_physics_motion', 'subj_wassce_physics', 'Motion', 'motion'),
      ('topic_nsmq_physics_motion', 'subj_nsmq_physics', 'motion', 'motion');

    INSERT INTO questions(
      id, topic_id, subject_id, exam_type_id, question_text, question_type,
      round_type, options, correct_answer, explanation
    ) VALUES
      ('q_math_round', 'topic_wassce_math_algebra', 'subj_wassce_core_math', 'exam_wassce',
       'Solve x + 1 = 2', 'direct_answer', 'round_one', NULL, '1', 'Subtract one.'),
      ('q_physics_round', 'topic_wassce_physics_motion', 'subj_wassce_physics', 'exam_wassce',
       'State the unit of velocity', 'direct_answer', 'speed_race', NULL, 'm/s', 'Velocity is distance per time.'),
      ('q_chem_round', NULL, 'subj_wassce_chemistry', 'exam_wassce',
       'Name H2O', 'direct_answer', 'riddles', NULL, 'Water', 'H2O is water.'),
      ('q_bio_round', NULL, 'subj_wassce_biology', 'exam_wassce',
       'Basic unit of life', 'direct_answer', 'true_false', NULL, 'Cell', 'The cell is the basic unit of life.'),
      ('q_existing_target', 'topic_nsmq_math_algebra', 'subj_nsmq_math', 'exam_nsmq',
       'Already canonical', 'direct_answer', 'round_one', NULL, 'Canonical', 'This row must remain unchanged.'),
      ('q_clone_a', NULL, 'subj_wassce_biology', 'exam_wassce',
       'Exact clone', 'multiple_choice', NULL, '["A","B"]', 'A', 'Same explanation.'),
      ('q_clone_b', NULL, 'subj_wassce_biology', 'exam_wassce',
       'Exact clone', 'multiple_choice', NULL, '["A","B"]', 'A', 'Same explanation.');
  `);
  return db;
}

function snapshot(db: Database.Database) {
  return {
    subjects: db.prepare(`SELECT id, exam_type_id, is_active FROM subjects ORDER BY id`).all(),
    questions: db.prepare(`
      SELECT id, topic_id, subject_id, exam_type_id, question_text, round_type
      FROM questions ORDER BY id
    `).all(),
  };
}
function preflightResults(db: Database.Database) {
  const statements = contentPreflight
    .replace(/^--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  return statements.map((statement) => db.prepare(statement).get());
}


describe('question-bank content remediation migrations', () => {
  it('keeps the aggregate-only preflight executable before and after remediation', () => {
    const db = createFixture();
    const beforePreflight = db.serialize();
    expect(preflightResults(db)).toEqual([
      {
        source_rounds: 4,
        target_rounds: 1,
        unexpected_rounds: 0,
        exam_mismatches: 0,
        topic_mismatches: 0,
        legacy_subjects: 4,
        legacy_questions: 0,
        active_guidance_invalid_envelopes: 0,
        active_guidance_moved_pending: 0,
      },
      {
        redundant_rows: 1,
        redundant_round_rows: 0,
        referenced_redundant_rows: 0,
      },
    ]);
    expect(db.serialize()).toEqual(beforePreflight);

    db.exec(migration102);
    db.exec(migration103);
    const afterPreflight = db.serialize();
    expect(preflightResults(db)).toEqual([
      {
        source_rounds: 0,
        target_rounds: 5,
        unexpected_rounds: 0,
        exam_mismatches: 0,
        topic_mismatches: 0,
        legacy_subjects: 4,
        legacy_questions: 0,
        active_guidance_invalid_envelopes: 0,
        active_guidance_moved_pending: 0,
      },
      {
        redundant_rows: 0,
        redundant_round_rows: 0,
        referenced_redundant_rows: 0,
      },
    ]);
    expect(db.serialize()).toEqual(afterPreflight);
    db.close();
  });

  it.each([
    ['102_nsmq_question_alignment.sql', migration102],
    ['103_exact_question_deduplication.sql', migration103],
  ])('keeps %s below the remote D1 query limit with CRLF', (name, sql) => {
    const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
    const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
    expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
  });

  it('moves only NSMQ-format questions, preserves exact topics, retires legacy rows, and rolls back exactly', () => {
    const db = createFixture();
    const before = snapshot(db);

    db.exec(migration102);
    const after = snapshot(db);
    db.exec(migration102);
    expect(snapshot(db)).toEqual(after);

    expect(db.prepare(`
      SELECT id, topic_id AS topicId, subject_id AS subjectId, exam_type_id AS examTypeId
      FROM questions WHERE round_type IS NOT NULL ORDER BY id
    `).all()).toEqual([
      { id: 'q_bio_round', topicId: null, subjectId: 'subj_nsmq_biology', examTypeId: 'exam_nsmq' },
      { id: 'q_chem_round', topicId: null, subjectId: 'subj_nsmq_chemistry', examTypeId: 'exam_nsmq' },
      { id: 'q_existing_target', topicId: 'topic_nsmq_math_algebra', subjectId: 'subj_nsmq_math', examTypeId: 'exam_nsmq' },
      { id: 'q_math_round', topicId: 'topic_nsmq_math_algebra', subjectId: 'subj_nsmq_math', examTypeId: 'exam_nsmq' },
      { id: 'q_physics_round', topicId: 'topic_nsmq_physics_motion', subjectId: 'subj_nsmq_physics', examTypeId: 'exam_nsmq' },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM subjects
      WHERE id IN ('subj_math','subj_physics','subj_chemistry','subj_biology') AND is_active = 0
    `).get()).toEqual({ count: 4 });
    expect(db.pragma('foreign_key_check')).toEqual([]);

    db.exec(rollback102);
    expect(snapshot(db)).toEqual(before);
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });


  it('nulls unmatched and ambiguous topic mappings while preserving rollback evidence', () => {
    const db = createFixture();
    db.exec(`
      INSERT INTO topics(id, subject_id, name, slug) VALUES
        ('topic_wassce_chem_unmatched', 'subj_wassce_chemistry', 'Organic', 'organic-source'),
        ('topic_wassce_bio_ambiguous', 'subj_wassce_biology', 'Cells', 'cells-source'),
        ('topic_nsmq_bio_cells_a', 'subj_nsmq_biology', ' cells ', 'cells-a'),
        ('topic_nsmq_bio_cells_b', 'subj_nsmq_biology', 'CELLS', 'cells-b');
      UPDATE questions SET topic_id = 'topic_wassce_chem_unmatched' WHERE id = 'q_chem_round';
      UPDATE questions SET topic_id = 'topic_wassce_bio_ambiguous' WHERE id = 'q_bio_round';
    `);
    const before = snapshot(db);

    db.exec(migration102);
    expect(db.prepare(`
      SELECT id, topic_id AS topicId FROM questions
      WHERE id IN ('q_chem_round', 'q_bio_round') ORDER BY id
    `).all()).toEqual([
      { id: 'q_bio_round', topicId: null },
      { id: 'q_chem_round', topicId: null },
    ]);
    expect(db.prepare(`
      SELECT entity_id AS entityId, old_value AS oldValue, new_value AS newValue
      FROM question_bank_remediation_log
      WHERE migration_id = '102_nsmq_question_alignment'
        AND field_name = 'topic_id'
        AND entity_id IN ('q_chem_round', 'q_bio_round')
      ORDER BY entity_id
    `).all()).toEqual([
      { entityId: 'q_bio_round', oldValue: 'topic_wassce_bio_ambiguous', newValue: null },
      { entityId: 'q_chem_round', oldValue: 'topic_wassce_chem_unmatched', newValue: null },
    ]);

    db.exec(rollback102);
    expect(snapshot(db)).toEqual(before);
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it.each([
    ['a moved pending question', "INSERT INTO guidance_sessions(id, status, questions) VALUES ('guidance_move', 'in_progress', '{\"asked\":[],\"topicQueue\":[],\"pendingQuestionId\":\"q_math_round\"}')", 0, 1],
    ['a malformed active envelope', "INSERT INTO guidance_sessions(id, status, questions) VALUES ('guidance_bad', 'in_progress', 'not-json')", 1, 0],
  ])('fails migration 102 before mutation when Counselor Brie has %s', (_name, insertSql, invalid, moved) => {
    const db = createFixture();
    db.prepare(insertSql).run();
    const before = snapshot(db);
    expect(preflightResults(db)[0]).toMatchObject({
      active_guidance_invalid_envelopes: invalid,
      active_guidance_moved_pending: moved,
    });

    expect(() => db.exec(migration102)).toThrow();
    expect(snapshot(db)).toEqual(before);
    expect(db.prepare(`SELECT COUNT(*) AS count FROM question_bank_remediation_log`).get())
      .toEqual({ count: 0 });
    db.close();
  });
  it('fails migration 102 before mutation when an unexpected subject owns NSMQ-format content', () => {
    const db = createFixture();
    db.prepare(`
      UPDATE questions
      SET round_type = 'round_one', subject_id = 'subj_math', exam_type_id = NULL, topic_id = NULL
      WHERE id = 'q_clone_a'
    `).run();
    const before = snapshot(db);
    expect(() => db.exec(migration102)).toThrow();
    expect(snapshot(db)).toEqual(before);
    db.close();
  });

  it('does not absorb post-migration NSMQ content into the rollback baseline on rerun', () => {
    const db = createFixture();
    db.exec(migration102);
    db.prepare(`
      INSERT INTO questions(
        id, topic_id, subject_id, exam_type_id, question_text, question_type,
        round_type, correct_answer, explanation
      ) VALUES (
        'q_post_migration', 'topic_nsmq_math_algebra', 'subj_nsmq_math', 'exam_nsmq',
        'Added after migration', 'direct_answer', 'round_one', 'New', 'Post-migration content.'
      )
    `).run();

    db.exec(migration102);
    expect(() => db.exec(rollback102)).toThrow();
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM question_bank_remediation_log
      WHERE migration_id = '102_nsmq_question_alignment'
        AND entity_id = 'q_post_migration'
        AND field_name = 'preexisting_canonical'
    `).get()).toEqual({ count: 0 });
    db.close();
  });
  it('archives and removes only exact unreferenced clones, is idempotent, and rolls back exactly', () => {
    const db = createFixture();
    db.exec(migration102);
    const beforeDedup = snapshot(db);

    db.exec(migration103);
    const after = snapshot(db);
    db.exec(migration103);
    expect(snapshot(db)).toEqual(after);
    expect(db.prepare(`
      SELECT question_id AS questionId, canonical_question_id AS canonicalQuestionId
      FROM question_bank_question_archive
      WHERE migration_id = '103_exact_question_deduplication'
    `).all()).toEqual([{ questionId: 'q_clone_b', canonicalQuestionId: 'q_clone_a' }]);
    expect(db.prepare(`SELECT COUNT(*) AS count FROM questions WHERE question_text = 'Exact clone'`).get())
      .toEqual({ count: 1 });

    db.exec(rollback103);
    expect(snapshot(db)).toEqual(beforeDedup);
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails migration 103 before mutation when a redundant clone is referenced', () => {
    const db = createFixture();
    db.exec(migration102);
    db.prepare(`INSERT INTO question_attempts(id, question_id) VALUES ('attempt_1', 'q_clone_b')`).run();
    const before = snapshot(db);

    expect(() => db.exec(migration103)).toThrow();
    expect(snapshot(db)).toEqual(before);
    expect(db.prepare(`SELECT COUNT(*) AS count FROM question_bank_question_archive`).get())
      .toEqual({ count: 0 });
    db.close();
  });

  it.each([
    ['paper attempt answer', "INSERT INTO paper_attempt_answers(id, question_id) VALUES ('paper_answer_1', 'q_clone_b')"],
    ['Counselor Brie pending question', "INSERT INTO guidance_sessions(id, status, questions) VALUES ('guidance_ref', 'in_progress', '{\"asked\":[],\"topicQueue\":[],\"pendingQuestionId\":\"q_clone_b\"}')"],
    ['daily challenge JSON', "INSERT INTO daily_challenges(id, question_ids) VALUES ('daily_1', '[\"q_clone_b\"]')"],
    ['team battle JSON', "INSERT INTO team_battles(id, question_ids) VALUES ('battle_1', '[\"q_clone_b\"]')"],
  ])('fails migration 103 before mutation for a redundant clone referenced by %s', (_name, insertSql) => {
    const db = createFixture();
    db.exec(migration102);
    db.prepare(insertSql).run();
    const before = snapshot(db);
    expect(preflightResults(db)[1]).toEqual({
      redundant_rows: 1,
      redundant_round_rows: 0,
      referenced_redundant_rows: 1,
    });

    expect(() => db.exec(migration103)).toThrow();
    expect(snapshot(db)).toEqual(before);
    expect(db.prepare(`SELECT COUNT(*) AS count FROM question_bank_question_archive`).get())
      .toEqual({ count: 0 });
    db.close();
  });

  it.each([
    ['daily challenge', "INSERT INTO daily_challenges(id, question_ids) VALUES ('daily_bad', 'not-json')"],
    ['team battle', "INSERT INTO team_battles(id, question_ids) VALUES ('battle_bad', '{\"q\":\"q_clone_b\"}')"],
    ['Counselor Brie active envelope', "INSERT INTO guidance_sessions(id, status, questions) VALUES ('guidance_bad', 'in_progress', 'not-json')"],
  ])('fails migration 103 before mutation for malformed %s question collections', (_name, insertSql) => {
    const db = createFixture();
    db.exec(migration102);
    db.prepare(insertSql).run();
    const before = snapshot(db);

    expect(preflightResults(db)[1]).toEqual({
      redundant_rows: 1,
      redundant_round_rows: 0,
      referenced_redundant_rows: 1,
    });
    expect(() => db.exec(migration103)).toThrow();
    expect(snapshot(db)).toEqual(before);
    expect(db.prepare(`SELECT COUNT(*) AS count FROM question_bank_question_archive`).get())
      .toEqual({ count: 0 });
    db.close();
  });

  it.each([
    ['unreferenced', false],
    ['referenced', true],
  ])('fails migration 103 rerun before mutating a newly introduced %s clone', (_name, referenced) => {
    const db = createFixture();
    db.exec(migration102);
    db.exec(migration103);
    db.prepare(`
      INSERT INTO questions(
        id, topic_id, subject_id, exam_type_id, question_text, question_type,
        round_type, options, correct_answer, explanation
      )
      SELECT 'q_clone_late', topic_id, subject_id, exam_type_id, question_text, question_type,
        round_type, options, correct_answer, explanation
      FROM questions WHERE id = 'q_clone_a'
    `).run();
    if (referenced) {
      db.prepare(`
        INSERT INTO paper_attempt_answers(id, question_id)
        VALUES ('paper_answer_late', 'q_clone_late')
      `).run();
    }
    const before = snapshot(db);

    expect(() => db.exec(migration103)).toThrow();
    expect(snapshot(db)).toEqual(before);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM question_bank_question_archive
      WHERE migration_id = '103_exact_question_deduplication'
    `).get()).toEqual({ count: 1 });
    db.close();
  });
});
