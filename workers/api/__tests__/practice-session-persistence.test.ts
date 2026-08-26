import { describe, expect, it } from "vitest";
import { sign } from "hono/jwt";
import worker from "../index";
import { createMockD1, type MockHandler } from "./helpers/mockD1";

const JWT_SECRET = "practice-session-test-secret-that-is-long-enough";
const AUTHENTICATED_USER_ID = "student_authenticated";

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
const replayHandler: MockHandler = {
  match:
    /FROM practice_sessions\s+WHERE user_id = \? AND client_request_id = \?/,
  first: () => null,
};
const activeSubjectHandler: MockHandler = {
  match: /SELECT id FROM subjects WHERE id = \? AND is_active = 1/,
  first: ([subjectId]) =>
    subjectId === "subj_math" ? { id: "subj_math" } : null,
};
const matchingTopicHandler: MockHandler = {
  match: /SELECT subject_id FROM topics WHERE id = \?/,
  first: ([topicId]) =>
    topicId === "topic_algebra" ? { subject_id: "subj_math" } : null,
};
const attemptRowsHandler: MockHandler = {
  match: /FROM question_attempts qa/,
  all: () => ({
    results: [
      {
        id: "attempt_1",
        is_correct: 1,
        points_earned: 3,
        time_taken: 7,
        subject_id: "subj_math",
        topic_id: "topic_algebra",
        session_id: null,
      },
    ],
  }),
};
const rateLimitHandlers: MockHandler[] = [
  {
    match: /WITH usage\(total_requests\)[\s\S]*INSERT INTO rate_limits/,
    first: () => ({ request_count: 1, total_requests: 1 }),
  },
];
const insertHandler: MockHandler = {
  match: /INSERT INTO practice_sessions/,
  run: () => ({ success: true, meta: { changes: 1 } }),
};
const linkHandler: MockHandler = {
  match: /INSERT INTO practice_session_attempts/,
  run: () => ({ success: true, meta: { changes: 1 } }),
};

async function bearer(userId = AUTHENTICATED_USER_ID): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      userId,
      role: "student",
      email: `${userId}@test.example`,
      sessionVersion: 0,
      iat: now,
      exp: now + 3600,
    },
    JWT_SECRET,
  );
  return `Bearer ${token}`;
}

async function postSession(
  db: ReturnType<typeof createMockD1>,
  body: unknown,
): Promise<Response> {
  return worker.fetch(
    new Request("http://x/api/practice/sessions", {
      method: "POST",
      headers: {
        Authorization: await bearer(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
    { DB: db as D1Database, JWT_SECRET },
  );
}

const validPayload = {
  mode: "topic_drill",
  clientRequestId: "request_1",
  attemptIds: ["attempt_1"],
};

describe("POST /api/practice/sessions persistence boundary", () => {
  it.each([
    ["unknown mode", { ...validPayload, mode: "admin_override" }],
    ["missing client request ID", { ...validPayload, clientRequestId: null }],
    ["zero attempts", { ...validPayload, attemptIds: [] }],
    [
      "too many attempts",
      {
        ...validPayload,
        attemptIds: Array.from({ length: 101 }, (_, i) => `attempt_${i}`),
      },
    ],
    [
      "duplicate attempts",
      { ...validPayload, attemptIds: ["attempt_1", "attempt_1"] },
    ],
    ["invalid attempt ID", { ...validPayload, attemptIds: ["../attempt_1"] }],
    ["invalid subject ID", { ...validPayload, subjectId: "../subj_math" }],
    ["topic without subject", { ...validPayload, topicId: "topic_algebra" }],
  ])(
    "rejects %s with zero persistence side effects",
    async (_label, payload) => {
      const db = createMockD1([authHandler]);
      const response = await postSession(db, payload);

      expect(response.status).toBe(400);
      expect(
        db.calls.some(({ sql }) => /INSERT INTO practice_sessions/.test(sql)),
      ).toBe(false);
      expect(db.calls).toHaveLength(1);
    },
  );

  it("rejects malformed JSON as 400 without preparing an insert", async () => {
    const db = createMockD1([authHandler]);
    const response = await worker.fetch(
      new Request("http://x/api/practice/sessions", {
        method: "POST",
        headers: {
          Authorization: await bearer(),
          "Content-Type": "application/json",
        },
        body: "{not-json",
      }),
      { DB: db as D1Database, JWT_SECRET },
    );

    expect(response.status).toBe(400);
    expect(
      db.calls.some(({ sql }) => /INSERT INTO practice_sessions/.test(sql)),
    ).toBe(false);
  });

  it("binds the verified JWT identity even when the body supplies another userId", async () => {
    const db = createMockD1([
      authHandler,
      replayHandler,
      attemptRowsHandler,
      ...rateLimitHandlers,
      insertHandler,
      linkHandler,
    ]);
    const response = await postSession(db, {
      ...validPayload,
      userId: "student_victim",
    });

    expect(response.status).toBe(200);
    const lookup = db.calls.find(({ sql }) =>
      /FROM question_attempts qa/.test(sql),
    );
    expect(lookup?.binds[0]).toBe(AUTHENTICATED_USER_ID);
    expect(lookup?.binds).not.toContain("student_victim");
    const insert = db.calls.find(({ sql }) =>
      /INSERT INTO practice_sessions/.test(sql),
    );
    expect(insert?.binds[1]).toBe(AUTHENTICATED_USER_ID);
    expect(insert?.binds).not.toContain("student_victim");
  });

  it("saves a valid active-subject topic session with server-derived summary values", async () => {
    const db = createMockD1([
      authHandler,
      replayHandler,
      activeSubjectHandler,
      matchingTopicHandler,
      attemptRowsHandler,
      ...rateLimitHandlers,
      insertHandler,
      linkHandler,
    ]);
    const response = await postSession(db, {
      ...validPayload,
      subjectId: "subj_math",
      topicId: "topic_algebra",
      questionsCount: 999,
      correctCount: 999,
      totalTime: 999,
      score: 999,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { questionsCount: 1, correctCount: 1, totalTime: 7, score: 3 },
    });
    const insert = db.calls.find(({ sql }) =>
      /INSERT INTO practice_sessions/.test(sql),
    );
    expect(insert?.binds.slice(1, 9)).toEqual([
      AUTHENTICATED_USER_ID,
      "topic_drill",
      "subj_math",
      "topic_algebra",
      1,
      1,
      7,
      3,
    ]);
  });

  it("returns 400 and performs no insert when a topic belongs to another subject", async () => {
    const crossSubjectTopicHandler: MockHandler = {
      match: /SELECT subject_id FROM topics WHERE id = \?/,
      first: () => ({ subject_id: "subj_science" }),
    };
    const db = createMockD1([
      authHandler,
      replayHandler,
      ...rateLimitHandlers,
      activeSubjectHandler,
      crossSubjectTopicHandler,
    ]);
    const response = await postSession(db, {
      ...validPayload,
      subjectId: "subj_math",
      topicId: "topic_science_cells",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Topic does not belong to subject",
    });
    expect(
      db.calls.some(({ sql }) => /INSERT INTO practice_sessions/.test(sql)),
    ).toBe(false);
  });

  it("returns 404 with zero writes for unknown or inactive subjects and topics", async () => {
    const missingSubjectDb = createMockD1([
      authHandler,
      replayHandler,
      ...rateLimitHandlers,
      { match: /SELECT id FROM subjects/, first: () => null },
    ]);
    const missingSubject = await postSession(missingSubjectDb, {
      ...validPayload,
      subjectId: "subj_missing",
    });
    expect(missingSubject.status).toBe(404);
    expect(
      missingSubjectDb.calls.some(({ sql }) =>
        /INSERT INTO practice_sessions/.test(sql),
      ),
    ).toBe(false);

    const missingTopicDb = createMockD1([
      authHandler,
      replayHandler,
      ...rateLimitHandlers,
      activeSubjectHandler,
      { match: /SELECT subject_id FROM topics/, first: () => null },
    ]);
    const missingTopic = await postSession(missingTopicDb, {
      ...validPayload,
      subjectId: "subj_math",
      topicId: "topic_missing",
    });
    expect(missingTopic.status).toBe(404);
    expect(
      missingTopicDb.calls.some(({ sql }) =>
        /INSERT INTO practice_sessions/.test(sql),
      ),
    ).toBe(false);
  });
});
