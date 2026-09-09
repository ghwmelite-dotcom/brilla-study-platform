import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '472_alevel_bio_sprint2_foundation.sql',
  '473_alevel_bio_sprint2_ecology_mcq_a.sql',
  '474_alevel_bio_sprint2_ecology_mcq_b.sql',
  '475_alevel_bio_sprint2_ecology_calculations.sql',
  '476_alevel_bio_sprint2_ecology_structured.sql',
  '477_alevel_bio_sprint2_cells.sql',
  '478_alevel_bio_sprint2_membranes.sql',
  '479_alevel_bio_sprint2_metabolism.sql',
  '480_alevel_bio_sprint2_genetics.sql',
  '481_alevel_bio_sprint2_homeostasis.sql',
  '482_alevel_bio_sprint2_biodiversity.sql',
  '483_alevel_bio_sprint2_biotech.sql',
  '484_alevel_bio_sprint2_immunity.sql',
  '485_alevel_bio_sprint2_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/alevel-bio-sprint2-001.json', ...migrationRelativePaths];
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
      parts?: Array<{ label: string; text: string; marks: number; correctAnswer: string }>;
    }>;
  }>;
};
const allQuestions = batch.subjects[0].questions;
const allQuestionIds = allQuestions.map((question) => question.id);

function createFixture() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
    CREATE TABLE exam_boards (id TEXT PRIMARY KEY);
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
    CREATE TABLE structured_question_parts (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      part_label TEXT NOT NULL,
      part_text TEXT NOT NULL,
      marks INTEGER NOT NULL DEFAULT 1,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'calculation', 'diagram', 'table', 'graph')),
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
    INSERT INTO exam_types(id) VALUES ('cambridge_a2');
    INSERT INTO exam_boards(id) VALUES ('board_cambridge');
    INSERT INTO subjects(id, exam_type_id) VALUES ('subj_alevel_biology', 'cambridge_a2');
    INSERT INTO topics(id, subject_id, name, slug) VALUES
      ('topic_alevel_bio_cells', 'subj_alevel_biology', 'Cells and Biological Molecules', 'cells-and-biological-molecules'),
      ('topic_alevel_bio_membranes', 'subj_alevel_biology', 'Membranes and Transport', 'membranes-and-transport'),
      ('topic_alevel_bio_metabolism', 'subj_alevel_biology', 'Metabolism: Respiration and Photosynthesis', 'metabolism-respiration-photosynthesis'),
      ('topic_alevel_bio_genetics', 'subj_alevel_biology', 'Genetics, Inheritance and Evolution', 'genetics-inheritance-evolution'),
      ('topic_alevel_bio_homeostasis', 'subj_alevel_biology', 'Control and Homeostasis', 'control-and-homeostasis'),
      ('topic_alevel_bio_biodiversity', 'subj_alevel_biology', 'Biodiversity and Conservation', 'biodiversity-and-conservation'),
      ('topic_alevel_bio_biotech', 'subj_alevel_biology', 'Biotechnology and Gene Technology', 'biotechnology-and-gene-technology'),
      ('topic_alevel_bio_immunity', 'subj_alevel_biology', 'Immunity', 'immunity');
  `);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('Cambridge A-Level Biology sprint 2 automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-alevel-bio-s2-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-alevel-bio-sprint2.mjs'),
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

  it('loads 48 original questions across 9 prod-canonical topics with beta provenance', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT t.id AS topicId, COUNT(*) AS count
      FROM questions q JOIN topics t ON t.id = q.topic_id
      WHERE q.id LIKE 'q_albio_%_s2_%'
      GROUP BY t.id ORDER BY t.id
    `).all()).toEqual([
      { topicId: 'topic_alevel_bio_biodiversity', count: 5 },
      { topicId: 'topic_alevel_bio_biotech', count: 5 },
      { topicId: 'topic_alevel_bio_cells', count: 4 },
      { topicId: 'topic_alevel_bio_ecology', count: 16 },
      { topicId: 'topic_alevel_bio_genetics', count: 3 },
      { topicId: 'topic_alevel_bio_homeostasis', count: 3 },
      { topicId: 'topic_alevel_bio_immunity', count: 4 },
      { topicId: 'topic_alevel_bio_membranes', count: 5 },
      { topicId: 'topic_alevel_bio_metabolism', count: 3 },
    ]);
    expect(db.prepare(`
      SELECT question_type AS questionType, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_albio_%_s2_%'
      GROUP BY question_type ORDER BY question_type
    `).all()).toEqual([
      { questionType: 'calculation', count: 2 },
      { questionType: 'multiple_choice', count: 43 },
      { questionType: 'structured', count: 3 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM topics
      WHERE id LIKE 'topic_alevel_bio_%' AND subject_id = 'subj_alevel_biology'
    `).get()).toEqual({ count: 9 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id LIKE 'q_albio_%_s2_%'
        AND q.subject_id = 'subj_alevel_biology'
        AND q.subject_id = t.subject_id
        AND q.exam_type_id = 'cambridge_a2'
        AND q.exam_board_id = 'board_cambridge'
        AND length(q.explanation) >= 80
        AND qcr.batch_id = 'alevel-bio-sprint2-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 48 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_albio_%_s2_%'
        AND question_type = 'multiple_choice'
        AND json_valid(options)
        AND json_array_length(options) = 4
        AND correct_answer IN ('A', 'B', 'C', 'D')
    `).get()).toEqual({ count: 43 });
    expect(db.prepare(`
      SELECT correct_answer AS letter, COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_albio_%_s2_%' AND question_type = 'multiple_choice'
      GROUP BY correct_answer ORDER BY correct_answer
    `).all()).toEqual([
      { letter: 'A', count: 11 },
      { letter: 'B', count: 11 },
      { letter: 'C', count: 11 },
      { letter: 'D', count: 10 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM structured_question_parts sp
      JOIN questions q ON q.id = sp.question_id
      WHERE q.id LIKE 'q_albio_%_s2_%'
    `).get()).toEqual({ count: 9 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions WHERE id LIKE 'q_albio_%_s2_%'
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
      expect(row.type).toBe(question.type);
      expect(row.correctAnswer).toBe(question.correctAnswer);
      if (question.type === 'multiple_choice') {
        expect(JSON.parse(row.options!)).toEqual(question.options!.map(({ label, text }) => `${label}. ${text}`));
        expect(row.marks).toBe(1);
      } else {
        expect(row.options).toBeNull();
      }
      if (question.type === 'structured') {
        expect(row.marks).toBe(question.parts!.reduce((total, entry) => total + entry.marks, 0));
        const parts = db.prepare('SELECT part_label AS label, part_text AS text, marks, correct_answer AS correctAnswer FROM structured_question_parts WHERE question_id = ? ORDER BY display_order').all(question.id);
        expect(parts).toEqual(question.parts!.map(({ label, text, marks, correctAnswer }) => ({ label, text, marks, correctAnswer })));
      }
    }

    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');

    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_albio_%_s2_%'").get()).toEqual({ count: 48 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'alevel-bio-sprint2-001'").get()).toEqual({ count: 48 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM structured_question_parts sp JOIN questions q ON q.id = sp.question_id WHERE q.id LIKE 'q_albio_%_s2_%'").get()).toEqual({ count: 9 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM topics WHERE id LIKE 'topic_alevel_bio_%' AND subject_id = 'subj_alevel_biology'").get()).toEqual({ count: 9 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_albio_ecology_s2_001', 'topic_alevel_bio_ecology', 'subj_alevel_biology', 'cambridge_a2',
        'Corrupted content under a reserved stable ID', 'multiple_choice', 'A', 'easy')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get('q_albio_ecology_s2_001')).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE questions SET source_paper_code = '9700/42', source_question_number = '3' WHERE id = 'q_albio_ecology_s2_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = 'q_albio_ecology_s2_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when a structured part under a reserved ID contains different content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[4]);
    db.prepare("UPDATE structured_question_parts SET correct_answer = 'Corrupted part answer' WHERE question_id = 'q_albio_ecology_s2_014' AND part_label = 'a'").run();
    expect(() => db.exec(migrations[4])).toThrow();
    expect(db.prepare("SELECT correct_answer AS answer FROM structured_question_parts WHERE question_id = 'q_albio_ecology_s2_014' AND part_label = 'a'").get()).toEqual({ answer: 'Corrupted part answer' });
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_albio_%_s2_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
