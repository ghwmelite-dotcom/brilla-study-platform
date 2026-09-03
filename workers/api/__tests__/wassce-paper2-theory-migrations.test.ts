import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

interface QuestionSpec {
  id: string;
  type: 'essay' | 'structured';
  marks: number;
}

interface MigrationSpec {
  number: number;
  slug: string;
  paperId: string;
  questions: QuestionSpec[];
}

const MIGRATIONS: MigrationSpec[] = [
  {
    number: 363,
    slug: 'english',
    paperId: 'pp_wassce_eng_2024_2',
    questions: [
      { id: 'q_eng_2024_2_001', type: 'essay', marks: 40 },
      { id: 'q_eng_2024_2_002', type: 'essay', marks: 40 },
      { id: 'q_eng_2024_2_003', type: 'essay', marks: 40 },
      { id: 'q_eng_2024_2_004', type: 'essay', marks: 40 },
      { id: 'q_eng_2024_2_005', type: 'essay', marks: 40 },
      { id: 'q_eng_2024_2_006', type: 'essay', marks: 40 },
      { id: 'q_eng_2024_2_007', type: 'structured', marks: 30 },
      { id: 'q_eng_2024_2_008', type: 'structured', marks: 30 },
    ],
  },
  {
    number: 364,
    slug: 'math',
    paperId: 'pp_wassce_math_2024_2',
    questions: [
      { id: 'q_math_2024_2_001', type: 'structured', marks: 8 },
      { id: 'q_math_2024_2_002', type: 'structured', marks: 8 },
      { id: 'q_math_2024_2_003', type: 'structured', marks: 8 },
      { id: 'q_math_2024_2_004', type: 'structured', marks: 8 },
      { id: 'q_math_2024_2_005', type: 'structured', marks: 8 },
      { id: 'q_math_2024_2_006', type: 'structured', marks: 15 },
      { id: 'q_math_2024_2_007', type: 'structured', marks: 15 },
      { id: 'q_math_2024_2_008', type: 'structured', marks: 15 },
      { id: 'q_math_2024_2_009', type: 'structured', marks: 15 },
      { id: 'q_math_2024_2_010', type: 'structured', marks: 15 },
    ],
  },
  {
    number: 365,
    slug: 'science',
    paperId: 'pp_wassce_sci_2024_2',
    questions: [
      { id: 'q_sci_2024_2_001', type: 'structured', marks: 12 },
      { id: 'q_sci_2024_2_002', type: 'structured', marks: 12 },
      { id: 'q_sci_2024_2_003', type: 'structured', marks: 12 },
      { id: 'q_sci_2024_2_004', type: 'structured', marks: 12 },
      { id: 'q_sci_2024_2_005', type: 'structured', marks: 12 },
      { id: 'q_sci_2024_2_006', type: 'structured', marks: 12 },
      { id: 'q_sci_2024_2_007', type: 'essay', marks: 14 },
      { id: 'q_sci_2024_2_008', type: 'essay', marks: 14 },
    ],
  },
  {
    number: 366,
    slug: 'social',
    paperId: 'pp_wassce_soc_2024_2',
    questions: [
      { id: 'q_soc_2024_2_001', type: 'essay', marks: 20 },
      { id: 'q_soc_2024_2_002', type: 'essay', marks: 20 },
      { id: 'q_soc_2024_2_003', type: 'essay', marks: 20 },
      { id: 'q_soc_2024_2_004', type: 'essay', marks: 20 },
      { id: 'q_soc_2024_2_005', type: 'essay', marks: 20 },
      { id: 'q_soc_2024_2_006', type: 'essay', marks: 20 },
      { id: 'q_soc_2024_2_007', type: 'essay', marks: 20 },
      { id: 'q_soc_2024_2_008', type: 'essay', marks: 20 },
      { id: 'q_soc_2024_2_009', type: 'essay', marks: 20 },
    ],
  },
];

const migrationSql = (spec: MigrationSpec) => readFileSync(
  new URL(`../../../database/migrations/${spec.number}_wassce_paper2_theory_${spec.slug}.sql`, import.meta.url),
  'utf8',
);
const rollbackSql = (spec: MigrationSpec) => readFileSync(
  new URL(`../../../database/rollbacks/${spec.number}_wassce_paper2_theory_${spec.slug}_rollback.sql`, import.meta.url),
  'utf8',
);

function buildDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE past_papers (
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      paper_type_id TEXT NOT NULL,
      year INTEGER NOT NULL,
      month TEXT,
      series TEXT,
      title TEXT NOT NULL,
      description TEXT,
      total_questions INTEGER DEFAULT 0,
      total_marks INTEGER,
      time_allowed INTEGER,
      instructions TEXT,
      is_complete INTEGER DEFAULT 0,
      is_premium INTEGER DEFAULT 0,
      source_url TEXT,
      exam_board_id TEXT,
      specification_id TEXT,
      paper_component_id TEXT,
      variant TEXT,
      session TEXT,
      tier TEXT,
      has_mark_scheme INTEGER DEFAULT 0,
      has_examiner_report INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      topic_id TEXT,
      subject_id TEXT NOT NULL,
      exam_type_id TEXT,
      paper_type_id TEXT,
      past_paper_id TEXT,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      round_type TEXT,
      options TEXT,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      difficulty TEXT NOT NULL DEFAULT 'medium',
      points INTEGER DEFAULT 3,
      marks INTEGER DEFAULT 1,
      time_limit INTEGER DEFAULT 30,
      question_number INTEGER,
      section TEXT,
      is_compulsory INTEGER DEFAULT 1,
      image_url TEXT,
      syllabus_topic_id TEXT,
      command_word TEXT,
      assessment_objective TEXT,
      source_paper_code TEXT,
      source_question_number TEXT,
      exam_board_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE essay_questions (
      id TEXT PRIMARY KEY,
      question_id TEXT UNIQUE NOT NULL,
      word_limit_min INTEGER,
      word_limit_max INTEGER,
      requires_introduction INTEGER DEFAULT 1,
      requires_conclusion INTEGER DEFAULT 1,
      marking_scheme TEXT NOT NULL,
      model_answer TEXT,
      marking_rubric TEXT,
      required_points TEXT,
      optional_points TEXT,
      ai_grading_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE structured_question_parts (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      part_label TEXT NOT NULL,
      part_text TEXT NOT NULL,
      marks INTEGER NOT NULL DEFAULT 1,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      answer_type TEXT DEFAULT 'text',
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE question_content_releases (
      question_id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      quality_assurance TEXT NOT NULL,
      release_channel TEXT NOT NULL,
      content_label TEXT NOT NULL,
      source_url TEXT NOT NULL,
      official_exam_board_content INTEGER NOT NULL DEFAULT 0,
      feedback_enabled INTEGER NOT NULL DEFAULT 1,
      released_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

function assertApplied(db: Database.Database, spec: MigrationSpec) {
  const paper = db.prepare('SELECT total_questions, total_marks, time_allowed FROM past_papers WHERE id = ?')
    .get(spec.paperId) as { total_questions: number; total_marks: number; time_allowed: number } | undefined;
  expect(paper, `paper ${spec.paperId} exists`).toBeTruthy();
  const marksSum = spec.questions.reduce((sum, q) => sum + q.marks, 0);
  expect(paper!.total_questions).toBe(spec.questions.length);
  expect(paper!.total_marks).toBe(marksSum);

  for (const question of spec.questions) {
    const row = db.prepare('SELECT question_type, marks, past_paper_id FROM questions WHERE id = ?')
      .get(question.id) as { question_type: string; marks: number; past_paper_id: string } | undefined;
    expect(row, `question ${question.id} exists`).toBeTruthy();
    expect(row).toMatchObject({
      question_type: question.type,
      marks: question.marks,
      past_paper_id: spec.paperId,
    });

    if (question.type === 'essay') {
      const scheme = db.prepare(
        `SELECT COALESCE(SUM(CAST(json_extract(p.value, '$.marks') AS INTEGER)), 0) AS total
         FROM essay_questions e, json_each(json_extract(e.marking_scheme, '$.points')) p
         WHERE e.question_id = ?`,
      ).get(question.id) as { total: number };
      expect(scheme.total, `essay scheme for ${question.id} sums to marks`).toBe(question.marks);
      const grading = db.prepare('SELECT ai_grading_enabled FROM essay_questions WHERE question_id = ?')
        .get(question.id) as { ai_grading_enabled: number };
      expect(grading.ai_grading_enabled).toBe(1);
    } else {
      const parts = db.prepare('SELECT COALESCE(SUM(marks), 0) AS total, COUNT(*) AS n FROM structured_question_parts WHERE question_id = ?')
        .get(question.id) as { total: number; n: number };
      expect(parts.n, `structured ${question.id} has parts`).toBeGreaterThanOrEqual(2);
      expect(parts.total, `parts for ${question.id} sum to marks`).toBe(question.marks);
    }

    const release = db.prepare('SELECT official_exam_board_content, content_label FROM question_content_releases WHERE question_id = ?')
      .get(question.id) as { official_exam_board_content: number; content_label: string } | undefined;
    expect(release, `release row for ${question.id}`).toBeTruthy();
    expect(release!.official_exam_board_content).toBe(0);
    expect(release!.content_label).toMatch(/not official WAEC/i);
  }
}

function assertRolledBack(db: Database.Database, spec: MigrationSpec) {
  const ids = spec.questions.map((q) => q.id);
  const placeholders = ids.map(() => '?').join(', ');
  expect(db.prepare(`SELECT COUNT(*) AS n FROM questions WHERE id IN (${placeholders})`).get(...ids))
    .toMatchObject({ n: 0 });
  expect(db.prepare(`SELECT COUNT(*) AS n FROM essay_questions WHERE question_id IN (${placeholders})`).get(...ids))
    .toMatchObject({ n: 0 });
  expect(db.prepare(`SELECT COUNT(*) AS n FROM structured_question_parts WHERE question_id IN (${placeholders})`).get(...ids))
    .toMatchObject({ n: 0 });
  expect(db.prepare(`SELECT COUNT(*) AS n FROM question_content_releases WHERE question_id IN (${placeholders})`).get(...ids))
    .toMatchObject({ n: 0 });
  expect(db.prepare('SELECT COUNT(*) AS n FROM past_papers WHERE id = ?').get(spec.paperId))
    .toMatchObject({ n: 0 });
}

describe('wassce paper 2 theory migrations', () => {
  for (const spec of MIGRATIONS) {
    describe(`${spec.number} (${spec.slug})`, () => {
      it('applies the paper, its questions, marking data and release rows', () => {
        const db = buildDb();
        try {
          db.exec(migrationSql(spec));
          assertApplied(db, spec);
        } finally {
          db.close();
        }
      });

      it('rolls back without orphans and re-applies idempotently', () => {
        const db = buildDb();
        try {
          db.exec(migrationSql(spec));
          db.exec(rollbackSql(spec));
          assertRolledBack(db, spec);

          // Re-application after rollback restores the full set (INSERT OR
          // IGNORE convention: the guard counts make a drifted re-apply fail).
          db.exec(migrationSql(spec));
          assertApplied(db, spec);

          // Applying twice in a row is a no-op, not a failure.
          db.exec(migrationSql(spec));
          assertApplied(db, spec);
        } finally {
          db.close();
        }
      });
    });
  }
});
