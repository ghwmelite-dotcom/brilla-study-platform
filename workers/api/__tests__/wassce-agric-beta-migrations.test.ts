import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const migrationNames = [
  '113_wassce_agric_beta_foundation.sql',
  '114_wassce_agric_beta_part_1.sql',
  '115_wassce_agric_beta_part_2.sql',
  '116_wassce_agric_beta_part_3.sql',
  '117_wassce_agric_beta_part_4.sql',
];

const migrations = migrationNames.map((name) => readFileSync(
  new URL(`../../../database/migrations/${name}`, import.meta.url),
  'utf8',
));

function createFixture() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
    CREATE TABLE exam_boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      full_name TEXT,
      region TEXT,
      website_url TEXT,
      logo_url TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
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
      syllabus_code TEXT NOT NULL,
      syllabus_name TEXT NOT NULL,
      specification_year TEXT,
      valid_from TEXT,
      valid_to TEXT,
      syllabus_pdf_url TEXT,
      specimen_papers_url TEXT,
      total_papers INTEGER DEFAULT 0,
      assessment_info TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(exam_board_id, syllabus_code, specification_year)
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
    INSERT INTO exam_types(id) VALUES ('exam_wassce'), ('edexcel_igcse');
    INSERT INTO exam_boards(id, name, code) VALUES ('board_edexcel', 'Edexcel', 'EDEXCEL');
    INSERT INTO subjects(id, exam_type_id) VALUES
      ('subj_wassce_agric', 'exam_wassce'),
      ('subj_edexcel_igcse_math', 'edexcel_igcse');
    INSERT INTO questions(id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_edx_4ma1_b001_001', 'subj_edexcel_igcse_math', 'edexcel_igcse', 'Legacy Edexcel beta provenance fixture', 'short_answer', 'fixture', 'easy');
  `);
  return db;
}

describe('WASSCE Agricultural Science automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('loads 40 original, topic-bound questions with durable beta provenance', () => {
    const db = createFixture();
    for (const migration of migrations) db.exec(migration);

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_was_agric_b001_%'
    `).get()).toEqual({ count: 40 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM topics WHERE subject_id = 'subj_wassce_agric'
    `).get()).toEqual({ count: 10 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN syllabus_topics st ON st.id = q.syllabus_topic_id
      JOIN subject_specifications ss ON ss.id = st.specification_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id LIKE 'q_was_agric_b001_%'
        AND q.subject_id = t.subject_id
        AND q.subject_id = ss.subject_id
        AND q.exam_type_id = ss.exam_type_id
        AND q.exam_board_id = ss.exam_board_id
        AND q.question_type = 'multiple_choice'
        AND json_valid(q.options)
        AND json_array_length(q.options) = 4
        AND length(q.explanation) >= 80
        AND qcr.batch_id = 'wassce-agric-beta-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 40 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) normalized
        FROM questions WHERE id LIKE 'q_was_agric_b001_%'
        GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM question_content_releases
      WHERE batch_id = 'edexcel-igcse-beta-001'
    `).get()).toEqual({ count: 1 });
    expect(db.pragma('foreign_key_check')).toEqual([]);

    for (const migration of migrations) db.exec(migration);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_was_agric_b001_%'
    `).get()).toEqual({ count: 40 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM question_content_releases
      WHERE batch_id = 'wassce-agric-beta-001'
    `).get()).toEqual({ count: 40 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails the final guard when the first question part is missing', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    expect(() => db.exec(migrations[4])).toThrow();
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_was_agric_b001_%'
    `).get()).toEqual({ count: 10 });
    db.close();
  });
});
