import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const migrationNames = [
  '237_bece_bdt_gap_beta_part_1.sql','238_bece_bdt_gap_beta_part_2.sql','239_bece_bdt_gap_beta_part_3.sql','240_bece_bdt_gap_beta_part_4.sql',
  '241_bece_math_sets_beta_part_1.sql','242_bece_math_sets_beta_part_2.sql','243_bece_math_sets_beta_part_3.sql','244_bece_math_sets_beta_part_4.sql',
  '245_bece_science_agric_beta_part_1.sql','246_bece_science_agric_beta_part_2.sql','247_bece_science_agric_beta_part_3.sql','248_bece_science_agric_beta_part_4.sql',
] as const;
const batchNames = ['bece-bdt-gap-beta-001','bece-math-sets-beta-001','bece-science-agric-beta-001'] as const;
const migrations = migrationNames.map((name) => readFileSync(new URL(`../../../database/migrations/${name}`, import.meta.url), 'utf8'));
const rollbacks = migrationNames.map((name) => readFileSync(new URL(`../../../database/rollbacks/${name}`, import.meta.url), 'utf8'));
const batches = batchNames.map((name) => JSON.parse(readFileSync(new URL(`../../../content/batches/${name}.json`, import.meta.url), 'utf8')));
const preflight = readFileSync(new URL('../../../database/preflight/237_248_bece_gap_beta.sql', import.meta.url), 'utf8');

function fixture() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
    CREATE TABLE subjects (id TEXT PRIMARY KEY, exam_type_id TEXT NOT NULL REFERENCES exam_types(id));
    CREATE TABLE topics (id TEXT PRIMARY KEY, subject_id TEXT NOT NULL REFERENCES subjects(id), name TEXT, slug TEXT);
    CREATE TABLE questions (
      id TEXT PRIMARY KEY, topic_id TEXT REFERENCES topics(id), subject_id TEXT NOT NULL REFERENCES subjects(id), exam_type_id TEXT REFERENCES exam_types(id),
      question_text TEXT NOT NULL, question_type TEXT NOT NULL, options TEXT, correct_answer TEXT NOT NULL, explanation TEXT, difficulty TEXT NOT NULL,
      points INTEGER, marks INTEGER, time_limit INTEGER, command_word TEXT, assessment_objective TEXT
    );
    CREATE TABLE question_content_releases (
      question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE, batch_id TEXT NOT NULL, quality_assurance TEXT NOT NULL,
      release_channel TEXT NOT NULL, content_label TEXT NOT NULL, source_url TEXT NOT NULL, official_exam_board_content INTEGER NOT NULL,
      feedback_enabled INTEGER NOT NULL
    );
    CREATE TABLE question_bank_remediation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, migration_id TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      field_name TEXT NOT NULL, old_value TEXT, new_value TEXT, changed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(migration_id, entity_type, entity_id, field_name)
    );
    CREATE TRIGGER trg_questions_subject_exam_insert BEFORE INSERT ON questions WHEN NOT EXISTS (
      SELECT 1 FROM subjects s WHERE s.id=NEW.subject_id AND s.exam_type_id IS NEW.exam_type_id
    ) BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_EXAM_MISMATCH'); END;
    CREATE TRIGGER trg_questions_subject_topic_insert BEFORE INSERT ON questions WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics t WHERE t.id=NEW.topic_id AND t.subject_id=NEW.subject_id
    ) BEGIN SELECT RAISE(ABORT, 'QUESTION_SUBJECT_TOPIC_MISMATCH'); END;
    INSERT INTO exam_types(id) VALUES ('exam_bece');
    INSERT INTO subjects(id,exam_type_id) VALUES ('subj_bece_bdt','exam_bece'),('subj_bece_math','exam_bece'),('subj_bece_science','exam_bece');
    INSERT INTO topics(id,subject_id,name,slug) VALUES
      ('topic_bece_bdt_construction','subj_bece_bdt','Construction and Structures','construction-and-structures'),
      ('topic_bece_bdt_electricals','subj_bece_bdt','Electrical and Electronic Systems','electrical-and-electronic-systems'),
      ('topic_bece_bdt_entrepreneurship','subj_bece_bdt','Entrepreneurship','entrepreneurship'),
      ('topic_bece_math_sets','subj_bece_math','Sets','sets'),
      ('topic_bece_science_agric','subj_bece_science','Agriculture and Food Production','agriculture-and-food-production');
    INSERT INTO questions(id,subject_id,exam_type_id,question_text,question_type,correct_answer,difficulty)
      VALUES ('baseline_question','subj_bece_math','exam_bece','A baseline question that must survive all release operations.','short_answer','baseline','easy');
  `);
  return db;
}

function applyAll(db: Database.Database) {
  for (const migration of migrations) db.exec(migration);
}

function hasShortPeriod(values: string[], maximumPeriod = 4) {
  return Array.from({ length: maximumPeriod }, (_, index) => index + 1)
    .some((period) => values.every((value, index) => value === values[index % period]));
}

describe('BECE gap beta migrations 237-248', () => {
  it.each(migrationNames.map((name,index) => [name,migrations[index]]))('keeps %s below the D1 statement limit with CRLF', (name, sql) => {
    const crlf = sql.replace(/\r\n/g,'\n').replace(/\n/g,'\r\n');
    expect(Buffer.byteLength(`${crlf}\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`,'utf8')).toBeLessThan(19_500);
  });

  it('publishes reviewed-beta manifests with explicit metadata, balanced answers and misconception-specific rationales', () => {
    const reviewedPairs = new Set<string>();
    const rationaleSkeletons = new Set<string>();
    const openingCounts = new Map<string, number>();
    const questionsById = new Map<string, { difficulty: string; commandWord: string; assessmentObjective: string }>();
    let distractorCount = 0;
    const legacyPhrases = [
      'This option does not satisfy the principle tested',
      'does not match the condition or function described',
      'The evidence therefore supports',
    ];
    const misconceptionEvidence = /absolute promise|unsafe condition|set membership|wrong count|incidental appearance|wrong cause|different property/;
    for (const batch of batches) {
      expect(batch.status).toBe('approved_for_beta');
      expect(batch.review.qualityAssurance).toBe('automated_beta');
      expect(batch.release.rationaleAvailability).toBe('manifest_only_runtime_question_schema_does_not_store_option_rationales');
      expect(batch.review.semanticDuplicateReview.unresolvedAllowedOverlaps).toEqual([]);
      const questions = batch.subjects[0].questions;
      expect(questions).toHaveLength(40);
      const answers = questions.map((question: { correctAnswer: string }) => question.correctAnswer);
      expect(Object.fromEntries(['A','B','C','D'].map((label) => [label, answers.filter((answer: string) => answer === label).length]))).toEqual({ A:10, B:10, C:10, D:10 });
      expect(hasShortPeriod(answers)).toBe(false);
      expect(hasShortPeriod(questions.map((question: { difficulty: string }) => question.difficulty), 3)).toBe(false);
      expect(hasShortPeriod(questions.map((question: { assessmentObjective: string }) => question.assessmentObjective), 3)).toBe(false);
      for (const question of questions) {
        questionsById.set(question.id, question);
        const optionTexts = new Set(question.options.map((option: { text: string }) => option.text));
        expect(optionTexts.size).toBe(4);
        const correctOption = question.options.find((option: { label: string }) => option.label === question.correctAnswer);
        expect(correctOption).toBeDefined();
        for (const option of question.options) {
          expect(option.rationale.length).toBeGreaterThanOrEqual(20);
          for (const phrase of legacyPhrases) expect(option.rationale).not.toContain(phrase);
          if (option.label !== question.correctAnswer) {
            distractorCount += 1;
            expect(option.rationale).toContain(`“${option.text}”`);
            expect(option.rationale).toContain(`“${correctOption.text}”`);
            expect(option.rationale).toMatch(misconceptionEvidence);
            const withoutQuotedChoices = option.rationale.replace(/“[^”]+”/g, '').trim();
            expect(withoutQuotedChoices.length).toBeGreaterThan(120);
            const skeleton = option.rationale.replace(/“[^”]+”/g, 'CHOICE').replace(/\s+/g, ' ').trim();
            rationaleSkeletons.add(skeleton);
            const opening = skeleton.split(/\s+/).slice(0, 3).join(' ');
            openingCounts.set(opening, (openingCounts.get(opening) ?? 0) + 1);
          }
        }
      }
      for (const pair of batch.review.semanticDuplicateReview.rewrittenPairs) reviewedPairs.add(`${pair.questionId}|${pair.priorQuestionId}`);
    }
    expect(distractorCount).toBe(360);
    expect(rationaleSkeletons.size).toBeGreaterThanOrEqual(30);
    expect(openingCounts.size).toBeGreaterThanOrEqual(10);
    expect(Math.max(...openingCounts.values())).toBeLessThanOrEqual(60);
    expect(reviewedPairs.size).toBe(16);
    expect(questionsById.get('q_bece_bdt_gap_b001_001')).toMatchObject({ difficulty:'easy', commandWord:'Identify', assessmentObjective:'AO1' });
    expect(questionsById.get('q_bece_bdt_gap_b001_015')).toMatchObject({ difficulty:'medium', commandWord:'Explain', assessmentObjective:'AO2' });
    expect(questionsById.get('q_bece_bdt_gap_b001_033')).toMatchObject({ difficulty:'easy', commandWord:'Define', assessmentObjective:'AO1' });
    expect(questionsById.get('q_bece_bdt_gap_b001_038')).toMatchObject({ difficulty:'easy', commandWord:'Interpret', assessmentObjective:'AO1' });
    expect(questionsById.get('q_bece_science_agric_b001_019')).toMatchObject({ difficulty:'medium', commandWord:'Apply', assessmentObjective:'AO2' });
    expect(questionsById.get('q_bece_science_agric_b001_040')).toMatchObject({ difficulty:'medium', commandWord:'Explain', assessmentObjective:'AO2' });
  });

  it('loads 120 exact topic-bound questions, passes fail-closed preflight, and replays idempotently', () => {
    const db = fixture();
    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) count FROM questions WHERE id <> 'baseline_question'").get()).toEqual({ count:120 });
    expect(db.prepare(`SELECT topic_id,COUNT(*) count FROM questions WHERE id <> 'baseline_question' GROUP BY topic_id ORDER BY topic_id`).all()).toEqual([
      { topic_id:'topic_bece_bdt_construction', count:14 }, { topic_id:'topic_bece_bdt_electricals', count:13 },
      { topic_id:'topic_bece_bdt_entrepreneurship', count:13 }, { topic_id:'topic_bece_math_sets', count:40 },
      { topic_id:'topic_bece_science_agric', count:40 },
    ]);
    expect(db.prepare(`SELECT COUNT(*) count FROM questions q JOIN topics t ON t.id=q.topic_id JOIN question_content_releases r ON r.question_id=q.id
      WHERE q.id <> 'baseline_question' AND q.subject_id=t.subject_id AND q.exam_type_id='exam_bece' AND q.question_type='multiple_choice'
      AND json_valid(q.options) AND json_array_length(q.options)=4 AND q.correct_answer IN ('A','B','C','D') AND length(q.explanation)>=80
      AND r.quality_assurance='automated_beta' AND r.release_channel='beta' AND r.official_exam_board_content=0 AND r.feedback_enabled=1`).get()).toEqual({ count:120 });
    expect(db.prepare("SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id IN ('237_bece_bdt_gap_beta_part_1','238_bece_bdt_gap_beta_part_2','239_bece_bdt_gap_beta_part_3','240_bece_bdt_gap_beta_part_4','241_bece_math_sets_beta_part_1','242_bece_math_sets_beta_part_2','243_bece_math_sets_beta_part_3','244_bece_math_sets_beta_part_4','245_bece_science_agric_beta_part_1','246_bece_science_agric_beta_part_2','247_bece_science_agric_beta_part_3','248_bece_science_agric_beta_part_4')").get()).toEqual({ count:120 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    expect(() => db.exec(preflight)).not.toThrow();
    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) count FROM questions WHERE id <> 'baseline_question'").get()).toEqual({ count:120 });
    db.close();
  });

  it('uses exact migration and question identities in a fail-closed preflight', () => {
    const statements = preflight.split(/;\r?\n/).map((statement) => statement.trim()).filter(Boolean);
    expect(Math.max(...statements.map((statement) => Buffer.byteLength(`${statement};\r\n`, 'utf8')))).toBeLessThan(19_500);
    expect(preflight).not.toContain('BETWEEN 237 AND 248');
    expect(preflight).not.toMatch(/LIKE\s+'q_bece_/);
    for (const name of migrationNames) expect(preflight).toContain(name.replace('.sql',''));
    const db = fixture();
    applyAll(db);
    db.prepare("UPDATE questions SET question_text=?, explanation=? WHERE id='q_bece_bdt_gap_b001_001'").run(
      'A structurally valid but unauthorized replacement prompt that preserves the original identifier and metadata?',
      'This unauthorized replacement explanation deliberately exceeds eighty characters while remaining structurally valid, so only an exact-content preflight can detect the drift.',
    );
    expect(() => db.exec(preflight)).toThrow();
    db.close();

    const batchDrift = fixture();
    applyAll(batchDrift);
    batchDrift.prepare("UPDATE question_content_releases SET batch_id='bece-math-sets-beta-001' WHERE question_id='q_bece_bdt_gap_b001_001'").run();
    expect(() => batchDrift.exec(preflight)).toThrow();
    batchDrift.close();

    const ledgerMappingDrift = fixture();
    applyAll(ledgerMappingDrift);
    ledgerMappingDrift.prepare("UPDATE question_bank_remediation_log SET migration_id='238_bece_bdt_gap_beta_part_2' WHERE migration_id='237_bece_bdt_gap_beta_part_1' AND entity_id='q_bece_bdt_gap_b001_001'").run();
    expect(() => ledgerMappingDrift.exec(preflight)).toThrow();
    ledgerMappingDrift.close();
  });

  it('rolls back in reverse, preserves the immutable ledger and baseline, and can be reapplied', () => {
    const db = fixture();
    applyAll(db);
    for (let index=rollbacks.length-1; index>=0; index-=1) db.exec(rollbacks[index]);
    expect(db.prepare("SELECT COUNT(*) count FROM questions WHERE id <> 'baseline_question'").get()).toEqual({ count:0 });
    expect(db.prepare("SELECT COUNT(*) count FROM question_content_releases").get()).toEqual({ count:0 });
    expect(db.prepare("SELECT COUNT(*) count FROM question_bank_remediation_log").get()).toEqual({ count:120 });
    expect(db.prepare("SELECT question_text FROM questions WHERE id='baseline_question'").get()).toEqual({ question_text:'A baseline question that must survive all release operations.' });
    applyAll(db);
    expect(db.prepare("SELECT COUNT(*) count FROM questions WHERE id <> 'baseline_question'").get()).toEqual({ count:120 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it.each([
    ['question_text','tampered prompt'],
    ['options','["A. tampered","B. option","C. option","D. option"]'],
    ['correct_answer','D'],
    ['explanation','tampered explanation'],
    ['difficulty','hard'],
    ['command_word','Tampered'],
    ['assessment_objective','AO3'],
  ] as const)('fails migration replay and rollback on %s drift', (column, value) => {
    for (const operation of [migrations[0], rollbacks[0]]) {
      const db = fixture();
      db.exec(migrations[0]);
      db.prepare(`UPDATE questions SET ${column}=? WHERE id='q_bece_bdt_gap_b001_001'`).run(value);
      expect(() => db.exec(operation)).toThrow();
      db.close();
    }
  });

  it('fails closed on release metadata and remediation-ledger drift', () => {
    const releaseDrift = fixture();
    releaseDrift.exec(migrations[0]);
    releaseDrift.prepare("UPDATE question_content_releases SET content_label='tampered' WHERE question_id='q_bece_bdt_gap_b001_001'").run();
    expect(() => releaseDrift.exec(migrations[0])).toThrow();
    expect(() => releaseDrift.exec(rollbacks[0])).toThrow();
    releaseDrift.close();

    const ledgerDrift = fixture();
    ledgerDrift.exec(migrations[0]);
    ledgerDrift.prepare("UPDATE question_bank_remediation_log SET new_value='tampered' WHERE entity_id='q_bece_bdt_gap_b001_001'").run();
    expect(() => ledgerDrift.exec(migrations[0])).toThrow();
    expect(() => ledgerDrift.exec(rollbacks[0])).toThrow();
    ledgerDrift.close();
  });

  it('fails closed on question-id drift and on a missing target topic', () => {
    const drift = fixture();
    drift.prepare(`INSERT INTO questions(id,topic_id,subject_id,exam_type_id,question_text,question_type,correct_answer,difficulty)
      VALUES (?,?,?,?,?,?,?,?)`).run('q_bece_bdt_gap_b001_001','topic_bece_bdt_electricals','subj_bece_bdt','exam_bece','Conflicting drift fixture question text.','short_answer','x','easy');
    expect(() => drift.exec(migrations[0])).toThrow();
    drift.close();
    const missing = fixture();
    missing.prepare("DELETE FROM topics WHERE id='topic_bece_bdt_construction'").run();
    expect(() => missing.exec(migrations[0])).toThrow();
    missing.close();
  });
});
