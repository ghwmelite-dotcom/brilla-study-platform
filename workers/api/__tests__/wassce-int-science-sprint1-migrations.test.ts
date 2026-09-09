import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '412_wassce_int_science_sprint1_foundation.sql',
  '413_wassce_int_science_sprint1_part_1.sql',
  '414_wassce_int_science_sprint1_part_2.sql',
  '415_wassce_int_science_sprint1_part_3.sql',
  '416_wassce_int_science_sprint1_part_4.sql',
  '417_wassce_int_science_sprint1_part_5.sql',
  '418_wassce_int_science_sprint1_part_6.sql',
  '419_wassce_int_science_sprint1_part_7.sql',
  '420_wassce_int_science_sprint1_part_8.sql',
  '421_wassce_int_science_sprint1_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/wassce-int-science-sprint1-001.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));
const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8')) as {
  subjects: Array<{
    subjectId: string;
    questions: Array<{
      id: string;
      type: string;
      topicCode: string;
      options?: Array<{ label: string; text: string }>;
      correctAnswer: string;
    }>;
  }>;
};
const allQuestions = batch.subjects.flatMap((subject) => subject.questions);

function createFixture() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
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
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(subject_id, slug)
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
      exam_board_id TEXT
    );
    CREATE TABLE question_content_releases (
      question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
      batch_id TEXT NOT NULL,
      quality_assurance TEXT NOT NULL CHECK (quality_assurance IN ('automated_beta', 'human_reviewed')),
      release_channel TEXT NOT NULL CHECK (release_channel IN ('beta', 'production')),
      content_label TEXT NOT NULL, source_url TEXT NOT NULL,
      official_exam_board_content INTEGER NOT NULL DEFAULT 0 CHECK (official_exam_board_content IN (0, 1)),
      feedback_enabled INTEGER NOT NULL DEFAULT 1 CHECK (feedback_enabled IN (0, 1)),
      released_at TEXT NOT NULL DEFAULT (datetime('now'))
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
    INSERT INTO subjects(id, exam_type_id) VALUES ('subj_wassce_int_science', 'exam_wassce');
  `);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('WASSCE Integrated Science sprint 1 automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-wassce-isc-sprint1-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-wassce-int-science-sprint1-bank.mjs'),
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

  it('loads 48 original, topic-bound questions with beta release provenance', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT t.id AS topicId, COUNT(*) AS count
      FROM questions q JOIN topics t ON t.id = q.topic_id
      WHERE q.id LIKE 'q_wisc_%_b001_%'
      GROUP BY t.id ORDER BY t.id
    `).all()).toEqual([
      { topicId: 'topic_wassce_intsci_reproduction', count: 6 },
      { topicId: 'topic_wassce_p2_sci_bio', count: 8 },
      { topicId: 'topic_wassce_p2_sci_eco', count: 8 },
      { topicId: 'topic_wassce_p2_sci_enr', count: 10 },
      { topicId: 'topic_wassce_p2_sci_hlt', count: 8 },
      { topicId: 'topic_wassce_p2_sci_mat', count: 8 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id IN (${allQuestions.map((question) => `'${question.id}'`).join(',')})
        AND q.subject_id = 'subj_wassce_int_science'
        AND q.subject_id = t.subject_id
        AND q.exam_type_id = 'exam_wassce'
        AND q.paper_type_id IS NULL
        AND q.past_paper_id IS NULL
        AND q.source_paper_code IS NULL
        AND q.source_question_number IS NULL
        AND length(q.explanation) >= 80
        AND qcr.batch_id = 'wassce-int-science-sprint1-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 48 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions
      WHERE id LIKE 'q_wisc_%_b001_%'
        AND question_type = 'multiple_choice'
        AND json_valid(options) AND json_array_length(options) = 4
        AND correct_answer IN ('A', 'B', 'C', 'D')
        AND marks = 1 AND points = 3 AND time_limit = 45
    `).get()).toEqual({ count: 46 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions
      WHERE id LIKE 'q_wisc_%_b001_%'
        AND question_type = 'calculation'
        AND options IS NULL
        AND length(correct_answer) >= 1
        AND marks = 2 AND points = 4 AND time_limit = 120
    `).get()).toEqual({ count: 2 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });
    expect(db.prepare(`
      SELECT COUNT(DISTINCT correct_answer) AS count FROM questions
      WHERE id LIKE 'q_wisc_%_b001_%' AND question_type = 'multiple_choice'
    `).get()).toEqual({ count: 4 });

    for (const question of allQuestions) {
      const row = db.prepare('SELECT options, correct_answer AS correctAnswer FROM questions WHERE id = ?').get(question.id) as {
        options: string | null;
        correctAnswer: string;
      };
      if (question.type === 'multiple_choice') {
        expect(JSON.parse(row.options!)).toEqual(question.options!.map(({ label, text }) => `${label}. ${text}`));
      } else {
        expect(row.options).toBeNull();
      }
      expect(row.correctAnswer).toBe(question.correctAnswer);
    }

    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');
    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'wassce-int-science-sprint1-001'").get()).toEqual({ count: 48 });
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 3)) db.exec(migration);
    const target = allQuestions[12];
    expect(migrations[3]).toContain(`'${target.id}'`);
    db.prepare(`
      INSERT INTO questions (
        id, topic_id, subject_id, exam_type_id, question_text, question_type,
        options, correct_answer, explanation, difficulty, points, marks,
        time_limit, command_word, assessment_objective
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      target.id, 'topic_wassce_p2_sci_mat', 'subj_wassce_int_science', 'exam_wassce',
      'Corrupted content under a reserved stable ID', 'multiple_choice',
      '["A. Wrong","B. Also wrong","C. Still wrong","D. No"]', 'A',
      'This deliberately incorrect fixture proves that the migration rejects a stable identifier collision instead of certifying it.',
      'easy', 3, 1, 45, 'Identify', 'AO1',
    );
    expect(() => db.exec(migrations[3])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get(target.id)).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 3)) db.exec(migration);
    const target = allQuestions[6];
    db.prepare("UPDATE questions SET source_paper_code = 'WAEC-2026-P1', source_question_number = '1', section = 'official' WHERE id = ?").run(target.id);
    expect(() => db.exec(migrations[2])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 3)) db.exec(migration);
    const target = allQuestions[6];
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = ?").run(target.id);
    expect(() => db.exec(migrations[2])).toThrow();
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 2)) db.exec(migration);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_wisc_rep%_b001_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
