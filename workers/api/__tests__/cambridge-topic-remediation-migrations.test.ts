import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

type ReleaseArtifacts = {
  model: {
    mappings: Array<{ questionId: string; topicId: string }>;
    batches: Array<{ number: number; migrationId: string; rows: unknown[] }>;
    proposal: {
      retainedExceptions: Array<{ questionId: string }>;
      contentCorrectionProposals: unknown[];
    };
    topicRows: unknown[];
  };
  artifacts: Record<string, string>;
};

type ValidationResult = {
  mappings: number;
  exceptions: number;
  topics: number;
  logs: number;
  idempotence: string;
  rollback: string;
};

const require = createRequire(import.meta.url);
const generator = require(
  "../../../scripts/generate-cambridge-topic-release.cjs",
) as { buildArtifacts: () => ReleaseArtifacts; fixture: () => DatabaseSync };
const validator = require(
  "../../../scripts/validate-cambridge-topic-release.cjs",
) as { validate: () => ValidationResult };

const scratchTablePattern =
  /^_(?:m27[1-5]|r27[1-5]|g27[1-5]|rg27[1-5]|ts|sr|sf|tf|lf|fg)$/;

function scratchTableNames(db: DatabaseSync): string[] {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>
  ).map((row) => row.name).filter((name) => scratchTablePattern.test(name));
}

describe("Cambridge topic remediation migrations 271-275", () => {
  it("renders deterministic 100/100/100/100/50 artifacts below the D1 size ceiling", () => {
    const { model, artifacts } = generator.buildArtifacts();

    expect(model.mappings).toHaveLength(450);
    expect(new Set(model.mappings.map((row) => row.questionId)).size).toBe(450);
    expect(model.batches.map((batch) => batch.rows.length)).toEqual([
      100, 100, 100, 100, 50,
    ]);
    expect(model.topicRows).toHaveLength(15);
    expect(model.proposal.retainedExceptions.map((row) => row.questionId)).toEqual([
      "q_alevel_bio_028",
      "q_alevel_bio_029",
      "q_alevel_fm_051",
      "q_alevel_fm_052",
      "q_alevel_fm_053",
    ]);

    for (const [file, content] of Object.entries(artifacts)) {
      expect(
        readFileSync(new URL(`../../../${file}`, import.meta.url), "utf8"),
      ).toBe(content);
      if (/database\/(migrations|rollbacks|preflight)\/27[1-5]_/.test(file)) {
        expect(Buffer.byteLength(content, "utf8")).toBeLessThan(19_500);
        expect(content).not.toMatch(/CREATE TEMP/i);
        expect(content).toContain("CREATE TABLE _sf(c INTEGER,n INTEGER,a INTEGER,b INTEGER);");
        expect(content).toContain("INSERT INTO _sf(c,n,a,b) WITH RECURSIVE ");
        expect(content).not.toContain("DROP VIEW _sr");
        expect(content).toContain("CREATE TABLE _sr (id TEXT,subject_id TEXT,topic_id TEXT,question_text TEXT,question_type TEXT,options TEXT,correct_answer TEXT,explanation TEXT,difficulty TEXT,points INTEGER,marks INTEGER,time_limit INTEGER);");
        expect(content).toContain("INSERT INTO _sr (id,subject_id,topic_id,question_text,question_type,options,correct_answer,explanation,difficulty,points,marks,time_limit) SELECT id,subject_id,topic_id,question_text,question_type,options,correct_answer,explanation,difficulty,points,marks,time_limit FROM questions WHERE ");
        expect(content).toContain("DROP TABLE _sr");
      }
    }
  });
  it("drops every regular scratch table after apply, replay, flights and rollback paths", () => {
    const { model, artifacts } = generator.buildArtifacts();
    const migrations = model.batches.map(
      (batch) => artifacts[`database/migrations/${batch.migrationId}.sql`],
    );
    const rollbacks = model.batches.map(
      (batch) =>
        artifacts[`database/rollbacks/${batch.migrationId}_rollback.sql`],
    );
    const preflight =
      artifacts[
        "database/preflight/271_275_cambridge_topic_remediation_preflight.sql"
      ];
    const postflight =
      artifacts[
        "database/preflight/271_275_cambridge_topic_remediation_postflight.sql"
      ];
    const expectNoScratchTables = (db: DatabaseSync) => {
      expect(scratchTableNames(db)).toEqual([]);
    };

    const full = generator.fixture();
    full.exec(preflight);
    expectNoScratchTables(full);
    for (const migration of migrations) {
      full.exec(migration);
      expectNoScratchTables(full);
      full.exec(migration);
      expectNoScratchTables(full);
    }
    for (const migration of migrations) {
      full.exec(migration);
      expectNoScratchTables(full);
    }
    full.exec(postflight);
    expectNoScratchTables(full);
    for (const rollback of [...rollbacks].reverse()) {
      full.exec(rollback);
      expectNoScratchTables(full);
    }
    full.close();

    const partial = generator.fixture();
    for (const migration of migrations) {
      partial.exec(migration);
    }
    partial.exec(rollbacks.at(-1)!);
    expectNoScratchTables(partial);
    partial.close();

    const collision = generator.fixture();
    collision.exec("CREATE TABLE _sr(id TEXT)");
    expect(() => collision.exec(preflight)).toThrow();
    collision.close();
  }, 120_000);


  it("passes exact apply, replay, drift, ordering and reverse-rollback probes", () => {
    expect(validator.validate()).toEqual({
      mappings: 450,
      exceptions: 5,
      topics: 15,
      logs: 453,
      idempotence: "immediate-and-full-replay",
      rollback: "full-and-partial-strict-reverse",
    });
  }, 60_000);
});
