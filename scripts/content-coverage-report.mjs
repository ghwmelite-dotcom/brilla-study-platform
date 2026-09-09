#!/usr/bin/env node

// Content coverage-gap report (scaling strategy lever 1, docs/plans/2026-09-09-question-bank-scaling-strategy.md).
// Compares live question-bank counts against a per-topic difficulty/type quota and the
// intended-coverage matrix, blends in 30-day learner accuracy as a weakness signal, and
// emits a ranked authoring work plan to artifacts/content-coverage-latest.json.
//
// Prod access is READ-ONLY: queries run via `wrangler d1 execute --remote --json`.
// --local reads a local SQLite file (defaults to the wrangler miniflare D1 store).

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wranglerBin = resolve(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const manifestPath = resolve(root, 'config', 'deployments.json');
const wranglerPath = resolve(root, 'wrangler.toml');
const defaultMatrixPath = resolve(root, 'content', 'subject-coverage-matrix.json');
const defaultArtifactPath = resolve(root, 'artifacts', 'content-coverage-latest.json');
const localD1Dir = resolve(root, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

// Strategy lever 3 default matrix: 4 easy MCQ + 4 medium MCQ + 2 hard MCQ
// + 2 calculation/short-answer + 1 structured per topic (13 questions/topic).
const DEFAULT_QUOTA = [
  { key: 'mcq_easy', difficulty: 'easy', types: ['multiple_choice'], target: 4 },
  { key: 'mcq_medium', difficulty: 'medium', types: ['multiple_choice'], target: 4 },
  { key: 'mcq_hard', difficulty: 'hard', types: ['multiple_choice'], target: 2 },
  { key: 'calc_short_answer', difficulty: 'any', types: ['calculation', 'short_answer'], target: 2 },
  { key: 'structured', difficulty: 'any', types: ['structured'], target: 1 },
];

const QUERIES = (days) => `
SELECT s.id, s.name, s.slug, s.exam_type_id, et.name AS exam_name, et.slug AS exam_slug
FROM subjects s
LEFT JOIN exam_types et ON et.id = s.exam_type_id
WHERE s.is_active = 1;

SELECT id, subject_id, name, slug FROM topics;

SELECT topic_id, subject_id, difficulty, question_type, COUNT(*) AS n
FROM questions
GROUP BY topic_id, subject_id, difficulty, question_type;

SELECT q.topic_id AS topic_id, COUNT(*) AS attempts, AVG(qa.is_correct) AS accuracy
FROM question_attempts qa
JOIN questions q ON q.id = qa.question_id
WHERE qa.created_at >= datetime('now', '-${days} days')
  AND COALESCE(qa.is_demo_data, 0) = 0
GROUP BY q.topic_id;
`;

function usage() {
  console.log(`Usage: node scripts/content-coverage-report.mjs [options]

Options:
  --environment production|staging  Remote D1 target (default: production, read-only)
  --local                           Read a local SQLite file instead of prod
  --db <path>                       Explicit local SQLite path (implies --local)
  --quota <path.json>               Override the per-topic quota cells
  --matrix <path>                   Coverage matrix (default: content/subject-coverage-matrix.json)
  --days <n>                        Accuracy window in days (default: 30)
  --min-attempts <n>                Attempts before accuracy boosts priority (default: 10)
  --top <n>                         Rows shown in the console priority list (default: 25)
  --out <path>                      Artifact path (default: artifacts/content-coverage-latest.json)
  --selftest                        Run the built-in fixture assertions and exit`);
}

function fail(message) {
  console.error(`content-coverage-report aborted: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    environment: 'production',
    local: false,
    dbPath: null,
    quotaPath: null,
    matrixPath: defaultMatrixPath,
    days: 30,
    minAttempts: 10,
    top: 25,
    out: defaultArtifactPath,
    selftest: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const takeValue = (name) => {
      const value = argv[i + 1];
      if (!value) fail(`${name} requires a value`);
      i += 1;
      return value;
    };
    if (arg === '--environment') options.environment = takeValue('--environment');
    else if (arg === '--local') options.local = true;
    else if (arg === '--db') { options.dbPath = resolve(root, takeValue('--db')); options.local = true; }
    else if (arg === '--quota') options.quotaPath = resolve(root, takeValue('--quota'));
    else if (arg === '--matrix') options.matrixPath = resolve(root, takeValue('--matrix'));
    else if (arg === '--days') options.days = Number.parseInt(takeValue('--days'), 10);
    else if (arg === '--min-attempts') options.minAttempts = Number.parseInt(takeValue('--min-attempts'), 10);
    else if (arg === '--top') options.top = Number.parseInt(takeValue('--top'), 10);
    else if (arg === '--out') options.out = resolve(root, takeValue('--out'));
    else if (arg === '--selftest') options.selftest = true;
    else if (arg === '--help' || arg === '-h') { usage(); process.exit(0); }
    else fail(`unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.days) || options.days < 1) fail('--days must be a positive integer');
  if (options.environment !== 'production' && options.environment !== 'staging') {
    fail('environment must be exactly staging or production');
  }
  return options;
}

function findLocalD1() {
  let entries;
  try {
    entries = readdirSync(localD1Dir);
  } catch {
    fail(`no local D1 store at ${localD1Dir}; pass --db <path> or run wrangler once`);
  }
  const candidates = entries
    .filter((name) => name.endsWith('.sqlite'))
    .map((name) => join(localD1Dir, name))
    .sort((a, b) => statSync(b).size - statSync(a).size);
  if (candidates.length === 0) fail('local D1 store is empty; pass --db <path>');
  return candidates[0];
}

function queryRemote(environment, sql) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const target = manifest[environment];
  if (!target?.database || !target?.databaseId) {
    fail(`deployment manifest has no complete ${environment} database binding`);
  }
  const wranglerText = readFileSync(wranglerPath, 'utf8');
  const scope = environment === 'production'
    ? wranglerText.split('[env.dev.vars]')[0]
    : wranglerText.slice(wranglerText.indexOf('[env.staging.vars]'));
  if (!scope?.includes(`database_name = "${target.database}"`)) {
    fail(`${environment} database name does not match config/deployments.json`);
  }

  const args = [wranglerBin, 'd1', 'execute', target.database, '--remote', '--command', sql, '--json'];
  if (environment === 'staging') args.push('--env', 'staging');
  const execution = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (execution.status !== 0) {
    fail((execution.stderr || execution.stdout || 'Wrangler failed').trim());
  }
  let payload;
  try {
    payload = JSON.parse(execution.stdout);
  } catch {
    fail('Wrangler output was not valid JSON');
  }
  const sets = Array.isArray(payload) ? payload : payload?.result;
  if (!Array.isArray(sets) || sets.length < 4) {
    fail('Wrangler returned an incomplete or unfamiliar JSON result');
  }
  return sets.map((set, index) => {
    if (!set || set.success === false || !Array.isArray(set.results)) {
      fail(`query result set ${index + 1} is missing or unsuccessful`);
    }
    return set.results;
  });
}

function queryLocal(dbPath, sql) {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return sql
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean)
      .map((statement) => db.prepare(statement).all());
  } finally {
    db.close();
  }
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

// Pure gap computation — the selftest exercises this against a fixture.
export function computeGaps({ subjects, topics, cells, accuracyRows, quota, matrixDecisions, minAttempts }) {
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const accuracyByTopic = new Map(accuracyRows.map((r) => [r.topic_id, r]));

  const cellCounts = new Map(); // topicId -> { `${difficulty}|${type}` -> n }
  const subjectQuestionCounts = new Map();
  const unmappedBySubject = new Map();
  for (const row of cells) {
    subjectQuestionCounts.set(row.subject_id, (subjectQuestionCounts.get(row.subject_id) ?? 0) + row.n);
    if (row.topic_id == null) {
      unmappedBySubject.set(row.subject_id, (unmappedBySubject.get(row.subject_id) ?? 0) + row.n);
      continue;
    }
    if (!cellCounts.has(row.topic_id)) cellCounts.set(row.topic_id, new Map());
    const counts = cellCounts.get(row.topic_id);
    const key = `${row.difficulty}|${row.question_type}`;
    counts.set(key, (counts.get(key) ?? 0) + row.n);
  }

  const warnings = [];
  const retiredWithContent = subjects.filter(
    (s) => matrixDecisions.get(s.id) === 'retire' && (subjectQuestionCounts.get(s.id) ?? 0) > 0,
  );
  for (const s of retiredWithContent) {
    warnings.push(
      `retired subject "${s.name}" (${s.id}) still holds ${subjectQuestionCounts.get(s.id)} questions; excluded from the work plan`,
    );
  }

  const authoringCells = [];
  const neededBySubject = new Map();
  const neededByExam = new Map();
  for (const topic of topics) {
    const subject = subjectById.get(topic.subject_id);
    if (!subject) continue; // topic belongs to an inactive subject
    if (matrixDecisions.get(subject.id) === 'retire') continue;

    const counts = cellCounts.get(topic.id) ?? new Map();
    const accuracy = accuracyByTopic.get(topic.id);
    const hasSignal = accuracy != null && accuracy.attempts >= minAttempts;
    const boost = hasSignal ? 1 + (1 - accuracy.accuracy) : 1;

    for (const cell of quota) {
      let have = 0;
      for (const type of cell.types) {
        if (cell.difficulty === 'any') {
          for (const [key, n] of counts) {
            if (key.split('|')[1] === type) have += n;
          }
        } else {
          have += counts.get(`${cell.difficulty}|${type}`) ?? 0;
        }
      }
      const needed = Math.max(0, cell.target - have);
      if (needed === 0) continue;
      const priorityScore = round2(needed * boost);
      authoringCells.push({
        subjectId: subject.id,
        subjectName: subject.name,
        examSlug: subject.exam_slug ?? 'unassigned',
        topicId: topic.id,
        topicName: topic.name,
        cellKey: cell.key,
        difficulty: cell.difficulty,
        types: cell.types,
        have,
        target: cell.target,
        needed,
        attempts30d: accuracy?.attempts ?? 0,
        accuracy30d: accuracy != null ? round2(accuracy.accuracy) : null,
        priorityScore,
      });
      neededBySubject.set(subject.id, (neededBySubject.get(subject.id) ?? 0) + needed);
      const exam = subject.exam_slug ?? 'unassigned';
      neededByExam.set(exam, (neededByExam.get(exam) ?? 0) + needed);
    }
  }
  authoringCells.sort(
    (a, b) => b.priorityScore - a.priorityScore || b.needed - a.needed || a.subjectName.localeCompare(b.subjectName),
  );

  const topicsPerSubject = new Map();
  for (const topic of topics) {
    topicsPerSubject.set(topic.subject_id, (topicsPerSubject.get(topic.subject_id) ?? 0) + 1);
  }

  const perExamType = [];
  const examsSeen = new Map();
  for (const subject of subjects) {
    const exam = subject.exam_slug ?? 'unassigned';
    if (!examsSeen.has(exam)) {
      examsSeen.set(exam, { examSlug: exam, examName: subject.exam_name ?? 'Unassigned', subjects: 0, topics: 0, questions: 0, needed: 0, attempts: 0, correctWeighted: 0 });
    }
    const agg = examsSeen.get(exam);
    agg.subjects += 1;
    agg.topics += topicsPerSubject.get(subject.id) ?? 0;
    agg.questions += subjectQuestionCounts.get(subject.id) ?? 0;
    agg.needed += neededBySubject.get(subject.id) ?? 0;
  }
  for (const row of accuracyRows) {
    const topic = topicById.get(row.topic_id);
    const subject = topic && subjectById.get(topic.subject_id);
    if (!subject) continue;
    const agg = examsSeen.get(subject.exam_slug ?? 'unassigned');
    if (!agg) continue;
    agg.attempts += row.attempts;
    agg.correctWeighted += row.attempts * row.accuracy;
  }
  for (const agg of examsSeen.values()) {
    perExamType.push({
      examSlug: agg.examSlug,
      examName: agg.examName,
      subjects: agg.subjects,
      topics: agg.topics,
      questions: agg.questions,
      needed: agg.needed,
      avgAccuracy30d: agg.attempts > 0 ? round2(agg.correctWeighted / agg.attempts) : null,
      attempts30d: agg.attempts,
    });
  }
  perExamType.sort((a, b) => b.needed - a.needed);

  const weakestTopics = accuracyRows
    .filter((row) => row.topic_id != null && topicById.has(row.topic_id))
    .map((row) => {
      const topic = topicById.get(row.topic_id);
      const subject = subjectById.get(topic.subject_id);
      const questions = [...(cellCounts.get(row.topic_id)?.values() ?? [])].reduce((sum, n) => sum + n, 0);
      return {
        topicId: topic.id,
        topicName: topic.name,
        subjectId: subject?.id ?? null,
        subjectName: subject?.name ?? 'unknown',
        examSlug: subject?.exam_slug ?? 'unassigned',
        attempts30d: row.attempts,
        accuracy30d: round2(row.accuracy),
        questionsInBank: questions,
        needed: authoringCells.filter((c) => c.topicId === topic.id).reduce((sum, c) => sum + c.needed, 0),
      };
    })
    .sort((a, b) => a.accuracy30d - b.accuracy30d || b.attempts30d - a.attempts30d);

  const populatedSubjects = subjects.filter((s) => (subjectQuestionCounts.get(s.id) ?? 0) > 0).length;
  const summary = {
    activeSubjects: subjects.length,
    populatedSubjects,
    topics: topics.length,
    questions: [...subjectQuestionCounts.values()].reduce((sum, n) => sum + n, 0),
    unmappedQuestions: [...unmappedBySubject.values()].reduce((sum, n) => sum + n, 0),
    totalNeeded: authoringCells.reduce((sum, c) => sum + c.needed, 0),
    quotaPerTopic: quota.reduce((sum, cell) => sum + cell.target, 0),
  };

  return { summary, perExamType, authoringCells, weakestTopics, warnings };
}

function formatTable(headers, rows) {
  const widths = headers.map((header, i) => Math.max(header.length, ...rows.map((row) => String(row[i]).length)));
  const line = (cells) => cells.map((cell, i) => String(cell).padEnd(widths[i])).join('  ');
  return [line(headers), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}

function renderReport(result, context) {
  const { summary, perExamType, authoringCells, weakestTopics, warnings } = result;
  const lines = [];
  lines.push(`Content Coverage Report — ${context.source} — ${context.generatedAt}`);
  lines.push(`Quota per topic: ${context.quotaDescription} (${summary.quotaPerTopic} questions/topic)`);
  lines.push(
    `Bank: ${summary.questions} questions | ${summary.populatedSubjects}/${summary.activeSubjects} subjects populated | ${summary.topics} topics | total gap to quota: ${summary.totalNeeded} questions`,
  );
  if (summary.unmappedQuestions > 0) {
    lines.push(`Note: ${summary.unmappedQuestions} questions have no topic_id and cannot fill topic cells.`);
  }
  lines.push('');
  lines.push('Per-exam-type summary (sorted by gap):');
  lines.push(formatTable(
    ['exam', 'subjects', 'topics', 'questions', 'needed', 'attempts(30d)', 'accuracy(30d)'],
    perExamType.map((row) => [
      row.examSlug, row.subjects, row.topics, row.questions, row.needed, row.attempts30d,
      row.avgAccuracy30d == null ? 'n/a' : `${Math.round(row.avgAccuracy30d * 100)}%`,
    ]),
  ));
  lines.push('');
  lines.push(`Top ${Math.min(context.top, authoringCells.length)} authoring priorities:`);
  lines.push(formatTable(
    ['#', 'score', 'needed', 'subject', 'topic', 'cell', 'have/target'],
    authoringCells.slice(0, context.top).map((cell, i) => [
      i + 1, cell.priorityScore, cell.needed, cell.subjectName, cell.topicName,
      `${cell.cellKey} [${cell.types.join('/')}]`, `${cell.have}/${cell.target}`,
    ]),
  ));
  lines.push('');
  const weakest = weakestTopics.slice(0, 20);
  lines.push(`Weakest ${weakest.length} topics by learner accuracy (last ${context.days} days):`);
  if (weakest.length === 0) {
    lines.push('  (no attempts recorded in the window)');
  } else {
    lines.push(formatTable(
      ['topic', 'subject', 'attempts', 'accuracy', 'bank', 'needed'],
      weakest.map((row) => [
        row.topicName, row.subjectName, row.attempts30d, `${Math.round(row.accuracy30d * 100)}%`, row.questionsInBank, row.needed,
      ]),
    ));
  }
  if (warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of warnings) lines.push(`- ${warning}`);
  }
  return lines.join('\n');
}

function loadQuota(quotaPath) {
  if (!quotaPath) return DEFAULT_QUOTA;
  const parsed = JSON.parse(readFileSync(quotaPath, 'utf8'));
  const cells = Array.isArray(parsed) ? parsed : parsed.cells;
  if (!Array.isArray(cells) || cells.length === 0) fail('quota file must be a non-empty array or { cells: [...] }');
  for (const cell of cells) {
    if (!cell.key || !Array.isArray(cell.types) || !Number.isInteger(cell.target)) {
      fail('each quota cell needs key, types[] and integer target');
    }
  }
  return cells.map((cell) => ({ difficulty: 'any', ...cell }));
}

function loadMatrixDecisions(matrixPath) {
  let matrix;
  try {
    matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
  } catch {
    return { decisions: new Map(), note: `coverage matrix not readable at ${matrixPath}; matrix decisions skipped` };
  }
  const decisions = new Map();
  for (const subject of matrix.subjects ?? []) {
    if (subject.id && subject.decision) decisions.set(subject.id, subject.decision);
    for (const replacement of subject.replacementSubjects ?? []) {
      if (replacement.id) decisions.set(replacement.id, 'populate');
    }
  }
  return { decisions, note: null };
}

function runSelftest() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY, name TEXT, slug TEXT);
    CREATE TABLE subjects (id TEXT PRIMARY KEY, name TEXT, slug TEXT, exam_type_id TEXT, is_active INTEGER DEFAULT 1);
    CREATE TABLE topics (id TEXT PRIMARY KEY, subject_id TEXT, name TEXT, slug TEXT);
    CREATE TABLE questions (id TEXT PRIMARY KEY, topic_id TEXT, subject_id TEXT, difficulty TEXT, question_type TEXT);
    CREATE TABLE question_attempts (id TEXT PRIMARY KEY, question_id TEXT, is_correct INTEGER, is_demo_data INTEGER DEFAULT 0, created_at TEXT);
  `);
  const insert = (sql, rows) => {
    const stmt = db.prepare(sql);
    for (const row of rows) stmt.run(...row);
  };
  insert('INSERT INTO exam_types VALUES (?, ?, ?)', [['et_wassce', 'WASSCE', 'wassce']]);
  insert('INSERT INTO subjects VALUES (?, ?, ?, ?, 1)', [
    ['subj_math', 'Core Mathematics', 'core-mathematics', 'et_wassce'],
    ['subj_art', 'Visual Arts', 'visual-arts', 'et_wassce'],
  ]);
  insert('INSERT INTO topics VALUES (?, ?, ?, ?)', [
    ['t_algebra', 'subj_math', 'Algebra', 'algebra'],
    ['t_geometry', 'subj_math', 'Geometry', 'geometry'],
    ['t_art', 'subj_art', 'Art Basics', 'art-basics'],
  ]);
  const questions = [];
  for (let i = 0; i < 4; i += 1) questions.push([`q_easy_${i}`, 't_algebra', 'subj_math', 'easy', 'multiple_choice']);
  for (let i = 0; i < 2; i += 1) questions.push([`q_med_${i}`, 't_algebra', 'subj_math', 'medium', 'multiple_choice']);
  questions.push(['q_calc', 't_algebra', 'subj_math', 'medium', 'calculation']);
  questions.push(['q_unmapped', null, 'subj_math', 'easy', 'multiple_choice']);
  for (let i = 0; i < 3; i += 1) questions.push([`q_art_${i}`, 't_art', 'subj_art', 'easy', 'multiple_choice']);
  insert('INSERT INTO questions VALUES (?, ?, ?, ?, ?)', questions);

  const attempts = [];
  for (let i = 0; i < 20; i += 1) {
    attempts.push([`a_${i}`, 'q_easy_0', i < 10 ? 1 : 0, 0, "datetime('now', '-1 day')"]);
  }
  attempts.push(['a_old', 'q_med_0', 0, 0, "datetime('now', '-60 days')"]);
  attempts.push(['a_demo', 'q_easy_1', 0, 1, "datetime('now', '-1 day')"]);
  for (const [id, questionId, correct, demo, createdExpr] of attempts) {
    db.prepare(`INSERT INTO question_attempts VALUES ('${id}', '${questionId}', ${correct}, ${demo}, ${createdExpr})`).run();
  }

  const matrix = { subjects: [{ id: 'subj_art', decision: 'retire' }] };
  const [subjects, topics, cells, accuracyRows] = (() => {
    const statements = QUERIES(30).split(';').map((s) => s.trim()).filter(Boolean);
    return statements.map((s) => db.prepare(s).all());
  })();
  db.close();

  const result = computeGaps({
    subjects, topics, cells, accuracyRows,
    quota: DEFAULT_QUOTA,
    matrixDecisions: new Map(matrix.subjects.map((s) => [s.id, s.decision])),
    minAttempts: 10,
  });

  const algebra = result.authoringCells.filter((c) => c.topicId === 't_algebra');
  const geometry = result.authoringCells.filter((c) => c.topicId === 't_geometry');

  // Algebra: easy MCQ full (0 needed), medium MCQ 2 short, hard MCQ 2 short,
  // calc/short 1 short, structured 1 short => 6 total, boosted 1.5x at 50% accuracy.
  const algebraNeeded = Object.fromEntries(algebra.map((c) => [c.cellKey, c.needed]));
  assert.equal(algebraNeeded.mcq_easy, undefined, 'filled easy-MCQ cell should not appear');
  assert.equal(algebraNeeded.mcq_medium, 2);
  assert.equal(algebraNeeded.mcq_hard, 2);
  assert.equal(algebraNeeded.calc_short_answer, 1);
  assert.equal(algebraNeeded.structured, 1);
  assert.equal(algebra.find((c) => c.cellKey === 'mcq_medium').priorityScore, 3);
  assert.equal(algebra[0].attempts30d, 20, 'old + demo attempts must be excluded');
  assert.equal(algebra[0].accuracy30d, 0.5);

  // Geometry: zero questions, zero attempts => full 13-question gap at base priority (no mastery data is a gap too).
  assert.equal(geometry.reduce((sum, c) => sum + c.needed, 0), 13);
  assert.ok(geometry.every((c) => c.priorityScore === c.needed));
  assert.equal(geometry[0].attempts30d, 0);
  assert.equal(geometry[0].accuracy30d, null);

  // Retired subject excluded from the plan, surfaced as a warning.
  assert.ok(result.authoringCells.every((c) => c.subjectId !== 'subj_art'));
  assert.ok(result.warnings.some((w) => w.includes('Visual Arts')));

  // Weakest-topics list and exam summary.
  assert.equal(result.weakestTopics[0].topicId, 't_algebra');
  assert.equal(result.weakestTopics[0].accuracy30d, 0.5);
  assert.equal(result.summary.unmappedQuestions, 1);
  assert.equal(result.summary.totalNeeded, 19);
  const wassce = result.perExamType.find((row) => row.examSlug === 'wassce');
  assert.equal(wassce.subjects, 2);
  assert.equal(wassce.needed, 19);

  // Ranked order: geometry's untouched 4-target cells lead (score 4); among equal-size
  // 1-target cells, algebra's weakness-boosted structured/calc cells (score 1.5) outrank
  // geometry's (score 1).
  assert.equal(result.authoringCells[0].topicId, 't_geometry');
  assert.equal(result.authoringCells[0].cellKey, 'mcq_easy');
  const ids = result.authoringCells.map((c) => `${c.topicId}:${c.cellKey}`);
  assert.ok(ids.indexOf('t_algebra:structured') < ids.indexOf('t_geometry:structured'));
  console.log('content-coverage-report selftest: all assertions passed');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.selftest) {
    runSelftest();
    return;
  }

  const quota = loadQuota(options.quotaPath);
  const matrix = loadMatrixDecisions(options.matrixPath);
  const sql = QUERIES(options.days);

  let resultSets;
  let source;
  if (options.local) {
    const dbPath = options.dbPath ?? findLocalD1();
    resultSets = queryLocal(dbPath, sql);
    source = `local (${dbPath})`;
  } else {
    resultSets = queryRemote(options.environment, sql);
    source = `${options.environment} (${JSON.parse(readFileSync(manifestPath, 'utf8'))[options.environment].database}, read-only)`;
  }
  const [subjects, topics, cells, accuracyRows] = resultSets;

  const result = computeGaps({
    subjects, topics, cells, accuracyRows,
    quota,
    matrixDecisions: matrix.decisions,
    minAttempts: options.minAttempts,
  });
  if (matrix.note) result.warnings.push(matrix.note);

  const generatedAt = new Date().toISOString();
  const quotaDescription = quota.map((cell) => `${cell.target} ${cell.key}`).join(' + ');
  const report = renderReport(result, { source, generatedAt, quotaDescription, days: options.days, top: options.top });
  console.log(report);

  const artifact = {
    generatedAt,
    source,
    accuracyWindowDays: options.days,
    minAttemptsForWeaknessBoost: options.minAttempts,
    priorityFormula: 'priorityScore = needed * (1 + (1 - accuracy30d)) when attempts >= minAttempts, else needed',
    quota,
    summary: result.summary,
    perExamType: result.perExamType,
    topPriorities: result.authoringCells.slice(0, 50),
    authoringCells: result.authoringCells,
    weakestTopics: result.weakestTopics,
    warnings: result.warnings,
  };
  mkdirSync(dirname(options.out), { recursive: true });
  writeFileSync(options.out, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(`\nWork plan written to ${options.out}`);
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
