import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '119_wassce_expansion_beta_foundation.sql',
  '120_irs_beta_foundation.sql',
  '121_elect_beta_foundation.sql',
  '122_irs_beta_part_1.sql',
  '123_irs_beta_part_2.sql',
  '124_irs_beta_part_3.sql',
  '125_irs_beta_part_4.sql',
  '126_irs_beta_part_5.sql',
  '127_irs_beta_part_6.sql',
  '128_irs_beta_part_7.sql',
  '129_irs_beta_part_8.sql',
  '130_elect_beta_part_1.sql',
  '131_elect_beta_part_2.sql',
  '132_elect_beta_part_3.sql',
  '133_elect_beta_part_4.sql',
  '134_elect_beta_part_5.sql',
  '135_elect_beta_part_6.sql',
  '136_elect_beta_part_7.sql',
  '137_elect_beta_part_8.sql',
  '138_wassce_expansion_beta_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/wassce-expansion-beta-001.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));
const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8')) as {
  subjects: Array<{
    subjectId: string;
    questions: Array<{
      id: string;
      options: Array<{ label: string; text: string }>;
      correctAnswer: string;
    }>;
  }>;
};

function createFixture() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
    CREATE TABLE exam_boards (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL,
      full_name TEXT, region TEXT, website_url TEXT, logo_url TEXT,
      is_active INTEGER DEFAULT 1, display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE subjects (
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL REFERENCES exam_types(id)
    );
    CREATE TABLE subject_specifications (
      id TEXT PRIMARY KEY,
      exam_board_id TEXT NOT NULL REFERENCES exam_boards(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      exam_type_id TEXT NOT NULL REFERENCES exam_types(id),
      syllabus_code TEXT NOT NULL, syllabus_name TEXT NOT NULL,
      specification_year TEXT, valid_from TEXT, valid_to TEXT,
      syllabus_pdf_url TEXT, specimen_papers_url TEXT,
      total_papers INTEGER DEFAULT 0, assessment_info TEXT,
      is_active INTEGER DEFAULT 1, display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(exam_board_id, syllabus_code, specification_year)
    );
    CREATE TABLE topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      name TEXT NOT NULL, slug TEXT NOT NULL,
      description TEXT, display_order INTEGER
    );
    CREATE TABLE syllabus_topics (
      id TEXT PRIMARY KEY,
      specification_id TEXT NOT NULL REFERENCES subject_specifications(id),
      topic_code TEXT NOT NULL, title TEXT NOT NULL,
      description TEXT, assessment_objectives TEXT, display_order INTEGER
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
      syllabus_topic_id TEXT REFERENCES syllabus_topics(id), command_word TEXT,
      assessment_objective TEXT, source_paper_code TEXT, source_question_number TEXT,
      exam_board_id TEXT REFERENCES exam_boards(id)
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
    INSERT INTO subjects(id, exam_type_id) VALUES
      ('subj_wassce_irs', 'exam_wassce'),
      ('subj_wassce_elect_app', 'exam_wassce');
  `);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('WASSCE content expansion automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-wassce-expansion-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-wassce-expansion-beta-bank.mjs'),
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

  it('loads 80 original, topic-bound questions with internal blueprint metadata and beta provenance', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT subject_id AS subjectId, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_was_%_b001_%'
      GROUP BY subject_id ORDER BY subject_id
    `).all()).toEqual([
      { subjectId: 'subj_wassce_elect_app', count: 40 },
      { subjectId: 'subj_wassce_irs', count: 40 },
    ]);
    expect(db.prepare(`
      SELECT subject_id AS subjectId, COUNT(*) AS count
      FROM topics GROUP BY subject_id ORDER BY subject_id
    `).all()).toEqual([
      { subjectId: 'subj_wassce_elect_app', count: 8 },
      { subjectId: 'subj_wassce_irs', count: 8 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM subject_specifications
      WHERE id IN ('spec_wassce_irs_brilla_b001', 'spec_wassce_elect_app_brilla_b001')
        AND syllabus_code LIKE 'BRILLA-%'
        AND syllabus_name LIKE 'BrillaPrep % beta content blueprint'
        AND specification_year IS NULL
        AND valid_from IS NULL
        AND total_papers = 0
        AND assessment_info LIKE 'Internal BrillaPrep evidence blueprint%'
    `).get()).toEqual({ count: 2 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_was_commerce_b001_%'").get()).toEqual({ count: 0 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN syllabus_topics st ON st.id = q.syllabus_topic_id
      JOIN subject_specifications ss ON ss.id = st.specification_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id IN (${batch.subjects.flatMap((subject) => subject.questions).map((question) => `'${question.id}'`).join(',')})
        AND q.subject_id = t.subject_id
        AND q.subject_id = ss.subject_id
        AND q.exam_type_id = ss.exam_type_id
        AND q.exam_board_id = ss.exam_board_id
        AND q.question_type = 'multiple_choice'
        AND json_valid(q.options)
        AND json_array_length(q.options) = 4
        AND q.correct_answer IN ('A', 'B', 'C', 'D')
        AND length(q.explanation) >= 80
        AND qcr.batch_id = 'wassce-expansion-beta-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 80 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });

    for (const subject of batch.subjects) {
      const expectedIds = Array.from(
        { length: 40 },
        (_, index) => `q_was_${subject.subjectId === 'subj_wassce_irs' ? 'irs' : 'elect'}_b001_${String(index + 1).padStart(3, '0')}`,
      );
      expect(subject.questions.map((question) => question.id)).toEqual(expectedIds);
      for (const question of subject.questions) {
        const row = db.prepare('SELECT options, correct_answer AS correctAnswer FROM questions WHERE id = ?').get(question.id) as {
          options: string;
          correctAnswer: string;
        };
        expect(JSON.parse(row.options)).toEqual(question.options.map(({ label, text }) => `${label}. ${text}`));
        expect(row.correctAnswer).toBe(question.correctAnswer);
      }
    }

    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');
    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'wassce-expansion-beta-001'").get()).toEqual({ count: 80 });
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 3)) db.exec(migration);
    db.prepare(`
      INSERT INTO questions (
        id, topic_id, subject_id, exam_type_id, question_text, question_type,
        options, correct_answer, explanation, difficulty, points, marks,
        time_limit, syllabus_topic_id, command_word, assessment_objective, exam_board_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'q_was_irs_b001_001', 'topic_was_irs_1', 'subj_wassce_irs', 'exam_wassce',
      'Corrupted content under a reserved stable ID', 'multiple_choice',
      '["A. Wrong","B. Also wrong","C. Still wrong","D. No"]', 'A',
      'This deliberately incorrect fixture proves that the migration rejects a stable identifier collision instead of certifying it.',
      'easy', 1, 1, 90, 'st_was_irs_1', 'Identify', 'AO1', 'board_waec',
    );
    expect(() => db.exec(migrations[3])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get('q_was_irs_b001_001')).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 4)) db.exec(migration);
    db.prepare("UPDATE questions SET source_paper_code = 'WAEC-2026-P1', source_question_number = '1', section = 'official' WHERE id = 'q_was_irs_b001_001'").run();
    expect(() => db.exec(migrations[3])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 4)) db.exec(migration);
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = 'q_was_irs_b001_001'").run();
    expect(() => db.exec(migrations[3])).toThrow();
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 3)) db.exec(migration);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_was_elect_b001_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
