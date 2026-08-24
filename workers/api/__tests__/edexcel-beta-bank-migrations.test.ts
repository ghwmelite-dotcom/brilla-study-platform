import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const migrationNames = [
  '104_edexcel_igcse_beta_blueprint.sql',
  '105_edexcel_igcse_beta_4ma1_part_1.sql',
  '106_edexcel_igcse_beta_4ma1_part_2.sql',
  '107_edexcel_igcse_beta_4bi1_part_1.sql',
  '108_edexcel_igcse_beta_4bi1_part_2.sql',
  '109_edexcel_igcse_beta_4ch1_part_1.sql',
  '110_edexcel_igcse_beta_4ch1_part_2.sql',
  '111_edexcel_igcse_beta_4ph1_part_1.sql',
  '112_edexcel_igcse_beta_4ph1_part_2.sql',
];
const migrations = migrationNames.map((name) => readFileSync(
  new URL(`../../../database/migrations/${name}`, import.meta.url),
  'utf8',
));

const subjects = [
  ['subj_edexcel_igcse_math', 'spec_edexcel_igcse_math', '4MA1'],
  ['subj_edexcel_igcse_biology', 'spec_edexcel_igcse_biology', '4BI1'],
  ['subj_edexcel_igcse_chemistry', 'spec_edexcel_igcse_chemistry', '4CH1'],
  ['subj_edexcel_igcse_physics', 'spec_edexcel_igcse_physics', '4PH1'],
];

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
    CREATE TABLE subject_specifications (
      id TEXT PRIMARY KEY,
      exam_board_id TEXT NOT NULL REFERENCES exam_boards(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      exam_type_id TEXT NOT NULL REFERENCES exam_types(id),
      syllabus_code TEXT NOT NULL,
      syllabus_name TEXT NOT NULL,
      specification_year TEXT,
      valid_from TEXT,
      valid_to TEXT,
      syllabus_pdf_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT
    );
    CREATE TABLE topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      display_order INTEGER
    );
    CREATE TABLE syllabus_topics (
      id TEXT PRIMARY KEY,
      specification_id TEXT NOT NULL REFERENCES subject_specifications(id),
      topic_code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assessment_objectives TEXT,
      display_order INTEGER
    );
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      topic_id TEXT REFERENCES topics(id),
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      exam_type_id TEXT REFERENCES exam_types(id),
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      difficulty TEXT NOT NULL,
      points INTEGER,
      marks INTEGER,
      time_limit INTEGER,
      syllabus_topic_id TEXT REFERENCES syllabus_topics(id),
      command_word TEXT,
      assessment_objective TEXT,
      exam_board_id TEXT REFERENCES exam_boards(id)
    );
    CREATE TRIGGER trg_questions_subject_exam_insert
    BEFORE INSERT ON questions
    WHEN NEW.exam_type_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM subjects s
        WHERE s.id = NEW.subject_id AND s.exam_type_id IS NEW.exam_type_id
      )
    BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_EXAM_MISMATCH'); END;
    CREATE TRIGGER trg_questions_subject_topic_insert
    BEFORE INSERT ON questions
    WHEN NEW.topic_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM topics t
        WHERE t.id = NEW.topic_id AND t.subject_id = NEW.subject_id
      )
    BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_TOPIC_MISMATCH'); END;
    INSERT INTO exam_types(id) VALUES ('edexcel_igcse');
    INSERT INTO exam_boards(id) VALUES ('board_edexcel');
  `);
  const insertSubject = db.prepare('INSERT INTO subjects(id, exam_type_id) VALUES (?, ?)');
  const insertSpec = db.prepare(`
    INSERT INTO subject_specifications(
      id, exam_board_id, subject_id, exam_type_id, syllabus_code,
      syllabus_name, specification_year, valid_to, is_active
    ) VALUES (?, 'board_edexcel', ?, 'edexcel_igcse', ?, ?, '2023-2025', '2025-12-31', 1)
  `);
  for (const [subjectId, specificationId, code] of subjects) {
    insertSubject.run(subjectId, 'edexcel_igcse');
    insertSpec.run(specificationId, subjectId, code, `Pearson Edexcel ${code}`);
  }
  return db;
}

describe('Edexcel IGCSE automated-beta content migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('loads 160 original, topic-bound questions and remains idempotent', () => {
    const db = createFixture();
    for (const migration of migrations) db.exec(migration);
    const firstCount = db.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_edx_%_b001_%'
    `).get();
    expect(firstCount).toEqual({ count: 160 });
    expect(db.prepare(`
      SELECT subject_id AS subjectId, COUNT(*) AS count
      FROM questions GROUP BY subject_id ORDER BY subject_id
    `).all()).toEqual([
      { subjectId: 'subj_edexcel_igcse_biology', count: 40 },
      { subjectId: 'subj_edexcel_igcse_chemistry', count: 40 },
      { subjectId: 'subj_edexcel_igcse_math', count: 40 },
      { subjectId: 'subj_edexcel_igcse_physics', count: 40 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN syllabus_topics st ON st.id = q.syllabus_topic_id
      JOIN subject_specifications ss ON ss.id = st.specification_id
      WHERE q.subject_id = t.subject_id
        AND q.subject_id = ss.subject_id
        AND q.exam_type_id = ss.exam_type_id
        AND q.exam_board_id = ss.exam_board_id
        AND q.question_type = 'multiple_choice'
        AND json_valid(q.options)
        AND json_array_length(q.options) = 4
        AND length(q.explanation) >= 80
    `).get()).toEqual({ count: 160 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) normalized
        FROM questions GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });
    expect(db.pragma('foreign_key_check')).toEqual([]);

    for (const migration of migrations) db.exec(migration);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_edx_%_b001_%'
    `).get()).toEqual({ count: 160 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM topics').get()).toEqual({ count: 21 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM syllabus_topics').get()).toEqual({ count: 21 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails the final guard when an earlier content part is missing', () => {
    const db = createFixture();
    migrations.forEach((migration, index) => {
      if (index !== 5 && index !== migrations.length - 1) db.exec(migration);
    });
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_edx_%_b001_%'
    `).get()).toEqual({ count: 140 });
    db.close();
  });
});
