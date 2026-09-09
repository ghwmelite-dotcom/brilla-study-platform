import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '422_wassce_english_sprint1_foundation.sql',
  '423_wassce_english_sprint1_comprehension_mcq_a.sql',
  '424_wassce_english_sprint1_comprehension_mcq_b.sql',
  '425_wassce_english_sprint1_summary_a.sql',
  '426_wassce_english_sprint1_summary_b.sql',
  '427_wassce_english_sprint1_essay_a.sql',
  '428_wassce_english_sprint1_essay_b.sql',
  '429_wassce_english_sprint1_letter_a.sql',
  '430_wassce_english_sprint1_letter_b.sql',
  '431_wassce_english_sprint1_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/wassce-english-sprint1-001.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));
const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8')) as {
  subjects: Array<{
    subjectId: string;
    questions: Array<{
      id: string;
      type: string;
      options?: Array<{ label: string; text: string }>;
      correctAnswer: string;
      parts?: Array<{ label: string; text: string; marks: number; correctAnswer: string }>;
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
      exam_board_id TEXT
    );
    CREATE TABLE structured_question_parts (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      part_label TEXT NOT NULL,
      part_text TEXT NOT NULL,
      marks INTEGER NOT NULL DEFAULT 1,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      answer_type TEXT DEFAULT 'text',
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
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
    INSERT INTO subjects(id, exam_type_id) VALUES ('subj_wassce_english', 'exam_wassce');
  `);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('WASSCE English Language sprint 1 automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-wassce-english-sprint1-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-wassce-english-sprint1.mjs'),
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

  it('loads 48 original topic-bound questions with beta provenance and 9 structured parts', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT topic_id AS topicId, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_eng_s1_%'
      GROUP BY topic_id ORDER BY topic_id
    `).all()).toEqual([
      { topicId: 'topic_wassce_english_comprehension', count: 11 },
      { topicId: 'topic_wassce_english_essay', count: 10 },
      { topicId: 'topic_wassce_english_grammar', count: 2 },
      { topicId: 'topic_wassce_english_letter', count: 10 },
      { topicId: 'topic_wassce_english_literary_devices', count: 5 },
      { topicId: 'topic_wassce_english_summary', count: 10 },
    ]);
    expect(db.prepare(`
      SELECT question_type AS questionType, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_eng_s1_%'
      GROUP BY question_type ORDER BY question_type
    `).all()).toEqual([
      { questionType: 'multiple_choice', count: 40 },
      { questionType: 'short_answer', count: 5 },
      { questionType: 'structured', count: 3 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM topics WHERE id LIKE 'topic_wassce_english_%'
    `).get()).toEqual({ count: 6 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id LIKE 'q_eng_s1_%'
        AND q.subject_id = t.subject_id
        AND q.subject_id = 'subj_wassce_english'
        AND q.exam_type_id = 'exam_wassce'
        AND length(q.explanation) >= 80
        AND qcr.batch_id = 'wassce-english-sprint1-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 48 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_eng_s1_%' AND question_type = 'multiple_choice'
        AND json_valid(options)
        AND json_array_length(options) = 4
        AND correct_answer IN ('A', 'B', 'C', 'D')
    `).get()).toEqual({ count: 40 });
    expect(db.prepare(`
      SELECT COUNT(DISTINCT correct_answer) AS count
      FROM questions
      WHERE id LIKE 'q_eng_s1_%' AND question_type = 'multiple_choice'
    `).get()).toEqual({ count: 4 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM structured_question_parts sp
      JOIN questions q ON q.id = sp.question_id
      WHERE q.id LIKE 'q_eng_s1_%'
    `).get()).toEqual({ count: 9 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions WHERE id LIKE 'q_eng_s1_%'
        GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });

    for (const question of allQuestions) {
      const row = db.prepare('SELECT options, correct_answer AS correctAnswer FROM questions WHERE id = ?').get(question.id) as {
        options: string | null;
        correctAnswer: string;
      };
      expect(row.correctAnswer).toBe(question.correctAnswer);
      if (question.type === 'multiple_choice') {
        expect(JSON.parse(row.options!)).toEqual(question.options!.map(({ label, text }) => `${label}. ${text}`));
      } else {
        expect(row.options).toBeNull();
      }
      if (question.type === 'structured') {
        const parts = db.prepare(
          'SELECT part_label AS label, part_text AS text, marks, correct_answer AS correctAnswer FROM structured_question_parts WHERE question_id = ? ORDER BY display_order',
        ).all(question.id);
        expect(parts).toEqual(question.parts);
      }
    }

    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');

    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_eng_s1_%'").get()).toEqual({ count: 48 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'wassce-english-sprint1-001'").get()).toEqual({ count: 48 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM structured_question_parts sp
      JOIN questions q ON q.id = sp.question_id WHERE q.id LIKE 'q_eng_s1_%'
    `).get()).toEqual({ count: 9 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_eng_s1_cmp_mcq_001', 'topic_wassce_english_comprehension', 'subj_wassce_english', 'exam_wassce',
        'Corrupted content under a reserved stable ID', 'multiple_choice', 'fixture', 'easy')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get('q_eng_s1_cmp_mcq_001')).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE questions SET source_paper_code = 'WASSCE-2024', source_question_number = '1' WHERE id = 'q_eng_s1_cmp_mcq_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = 'q_eng_s1_cmp_mcq_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when a reserved structured part ID contains different content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_eng_s1_ess_st_001', 'topic_wassce_english_essay', 'subj_wassce_english', 'exam_wassce',
        'Placeholder structured stem', 'structured', 'fixture', 'medium')
    `).run();
    db.prepare(`
      INSERT INTO structured_question_parts (id, question_id, part_label, part_text, marks, correct_answer)
      VALUES ('sqp_q_eng_s1_ess_st_001_a', 'q_eng_s1_ess_st_001', 'a', 'Corrupted part text', 3, 'fixture')
    `).run();
    db.exec(migrations[1]);
    db.exec(migrations[2]);
    db.exec(migrations[3]);
    db.exec(migrations[4]);
    expect(() => db.exec(migrations[5])).toThrow();
    expect(db.prepare('SELECT part_text AS text FROM structured_question_parts WHERE id = ?').get('sqp_q_eng_s1_ess_st_001_a')).toEqual({
      text: 'Corrupted part text',
    });
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    // wrangler applies one transaction per migration file; mirror that here so the
    // questions carried by migration 431 roll back when the guard aborts.
    db.exec('BEGIN');
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    db.exec('ROLLBACK');
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_eng_s1_%'").get()).toEqual({ count: 1 });
    db.close();
  });
});
