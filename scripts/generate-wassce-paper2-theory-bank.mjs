import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';
import { theoryPapers } from './wassce-paper2-theory-data.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-03T00:00:00Z';
const outputNames = [...new Set(theoryPapers.map((paper) => paper.batchId + '.json'))];
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council)|(?:waec|west african examinations council)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/gi;

function assertNoFalseOfficialClaim(value, field) {
  const withoutDisclaimer = value.replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) throw new Error(field + ' contains a false official-exam-board claim');
}

function assertNonOfficialLabel(value, field) {
  if (!nonOfficialDisclaimerPattern.test(value)) throw new Error(field + ' must explicitly state that the content is not official WAEC material');
  assertNoFalseOfficialClaim(value, field);
}

const paperContentLabel = (paper) => 'Original BrillaPrep curriculum-aligned WASSCE ' + paper.subjectName + ' Paper 2 theory practice; not official WAEC examination material. Use the enabled feedback channel to report corrections.';

function batchContentLabel(papers) {
  const names = papers.map((paper) => paper.subjectName).join(' and ');
  return 'Original BrillaPrep curriculum-aligned WASSCE ' + names + ' Paper 2 theory practice; not official WAEC examination material. Use the enabled feedback channel to report corrections.';
}

function workedSolution(question) {
  const text = question.type === 'essay'
    ? question.modelAnswer
    : question.parts.map((part) => '(' + part.label + ') ' + part.correctAnswer).join(' ');
  if (typeof text !== 'string' || text.trim().length < 80) throw new Error(question.id + ' needs a worked solution of at least 80 characters');
  return text;
}

function correctAnswer(question) {
  if (question.type === 'essay') return question.modelAnswer;
  return question.parts.map((part) => '(' + part.label + ') ' + part.correctAnswer).join(' ');
}

function batchQuestion(paper, question) {
  return {
    id: question.id,
    original: true,
    topicCode: question.topicCode,
    type: question.type,
    prompt: question.prompt,
    marks: question.marks,
    section: question.section,
    questionNumber: question.questionNumber,
    isCompulsory: question.isCompulsory,
    commandWord: question.commandWord,
    contentLabel: paper.contentLabel,
    workedSolution: workedSolution(question),
    markingScheme: question.markingScheme ?? null,
    modelAnswer: question.modelAnswer ?? null,
    requiredPoints: question.requiredPoints ?? null,
    optionalPoints: question.optionalPoints ?? null,
    wordLimit: question.wordLimit ?? null,
    parts: question.parts ?? null,
  };
}

const batches = new Map();
for (const paper of theoryPapers) {
  if (!batches.has(paper.batchId)) batches.set(paper.batchId, []);
  batches.get(paper.batchId).push(paper);
}

for (const paper of theoryPapers) {
  paper.contentLabel = paperContentLabel(paper);
  assertNonOfficialLabel(paper.contentLabel, paper.key + '.contentLabel');
  const topicCodes = new Set(paper.topics.map(({ code }) => code));
  const covered = new Set(paper.questions.map((question) => question.topicCode));
  for (const code of topicCodes) if (!covered.has(code)) throw new Error(paper.key + ' topic ' + code + ' is not covered by any question');
  for (const question of paper.questions) {
    if (!topicCodes.has(question.topicCode)) throw new Error(question.id + ' uses undeclared topic ' + question.topicCode);
    assertNoFalseOfficialClaim(question.prompt, question.id + '.prompt');
    if (question.type === 'essay') {
      const sum = question.markingScheme.points.reduce((total, point) => total + point.marks, 0);
      if (sum !== question.marks) throw new Error(question.id + ' scheme points sum to ' + sum + ', not ' + question.marks);
      if (typeof question.modelAnswer !== 'string' || question.modelAnswer.length < 200) throw new Error(question.id + ' needs a model answer of at least 200 characters');
    } else {
      const sum = question.parts.reduce((total, part) => total + part.marks, 0);
      if (sum !== question.marks) throw new Error(question.id + ' part marks sum to ' + sum + ', not ' + question.marks);
      if (question.parts.length < 2) throw new Error(question.id + ' needs at least two parts');
    }
    workedSolution(question); // length guard
  }
}

async function collectExistingPrompts() {
  const existing = new Map();
  const seedSql = await readFile(resolve(sourceRoot, 'database/seed.sql'), 'utf8');
  for (const match of seedSql.matchAll(/'(?:''|[^'])*'/g)) {
    const literal = match[0].slice(1, -1).replaceAll("''", "'");
    const normalized = normalizeQuestionText(literal);
    if (normalized.length >= 18) existing.set(normalized, 'database/seed.sql');
  }
  for (const name of await readdir(resolve(sourceRoot, 'content/batches'))) {
    if (!name.endsWith('.json') || outputNames.includes(name)) continue;
    const candidate = JSON.parse(await readFile(resolve(sourceRoot, 'content/batches', name), 'utf8'));
    for (const subject of candidate.subjects || []) for (const question of subject.questions || []) {
      const normalized = normalizeQuestionText(question.prompt);
      if (normalized) existing.set(normalized, 'content/batches/' + name);
    }
  }
  return existing;
}

const existingPrompts = await collectExistingPrompts();
const duplicatePrompts = theoryPapers
  .flatMap((paper) => paper.questions)
  .map((question) => ({ question, source: existingPrompts.get(normalizeQuestionText(question.prompt)) }))
  .filter(({ source }) => source);
if (duplicatePrompts.length) throw new Error('Generated prompts duplicate existing content:\n' + duplicatePrompts.map(({ question, source }) => question.id + ': ' + source).join('\n'));

const sql = (value) => value == null ? 'NULL' : "'" + String(value).replaceAll("'", "''") + "'";

const questionFields = [
  'topic_id', 'subject_id', 'exam_type_id', 'paper_type_id', 'past_paper_id', 'question_text',
  'question_type', 'round_type', 'options', 'correct_answer', 'explanation', 'difficulty', 'points',
  'marks', 'time_limit', 'question_number', 'section', 'is_compulsory', 'image_url', 'syllabus_topic_id',
  'command_word', 'assessment_objective', 'source_paper_code', 'source_question_number', 'exam_board_id',
];

function questionValues(paper, question) {
  return {
    topic_id: topicId(paper, question.topicCode), subject_id: paper.subjectId, exam_type_id: 'exam_wassce',
    paper_type_id: 'paper_wassce_2', past_paper_id: paper.paperId, question_text: question.prompt,
    question_type: question.type, round_type: null, options: null,
    correct_answer: correctAnswer(question), explanation: workedSolution(question), difficulty: 'medium',
    points: question.marks, marks: question.marks, time_limit: null,
    question_number: question.questionNumber, section: question.section,
    is_compulsory: question.isCompulsory ? 1 : 0, image_url: null, syllabus_topic_id: null,
    command_word: question.commandWord, assessment_objective: 'AO2',
    source_paper_code: null, source_question_number: null, exam_board_id: null,
  };
}

function paperValues(paper) {
  return {
    id: paper.paperId, exam_type_id: 'exam_wassce', subject_id: paper.subjectId,
    paper_type_id: 'paper_wassce_2', year: paper.year, month: paper.month, series: 'WASSCE',
    title: paper.paperTitle, description: paper.paperDescription,
    total_questions: paper.questions.length,
    total_marks: paper.questions.reduce((total, question) => total + question.marks, 0),
    time_allowed: paper.timeAllowed, instructions: paper.instructions,
    is_complete: 1, is_premium: 0, source_url: null,
  };
}

const fieldMatch = (alias, values) => Object.entries(values).map(([field, value]) => alias + '.' + field + ' IS ' + sql(value)).join(' AND ');
const releaseMatch = (alias, paper) => [
  alias + '.batch_id IS ' + sql(paper.batchId), alias + ".quality_assurance IS 'automated_beta'",
  alias + ".release_channel IS 'beta'", alias + '.content_label IS ' + sql(paper.contentLabel),
  alias + '.source_url IS ' + sql(paper.sourceUrl), alias + '.official_exam_board_content IS 0',
  alias + '.feedback_enabled IS 1',
].join(' AND ');

const essayQuestionId = (question) => 'eq_' + question.id;
const partId = (question, part) => 'sqp_' + question.id + '_' + part.label;
// Deterministic per-paper topic ids, same precedent as the MCQ bank
// generators (topic_was_*). The paper endpoint INNER JOINs topics, so a NULL
// topic_id would make the question invisible to students.
const topicId = (paper, code) => 'topic_wassce_p2_' + paper.key + '_' + code.split('-').at(-1).toLowerCase();
const topicSlug = (paper, code) => 'wassce-p2-' + paper.key + '-' + code.split('-').at(-1).toLowerCase();

function essayValues(question) {
  return {
    question_id: question.id,
    word_limit_min: question.wordLimit?.min ?? null,
    word_limit_max: question.wordLimit?.max ?? null,
    requires_introduction: 1, requires_conclusion: 1,
    marking_scheme: JSON.stringify(question.markingScheme),
    model_answer: question.modelAnswer,
    marking_rubric: null,
    required_points: question.requiredPoints ? JSON.stringify(question.requiredPoints) : null,
    optional_points: question.optionalPoints ? JSON.stringify(question.optionalPoints) : null,
    ai_grading_enabled: 1,
  };
}

function emitMigration(paper) {
  const guard = '_migration_' + paper.migration + '_guard';
  const ids = paper.questions.map((question) => question.id);
  const essayQuestions = paper.questions.filter((question) => question.type === 'essay');
  const structuredQuestions = paper.questions.filter((question) => question.type === 'structured');
  const lines = [
    '-- ' + paper.migration + ': Original BrillaPrep WASSCE ' + paper.subjectName + ' Paper 2 theory practice paper (' + paper.year + ' format).',
    '-- Curriculum-aligned practice content; not official WAEC examination material.',
    'PRAGMA foreign_keys = ON;',
    'CREATE TABLE IF NOT EXISTS ' + guard + ' (valid INTEGER NOT NULL CHECK (valid = 1));',
    'DELETE FROM ' + guard + ';',
  ];

  const paperMatch = fieldMatch('p', paperValues(paper));
  lines.push('INSERT INTO ' + guard + '(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM past_papers p WHERE p.id = ' + sql(paper.paperId) + ' AND NOT (' + paperMatch + ')) THEN 1 ELSE 0 END;');

  for (const question of paper.questions) {
    const checks = [
      'NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = ' + sql(question.id) + ' AND NOT (' + fieldMatch('q', questionValues(paper, question)) + '))',
      'NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = ' + sql(question.id) + ' AND NOT (' + releaseMatch('r', paper) + '))',
    ];
    if (question.type === 'essay') {
      checks.push('NOT EXISTS (SELECT 1 FROM essay_questions e WHERE e.question_id = ' + sql(question.id) + ' AND NOT (' + fieldMatch('e', essayValues(question)) + '))');
    } else {
      for (const part of question.parts) {
        checks.push('NOT EXISTS (SELECT 1 FROM structured_question_parts sp WHERE sp.id = ' + sql(partId(question, part)) + ' AND NOT (sp.question_id IS ' + sql(question.id) + ' AND sp.part_label IS ' + sql(part.label) + ' AND sp.part_text IS ' + sql(part.text) + ' AND sp.marks IS ' + part.marks + ' AND sp.correct_answer IS ' + sql(part.correctAnswer) + '))');
      }
    }
    lines.push('INSERT INTO ' + guard + '(valid) SELECT CASE WHEN ' + checks.join(' AND ') + ' THEN 1 ELSE 0 END;');
  }

  const pv = paperValues(paper);
  lines.push('INSERT OR IGNORE INTO past_papers (id, ' + Object.keys(pv).filter((key) => key !== 'id').join(', ') + ') VALUES (' + sql(pv.id) + ', ' + Object.keys(pv).filter((key) => key !== 'id').map((key) => sql(pv[key])).join(', ') + ');');

  for (const [index, topic] of paper.topics.entries()) {
    lines.push('INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order) VALUES (' + sql(topicId(paper, topic.code)) + ', ' + sql(paper.subjectId) + ', ' + sql(topic.title) + ', ' + sql(topicSlug(paper, topic.code)) + ', ' + sql(topic.objective) + ', ' + (index + 1) + ');');
  }

  for (const question of paper.questions) {
    const values = questionValues(paper, question);
    lines.push('INSERT OR IGNORE INTO questions (id, ' + questionFields.join(', ') + ') VALUES (' + sql(question.id) + ', ' + questionFields.map((field) => sql(values[field])).join(', ') + ');');
  }

  for (const question of essayQuestions) {
    const values = essayValues(question);
    lines.push('INSERT OR IGNORE INTO essay_questions (id, ' + Object.keys(values).join(', ') + ') VALUES (' + sql(essayQuestionId(question)) + ', ' + Object.keys(values).map((key) => sql(values[key])).join(', ') + ');');
  }

  for (const question of structuredQuestions) {
    const answerType = paper.key === 'math' ? 'calculation' : 'text';
    for (const [index, part] of question.parts.entries()) {
      lines.push('INSERT OR IGNORE INTO structured_question_parts (id, question_id, part_label, part_text, marks, correct_answer, explanation, answer_type, display_order) VALUES (' + sql(partId(question, part)) + ', ' + sql(question.id) + ', ' + sql(part.label) + ', ' + sql(part.text) + ', ' + part.marks + ', ' + sql(part.correctAnswer) + ', NULL, ' + sql(answerType) + ', ' + (index + 1) + ');');
    }
  }

  lines.push(
    'INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, ' + sql(paper.batchId) + ", 'automated_beta', 'beta', " + sql(paper.contentLabel) + ', ' + sql(paper.sourceUrl) + ', 0, 1 FROM questions WHERE id IN (' + ids.map(sql).join(', ') + ');',
    'DELETE FROM ' + guard + ';',
  );

  const postChecks = [
    'EXISTS (SELECT 1 FROM past_papers p WHERE p.id = ' + sql(paper.paperId) + ' AND ' + paperMatch + ')',
    '(SELECT COUNT(*) FROM questions WHERE id IN (' + ids.map(sql).join(', ') + ')) = ' + ids.length,
    '(SELECT COUNT(*) FROM question_content_releases r WHERE r.question_id IN (' + ids.map(sql).join(', ') + ') AND ' + releaseMatch('r', paper) + ') = ' + ids.length,
    '(SELECT COUNT(*) FROM topics WHERE id IN (' + paper.topics.map((topic) => sql(topicId(paper, topic.code))).join(', ') + ')) = ' + paper.topics.length,
    '(SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id WHERE q.id IN (' + ids.map(sql).join(', ') + ')) = ' + ids.length,
  ];
  if (essayQuestions.length) {
    postChecks.push('(SELECT COUNT(*) FROM essay_questions WHERE question_id IN (' + essayQuestions.map((question) => sql(question.id)).join(', ') + ')) = ' + essayQuestions.length);
  }
  if (structuredQuestions.length) {
    const partCount = structuredQuestions.reduce((total, question) => total + question.parts.length, 0);
    postChecks.push('(SELECT COUNT(*) FROM structured_question_parts WHERE question_id IN (' + structuredQuestions.map((question) => sql(question.id)).join(', ') + ')) = ' + partCount);
  }
  lines.push(
    'INSERT INTO ' + guard + '(valid) SELECT CASE WHEN ' + postChecks.join(' AND ') + ' THEN 1 ELSE 0 END;',
    'DROP TABLE ' + guard + ';',
  );
  return lines.join('\n') + '\n';
}

const migrationPaths = [];
const validations = {};
for (const [batchId, papers] of batches) {
  const batch = {
    batchId,
    status: 'approved_for_production',
    examTypeId: 'exam_wassce',
    provenance: papers.flatMap((paper) => paper.provenance.map((source) => ({ ...source, use: 'curriculum_blueprint_only' }))),
    review: { authoringMethod: 'original_curriculum_aligned', qualityAssurance: 'automated_beta', automatedChecksAt: generatedAt },
    release: {
      channel: 'beta',
      contentLabel: batchContentLabel(papers),
      officialExamBoardContent: false,
      feedbackEnabled: true,
    },
    subjects: papers.map((paper) => ({
      subjectId: paper.subjectId,
      specificationCode: paper.specificationCode,
      release: {
        contentLabel: paper.contentLabel,
        sourceUrl: paper.sourceUrl,
        officialExamBoardContent: false,
        feedbackEnabled: true,
      },
      topics: paper.topics.map(({ code, title, objective }) => ({ code, title, objective })),
      questions: paper.questions.map((question) => batchQuestion(paper, question)),
    })),
  };

  assertNonOfficialLabel(batch.release.contentLabel, batchId + '.release.contentLabel');
  const validation = validateQuestionBatch(batch, { mode: 'production' });
  if (!validation.valid) throw new Error('Generated batch ' + batchId + ' failed validation:\n' + validation.errors.join('\n'));
  validations[batchId] = validation;

  const outBatch = resolve(outputRoot, 'content/batches', batchId + '.json');
  await mkdir(dirname(outBatch), { recursive: true });
  await writeFile(outBatch, JSON.stringify(batch, null, 2) + '\n');

  for (const paper of papers) {
    const output = resolve(outputRoot, 'database/migrations/' + paper.migration + '_wassce_paper2_theory_' + paper.migrationSlug + '.sql');
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, emitMigration(paper));
    migrationPaths.push(output);
  }
}

console.log(JSON.stringify({ validation: validations, migrations: migrationPaths }, null, 2));
