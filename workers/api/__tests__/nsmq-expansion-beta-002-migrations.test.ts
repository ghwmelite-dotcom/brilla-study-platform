import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '517_nsmq_expansion_beta_002_foundation.sql',
  '518_nsmq_math_b002_round_one.sql',
  '519_nsmq_math_b002_speed_race.sql',
  '520_nsmq_math_b002_true_false_problem_of_day.sql',
  '521_nsmq_phys_b002_round_one.sql',
  '522_nsmq_phys_b002_speed_race.sql',
  '523_nsmq_phys_b002_true_false_problem_of_day.sql',
  '524_nsmq_chem_b002_round_one.sql',
  '525_nsmq_chem_b002_speed_race.sql',
  '526_nsmq_chem_b002_true_false_problem_of_day.sql',
  '527_nsmq_bio_b002_round_one.sql',
  '528_nsmq_bio_b002_speed_race.sql',
  '529_nsmq_bio_b002_true_false_problem_of_day.sql',
  '530_nsmq_expansion_beta_002_final_guard.sql',
] as const;

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/nsmq-expansion-beta-002.json', ...migrationRelativePaths];
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
};

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
  `);
  const insertTopic = db.prepare('INSERT INTO topics(id, subject_id, name, slug) VALUES (?, ?, ?, ?)');
  for (const [id, subjectId] of seededTopics) insertTopic.run(id, subjectId, id, id);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

describe('NSMQ question bank expansion beta batch 002 migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-nsmq-expansion-b002-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-nsmq-expansion-beta-002.mjs'),
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

  it('loads 56 original round-bound questions with beta provenance', () => {
    const db = createFixture();
    applyAll(db);

    expect(db.prepare(`
      SELECT subject_id AS subjectId, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_nsmq_%_b002_%'
      GROUP BY subject_id ORDER BY subject_id
    `).all()).toEqual([
      { subjectId: 'subj_nsmq_biology', count: 14 },
      { subjectId: 'subj_nsmq_chemistry', count: 14 },
      { subjectId: 'subj_nsmq_math', count: 14 },
      { subjectId: 'subj_nsmq_physics', count: 14 },
    ]);
    expect(db.prepare(`
      SELECT round_type AS roundType, question_type AS questionType, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_nsmq_%_b002_%'
      GROUP BY round_type ORDER BY round_type
    `).all()).toEqual([
      { roundType: 'problem_of_day', questionType: 'problem', count: 8 },
      { roundType: 'round_one', questionType: 'multiple_choice', count: 16 },
      { roundType: 'speed_race', questionType: 'direct_answer', count: 16 },
      { roundType: 'true_false', questionType: 'true_false', count: 16 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM topics WHERE id LIKE 'topic_nsmq_%'
    `).get()).toEqual({ count: 23 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN question_content_releases qcr ON qcr.question_id = q.id
      WHERE q.id LIKE 'q_nsmq_%_b002_%'
        AND q.topic_id LIKE 'topic_nsmq_%'
        AND q.subject_id = t.subject_id
        AND q.subject_id LIKE 'subj_nsmq_%'
        AND q.exam_type_id = 'exam_nsmq'
        AND length(q.explanation) >= 80
        AND qcr.batch_id = 'nsmq-expansion-beta-002'
        AND qcr.quality_assurance = 'automated_beta'
        AND qcr.release_channel = 'beta'
        AND qcr.official_exam_board_content = 0
        AND qcr.feedback_enabled = 1
    `).get()).toEqual({ count: 56 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_nsmq_%_r1_b002_%'
        AND json_valid(options)
        AND json_array_length(options) = 4
        AND correct_answer IN ('A', 'B', 'C', 'D')
        AND points = 3 AND time_limit = 30
    `).get()).toEqual({ count: 16 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_nsmq_%_pod_b002_%'
        AND options IS NULL AND points = 5 AND time_limit = 120
        AND difficulty IN ('medium', 'hard')
    `).get()).toEqual({ count: 8 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_nsmq_%_sr_b002_%'
        AND options IS NULL AND points = 2 AND time_limit = 15
        AND difficulty IN ('easy', 'medium')
    `).get()).toEqual({ count: 16 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions
      WHERE id LIKE 'q_nsmq_%_tf_b002_%'
        AND options IS NULL AND points = 2 AND time_limit = 10
        AND correct_answer IN ('True', 'False')
        AND difficulty IN ('easy', 'medium')
    `).get()).toEqual({ count: 16 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(question_text)) AS normalized
        FROM questions WHERE id LIKE 'q_nsmq_%_b002_%'
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

    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');

    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_nsmq_%_b002_%'").get()).toEqual({ count: 56 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'nsmq-expansion-beta-002'").get()).toEqual({ count: 56 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails closed when an expected stable question ID contains different canonical content', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.prepare(`
      INSERT INTO questions (id, topic_id, subject_id, exam_type_id, question_text, question_type, correct_answer, difficulty)
      VALUES ('q_nsmq_math_r1_b002_001', 'topic_nsmq_math_quadratic', 'subj_nsmq_math', 'exam_nsmq',
        'Corrupted content under a reserved stable ID', 'multiple_choice', 'A', 'easy')
    `).run();
    expect(() => db.exec(migrations[1])).toThrow();
    expect(db.prepare('SELECT question_text AS text FROM questions WHERE id = ?').get('q_nsmq_math_r1_b002_001')).toEqual({
      text: 'Corrupted content under a reserved stable ID',
    });
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE questions SET source_paper_code = 'NSMQ-2024', source_question_number = '1' WHERE id = 'q_nsmq_math_r1_b002_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails closed when existing release provenance differs', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    db.exec(migrations[1]);
    db.prepare("UPDATE question_content_releases SET batch_id = 'wrong-batch' WHERE question_id = 'q_nsmq_math_r1_b002_001'").run();
    expect(() => db.exec(migrations[1])).toThrow();
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    db.exec(migrations[0]);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_nsmq_%_b002_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
