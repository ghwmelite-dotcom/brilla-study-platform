import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { sign } from 'hono/jwt';
import { createMockD1, type MockHandler } from './helpers/mockD1';
import {
  ASSESSMENT_TARGET,
  GUIDANCE_ANSWER_INSERT_SQL,
  TARGET_GRADES,
  computeConfidence,
  computeWeightedReadiness,
  isAnswerCorrect,
  guidanceApp,
  normalizeExamType,
  stepDifficulty,
  validateGoalBody,
} from '../guidance';


const JWT_SECRET = 'test-secret-that-is-long-enough';

async function authToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign({ userId: 'user_1', role: 'student', iat: now, exp: now + 3600 }, JWT_SECRET);
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

const subjectHandler: MockHandler = {
  match: /SELECT s.id FROM subjects s/,
  first: () => ({ id: 'subject_1' }),
};

async function guidanceRequest(
  db: ReturnType<typeof createMockD1>,
  path: string,
  init: RequestInit = {},
  extraEnv: Record<string, unknown> = {},
): Promise<Response> {
  const token = await authToken();
  return guidanceApp.request(`http://x${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  }, {
    DB: db as unknown as D1Database,
    JWT_SECRET,
    COUNSELOR_BRIE_ENABLED: 'true',
    ...extraEnv,
  });
}
describe('Counselor Brie canonical validation', () => {
  it('normalizes UI slugs and exposes the corrected Edexcel scales', () => {
    expect(normalizeExamType('cambridge-a-level')).toBe('cambridge_a2');
    expect(normalizeExamType('edexcel-igcse')).toBe('edexcel_igcse');
    expect(TARGET_GRADES.edexcel_igcse).toEqual(['9', '8', '7', '6', '5', '4', '3', '2', '1']);
    expect(TARGET_GRADES.edexcel_as).toEqual(['A*', 'A', 'B', 'C', 'D', 'E']);
  });

  it('rejects invalid goals and a combined exam date in the past', () => {
    expect(validateGoalBody({ examType: 'bogus', subjectId: 's' }).ok).toBe(false);
    expect(validateGoalBody({ examType: 'wassce', subjectId: '', targetGrade: 'A1' }).ok).toBe(false);
    expect(validateGoalBody({ examType: 'wassce', subjectId: 's', targetGrade: 'A2' }).ok).toBe(false);
    expect(validateGoalBody({ examType: 'nsmq', subjectId: 's', targetGrade: 'A1' }).ok).toBe(false);
    expect(validateGoalBody({ examType: 'wassce', subjectId: 's', examYear: 2026, examMonth: 1 }, new Date('2026-08-14T00:00:00Z')).ok).toBe(false);
  });

  it('accepts the safe current/future goal shape', () => {
    const result = validateGoalBody({
      examType: 'edexcel-igcse',
      subjectId: 'subj_edexcel_igcse_math',
      targetGrade: '9',
      examYear: 2027,
      examMonth: 5,
    }, new Date('2026-08-14T00:00:00Z'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.examType).toBe('edexcel_igcse');
  });
});

describe('Counselor Brie objective assessment helpers', () => {
  it('steps difficulty with caps and computes weighted readiness', () => {
    expect(ASSESSMENT_TARGET).toBe(9);
    expect(stepDifficulty('medium', true)).toBe('hard');
    expect(stepDifficulty('expert', true)).toBe('expert');
    expect(stepDifficulty('easy', false)).toBe('easy');
    expect(computeWeightedReadiness([
      { difficulty: 'easy', isCorrect: 1 },
      { difficulty: 'expert', isCorrect: 0 },
    ])).toBe(20);
  });

  it('grades MC by letter or full option text and true/false objectively', () => {
    const options = JSON.stringify(['A. Two', 'B. Four', 'C. Six']);
    expect(isAnswerCorrect('B', 'b', options, 'multiple_choice')).toBe(true);
    expect(isAnswerCorrect('B', 'B. Four', options, 'multiple_choice')).toBe(true);
    expect(isAnswerCorrect('true', ' TRUE ', null, 'true_false')).toBe(true);
  });

  it('reports confidence conservatively from evidence and coverage', () => {
    expect(computeConfidence(3, 0.2)).toBe('low');
    expect(computeConfidence(9, 0.5)).toBe('medium');
    expect(computeConfidence(20, 0.7)).toBe('high');
  });
});

describe('migration 094 safety invariants', () => {
  it('preserves readiness rows/indexes and enforces active-session and answer idempotency', () => {
    const db = new Database(':memory:');
    try {
      db.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE users (id TEXT PRIMARY KEY);
        CREATE TABLE subjects (id TEXT PRIMARY KEY);
        CREATE TABLE topics (id TEXT PRIMARY KEY);
        CREATE TABLE questions (id TEXT PRIMARY KEY);
        CREATE TABLE question_attempts (id TEXT PRIMARY KEY);
        CREATE TABLE learning_recommendations (id TEXT PRIMARY KEY);
        CREATE TABLE exam_readiness (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          exam_type TEXT NOT NULL CHECK (exam_type IN ('wassce', 'bece', 'nsmq')),
          subject_id TEXT REFERENCES subjects(id),
          readiness_score REAL DEFAULT 0,
          topics_mastered INTEGER DEFAULT 0,
          topics_total INTEGER DEFAULT 0,
          weak_topics TEXT,
          strong_topics TEXT,
          last_calculated TEXT DEFAULT (datetime('now')),
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(user_id, exam_type, subject_id)
        );
        CREATE INDEX idx_exam_readiness_user ON exam_readiness(user_id);
        INSERT INTO users (id) VALUES ('u1');
        INSERT INTO subjects (id) VALUES ('s1');
        INSERT INTO topics (id) VALUES ('t1');
        INSERT INTO questions (id) VALUES ('q1');
        INSERT INTO question_attempts (id) VALUES ('qa1'), ('qa2');
        INSERT INTO learning_recommendations (id) VALUES ('lr1');
        INSERT INTO exam_readiness (
          id, user_id, exam_type, subject_id, readiness_score, topics_mastered,
          topics_total, weak_topics, strong_topics, last_calculated, created_at
        ) VALUES ('r1', 'u1', 'wassce', 's1', 64, 1, 2, '["t1"]', '[]',
          '2026-08-14T00:00:00Z', '2026-08-14T00:00:00Z');
      `);
      const migration = readFileSync(
        new URL('../../../database/migrations/094_guidance.sql', import.meta.url),
        'utf8',
      );
      db.exec(migration);

      expect(db.prepare('SELECT readiness_score FROM exam_readiness WHERE id = ?').get('r1'))
        .toEqual({ readiness_score: 64 });
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_exam_readiness_user'").get())
        .toEqual({ name: 'idx_exam_readiness_user' });
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='learning_recommendations'").get())
        .toEqual({ name: 'learning_recommendations' });
      expect(() => db.prepare(`
        INSERT INTO exam_readiness (id, user_id, exam_type, subject_id)
        VALUES ('r2', 'u1', 'edexcel_igcse', NULL)
      `).run()).not.toThrow();
      expect(() => db.prepare(`
        INSERT INTO exam_readiness (id, user_id, exam_type, subject_id)
        VALUES ('r3', 'u1', 'bogus', NULL)
      `).run()).toThrow();

      db.prepare(`
        INSERT INTO guidance_sessions (
          id, user_id, exam_type, subject_id, algorithm_version
        ) VALUES (?, ?, ?, ?, ?)
      `).run('gs1', 'u1', 'wassce', 's1', 'v1');
      expect(() => db.prepare(`
        INSERT INTO guidance_sessions (
          id, user_id, exam_type, subject_id, algorithm_version
        ) VALUES (?, ?, ?, ?, ?)
      `).run('gs2', 'u1', 'wassce', 's1', 'v1')).toThrow();

      db.prepare(`
        INSERT INTO guidance_session_answers (
          id, session_id, ordinal, question_id, user_answer, is_correct,
          difficulty, topic_id, idempotency_key, question_attempt_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('gsa1', 'gs1', 0, 'q1', 'A', 1, 'medium', 't1', 'idem-1', 'qa1');
      expect(() => db.prepare(`
        INSERT INTO guidance_session_answers (
          id, session_id, ordinal, question_id, user_answer, is_correct,
          difficulty, topic_id, idempotency_key, question_attempt_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('gsa2', 'gs1', 1, 'q1', 'A', 1, 'medium', 't1', 'idem-1', 'qa2')).toThrow();
    } finally {
      db.close();
    }
  });
});

describe('Counselor Brie route contracts', () => {
  it('fails closed when disabled and requires authentication when enabled', async () => {
    const db = createMockD1([]);
    const disabled = await guidanceApp.request('http://x/goals', undefined, {
      DB: db as unknown as D1Database,
      JWT_SECRET,
      COUNSELOR_BRIE_ENABLED: 'false',
    });
    expect(disabled.status).toBe(404);

    const unset = await guidanceApp.request('http://x/goals', undefined, {
      DB: db as unknown as D1Database,
      JWT_SECRET,
    });
    expect(unset.status).toBe(404);

    const unauthenticated = await guidanceApp.request('http://x/goals', undefined, {
      DB: db as unknown as D1Database,
      JWT_SECRET,
      COUNSELOR_BRIE_ENABLED: 'true',
    });
    expect(unauthenticated.status).toBe(401);
  });

  it('rejects non-student roles before any guidance data access', async () => {
    const db = createMockD1([{
      match: /SELECT role, status, is_active FROM users/,
      first: () => ({ role: 'parent', status: 'approved', is_active: 1 }),
    }]);
    const response = await guidanceRequest(db, '/goals');
    expect(response.status).toBe(403);
    expect(db.calls.some((call) => /FROM user_goals/.test(call.sql))).toBe(false);
  });

  it('validates before writes and persists a compatible goal', async () => {
    const db = createMockD1([
      authHandler,
      subjectHandler,
      { match: /INSERT INTO user_goals/ },
      {
        match: /SELECT \* FROM user_goals/,
        first: () => ({
          id: 'goal_1', exam_type: 'wassce', subject_id: 'subject_1',
          target_grade: 'A1', exam_year: 2027, exam_month: 5,
          updated_at: '2026-08-14T00:00:00Z',
        }),
      },
    ]);
    const bad = await guidanceRequest(db, '/goals', {
      method: 'POST',
      body: JSON.stringify({ examType: 'wassce', subjectId: 'subject_1', targetGrade: 'A2' }),
    });
    expect(bad.status).toBe(400);
    expect(db.calls.some((call) => /INSERT INTO user_goals/.test(call.sql))).toBe(false);

    const saved = await guidanceRequest(db, '/goals', {
      method: 'POST',
      body: JSON.stringify({
        examType: 'wassce', subjectId: 'subject_1', targetGrade: 'A1',
        examYear: 2027, examMonth: 5,
      }),
    });
    expect(saved.status).toBe(200);
    const payload = await saved.json() as {
      data: { goal: { examType: string; targetGrade: string; examMonth: number } };
    };
    expect(payload.data.goal).toMatchObject({ examType: 'wassce', targetGrade: 'A1', examMonth: 5 });
    const insert = db.calls.find((call) => /INSERT INTO user_goals/.test(call.sql));
    expect(insert?.sql).toContain('ON CONFLICT(user_id, exam_type, subject_id) DO UPDATE SET');
  });

  it('resumes the active assessment without leaking held answers', async () => {
    const envelope = JSON.stringify({
      asked: [], topicQueue: ['topic_1'], currentDifficulty: 'medium',
      pendingQuestionId: 'q_1', pendingOrdinal: 0,
    });
    const db = createMockD1([
      authHandler,
      subjectHandler,
      {
        match: /SELECT \* FROM guidance_sessions/,
        first: () => ({
          id: 'gs_1', user_id: 'user_1', exam_type: 'wassce', subject_id: 'subject_1',
          status: 'in_progress', version: 3, algorithm_version: 'brie-readiness-v1',
          questions: envelope, readiness_score: null, completed_early: 0,
          created_at: '2026-08-14T00:00:00Z', updated_at: '2026-08-14T00:00:00Z',
          completed_at: null,
        }),
      },
      {
        match: /WHERE q.id = \?/,
        first: () => ({
          id: 'q_1', topic_id: 'topic_1', subject_id: 'subject_1',
          exam_type_id: 'exam_wassce', question_text: 'Two plus two?',
          question_type: 'multiple_choice', options: '["3","4"]',
          correct_answer: 'B', explanation: 'It is four.', difficulty: 'medium',
          points: 3, topic_name: 'Number',
        }),
      },
      {
        match: /SELECT COUNT\(\*\) AS count, MAX\(qa.created_at\) AS freshness/,
        first: () => ({ count: 0, freshness: null }),
      },
      {
        match: /COUNT\(DISTINCT t.id\) AS total/,
        first: () => ({ total: 2, covered: 0 }),
      },
    ]);
    const response = await guidanceRequest(db, '/assessment/start', {
      method: 'POST', body: JSON.stringify({ examType: 'wassce', subjectId: 'subject_1' }),
    });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain('correct_answer');
    expect(text).not.toContain('It is four.');
    const payload = JSON.parse(text) as { data: { sessionId: string; version: number; nextQuestion: { id: string } } };
    expect(payload.data).toMatchObject({ sessionId: 'gs_1', version: 3 });
    expect(payload.data.nextQuestion.id).toBe('q_1');
    expect(db.calls.some((call) => /INSERT INTO guidance_sessions/.test(call.sql))).toBe(false);
  });


  it('returns the completed assessment unless an explicit cooldown-protected retake is requested', async () => {
    const db = createMockD1([
      authHandler,
      subjectHandler,
      {
        match: /status = 'in_progress'/,
        first: () => null,
      },
      {
        match: /status = 'completed'/,
        first: () => ({
          id: 'gs_done', user_id: 'user_1', exam_type: 'wassce', subject_id: 'subject_1',
          status: 'completed', version: 10, algorithm_version: 'brie-readiness-v1',
          questions: JSON.stringify({
            asked: [{ questionId: 'q_1', topicId: 'topic_1', difficulty: 'medium', isCorrect: 1, timeTaken: 4 }],
            topicQueue: [], currentDifficulty: 'hard', pendingQuestionId: null, pendingOrdinal: 1,
          }),
          readiness_score: 100, completed_early: 1,
          created_at: '2026-08-14T00:00:00Z', updated_at: '2026-08-14T00:01:00Z',
          completed_at: '2026-08-14T00:01:00Z',
        }),
      },
      {
        match: /MAX/,
        first: () => ({ count: 1, freshness: '2026-08-14T00:01:00Z' }),
      },
      {
        match: /covered/,
        first: () => ({ total: 2, covered: 1 }),
      },
    ]);
    const response = await guidanceRequest(db, '/assessment/start', {
      method: 'POST', body: JSON.stringify({ examType: 'wassce', subjectId: 'subject_1' }),
    });
    expect(response.status).toBe(200);
    const payload = await response.json() as { data: { sessionId: string; version: number; done: { readiness: number } } };
    expect(payload.data).toMatchObject({ sessionId: 'gs_done', version: 10, done: { readiness: 100 } });
    expect(db.calls.some((call) => /INSERT INTO guidance_sessions/.test(call.sql))).toBe(false);
  });

  it('requires the client session version and rejects stale answer state before question access', async () => {
    const missingVersionDb = createMockD1([authHandler]);
    const missing = await guidanceRequest(missingVersionDb, '/assessment/gs_1/answer', {
      method: 'POST',
      body: JSON.stringify({ questionId: 'q_1', answer: 'B', idempotencyKey: 'idem-missing' }),
    });
    expect(missing.status).toBe(400);

    const staleDb = createMockD1([
      authHandler,
      { match: /FROM guidance_session_answers gsa/, first: () => null },
      {
        match: /SELECT .* FROM guidance_sessions WHERE id/,
        first: () => ({
          id: 'gs_1', user_id: 'user_1', exam_type: 'wassce', subject_id: 'subject_1',
          status: 'in_progress', version: 3, algorithm_version: 'brie-readiness-v1',
          questions: JSON.stringify({
            asked: [], topicQueue: ['topic_1'], currentDifficulty: 'medium',
            pendingQuestionId: 'q_1', pendingOrdinal: 0,
          }),
          readiness_score: null, completed_early: 0,
          created_at: '2026-08-14T00:00:00Z', updated_at: '2026-08-14T00:00:00Z',
          completed_at: null,
        }),
      },
    ]);
    const stale = await guidanceRequest(staleDb, '/assessment/gs_1/answer', {
      method: 'POST',
      body: JSON.stringify({
        questionId: 'q_1', answer: 'B', version: 2, idempotencyKey: 'idem-stale',
      }),
    });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ code: 'STALE_SESSION' });
    expect(staleDb.calls.some((call) => call.sql.includes('WHERE q.id ='))).toBe(false);
  });
  it('makes a stale or abandoned session fail the answer insert so its D1 batch rolls back', () => {
    const db = new Database(':memory:');
    try {
      db.exec(`
        CREATE TABLE guidance_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          version INTEGER NOT NULL,
          status TEXT NOT NULL
        );
        CREATE TABLE guidance_session_answers (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          ordinal INTEGER NOT NULL,
          question_id TEXT NOT NULL,
          user_answer TEXT NOT NULL,
          is_correct INTEGER NOT NULL,
          time_taken INTEGER NOT NULL,
          difficulty TEXT NOT NULL,
          topic_id TEXT,
          idempotency_key TEXT NOT NULL,
          question_attempt_id TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        INSERT INTO guidance_sessions (id, user_id, version, status)
        VALUES ('gs_1', 'user_1', 3, 'in_progress');
      `);
      const insert = db.prepare(GUIDANCE_ANSWER_INSERT_SQL);
      const values = ['answer_1', 'gs_1', 'user_1', 2, 0, 'q_1', 'B', 1, 4, 'medium', null, 'idem_1', 'attempt_1'];
      expect(() => insert.run(...values)).toThrow(/NOT NULL/);
      expect(db.prepare('SELECT COUNT(*) AS count FROM guidance_session_answers').get()).toEqual({ count: 0 });

      db.prepare("UPDATE guidance_sessions SET status = 'abandoned' WHERE id = 'gs_1'").run();
      values[3] = 3;
      expect(() => insert.run(...values)).toThrow(/NOT NULL/);
      expect(db.prepare('SELECT COUNT(*) AS count FROM guidance_session_answers').get()).toEqual({ count: 0 });
    } finally {
      db.close();
    }
  });

  it('replays an accepted idempotency key without creating another attempt', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /FROM guidance_session_answers gsa/,
        first: () => ({ is_correct: 1, question_id: 'q_1', explanation: 'Four.' }),
      },
      {
        match: /SELECT \* FROM guidance_sessions WHERE id = \?/,
        first: () => ({
          id: 'gs_1', user_id: 'user_1', exam_type: 'wassce', subject_id: 'subject_1',
          status: 'completed', version: 2, algorithm_version: 'brie-readiness-v1',
          questions: JSON.stringify({
            asked: [{ questionId: 'q_1', topicId: 'topic_1', difficulty: 'medium', isCorrect: 1, timeTaken: 3 }],
            topicQueue: [], currentDifficulty: 'hard', pendingQuestionId: null, pendingOrdinal: 1,
          }),
          readiness_score: 100, completed_early: 1, created_at: '2026-08-14T00:00:00Z',
          updated_at: '2026-08-14T00:00:00Z', completed_at: '2026-08-14T00:01:00Z',
        }),
      },
      {
        match: /SELECT COUNT\(\*\) AS count, MAX\(qa.created_at\) AS freshness/,
        first: () => ({ count: 1, freshness: '2026-08-14T00:01:00Z' }),
      },
      {
        match: /COUNT\(DISTINCT t.id\) AS total/,
        first: () => ({ total: 1, covered: 1 }),
      },
    ]);
    const response = await guidanceRequest(db, '/assessment/gs_1/answer', {
      method: 'POST',
      body: JSON.stringify({ questionId: 'q_1', answer: 'B', version: 1, idempotencyKey: 'idem-1' }),
    });
    expect(response.status).toBe(200);
    const payload = await response.json() as { data: { idempotent: boolean; done: { readiness: number } } };
    expect(payload.data.idempotent).toBe(true);
    expect(payload.data.done.readiness).toBe(100);
    expect(db.calls.some((call) => /INSERT INTO question_attempts/.test(call.sql))).toBe(false);
  });

  it('returns the nested plan with honest evidence metadata and canonical hrefs', async () => {
    const db = createMockD1([
      authHandler,
      subjectHandler,
      { match: /SELECT \* FROM user_goals/, first: () => null },
      {
        match: /SELECT readiness_score, completed_early, completed_at/,
        first: () => ({ readiness_score: 63, completed_early: 0, completed_at: '2026-08-14T00:00:00Z' }),
      },
      {
        match: /SELECT COUNT\(\*\) AS count, MAX\(qa.created_at\) AS freshness/,
        first: () => ({ count: 9, freshness: '2026-08-14T00:00:00Z' }),
      },
      {
        match: /COUNT\(DISTINCT t.id\) AS total/,
        first: () => ({ total: 2, covered: 1 }),
      },
      {
        match: /SELECT t.id AS topic_id/,
        all: () => ({ results: [{
          topic_id: 'topic 1', topic_name: 'Algebra', display_order: 1,
          mastery_score: 25, questions_attempted: 4,
        }] }),
      },
    ]);
    const response = await guidanceRequest(db, '/plan?examType=wassce&subjectId=subject_1');
    expect(response.status).toBe(200);
    const payload = await response.json() as {
      data: { plan: {
        readiness: number; evidenceCount: number; confidence: string;
        algorithmVersion: string; completedEarly: boolean;
        topicCoverage: { covered: number; total: number; ratio: number };
        roadmap: Array<{ href: string }>;
      } };
    };
    expect(payload.data.plan).toMatchObject({
      readiness: 63, evidenceCount: 9, confidence: 'medium',
      algorithmVersion: 'brie-readiness-v1', completedEarly: false,
      topicCoverage: { covered: 1, total: 2, ratio: 0.5 },
    });
    expect(payload.data.plan.roadmap[0].href)
      .toBe('/revision-classroom?exam=wassce&subject=subject_1&topic=topic%201');
  });
});
