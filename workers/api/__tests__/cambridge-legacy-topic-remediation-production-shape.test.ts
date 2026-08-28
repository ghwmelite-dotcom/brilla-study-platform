import { createRequire } from "node:module";
import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

type Generator = {
  buildArtifacts: () => { artifacts: Record<string, string> };
  fixture: () => DatabaseSync;
  MIGRATION_FILE: string;
  ROLLBACK_FILE: string;
  PREFLIGHT_FILE: string;
  POSTFLIGHT_FILE: string;
};

const require = createRequire(import.meta.url);
const generator = require(
  "../../../scripts/generate-cambridge-legacy-topic-release.cjs",
) as Generator;

const scratchPattern = /^_(?:m281|s281|t281|g281|qf281|sf281|tf281|lf281)$/;
function scratchTables(db: DatabaseSync): string[] {
  return (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as Array<{ name: string }>)
    .map((row) => row.name)
    .filter((name) => scratchPattern.test(name));
}

describe("migration 281 historical production shape", () => {
  it("supports exact historical-production5 without creating plural rows or changing singular rows", () => {
    const { artifacts } = generator.buildArtifacts();
    const db = generator.fixture();
    db.prepare("DELETE FROM questions WHERE id LIKE 'q_alevel_maths_%'").run();
    const singular = JSON.stringify(db.prepare("SELECT * FROM questions WHERE id LIKE 'q_alevel_math_%' ORDER BY id").all());
    db.exec(artifacts[generator.PREFLIGHT_FILE]);
    db.exec(artifacts[generator.MIGRATION_FILE]);
    db.exec(artifacts[generator.MIGRATION_FILE]);
    db.exec(artifacts[generator.POSTFLIGHT_FILE]);
    expect(db.prepare("SELECT count(*) count FROM questions WHERE id LIKE 'q_alevel_maths_%'").get()).toEqual({ count: 0 });
    expect(db.prepare("SELECT count(*) count FROM question_bank_remediation_log WHERE migration_id='281_cambridge_legacy_topic_remediation'").get()).toEqual({ count: 5 });
    expect(JSON.stringify(db.prepare("SELECT * FROM questions WHERE id LIKE 'q_alevel_math_%' ORDER BY id").all())).toBe(singular);
    db.exec(artifacts[generator.ROLLBACK_FILE]);
    db.exec(artifacts[generator.ROLLBACK_FILE]);
    expect(JSON.stringify(db.prepare("SELECT * FROM questions WHERE id LIKE 'q_alevel_math_%' ORDER BY id").all())).toBe(singular);
    expect(scratchTables(db)).toEqual([]);
    db.close();
  }, 120_000);

  it("rejects mixed production shapes and protected singular drift", () => {
    const { artifacts } = generator.buildArtifacts();
    const mixed = generator.fixture();
    mixed.prepare("DELETE FROM questions WHERE id LIKE 'q_alevel_maths_%' AND id<>'q_alevel_maths_001'").run();
    expect(() => mixed.exec(artifacts[generator.PREFLIGHT_FILE])).toThrow();
    mixed.close();

    const singular = generator.fixture();
    singular.prepare("UPDATE questions SET explanation='drift' WHERE id='q_alevel_math_001'").run();
    expect(() => singular.exec(artifacts[generator.PREFLIGHT_FILE])).toThrow();
    singular.close();
  }, 60_000);

  it("fails closed on content drift and scratch-name collisions", () => {
    const { artifacts } = generator.buildArtifacts();
    const drift = generator.fixture();
    drift.prepare("UPDATE questions SET explanation='tampered' WHERE id='q_alevel_maths_001'").run();
    expect(() => drift.exec(artifacts[generator.PREFLIGHT_FILE])).toThrow();
    drift.close();

    const collision = generator.fixture();
    collision.exec("CREATE TABLE _m281(id TEXT)");
    expect(() => collision.exec(artifacts[generator.MIGRATION_FILE])).toThrow();
    collision.close();
  }, 30_000);
});
