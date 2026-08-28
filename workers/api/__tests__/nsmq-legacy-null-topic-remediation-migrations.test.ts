import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

type Mapping = {
  questionId: string;
  subjectId: string;
  roundType: string;
  topicId: string;
  migrationId: string;
};

type Quarantine = {
  questionId: string;
  subjectId: string;
  roundType: string;
};

type TopicResolution = {
  logicalTopicId: string;
  subjectId: string;
  candidateTopicIds: string[];
};

type Plan = {
  mappings: Mapping[];
  topicResolutions: TopicResolution[];
  quarantines: Quarantine[];
  migrationIds: string[];
  chunkSizes: number[];
};

const manifest = JSON.parse(
  readFileSync(
    new URL(
      "../../../database/manifests/nsmq-topic-remediation/legacy-null-topic-plan-278-280.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Plan;

const migrationSql = [1, 2, 3].map((part, index) =>
  readFileSync(
    new URL(
      `../../../database/migrations/${278 + index}_nsmq_legacy_null_topic_part_${part}.sql`,
      import.meta.url,
    ),
    "utf8",
  ),
);
const rollbackSql = [1, 2, 3].map((part, index) =>
  readFileSync(
    new URL(
      `../../../database/rollbacks/${278 + index}_nsmq_legacy_null_topic_part_${part}_rollback.sql`,
      import.meta.url,
    ),
    "utf8",
  ),
);
const preflightSql = readFileSync(
  new URL(
    "../../../database/preflight/278_280_nsmq_legacy_null_topic_preflight.sql",
    import.meta.url,
  ),
  "utf8",
);
const postflightSql = readFileSync(
  new URL(
    "../../../database/preflight/278_280_nsmq_legacy_null_topic_postflight.sql",
    import.meta.url,
  ),
  "utf8",
);

function setup(taxonomy: "staging-generic" | "production-prefixed" = "staging-generic"): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE subjects(
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL,
      is_active INTEGER NOT NULL
    );
    CREATE TABLE topics(
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id)
    );
    CREATE TABLE questions(
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id),
      round_type TEXT NOT NULL,
      topic_id TEXT REFERENCES topics(id)
    );
    CREATE TABLE question_bank_remediation_log(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      UNIQUE(migration_id,entity_type,entity_id,field_name)
    );
  `);

  const insertSubject = db.prepare(
    "INSERT INTO subjects(id,exam_type_id,is_active) VALUES (?,'exam_nsmq',1)",
  );
  for (const subjectId of [
    "subj_nsmq_biology",
    "subj_nsmq_chemistry",
    "subj_nsmq_math",
    "subj_nsmq_physics",
  ]) {
    insertSubject.run(subjectId);
  }

  if (taxonomy === "production-prefixed") {
    for (const oldId of ["subj_math", "subj_physics", "subj_chemistry", "subj_biology"]) {
      db.prepare("INSERT INTO subjects(id,exam_type_id,is_active) VALUES (?,'legacy',0)").run(oldId);
    }
  }
  const insertTopic = db.prepare(
    "INSERT INTO topics(id,subject_id) VALUES (?,?)",
  );
  const topicOwners = new Map<string, string>();
  for (const row of manifest.mappings) topicOwners.set(row.topicId, row.subjectId);
  const oldSubject = new Map([
    ["subj_nsmq_math", "subj_math"],
    ["subj_nsmq_physics", "subj_physics"],
    ["subj_nsmq_chemistry", "subj_chemistry"],
    ["subj_nsmq_biology", "subj_biology"],
  ]);
  const resolutionByLogical = new Map(manifest.topicResolutions.map((row) => [row.logicalTopicId, row]));
  for (const [topicId, subjectId] of topicOwners) {
    const resolution = resolutionByLogical.get(topicId);
    if (taxonomy === "production-prefixed" && resolution?.candidateTopicIds.length === 2) {
      insertTopic.run(resolution.candidateTopicIds[0], subjectId);
      insertTopic.run(topicId, oldSubject.get(subjectId));
    } else insertTopic.run(topicId, subjectId);
  }

  const insertQuestion = db.prepare(
    "INSERT INTO questions(id,subject_id,round_type,topic_id) VALUES (?,?,?,NULL)",
  );
  for (const row of [...manifest.mappings, ...manifest.quarantines]) {
    insertQuestion.run(row.questionId, row.subjectId, row.roundType);
  }
  return db;
}

function execAtomic(db: Database.Database, sql: string): void {
  db.exec("BEGIN");
  try {
    db.exec(sql);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function applyAll(db: Database.Database): void {
  for (const sql of migrationSql) execAtomic(db, sql);
}

function rollbackAll(db: Database.Database): void {
  for (let index = rollbackSql.length - 1; index >= 0; index -= 1) {
    execAtomic(db, rollbackSql[index]);
  }
}

function scratchCount(db: Database.Database): number {
  return (
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name LIKE '_nsmq_legacy_%'",
      )
      .get() as { count: number }
  ).count;
}

function expectGuardFailure(db: Database.Database, sql: string): void {
  expect(() => execAtomic(db, sql)).toThrow(/CHECK constraint failed/);
  expect(scratchCount(db)).toBe(0);
}

describe("legacy NSMQ null-topic migrations 278-280", () => {
  it("uses bounded D1-safe regular scratch and exact 90/90/88 chunks", () => {
    expect(manifest.chunkSizes).toEqual([90, 90, 88]);
    expect(
      manifest.migrationIds.map(
        (migrationId) =>
          manifest.mappings.filter((row) => row.migrationId === migrationId)
            .length,
      ),
    ).toEqual([90, 90, 88]);
    for (const sql of [
      ...migrationSql,
      ...rollbackSql,
      preflightSql,
      postflightSql,
    ]) {
      expect(sql).not.toMatch(/\bTEMP(?:ORARY)?\b|CREATE\s+TABLE\s+\S+\s+AS\s+SELECT/i);
    }
    for (const sql of migrationSql) {
      expect(Buffer.byteLength(sql.replace(/\r?\n/g, "\r\n"), "utf8")).toBeLessThan(
        19_500,
      );
    }
  });

  it("resolves production-prefixed topics and ignores inactive generic owners", () => {
    const db = setup("production-prefixed");
    execAtomic(db, preflightSql);
    applyAll(db);
    execAtomic(db, postflightSql);
    const expectedByLogical = new Map(
      manifest.topicResolutions.map((resolution) => [
        resolution.logicalTopicId,
        resolution.candidateTopicIds[0],
      ]),
    );
    const actual = db.prepare("SELECT topic_id FROM questions WHERE id=?");
    for (const mapping of manifest.mappings) {
      expect(actual.get(mapping.questionId)).toEqual({
        topic_id: expectedByLogical.get(mapping.topicId),
      });
    }
    expect(db.pragma("foreign_key_check")).toEqual([]);
    db.close();
  });

  it("accepts an already-applied staging-generic ledger without rewriting it", () => {
    const db = setup();
    const update = db.prepare("UPDATE questions SET topic_id=? WHERE id=?");
    const insertLog = db.prepare(`
      INSERT INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
      VALUES (?,'question',?,'topic_id',NULL,?)
    `);
    const seedOldAppliedState = db.transaction(() => {
      for (const mapping of manifest.mappings) {
        update.run(mapping.topicId, mapping.questionId);
        insertLog.run(mapping.migrationId, mapping.questionId, mapping.topicId);
      }
    });
    seedOldAppliedState();
    const before = db
      .prepare("SELECT migration_id,entity_id,new_value FROM question_bank_remediation_log ORDER BY migration_id,entity_id")
      .all();
    execAtomic(db, postflightSql);
    expect(
      db.prepare("SELECT migration_id,entity_id,new_value FROM question_bank_remediation_log ORDER BY migration_id,entity_id").all(),
    ).toEqual(before);
    expect(scratchCount(db)).toBe(0);
    db.close();
  });

  it("fails closed when both canonical and generic candidates are active", () => {
    const resolution = manifest.topicResolutions.find(
      (item) =>
        item.candidateTopicIds.length === 2 &&
        manifest.mappings.some(
          (mapping) =>
            mapping.migrationId === manifest.migrationIds[0] &&
            mapping.topicId === item.logicalTopicId,
        ),
    );
    if (!resolution) throw new Error("Missing legacy ambiguity fixture");
    const db = setup();
    db.prepare("INSERT INTO topics(id,subject_id) VALUES (?,?)").run(
      resolution.candidateTopicIds[0],
      resolution.subjectId,
    );
    expectGuardFailure(db, preflightSql);
    expectGuardFailure(db, migrationSql[0]);
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM question_bank_remediation_log").get(),
    ).toEqual({ count: 0 });
    db.close();
  });

  it("preflight proves the exact 270-row source and leaves no scratch residue", () => {
    const db = setup();
    execAtomic(db, preflightSql);
    expect(scratchCount(db)).toBe(0);

    db.prepare("DELETE FROM questions WHERE id=?").run(
      manifest.mappings[0].questionId,
    );
    expectGuardFailure(db, preflightSql);
    db.close();
  });

  it("maps 268 rows, preserves two quarantines and reconciles usable topic sums", () => {
    const db = setup();
    execAtomic(db, preflightSql);
    applyAll(db);
    execAtomic(db, postflightSql);

    expect(
      db.prepare("SELECT COUNT(*) AS count FROM questions WHERE topic_id IS NOT NULL").get(),
    ).toEqual({ count: 268 });
    expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM question_bank_remediation_log WHERE migration_id IN (${manifest.migrationIds.map(() => "?").join(",")})`,
        )
        .get(...manifest.migrationIds),
    ).toEqual({ count: 268 });
    for (const row of manifest.quarantines) {
      expect(
        db.prepare("SELECT topic_id FROM questions WHERE id=?").get(row.questionId),
      ).toEqual({ topic_id: null });
    }

    const usableBySubject = db
      .prepare(
        "SELECT subject_id,COUNT(*) AS count FROM questions WHERE topic_id IS NOT NULL GROUP BY subject_id ORDER BY subject_id",
      )
      .all();
    const topicSums = db
      .prepare(
        `SELECT q.subject_id,SUM(topic_count) AS count FROM (
          SELECT subject_id,topic_id,COUNT(*) AS topic_count
          FROM questions WHERE topic_id IS NOT NULL GROUP BY subject_id,topic_id
        ) q GROUP BY q.subject_id ORDER BY q.subject_id`,
      )
      .all();
    expect(usableBySubject).toEqual([
      { subject_id: "subj_nsmq_biology", count: 75 },
      { subject_id: "subj_nsmq_chemistry", count: 75 },
      { subject_id: "subj_nsmq_math", count: 69 },
      { subject_id: "subj_nsmq_physics", count: 49 },
    ]);
    expect(topicSums).toEqual(usableBySubject);
    expect(
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.subject_id<>t.subject_id",
        )
        .get(),
    ).toEqual({ count: 0 });
    expect(scratchCount(db)).toBe(0);
    db.close();
  });

  it("replays without duplicate writes or consuming quarantined inventory", () => {
    const db = setup();
    applyAll(db);
    const before = db
      .prepare("SELECT id,topic_id FROM questions ORDER BY id")
      .all();
    applyAll(db);
    expect(db.prepare("SELECT id,topic_id FROM questions ORDER BY id").all()).toEqual(
      before,
    );
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM question_bank_remediation_log").get(),
    ).toEqual({ count: 268 });
    expect(scratchCount(db)).toBe(0);
    db.close();
  });

  it("fails closed on inactive subjects, wrong ownership, source drift and ledger drift", () => {
    const first = manifest.mappings.find(
      (row) => row.migrationId === manifest.migrationIds[0],
    );
    expect(first).toBeDefined();
    const mutations: Array<(db: Database.Database) => void> = [
      (db) => {
        db.prepare("UPDATE subjects SET is_active=0 WHERE id=?").run(first?.subjectId);
      },
      (db) => {
        const otherSubject =
          first?.subjectId === "subj_nsmq_math"
            ? "subj_nsmq_physics"
            : "subj_nsmq_math";
        db.prepare("UPDATE topics SET subject_id=? WHERE id=?").run(
          otherSubject,
          first?.topicId,
        );
      },
      (db) => {
        db.prepare("UPDATE questions SET subject_id='subj_nsmq_physics' WHERE id=?").run(
          first?.questionId,
        );
      },
      (db) => {
        db.prepare("UPDATE questions SET topic_id=? WHERE id=?").run(
          first?.topicId,
          first?.questionId,
        );
      },
      (db) => {
        db.prepare(
          "INSERT INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES (?,?,?,?,?,?)",
        ).run(
          manifest.migrationIds[0],
          "question",
          first?.questionId,
          "unexpected_field",
          null,
          first?.topicId,
        );
      },
    ];

    for (const mutate of mutations) {
      const db = setup();
      mutate(db);
      expectGuardFailure(db, migrationSql[0]);
      expect(
        db.prepare("SELECT topic_id FROM questions WHERE id=?").get(first?.questionId),
      ).toEqual({ topic_id: mutations.indexOf(mutate) === 3 ? first?.topicId : null });
      db.close();
    }
  });

  it("rejects out-of-order apply and rollback", () => {
    const db = setup();
    expectGuardFailure(db, migrationSql[1]);
    applyAll(db);
    expectGuardFailure(db, rollbackSql[0]);
    db.close();
  });

  it("rolls back in reverse order to the exact null-topic source and replays safely", () => {
    const db = setup();
    const before = db
      .prepare("SELECT id,topic_id FROM questions ORDER BY id")
      .all();
    applyAll(db);
    rollbackAll(db);
    expect(db.prepare("SELECT id,topic_id FROM questions ORDER BY id").all()).toEqual(
      before,
    );
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM question_bank_remediation_log").get(),
    ).toEqual({ count: 0 });
    rollbackAll(db);
    expect(scratchCount(db)).toBe(0);
    expect(db.pragma("foreign_key_check")).toEqual([]);
    db.close();
  });
});
