import { describe, expect, it } from "vitest";
import { sign } from "hono/jwt";
import worker from "../index";
import { createMockD1, type MockD1, type MockHandler } from "./helpers/mockD1";

const JWT_SECRET = "practice-session-integrity-secret-long-enough";
const USER_ID = "student_owner";

const authHandler: MockHandler = {
  match:
    /SELECT role, status, is_active, session_version FROM users WHERE id = \?/,
  first: () => ({
    role: "student",
    status: "approved",
    is_active: 1,
    session_version: 0,
  }),
};
const subjectHandler: MockHandler = {
  match: /SELECT id FROM subjects WHERE id = \? AND is_active = 1/,
  first: ([id]) => (id === "subj_math" ? { id } : null),
};
const topicHandler: MockHandler = {
  match: /SELECT subject_id FROM topics WHERE id = \?/,
  first: ([id]) =>
    id === "topic_algebra" ? { subject_id: "subj_math" } : null,
};
const openRateLimitHandlers: MockHandler[] = [
  {
    match: /WITH usage\(total_requests\)[\s\S]*INSERT INTO rate_limits/,
    first: () => ({ request_count: 1, total_requests: 1 }),
  },
];

async function authorization(userId = USER_ID): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return `Bearer ${await sign(
    {
      userId,
      role: "student",
      email: `${userId}@example.test`,
      sessionVersion: 0,
      iat: now,
      exp: now + 3_600,
    },
    JWT_SECRET,
  )}`;
}

async function post(
  db: MockD1,
  body: unknown,
  userId = USER_ID,
): Promise<Response> {
  return worker.fetch(
    new Request("http://x/api/practice/sessions", {
      method: "POST",
      headers: {
        Authorization: await authorization(userId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
    { DB: db as unknown as D1Database, JWT_SECRET },
  );
}

const attemptRows = [
  {
    id: "attempt_1",
    is_correct: 1,
    points_earned: 3,
    time_taken: 7,
    subject_id: "subj_math",
    topic_id: "topic_algebra",
    session_id: null,
  },
  {
    id: "attempt_2",
    is_correct: 0,
    points_earned: 0,
    time_taken: 5,
    subject_id: "subj_math",
    topic_id: "topic_algebra",
    session_id: null,
  },
];

const validBody = {
  mode: "topic_drill",
  subjectId: "subj_math",
  topicId: "topic_algebra",
  clientRequestId: "request_1",
  attemptIds: ["attempt_1", "attempt_2"],
};

interface StoredReplay {
  id: string;
  request_fingerprint: string;
  questions_count: number;
  correct_count: number;
  total_time: number;
  score: number;
}

function successfulDb(rows = attemptRows): {
  db: MockD1;
  getStored: () => StoredReplay | null;
} {
  let stored: StoredReplay | null = null;
  const handlers: MockHandler[] = [
    authHandler,
    {
      match:
        /FROM practice_sessions\s+WHERE user_id = \? AND client_request_id = \?/,
      first: () => stored,
    },
    subjectHandler,
    topicHandler,
    { match: /FROM question_attempts qa/, all: () => ({ results: rows }) },
    ...openRateLimitHandlers,
    {
      match: /INSERT INTO practice_sessions/,
      run: (binds) => {
        stored = {
          id: String(binds[0]),
          request_fingerprint: String(binds[12]),
          questions_count: Number(binds[5]),
          correct_count: Number(binds[6]),
          total_time: Number(binds[7]),
          score: Number(binds[8]),
        };
        return { success: true, meta: { changes: 1 } };
      },
    },
    {
      match: /INSERT INTO practice_session_attempts/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
  ];
  return { db: createMockD1(handlers), getStored: () => stored };
}

describe("POST /api/practice/sessions integrity boundary", () => {
  it("replays the same client request with one session row and the original derived result", async () => {
    const { db, getStored } = successfulDb();

    const first = await post(db, validBody);
    const second = await post(db, validBody);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstPayload = (await first.json()) as {
      data: { id: string; idempotent: boolean };
    };
    const replayPayload = (await second.json()) as {
      data: { id: string; idempotent: boolean };
    };
    expect(replayPayload.data).toMatchObject({
      id: firstPayload.data.id,
      idempotent: true,
    });
    expect(getStored()?.id).toBe(firstPayload.data.id);
    expect(
      db.calls.filter(({ sql }) => /INSERT INTO practice_sessions/.test(sql)),
    ).toHaveLength(1);
    expect(
      db.calls.filter(({ sql }) =>
        /INSERT INTO practice_session_attempts/.test(sql),
      ),
    ).toHaveLength(2);
  });

  it("ignores forged client summaries and persists only values derived from owned attempts", async () => {
    const { db } = successfulDb();
    const response = await post(db, {
      ...validBody,
      questionsCount: 999,
      correctCount: 999,
      totalTime: 999_999,
      score: 999_999,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { questionsCount: 2, correctCount: 1, totalTime: 12, score: 3 },
    });
    const insert = db.calls.find(({ sql }) =>
      /INSERT INTO practice_sessions/.test(sql),
    );
    expect(insert?.binds.slice(5, 9)).toEqual([2, 1, 12, 3]);
  });

  it("rejects duplicate, foreign, or missing attempt references with no session insert", async () => {
    const duplicate = successfulDb();
    const duplicateResponse = await post(duplicate.db, {
      ...validBody,
      attemptIds: ["attempt_1", "attempt_1"],
    });
    expect(duplicateResponse.status).toBe(400);
    expect(
      duplicate.db.calls.some(({ sql }) =>
        /INSERT INTO practice_sessions/.test(sql),
      ),
    ).toBe(false);

    const foreign = successfulDb([attemptRows[0]]);
    const foreignResponse = await post(foreign.db, validBody);
    expect(foreignResponse.status).toBe(400);
    expect(
      foreign.db.calls.some(({ sql }) =>
        /INSERT INTO practice_sessions/.test(sql),
      ),
    ).toBe(false);
  });

  it("rejects attempts outside the requested subject or topic", async () => {
    const mismatched = successfulDb([
      attemptRows[0],
      {
        ...attemptRows[1],
        subject_id: "subj_science",
        topic_id: "topic_cells",
      },
    ]);
    const response = await post(mismatched.db, validBody);

    expect(response.status).toBe(400);
    expect(
      mismatched.db.calls.some(({ sql }) =>
        /INSERT INTO practice_sessions/.test(sql),
      ),
    ).toBe(false);
  });

  it("returns 413 before JSON parsing or persistence for an oversized body", async () => {
    const db = createMockD1([authHandler]);
    const response = await worker.fetch(
      new Request("http://x/api/practice/sessions", {
        method: "POST",
        headers: {
          Authorization: await authorization(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...validBody, padding: "x".repeat(40_000) }),
      }),
      { DB: db as unknown as D1Database, JWT_SECRET },
    );

    expect(response.status).toBe(413);
    expect(db.calls).toHaveLength(1);
  });

  it("returns 429 and performs no session insert when the per-user write limit is reached", async () => {
    const handlers: MockHandler[] = [
      authHandler,
      {
        match: /FROM practice_sessions\s+WHERE user_id = \?/,
        first: () => null,
      },
      subjectHandler,
      topicHandler,
      {
        match: /FROM question_attempts qa/,
        all: () => ({ results: attemptRows }),
      },
      {
        match: /WITH usage\(total_requests\)[\s\S]*INSERT INTO rate_limits/,
        first: () => null,
      },
    ];
    const db = createMockD1(handlers);
    const response = await post(db, validBody);

    expect(response.status).toBe(429);
    expect(
      db.calls.some(({ sql }) => /INSERT INTO practice_sessions/.test(sql)),
    ).toBe(false);
    expect(
      db.calls.some(({ sql }) =>
        /INSERT INTO practice_session_attempts/.test(sql),
      ),
    ).toBe(false);
  });
});
