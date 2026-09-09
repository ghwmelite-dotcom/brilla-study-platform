import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '502_bece_ghlang_sprint2_foundation.sql',
  '503_bece_ghlang_greetings.sql',
  '504_bece_ghlang_alphabet.sql',
  '505_bece_ghlang_numbers.sql',
  '506_bece_ghlang_family.sql',
  '507_bece_ghlang_grammar.sql',
  '508_bece_ghlang_proverbs.sql',
  '509_bece_ghlang_culture.sql',
  '510_bece_ghlang_sprint2_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/bece-ghlang-sprint2-001.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));
const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8')) as {
  subjects: Array<{
    subjectId: string;
    questions: Array<{
      id: string;
      topicCode: string;
      type: string;
      options?: Array<{ label: string; text: string }>;
      correctAnswer: string;
    }>;
  }>;
};
const allQuestions = batch.subjects[0].questions;

function createFixture() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
    CREATE TABLE exam_boards (
      id TEXT PRIMARY KEY,
      name TEXT, code TEXT, full_name TEXT, region TEXT, website_url TEXT,
      is_active INTEGER, display_order INTEGER
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
      display_order INTEGER, created_at TEXT DEFAULT (datetime('now')),
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
    INSERT INTO exam_types(id) VALUES ('exam_bece');
    INSERT INTO subjects(id, exam_type_id) VALUES ('subj_bece_gh_lang', 'exam_bece');
  `);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('BECE Ghanaian Language sprint 2 automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-bece-ghlang-s2-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-bece-ghlang-sprint2.mjs'),
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

  it('loads 56 original MCQs across 7 prod-canonical topics with beta provenance', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT t.id AS topicId, COUNT(*) AS count
      FROM questions q JOIN topics t ON t.id = q.topic_id
      WHERE q.id LIKE 'q_bghl_%_s2_%'
      GROUP BY t.id ORDER BY t.id
    `).all()).toEqual([
      { topicId: 'topic_bece_ghlang_alphabet', count: 8 },
      { topicId: 'topic_bece_ghlang_culture', count: 8 },
      { topicId: 'topic_bece_ghlang_family', count: 8 },
      { topicId: 'topic_bece_ghlang_grammar', count: 8 },
      { topicId: 'topic_bece_ghlang_greetings', count: 8 },
      { topicId: 'topic_bece_ghlang_numbers', count: 8 },
      { topicId: 'topic_bece_ghlang_proverbs', count: 8 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM topics
      WHERE id LIKE 'topic_bece_ghlang_%' AND subject_id = 'subj_bece_gh_lang'
    `).get()).toEqual({ count: 7 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id LIKE 'q_bghl_%_s2_%'
        AND q.subject_id = 'subj_bece_gh_lang'
        AND q.subject_id = t.subject_id
        AND q.exam_type_id = 'exam_bece'
        AND q.exam_board_id = 'board_waec'
        AND length(q.explanation) >= 80
        AND qcr.batch_id = 'bece-ghlang-sprint2-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 56 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_bghl_%_s2_%'
        AND question_type = 'multiple_choice'
        AND json_valid(options)
        AND json_array_length(options) = 4
        AND correct_answer IN ('A', 'B', 'C', 'D')
    `).get()).toEqual({ count: 56 });
    expect(db.prepare(`
      SELECT correct_answer AS letter, COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_bghl_%_s2_%' AND question_type = 'multiple_choice'
      GROUP BY correct_answer ORDER BY correct_answer
    `).all()).toEqual([
      { letter: 'A', count: 14 },
      { letter: 'B', count: 14 },
      { letter: 'C', count: 14 },
      { letter: 'D', count: 14 },
    ]);
    expect(db.prepare(`
      SELECT difficulty, COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_bghl_%_s2_%'
      GROUP BY difficulty ORDER BY difficulty
    `).all()).toEqual([
      { difficulty: 'easy', count: 21 },
      { difficulty: 'hard', count: 14 },
      { difficulty: 'medium', count: 21 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions WHERE id LIKE 'q_bghl_%_s2_%'
        GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });

    for (const question of allQuestions) {
      const row = db.prepare('SELECT question_type AS type, options, correct_answer AS correctAnswer, marks FROM questions WHERE id = ?').get(question.id) as {
        type: string;
        options: string | null;
        correctAnswer: string;
        marks: number;
      };
      expect(row.type).toBe('multiple_choice');
      expect(row.correctAnswer).toBe(question.correctAnswer);
      expect(JSON.parse(row.options!)).toEqual(question.options!.map(({ label, text }) => `${label}. ${text}`));
      expect(row.marks).toBe(1);
    }

    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');

    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_bghl_%_s2_%'").get()).toEqual({ count: 56 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'bece-ghlang-sprint2-001'").get()).toEqual({ count: 56 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_bghl_greetings_s2_001', 'topic_bece_ghlang_greetings', 'subj_bece_gh_lang', 'exam_bece',
        'Corrupted content under a reserved stable ID', 'multiple_choice', 'A', 'easy')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get('q_bghl_greetings_s2_001')).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE questions SET source_paper_code = 'BECE 2024', source_question_number = '3' WHERE id = 'q_bghl_greetings_s2_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = 'q_bghl_greetings_s2_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_bghl_%_s2_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
