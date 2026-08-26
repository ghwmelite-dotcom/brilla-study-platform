import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';
import { visualArtsSubjects as subjects } from './wassce-visual-arts-beta-data.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-08-26T00:00:00Z';
const batchId = 'wassce-visual-arts-beta-004';
const outputName = 'wassce-visual-arts-beta-004.json';
const labels = ['A', 'B', 'C', 'D'];
const difficulties = ['easy', 'medium', 'hard'];
const assessmentObjectives = ['AO1', 'AO2', 'AO3'];
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council)|(?:waec|west african examinations council)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/gi;
const canonicalSharedSourceTitles = new Map([
  [
    'https://waecgh.org/wp-content/uploads/2025/05/CHIEF-EXAMINERS-REPORTS.-WASSCE-SC-2023.pdf',
    'WASSCE 2023 Chief Examiners Reports',
  ],
  [
    'https://nacca.gov.gh/secondary-education-curriculum/',
    'Secondary Education Curriculum Index',
  ],
]);

function assertNoFalseOfficialClaim(value, field) {
  const withoutDisclaimer = value.replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) throw new Error(field + ' contains a false official-exam-board claim');
}

function assertNoFalseOfficialClaims(value, field) {
  if (typeof value === 'string') {
    assertNoFalseOfficialClaim(value, field);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoFalseOfficialClaims(entry, field + '[' + index + ']'));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) assertNoFalseOfficialClaims(entry, field + '.' + key);
  }
}

function assertNonOfficialLabel(value, field) {
  if (!nonOfficialDisclaimerPattern.test(value)) throw new Error(field + ' must explicitly state that the content is not official WAEC material');
  assertNoFalseOfficialClaim(value, field);
}

function seededShuffle(values, seedText) {
  let seed = 2166136261;
  for (const character of seedText) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function dedupeProvenance(sources) {
  const byUrl = new Map();
  for (const source of sources) {
    const canonicalTitle = canonicalSharedSourceTitles.get(source.url);
    const existing = byUrl.get(source.url);
    if (existing && existing.title !== source.title && !canonicalTitle) {
      throw new Error('Shared provenance URL has conflicting titles without a canonical title: ' + source.url);
    }
    byUrl.set(source.url, {
      ...(existing || source),
      title: canonicalTitle || source.title,
      use: 'curriculum_blueprint_only',
    });
  }
  return [...byUrl.values()];
}

function mcq(subjectKey, index, source) {
  const candidates = [
    { text: source.correct, rationale: 'This is the supported answer. ' + source.explanation, correct: true },
    ...source.wrong.map((text, wrongIndex) => ({
      text,
      rationale: source.wrongRationales[wrongIndex],
      correct: false,
    })),
  ];
  const shuffled = seededShuffle(candidates, subjectKey + ':' + index + ':' + source.prompt);
  const correctIndex = shuffled.findIndex((option) => option.correct);
  const options = shuffled.map(({ text, rationale }, optionIndex) => ({ label: labels[optionIndex], text, rationale }));
  return {
    id: 'q_was_' + subjectKey + '_b004_' + String(index + 1).padStart(3, '0'),
    original: true,
    topicCode: source.topicCode,
    type: 'multiple_choice',
    prompt: source.prompt,
    options,
    correctAnswer: labels[correctIndex],
    workedSolution: source.explanation + ' Therefore the correct answer is ' + labels[correctIndex] + ': ' + source.correct + '.',
    difficulty: difficulties[index % difficulties.length],
    marks: index % 5 === 4 ? 3 : index % 2 === 0 ? 1 : 2,
    commandWord: /why|how/i.test(source.prompt) ? 'Explain' : /what|which|who|when/i.test(source.prompt) ? 'Identify' : 'Apply',
    assessmentObjective: assessmentObjectives[index % assessmentObjectives.length],
  };
}

for (const subject of subjects) {
  if (subject.topics.length !== 8) throw new Error(subject.key + ' must declare exactly eight topics');
  if (subject.facts.length !== 40) throw new Error(subject.key + ' must declare exactly forty questions');
  const topicCodes = new Set(subject.topics.map(([code]) => code));
  const counts = new Map();
  for (const fact of subject.facts) {
    if (!topicCodes.has(fact.topicCode)) throw new Error(subject.key + ' contains an undeclared topic code ' + fact.topicCode);
    if (fact.wrong.length !== 3 || new Set([fact.correct, ...fact.wrong].map((value) => value.toLowerCase())).size !== 4) {
      throw new Error(subject.key + ' contains a non-distinct option set for: ' + fact.prompt);
    }
    if (!Array.isArray(fact.wrongRationales) || fact.wrongRationales.length !== 3 || fact.wrongRationales.some((value) => value.length < 60)) {
      throw new Error(subject.key + ' must provide three option-specific wrong rationales of at least sixty characters for: ' + fact.prompt);
    }
    counts.set(fact.topicCode, (counts.get(fact.topicCode) || 0) + 1);
  }
  if ([...counts.values()].some((count) => count !== 5)) throw new Error(subject.key + ' must contain five questions per topic');
}

const batch = {
  batchId,
  status: 'approved_for_production',
  examTypeId: 'exam_wassce',
  provenance: dedupeProvenance(subjects.flatMap((subject) => subject.sources)),
  review: { authoringMethod: 'original_curriculum_aligned', qualityAssurance: 'automated_beta', automatedChecksAt: generatedAt },
  release: {
    channel: 'beta',
    contentLabel: 'Original BrillaPrep curriculum-aligned Basketry, Leatherwork and Sculpture practice; not official WAEC examination material. Use the enabled feedback channel to report corrections.',
    officialExamBoardContent: false,
    feedbackEnabled: true,
  },
  subjects: subjects.map((subject) => ({
    subjectId: subject.subjectId,
    specificationCode: subject.specificationCode,
    release: {
      contentLabel: subject.contentLabel,
      sourceUrl: subject.releaseSourceUrl,
      officialExamBoardContent: false,
      feedbackEnabled: true,
    },
    topics: subject.topics.map(([code, title, objective]) => ({ code, title, objective })),
    questions: subject.facts.map((source, index) => mcq(subject.key, index, source)),
  })),
};

assertNonOfficialLabel(batch.release.contentLabel, 'release.contentLabel');
for (const subject of subjects) assertNonOfficialLabel(subject.contentLabel, subject.key + '.contentLabel');
for (const subject of subjects) {
  assertNoFalseOfficialClaims(subject.topics, subject.key + '.topics');
  assertNoFalseOfficialClaims(subject.facts, subject.key + '.facts');
}
for (const subject of batch.subjects) {
  assertNonOfficialLabel(subject.release.contentLabel, subject.subjectId + '.release.contentLabel');
  assertNoFalseOfficialClaims(subject.topics, subject.subjectId + '.topics');
  for (const question of subject.questions) assertNoFalseOfficialClaims(question, question.id);
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
    if (!name.endsWith('.json') || name === outputName) continue;
    const candidate = JSON.parse(await readFile(resolve(sourceRoot, 'content/batches', name), 'utf8'));
    for (const subject of candidate.subjects || []) for (const question of subject.questions || []) {
      const normalized = normalizeQuestionText(question.prompt);
      if (normalized) existing.set(normalized, 'content/batches/' + name);
    }
  }
  return existing;
}

const existingPrompts = await collectExistingPrompts();
const duplicatePrompts = batch.subjects.flatMap((subject) => subject.questions)
  .map((question) => ({ question, source: existingPrompts.get(normalizeQuestionText(question.prompt)) }))
  .filter(({ source }) => source);
if (duplicatePrompts.length) throw new Error('Generated prompts duplicate existing content:\n' + duplicatePrompts.map(({ question, source }) => question.id + ': ' + source).join('\n'));

const validation = validateQuestionBatch(batch, { mode: 'production' });
if (!validation.valid) throw new Error('Generated batch failed validation:\n' + validation.errors.join('\n'));

const sql = (value) => value == null ? 'NULL' : "'" + String(value).replaceAll("'", "''") + "'";
const topicId = (subject, code) => 'topic_was_' + subject.key + '_b004_' + code.split('-').at(-1).toLowerCase();
const syllabusTopicId = (subject, code) => 'st_was_' + subject.key + '_b004_' + code.split('-').at(-1).toLowerCase();
const canonicalQuestionFields = [
  'topic_id', 'subject_id', 'exam_type_id', 'paper_type_id', 'past_paper_id', 'question_text',
  'question_type', 'round_type', 'options', 'correct_answer', 'explanation', 'difficulty', 'points',
  'marks', 'time_limit', 'question_number', 'section', 'is_compulsory', 'image_url', 'syllabus_topic_id',
  'command_word', 'assessment_objective', 'source_paper_code', 'source_question_number', 'exam_board_id',
];

function questionValues(subject, question) {
  return {
    topic_id: topicId(subject, question.topicCode), subject_id: subject.subjectId, exam_type_id: 'exam_wassce',
    paper_type_id: null, past_paper_id: null, question_text: question.prompt, question_type: 'multiple_choice',
    round_type: null, options: JSON.stringify(question.options.map(({ label, text }) => label + '. ' + text)),
    correct_answer: question.correctAnswer, explanation: question.workedSolution, difficulty: question.difficulty,
    points: question.marks, marks: question.marks, time_limit: 90, question_number: null, section: null,
    is_compulsory: 1, image_url: null, syllabus_topic_id: syllabusTopicId(subject, question.topicCode),
    command_word: question.commandWord, assessment_objective: question.assessmentObjective,
    source_paper_code: null, source_question_number: null, exam_board_id: 'board_waec',
  };
}

const canonicalMatch = (alias, values) => canonicalQuestionFields.map((field) => alias + '.' + field + ' IS ' + sql(values[field])).join(' AND ');
const releaseMatch = (alias, subject) => [
  alias + '.batch_id IS ' + sql(batchId), alias + ".quality_assurance IS 'automated_beta'",
  alias + ".release_channel IS 'beta'", alias + '.content_label IS ' + sql(subject.contentLabel),
  alias + '.source_url IS ' + sql(subject.releaseSourceUrl), alias + '.official_exam_board_content IS 0',
  alias + '.feedback_enabled IS 1',
].join(' AND ');

const outBatch = resolve(outputRoot, 'content/batches', outputName);
await mkdir(dirname(outBatch), { recursive: true });
await writeFile(outBatch, JSON.stringify(batch, null, 2) + '\n');
const migrationPaths = [];
const foundationPath = resolve(outputRoot, 'database/migrations/189_wassce_visual_arts_beta_foundation.sql');
const foundation = [
  '-- 189: BrillaPrep transitional WASSCE Basketry, Leatherwork and Sculpture beta blueprint specifications.',
  '-- Internal evidence blueprints; not official WAEC specifications or examination material.',
  'PRAGMA foreign_keys = ON;',
  "INSERT OR IGNORE INTO exam_boards (id, name, code, full_name, region, website_url, is_active, display_order) VALUES ('board_waec', 'WAEC', 'WAEC', 'West African Examinations Council', 'West Africa', 'https://waecgh.org/', 1, 1);",
];
for (const subject of subjects) {
  foundation.push('INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, syllabus_pdf_url, total_papers, assessment_info, is_active, display_order) VALUES (' + sql(subject.specId) + ", 'board_waec', " + sql(subject.subjectId) + ", 'exam_wassce', " + sql(subject.specificationCode) + ', ' + sql(subject.syllabusName) + ', NULL, NULL, NULL, 0, ' + sql(subject.assessmentInfo) + ', 1, 1);');
}
foundation.push('CREATE TABLE IF NOT EXISTS _migration_189_guard (valid INTEGER NOT NULL CHECK (valid = 1));', 'DELETE FROM _migration_189_guard;');
for (const subject of subjects) {
  foundation.push('INSERT INTO _migration_189_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM subject_specifications WHERE id = ' + sql(subject.specId) + " AND exam_board_id IS 'board_waec' AND subject_id IS " + sql(subject.subjectId) + " AND exam_type_id IS 'exam_wassce' AND syllabus_code IS " + sql(subject.specificationCode) + ' AND syllabus_name IS ' + sql(subject.syllabusName) + ' AND specification_year IS NULL AND valid_from IS NULL AND syllabus_pdf_url IS NULL AND total_papers IS 0 AND assessment_info IS ' + sql(subject.assessmentInfo) + ' AND is_active IS 1) THEN 1 ELSE 0 END;');
}
foundation.push('DROP TABLE _migration_189_guard;');
await mkdir(dirname(foundationPath), { recursive: true });
await writeFile(foundationPath, foundation.join('\n') + '\n');
migrationPaths.push(foundationPath);

let migrationNumber = 190;
for (const subject of subjects) {
  const lines = ['-- ' + migrationNumber + ': BrillaPrep ' + subject.syllabusName + ' topic blueprint.', '-- Internal evidence blueprint; not an official WAEC specification.', 'PRAGMA foreign_keys = ON;'];
  for (const [index, [code, title, objective]] of subject.topics.entries()) {
    lines.push('INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order) VALUES (' + sql(topicId(subject, code)) + ', ' + sql(subject.subjectId) + ', ' + sql(title) + ', ' + sql(subject.key + '-b004-' + code.split('-').at(-1)) + ', ' + sql(objective) + ', ' + (index + 1) + ');');
    lines.push('INSERT OR IGNORE INTO syllabus_topics (id, specification_id, topic_code, title, description, assessment_objectives, display_order) VALUES (' + sql(syllabusTopicId(subject, code)) + ', ' + sql(subject.specId) + ', ' + sql(code) + ', ' + sql(title) + ', ' + sql(objective) + ', ' + sql(JSON.stringify(assessmentObjectives)) + ', ' + (index + 1) + ');');
  }
  lines.push('CREATE TABLE IF NOT EXISTS _migration_' + migrationNumber + '_guard (valid INTEGER NOT NULL CHECK (valid = 1));', 'DELETE FROM _migration_' + migrationNumber + '_guard;');
  for (const [index, [code, title, objective]] of subject.topics.entries()) {
    lines.push('INSERT INTO _migration_' + migrationNumber + '_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM topics WHERE id = ' + sql(topicId(subject, code)) + ' AND subject_id IS ' + sql(subject.subjectId) + ' AND name IS ' + sql(title) + ' AND slug IS ' + sql(subject.key + '-b004-' + code.split('-').at(-1)) + ' AND description IS ' + sql(objective) + ' AND display_order IS ' + (index + 1) + ') AND EXISTS (SELECT 1 FROM syllabus_topics WHERE id = ' + sql(syllabusTopicId(subject, code)) + ' AND specification_id IS ' + sql(subject.specId) + ' AND topic_code IS ' + sql(code) + ' AND title IS ' + sql(title) + ' AND description IS ' + sql(objective) + ' AND assessment_objectives IS ' + sql(JSON.stringify(assessmentObjectives)) + ' AND display_order IS ' + (index + 1) + ') THEN 1 ELSE 0 END;');
  }
  lines.push('DROP TABLE _migration_' + migrationNumber + '_guard;');
  const output = resolve(outputRoot, 'database/migrations/' + migrationNumber + '_' + subject.key + '_beta_foundation.sql');
  await writeFile(output, lines.join('\n') + '\n');
  migrationPaths.push(output);
  migrationNumber += 1;
}

for (const subject of subjects) {
  const questions = batch.subjects.find((entry) => entry.subjectId === subject.subjectId).questions;
  for (let part = 1; part <= 10; part += 1) {
    const partQuestions = questions.slice((part - 1) * 4, part * 4);
    const ids = partQuestions.map((question) => question.id);
    const guardTable = '_migration_' + migrationNumber + '_guard';
    const lines = [
      '-- ' + migrationNumber + ': Original BrillaPrep WASSCE ' + subject.syllabusName + ' questions, part ' + part + '.',
      '-- Curriculum-aligned practice content; not official WAEC examination material.',
      'PRAGMA foreign_keys = ON;',
      'CREATE TABLE IF NOT EXISTS ' + guardTable + ' (valid INTEGER NOT NULL CHECK (valid = 1));',
      'DELETE FROM ' + guardTable + ';',
    ];
    for (const question of partQuestions) {
      const values = questionValues(subject, question);
      lines.push('INSERT INTO ' + guardTable + '(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = ' + sql(question.id) + ' AND NOT (' + canonicalMatch('q', values) + ')) AND NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = ' + sql(question.id) + ' AND NOT (' + releaseMatch('r', subject) + ')) THEN 1 ELSE 0 END;');
    }
    for (const question of partQuestions) {
      const values = questionValues(subject, question);
      lines.push('INSERT OR IGNORE INTO questions (id, ' + canonicalQuestionFields.join(', ') + ') VALUES (' + sql(question.id) + ', ' + canonicalQuestionFields.map((field) => sql(values[field])).join(', ') + ');');
    }
    lines.push(
      'INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, ' + sql(batchId) + ", 'automated_beta', 'beta', " + sql(subject.contentLabel) + ', ' + sql(subject.releaseSourceUrl) + ', 0, 1 FROM questions WHERE id IN (' + ids.map(sql).join(', ') + ');',
      'DELETE FROM ' + guardTable + ';',
      'INSERT INTO ' + guardTable + '(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id IN (' + ids.map(sql).join(', ') + ')) = ' + partQuestions.length + ' AND (SELECT COUNT(*) FROM question_content_releases r WHERE r.question_id IN (' + ids.map(sql).join(', ') + ') AND ' + releaseMatch('r', subject) + ') = ' + partQuestions.length + ' THEN 1 ELSE 0 END;',
      'DROP TABLE ' + guardTable + ';',
    );
    const output = resolve(outputRoot, 'database/migrations/' + migrationNumber + '_' + subject.key + '_beta_part_' + part + '.sql');
    await writeFile(output, lines.join('\n') + '\n');
    migrationPaths.push(output);
    migrationNumber += 1;
  }
}

const allIds = batch.subjects.flatMap((entry) => entry.questions.map((question) => question.id));
const finalGuardTable = '_migration_' + migrationNumber + '_guard';
const finalReleaseClause = subjects.map((subject) => '(q.subject_id IS ' + sql(subject.subjectId) + ' AND ' + releaseMatch('r', subject) + ')').join(' OR ');
const finalLines = [
  '-- ' + migrationNumber + ': Final exact-set and relationship guard for WASSCE visual arts beta batch 004.',
  'PRAGMA foreign_keys = ON;',
  'CREATE TABLE IF NOT EXISTS ' + finalGuardTable + ' (valid INTEGER NOT NULL CHECK (valid = 1));',
  'DELETE FROM ' + finalGuardTable + ';',
  'INSERT INTO ' + finalGuardTable + '(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN syllabus_topics st ON st.id = q.syllabus_topic_id JOIN subject_specifications ss ON ss.id = st.specification_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (' + allIds.map(sql).join(', ') + ') AND q.subject_id = t.subject_id AND q.subject_id = ss.subject_id AND q.exam_type_id = ss.exam_type_id AND q.exam_board_id = ss.exam_board_id AND q.question_type = ' + sql('multiple_choice') + ' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN (' + labels.map(sql).join(',') + ') AND length(q.explanation) >= 80 AND (' + finalReleaseClause + ')) = 120 AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = ' + sql(batchId) + ') = 120 THEN 1 ELSE 0 END;',
  'DROP TABLE ' + finalGuardTable + ';',
];
const finalOutput = resolve(outputRoot, 'database/migrations/' + migrationNumber + '_wassce_visual_arts_beta_final_guard.sql');
await writeFile(finalOutput, finalLines.join('\n') + '\n');
migrationPaths.push(finalOutput);

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
