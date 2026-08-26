import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '140_wassce_technical_beta_foundation.sql',
  '141_auto_mech_beta_foundation.sql',
  '142_electronics_beta_foundation.sql',
  ...Array.from({ length: 8 }, (_, index) => `${143 + index}_auto_mech_beta_part_${index + 1}.sql`),
  ...Array.from({ length: 8 }, (_, index) => `${151 + index}_electronics_beta_part_${index + 1}.sql`),
  '159_wassce_technical_beta_final_guard.sql',
];
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/wassce-technical-beta-002.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));
const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8')) as {
  batchId: string;
  release: { contentLabel: string; officialExamBoardContent: boolean; feedbackEnabled: boolean };
  provenance: Array<{ publisher: string; title: string; url: string; use: string }>;
  subjects: Array<{
    subjectId: string;
    release: { contentLabel: string; sourceUrl: string; officialExamBoardContent: boolean; feedbackEnabled: boolean };
    topics: Array<{ code: string; title: string; objective: string }>;
    questions: Array<{
      id: string; topicCode: string; prompt: string; workedSolution: string;
      options: Array<{ label: string; text: string }>;
      correctAnswer: string; original: boolean;
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
      id TEXT PRIMARY KEY, subject_id TEXT NOT NULL REFERENCES subjects(id),
      name TEXT NOT NULL, slug TEXT NOT NULL, description TEXT, display_order INTEGER
    );
    CREATE TABLE syllabus_topics (
      id TEXT PRIMARY KEY, specification_id TEXT NOT NULL REFERENCES subject_specifications(id),
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
      SELECT 1 FROM subjects s WHERE s.id = NEW.subject_id AND s.exam_type_id IS NEW.exam_type_id
    ) BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_EXAM_MISMATCH'); END;
    CREATE TRIGGER trg_questions_subject_topic_insert
    BEFORE INSERT ON questions
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics t WHERE t.id = NEW.topic_id AND t.subject_id = NEW.subject_id
    ) BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_TOPIC_MISMATCH'); END;
    INSERT INTO exam_types(id) VALUES ('exam_wassce');
    INSERT INTO subjects(id, exam_type_id) VALUES
      ('subj_wassce_auto_mech', 'exam_wassce'),
      ('subj_wassce_electronics', 'exam_wassce');
  `);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council)|(?:waec|west african examinations council)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/gi;
const containsFalseOfficialClaim = (value: string) => officialAttributionPattern.test(value.replace(nonOfficialDisclaimerGlobalPattern, ''));

function runMutatedGenerator(from: string, to: string) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-wassce-technical-adversarial-'));
  try {
    mkdirSync(join(temporaryRoot, 'scripts'), { recursive: true });
    mkdirSync(join(temporaryRoot, 'database'), { recursive: true });
    mkdirSync(join(temporaryRoot, 'content'), { recursive: true });
    copyFile(join(repoRoot, 'scripts/question-content-lib.mjs'), join(temporaryRoot, 'scripts/question-content-lib.mjs'));
    copyFile(join(repoRoot, 'database/seed.sql'), join(temporaryRoot, 'database/seed.sql'));
    cpSync(join(repoRoot, 'content/batches'), join(temporaryRoot, 'content/batches'), { recursive: true });
    const generator = readFileSync(join(repoRoot, 'scripts/generate-wassce-technical-beta-bank.mjs'), 'utf8');
    expect(generator.split(from)).toHaveLength(2);
    const generatorPath = join(temporaryRoot, 'scripts/generate-wassce-technical-beta-bank.mjs');
    writeFileSync(generatorPath, generator.replace(from, to));
    return spawnSync(process.execPath, [generatorPath, '--output-root', join(temporaryRoot, 'generated')], {
      cwd: temporaryRoot, encoding: 'utf8',
    });
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function copyFile(from: string, to: string) {
  writeFileSync(to, readFileSync(from));
}

describe('WASSCE technical automated-beta batch 002 migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF and ledger',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-wassce-technical-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-wassce-technical-beta-bank.mjs'),
        '--output-root', temporaryRoot,
      ], { cwd: repoRoot, stdio: 'pipe' });
      for (const relativePath of artifactRelativePaths) {
        expect(readFileSync(join(temporaryRoot, relativePath), 'utf8')).toBe(readFileSync(join(repoRoot, relativePath), 'utf8'));
      }
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('declares exact official provenance and an enabled learner correction path', () => {
    expect(batch.batchId).toBe('wassce-technical-beta-002');
    expect(batch.release).toMatchObject({ officialExamBoardContent: false, feedbackEnabled: true });
    expect(batch.release.contentLabel).toContain('not official WAEC examination material');
    expect(containsFalseOfficialClaim(batch.release.contentLabel)).toBe(false);
    for (const subject of batch.subjects) {
      expect(subject.release).toMatchObject({ officialExamBoardContent: false, feedbackEnabled: true });
      expect(subject.release.contentLabel).toContain('not official WAEC examination material');
      expect(containsFalseOfficialClaim(subject.release.contentLabel)).toBe(false);
    }
    expect(batch.provenance).toHaveLength(6);
    expect(batch.provenance.every((source) => source.use === 'curriculum_blueprint_only')).toBe(true);
    expect(batch.provenance.some((source) => source.url.includes('FINAL-TIMETABLE-FOR-WASSCE-SC-2026'))).toBe(true);
    expect(batch.provenance.some((source) => source.url.includes('CHIEF-EXAMINERS-REPORTS.-WASSCE-SC-2023.pdf'))).toBe(true);
  });

  it.each([
    [
      'Which tool applies a manufacturer-specified tightening torque to an engine fastener?',
      'Which answer is copied from an official WAEC examination paper?',
    ],
    [
      'Original BrillaPrep transitional Auto Mechanics practice aligned to WAEC Ghana examiner evidence; not official WAEC examination material or a copied past paper.',
      'Official WAEC Auto Mechanics examination material prepared by BrillaPrep.',
    ],
  ])('rejects adversarial false-official claims in generated prompts or subject labels', (from, to) => {
    const result = runMutatedGenerator(from, to);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/false official-exam-board claim|must explicitly state that the content is not official WAEC material/);
  });

  it('excludes the reviewed category-error distractors from every option set', () => {
    const rejected = new Set([
      'It always freezes engine oil instantly',
      'It permanently magnetises every tool',
      'It makes all metals radioactive',
      'It will erase the odometer',
      'It produces unlimited power',
      'A mechanically rotating field only',
      'Generate hydraulic pressure',
      'Convert sound into fuel',
    ].map((value) => value.toLowerCase()));
    const optionTexts = batch.subjects.flatMap((subject) => subject.questions)
      .flatMap((question) => question.options)
      .map((option) => option.text.toLowerCase());
    expect(optionTexts.filter((option) => rejected.has(option))).toEqual([]);
  });

  it('contains 40 original MCQs across eight exactly assigned topics per subject', () => {
    expect(batch.subjects.map((subject) => subject.subjectId)).toEqual([
      'subj_wassce_auto_mech', 'subj_wassce_electronics',
    ]);
    for (const subject of batch.subjects) {
      expect(subject.topics).toHaveLength(8);
      expect(subject.questions).toHaveLength(40);
      const declared = new Set(subject.topics.map((topic) => topic.code));
      const counts = new Map<string, number>();
      for (const question of subject.questions) {
        expect(question.original).toBe(true);
        expect(containsFalseOfficialClaim(question.prompt)).toBe(false);
        expect(declared.has(question.topicCode)).toBe(true);
        expect(question.options.map((option) => option.label)).toEqual(['A', 'B', 'C', 'D']);
        expect(question.options.some((option) => option.label === question.correctAnswer)).toBe(true);
        expect(question.workedSolution.length).toBeGreaterThanOrEqual(80);
        counts.set(question.topicCode, (counts.get(question.topicCode) ?? 0) + 1);
      }
      expect([...counts.values()]).toEqual(Array(8).fill(5));
    }
  });

  it('loads and reapplies 80 relationship-valid questions with durable beta provenance', () => {
    const db = createFixture();
    applyAll(db);
    expect(db.prepare(`
      SELECT subject_id AS subjectId, COUNT(*) AS count
      FROM questions WHERE id LIKE 'q_was_%_b002_%'
      GROUP BY subject_id ORDER BY subject_id
    `).all()).toEqual([
      { subjectId: 'subj_wassce_auto_mech', count: 40 },
      { subjectId: 'subj_wassce_electronics', count: 40 },
    ]);
    expect(db.prepare(`
      SELECT COUNT(*) AS count
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN syllabus_topics st ON st.id = q.syllabus_topic_id
      JOIN subject_specifications ss ON ss.id = st.specification_id
      JOIN question_content_releases r ON r.question_id = q.id
      WHERE q.id IN (${batch.subjects.flatMap((subject) => subject.questions).map((question) => `'${question.id}'`).join(',')})
        AND q.subject_id = t.subject_id AND q.subject_id = ss.subject_id
        AND q.exam_type_id = ss.exam_type_id AND q.exam_board_id = ss.exam_board_id
        AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4
        AND q.correct_answer IN ('A','B','C','D') AND length(q.explanation) >= 80
        AND q.source_paper_code IS NULL AND q.source_question_number IS NULL
        AND r.batch_id = 'wassce-technical-beta-002' AND r.quality_assurance = 'automated_beta'
        AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1
    `).get()).toEqual({ count: 80 });
    for (const subject of batch.subjects) for (const question of subject.questions) {
      const row = db.prepare(`
        SELECT q.options, q.correct_answer AS correctAnswer,
          r.content_label AS contentLabel, r.source_url AS sourceUrl
        FROM questions q JOIN question_content_releases r ON r.question_id = q.id
        WHERE q.id = ?
      `).get(question.id) as { options: string; correctAnswer: string; contentLabel: string; sourceUrl: string };
      expect(JSON.parse(row.options)).toEqual(question.options.map(({ label, text }) => `${label}. ${text}`));
      expect(row.correctAnswer).toBe(question.correctAnswer);
      expect(row.contentLabel).toBe(subject.release.contentLabel);
      expect(row.sourceUrl).toBe(subject.release.sourceUrl);
    }
    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(db.pragma('integrity_check', { simple: true })).toBe('ok');
    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM question_content_releases WHERE batch_id = 'wassce-technical-beta-002'").get()).toEqual({ count: 80 });
    db.close();
  });

  it('fails closed on a stable-ID collision with different canonical content', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 3)) db.exec(migration);
    db.prepare(`INSERT INTO questions (
      id, topic_id, subject_id, exam_type_id, question_text, question_type, options,
      correct_answer, explanation, difficulty, points, marks, time_limit,
      syllabus_topic_id, command_word, assessment_objective, exam_board_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('q_was_auto_mech_b002_001', 'topic_was_auto_mech_b002_1', 'subj_wassce_auto_mech', 'exam_wassce',
        'Corrupted content under a reserved technical batch ID', 'multiple_choice',
        '["A. Wrong","B. Wrong","C. Wrong","D. Wrong"]', 'A',
        'This intentionally corrupted fixture proves the stable identifier collision guard rejects noncanonical content.',
        'easy', 1, 1, 90, 'st_was_auto_mech_b002_1', 'Identify', 'AO1', 'board_waec');
    expect(() => db.exec(migrations[3])).toThrow();
    db.close();
  });

  it('fails closed when a canonical row acquires false official-paper metadata', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 4)) db.exec(migration);
    db.prepare("UPDATE questions SET source_paper_code = 'WAEC-SC6031', source_question_number = '1', section = 'official' WHERE id = 'q_was_auto_mech_b002_001'").run();
    expect(() => db.exec(migrations[3])).toThrow();
    db.close();
  });

  it('fails closed when release provenance differs', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 4)) db.exec(migration);
    db.prepare("UPDATE question_content_releases SET official_exam_board_content = 1 WHERE question_id = 'q_was_auto_mech_b002_001'").run();
    expect(() => db.exec(migrations[3])).toThrow();
    db.close();
  });

  it.each([
    ['content_label', 'Official WAEC Auto Mechanics examination material'],
    ['source_url', 'https://example.invalid/false-official-source'],
  ] as const)('fails the final guard when %s differs from exact subject provenance', (column, value) => {
    const db = createFixture();
    applyAll(db);
    db.prepare(`UPDATE question_content_releases SET ${column} = ? WHERE question_id = ?`)
      .run(value, 'q_was_auto_mech_b002_001');
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    db.close();
  });

  it('fails the final guard when earlier question parts are missing', () => {
    const db = createFixture();
    for (const migration of migrations.slice(0, 3)) db.exec(migration);
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM questions WHERE id LIKE 'q_was_%_b002_%'").get()).toEqual({ count: 0 });
    db.close();
  });
});
