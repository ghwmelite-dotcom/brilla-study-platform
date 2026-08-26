import { describe, expect, it } from "vitest";
import { sign } from "hono/jwt";
import worker from "../index";
import { createMockD1, type MockHandler } from "./helpers/mockD1";

const JWT_SECRET = "test-secret-that-is-long-enough";
const REQUEST_ID = "request_answer_integrity_0001";

async function token(userId = "user_1") {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { userId, role: "student", iat: now, exp: now + 3600 },
    JWT_SECRET,
  );
}

const authHandler: MockHandler = {
  match: /SELECT role, status, is_active, session_version FROM users/,
  first: () => ({
    role: "student",
    status: "approved",
    is_active: 1,
    session_version: 0,
  }),
};

const premiumHandler: MockHandler = {
  match:
    /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at/,
  first: () => ({
    role: "admin",
    subscription_tier_id: null,
    subscription_expires_at: null,
    trial_expires_at: null,
  }),
};

const questionHandler: MockHandler = {
  match: /SELECT q\.\*, s\.slug AS subject_slug, et\.slug AS exam_type_slug/,
  first: () => ({
    id: "q1",
    topic_id: null,
    exam_type_id: "exam_wassce",
    question_type: "multiple_choice",
    options: JSON.stringify([
      { id: "A", text: "Topsoil" },
      { id: "B", text: "Clay" },
    ]),
    correct_answer: "A",
    explanation: "Topsoil is richest in humus.",
    points: 3,
    subject_slug: "wassce-core-mathematics",
    exam_type_slug: "wassce",
  }),
};

async function request(db: unknown, body: unknown, questionId = "q1") {
  const jwt = await token();
  return worker.fetch(
    new Request(`http://x/api/questions/${questionId}/attempt`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { DB: db as D1Database, JWT_SECRET },
  );
}

interface StoredReplay {
  id: string;
  question_id: string;
  request_fingerprint: string;
  is_correct: number;
  points_earned: number;
  correct_answer: string;
  explanation: string;
}

function successfulDb(options: { throwAfterInsert?: boolean } = {}) {
  let stored: StoredReplay | null = null;
  let rateConsumes = 0;
  let inserts = 0;
  const handlers: MockHandler[] = [
    authHandler,
    {
      match: /FROM question_attempts qa\s+JOIN questions q/,
      first: () => stored,
    },
    {
      match: /WITH usage\(total_requests\) AS MATERIALIZED/,
      first: () => {
        rateConsumes += 1;
        return { request_count: rateConsumes, total_requests: rateConsumes };
      },
    },
    questionHandler,
    premiumHandler,
    {
      match: /INSERT INTO question_attempts/,
      run: (binds) => {
        inserts += 1;
        stored = {
          id: String(binds[0]),
          question_id: String(binds[2]),
          request_fingerprint: String(binds[10]),
          is_correct: Number(binds[4]),
          points_earned: Number(binds[6]),
          correct_answer: "A",
          explanation: "Topsoil is richest in humus.",
        };
        if (options.throwAfterInsert)
          throw new Error("UNIQUE constraint failed");
        return { success: true, meta: { changes: 1 } };
      },
    },
  ];
  return {
    db: createMockD1(handlers),
    counts: () => ({ rateConsumes, inserts }),
  };
}

describe("POST /api/questions/:id/attempt integrity", () => {
  it("rejects an oversized streamed body with 413 before answer-write queries", async () => {
    const db = createMockD1([authHandler]);
    const response = await request(
      db,
      JSON.stringify({
        answer: "A".repeat(70_000),
        clientRequestId: REQUEST_ID,
      }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    expect(
      db.calls.some(({ sql }) => /question_attempts|rate_limits/.test(sql)),
    ).toBe(false);
  });

  it.each([-1, 86_401, 1.5, "12"])(
    "rejects explicitly invalid timeTaken %j",
    async (timeTaken) => {
      const db = createMockD1([authHandler]);
      const response = await request(db, {
        answer: "A",
        timeTaken,
        clientRequestId: REQUEST_ID,
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: "A valid timeTaken value is required",
      });
      expect(
        db.calls.some(({ sql }) => /question_attempts|rate_limits/.test(sql)),
      ).toBe(false);
    },
  );

  it.each([undefined, "short", "contains spaces here"])(
    "rejects invalid clientRequestId %j",
    async (clientRequestId) => {
      const db = createMockD1([authHandler]);
      const response = await request(db, {
        answer: "A",
        ...(clientRequestId === undefined ? {} : { clientRequestId }),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: "A valid client request ID is required",
      });
      expect(
        db.calls.some(({ sql }) => /question_attempts|rate_limits/.test(sql)),
      ).toBe(false);
    },
  );

  it("defaults an omitted timeTaken to zero and persists it in the fingerprinted attempt", async () => {
    const state = successfulDb();
    const response = await request(state.db, {
      answer: "A",
      clientRequestId: REQUEST_ID,
    });

    expect(response.status).toBe(200);
    const insert = state.db.calls.find(({ sql }) =>
      /INSERT INTO question_attempts/.test(sql),
    );
    expect(insert?.binds[5]).toBe(0);
    expect(insert?.binds[10]).toEqual(expect.any(String));
  });

  it("returns 503 without reading the question when the fail-closed limiter backend is unavailable", async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /FROM question_attempts qa\s+JOIN questions q/,
        first: () => null,
      },
    ]);
    const response = await request(db, {
      answer: "A",
      timeTaken: 12,
      clientRequestId: REQUEST_ID,
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      code: "RATE_LIMIT_UNAVAILABLE",
    });
    expect(db.calls.some(({ sql }) => /SELECT q\.\*/.test(sql))).toBe(false);
  });
  it("writes once and returns the stored attempt for an identical retry without another rate consume", async () => {
    const state = successfulDb();
    const payload = { answer: "A", timeTaken: 12, clientRequestId: REQUEST_ID };

    const first = await request(state.db, payload);
    const replay = await request(state.db, payload);
    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);

    const firstBody = (await first.json()) as {
      data: { attemptId: string; idempotent: boolean };
    };
    const replayBody = (await replay.json()) as {
      data: { attemptId: string; idempotent: boolean };
    };
    expect(replayBody.data.attemptId).toBe(firstBody.data.attemptId);
    expect(firstBody.data.idempotent).toBe(false);
    expect(replayBody.data.idempotent).toBe(true);
    expect(state.counts()).toEqual({ rateConsumes: 1, inserts: 1 });
  });

  it("returns 409 when a request ID is reused for different answer data", async () => {
    const state = successfulDb();
    await request(state.db, {
      answer: "A",
      timeTaken: 12,
      clientRequestId: REQUEST_ID,
    });
    const conflict = await request(state.db, {
      answer: "B",
      timeTaken: 12,
      clientRequestId: REQUEST_ID,
    });

    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      code: "IDEMPOTENCY_CONFLICT",
    });
    expect(state.counts()).toEqual({ rateConsumes: 1, inserts: 1 });
  });

  it("recovers a concurrent unique conflict by replaying the committed row", async () => {
    const state = successfulDb({ throwAfterInsert: true });
    const response = await request(state.db, {
      answer: "A",
      timeTaken: 12,
      clientRequestId: REQUEST_ID,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { idempotent: true },
    });
    expect(state.counts()).toEqual({ rateConsumes: 1, inserts: 1 });
  });

  it("returns 429 and performs no question or attempt write when the user rate is exhausted", async () => {
    const db = createMockD1([
      authHandler,
      {
        match: /FROM question_attempts qa\s+JOIN questions q/,
        first: () => null,
      },
      {
        match: /WITH usage\(total_requests\) AS MATERIALIZED/,
        first: () => null,
      },
    ]);
    const response = await request(db, {
      answer: "A",
      timeTaken: 12,
      clientRequestId: REQUEST_ID,
    });

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ code: "RATE_LIMITED" });
    expect(
      db.calls.some(({ sql }) =>
        /SELECT q\.\*|INSERT INTO question_attempts/.test(sql),
      ),
    ).toBe(false);
  });
});
