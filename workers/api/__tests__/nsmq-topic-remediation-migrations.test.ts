import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

type Mapping = {
  questionId: string;
  subjectId: string;
  roundType: string;
  topicId: string;
  sourceQuestionText: string;
  sourceCorrectAnswer: string;
  sourceExplanation: string;
  finalQuestionText: string;
  finalCorrectAnswer: string;
  finalExplanation: string;
  sourceContentFingerprint: string;
  migrationId: string;
};
type ReviewedException = {
  questionId: string;
  subjectId: string;
  roundType: string;
  reasonCode: string;
  disposition: string;
};
type Plan = {
  status: string;
  authoritativeInventoryCount: number;
  mappingCount: number;
  exceptionCount: number;
  chunkSizes: number[];
  migrationIds: string[];
  subjectRoundTotals: Record<string, number>;
  liveOnlyQuestionIds: string[];
  newTopics: Array<{
    id: string;
    subjectId: string;
    name: string;
    slug: string;
  }>;
  mappings: Mapping[];
  reviewedExceptions: ReviewedException[];
};
type QuestionState = {
  id: string;
  subject_id: string;
  topic_id: string | null;
  question_text: string;
  correct_answer: string;
  explanation: string;
};

const require = createRequire(import.meta.url);
const generator =
  require("../../../scripts/generate-nsmq-topic-migrations.cjs") as {
    buildPlan: () => Plan;
    renderFiles: (plan: Plan) => Map<string, string>;
  };
const plan = JSON.parse(
  readFileSync(
    new URL(
      "../../../database/manifests/nsmq-topic-remediation/migration-plan-267-270.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Plan;
const migrationSql = [267, 268, 269, 270].map((number) =>
  readFileSync(
    new URL(
      `../../../database/migrations/${number}_nsmq_topic_remediation_part_${number - 266}.sql`,
      import.meta.url,
    ),
    "utf8",
  ),
);
const rollbackSql = [267, 268, 269, 270].map((number) =>
  readFileSync(
    new URL(
      `../../../database/rollbacks/${number}_nsmq_topic_remediation_part_${number - 266}_rollback.sql`,
      import.meta.url,
    ),
    "utf8",
  ),
);
const preflightSql = readFileSync(
  new URL(
    "../../../database/preflight/267_270_nsmq_topic_remediation_preflight.sql",
    import.meta.url,
  ),
  "utf8",
);
const postflightSql = readFileSync(
  new URL(
    "../../../database/preflight/267_270_nsmq_topic_remediation_postflight.sql",
    import.meta.url,
  ),
  "utf8",
);

function setup(): Database.Database {
  const db = new Database(":memory:");
  for (const file of [
    "../../../database/schema.sql",
    "../../../database/seed.sql",
    "../../../database/prod-patches/096_seed_topics_for_empty_subjects.sql",
    "../../../database/migrations/100_question_bank_integrity.sql",
    "../../../database/migrations/101_atomic_question_allowance.sql",
    "../../../database/migrations/102_nsmq_question_alignment.sql",
    "../../../database/migrations/103_exact_question_deduplication.sql",
  ])
    db.exec(readFileSync(new URL(file, import.meta.url), "utf8"));
  return db;
}

function applyAll(db: Database.Database): void {
  for (const sql of migrationSql) db.exec(sql);
}

function allQuestionState(db: Database.Database): QuestionState[] {
  return db
    .prepare(
      "SELECT id, subject_id, topic_id, question_text, correct_answer, explanation FROM questions ORDER BY id",
    )
    .all() as QuestionState[];
}

function expectGuardFailure(action: () => void): void {
  expect(action).toThrow(/CHECK constraint failed/);
}

describe("NSMQ topic remediation migrations 267-270", () => {
  it("renders deterministic exact 100/100/100/73 artifacts and bounded statements", () => {
    const renderedPlan = generator.buildPlan();
    const renderedFiles = generator.renderFiles(renderedPlan);
    expect(renderedPlan).toMatchObject({
      status: "local-staging-preparation-not-applied",
      authoritativeInventoryCount: 375,
      mappingCount: 373,
      exceptionCount: 2,
      chunkSizes: [100, 100, 100, 73],
    });
    expect(
      new Set(renderedPlan.mappings.map((row) => row.questionId)).size,
    ).toBe(373);
    expect(
      renderedPlan.reviewedExceptions.map((row) => row.questionId),
    ).toEqual(["nsmq_phy_rid_001", "nsmq_phy_rid_003"]);
    expect(
      renderedPlan.reviewedExceptions.every(
        (row) =>
          row.reasonCode === "misclassified_general_riddle" &&
          row.disposition === "pending_separate_general_reasoning_bank",
      ),
    ).toBe(true);
    for (const [target, content] of renderedFiles) {
      expect(readFileSync(target, "utf8")).toBe(content);
      if (
        /database[\\/](migrations|rollbacks)[\\/](267|268|269|270)_/.test(
          target,
        )
      ) {
        const crlf = content.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
        const bookkeeping = target.includes("database\\migrations")
          ? `\r\nINSERT INTO "d1_migrations" (name) VALUES ('${target}');`
          : "";
        expect(Buffer.byteLength(`${crlf}${bookkeeping}`, "utf8")).toBeLessThan(
          19_500,
        );
      }
      if (/database[\\/]migrations[\\/](267|268|269|270)_/.test(target)) {
        expect(
          content.match(/INSERT INTO _migration_\d+_guard\(valid\)/g),
        ).toHaveLength(1);
      }
    }
  });

  it("preflight proves the exact 375-row source disposition and rejects content drift", () => {
    const db = setup();
    expect(() => db.exec(preflightSql)).not.toThrow();
    db.prepare("UPDATE questions SET explanation = ? WHERE id = ?").run(
      "Structurally valid but unapproved correction drift.",
      "nsmq_math_rid_012",
    );
    expectGuardFailure(() => db.exec(preflightSql));
    db.close();
  });

  it("applies 373 exact mappings, one correction, four topics and 376 exact ledger rows", () => {
    const db = setup();
    const before = new Map(allQuestionState(db).map((row) => [row.id, row]));
    db.exec(preflightSql);
    applyAll(db);
    expect(() => db.exec(postflightSql)).not.toThrow();

    expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM questions WHERE id IN (${plan.mappings.map(() => "?").join(",")}) AND topic_id IS NOT NULL`,
        )
        .get(...plan.mappings.map((row) => row.questionId)),
    ).toEqual({ count: 373 });
    expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM question_bank_remediation_log WHERE migration_id IN (${plan.migrationIds.map(() => "?").join(",")})`,
        )
        .get(...plan.migrationIds),
    ).toEqual({ count: 376 });
    expect(
      db
        .prepare(
          "SELECT question_text, correct_answer, explanation, topic_id FROM questions WHERE id = ?",
        )
        .get("nsmq_math_rid_012"),
    ).toEqual({
      question_text: plan.mappings.find(
        (row) => row.questionId === "nsmq_math_rid_012",
      )?.finalQuestionText,
      correct_answer: "6542 or 9863",
      explanation: plan.mappings.find(
        (row) => row.questionId === "nsmq_math_rid_012",
      )?.finalExplanation,
      topic_id: "topic_nsmq_math_general_reasoning",
    });
    for (const exception of plan.reviewedExceptions)
      expect(
        db
          .prepare("SELECT topic_id FROM questions WHERE id = ?")
          .get(exception.questionId),
      ).toEqual({ topic_id: null });
    for (const id of plan.liveOnlyQuestionIds)
      expect(
        (
          db.prepare("SELECT topic_id FROM questions WHERE id = ?").get(id) as {
            topic_id: string | null;
          }
        ).topic_id,
      ).not.toBeNull();

    const mappingById = new Map(
      plan.mappings.map((row) => [row.questionId, row]),
    );
    for (const after of allQuestionState(db)) {
      const source = before.get(after.id);
      expect(source).toBeDefined();
      const mapping = mappingById.get(after.id);
      if (!mapping) expect(after).toEqual(source);
      else {
        expect(after.subject_id).toBe(source?.subject_id);
        expect(after.topic_id).toBe(mapping.topicId);
        expect(after.question_text).toBe(mapping.finalQuestionText);
        expect(after.correct_answer).toBe(mapping.finalCorrectAnswer);
        expect(after.explanation).toBe(mapping.finalExplanation);
      }
    }
    expect(db.pragma("foreign_key_check")).toEqual([]);
    db.close();
  });

  it("is idempotent with exact already-applied values and logs", () => {
    const db = setup();
    applyAll(db);
    const state = allQuestionState(db);
    for (const sql of migrationSql) expect(() => db.exec(sql)).not.toThrow();
    expect(allQuestionState(db)).toEqual(state);
    expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM question_bank_remediation_log WHERE migration_id IN (${plan.migrationIds.map(() => "?").join(",")})`,
        )
        .get(...plan.migrationIds),
    ).toEqual({ count: 376 });
    db.close();
  });

  it("fails before writes on source, non-null topic, log, topic-owner and topic-collision drift", () => {
    const cases: Array<(db: Database.Database) => void> = [
      (db) => {
        db.prepare(
          "UPDATE questions SET question_text = question_text || ? WHERE id = ?",
        ).run(" drift", plan.mappings[0].questionId);
      },
      (db) => {
        db.prepare("UPDATE questions SET topic_id = ? WHERE id = ?").run(
          "topic_algebra",
          plan.mappings[0].questionId,
        );
      },
      (db) => {
        db.prepare(
          `INSERT INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES (?,?,?,?,?,?)`,
        ).run(
          plan.migrationIds[0],
          "question",
          plan.mappings[0].questionId,
          "unexpected_field",
          null,
          "x",
        );
      },
      (db) => {
        db.exec("DROP TRIGGER trg_topic_subject_update_with_questions");
        db.prepare("UPDATE topics SET subject_id = ? WHERE id = ?").run(
          "subj_nsmq_math",
          "topic_cells",
        );
      },
      (db) => {
        db.prepare(
          "INSERT INTO topics(id,subject_id,name,slug,display_order) VALUES (?,?,?,?,?)",
        ).run(
          "collision_topic",
          "subj_nsmq_math",
          "Collision",
          "general-reasoning",
          99,
        );
      },
    ];
    for (const mutate of cases) {
      const db = setup();
      mutate(db);
      expectGuardFailure(() => db.exec(migrationSql[0]));
      expect(
        db
          .prepare(
            `SELECT COUNT(*) AS count FROM question_bank_remediation_log WHERE migration_id = ?`,
          )
          .get(plan.migrationIds[0]),
      ).toEqual({ count: mutate === cases[2] ? 1 : 0 });
      expect(
        db
          .prepare(
            `SELECT COUNT(*) AS count FROM topics WHERE id IN (${plan.newTopics.map(() => "?").join(",")})`,
          )
          .get(...plan.newTopics.map((row) => row.id)),
      ).toEqual({ count: 0 });
      db.close();
    }
  });

  it("rejects correction after-value tampering and wrong ledger mapping", () => {
    for (const mutate of [
      (db: Database.Database) =>
        db
          .prepare(
            "UPDATE questions SET explanation = explanation || ? WHERE id = ?",
          )
          .run(" tampered after apply", "nsmq_math_rid_012"),
      (db: Database.Database) =>
        db
          .prepare(
            "UPDATE question_bank_remediation_log SET new_value = ? WHERE migration_id = ? AND entity_id = ? AND field_name = ?",
          )
          .run(
            "topic_algebra",
            plan.migrationIds[0],
            "nsmq_math_rid_012",
            "topic_id",
          ),
    ]) {
      const db = setup();
      applyAll(db);
      for (let index = 3; index >= 1; index -= 1) db.exec(rollbackSql[index]);
      mutate(db);
      expectGuardFailure(() => db.exec(rollbackSql[0]));
      expect(
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM question_bank_remediation_log WHERE migration_id = ?",
          )
          .get(plan.migrationIds[0]),
      ).toEqual({ count: 103 });
      db.close();
    }
  });

  it("rolls back in reverse order to exact source content and null topics", () => {
    const db = setup();
    const before = allQuestionState(db);
    applyAll(db);
    for (let index = rollbackSql.length - 1; index >= 0; index -= 1)
      db.exec(rollbackSql[index]);
    expect(allQuestionState(db)).toEqual(before);
    expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM question_bank_remediation_log WHERE migration_id IN (${plan.migrationIds.map(() => "?").join(",")})`,
        )
        .get(...plan.migrationIds),
    ).toEqual({ count: 0 });
    expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM topics WHERE id IN (${plan.newTopics.map(() => "?").join(",")})`,
        )
        .get(...plan.newTopics.map((row) => row.id)),
    ).toEqual({ count: 0 });
    expect(db.pragma("foreign_key_check")).toEqual([]);
    db.close();
  });
});
