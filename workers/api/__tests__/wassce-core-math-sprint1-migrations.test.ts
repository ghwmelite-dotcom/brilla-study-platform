import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '402_wassce_core_math_sprint1_foundation.sql',
  '403_wassce_core_math_sprint1_part_1.sql',
  '404_wassce_core_math_sprint1_part_2.sql',
  '405_wassce_core_math_sprint1_part_3.sql',
  '406_wassce_core_math_sprint1_part_4.sql',
  '407_wassce_core_math_sprint1_part_5.sql',
  '408_wassce_core_math_sprint1_part_6.sql',
  '409_wassce_core_math_sprint1_part_7.sql',
  '410_wassce_core_math_sprint1_part_8.sql',
  '411_wassce_core_math_sprint1_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/wassce-core-math-sprint1-001.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));
const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8')) as {
  subjects: Array<{
    subjectId: string;
    questions: Array<{
      id: string;
      topicCode: string;
      difficulty: string;
      options: Array<{ label: string; text: string }>;
      correctAnswer: string;
    }>;
  }>;
};
const allQuestions = batch.subjects.flatMap((subject) => subject.questions);
const allQuestionIds = allQuestions.map((question) => question.id);

// The prod-canonical topic bindings this batch uses (verified read-only
// against brilla-db on 2026-09-09). The fixture seeds them directly so the
// foundation migration's INSERT OR IGNORE re-assertion no-ops, exactly as it
// does on prod and on fresh baselines (prod patch 095 + migration 364).
const seededTopics: Array<[string, string]> = [
  ['topic_wcoremath_algebra', 'subj_wassce_core_math'],
  ['topic_wcoremath_quadratic', 'subj_wassce_core_math'],
  ['topic_wcoremath_geometry', 'subj_wassce_core_math'],
  ['topic_wcoremath_trigonometry', 'subj_wassce_core_math'],
  ['topic_wcoremath_statistics', 'subj_wassce_core_math'],
  ['topic_wassce_p2_math_num', 'subj_wassce_core_math'],
];

function createFixture() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
    CREATE TABLE exam_boards (
      id TEXT PRIMARY KEY, name TEXT, code TEXT, full_name TEXT,
      region TEXT, website_url TEXT, is_active INTEGER, display_order INTEGER
    );
    CREATE TABLE subjects (
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL REFERENCES exam_types(id)
    );
    CREATE TABLE topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      parent_id TEXT REFERENCES topics(id),
      name TEXT NOT NULL, slug TEXT NOT NULL,
      description TEXT, theory_content TEXT, key_formulas TEXT,
      display_order INTEGER, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE questions (
      id TEXT PRIMARY KEY, topic_id TEXT REFERENCES topics(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      exam_type_id TEXT REFERENCES exam_types(id), paper_type_id TEXT, past_paper_id TEXT,
      question_text TEXT NOT NULL, question_type TEXT NOT NULL, round_type TEXT,
      options TEXT, correct_answer TEXT NOT NULL,
      explanation TEXT, difficulty TEXT NOT NULL, points INTEGER, marks INTEGER,
      time_limit INTEGER, question_number INTEGER, section TEXT,
      is_compulsory INTEGER DEFAULT 1, image_url TEXT,
      syllabus_topic_id TEXT, command_word TEXT,
      assessment_objective TEXT, source_paper_code TEXT, source_question_number TEXT,
      exam_board_id TEXT REFERENCES exam_boards(id)
    );
    CREATE TRIGGER trg_questions_subject_exam_insert
    BEFORE INSERT ON questions
    WHEN NEW.exam_type_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = NEW.subject_id AND s.exam_type_id IS NEW.exam_type_id
    ) BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_EXAM_MISMATCH'); END;
    CREATE TRIGGER trg_questions_subject_topic_insert
    BEFORE INSERT ON questions
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics t
      WHERE t.id = NEW.topic_id AND t.subject_id = NEW.subject_id
    ) BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_TOPIC_MISMATCH'); END;
    INSERT INTO exam_types(id) VALUES ('exam_wassce');
    INSERT INTO subjects(id, exam_type_id) VALUES ('subj_wassce_core_math', 'exam_wassce');
  `);
  const insertTopic = db.prepare('INSERT INTO topics(id, subject_id, name, slug) VALUES (?, ?, ?, ?)');
  for (const [id, subjectId] of seededTopics) insertTopic.run(id, subjectId, id, id);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('WASSCE Core Mathematics sprint 1 automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-wassce-core-math-sprint1-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-wassce-core-math-sprint1-bank.mjs'),
        '--output-root',
        temporaryRoot,
      ], { cwd: repoRoot, stdio: 'pipe' });
      for (const relativePath of artifactRelativePaths) {
        expect(readFileSync(join(temporaryRoot, relativePath), 'utf8')).toBe(
          readFileSync(join(repoRoot, relativePath), 'utf8'),
        );
      }
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('loads 48 original multiple-choice questions across six prod-canonical topics with beta provenance', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_was_coremath_s1_%'
    `).get()).toEqual({ count: 48 });

    expect(db.prepare(`
      SELECT topic_id AS topicId, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_was_coremath_s1_%'
      GROUP BY topic_id ORDER BY topic_id
    `).all()).toEqual([
      { topicId: 'topic_wassce_p2_math_num', count: 8 },
      { topicId: 'topic_wcoremath_algebra', count: 8 },
      { topicId: 'topic_wcoremath_geometry', count: 8 },
      { topicId: 'topic_wcoremath_quadratic', count: 8 },
      { topicId: 'topic_wcoremath_statistics', count: 8 },
      { topicId: 'topic_wcoremath_trigonometry', count: 8 },
    ]);

    expect(db.prepare(`
      SELECT difficulty, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_was_coremath_s1_%'
      GROUP BY difficulty ORDER BY difficulty
    `).all()).toEqual([
      { difficulty: 'easy', count: 24 },
      { difficulty: 'hard', count: 6 },
      { difficulty: 'medium', count: 18 },
    ]);

    expect(db.prepare(`
      SELECT correct_answer AS correctAnswer, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_was_coremath_s1_%'
      GROUP BY correct_answer ORDER BY correct_answer
    `).all()).toEqual([
      { correctAnswer: 'A', count: 12 },
      { correctAnswer: 'B', count: 12 },
      { correctAnswer: 'C', count: 12 },
      { correctAnswer: 'D', count: 12 },
    ]);

    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id LIKE 'q_was_coremath_s1_%'
        AND q.subject_id = 'subj_wassce_core_math'
        AND q.subject_id = t.subject_id
        AND q.exam_type_id = 'exam_wassce'
        AND q.exam_board_id = 'board_waec'
        AND q.question_type = 'multiple_choice'
        AND q.round_type IS NULL
        AND q.paper_type_id IS NULL
        AND q.past_paper_id IS NULL
        AND q.source_paper_code IS NULL
        AND q.source_question_number IS NULL
        AND json_valid(q.options)
        AND json_array_length(q.options) = 4
        AND q.correct_answer IN ('A', 'B', 'C', 'D')
        AND length(q.explanation) >= 80
        AND q.points = 1 AND q.marks = 1 AND q.time_limit = 90
        AND qcr.batch_id = 'wassce-core-math-sprint1-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 48 });

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions WHERE id LIKE 'q_was_coremath_s1_%'
        GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM question_content_releases
      WHERE batch_id = 'wassce-core-math-sprint1-001'
        AND content_label LIKE '%not official WAEC%'
    `).get()).toEqual({ count: 48 });

    for (const question of allQuestions) {
      const row = db.prepare('SELECT options, correct_answer AS correctAnswer, difficulty FROM questions WHERE id = ?').get(question.id) as {
        options: string;
        correctAnswer: string;
        difficulty: string;
      };
      expect(row.correctAnswer).toBe(question.correctAnswer);
      expect(row.difficulty).toBe(question.difficulty);
      expect(JSON.parse(row.options)).toEqual(question.options.map(({ label, text }) => `${label}. ${text}`));
    }

    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');

    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_was_coremath_s1_%'").get()).toEqual({ count: 48 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'wassce-core-math-sprint1-001'").get()).toEqual({ count: 48 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_was_coremath_s1_001', 'topic_wcoremath_algebra', 'subj_wassce_core_math', 'exam_wassce',
        'Corrupted content under a reserved stable ID', 'multiple_choice', 'fixture', 'easy')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get('q_was_coremath_s1_001')).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE questions SET source_paper_code = 'WASSCE-2024', source_question_number = '1' WHERE id = 'q_was_coremath_s1_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = 'q_was_coremath_s1_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when a reserved ID is pre-bound to the wrong topic of the same subject', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_was_coremath_s1_001', 'topic_wcoremath_quadratic', 'subj_wassce_core_math', 'exam_wassce',
        'Simplify 3x + 5x − 2x.', 'multiple_choice', 'A', 'easy')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('rejects cross-subject topic bindings through the subject/topic consistency trigger', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec("INSERT INTO exam_types(id) VALUES ('exam_nsmq')");
    db.exec("INSERT INTO subjects(id, exam_type_id) VALUES ('subj_nsmq_math', 'exam_nsmq')");
    db.exec("INSERT INTO topics(id, subject_id, name, slug) VALUES ('topic_algebra', 'subj_nsmq_math', 'Algebra', 'algebra')");
    expect(() => db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_scratch_001', 'topic_algebra', 'subj_wassce_core_math', 'exam_wassce',
        'Cross-subject topic binding attempt', 'multiple_choice', 'fixture', 'easy')
    `).run()).toThrow();
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_was_coremath_s1_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
