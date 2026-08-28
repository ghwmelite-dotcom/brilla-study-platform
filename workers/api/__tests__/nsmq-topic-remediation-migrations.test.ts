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
type TopicResolution = {
  logicalTopicId: string;
  subjectId: string;
  candidateTopicIds: string[];
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
  topicResolutions: TopicResolution[];
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

function setup(taxonomy: "staging-generic" | "production-prefixed" = "staging-generic"): Database.Database {
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
  if (taxonomy === "production-prefixed") makeProductionPrefixedTaxonomy(db);
  return db;
}

function makeProductionPrefixedTaxonomy(db: Database.Database): void {
  const inventory = [...plan.mappings, ...plan.reviewedExceptions].map(
    (row) => row.questionId,
  );
  db.prepare(
    `DELETE FROM questions WHERE id NOT IN (${inventory.map(() => "?").join(",")})`,
  ).run(...inventory);
  db.exec("DROP TRIGGER IF EXISTS trg_topic_subject_update_with_questions");
  const oldSubject = new Map<string, string>([
    ["subj_nsmq_math", "subj_math"],
    ["subj_nsmq_physics", "subj_physics"],
    ["subj_nsmq_chemistry", "subj_chemistry"],
    ["subj_nsmq_biology", "subj_biology"],
  ]);
  const cloneLegacySubject = db.prepare(`
    INSERT OR IGNORE INTO subjects(id,name,slug,icon,color,description,display_order,exam_type_id,category_id,waec_code,is_active,created_at)
    SELECT ?,name||' Legacy',slug||'-legacy-compat',icon,color,description,display_order,NULL,category_id,waec_code,0,created_at
    FROM subjects WHERE id=?
  `);
  for (const [currentSubjectId, legacySubjectId] of oldSubject) {
    cloneLegacySubject.run(legacySubjectId, currentSubjectId);
  }
  const clone = db.prepare(`
    INSERT INTO topics(id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order,created_at)
    SELECT ?,?,NULL,name,slug||'-production-compat',description,theory_content,key_formulas,display_order,created_at
    FROM topics WHERE id=?
  `);
  const move = db.prepare("UPDATE topics SET subject_id=? WHERE id=?");
  for (const resolution of plan.topicResolutions) {
    if (resolution.candidateTopicIds.length !== 2) continue;
    const [canonicalTopicId, logicalTopicId] = resolution.candidateTopicIds;
    if (logicalTopicId !== resolution.logicalTopicId) {
      throw new Error(`Unexpected staging fallback for ${resolution.logicalTopicId}`);
    }
    clone.run(canonicalTopicId, resolution.subjectId, logicalTopicId);
    const legacySubjectId = oldSubject.get(resolution.subjectId);
    if (!legacySubjectId) throw new Error(`Missing legacy subject for ${resolution.subjectId}`);
    move.run(legacySubjectId, logicalTopicId);
  }
}

function cloneCanonicalCandidate(
  db: Database.Database,
  resolution: TopicResolution,
): void {
  const [canonicalTopicId, logicalTopicId] = resolution.candidateTopicIds;
  db.prepare(`
    INSERT INTO topics(id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order,created_at)
    SELECT ?,?,NULL,name,slug||'-ambiguous',description,theory_content,key_formulas,display_order,created_at
    FROM topics WHERE id=?
  `).run(canonicalTopicId, resolution.subjectId, logicalTopicId);
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

  it("resolves the production-prefixed taxonomy while ignoring wrong-owner generic IDs", () => {
    const db = setup("production-prefixed");
    db.exec(preflightSql);
    applyAll(db);
    db.exec(postflightSql);
    const expectedByLogical = new Map(
      plan.topicResolutions.map((resolution) => [
        resolution.logicalTopicId,
        resolution.candidateTopicIds[0],
      ]),
    );
    const actual = db.prepare("SELECT topic_id FROM questions WHERE id=?");
    for (const mapping of plan.mappings) {
      expect(actual.get(mapping.questionId)).toEqual({
        topic_id: expectedByLogical.get(mapping.topicId),
      });
    }
    expect(
      db.prepare(`
        SELECT COUNT(*) AS count FROM questions q
        JOIN topics t ON t.id=q.topic_id
        JOIN subjects s ON s.id=t.subject_id
        WHERE q.id IN (${plan.mappings.map(() => "?").join(",")})
          AND t.subject_id=q.subject_id AND s.exam_type_id='exam_nsmq' AND s.is_active=1
      `).get(...plan.mappings.map((row) => row.questionId)),
    ).toEqual({ count: 373 });
    db.close();
  });

  it("fails closed when both canonical and generic candidates are valid", () => {
    const resolution = plan.topicResolutions.find(
      (item) =>
        item.candidateTopicIds.length === 2 &&
        plan.mappings.some(
          (mapping) =>
            mapping.migrationId === plan.migrationIds[0] &&
            mapping.topicId === item.logicalTopicId,
        ),
    );
    if (!resolution) throw new Error("Missing ambiguous-candidate fixture");
    const db = setup();
    const baselineLogs = db
      .prepare("SELECT COUNT(*) AS count FROM question_bank_remediation_log")
      .get();
    cloneCanonicalCandidate(db, resolution);
    expectGuardFailure(() => db.exec(preflightSql));
    expectGuardFailure(() => db.exec(migrationSql[0]));
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM question_bank_remediation_log").get(),
    ).toEqual(baselineLogs);
    db.close();
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
