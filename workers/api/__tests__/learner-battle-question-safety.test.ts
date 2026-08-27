import { describe, expect, it, vi } from "vitest";
import worker from "../index";

type Row = Record<string, unknown>;

function makeBattleDb() {
  const storedQuestions = JSON.stringify([
    {
      id: "usable-question",
      subject_id: "subj_nsmq_physics",
      topic_id: "topic_nsmq_physics_mechanics",
      question_text: "What force changes motion?",
      question_type: "multiple_choice",
      options: JSON.stringify(["Friction", "Mass"]),
      correct_answer: "A",
      explanation: "Friction is a force.",
    },
    {
      id: "nsmq_phy_rid_001",
      subject_id: "subj_nsmq_physics",
      topic_id: null,
      question_text: "Quarantined legacy riddle",
      question_type: "direct_answer",
      correct_answer: "Hidden",
      explanation: "Must never be exposed.",
    },
  ]);
  const calls: string[] = [];
  const db = {
    prepare: vi.fn((sql: string) => {
      calls.push(sql);
      const statement = {
        first: vi.fn(async () => {
          if (sql.includes("FROM battles b")) {
            return {
              id: "battle-1",
              status: "waiting",
              questions: storedQuestions,
              challenger_name: "Student",
              subject_name: "Physics",
            };
          }
          return null;
        }),
        all: vi.fn(async () => {
          if (sql.includes("FROM battles b")) {
            return {
              results: [
                {
                  id: "battle-1",
                  status: "waiting",
                  questions: storedQuestions,
                  challenger_name: "Student",
                  subject_name: "Physics",
                },
              ],
            };
          }
          if (sql.includes("FROM questions q")) {
            return { results: [{ id: "usable-question" }] };
          }
          return { results: [] };
        }),
        run: vi.fn(async () => ({ success: true })),
      };
      return {
        ...statement,
        bind: (..._args: unknown[]) => statement,
      };
    }),
  } as unknown as D1Database;
  return { db, calls };
}

const env = (db: D1Database) => ({
  DB: db,
  JWT_SECRET: "battle-question-safety-secret",
  ENVIRONMENT: "test",
});

describe("public battle question safety", () => {
  it("omits stored question payloads from the available battle list", async () => {
    const { db, calls } = makeBattleDb();
    const response = await worker.fetch(
      new Request("http://test/api/battles/available"),
      env(db),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Row[] };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).not.toHaveProperty("questions");
    const availableSql = calls.find((sql) => sql.includes("FROM battles b"));
    expect(availableSql).toContain(
      "(b.expires_at IS NULL OR b.expires_at > ?)",
    );
  });

  it("revalidates historical battle questions and withholds answer material", async () => {
    const { db, calls } = makeBattleDb();
    const response = await worker.fetch(
      new Request("http://test/api/battles/battle-1"),
      env(db),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { questions: Row[] };
    };
    expect(body.data.questions).toHaveLength(1);
    expect(body.data.questions[0]).toMatchObject({
      id: "usable-question",
      options: [
        { id: "A", text: "Friction" },
        { id: "B", text: "Mass" },
      ],
    });
    expect(body.data.questions[0]).not.toHaveProperty("correct_answer");
    expect(body.data.questions[0]).not.toHaveProperty("explanation");
    expect(body.data.questions.map((question) => question.id)).not.toContain(
      "nsmq_phy_rid_001",
    );
    const battleSql = calls.find((sql) => sql.includes("WHERE b.id = ?"));
    expect(battleSql).toContain(
      "(b.expires_at IS NULL OR b.expires_at > ?)",
    );

    const eligibilitySql = calls.find((sql) =>
      sql.includes("FROM questions q"),
    );
    expect(eligibilitySql).toContain("subject.is_active = 1");
    expect(eligibilitySql).toContain("JOIN topics question_topic");
    expect(eligibilitySql).toContain(
      "question_topic.subject_id = q.subject_id",
    );
  });
});