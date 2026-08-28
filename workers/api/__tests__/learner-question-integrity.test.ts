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

  it('team-battle creation persists only usable selected IDs', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /FROM questions q/,
        all: () => ({ results: [{ id: 'q_good' }] }),
      },
      { match: /INSERT INTO team_battles/ },
      { match: /INSERT INTO team_battle_members/ },
    ]);

    const response = await apiRequest(db, '/api/team-battles/create', {
      subjectId: 'subject_active',
      totalQuestions: 1,
    });
    expect(response.status).toBe(200);

    const selection = db.calls.find((call) => /FROM questions q/.test(call.sql));
    expect(selection?.sql).toMatch(/JOIN topics t ON t\.id = q\.topic_id AND t\.subject_id = q\.subject_id/);
    expect(selection?.sql).toMatch(/JOIN subjects s ON s\.id = q\.subject_id AND s\.is_active = 1/);
    const insert = db.calls.find((call) => /INSERT INTO team_battles/.test(call.sql));
    expect(insert?.binds[5]).toBe('["q_good"]');
    expect(String(insert?.binds[5])).not.toContain('q_quarantined');
  });

  it('team-battle submission rejects an arbitrary ID without reading or leaking its answer', async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /SELECT \* FROM team_battles WHERE id = \? AND status = 'active'/,
        first: () => ({ question_ids: '["q_good"]' }),
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
        match: /SELECT \* FROM team_battles WHERE id = \? AND status = 'active'/,
        first: () => ({ question_ids: '["q_quarantined"]' }),
      },
      {
        match: /SELECT \* FROM team_battle_members WHERE battle_id = \? AND user_id = \?/,
        first: () => ({ team_number: 1 }),
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
  });
});
