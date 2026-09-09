import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '387_nsmq_expansion_beta_foundation.sql',
  '388_nsmq_math_problem_of_day.sql',
  '389_nsmq_math_speed_race.sql',
  '390_nsmq_math_round_one.sql',
  '391_nsmq_phys_problem_of_day.sql',
  '392_nsmq_phys_speed_race.sql',
  '393_nsmq_phys_round_one.sql',
  '394_nsmq_chem_problem_of_day.sql',
  '395_nsmq_chem_speed_race.sql',
  '396_nsmq_chem_round_one.sql',
  '397_nsmq_bio_problem_of_day.sql',
  '398_nsmq_bio_speed_race.sql',
  '399_nsmq_bio_round_one.sql',
  '400_nsmq_riddles.sql',
  '401_nsmq_expansion_beta_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/nsmq-expansion-beta-001.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));
const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8')) as {
  subjects: Array<{
    subjectId: string;
    questions: Array<{
      id: string;
      roundType: string;
      options?: Array<{ label: string; text: string }>;
      correctAnswer: string;
    }>;
  }>;
  riddles: Array<{ id: string; subjectId: string; answer: string; clues: string[] }>;
};
const allQuestionIds = batch.subjects.flatMap((subject) => subject.questions.map((question) => question.id));

const seededTopics: Array<[string, string]> = [
  ['topic_algebra', 'subj_nsmq_math'],
  ['topic_quadratic', 'subj_nsmq_math'],
  ['topic_geometry', 'subj_nsmq_math'],
  ['topic_trigonometry', 'subj_nsmq_math'],
  ['topic_statistics', 'subj_nsmq_math'],
  ['topic_calculus', 'subj_nsmq_math'],
  ['topic_mechanics', 'subj_nsmq_physics'],
  ['topic_kinematics', 'subj_nsmq_physics'],
  ['topic_electricity', 'subj_nsmq_physics'],
  ['topic_waves', 'subj_nsmq_physics'],
  ['topic_thermodynamics', 'subj_nsmq_physics'],
  ['topic_modern_physics', 'subj_nsmq_physics'],
  ['topic_atomic', 'subj_nsmq_chemistry'],
  ['topic_bonding', 'subj_nsmq_chemistry'],
  ['topic_stoichiometry', 'subj_nsmq_chemistry'],
  ['topic_equilibrium', 'subj_nsmq_chemistry'],
  ['topic_organic', 'subj_nsmq_chemistry'],
  ['topic_electrochemistry', 'subj_nsmq_chemistry'],
  ['topic_cells', 'subj_nsmq_biology'],
  ['topic_genetics', 'subj_nsmq_biology'],
  ['topic_ecology', 'subj_nsmq_biology'],
  ['topic_physiology', 'subj_nsmq_biology'],
  ['topic_biochemistry', 'subj_nsmq_biology'],
];

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
    CREATE TABLE riddles (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      answer TEXT NOT NULL,
      clue_1 TEXT NOT NULL, clue_2 TEXT NOT NULL, clue_3 TEXT NOT NULL,
      clue_4 TEXT, clue_5 TEXT,
      difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
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
    INSERT INTO exam_types(id) VALUES ('exam_nsmq');
    INSERT INTO subjects(id, exam_type_id) VALUES
      ('subj_nsmq_math', 'exam_nsmq'),
      ('subj_nsmq_physics', 'exam_nsmq'),
      ('subj_nsmq_chemistry', 'exam_nsmq'),
      ('subj_nsmq_biology', 'exam_nsmq');
    INSERT INTO riddles(id, subject_id, answer, clue_1, clue_2, clue_3, difficulty)
      VALUES ('riddle_001', 'subj_nsmq_math', 'Pi (π)', 'I am a number that never ends and never repeats', 'I am the ratio of a circle''s circumference to its diameter', 'My first digits are 3.14159...', 'medium');
  `);
  const insertTopic = db.prepare('INSERT INTO topics(id, subject_id, name, slug) VALUES (?, ?, ?, ?)');
  for (const [id, subjectId] of seededTopics) insertTopic.run(id, subjectId, id, id);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('NSMQ question bank expansion automated-beta migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-nsmq-expansion-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-nsmq-expansion-bank.mjs'),
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

  it('loads 48 original round-bound questions and 10 riddles with beta provenance', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT subject_id AS subjectId, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_nsmq_%_b001_%'
      GROUP BY subject_id ORDER BY subject_id
    `).all()).toEqual([
      { subjectId: 'subj_nsmq_biology', count: 12 },
      { subjectId: 'subj_nsmq_chemistry', count: 12 },
      { subjectId: 'subj_nsmq_math', count: 12 },
      { subjectId: 'subj_nsmq_physics', count: 12 },
    ]);
    expect(db.prepare(`
      SELECT round_type AS roundType, question_type AS questionType, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_nsmq_%_b001_%'
      GROUP BY round_type ORDER BY round_type
    `).all()).toEqual([
      { roundType: 'problem_of_day', questionType: 'problem', count: 16 },
      { roundType: 'round_one', questionType: 'multiple_choice', count: 16 },
      { roundType: 'speed_race', questionType: 'direct_answer', count: 16 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM topics WHERE id LIKE 'topic_nsmq_%'
    `).get()).toEqual({ count: 23 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id LIKE 'q_nsmq_%_b001_%'
        AND q.topic_id LIKE 'topic_nsmq_%'
        AND q.subject_id = t.subject_id
        AND q.subject_id LIKE 'subj_nsmq_%'
        AND q.exam_type_id = 'exam_nsmq'
        AND length(q.explanation) >= 80
        AND qcr.batch_id = 'nsmq-expansion-beta-001'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 48 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_nsmq_%_r1_b001_%'
        AND json_valid(options)
        AND json_array_length(options) = 4
        AND correct_answer IN ('A', 'B', 'C', 'D')
        AND points = 3 AND time_limit = 30
    `).get()).toEqual({ count: 16 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_nsmq_%_pod_b001_%'
        AND options IS NULL AND points = 5 AND time_limit = 120
        AND difficulty IN ('medium', 'hard')
    `).get()).toEqual({ count: 16 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_nsmq_%_sr_b001_%'
        AND options IS NULL AND points = 2 AND time_limit = 15
        AND difficulty IN ('easy', 'medium')
    `).get()).toEqual({ count: 16 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions WHERE id LIKE 'q_nsmq_%_b001_%'
        GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });

    for (const subject of batch.subjects) {
      for (const question of subject.questions) {
        const row = db.prepare('SELECT options, correct_answer AS correctAnswer FROM questions WHERE id = ?').get(question.id) as {
          options: string | null;
          correctAnswer: string;
        };
        expect(row.correctAnswer).toBe(question.correctAnswer);
        if (question.roundType === 'round_one') {
          expect(JSON.parse(row.options!)).toEqual(question.options!.map(({ label, text }) => `${label}. ${text}`));
        } else {
          expect(row.options).toBeNull();
        }
      }
    }

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM riddles WHERE id IN (${batch.riddles.map((entry) => `'${entry.id}'`).join(',')})
    `).get()).toEqual({ count: 10 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM riddles
      WHERE id IN (${batch.riddles.map((entry) => `'${entry.id}'`).join(',')})
        AND subject_id LIKE 'subj_nsmq_%'
        AND clue_1 IS NOT NULL AND clue_2 IS NOT NULL AND clue_3 IS NOT NULL AND clue_4 IS NOT NULL
        AND difficulty IN ('easy', 'medium', 'hard')
    `).get()).toEqual({ count: 10 });

    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');

    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_nsmq_%_b001_%'").get()).toEqual({ count: 48 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'nsmq-expansion-beta-001'").get()).toEqual({ count: 48 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM riddles').get()).toEqual({ count: 11 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_nsmq_math_pod_b001_001', 'topic_nsmq_math_algebra', 'subj_nsmq_math', 'exam_nsmq',
        'Corrupted content under a reserved stable ID', 'problem', 'fixture', 'easy')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get('q_nsmq_math_pod_b001_001')).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE questions SET source_paper_code = 'NSMQ-2024', source_question_number = '1' WHERE id = 'q_nsmq_math_pod_b001_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = 'q_nsmq_math_pod_b001_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when a reserved riddle ID contains different content', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 13)) db.exec(migration);
    db.prepare(`
      INSERT INTO riddles(id, subject_id, answer, clue_1, clue_2, clue_3, difficulty)
      VALUES ('riddle_011', 'subj_nsmq_math', 'Corrupted riddle answer', 'clue one is long enough', 'clue two is long enough', 'clue three is long enough', 'easy')
    `).run();
    expect(() => db.exec(migrations[13])).toThrow();
    expect(db.prepare('SELECT answer FROM riddles WHERE id = ?').get('riddle_011')).toEqual({ answer: 'Corrupted riddle answer' });
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_nsmq_%_b001_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
