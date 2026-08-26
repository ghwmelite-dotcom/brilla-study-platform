import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireAuth } from './auth-middleware';
import { isPremiumUser } from './usage-limits';
import { checkRateLimit } from './rate-limit';
import { getChatModel, unwrapAiText } from './ai-models';
import { lookupAnswer, storeAnswer } from './answer-cache';
import { prepareAttemptProgress } from './attempt-progress';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT?: string;
  COUNSELOR_BRIE_ENABLED?: string;
  AI?: Ai;
  ANSWERS_INDEX?: VectorizeIndex;
  AI_MODEL?: string;
  AI_MODEL_CHAT?: string;
  AI_MODEL_EMBEDDING?: string;
  AI_CACHE_THRESHOLD?: string;
}

interface Variables {
  userId: string;
  userRole: string;
  user: { userId: string; email?: string; role?: string };
}

type GuidanceContext = Context<{ Bindings: Env; Variables: Variables }>;
type Confidence = 'low' | 'medium' | 'high';

export const ALGORITHM_VERSION = 'brie-readiness-v1';
export const NARRATIVE_PROMPT_VERSION = 'brie-narrative-v1';
export const ASSESSMENT_TARGET = 9;
export const SKIP_THRESHOLD = 20;
export const RECENT_EVIDENCE_DAYS = 180;
export const RETAKE_COOLDOWN_SECONDS = 24 * 60 * 60;
export const GUIDANCE_ANSWER_INSERT_SQL = `
  INSERT INTO guidance_session_answers (
    id, session_id, ordinal, question_id, user_answer, is_correct, time_taken,
    difficulty, topic_id, idempotency_key, question_attempt_id, created_at
  ) VALUES (
    ?,
    (SELECT id FROM guidance_sessions
      WHERE id = ? AND user_id = ? AND version = ? AND status = 'in_progress'),
    ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
  )
`;
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'expert'] as const;
export const DIFFICULTY_WEIGHTS: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
};

interface ExamCatalogEntry {
  dbId: string;
  aliases: readonly string[];
  grades: readonly string[];
}

export const EXAM_CATALOG: Record<string, ExamCatalogEntry> = {
  wassce: { dbId: 'exam_wassce', aliases: ['wassce'], grades: ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'] },
  bece: { dbId: 'exam_bece', aliases: ['bece'], grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  nsmq: { dbId: 'exam_nsmq', aliases: ['nsmq'], grades: [] },
  igcse: { dbId: 'igcse', aliases: ['igcse', 'cambridge-igcse'], grades: ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  cambridge_as: { dbId: 'cambridge_as', aliases: ['cambridge_as', 'cambridge-as'], grades: ['A*', 'A', 'B', 'C', 'D', 'E'] },
  cambridge_a2: { dbId: 'cambridge_a2', aliases: ['cambridge_a2', 'cambridge-a2', 'cambridge-a-level'], grades: ['A*', 'A', 'B', 'C', 'D', 'E'] },
  edexcel_igcse: { dbId: 'edexcel_igcse', aliases: ['edexcel_igcse', 'edexcel-igcse'], grades: ['9', '8', '7', '6', '5', '4', '3', '2', '1'] },
  edexcel_as: { dbId: 'edexcel_as', aliases: ['edexcel_as', 'edexcel-as'], grades: ['A*', 'A', 'B', 'C', 'D', 'E'] },
  edexcel_a2: { dbId: 'edexcel_a2', aliases: ['edexcel_a2', 'edexcel-a2', 'edexcel-a-level'], grades: ['A*', 'A', 'B', 'C', 'D', 'E'] },
};

export const TARGET_GRADES: Record<string, string[]> = Object.fromEntries(
  Object.entries(EXAM_CATALOG)
    .filter(([, entry]) => entry.grades.length > 0)
    .map(([key, entry]) => [key, [...entry.grades]]),
);

export function normalizeExamType(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().toLowerCase();
  for (const [canonical, entry] of Object.entries(EXAM_CATALOG)) {
    if (canonical === candidate || entry.aliases.includes(candidate)) return canonical;
  }
  return null;
}

interface GoalInput {
  examType: string;
  subjectId: string;
  targetGrade: string | null;
  examYear: number | null;
  examMonth: number | null;
}

export function validateGoalBody(
  body: unknown,
  now = new Date(),
): { ok: true; value: GoalInput } | { ok: false; error: string } {
  const record = isRecord(body) ? body : {};
  const examType = normalizeExamType(record.examType);
  if (!examType) {
    return { ok: false, error: `Unknown examType (expected one of: ${Object.keys(EXAM_CATALOG).join(', ')})` };
  }
  const subjectId = typeof record.subjectId === 'string' ? record.subjectId.trim() : '';
  if (!subjectId) return { ok: false, error: 'subjectId is required' };

  let targetGrade: string | null = null;
  if (record.targetGrade !== undefined && record.targetGrade !== null) {
    if (typeof record.targetGrade !== 'string' || record.targetGrade.trim() === '') {
      return { ok: false, error: 'targetGrade must be a non-empty string' };
    }
    targetGrade = record.targetGrade.trim();
    if (examType === 'nsmq') return { ok: false, error: 'nsmq has no grade scale; omit targetGrade' };
    if (!EXAM_CATALOG[examType].grades.includes(targetGrade)) {
      return { ok: false, error: `targetGrade must be one of: ${EXAM_CATALOG[examType].grades.join(', ')}` };
    }
  }

  const currentYear = now.getUTCFullYear();
  let examYear: number | null = null;
  if (record.examYear !== undefined && record.examYear !== null) {
    if (!Number.isInteger(record.examYear) || (record.examYear as number) < currentYear || (record.examYear as number) > currentYear + 5) {
      return { ok: false, error: `examYear must be an integer between ${currentYear} and ${currentYear + 5}` };
    }
    examYear = record.examYear as number;
  }

  let examMonth: number | null = null;
  if (record.examMonth !== undefined && record.examMonth !== null) {
    if (!Number.isInteger(record.examMonth) || (record.examMonth as number) < 1 || (record.examMonth as number) > 12) {
      return { ok: false, error: 'examMonth must be an integer between 1 and 12' };
    }
    examMonth = record.examMonth as number;
  }
  if (examYear !== null && examMonth !== null) {
    const currentMonth = now.getUTCMonth() + 1;
    if (examYear === currentYear && examMonth < currentMonth) {
      return { ok: false, error: 'examYear and examMonth cannot be in the past' };
    }
  }

  return { ok: true, value: { examType, subjectId, targetGrade, examYear, examMonth } };
}

export function stepDifficulty(current: string, wasCorrect: boolean): string {
  const index = Math.max(0, DIFFICULTY_ORDER.indexOf(current as typeof DIFFICULTY_ORDER[number]));
  const next = Math.min(DIFFICULTY_ORDER.length - 1, Math.max(0, index + (wasCorrect ? 1 : -1)));
  return DIFFICULTY_ORDER[next];
}

export function computeWeightedReadiness(answers: Array<{ difficulty: string; isCorrect: number }>): number {
  const denominator = answers.reduce((sum, answer) => sum + (DIFFICULTY_WEIGHTS[answer.difficulty] ?? 2), 0);
  if (denominator === 0) return 0;
  const numerator = answers.reduce(
    (sum, answer) => sum + (DIFFICULTY_WEIGHTS[answer.difficulty] ?? 2) * (answer.isCorrect === 1 ? 1 : 0),
    0,
  );
  return Math.round(100 * numerator / denominator);
}

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseOptions(optionsJson: string | null): string[] {
  if (!optionsJson) return [];
  try {
    const parsed: unknown = JSON.parse(optionsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((option) => {
      if (typeof option === 'string') return option;
      if (isRecord(option) && typeof option.text === 'string') return option.text;
      return '';
    }).filter(Boolean);
  } catch {
    return [];
  }
}

export function isAnswerCorrect(
  correctAnswer: string,
  userAnswer: string,
  optionsJson: string | null,
  questionType = 'multiple_choice',
): boolean {
  const correct = normalizeAnswer(correctAnswer);
  const submitted = normalizeAnswer(userAnswer);
  if (questionType === 'true_false') return submitted === correct;
  if (submitted === correct) return true;
  const options = parseOptions(optionsJson);
  const correctLetter = /^[a-z]$/i.test(correctAnswer.trim()) ? correctAnswer.trim().toUpperCase() : null;
  if (!correctLetter) return false;
  const index = correctLetter.charCodeAt(0) - 65;
  const option = options[index];
  return option ? submitted === normalizeAnswer(option) : false;
}

export function computeConfidence(evidenceCount: number, coverageRatio: number): Confidence {
  if (evidenceCount >= 20 && coverageRatio >= 0.6) return 'high';
  if (evidenceCount >= 8 && coverageRatio >= 0.3) return 'medium';
  return 'low';
}

interface UserGoalRow {
  id: string;
  exam_type: string;
  subject_id: string;
  target_grade: string | null;
  exam_year: number | null;
  exam_month: number | null;
  updated_at: string;
}

function mapGoal(row: UserGoalRow) {
  return {
    id: row.id,
    examType: row.exam_type,
    subjectId: row.subject_id,
    targetGrade: row.target_grade ?? null,
    examYear: row.exam_year ?? null,
    examMonth: row.exam_month ?? null,
    updatedAt: row.updated_at,
  };
}

interface AskedAnswer {
  questionId: string;
  topicId: string | null;
  difficulty: string;
  isCorrect: number;
  timeTaken: number;
}

interface SessionEnvelope {
  asked: AskedAnswer[];
  topicQueue: string[];
  currentDifficulty: string;
  pendingQuestionId: string | null;
  pendingOrdinal: number;
}

interface SessionRow {
  id: string;
  user_id: string;
  exam_type: string;
  subject_id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  version: number;
  algorithm_version: string;
  questions: string;
  readiness_score: number | null;
  completed_early: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface QuestionRow {
  id: string;
  topic_id: string | null;
  subject_id: string;
  exam_type_id: string | null;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
  points: number | null;
  topic_name: string | null;
}

interface EvidenceSnapshot {
  evidenceCount: number;
  topicCoverage: { covered: number; total: number; ratio: number };
  freshness: string | null;
  confidence: Confidence;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function jsonBody(c: GuidanceContext): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await c.req.json();
    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

function parseEnvelope(raw: string): SessionEnvelope {
  try {
    const value: unknown = JSON.parse(raw);
    if (isRecord(value) && Array.isArray(value.asked) && Array.isArray(value.topicQueue)) {
      return {
        asked: value.asked as AskedAnswer[],
        topicQueue: value.topicQueue.filter((item): item is string => typeof item === 'string'),
        currentDifficulty: typeof value.currentDifficulty === 'string' ? value.currentDifficulty : 'medium',
        pendingQuestionId: typeof value.pendingQuestionId === 'string' ? value.pendingQuestionId : null,
        pendingOrdinal: typeof value.pendingOrdinal === 'number' ? value.pendingOrdinal : (value.asked as unknown[]).length,
      };
    }
  } catch {
    // Invalid legacy/session JSON restarts from a safe empty envelope.
  }
  return { asked: [], topicQueue: [], currentDifficulty: 'medium', pendingQuestionId: null, pendingOrdinal: 0 };
}

async function validateSubjectCompatibility(db: D1Database, examType: string, subjectId: string): Promise<boolean> {
  const exam = EXAM_CATALOG[examType];
  const row = await db.prepare(`
    SELECT s.id FROM subjects s
    WHERE s.id = ? AND s.is_active = 1 AND (
      s.exam_type_id = ? OR EXISTS (
        SELECT 1 FROM subject_specifications ss
        WHERE ss.subject_id = s.id AND ss.exam_type_id = ? AND ss.is_active = 1
      )
    )
  `).bind(subjectId, exam.dbId, exam.dbId).first<{ id: string }>();
  return Boolean(row);
}

export async function getSubjectAttemptCount(db: D1Database, userId: string, subjectId: string): Promise<number> {
  const row = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
    JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
    WHERE qa.user_id = ? AND q.subject_id = ?
      AND qa.created_at >= datetime('now', '-${RECENT_EVIDENCE_DAYS} days')
  `).bind(userId, subjectId).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function getMasteryReadiness(db: D1Database, userId: string, subjectId: string): Promise<number> {
  const row = await db.prepare(`
    SELECT COALESCE(ROUND(
      100.0 * SUM(up.questions_correct) / NULLIF(SUM(up.questions_attempted), 0)
    ), 0) AS readiness
    FROM user_progress up
    JOIN topics t ON t.id = up.topic_id
    JOIN subjects s ON s.id = t.subject_id AND s.is_active = 1
    WHERE up.user_id = ? AND t.subject_id = ?
      AND EXISTS (
        SELECT 1 FROM questions q
        WHERE q.topic_id = t.id AND q.subject_id = t.subject_id
      )
  `).bind(userId, subjectId).first<{ readiness: number }>();
  return Math.max(0, Math.min(100, Number(row?.readiness ?? 0)));
}

async function getEvidenceSnapshot(db: D1Database, userId: string, subjectId: string): Promise<EvidenceSnapshot> {
  const [attempts, coverage] = await Promise.all([
    db.prepare(`
      SELECT COUNT(*) AS count, MAX(qa.created_at) AS freshness
      FROM question_attempts qa
      JOIN questions q ON q.id = qa.question_id
      JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
      JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
      WHERE qa.user_id = ? AND q.subject_id = ?
        AND qa.created_at >= datetime('now', '-${RECENT_EVIDENCE_DAYS} days')
    `).bind(userId, subjectId).first<{ count: number; freshness: string | null }>(),
    db.prepare(`
      SELECT
        COUNT(DISTINCT t.id) AS total,
        COUNT(DISTINCT CASE WHEN COALESCE(up.questions_attempted, 0) > 0
          THEN t.id END) AS covered
      FROM topics t
      JOIN subjects s ON s.id = t.subject_id AND s.is_active = 1
      LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = ?
      WHERE t.subject_id = ?
        AND EXISTS (
          SELECT 1 FROM questions q
          WHERE q.topic_id = t.id AND q.subject_id = t.subject_id
        )
    `).bind(userId, subjectId).first<{ total: number; covered: number }>(),
  ]);
  const evidenceCount = Number(attempts?.count ?? 0);
  const total = Number(coverage?.total ?? 0);
  const covered = Number(coverage?.covered ?? 0);
  const ratio = total > 0 ? Number((covered / total).toFixed(2)) : 0;
  return {
    evidenceCount,
    topicCoverage: { covered, total, ratio },
    freshness: attempts?.freshness ?? null,
    confidence: computeConfidence(evidenceCount, ratio),
  };
}

export async function upsertExamReadiness(
  db: D1Database,
  userId: string,
  examType: string,
  subjectId: string,
  score: number,
): Promise<void> {
  const { results } = await db.prepare(`
    SELECT t.id, COALESCE(up.mastery_level, 0) AS mastery_level
    FROM topics t
    JOIN subjects s ON s.id = t.subject_id AND s.is_active = 1
    LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = ?
    WHERE t.subject_id = ?
      AND EXISTS (
        SELECT 1 FROM questions q
        WHERE q.topic_id = t.id AND q.subject_id = t.subject_id
      )
  `).bind(userId, subjectId).all<{ id: string; mastery_level: number }>();
  const weak = results.filter((row) => Number(row.mastery_level) < 50).map((row) => row.id);
  const strong = results.filter((row) => Number(row.mastery_level) >= 70).map((row) => row.id);
  await db.prepare(`
    INSERT INTO exam_readiness (
      id, user_id, exam_type, subject_id, readiness_score, topics_mastered,
      topics_total, weak_topics, strong_topics, last_calculated, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id, exam_type, subject_id) DO UPDATE SET
      readiness_score = excluded.readiness_score,
      topics_mastered = excluded.topics_mastered,
      topics_total = excluded.topics_total,
      weak_topics = excluded.weak_topics,
      strong_topics = excluded.strong_topics,
      last_calculated = datetime('now')
  `).bind(
    newId('readiness'), userId, examType, subjectId, score,
    strong.length, results.length, JSON.stringify(weak), JSON.stringify(strong),
  ).run();
}

function publicQuestion(question: QuestionRow) {
  return {
    id: question.id,
    questionText: question.question_text,
    questionType: question.question_type,
    options: question.question_type === 'multiple_choice' ? parseOptions(question.options) : ['True', 'False'],
    difficulty: question.difficulty,
    topicName: question.topic_name ?? null,
  };
}

function objectivePredicate(): string {
  return `(
    (q.question_type = 'multiple_choice' AND q.options IS NOT NULL
      AND json_valid(q.options) = 1 AND json_array_length(q.options) >= 2
      AND (
        (length(trim(q.correct_answer)) = 1
          AND instr('ABCDEFGHIJKLMNOPQRSTUVWXYZ', upper(trim(q.correct_answer)))
            BETWEEN 1 AND json_array_length(q.options))
        OR EXISTS (SELECT 1 FROM json_each(q.options) option
          WHERE lower(trim(CAST(option.value AS TEXT))) = lower(trim(q.correct_answer)))
      ))
    OR (q.question_type = 'true_false'
      AND lower(trim(q.correct_answer)) IN ('true', 'false'))
  )`;
}

async function questionById(db: D1Database, questionId: string): Promise<QuestionRow | null> {
  return db.prepare(`
    SELECT q.*, t.name AS topic_name
    FROM questions q
    JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
    JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
    WHERE q.id = ? AND ${objectivePredicate()}
  `).bind(questionId).first<QuestionRow>();
}

async function pickQuestion(
  db: D1Database,
  examType: string,
  subjectId: string,
  envelope: SessionEnvelope,
): Promise<QuestionRow | null> {
  const examId = EXAM_CATALOG[examType].dbId;
  const used = JSON.stringify(envelope.asked.map((answer) => answer.questionId));
  const topicId = envelope.topicQueue[0] ?? null;
  const base = `
    SELECT q.*, t.name AS topic_name
    FROM questions q
    JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
    JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
    WHERE q.subject_id = ? AND (q.exam_type_id = ? OR q.exam_type_id IS NULL)
      AND q.id NOT IN (SELECT value FROM json_each(?))
      AND ${objectivePredicate()}
  `;
  if (topicId) {
    const inTopic = await db.prepare(`${base} AND q.topic_id = ?
      ORDER BY CASE q.difficulty
        WHEN ? THEN 0 WHEN 'medium' THEN 1 WHEN 'hard' THEN 2
        WHEN 'easy' THEN 3 ELSE 4 END, q.id LIMIT 1
    `).bind(subjectId, examId, used, topicId, envelope.currentDifficulty).first<QuestionRow>();
    if (inTopic) {
      envelope.topicQueue = [...envelope.topicQueue.slice(1), topicId];
      return inTopic;
    }
    envelope.topicQueue = envelope.topicQueue.slice(1);
  }
  return db.prepare(`${base}
    ORDER BY CASE q.difficulty WHEN ? THEN 0 WHEN 'medium' THEN 1 WHEN 'hard' THEN 2
      WHEN 'easy' THEN 3 ELSE 4 END, q.id LIMIT 1
  `).bind(subjectId, examId, used, envelope.currentDifficulty).first<QuestionRow>();
}

async function topicQueue(db: D1Database, subjectId: string): Promise<string[]> {
  const { results } = await db.prepare(`
    SELECT t.id
    FROM topics t
    JOIN subjects s ON s.id = t.subject_id AND s.is_active = 1
    WHERE t.subject_id = ?
      AND EXISTS (
        SELECT 1 FROM questions q
        WHERE q.topic_id = t.id AND q.subject_id = t.subject_id
      )
    ORDER BY t.display_order ASC, t.id ASC
  `).bind(subjectId).all<{ id: string }>();
  return results.map((row) => row.id);
}

function assessmentMetadata(snapshot: EvidenceSnapshot, completedEarly: boolean) {
  return {
    ...snapshot,
    algorithmVersion: ALGORITHM_VERSION,
    completedEarly,
  };
}

interface RoadmapRow {
  topic_id: string;
  topic_name: string;
  display_order: number;
  mastery_score: number;
  questions_attempted: number;
}

function mapRoadmap(row: RoadmapRow, examType: string, subjectId: string) {
  const mastery = Number(row.mastery_score ?? 0);
  const attempts = Number(row.questions_attempted ?? 0);
  let priority: 'critical' | 'high' | 'medium' | 'low';
  let reason: 'weak_area' | 'not_started' | 'review_needed' | 'maintain';
  if (attempts === 0) { priority = 'high'; reason = 'not_started'; }
  else if (mastery < 30) { priority = 'critical'; reason = 'weak_area'; }
  else if (mastery < 50) { priority = 'high'; reason = 'weak_area'; }
  else if (mastery < 70) { priority = 'medium'; reason = 'review_needed'; }
  else { priority = 'low'; reason = 'maintain'; }
  return {
    topicId: row.topic_id,
    topicName: row.topic_name,
    masteryScore: mastery,
    questionsAttempted: attempts,
    priority,
    reason,
    estimatedTime: mastery < 50 ? 45 : 30,
    href: `/revision-classroom?exam=${encodeURIComponent(examType)}&subject=${encodeURIComponent(subjectId)}&topic=${encodeURIComponent(row.topic_id)}`,
    displayOrder: Number(row.display_order ?? 0),
  };
}

async function getRoadmap(db: D1Database, userId: string, examType: string, subjectId: string) {
  const { results } = await db.prepare(`
    SELECT t.id AS topic_id, t.name AS topic_name, t.display_order,
      COALESCE(up.mastery_level, 0) AS mastery_score,
      COALESCE(up.questions_attempted, 0) AS questions_attempted
    FROM topics t
    JOIN subjects s ON s.id = t.subject_id AND s.is_active = 1
    LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = ?
    WHERE t.subject_id = ?
      AND EXISTS (
        SELECT 1 FROM questions q
        WHERE q.topic_id = t.id AND q.subject_id = t.subject_id
      )
  `).bind(userId, subjectId).all<RoadmapRow>();
  const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  return results.map((row) => mapRoadmap(row, examType, subjectId))
    .sort((a, b) => rank[a.priority] - rank[b.priority] || a.displayOrder - b.displayOrder)
    .map(({ displayOrder: _displayOrder, ...node }) => node);
}

function genericTemplate(readiness: number, confidence: Confidence): string {
  return `Your provisional readiness is ${readiness}/100 with ${confidence} confidence. Keep practising and this estimate will become more reliable.`;
}

function personalizeNarrative(
  generic: string,
  goal: ReturnType<typeof mapGoal> | null,
  strongest: string | null,
  weakest: string | null,
): string {
  const target = goal?.targetGrade ? ` Your target is ${goal.targetGrade}.` : '';
  const direction = weakest
    ? ` Start with ${weakest}${strongest ? ` while maintaining ${strongest}` : ''}.`
    : ' Start with the first topic in your route.';
  return `${generic}${target}${direction} This is an AI academic guide, not a human counselor. - Brie`;
}

async function getGenericNarrative(
  c: GuidanceContext,
  details: { examType: string; subjectId: string; readiness: number; confidence: Confidence },
  force: boolean,
): Promise<{ text: string; cached: boolean; fallback: boolean }> {
  const band = Math.floor(details.readiness / 10) * 10;
  const key = `${NARRATIVE_PROMPT_VERSION}|${details.examType}|${details.subjectId}|${band}|${details.confidence}`;
  const topicKey = `brie|${key}`;
  if (!force) {
    const cached = await lookupAnswer(c.env, topicKey, key);
    if (cached) return { text: cached.answerText, cached: true, fallback: false };
  }
  const fallback = genericTemplate(details.readiness, details.confidence);
  if (!c.env.AI) return { text: fallback, cached: false, fallback: true };
  const quota = await checkRateLimit(c.env.DB, c.get('userId'), 'ai');
  if (!quota.allowed) return { text: fallback, cached: false, fallback: true };
  try {
    const model = getChatModel(c.env);
    const result = await c.env.AI.run(model as never, {
      messages: [{
        role: 'user',
        content: `Write two warm sentences for a student whose provisional readiness band is ${band} and confidence is ${details.confidence}. Do not mention any student name, grade, subject topic, or personal detail. Say that more practice improves the estimate.`,
      }],
      max_tokens: 160,
      temperature: 0.7,
    });
    const text = unwrapAiText(result).trim();
    if (!text) return { text: fallback, cached: false, fallback: true };
    await storeAnswer(c.env, topicKey, details.subjectId, details.examType, key, text, model);
    return { text, cached: false, fallback: false };
  } catch (error) {
    console.error('Counselor Brie narrative generation failed:', error);
    return { text: fallback, cached: false, fallback: true };
  }
}

async function buildPlan(c: GuidanceContext, examType: string, subjectId: string, forceNarrative: boolean) {
  const userId = c.get('userId');
  const [goalRow, completed, snapshot, roadmap] = await Promise.all([
    c.env.DB.prepare(`
      SELECT * FROM user_goals WHERE user_id = ? AND exam_type = ? AND subject_id = ?
    `).bind(userId, examType, subjectId).first<UserGoalRow>(),
    c.env.DB.prepare(`
      SELECT readiness_score, completed_early, completed_at
      FROM guidance_sessions
      WHERE user_id = ? AND exam_type = ? AND subject_id = ? AND status = 'completed'
      ORDER BY completed_at DESC LIMIT 1
    `).bind(userId, examType, subjectId).first<{ readiness_score: number; completed_early: number; completed_at: string | null }>(),
    getEvidenceSnapshot(c.env.DB, userId, subjectId),
    getRoadmap(c.env.DB, userId, examType, subjectId),
  ]);
  let readiness = 0;
  let readinessSource: 'assessment' | 'mastery' | 'none' = 'none';
  if (completed?.readiness_score !== null && completed?.readiness_score !== undefined) {
    readiness = Number(completed.readiness_score);
    readinessSource = 'assessment';
  } else if (snapshot.evidenceCount >= SKIP_THRESHOLD) {
    readiness = await getMasteryReadiness(c.env.DB, userId, subjectId);
    readinessSource = 'mastery';
  }
  const goal = goalRow ? mapGoal(goalRow) : null;
  const strongest = roadmap.length > 0 ? [...roadmap].sort((a, b) => b.masteryScore - a.masteryScore)[0].topicName : null;
  const weakest = roadmap[0]?.topicName ?? null;
  const generic = await getGenericNarrative(c, { examType, subjectId, readiness, confidence: snapshot.confidence }, forceNarrative);
  return {
    goal,
    readiness,
    readinessSource,
    readinessBand: Math.floor(readiness / 10) * 10,
    roadmap,
    thisWeek: roadmap.slice(0, 3),
    narrative: personalizeNarrative(generic.text, goal, strongest, weakest),
    narrativeCached: generic.cached,
    fallback: generic.fallback,
    ...assessmentMetadata(snapshot, Boolean(completed?.completed_early)),
  };
}

export const guidanceApp = new Hono<{ Bindings: Env; Variables: Variables }>();

guidanceApp.use('*', async (c, next) => {
  // Fail closed unless the Worker environment explicitly enables the API.
  if (c.env.COUNSELOR_BRIE_ENABLED?.trim().toLowerCase() !== 'true') {
    return c.json({ success: false, error: 'Counselor Brie is not available' }, 404);
  }
  return next();
});
guidanceApp.use('*', requireAuth);
guidanceApp.use('*', async (c, next) => {
  if (c.get('userRole') !== 'student') return c.json({ success: false, error: 'Student access required' }, 403);
  return next();
});

guidanceApp.post('/goals', async (c) => {
  const validation = validateGoalBody(await jsonBody(c));
  if (!validation.ok) return c.json({ success: false, error: validation.error }, 400);
  const goal = validation.value;
  if (!await validateSubjectCompatibility(c.env.DB, goal.examType, goal.subjectId)) {
    return c.json({ success: false, error: 'subjectId is not available for this examType' }, 400);
  }
  const id = newId('goal');
  await c.env.DB.prepare(`
    INSERT INTO user_goals (
      id, user_id, exam_type, subject_id, target_grade, exam_year, exam_month,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id, exam_type, subject_id) DO UPDATE SET
      target_grade = excluded.target_grade,
      exam_year = excluded.exam_year,
      exam_month = excluded.exam_month,
      updated_at = datetime('now')
  `).bind(id, c.get('userId'), goal.examType, goal.subjectId, goal.targetGrade, goal.examYear, goal.examMonth).run();
  const row = await c.env.DB.prepare(`
    SELECT * FROM user_goals WHERE user_id = ? AND exam_type = ? AND subject_id = ?
  `).bind(c.get('userId'), goal.examType, goal.subjectId).first<UserGoalRow>();
  return c.json({ success: true, data: { goal: row ? mapGoal(row) : { id, ...goal, updatedAt: new Date().toISOString() } } });
});

guidanceApp.get('/goals', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM user_goals WHERE user_id = ? ORDER BY updated_at DESC
  `).bind(c.get('userId')).all<UserGoalRow>();
  return c.json({ success: true, data: { goals: results.map(mapGoal) } });
});

guidanceApp.post('/assessment/start', async (c) => {
  const body = await jsonBody(c);
  const examType = normalizeExamType(body.examType);
  const subjectId = typeof body.subjectId === 'string' ? body.subjectId.trim() : '';
  const forceRetake = body.forceRetake === true;
  if (!examType || !subjectId) return c.json({ success: false, error: 'examType and subjectId are required' }, 400);
  if (!await validateSubjectCompatibility(c.env.DB, examType, subjectId)) {
    return c.json({ success: false, error: 'subjectId is not available for this examType' }, 400);
  }
  const userId = c.get('userId');
  const active = await c.env.DB.prepare(`
    SELECT * FROM guidance_sessions
    WHERE user_id = ? AND exam_type = ? AND subject_id = ? AND status = 'in_progress'
    ORDER BY created_at DESC LIMIT 1
  `).bind(userId, examType, subjectId).first<SessionRow>();

  if (active && !forceRetake) {
    const envelope = parseEnvelope(active.questions);
    const pending = envelope.pendingQuestionId ? await questionById(c.env.DB, envelope.pendingQuestionId) : null;
    const snapshot = await getEvidenceSnapshot(c.env.DB, userId, subjectId);
    if (!pending) {
      const readiness = computeWeightedReadiness(envelope.asked);
      const completedEarly = envelope.asked.length < ASSESSMENT_TARGET;
      await c.env.DB.prepare(`
        UPDATE guidance_sessions SET status = 'completed', readiness_score = ?,
          completed_early = ?, version = version + 1, updated_at = datetime('now'),
          completed_at = datetime('now')
        WHERE id = ? AND version = ? AND status = 'in_progress'
      `).bind(readiness, completedEarly ? 1 : 0, active.id, active.version).run();
      await upsertExamReadiness(c.env.DB, userId, examType, subjectId, readiness);
      return c.json({ success: true, data: {
        sessionId: active.id, version: active.version + 1, askedSoFar: envelope.asked.length,
        target: ASSESSMENT_TARGET,
        done: { readiness, ...assessmentMetadata(snapshot, completedEarly) },
        ...assessmentMetadata(snapshot, completedEarly),
      } });
    }
    return c.json({ success: true, data: {
      sessionId: active.id, version: active.version,
      nextQuestion: publicQuestion(pending), askedSoFar: envelope.asked.length,
      target: ASSESSMENT_TARGET, ...assessmentMetadata(snapshot, false),
    } });
  }

  if (!forceRetake) {
    const completedSession = await c.env.DB.prepare(`
      SELECT * FROM guidance_sessions
      WHERE user_id = ? AND exam_type = ? AND subject_id = ? AND status = 'completed'
      ORDER BY completed_at DESC LIMIT 1
    `).bind(userId, examType, subjectId).first<SessionRow>();
    if (completedSession) {
      const completedEnvelope = parseEnvelope(completedSession.questions);
      const snapshot = await getEvidenceSnapshot(c.env.DB, userId, subjectId);
      const readiness = Number(completedSession.readiness_score ?? computeWeightedReadiness(completedEnvelope.asked));
      return c.json({ success: true, data: {
        sessionId: completedSession.id,
        version: completedSession.version,
        askedSoFar: completedEnvelope.asked.length,
        target: ASSESSMENT_TARGET,
        done: {
          readiness,
          ...assessmentMetadata(snapshot, Boolean(completedSession.completed_early)),
        },
        ...assessmentMetadata(snapshot, Boolean(completedSession.completed_early)),
      } });
    }
  }

  if (forceRetake) {
    const latest = await c.env.DB.prepare(`
      SELECT created_at FROM guidance_sessions
      WHERE user_id = ? AND exam_type = ? AND subject_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(userId, examType, subjectId).first<{ created_at: string }>();
    if (latest) {
      const elapsed = Math.floor((Date.now() - new Date(latest.created_at).getTime()) / 1000);
      if (Number.isFinite(elapsed) && elapsed < RETAKE_COOLDOWN_SECONDS) {
        return c.json({
          success: false,
          error: 'Your next level-check retake is not ready yet.',
          code: 'RETAKE_COOLDOWN',
          retryAfterSeconds: RETAKE_COOLDOWN_SECONDS - Math.max(0, elapsed),
        }, 429);
      }
    }
    if (active) {
      await c.env.DB.prepare(`
        UPDATE guidance_sessions SET status = 'abandoned', version = version + 1,
          updated_at = datetime('now') WHERE id = ? AND version = ? AND status = 'in_progress'
      `).bind(active.id, active.version).run();
    }
  } else {
    const snapshot = await getEvidenceSnapshot(c.env.DB, userId, subjectId);
    if (snapshot.evidenceCount >= SKIP_THRESHOLD) {
      const readiness = await getMasteryReadiness(c.env.DB, userId, subjectId);
      await upsertExamReadiness(c.env.DB, userId, examType, subjectId, readiness);
      return c.json({ success: true, data: {
        skip: true, readiness, source: 'mastery' as const,
        ...assessmentMetadata(snapshot, false),
      } });
    }
  }

  const envelope: SessionEnvelope = {
    asked: [], topicQueue: await topicQueue(c.env.DB, subjectId),
    currentDifficulty: 'medium', pendingQuestionId: null, pendingOrdinal: 0,
  };
  const first = await pickQuestion(c.env.DB, examType, subjectId, envelope);
  envelope.pendingQuestionId = first?.id ?? null;
  const sessionId = newId('guidance');
  const completedEarly = first ? 0 : 1;
  await c.env.DB.prepare(`
    INSERT INTO guidance_sessions (
      id, user_id, exam_type, subject_id, status, version, algorithm_version,
      questions, readiness_score, completed_early, created_at, updated_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)
  `).bind(
    sessionId, userId, examType, subjectId, first ? 'in_progress' : 'completed',
    ALGORITHM_VERSION, JSON.stringify(envelope), first ? null : 0, completedEarly,
    first ? null : new Date().toISOString(),
  ).run();
  if (!first) await upsertExamReadiness(c.env.DB, userId, examType, subjectId, 0);
  const snapshot = await getEvidenceSnapshot(c.env.DB, userId, subjectId);
  return c.json({ success: true, data: first ? {
    sessionId, version: 1,
    nextQuestion: publicQuestion(first), askedSoFar: 0, target: ASSESSMENT_TARGET,
    ...assessmentMetadata(snapshot, false),
  } : {
    sessionId, version: 1,
    askedSoFar: 0, target: ASSESSMENT_TARGET,
    done: { readiness: 0, ...assessmentMetadata(snapshot, true) },
    ...assessmentMetadata(snapshot, true),
  } });
});

guidanceApp.post('/assessment/:sessionId/answer', async (c) => {
  const sessionId = c.req.param('sessionId');
  const body = await jsonBody(c);
  const questionId = typeof body.questionId === 'string' ? body.questionId.trim() : '';
  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
  const version = typeof body.version === 'number' ? body.version : Number.NaN;
  const timeTaken = typeof body.timeTaken === 'number' && Number.isFinite(body.timeTaken)
    ? Math.min(3600, Math.max(0, Math.round(body.timeTaken))) : 0;
  if (!questionId || questionId.length > 128 || !answer || answer.length > 1000
    || !idempotencyKey || idempotencyKey.length > 128 || !Number.isInteger(version) || version < 1) {
    return c.json({ success: false, error: 'questionId, answer, version, and idempotencyKey are required and must be within limits' }, 400);
  }
  const userId = c.get('userId');
  const replay = await c.env.DB.prepare(`
    SELECT gsa.is_correct, gsa.question_id, q.explanation
    FROM guidance_session_answers gsa
    JOIN guidance_sessions gs ON gs.id = gsa.session_id
    JOIN questions q ON q.id = gsa.question_id
    JOIN topics t ON t.id = q.topic_id AND t.subject_id = q.subject_id
    JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
    WHERE gsa.session_id = ? AND gsa.idempotency_key = ? AND gs.user_id = ?
  `).bind(sessionId, idempotencyKey, userId).first<{ is_correct: number; question_id: string; explanation: string | null }>();
  if (replay) {
    if (replay.question_id !== questionId) return c.json({ success: false, error: 'Idempotency key was used for another question' }, 409);
    const session = await c.env.DB.prepare(`SELECT * FROM guidance_sessions WHERE id = ?`).bind(sessionId).first<SessionRow>();
    if (!session) return c.json({ success: false, error: 'Assessment session not found' }, 404);
    const envelope = parseEnvelope(session.questions);
    const snapshot = await getEvidenceSnapshot(c.env.DB, userId, session.subject_id);
    const pending = envelope.pendingQuestionId ? await questionById(c.env.DB, envelope.pendingQuestionId) : null;
    return c.json({ success: true, data: {
      correct: replay.is_correct === 1, explanation: replay.explanation,
      version: session.version,
      runningEstimate: computeWeightedReadiness(envelope.asked), askedSoFar: envelope.asked.length,
      idempotent: true,
      ...(session.status === 'completed'
        ? { done: { readiness: Number(session.readiness_score ?? 0), ...assessmentMetadata(snapshot, Boolean(session.completed_early)) } }
        : { nextQuestion: pending ? publicQuestion(pending) : null }),
    } });
  }

  const session = await c.env.DB.prepare(`
    SELECT * FROM guidance_sessions WHERE id = ? AND user_id = ?
  `).bind(sessionId, userId).first<SessionRow>();
  if (!session) return c.json({ success: false, error: 'Assessment session not found' }, 404);
  if (session.status !== 'in_progress') return c.json({ success: false, error: 'Assessment session is not active' }, 409);
  const envelope = parseEnvelope(session.questions);
  if (version !== session.version) {
    return c.json({ success: false, error: 'Assessment session version is stale', code: 'STALE_SESSION' }, 409);
  }
  if (envelope.pendingQuestionId !== questionId) {
    return c.json({ success: false, error: 'Question is stale or out of order' }, 409);
  }
  const question = await questionById(c.env.DB, questionId);
  if (!question || question.subject_id !== session.subject_id) {
    return c.json({ success: false, error: 'Question is not eligible for this assessment' }, 409);
  }
  const correct = isAnswerCorrect(question.correct_answer, answer, question.options, question.question_type);
  const answered: AskedAnswer = {
    questionId, topicId: question.topic_id, difficulty: question.difficulty,
    isCorrect: correct ? 1 : 0, timeTaken,
  };
  envelope.asked.push(answered);
  envelope.currentDifficulty = stepDifficulty(question.difficulty, correct);
  envelope.pendingOrdinal = envelope.asked.length;
  const next = envelope.asked.length < ASSESSMENT_TARGET
    ? await pickQuestion(c.env.DB, session.exam_type, session.subject_id, envelope)
    : null;
  envelope.pendingQuestionId = next?.id ?? null;
  const done = envelope.asked.length >= ASSESSMENT_TARGET || !next;
  const completedEarly = done && envelope.asked.length < ASSESSMENT_TARGET;
  const readiness = computeWeightedReadiness(envelope.asked);
  const prepared = await prepareAttemptProgress(c.env.DB, {
    userId, questionId, topicId: question.topic_id,
    examTypeId: question.exam_type_id ?? null,
    userAnswer: answer, isCorrect: correct, timeTaken,
    points: question.points ?? 3,
  });
  const guidanceAnswerId = newId('guidance_answer');
  const answerOrdinal = envelope.asked.length - 1;
  const answerInsert = c.env.DB.prepare(GUIDANCE_ANSWER_INSERT_SQL).bind(
    guidanceAnswerId, sessionId, userId, session.version,
    answerOrdinal, questionId, answer, correct ? 1 : 0,
    timeTaken, question.difficulty, question.topic_id, idempotencyKey, prepared.attemptId,
  );
  const sessionUpdate = c.env.DB.prepare(`
    UPDATE guidance_sessions SET questions = ?, version = version + 1,
      status = ?, readiness_score = ?, completed_early = ?, updated_at = datetime('now'),
      completed_at = ?
    WHERE id = ? AND user_id = ? AND version = ? AND status = 'in_progress'
  `).bind(
    JSON.stringify(envelope), done ? 'completed' : 'in_progress', readiness,
    completedEarly ? 1 : 0, done ? new Date().toISOString() : null,
    sessionId, userId, session.version,
  );
  try {
    await c.env.DB.batch([...prepared.statements, answerInsert, sessionUpdate]);
  } catch (error) {
    const duplicate = await c.env.DB.prepare(`
      SELECT question_id FROM guidance_session_answers
      WHERE session_id = ? AND idempotency_key = ?
    `).bind(sessionId, idempotencyKey).first<{ question_id: string }>();
    if (duplicate?.question_id === questionId) {
      return c.json({ success: false, error: 'Answer was already accepted; retry the request to retrieve it', code: 'IDEMPOTENT_REPLAY' }, 409);
    }
    console.error('Counselor Brie atomic answer write failed:', error);
    return c.json({ success: false, error: 'Answer could not be saved safely' }, 409);
  }
  if (done) await upsertExamReadiness(c.env.DB, userId, session.exam_type, session.subject_id, readiness);
  const snapshot = await getEvidenceSnapshot(c.env.DB, userId, session.subject_id);
  return c.json({ success: true, data: {
    correct, explanation: question.explanation ?? null,
    version: session.version + 1,
    runningEstimate: readiness, askedSoFar: envelope.asked.length, idempotent: false,
    ...(done
      ? { done: { readiness, ...assessmentMetadata(snapshot, completedEarly) } }
      : { nextQuestion: next ? publicQuestion(next) : null }),
  } });
});

guidanceApp.get('/plan', async (c) => {
  const examType = normalizeExamType(c.req.query('examType'));
  const subjectId = c.req.query('subjectId')?.trim() ?? '';
  if (!examType || !subjectId) return c.json({ success: false, error: 'examType and subjectId are required' }, 400);
  if (!await validateSubjectCompatibility(c.env.DB, examType, subjectId)) {
    return c.json({ success: false, error: 'subjectId is not available for this examType' }, 400);
  }
  return c.json({ success: true, data: { plan: await buildPlan(c, examType, subjectId, false) } });
});

guidanceApp.post('/plan/regenerate', async (c) => {
  if (!await isPremiumUser(c.get('userId'), c.env.DB)) {
    return c.json({
      success: false,
      upgradeRequired: true,
      error: "Brie can refresh your route with Premium when you're ready.",
    }, 403);
  }
  const body = await jsonBody(c);
  const examType = normalizeExamType(body.examType);
  const subjectId = typeof body.subjectId === 'string' ? body.subjectId.trim() : '';
  if (!examType || !subjectId) return c.json({ success: false, error: 'examType and subjectId are required' }, 400);
  if (!await validateSubjectCompatibility(c.env.DB, examType, subjectId)) {
    return c.json({ success: false, error: 'subjectId is not available for this examType' }, 400);
  }
  return c.json({ success: true, data: { plan: await buildPlan(c, examType, subjectId, true) } });
});
