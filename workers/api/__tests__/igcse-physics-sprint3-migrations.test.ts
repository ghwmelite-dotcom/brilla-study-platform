import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '608_igcse_physics_sprint3_foundation.sql',
  '609_igcse_physics_mechanics.sql',
  '610_igcse_physics_thermal.sql',
  '611_igcse_physics_waves.sql',
  '612_igcse_physics_electricity_part_1.sql',
  '613_igcse_physics_electricity_part_2.sql',
  '614_igcse_physics_nuclear.sql',
  '615_igcse_physics_space_part_1.sql',
  '616_igcse_physics_space_part_2.sql',
  '617_igcse_physics_sprint3_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/igcse-physics-sprint3-001.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));
const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8')) as {
  subjects: Array<{
    subjectId: string;
    questions: Array<{
      id: string;
      topicCode: string;
      type: string;
      difficulty: string;
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
    INSERT INTO exam_types(id) VALUES ('igcse');
    INSERT INTO exam_boards(id) VALUES ('board_cambridge');
    INSERT INTO subjects(id, exam_type_id) VALUES ('subj_igcse_physics', 'igcse');
  `);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('Cambridge IGCSE Physics sprint 3 automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-igcse-physics-s3-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-igcse-physics-sprint3-bank.mjs'),
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

  it('loads 46 original questions across six prod-canonical topics with beta provenance', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_igphy_%_s3_%'
    `).get()).toEqual({ count: 46 });

    expect(db.prepare(`
      SELECT t.id AS topicId, COUNT(*) AS count
      FROM questions q JOIN topics t ON t.id = q.topic_id
      WHERE q.id LIKE 'q_igphy_%_s3_%'
      GROUP BY t.id ORDER BY t.id
    `).all()).toEqual([
      { topicId: 'topic_igcse_physics_electricity', count: 10 },
      { topicId: 'topic_igcse_physics_mechanics', count: 3 },
      { topicId: 'topic_igcse_physics_nuclear', count: 7 },
      { topicId: 'topic_igcse_physics_space', count: 13 },
      { topicId: 'topic_igcse_physics_thermal', count: 7 },
      { topicId: 'topic_igcse_physics_waves', count: 6 },
    ]);

    expect(db.prepare(`
      SELECT question_type AS questionType, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_igphy_%_s3_%'
      GROUP BY question_type ORDER BY question_type
    `).all()).toEqual([
      { questionType: 'calculation', count: 1 },
      { questionType: 'multiple_choice', count: 38 },
      { questionType: 'short_answer', count: 1 },
      { questionType: 'structured', count: 6 },
    ]);

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM topics
      WHERE id LIKE 'topic_igcse_physics_%' AND subject_id = 'subj_igcse_physics'
    `).get()).toEqual({ count: 6 });

    expect(db.prepare(`
      SELECT difficulty, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_igphy_%_s3_%'
      GROUP BY difficulty ORDER BY difficulty
    `).all()).toEqual([
      { difficulty: 'easy', count: 7 },
      { difficulty: 'hard', count: 14 },
      { difficulty: 'medium', count: 25 },
    ]);

    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id LIKE 'q_igphy_%_s3_%'
        AND q.subject_id = 'subj_igcse_physics'
        AND q.subject_id = t.subject_id
        AND q.exam_type_id = 'igcse'
        AND q.exam_board_id = 'board_cambridge'
        AND q.round_type IS NULL
        AND q.paper_type_id IS NULL
        AND q.past_paper_id IS NULL
        AND q.source_paper_code IS NULL
        AND q.source_question_number IS NULL
        AND length(q.explanation) >= 80
        AND qcr.batch_id = 'igcse-physics-sprint3-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 46 });

    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_igphy_%_s3_%'
        AND question_type = 'multiple_choice'
        AND json_valid(options)
        AND json_array_length(options) = 4
        AND correct_answer IN ('A', 'B', 'C', 'D')
    `).get()).toEqual({ count: 38 });

    expect(db.prepare(`
      SELECT correct_answer AS letter, COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_igphy_%_s3_%' AND question_type = 'multiple_choice'
      GROUP BY correct_answer ORDER BY correct_answer
    `).all()).toEqual([
      { letter: 'A', count: 10 },
      { letter: 'B', count: 10 },
      { letter: 'C', count: 9 },
      { letter: 'D', count: 9 },
    ]);

    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM structured_question_parts sp
      JOIN questions q ON q.id = sp.question_id
      WHERE q.id LIKE 'q_igphy_%_s3_%'
    `).get()).toEqual({ count: 18 });

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions WHERE id LIKE 'q_igphy_%_s3_%'
        GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM question_content_releases
      WHERE batch_id = 'igcse-physics-sprint3-001'
        AND content_label LIKE '%not official Cambridge International%'
    `).get()).toEqual({ count: 46 });

    for (const question of allQuestions) {
      const row = db.prepare('SELECT question_type AS type, options, correct_answer AS correctAnswer, difficulty, marks FROM questions WHERE id = ?').get(question.id) as {
        type: string;
        options: string | null;
        correctAnswer: string;
        difficulty: string;
        marks: number;
      };
      expect(row.type).toBe(question.type);
      expect(row.correctAnswer).toBe(question.correctAnswer);
      expect(row.difficulty).toBe(question.difficulty);
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
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_igphy_%_s3_%'").get()).toEqual({ count: 46 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'igcse-physics-sprint3-001'").get()).toEqual({ count: 46 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM structured_question_parts sp JOIN questions q ON q.id = sp.question_id WHERE q.id LIKE 'q_igphy_%_s3_%'").get()).toEqual({ count: 18 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_igphy_mechanics_s3_001', 'topic_igcse_physics_mechanics', 'subj_igcse_physics', 'igcse',
        'Corrupted content under a reserved stable ID', 'multiple_choice', 'A', 'hard')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get('q_igphy_mechanics_s3_001')).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE questions SET source_paper_code = '0625/22', source_question_number = '5' WHERE id = 'q_igphy_mechanics_s3_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = 'q_igphy_mechanics_s3_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when a reserved ID is pre-bound to the wrong topic of the same subject', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_igphy_mechanics_s3_001', 'topic_igcse_physics_waves', 'subj_igcse_physics', 'igcse',
        'A car travelling at 20 m/s brakes uniformly to rest in 5.0 s. What distance does the car travel while braking?', 'multiple_choice', 'A', 'hard')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when a structured part under a reserved ID contains different content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE structured_question_parts SET correct_answer = 'Corrupted part answer' WHERE question_id = 'q_igphy_mechanics_s3_003' AND part_label = 'a'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare("SELECT correct_answer AS answer FROM structured_question_parts WHERE question_id = 'q_igphy_mechanics_s3_003' AND part_label = 'a'").get()).toEqual({ answer: 'Corrupted part answer' });
    db.close();
  });

  it('rejects cross-subject topic bindings through the subject/topic consistency trigger', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec("INSERT INTO subjects(id, exam_type_id) VALUES ('subj_igcse_biology', 'igcse')");
    db.exec("INSERT INTO topics(id, subject_id, name, slug) VALUES ('topic_igcse_bio_cells', 'subj_igcse_biology', 'Cells and Microscopy', 'cells-and-microscopy')");
    expect(() => db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_scratch_001', 'topic_igcse_bio_cells', 'subj_igcse_physics', 'igcse',
        'Cross-subject topic binding attempt', 'multiple_choice', 'A', 'easy')
    `).run()).toThrow();
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_igphy_%_s3_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
