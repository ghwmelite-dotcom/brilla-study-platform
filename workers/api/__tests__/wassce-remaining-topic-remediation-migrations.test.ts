import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

type Mapping = {
  questionId: string;
  subjectId: string;
  topicId: string;
};
type Batch = {
  number: number;
  filename: string;
  migrationId: string;
  mappings: Mapping[];
};
type Topic = {
  topicId: string;
  subjectId: string;
  name: string;
  slug: string;
  description: string;
  source: { authority: string; title: string; url: string };
};
type Artifact = { filename: string; sql: string };
type Artifacts = {
  batches: Batch[];
  topics: Topic[];
  migrations: Artifact[];
  rollbacks: Artifact[];
  preflight: Artifact;
};
type QuestionRow = Record<string, unknown> & {
  id: string;
  subject_id: string;
  topic_id: string | null;
};

const require = createRequire(import.meta.url);
const generator =
  require("../../../scripts/generate-wassce-remaining-topic-migrations.cjs") as {
    buildArtifacts: () => Artifacts;
  };
const sourceGenerator =
  require("../../../scripts/generate-wassce-remaining-topic-remediation.cjs") as {
    REPO_ONLY_EXCLUDED_IDS: string[];
  };
const artifacts = generator.buildArtifacts();
const mappings = artifacts.batches.flatMap((batch) => batch.mappings);
const migrationIds = artifacts.batches.map((batch) => batch.migrationId);
const mappingById = new Map(
  mappings.map((mapping) => [mapping.questionId, mapping]),
);
const proposedTopicIds = artifacts.topics.map((topic) => topic.topicId);

const schema = readFileSync(
  new URL("../../../database/schema.sql", import.meta.url),
  "utf8",
);
const seed = readFileSync(
  new URL("../../../database/seed.sql", import.meta.url),
  "utf8",
);
const topicSeed = readFileSync(
  new URL(
    "../../../database/prod-patches/096_seed_topics_for_empty_subjects.sql",
    import.meta.url,
  ),
  "utf8",
);
const prerequisiteNames = [
  "100_question_bank_integrity.sql",
  "101_atomic_question_allowance.sql",
  "102_nsmq_question_alignment.sql",
  "103_exact_question_deduplication.sql",
  "224_bece_topic_taxonomy.sql",
  "225_bece_topic_bdt.sql",
  "226_bece_topic_english_part_1.sql",
  "227_bece_topic_english_part_2.sql",
  "228_bece_topic_french.sql",
  "229_bece_topic_ict.sql",
  "230_bece_topic_math_part_1.sql",
  "231_bece_topic_math_part_2.sql",
  "232_bece_topic_rme.sql",
  "233_bece_topic_science_part_1.sql",
  "234_bece_topic_science_part_2.sql",
  "235_bece_topic_social_part_1.sql",
  "236_bece_topic_social_part_2.sql",
  "249_wassce_topic_elective_math_part_1.sql",
  "250_wassce_topic_elective_math_part_2.sql",
  "251_wassce_elective_math_content_corrections.sql",
];
const prerequisites = prerequisiteNames.map((name) =>
  readFileSync(
    new URL(`../../../database/migrations/${name}`, import.meta.url),
    "utf8",
  ),
);
const migrations = artifacts.migrations.map((artifact) =>
  readFileSync(
    new URL(
      `../../../database/migrations/${artifact.filename}`,
      import.meta.url,
    ),
    "utf8",
  ),
);
const rollbacks = artifacts.rollbacks.map((artifact) =>
  readFileSync(
    new URL(
      `../../../database/rollbacks/${artifact.filename}`,
      import.meta.url,
    ),
    "utf8",
  ),
);
const preflight = readFileSync(
  new URL(
    "../../../database/preflight/252_266_wassce_remaining_topic_remediation.sql",
    import.meta.url,
  ),
  "utf8",
);
const preflightQuery = preflight.slice(0, preflight.indexOf(";\nPRAGMA"));

function createFixture() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(schema);
  db.exec(seed);
  db.exec(topicSeed);
  for (const sql of prerequisites) db.exec(sql);
  return db;
}

function applyAll(db: Database.Database) {
  for (const sql of migrations) db.exec(sql);
}

function rollbackAll(db: Database.Database, twice = false) {
  for (let index = rollbacks.length - 1; index >= 0; index -= 1) {
    db.exec(rollbacks[index]);
    if (twice) db.exec(rollbacks[index]);
  }
}

function scalar(db: Database.Database, sql: string, ...params: unknown[]) {
  return (db.prepare(sql).get(...params) as { count: number }).count;
}

function question(db: Database.Database, id: string) {
  return db
    .prepare("SELECT * FROM questions WHERE id=?")
    .get(id) as QuestionRow;
}

function questionSnapshot(db: Database.Database, ids: string[]) {
  return ids.map((id) => question(db, id));
}

function preflightState(db: Database.Database) {
  const rows = db.prepare(preflightQuery).all() as Array<{
    check_name: string;
    actual: string | number;
    expected: string | number;
  }>;
  const checks = new Map(rows.map((row) => [row.check_name, row]));
  expect(checks.get("release_state_valid")?.actual).toBe(1);
  return checks.get("release_state")?.actual;
}

function insertUnexpectedLedger(
  db: Database.Database,
  migrationId: string,
  entityId: string,
  topicId: string,
) {
  db.prepare(
    `INSERT INTO question_bank_remediation_log
      (migration_id,entity_type,entity_id,field_name,old_value,new_value)
     VALUES (?,'question',?,'topic_id',NULL,?)`,
  ).run(migrationId, entityId, topicId);
}

describe("WASSCE remaining null-topic remediation 252-266", () => {
  it("keeps generated migrations and rollbacks deterministic and D1-safe", () => {
    expect(artifacts.migrations).toHaveLength(15);
    expect(artifacts.rollbacks).toHaveLength(15);
    expect(
      artifacts.batches.every((batch) => batch.mappings.length === 100),
    ).toBe(true);
    expect(mappings).toHaveLength(1_500);
    expect(new Set(mappings.map((mapping) => mapping.questionId)).size).toBe(
      1_500,
    );
    expect(artifacts.topics).toHaveLength(20);
    expect(sourceGenerator.REPO_ONLY_EXCLUDED_IDS).toHaveLength(69);
    for (let index = 0; index < artifacts.migrations.length; index += 1) {
      expect(migrations[index]).toBe(artifacts.migrations[index].sql);
      expect(rollbacks[index]).toBe(artifacts.rollbacks[index].sql);
      for (const sql of [migrations[index], rollbacks[index]]) {
        const crlf = sql.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
        expect(
          Buffer.byteLength(
            `${crlf}\r\nINSERT INTO "d1_migrations" (name) values ('${artifacts.batches[index].filename}');`,
            "utf8",
          ),
        ).toBeLessThan(19_500);
      }
    }
    expect(preflight).toBe(artifacts.preflight.sql);
    for (const topic of artifacts.topics) {
      expect(migrations[0]).toContain(topic.topicId);
      expect(migrations[0]).toContain(topic.source.authority);
      expect(migrations[0]).toContain(topic.source.title.replace(/'/g, "''"));
      expect(migrations[0]).toContain(topic.source.url);
    }
  });

  it("applies exactly 1,500 mappings while preserving all non-topic scope", () => {
    const db = createFixture();
    const targetBefore = questionSnapshot(
      db,
      mappings.map((mapping) => mapping.questionId),
    );
    const excludedBefore = questionSnapshot(
      db,
      sourceGenerator.REPO_ONLY_EXCLUDED_IDS,
    );
    const electiveBefore = db
      .prepare(
        "SELECT * FROM questions WHERE subject_id='subj_wassce_elect_math' ORDER BY id",
      )
      .all();
    expect(preflightState(db)).toBe("pristine_pre");

    applyAll(db);

    for (const before of targetBefore) {
      expect(question(db, before.id)).toEqual({
        ...before,
        topic_id: mappingById.get(before.id)?.topicId,
      });
    }
    expect(
      questionSnapshot(db, sourceGenerator.REPO_ONLY_EXCLUDED_IDS),
    ).toEqual(excludedBefore);
    expect(
      db
        .prepare(
          "SELECT * FROM questions WHERE subject_id='subj_wassce_elect_math' ORDER BY id",
        )
        .all(),
    ).toEqual(electiveBefore);
    expect(
      scalar(
        db,
        `SELECT COUNT(*) count FROM question_bank_remediation_log
         WHERE migration_id IN (${migrationIds.map(() => "?").join(",")})`,
        ...migrationIds,
      ),
    ).toBe(1_500);
    expect(
      scalar(
        db,
        `SELECT COUNT(*) count FROM topics WHERE id IN (${proposedTopicIds
          .map(() => "?")
          .join(",")})`,
        ...proposedTopicIds,
      ),
    ).toBe(20);
    expect(preflightState(db)).toBe("applied_post");
    expect(db.pragma("foreign_key_check")).toEqual([]);
    db.close();
  });

  it("is idempotent at every exact batch state", () => {
    const db = createFixture();
    for (let index = 0; index < migrations.length; index += 1) {
      db.exec(migrations[index]);
      db.exec(migrations[index]);
      expect(
        scalar(
          db,
          "SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id=?",
          migrationIds[index],
        ),
      ).toBe(100);
    }
    expect(preflightState(db)).toBe("applied_post");
    db.close();
  });

  it("fails batch 252 before topic insertion on missing or pre-mapped scope drift", () => {
    const missing = createFixture();
    missing
      .prepare("DELETE FROM questions WHERE id=?")
      .run(mappings[0].questionId);
    expect(() => missing.exec(migrations[0])).toThrow();
    expect(
      scalar(
        missing,
        `SELECT COUNT(*) count FROM topics WHERE id IN (${proposedTopicIds
          .map(() => "?")
          .join(",")})`,
        ...proposedTopicIds,
      ),
    ).toBe(0);
    missing.close();

    const mapped = createFixture();
    const first = mappings[0];
    const otherTopic = mapped
      .prepare(
        "SELECT id FROM topics WHERE subject_id=? AND id<>? ORDER BY id LIMIT 1",
      )
      .get(first.subjectId, first.topicId) as { id: string };
    mapped
      .prepare("UPDATE questions SET topic_id=? WHERE id=?")
      .run(otherTopic.id, first.questionId);
    expect(() => mapped.exec(migrations[0])).toThrow();
    expect(
      scalar(
        mapped,
        "SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id=?",
        migrationIds[0],
      ),
    ).toBe(0);
    mapped.close();
  });

  it("fails batch 252 before mutation on topic collision or unexpected ledger rows", () => {
    const collision = createFixture();
    const topic = artifacts.topics[0];
    collision
      .prepare(
        `INSERT INTO topics
          (id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order)
         VALUES (?,?,NULL,?,?,'collision',NULL,NULL,0)`,
      )
      .run(
        `${topic.topicId}_collision`,
        topic.subjectId,
        `${topic.name} collision`,
        topic.slug,
      );
    expect(() => collision.exec(migrations[0])).toThrow();
    expect(
      scalar(
        collision,
        `SELECT COUNT(*) count FROM topics WHERE id IN (${proposedTopicIds
          .map(() => "?")
          .join(",")})`,
        ...proposedTopicIds,
      ),
    ).toBe(0);
    collision.close();

    const ledger = createFixture();
    const outside = mappings[100];
    insertUnexpectedLedger(
      ledger,
      migrationIds[0],
      outside.questionId,
      outside.topicId,
    );
    expect(() => ledger.exec(migrations[0])).toThrow();
    expect(
      scalar(
        ledger,
        `SELECT COUNT(*) count FROM topics WHERE id IN (${proposedTopicIds
          .map(() => "?")
          .join(",")})`,
        ...proposedTopicIds,
      ),
    ).toBe(0);
    ledger.close();
  });

  it("fails batch 252 when question and existing topic ownership drift together", () => {
    const db = createFixture();
    const first = mappings[0];
    const wrongSubject = "subj_wassce_biology";
    db.exec("DROP TRIGGER trg_topic_subject_update_with_questions");
    db.prepare("UPDATE topics SET subject_id=? WHERE id=?").run(
      wrongSubject,
      first.topicId,
    );
    db.prepare("UPDATE questions SET subject_id=? WHERE id=?").run(
      wrongSubject,
      first.questionId,
    );
    expect(() => db.exec(migrations[0])).toThrow();
    expect(
      scalar(
        db,
        "SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id=?",
        migrationIds[0],
      ),
    ).toBe(0);
    db.close();
  });

  it("requires exact prior batches, topic ownership, and migration-ledger scope", () => {
    const prior = createFixture();
    expect(() => prior.exec(migrations[1])).toThrow();
    prior.close();

    const ownership = createFixture();
    ownership.exec(migrations[0]);
    ownership
      .prepare("UPDATE topics SET subject_id=? WHERE id=?")
      .run("subj_wassce_accounting", proposedTopicIds[0]);
    expect(() => ownership.exec(migrations[1])).toThrow();
    expect(
      scalar(
        ownership,
        "SELECT COUNT(*) count FROM question_bank_remediation_log WHERE migration_id=?",
        migrationIds[1],
      ),
    ).toBe(0);
    ownership.close();

    const ledger = createFixture();
    ledger.exec(migrations[0]);
    const outside = mappings[200];
    insertUnexpectedLedger(
      ledger,
      migrationIds[1],
      outside.questionId,
      outside.topicId,
    );
    expect(() => ledger.exec(migrations[1])).toThrow();
    expect(question(ledger, mappings[100].questionId).topic_id).toBeNull();
    ledger.close();
  });

  it("enforces rollback order and restores ledger-proven NULLs exactly", () => {
    const db = createFixture();
    const before = questionSnapshot(
      db,
      mappings.map((mapping) => mapping.questionId),
    );
    applyAll(db);
    expect(() => db.exec(rollbacks[0])).toThrow();
    expect(
      scalar(
        db,
        `SELECT COUNT(*) count FROM topics WHERE id IN (${proposedTopicIds
          .map(() => "?")
          .join(",")})`,
        ...proposedTopicIds,
      ),
    ).toBe(20);

    rollbackAll(db, true);

    expect(
      questionSnapshot(
        db,
        mappings.map((mapping) => mapping.questionId),
      ),
    ).toEqual(before);
    expect(
      scalar(
        db,
        `SELECT COUNT(*) count FROM topics WHERE id IN (${proposedTopicIds
          .map(() => "?")
          .join(",")})`,
        ...proposedTopicIds,
      ),
    ).toBe(0);
    expect(preflightState(db)).toBe("rolled_back");
    expect(db.pragma("foreign_key_check")).toEqual([]);

    applyAll(db);
    expect(preflightState(db)).toBe("applied_post");
    db.close();
  });

  it("fails rollback 252 on exact topic-contract drift", () => {
    const db = createFixture();
    applyAll(db);
    for (let index = rollbacks.length - 1; index > 0; index -= 1)
      db.exec(rollbacks[index]);
    db.prepare("UPDATE topics SET name=name || ? WHERE id=?").run(
      " drift",
      proposedTopicIds[0],
    );
    expect(() => db.exec(rollbacks[0])).toThrow();
    expect(question(db, mappings[0].questionId).topic_id).toBe(
      mappings[0].topicId,
    );
    db.close();
  });
});
