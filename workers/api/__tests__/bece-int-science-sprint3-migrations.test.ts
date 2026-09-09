import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '618_bece_int_science_sprint3_foundation.sql',
  '619_bece_int_science_sprint3_part_1.sql',
  '620_bece_int_science_sprint3_part_2.sql',
  '621_bece_int_science_sprint3_part_3.sql',
  '622_bece_int_science_sprint3_part_4.sql',
  '623_bece_int_science_sprint3_part_5.sql',
  '624_bece_int_science_sprint3_part_6.sql',
  '625_bece_int_science_sprint3_part_7.sql',
  '626_bece_int_science_sprint3_part_8.sql',
  '627_bece_int_science_sprint3_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/bece-int-science-sprint3-001.json', ...migrationRelativePaths];
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

// The prod-canonical topic bindings this batch uses (verified read-only
// against brilla-db on 2026-09-09). The fixture seeds them directly so the
// foundation migration's INSERT OR IGNORE re-assertion no-ops, exactly as it
// does on prod and on fresh baselines (prod patches 094/095/096).
const seededTopics: Array<[string, string, string]> = [
  ['topic_bece_science_cells', 'Cells and Living Organisms', 'cells-and-living-organisms'],
  ['topic_bece_science_body', 'Human Body Systems', 'human-body-systems'],
  ['topic_bece_science_matter', 'Matter and Its States', 'matter-and-its-states'],
  ['topic_bece_science_energy', 'Energy and Its Forms', 'energy-and-its-forms'],
  ['topic_bece_science_electricity', 'Electricity and Magnetism', 'electricity-and-magnetism'],
  ['topic_bece_science_machines', 'Force, Work and Machines', 'force-work-and-machines'],
  ['topic_bece_science_agric', 'Agriculture and Food Production', 'agriculture-and-food-production'],
  ['topic_bece_science_health', 'Health, Sanitation and Environment', 'health-sanitation-and-environment'],
  ['topic_bece_science_methods', 'Scientific Inquiry and Technology', 'scientific-inquiry-and-technology'],
  ['topic_bece_science_earth_space', 'Earth and Space Science', 'earth-and-space-science'],
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
    INSERT INTO exam_types(id) VALUES ('exam_bece');
    INSERT INTO exam_boards(id) VALUES ('board_waec');
    INSERT INTO subjects(id, exam_type_id) VALUES ('subj_bece_science', 'exam_bece');
  `);
  const insertTopic = db.prepare('INSERT INTO topics(id, subject_id, name, slug) VALUES (?, ?, ?, ?)');
  for (const [id, name, slug] of seededTopics) insertTopic.run(id, 'subj_bece_science', name, slug);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('BECE Integrated Science sprint 3 automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-bece-int-sci-s3-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-bece-int-science-sprint3-bank.mjs'),
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

  it('loads 50 original questions across ten prod-canonical topics with beta provenance', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_bece_intsci_s3_%'
    `).get()).toEqual({ count: 50 });

    expect(db.prepare(`
      SELECT topic_id AS topicId, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_bece_intsci_s3_%'
      GROUP BY topic_id ORDER BY topic_id
    `).all()).toEqual([
      { topicId: 'topic_bece_science_agric', count: 3 },
      { topicId: 'topic_bece_science_body', count: 5 },
      { topicId: 'topic_bece_science_cells', count: 5 },
      { topicId: 'topic_bece_science_earth_space', count: 5 },
      { topicId: 'topic_bece_science_electricity', count: 7 },
      { topicId: 'topic_bece_science_energy', count: 5 },
      { topicId: 'topic_bece_science_health', count: 5 },
      { topicId: 'topic_bece_science_machines', count: 5 },
      { topicId: 'topic_bece_science_matter', count: 5 },
      { topicId: 'topic_bece_science_methods', count: 5 },
    ]);

    expect(db.prepare(`
      SELECT question_type AS questionType, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_bece_intsci_s3_%'
      GROUP BY question_type ORDER BY question_type
    `).all()).toEqual([
      { questionType: 'calculation', count: 10 },
      { questionType: 'multiple_choice', count: 20 },
      { questionType: 'short_answer', count: 10 },
      { questionType: 'structured', count: 10 },
    ]);

    expect(db.prepare(`
      SELECT difficulty, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_bece_intsci_s3_%'
      GROUP BY difficulty ORDER BY difficulty
    `).all()).toEqual([
      { difficulty: 'easy', count: 5 },
      { difficulty: 'hard', count: 18 },
      { difficulty: 'medium', count: 27 },
    ]);

    expect(db.prepare(`
      SELECT correct_answer AS correctAnswer, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_bece_intsci_s3_%' AND question_type = 'multiple_choice'
      GROUP BY correct_answer ORDER BY correct_answer
    `).all()).toEqual([
      { correctAnswer: 'A', count: 5 },
      { correctAnswer: 'B', count: 5 },
      { correctAnswer: 'C', count: 5 },
      { correctAnswer: 'D', count: 5 },
    ]);

    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id LIKE 'q_bece_intsci_s3_%'
        AND q.subject_id = 'subj_bece_science'
        AND q.subject_id = t.subject_id
        AND q.exam_type_id = 'exam_bece'
        AND q.exam_board_id = 'board_waec'
        AND q.round_type IS NULL
        AND q.paper_type_id IS NULL
        AND q.past_paper_id IS NULL
        AND q.source_paper_code IS NULL
        AND q.source_question_number IS NULL
        AND length(q.explanation) >= 80
        AND (
          (q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4
            AND q.correct_answer IN ('A', 'B', 'C', 'D') AND q.points = 1 AND q.marks = 1 AND q.time_limit = 90)
          OR
          (q.question_type = 'calculation' AND q.options IS NULL AND length(q.correct_answer) >= 1
            AND q.points = 4 AND q.marks = 2 AND q.time_limit = 120)
          OR
          (q.question_type = 'short_answer' AND q.options IS NULL AND length(q.correct_answer) >= 20
            AND q.points = 2 AND q.marks = 2 AND q.time_limit = 90)
          OR
          (q.question_type = 'structured' AND q.options IS NULL)
        )
        AND qcr.batch_id = 'bece-int-science-sprint3-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 50 });

    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM structured_question_parts sp
      JOIN questions q ON q.id = sp.question_id
      WHERE q.id LIKE 'q_bece_intsci_s3_%'
    `).get()).toEqual({ count: 30 });

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions WHERE id LIKE 'q_bece_intsci_s3_%'
        GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM question_content_releases
      WHERE batch_id = 'bece-int-science-sprint3-001'
        AND content_label LIKE '%not official WAEC%'
    `).get()).toEqual({ count: 50 });

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
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_bece_intsci_s3_%'").get()).toEqual({ count: 50 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'bece-int-science-sprint3-001'").get()).toEqual({ count: 50 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM structured_question_parts sp JOIN questions q ON q.id = sp.question_id WHERE q.id LIKE 'q_bece_intsci_s3_%'").get()).toEqual({ count: 30 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_bece_intsci_s3_001', 'topic_bece_science_cells', 'subj_bece_science', 'exam_bece',
        'Corrupted content under a reserved stable ID', 'multiple_choice', 'fixture', 'easy')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get('q_bece_intsci_s3_001')).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE questions SET source_paper_code = 'BECE-2024', source_question_number = '1' WHERE id = 'q_bece_intsci_s3_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = 'q_bece_intsci_s3_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when a reserved ID is pre-bound to the wrong topic of the same subject', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_bece_intsci_s3_001', 'topic_bece_science_body', 'subj_bece_science', 'exam_bece',
        'A red blood cell bursts when placed in pure water, but a plant cell kept in pure water does not. Which structure explains the difference?', 'multiple_choice', 'A', 'hard')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when a structured part under a reserved ID contains different content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE structured_question_parts SET correct_answer = 'Corrupted part answer' WHERE question_id = 'q_bece_intsci_s3_005' AND part_label = 'a'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare("SELECT correct_answer AS answer FROM structured_question_parts WHERE question_id = 'q_bece_intsci_s3_005' AND part_label = 'a'").get()).toEqual({ answer: 'Corrupted part answer' });
    db.close();
  });

  it('rejects cross-subject topic bindings through the subject/topic consistency trigger', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec("INSERT INTO exam_types(id) VALUES ('exam_wassce')");
    db.exec("INSERT INTO subjects(id, exam_type_id) VALUES ('subj_wassce_int_science', 'exam_wassce')");
    db.exec("INSERT INTO topics(id, subject_id, name, slug) VALUES ('topic_wassce_sci_cells', 'subj_wassce_int_science', 'Cells', 'cells')");
    expect(() => db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_scratch_001', 'topic_wassce_sci_cells', 'subj_bece_science', 'exam_bece',
        'Cross-subject topic binding attempt', 'multiple_choice', 'fixture', 'easy')
    `).run()).toThrow();
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_bece_intsci_s3_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
