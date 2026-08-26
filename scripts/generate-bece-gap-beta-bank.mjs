import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentLabel, releases, source } from './bece-gap-beta-data.mjs';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedAt = '2026-08-26T00:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const answerPositions = [2,0,3,1,1,3,0,2,3,2,1,0,0,2,3,1,1,0,2,3,2,3,0,1,0,1,3,2,3,0,1,2,1,2,0,3,2,0,3,1];
const academicMetadata = {
  'bece-bdt-gap-beta-001': [
    ['medium','Explain','AO2'],['easy','Identify','AO1'],['medium','Explain','AO2'],['medium','Explain','AO2'],['medium','Explain','AO2'],
    ['medium','Apply','AO2'],['hard','Explain','AO3'],['medium','Identify','AO2'],['medium','Explain','AO2'],['hard','Sequence','AO3'],
    ['medium','Explain','AO2'],['medium','Apply','AO2'],['medium','Explain','AO2'],['hard','Apply','AO3'],['easy','Explain','AO1'],
    ['medium','Identify','AO2'],['hard','Explain','AO3'],['medium','Explain','AO2'],['easy','Identify','AO1'],['medium','Explain','AO2'],
    ['medium','Apply','AO2'],['easy','Identify','AO1'],['medium','Explain','AO2'],['medium','Explain','AO2'],['medium','Apply','AO2'],
    ['hard','Apply','AO3'],['medium','Select','AO2'],['medium','Explain','AO2'],['medium','Explain','AO2'],['easy','Calculate','AO1'],
    ['medium','Explain','AO2'],['medium','Explain','AO2'],['hard','Evaluate','AO3'],['hard','Evaluate','AO3'],['medium','Explain','AO2'],
    ['medium','Explain','AO2'],['medium','Interpret','AO2'],['medium','Evaluate','AO2'],['hard','Explain','AO3'],['hard','Explain','AO3'],
  ],
  'bece-math-sets-beta-001': [
    ['easy','Identify','AO1'],['easy','Calculate','AO1'],['easy','Identify','AO1'],['easy','Define','AO1'],['medium','Determine','AO2'],
    ['easy','Determine','AO1'],['easy','Determine','AO1'],['easy','Identify','AO1'],['medium','Determine','AO2'],['medium','Explain','AO2'],
    ['medium','Represent','AO2'],['easy','Identify','AO1'],['medium','Calculate','AO2'],['medium','Calculate','AO2'],['easy','Identify','AO1'],
    ['medium','Deduce','AO2'],['medium','Calculate','AO2'],['medium','Identify','AO2'],['easy','Compare','AO1'],['medium','Interpret','AO2'],
    ['medium','Determine','AO2'],['hard','Calculate','AO3'],['medium','Calculate','AO2'],['medium','Calculate','AO2'],['easy','Identify','AO1'],
    ['medium','Calculate','AO2'],['easy','Identify','AO1'],['hard','Deduce','AO3'],['medium','Calculate','AO2'],['medium','Compare','AO2'],
    ['hard','Deduce','AO3'],['hard','Deduce','AO3'],['medium','Calculate','AO2'],['medium','Calculate','AO2'],['medium','Determine','AO2'],
    ['medium','Explain','AO2'],['hard','Calculate','AO3'],['hard','Calculate','AO3'],['easy','Determine','AO1'],['easy','Determine','AO1'],
  ],
  'bece-science-agric-beta-001': [
    ['easy','Identify','AO1'],['medium','Explain','AO2'],['easy','Define','AO1'],['medium','Explain','AO2'],['medium','Apply','AO2'],
    ['medium','Explain','AO2'],['hard','Explain','AO3'],['medium','Select','AO2'],['medium','Identify','AO2'],['medium','Explain','AO2'],
    ['medium','Explain','AO2'],['easy','Identify','AO1'],['medium','Explain','AO2'],['medium','Explain','AO2'],['hard','Apply','AO3'],
    ['hard','Apply','AO3'],['easy','Select','AO1'],['medium','Explain','AO2'],['medium','Define','AO2'],['medium','Explain','AO2'],
    ['hard','Explain','AO3'],['medium','Explain','AO2'],['easy','Identify','AO1'],['medium','Explain','AO2'],['medium','Explain','AO2'],
    ['hard','Explain','AO3'],['medium','Explain','AO2'],['medium','Explain','AO2'],['medium','Apply','AO2'],['medium','Explain','AO2'],
    ['medium','Select','AO2'],['easy','Define','AO1'],['hard','Evaluate','AO3'],['hard','Explain','AO3'],['hard','Explain','AO3'],
    ['hard','Explain','AO3'],['medium','Interpret','AO2'],['hard','Evaluate','AO3'],['hard','Explain','AO3'],['hard','Evaluate','AO3'],
  ],
};
const reviewedMetadataOverrides = new Map([
  ['q_bece_bdt_gap_b001_001', ['easy','Identify','AO1']],
  ['q_bece_bdt_gap_b001_015', ['medium','Explain','AO2']],
  ['q_bece_bdt_gap_b001_033', ['easy','Define','AO1']],
  ['q_bece_bdt_gap_b001_038', ['easy','Interpret','AO1']],
  ['q_bece_science_agric_b001_019', ['medium','Apply','AO2']],
  ['q_bece_science_agric_b001_040', ['medium','Explain','AO2']],
]);
const semanticOverlapResolutions = [
  ['q_bece_bdt_gap_b001_004','q_was_building_b003_018'],['q_bece_bdt_gap_b001_005','q_was_building_b003_012'],
  ['q_bece_bdt_gap_b001_007','q_was_building_b003_016'],['q_bece_bdt_gap_b001_008','q_was_building_b003_032'],
  ['q_bece_bdt_gap_b001_012','q_was_building_b003_007'],['q_bece_bdt_gap_b001_013','q_was_building_b003_009'],
  ['q_bece_bdt_gap_b001_015','q_was_elect_b001_037'],['q_bece_bdt_gap_b001_017','q_was_elect_b001_036'],
  ['q_bece_bdt_gap_b001_021','q_was_elect_b001_001'],['q_bece_science_agric_b001_007','q_was_agric_b001_013'],
  ['q_bece_science_agric_b001_015','q_was_agric_b001_014'],['q_bece_science_agric_b001_019','q_was_agric_b001_018'],
  ['q_bece_science_agric_b001_021','q_was_agric_b001_017'],['q_bece_science_agric_b001_034','q_was_agric_b001_036'],
  ['q_bece_science_agric_b001_037','q_was_agric_b001_004'],['q_bece_science_agric_b001_039','q_was_agric_b001_015'],
];
const reviewedSemanticOverlapAllowlist = new Set();
const semanticStopWords = new Set(['a','an','and','are','as','at','be','best','by','does','for','from','how','if','in','is','it','of','on','or','should','that','the','their','this','to','what','when','which','why','with']);
const topicIds = new Map([
  ['BDT-CONSTRUCTION', 'topic_bece_bdt_construction'],
  ['BDT-ELECTRICAL', 'topic_bece_bdt_electricals'],
  ['BDT-ENTREPRENEURSHIP', 'topic_bece_bdt_entrepreneurship'],
  ['MATH-SETS', 'topic_bece_math_sets'],
  ['SCI-AGRIC', 'topic_bece_science_agric'],
]);

const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const questionId = (release, index) => `${release.idPrefix}${String(index + 1).padStart(3, '0')}`;

const rationaleFrames = [
  (choice) => `Selecting “${choice}” misclassifies the idea being tested.`,
  (choice) => `Choosing “${choice}” follows a different rule from the one required here.`,
  (choice) => `The response “${choice}” points to the wrong property.`,
  (choice) => `Using “${choice}” would apply the concept in the wrong context.`,
  (choice) => `The claim “${choice}” conflicts with the relationship described in the stem.`,
  (choice) => `Treating “${choice}” as correct overlooks the decisive condition.`,
  (choice) => `That choice, “${choice}”, substitutes a distractor feature for the tested principle.`,
  (choice) => `The proposed answer “${choice}” cannot be reconciled with the stated conditions.`,
  (choice) => `Accepting “${choice}” would bypass the reasoning the item requires.`,
  (choice) => `The option “${choice}” describes a different outcome from the one supported by the evidence.`,
  (choice) => `Here, “${choice}” represents the misconception rather than the valid conclusion.`,
  (choice) => `A learner choosing “${choice}” would be relying on the wrong criterion.`,
];

function misconceptionReason(distractor) {
  if (/\b(all|always|every|forever|guarantee|never|unlimited|instantly|permanently|identical)\b/i.test(distractor)) {
    return 'It turns a limited principle into an absolute promise that the evidence cannot support.';
  }
  if (/\b(wet|bare|strong wind|drink bottle|loose|leave supply on|directly touching|pour water|hold the bare|cut toward|in the air near the blade|direct sun|unsafe water)\b/i.test(distractor)) {
    return 'It recommends an unsafe condition or action and ignores the hazard-control step central to the item.';
  }
  if (/[∈∉⊂⊆∩∪∅′\{}]|\b(subset|union|intersection|complement|elements?|cardinality|odd|even|prime|multiple)\b/i.test(distractor)) {
    return 'It misapplies set membership, notation, or counting, so its members or numerical result do not satisfy the stated relationship.';
  }
  if (/^-?\d+(?:\s*[A-Za-z%Ω])?$|^\{.*\}$/.test(distractor.trim())) {
    return 'That value comes from the wrong count or operation rather than from the quantities and relationship given in the stem.';
  }
  if (/\b(colou?r|paint|label|chairs?|owner.?s age|brand|name length|north arrow|temperature|furniture|appliance count|printed numbers)\b/i.test(distractor)) {
    return 'It focuses on an incidental appearance or administrative detail that cannot perform the technical function being assessed.';
  }
  if (/\b(remove|replace|eliminate|prevent|stop|block|increase|decrease|store|hide|ignore|random|unnecessary|zero)\b/i.test(distractor)) {
    return 'It assigns the wrong cause, direction, or consequence to the process, reversing the practical relationship described.';
  }
  return 'It substitutes a different property, process, or category and therefore does not account for the defining condition in the stem.';
}

function distractorRationale(item, distractor, optionIndex, questionIndex) {
  const hash = [...distractor].reduce((total, character) => total + character.codePointAt(0), questionIndex * 17 + optionIndex * 31);
  const opening = rationaleFrames[hash % rationaleFrames.length](distractor);
  const explanation = item.explanation.charAt(0).toLowerCase() + item.explanation.slice(1);
  return `${opening} ${misconceptionReason(distractor)} By contrast, “${item.correct}” is defensible because ${explanation}`;
}

function mcq(release, index, item) {
  const correctIndex = answerPositions[(index + release.migrationStart) % answerPositions.length];
  const id = questionId(release, index);
  const metadata = reviewedMetadataOverrides.get(id) ?? academicMetadata[release.batchId]?.[index];
  if (!metadata) throw new Error(`Missing academic metadata for ${id}`);
  const rawOptions = [...item.wrong];
  rawOptions.splice(correctIndex, 0, item.correct);
  return {
    id,
    original: true,
    topicCode: item.topicCode,
    type: 'multiple_choice',
    prompt: item.prompt,
    options: rawOptions.map((text, optionIndex) => ({
      label: labels[optionIndex],
      text,
      rationale: optionIndex === correctIndex
        ? `This option is correct. ${item.explanation}`
        : distractorRationale(item, text, optionIndex, index),
    })),
    correctAnswer: labels[correctIndex],
    workedSolution: `${item.explanation} Therefore the correct answer is ${labels[correctIndex]}: ${item.correct}.`,
    difficulty: metadata[0],
    marks: 1,
    commandWord: metadata[1],
    assessmentObjective: metadata[2],
  };
}

function batchFor(release) {
  return {
    batchId: release.batchId,
    status: 'approved_for_beta',
    examTypeId: 'exam_bece',
    provenance: [source],
    review: {
      authoringMethod: 'original_curriculum_aligned',
      qualityAssurance: 'automated_beta',
      automatedChecksAt: generatedAt,
      semanticDuplicateReview: {
        method: 'human_cross_level_review_plus_normalized_and_token_overlap_gates',
        rewrittenPairs: semanticOverlapResolutions.map(([questionId, priorQuestionId]) => ({ questionId, priorQuestionId })),
        unresolvedAllowedOverlaps: [...reviewedSemanticOverlapAllowlist],
      },
    },
    release: {
      channel: 'beta', contentLabel, officialExamBoardContent: false, feedbackEnabled: true,
      rationaleAvailability: 'manifest_only_runtime_question_schema_does_not_store_option_rationales',
    },
    subjects: [{
      subjectId: release.subjectId,
      specificationCode: release.specificationCode,
      topics: release.topics.map(([code, title, objective]) => ({ code, title, objective })),
      questions: release.items.map((item, index) => mcq(release, index, item)),
    }],
  };
}

function semanticTerms(text) {
  return new Set(normalizeQuestionText(text).split(' ').filter((term) => term.length > 1 && !semanticStopWords.has(term)));
}

function tokenContainment(left, right) {
  const leftTerms = semanticTerms(left);
  const rightTerms = semanticTerms(right);
  if (Math.min(leftTerms.size, rightTerms.size) < 4) return 0;
  const overlap = [...leftTerms].filter((term) => rightTerms.has(term)).length;
  return overlap / Math.min(leftTerms.size, rightTerms.size);
}

async function assertNoCrossBankDuplicates(batches) {
  const newPrompts = new Map();
  const newQuestions = [];
  for (const batch of batches) for (const question of batch.subjects[0].questions) {
    const normalized = normalizeQuestionText(question.prompt);
    if (newPrompts.has(normalized)) throw new Error(`${question.id} duplicates ${newPrompts.get(normalized)}`);
    newPrompts.set(normalized, question.id);
    newQuestions.push(question);
  }
  const newIds = new Set(newQuestions.map(({ id }) => id));
  for (const [questionId] of semanticOverlapResolutions) if (!newIds.has(questionId)) throw new Error(`Missing reviewed semantic rewrite ${questionId}`);
  const targetNames = new Set(releases.map((release) => `${release.batchId}.json`));
  const batchDir = resolve(root, 'content/batches');
  for (const name of await readdir(batchDir)) {
    if (!name.endsWith('.json') || targetNames.has(name)) continue;
    const existing = JSON.parse(await readFile(resolve(batchDir, name), 'utf8'));
    for (const subject of existing.subjects ?? []) for (const question of subject.questions ?? []) {
      const collision = newPrompts.get(normalizeQuestionText(question.prompt));
      if (collision) throw new Error(`${collision} duplicates existing ${name}:${question.id}`);
      for (const candidate of newQuestions) {
        const pair = `${candidate.id}|${question.id}`;
        const score = tokenContainment(candidate.prompt, question.prompt);
        if (score >= 0.82 && !reviewedSemanticOverlapAllowlist.has(pair)) {
          throw new Error(`${candidate.id} has unresolved semantic-token overlap ${score.toFixed(2)} with ${name}:${question.id}`);
        }
      }
    }
  }
}

function storedQuestion(release, question) {
  return {
    questionId: question.id,
    topicId: topicIds.get(question.topicCode),
    subjectId: release.subjectId,
    examTypeId: 'exam_bece',
    questionText: question.prompt,
    questionType: 'multiple_choice',
    options: JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`)),
    correctAnswer: question.correctAnswer,
    explanation: question.workedSolution,
    difficulty: question.difficulty,
    points: 1,
    marks: 1,
    timeLimit: 90,
    commandWord: question.commandWord,
    assessmentObjective: question.assessmentObjective,
  };
}

function expectedTable(number, release, questions, { prefix = '_expected', temporary = false } = {}) {
  const table = `${prefix}_${number}`;
  const rows = questions.map((question) => storedQuestion(release, question));
  return {
    table,
    lines: [
      `${temporary ? 'CREATE TEMP TABLE' : 'CREATE TABLE IF NOT EXISTS'} ${table} (question_id TEXT PRIMARY KEY, topic_id TEXT NOT NULL, subject_id TEXT NOT NULL, exam_type_id TEXT NOT NULL, question_text TEXT NOT NULL, question_type TEXT NOT NULL, options TEXT NOT NULL, correct_answer TEXT NOT NULL, explanation TEXT NOT NULL, difficulty TEXT NOT NULL, points INTEGER NOT NULL, marks INTEGER NOT NULL, time_limit INTEGER NOT NULL, command_word TEXT NOT NULL, assessment_objective TEXT NOT NULL);`,
      `DELETE FROM ${table};`,
      `INSERT INTO ${table}(question_id,topic_id,subject_id,exam_type_id,question_text,question_type,options,correct_answer,explanation,difficulty,points,marks,time_limit,command_word,assessment_objective) VALUES`,
      `${rows.map((row) => `  (${sql(row.questionId)},${sql(row.topicId)},${sql(row.subjectId)},${sql(row.examTypeId)},${sql(row.questionText)},${sql(row.questionType)},${sql(row.options)},${sql(row.correctAnswer)},${sql(row.explanation)},${sql(row.difficulty)},${row.points},${row.marks},${row.timeLimit},${sql(row.commandWord)},${sql(row.assessmentObjective)})`).join(',\n')};`,
    ],
  };
}

function exactQuestionPredicate(q = 'q', e = 'e') {
  return [
    ['id','question_id'],['topic_id','topic_id'],['subject_id','subject_id'],['exam_type_id','exam_type_id'],
    ['question_text','question_text'],['question_type','question_type'],['options','options'],['correct_answer','correct_answer'],
    ['explanation','explanation'],['difficulty','difficulty'],['points','points'],['marks','marks'],['time_limit','time_limit'],
    ['command_word','command_word'],['assessment_objective','assessment_objective'],
  ].map(([actual, expected]) => `${q}.${actual} IS ${e}.${expected}`).join(' AND ');
}

function exactReleasePredicate(release, alias = 'r') {
  return `${alias}.batch_id IS ${sql(release.batchId)} AND ${alias}.quality_assurance IS 'automated_beta' AND ${alias}.release_channel IS 'beta' AND ${alias}.content_label IS ${sql(contentLabel)} AND ${alias}.source_url IS ${sql(source.url)} AND ${alias}.official_exam_board_content IS 0 AND ${alias}.feedback_enabled IS 1`;
}

function migrationSql(release, batch, part) {
  const number = release.migrationStart + part - 1;
  const migrationId = `${number}_${release.fileStem}_part_${part}`;
  const questions = batch.subjects[0].questions.slice((part - 1) * 10, part * 10);
  const { table, lines } = expectedTable(number, release, questions);
  const guard = `_migration_${number}_guard`;
  const exactQuestion = exactQuestionPredicate();
  const exactRelease = exactReleasePredicate(release);
  const exactLedger = `l.migration_id IS ${sql(migrationId)} AND l.entity_type IS 'question' AND l.field_name IS 'insert' AND l.old_value IS NULL AND l.new_value IS ${sql(release.batchId)}`;
  return [
    `-- ${number}: Original BrillaPrep BECE gap beta questions, ${release.subjectId}, part ${part}.`,
    '-- Curriculum-blueprint-aligned practice; not official WAEC or NaCCA examination material.',
    'PRAGMA foreign_keys = ON;',
    ...lines,
    `CREATE TABLE IF NOT EXISTS ${guard} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guard};`,
    `INSERT INTO ${guard}(valid) SELECT CASE WHEN`,
    `  (SELECT COUNT(*) FROM ${table}) = 10`,
    `  AND NOT EXISTS (SELECT 1 FROM ${table} e LEFT JOIN topics t ON t.id=e.topic_id LEFT JOIN subjects s ON s.id=t.subject_id WHERE t.id IS NULL OR t.subject_id IS NOT e.subject_id OR s.exam_type_id IS NOT e.exam_type_id)`,
    `  AND NOT EXISTS (SELECT 1 FROM questions q JOIN ${table} e ON e.question_id=q.id WHERE NOT (${exactQuestion}))`,
    `  AND NOT EXISTS (SELECT 1 FROM question_content_releases r JOIN ${table} e ON e.question_id=r.question_id WHERE NOT (${exactRelease}))`,
    `  AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN ${table} e ON e.question_id=l.entity_id WHERE l.migration_id=${sql(migrationId)} AND NOT (${exactLedger}))`,
    `  AND (((SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.question_id=q.id)=0 AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${table} e ON e.question_id=r.question_id)=0 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${table} e ON e.question_id=l.entity_id WHERE l.migration_id=${sql(migrationId)}) IN (0,10))`,
    `    OR ((SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.question_id=q.id WHERE ${exactQuestion})=10 AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${table} e ON e.question_id=r.question_id WHERE ${exactRelease})=10 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${table} e ON e.question_id=l.entity_id WHERE ${exactLedger})=10))`,
    'THEN 1 ELSE 0 END;',
    `INSERT OR IGNORE INTO questions (id,topic_id,subject_id,exam_type_id,question_text,question_type,options,correct_answer,explanation,difficulty,points,marks,time_limit,command_word,assessment_objective) SELECT question_id,topic_id,subject_id,exam_type_id,question_text,question_type,options,correct_answer,explanation,difficulty,points,marks,time_limit,command_word,assessment_objective FROM ${table};`,
    `INSERT OR IGNORE INTO question_content_releases (question_id,batch_id,quality_assurance,release_channel,content_label,source_url,official_exam_board_content,feedback_enabled) SELECT q.id,${sql(release.batchId)},'automated_beta','beta',${sql(contentLabel)},${sql(source.url)},0,1 FROM questions q JOIN ${table} e ON e.question_id=q.id;`,
    `INSERT OR IGNORE INTO question_bank_remediation_log (migration_id,entity_type,entity_id,field_name,old_value,new_value) SELECT ${sql(migrationId)},'question',q.id,'insert',NULL,${sql(release.batchId)} FROM questions q JOIN ${table} e ON e.question_id=q.id;`,
    `INSERT INTO ${guard}(valid) SELECT CASE WHEN`,
    `  (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.question_id=q.id WHERE ${exactQuestion})=10`,
    `  AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${table} e ON e.question_id=r.question_id WHERE ${exactRelease})=10`,
    `  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${table} e ON e.question_id=l.entity_id WHERE ${exactLedger})=10`,
    `  AND NOT EXISTS (SELECT 1 FROM questions q JOIN ${table} e ON e.question_id=q.id JOIN questions other ON other.id IS NOT q.id AND lower(trim(other.question_text))=lower(trim(q.question_text)))`,
    'THEN 1 ELSE 0 END;',
    `DROP TABLE ${table};`,
    `DROP TABLE ${guard};`,
  ].join('\n') + '\n';
}

function rollbackSql(release, batch, part) {
  const number = release.migrationStart + part - 1;
  const migrationId = `${number}_${release.fileStem}_part_${part}`;
  const questions = batch.subjects[0].questions.slice((part - 1) * 10, part * 10);
  const { table, lines } = expectedTable(number, release, questions);
  const guard = `_rollback_${number}_guard`;
  const exactQuestion = exactQuestionPredicate();
  const exactRelease = exactReleasePredicate(release);
  const exactLedger = `l.migration_id IS ${sql(migrationId)} AND l.entity_type IS 'question' AND l.field_name IS 'insert' AND l.old_value IS NULL AND l.new_value IS ${sql(release.batchId)}`;
  return [
    `-- Rollback ${number}: remove the ten inserted BECE beta questions; preserve remediation history.`,
    'PRAGMA foreign_keys = ON;',
    ...lines,
    `CREATE TABLE IF NOT EXISTS ${guard} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guard};`,
    `INSERT INTO ${guard}(valid) SELECT CASE WHEN`,
    `  NOT EXISTS (SELECT 1 FROM questions q JOIN ${table} e ON e.question_id=q.id WHERE NOT (${exactQuestion}))`,
    `  AND NOT EXISTS (SELECT 1 FROM question_content_releases r JOIN ${table} e ON e.question_id=r.question_id WHERE NOT (${exactRelease}))`,
    `  AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log l JOIN ${table} e ON e.question_id=l.entity_id WHERE l.migration_id=${sql(migrationId)} AND NOT (${exactLedger}))`,
    `  AND (((SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.question_id=q.id WHERE ${exactQuestion})=10 AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${table} e ON e.question_id=r.question_id WHERE ${exactRelease})=10 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${table} e ON e.question_id=l.entity_id WHERE ${exactLedger})=10)`,
    `    OR ((SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.question_id=q.id)=0 AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${table} e ON e.question_id=r.question_id)=0 AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${table} e ON e.question_id=l.entity_id WHERE l.migration_id=${sql(migrationId)}) IN (0,10)))`,
    'THEN 1 ELSE 0 END;',
    `DELETE FROM questions WHERE id IN (SELECT question_id FROM ${table});`,
    `INSERT INTO ${guard}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.question_id=q.id)=0 AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${table} e ON e.question_id=r.question_id)=0 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${table};`,
    `DROP TABLE ${guard};`,
  ].join('\n') + '\n';
}

const batches = releases.map(batchFor);
for (const [index, batch] of batches.entries()) {
  const validation = validateQuestionBatch(batch, { mode: 'production' });
  if (!validation.valid) throw new Error(`${releases[index].batchId} failed validation:\n${validation.errors.join('\n')}`);
  if (validation.metrics.questions !== 40) throw new Error(`${releases[index].batchId} must contain exactly 40 questions`);
}
const bdtCounts = Object.groupBy(batches[0].subjects[0].questions, (question) => question.topicCode);
for (const [topic, expected] of [['BDT-CONSTRUCTION',14],['BDT-ELECTRICAL',13],['BDT-ENTREPRENEURSHIP',13]]) if (bdtCounts[topic]?.length !== expected) throw new Error(`${topic} count drift`);
await assertNoCrossBankDuplicates(batches);

const outputs = [];
for (const [index, release] of releases.entries()) {
  const batch = batches[index];
  const batchPath = resolve(root, `content/batches/${release.batchId}.json`);
  await mkdir(dirname(batchPath), { recursive: true });
  await writeFile(batchPath, `${JSON.stringify(batch, null, 2)}\n`);
  outputs.push(batchPath);
  for (const part of [1,2,3,4]) {
    const number = release.migrationStart + part - 1;
    const name = `${number}_${release.fileStem}_part_${part}.sql`;
    const migrationPath = resolve(root, `database/migrations/${name}`);
    const rollbackPath = resolve(root, `database/rollbacks/${name}`);
    await writeFile(migrationPath, migrationSql(release, batch, part));
    await writeFile(rollbackPath, rollbackSql(release, batch, part));
    outputs.push(migrationPath, rollbackPath);
  }
}

function exactPreflightPart(release, batch, part) {
  const number = release.migrationStart + part - 1;
  const migrationId = `${number}_${release.fileStem}_part_${part}`;
  const questions = batch.subjects[0].questions.slice((part - 1) * 10, part * 10);
  const { table, lines } = expectedTable(number, release, questions, { prefix: '_bece_gap_preflight_expected', temporary: true });
  const exactQuestion = exactQuestionPredicate();
  const exactRelease = exactReleasePredicate(release);
  const exactLedger = `l.migration_id IS ${sql(migrationId)} AND l.entity_type IS 'question' AND l.field_name IS 'insert' AND l.old_value IS NULL AND l.new_value IS ${sql(release.batchId)}`;
  return [
    ...lines,
    'INSERT INTO _bece_gap_beta_preflight_guard(valid) SELECT CASE WHEN',
    `  (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.question_id=q.id WHERE ${exactQuestion})=10`,
    `  AND (SELECT COUNT(*) FROM question_content_releases r JOIN ${table} e ON e.question_id=r.question_id WHERE ${exactRelease})=10`,
    `  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${table} e ON e.question_id=l.entity_id WHERE ${exactLedger})=10`,
    `  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(migrationId)})=10`,
    `  AND NOT EXISTS (SELECT 1 FROM questions q JOIN ${table} e ON e.question_id=q.id JOIN questions other ON other.id IS NOT q.id AND lower(trim(other.question_text))=lower(trim(q.question_text)))`,
    'THEN 1 ELSE 0 END;',
    `DROP TABLE ${table};`,
  ];
}

const exactPartPreflight = releases.flatMap((release, index) => [1,2,3,4].flatMap((part) => exactPreflightPart(release, batches[index], part)));
const exactReleaseTotalsPreflight = releases.map((release) => {
  const migrationIds = [1,2,3,4].map((part) => sql(`${release.migrationStart + part - 1}_${release.fileStem}_part_${part}`)).join(',');
  return `INSERT INTO _bece_gap_beta_preflight_guard(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM question_content_releases WHERE batch_id=${sql(release.batchId)})=40 AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id IN (${migrationIds}))=40 THEN 1 ELSE 0 END;`;
});
const preflight = [
  '-- Fail-closed exact-row checks for the BECE gap beta release 237-248.',
  'PRAGMA foreign_keys = ON;',
  'CREATE TEMP TABLE _bece_gap_beta_preflight_guard (valid INTEGER NOT NULL CHECK (valid = 1));',
  ...exactPartPreflight,
  ...exactReleaseTotalsPreflight,
  'INSERT INTO _bece_gap_beta_preflight_guard(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM pragma_foreign_key_check) THEN 1 ELSE 0 END;',
  'DROP TABLE _bece_gap_beta_preflight_guard;',
].join('\n') + '\n';
const preflightPath = resolve(root, 'database/preflight/237_248_bece_gap_beta.sql');
await writeFile(preflightPath, preflight);
outputs.push(preflightPath);
console.log(JSON.stringify({ batches: batches.map((batch) => ({ batchId: batch.batchId, questions: batch.subjects[0].questions.length })), outputs }, null, 2));
