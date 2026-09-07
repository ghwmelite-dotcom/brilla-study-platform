import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function authToken() {
  return sign(
    {
      userId: 'student_1',
      role: 'student',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active, session_version FROM users/,
  first: () => ({ role: 'student', status: 'approved', is_active: 1 }),
};

async function apiRequest(db: unknown, path: string, body: object) {
  const token = await authToken();
  return worker.fetch(
    new Request(`http://x${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }),
    { DB: db as D1Database, JWT_SECRET },
  );
}

describe('learner-facing usable question invariant', () => {
  it('Quick Play selects only questions whose topic belongs to the same active subject', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /FROM questions q/,
        all: () => ({
          results: [{
            id: 'q_good',
            question_text: 'Usable',
            options: '["A","B"]',
            difficulty: 'easy',
            topic_name: 'Topic',
            subject_name: 'Subject',
          }],
        }),
      },
      { match: /INSERT INTO quick_play_sessions/ },
      { match: /SELECT multiplier FROM daily_multipliers/, first: () => null },
    ]);

    const response = await apiRequest(db, '/api/quickplay/start', { gameType: 'speed_blitz' });
    expect(response.status).toBe(200);
    const body = await response.json() as { data: { questions: Array<{ id: string }> } };
    expect(body.data.questions.map((question) => question.id)).toEqual(['q_good']);
    expect(JSON.stringify(body)).not.toContain('q_quarantined');

    const selection = db.calls.find((call) => /FROM questions q/.test(call.sql));
    expect(selection?.sql).toMatch(/JOIN topics t ON t\.id = q\.topic_id AND t\.subject_id = q\.subject_id/);
    expect(selection?.sql).toMatch(/JOIN subjects s ON s\.id = q\.subject_id AND s\.is_active = 1/);
    expect(selection?.sql).toMatch(/q\.topic_id IS NOT NULL/);
  });

  it('team-battle start persists only usable selected IDs', async () => {
    // Phase B: sampling moved from /create to captain /start (questions are
    // sampled when the battle actually begins).
    const db = createMockD1([
      authHandler,
      { match: /UPDATE team_battles SET status = 'cancelled'/ },
      {
        match: /SELECT is_captain FROM team_battle_members/,
        first: () => ({ is_captain: 1 }),
      },
      {
        match: /FROM team_battles WHERE id = \? AND status IN/,
        first: () => ({
          id: 'battle_1',
          status: 'waiting',
          total_questions: 1,
          time_per_question: 30,
          question_ids: null,
          subject_id: 'subject_active',
          topic_id: null,
        }),
      },
      {
        match: /GROUP BY team_number/,
        all: () => ({ results: [{ team_number: 1, count: 1 }, { team_number: 2, count: 1 }] }),
      },
      {
        match: /FROM questions q/,
        all: () => ({ results: [{ id: 'q_good' }] }),
      },
      { match: /UPDATE team_battles/ },
    ]);

    const response = await apiRequest(db, '/api/team-battles/battle_1/start', {});
    expect(response.status).toBe(200);

    const selection = db.calls.find((call) => /FROM questions q/.test(call.sql));
    expect(selection?.sql).toMatch(/JOIN topics t ON t\.id = q\.topic_id AND t\.subject_id = q\.subject_id/);
    expect(selection?.sql).toMatch(/JOIN subjects s ON s\.id = q\.subject_id AND s\.is_active = 1/);
    const start = db.calls.find((call) => /UPDATE team_battles/.test(call.sql) && call.sql.includes("status = 'active'"));
    expect(start?.binds[0]).toBe('["q_good"]');
    expect(String(start?.binds[0])).not.toContain('q_quarantined');
  });

  it('team-battle submission rejects an arbitrary ID without reading or leaking its answer', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /SELECT \* FROM team_battles WHERE id = \?/,
        first: () => ({
          id: 'battle_1',
          status: 'active',
          question_ids: '["q_good"]',
          total_questions: 1,
          time_per_question: 30,
          started_at: new Date().toISOString(),
        }),
      },
      {
        match: /SELECT \* FROM team_battle_members WHERE battle_id = \? AND user_id = \?/,
        first: () => ({ team_number: 1 }),
      },
    ]);

    const response = await apiRequest(db, '/api/team-battles/battle_1/answer', {
      questionId: 'q_quarantined',
      answer: 'A',
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain('correctAnswer');
    expect(db.calls.some((call) => /SELECT q\.correct_answer/.test(call.sql))).toBe(false);
    expect(db.calls.some((call) => /UPDATE team_battle/.test(call.sql))).toBe(false);
  });

  it('team-battle grading revalidates selected IDs and fails closed after quarantine', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /SELECT \* FROM team_battles WHERE id = \?/,
        first: () => ({
          id: 'battle_1',
          status: 'active',
          question_ids: '["q_quarantined"]',
          total_questions: 1,
          time_per_question: 30,
          started_at: new Date().toISOString(),
        }),
      },
      {
        match: /SELECT \* FROM team_battle_members WHERE battle_id = \? AND user_id = \?/,
        first: () => ({ team_number: 1 }),
      },
      {
        match: /SELECT id FROM team_battle_answers/,
        first: () => null,
      },
      {
        match: /SELECT q\.correct_answer/,
        first: () => null,
      },
    ]);

    const response = await apiRequest(db, '/api/team-battles/battle_1/answer', {
      questionId: 'q_quarantined',
      answer: 'A',
    });
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain('correctAnswer');
    const grading = db.calls.find((call) => /SELECT q\.correct_answer/.test(call.sql));
    expect(grading?.sql).toMatch(/JOIN topics t ON t\.id = q\.topic_id AND t\.subject_id = q\.subject_id/);
    expect(grading?.sql).toMatch(/JOIN subjects s ON s\.id = q\.subject_id AND s\.is_active = 1/);
    expect(db.calls.some((call) => /UPDATE team_battle/.test(call.sql))).toBe(false);
    expect(db.calls.some((call) => /INSERT INTO team_battle_answers/.test(call.sql))).toBe(false);
  });
});
