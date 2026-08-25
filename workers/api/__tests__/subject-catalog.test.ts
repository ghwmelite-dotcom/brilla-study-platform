import { describe, expect, it, vi } from "vitest";
import { sign } from "hono/jwt";
import worker from "../index";
import {
  getSubjectAvailability,
  mapSubjectCatalogRow,
  SUBJECT_AVAILABLE_QUESTION_FLOOR,
} from "../subject-catalog";

describe("subject catalogue availability", () => {
  it.each([
    [0, "unavailable", "question_bank_empty"],
    [1, "limited", "question_bank_below_operational_floor"],
    [19, "limited", "question_bank_below_operational_floor"],
    [20, "available", "question_bank_meets_operational_floor"],
  ] as const)("classifies %i questions", (count, status, reason) => {
    expect(getSubjectAvailability(count)).toEqual({
      availabilityStatus: status,
      availabilityReason: reason,
    });
  });

  it("keeps legacy fields while adding coerced camelCase fields", () => {
    expect(
      mapSubjectCatalogRow({
        id: "subject-1",
        exam_type_id: "exam_wassce",
        category_id: "category-1",
        waec_code: "MTH",
        is_active: 1,
        display_order: "3",
        question_count: "20",
        topic_count: "7",
      }),
    ).toMatchObject({
      id: "subject-1",
      exam_type_id: "exam_wassce",
      question_count: 20,
      topic_count: 7,
      examTypeId: "exam_wassce",
      categoryId: "category-1",
      waecCode: "MTH",
      isActive: true,
      displayOrder: 3,
      questionCount: SUBJECT_AVAILABLE_QUESTION_FLOOR,
      topicCount: 7,
      availabilityStatus: "available",
      contentReviewStatus: "legacy_unreviewed",
    });
  });

  it("classifies a wholly database-backed beta batch as automated beta", () => {
    expect(
      mapSubjectCatalogRow({
        id: "subj_wassce_agric",
        question_count: 40,
        automated_beta_count: 40,
        topic_count: 4,
      }),
    ).toMatchObject({
      questionCount: 40,
      availabilityStatus: "available",
      contentReviewStatus: "automated_beta",
    });
  });
  it("never turns invalid or negative counts into availability", () => {
    expect(
      mapSubjectCatalogRow({
        question_count: "-8",
        topic_count: "not-a-number",
      }),
    ).toMatchObject({
      questionCount: 0,
      topicCount: 0,
      availabilityStatus: "unavailable",
      contentReviewStatus: undefined,
    });
  });
});

function makeRouteDb(
  options: {
    subjectCount?: number | null;
    subjectRows?: Array<Record<string, unknown>>;
    questionRows?: Array<Record<string, unknown>>;
    paperRow?: Record<string, unknown> | null;
    paperQuestionRows?: Array<Record<string, unknown>>;
  } = {},
) {
  const calls: Array<{ sql: string; args: unknown[] }> = [];
  const db = {
    prepare: vi.fn((sql: string) => {
      const execute = {
        first: vi.fn(async () => {
          if (sql.includes("SELECT role, status, is_active, session_version FROM users")) {
            return { role: "student", status: "approved", is_active: 1, session_version: 0 };
          }
          if (sql.includes("SELECT role, subscription_tier_id")) {
            return {
              role: "student",
              subscription_tier_id: null,
              subscription_expires_at: null,
              trial_expires_at: null,
            };
          }
          if (sql.includes("FROM rate_limits")) return null;
          if (sql.includes("SELECT question_count FROM daily_usage")) {
            return { question_count: 0 };
          }
          if (sql.includes("FROM past_papers pp")) return options.paperRow ?? null;
          if (
            sql.includes("FROM subjects s") &&
            sql.includes("AS question_count")
          ) {
            return options.subjectCount === null
              ? null
              : {
                  id: "subj_nsmq_math",
                  slug: "mathematics",
                  exam_type_slug: "nsmq",
                  question_count: options.subjectCount ?? 0,
                };
          }
          if (sql.includes("SELECT q.*")) return options.questionRows?.[0] ?? null;
          return null;
        }),
        all: vi.fn(async () => ({
          results: sql.includes("q.past_paper_id = ?")
            ? (options.paperQuestionRows ?? [])
            : sql.includes("FROM subjects s")
              ? (options.subjectRows ?? [])
              : sql.includes("FROM questions q")
                ? (options.questionRows ?? [])
                : (options.subjectRows ?? []),
        })),
        run: vi.fn(async () => ({ success: true })),
      };
      return {
        ...execute,
        bind: (...args: unknown[]) => {
          calls.push({ sql, args });
          return execute;
        },
      };
    }),
  } as unknown as D1Database;
  return { db, calls };
}

const routeEnv = (db: D1Database) => ({
  DB: db,
  JWT_SECRET: "subject-catalog-test-secret",
  ENVIRONMENT: "test",
});

async function authenticatedRequest(url: string) {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await sign(
    { userId: "student-1", role: "student", sessionVersion: 0, iat: now, exp: now + 3600 },
    "subject-catalog-test-secret",
  );
  return new Request(url, { headers: { Authorization: `Bearer ${jwt}` } });
}

describe("public subject availability routes", () => {
  it("returns every active subject with the additive legacy and availability contract", async () => {
    const { db, calls } = makeRouteDb({
      subjectRows: [
        {
          id: "subj_wassce_math",
          name: "Mathematics",
          slug: "mathematics",
          exam_type_id: "wassce",
          category_id: "cat_wassce_core",
          waec_code: "MTH",
          is_active: 1,
          display_order: 1,
          question_count: 0,
          topic_count: 4,
        },
      ],
    });

    const response = await worker.fetch(
      new Request("http://test/api/subjects?exam_type=wassce"),
      routeEnv(db),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Array<Record<string, unknown>>;
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      exam_type_id: "wassce",
      question_count: 0,
      examTypeId: "wassce",
      questionCount: 0,
      availabilityStatus: "unavailable",
    });
    expect(calls.some(({ sql }) => sql.includes("s.is_active = 1"))).toBe(true);
    expect(
      calls.some(({ sql }) => sql.includes("COUNT(*) AS question_count")),
    ).toBe(true);
    expect(
      calls.some(
        ({ sql }) =>
          sql.includes("question_content_releases") &&
          sql.includes("qcr.quality_assurance = 'automated_beta'") &&
          sql.includes("qcr.release_channel = 'beta'"),
      ),
    ).toBe(true);
    expect(
      calls.some(({ sql }) => sql.includes("COUNT(*) AS topic_count")),
    ).toBe(true);
  });

  it("returns active subject detail with slug-bound live counts and status metadata", async () => {
    const { db, calls } = makeRouteDb({ subjectCount: 20 });
    const response = await worker.fetch(
      new Request("http://test/api/subjects/mathematics"),
      routeEnv(db),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data).toMatchObject({
      id: "subj_nsmq_math",
      slug: "mathematics",
      questionCount: 20,
      availabilityStatus: "available",
      availabilityReason: "question_bank_meets_operational_floor",
      contentReviewStatus: "legacy_unreviewed",
    });
    const detailCall = calls.find(({ sql }) => sql.includes("s.is_active = 1 AND s.slug = ?"));
    expect(detailCall?.args).toEqual(["mathematics"]);
  });

  it("rejects unauthenticated question reads before touching D1", async () => {
    const { db, calls } = makeRouteDb({ subjectCount: 20 });
    const response = await worker.fetch(
      new Request("http://test/api/questions?subject=mathematics"),
      routeEnv(db),
    );
    expect(response.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it("rejects an empty bank before returning practice questions", async () => {
    const { db, calls } = makeRouteDb({ subjectCount: 0 });
    const response = await worker.fetch(
      await authenticatedRequest("http://test/api/questions?subject=empty-subject"),
      routeEnv(db),
    );
    expect(response.status).toBe(409);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("SUBJECT_UNAVAILABLE");
    expect(
      calls.filter(({ sql }) => sql.includes("FROM questions q")),
    ).toHaveLength(0);
  });

  it("returns 404 for an unknown or inactive subject", async () => {
    const { db } = makeRouteDb({ subjectCount: null });
    const response = await worker.fetch(
      await authenticatedRequest("http://test/api/questions?subject=inactive-subject"),
      routeEnv(db),
    );
    expect(response.status).toBe(404);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("SUBJECT_NOT_FOUND");
  });

  it("keeps a limited bank usable and only returns questions from active subjects", async () => {
    const { db, calls } = makeRouteDb({
      subjectCount: 1,
      questionRows: [
        {
          id: "q_1",
          question_text: "2 + 2 = ?",
          question_type: "multiple_choice",
          options: '["3","4"]',
          correct_answer: "B",
          difficulty: "easy",
          points: 1,
        },
      ],
    });
    const response = await worker.fetch(
      await authenticatedRequest("http://test/api/questions?subject=limited-subject"),
      routeEnv(db),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Array<Record<string, unknown>> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).not.toHaveProperty("correct_answer");
    expect(body.data[0]).not.toHaveProperty("explanation");
    expect(body.data[0]).toMatchObject({ options: [{ id: "A", text: "3" }, { id: "B", text: "4" }] });
    const questionRead = calls.find(({ sql }) => sql.includes("SELECT q.*"));
    expect(questionRead?.args[0]).toBe("subj_nsmq_math");
    expect(questionRead?.args).not.toContain("limited-subject");
    expect(
      calls.some(
        ({ sql }) =>
          sql.includes("JOIN subjects s") && sql.includes("s.is_active = 1"),
      ),
    ).toBe(true);
  });
  it("requires authentication and withholds answer material from a past paper", async () => {
    const anonymous = makeRouteDb();
    const anonymousResponse = await worker.fetch(
      new Request("http://test/api/papers/paper-1"),
      routeEnv(anonymous.db),
    );
    expect(anonymousResponse.status).toBe(401);
    expect(anonymous.calls).toHaveLength(0);

    const authenticated = makeRouteDb({
      subjectCount: 20,
      paperRow: { id: "paper-1", subject_id: "subj_nsmq_math", subject_slug: "nsmq-mathematics" },
      paperQuestionRows: [{
        id: "paper-q-1",
        options: '["3","4"]',
        correct_answer: "B",
        explanation: "2 + 2 = 4",
      }],
    });
    const response = await worker.fetch(
      await authenticatedRequest("http://test/api/papers/paper-1"),
      routeEnv(authenticated.db),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { questions: Array<Record<string, unknown>> } };
    expect(body.data.questions[0]).toEqual({
      id: "paper-q-1",
      options: [{ id: "A", text: "3" }, { id: "B", text: "4" }],
    });
    expect(authenticated.calls.some(({ sql }) => sql.includes("s.is_active = 1"))).toBe(true);
  });

  it("keeps the assessment question picker teacher/admin only", async () => {
    const { db, calls } = makeRouteDb();
    const response = await worker.fetch(
      await authenticatedRequest("http://test/api/questions/bank"),
      routeEnv(db),
    );
    expect(response.status).toBe(403);
    expect(calls.some(({ sql }) => sql.includes("LEFT JOIN topics t"))).toBe(false);
  });

  it("filters subject detail, topic list/detail, and question detail through active subjects", async () => {
    const { db, calls } = makeRouteDb({ subjectCount: null });
    const requests = [
      new Request("http://test/api/subjects/inactive-subject"),
      new Request("http://test/api/topics?subject=inactive-subject"),
      new Request("http://test/api/topics/inactive-topic"),
      await authenticatedRequest("http://test/api/questions/inactive-question"),
    ];

    const responses = [];
    for (const request of requests) responses.push(await worker.fetch(request, routeEnv(db)));

    expect(responses.map((response) => response.status)).toEqual([404, 200, 404, 404]);
    expect(calls.some(({ sql }) => sql.includes("s.is_active = 1 AND s.slug = ?"))).toBe(true);
    expect(calls.some(({ sql }) => sql.includes("subject.is_active = 1"))).toBe(true);
    expect(calls.some(({ sql }) => sql.includes("s.is_active = 1") && sql.includes("t.id = ?"))).toBe(true);
    expect(calls.some(({ sql }) => sql.includes("s.is_active = 1") && sql.includes("q.id = ?"))).toBe(true);
  });

  it("returns a controlled 500 when the catalogue database query fails", async () => {
    const db = {
      prepare: vi.fn(() => {
        throw new Error("D1 unavailable");
      }),
    } as unknown as D1Database;

    const response = await worker.fetch(new Request("http://test/api/subjects"), routeEnv(db));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      success: false,
      error: "Failed to fetch subjects",
    });
  });});
