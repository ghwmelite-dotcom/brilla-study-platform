import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';

const JWT_SECRET = 'test-secret-that-is-long-enough';
const STUDENT = { role: 'student', status: 'approved', is_active: 1 };

function makeDb(firstFor: (sql: string) => unknown) {
  const db = {
    prepare: vi.fn((sql: string) => ({
      bind: () => ({
        first: vi.fn().mockImplementation(() => Promise.resolve(firstFor(sql))),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
      }),
    })),
    batch: vi.fn(async () => []),
  } as unknown as D1Database;
  return db;
}

describe('counselor chat on Workers AI', () => {
  it('answers via env.AI chat model with the conversation history preserved', async () => {
    const db = makeDb((sql) => {
      if (sql.includes('WITH usage(total_requests)')) {
        return { request_count: 1, total_requests: 1 };
      }
      if (sql.includes('role, status, is_active')) {
        return STUDENT; // requireAuth user lookup
      }
      return null; // student context, streak, conversation lookups tolerate null
    });
    const aiRun = vi.fn(async () => ({ response: 'Keep going — you are improving.' }));
    const t = await sign(
      { userId: 'student_1', role: 'student', exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
    );
    const res = await worker.fetch(
      new Request('http://x/api/counselor/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'I am stressed about maths', counselorType: 'academic' }),
      }),
      { DB: db, JWT_SECRET, AI: { run: aiRun } as unknown as Ai },
    );
    expect(res.status).toBe(200);
    expect(aiRun).toHaveBeenCalled();
    const model = aiRun.mock.calls[0][0];
    expect(model).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast'); // getChatModel default
    const messages = (aiRun.mock.calls[0][1] as any).messages;
    expect(messages[0].role).toBe('system');
    expect(messages[messages.length - 1]).toEqual({ role: 'user', content: 'I am stressed about maths' });
  });
});
