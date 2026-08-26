import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  new URL(
    "../../../database/migrations/139_retire_invalid_wassce_catalogue_records.sql",
    import.meta.url,
  ),
  "utf8",
);

const targetIds = ["subj_wassce_commerce", "subj_wassce_visual_arts"] as const;

function createFixture(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE exam_types (id TEXT PRIMARY KEY);
    CREATE TABLE subject_categories (
      id TEXT PRIMARY KEY,
      exam_type_id TEXT NOT NULL REFERENCES exam_types(id)
    );
    CREATE TABLE subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      exam_type_id TEXT NOT NULL REFERENCES exam_types(id),
      category_id TEXT NOT NULL REFERENCES subject_categories(id),
      waec_code TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id)
    );
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id)
    );
    CREATE TABLE past_papers (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id)
    );
    CREATE TABLE subject_specifications (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id)
    );
    CREATE TABLE question_bank_remediation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_id TEXT NOT NULL,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('subject', 'question')),
      entity_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (migration_id, entity_type, entity_id, field_name)
    );

    INSERT INTO exam_types(id) VALUES
      ('exam_wassce'), ('edexcel_igcse'), ('exam_gbce');
    INSERT INTO subject_categories(id, exam_type_id) VALUES
      ('cat_wassce_business', 'exam_wassce'),
      ('cat_wassce_arts', 'exam_wassce'),
      ('cat_wassce_technical', 'exam_wassce'),
      ('cat_edexcel_business', 'edexcel_igcse'),
      ('cat_gbce_business', 'exam_gbce');

    INSERT INTO subjects(
      id, name, slug, exam_type_id, category_id, waec_code, is_active
    ) VALUES
      ('subj_wassce_commerce', 'Commerce', 'wassce-commerce',
       'exam_wassce', 'cat_wassce_business', 'COM', 1),
      ('subj_wassce_visual_arts', 'Visual Arts', 'wassce-visual-arts',
       'exam_wassce', 'cat_wassce_arts', 'VIA', 1),
      ('subj_wassce_picture_making', 'Picture Making', 'wassce-picture-making',
       'exam_wassce', 'cat_wassce_technical', 'PMK', 1),
      ('subj_wassce_basketry', 'Basketry', 'wassce-basketry',
       'exam_wassce', 'cat_wassce_technical', 'BSK', 1),
      ('subj_wassce_leatherwork', 'Leatherwork', 'wassce-leatherwork',
       'exam_wassce', 'cat_wassce_technical', 'LWK', 1),
      ('subj_wassce_sculpture', 'Sculpture', 'wassce-sculpture',
       'exam_wassce', 'cat_wassce_technical', 'SCL', 1),
      ('subj_edexcel_commerce', 'Pearson Commerce', 'edexcel-commerce',
       'edexcel_igcse', 'cat_edexcel_business', NULL, 1),
      ('subj_gbce_commerce', 'GBCE Commerce', 'gbce-commerce',
       'exam_gbce', 'cat_gbce_business', 'COM', 1);
  `);
  return db;
}

function subjectSnapshot(db: Database.Database) {
  return db
    .prepare(`
      SELECT id, name, slug, exam_type_id AS examTypeId,
             category_id AS categoryId, waec_code AS waecCode,
             is_active AS isActive
      FROM subjects ORDER BY id
    `)
    .all();
}

function ledgerSnapshot(db: Database.Database) {
  return db
    .prepare(`
      SELECT migration_id AS migrationId, entity_type AS entityType,
             entity_id AS entityId, field_name AS fieldName,
             old_value AS oldValue, new_value AS newValue
      FROM question_bank_remediation_log
      ORDER BY migration_id, entity_type, entity_id, field_name
    `)
    .all();
}

describe("migration 139 WASSCE catalogue retirement", () => {
  it("stays deterministic and below the remote D1 statement-size budget", () => {
    const normalized = migrationSql.replace(/\r\n/g, "\n");
    const crlf = normalized.replace(/\n/g, "\r\n");
    const ledgerWrite = `
INSERT INTO "d1_migrations" (name)
values ('139_retire_invalid_wassce_catalogue_records.sql');`;

    expect(migrationSql.endsWith("\n")).toBe(true);
    expect(Buffer.byteLength(crlf + ledgerWrite, "utf8")).toBeLessThan(19_500);
    expect(migrationSql).not.toMatch(/\b(?:BEGIN|COMMIT|ROLLBACK)\b/);
  });

  it("retires only the two reviewed WASSCE records and is idempotent", () => {
    const db = createFixture();
    const preservedBefore = subjectSnapshot(db).filter(
      (row) => !targetIds.includes((row as { id: string }).id as (typeof targetIds)[number]),
    );

    db.exec(migrationSql);
    const afterFirstRun = subjectSnapshot(db);
    expect(
      db
        .prepare(`
          SELECT id, slug, is_active AS isActive
          FROM subjects WHERE id IN (?, ?) ORDER BY id
        `)
        .all(...targetIds),
    ).toEqual([
      {
        id: "subj_wassce_commerce",
        slug: "wassce-commerce--retired-139",
        isActive: 0,
      },
      {
        id: "subj_wassce_visual_arts",
        slug: "wassce-visual-arts--retired-139",
        isActive: 0,
      },
    ]);
    expect(
      db
        .prepare(`
          SELECT entity_id AS entityId, field_name AS fieldName,
                 old_value AS oldValue, new_value AS newValue
          FROM question_bank_remediation_log
          WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
          ORDER BY entity_id, field_name
        `)
        .all(),
    ).toEqual([
      {
        entityId: "subj_wassce_commerce",
        fieldName: "is_active",
        oldValue: "1",
        newValue: "0",
      },
      {
        entityId: "subj_wassce_commerce",
        fieldName: "slug",
        oldValue: "wassce-commerce",
        newValue: "wassce-commerce--retired-139",
      },
      {
        entityId: "subj_wassce_visual_arts",
        fieldName: "is_active",
        oldValue: "1",
        newValue: "0",
      },
      {
        entityId: "subj_wassce_visual_arts",
        fieldName: "slug",
        oldValue: "wassce-visual-arts",
        newValue: "wassce-visual-arts--retired-139",
      },
    ]);
    expect(
      afterFirstRun.filter(
        (row) => !targetIds.includes((row as { id: string }).id as (typeof targetIds)[number]),
      ),
    ).toEqual(preservedBefore);

    db.exec(migrationSql);
    expect(subjectSnapshot(db)).toEqual(afterFirstRun);
    expect(
      db
        .prepare(`
          SELECT COUNT(*) AS count FROM question_bank_remediation_log
          WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
        `)
        .get(),
    ).toEqual({ count: 4 });
    expect(db.pragma("foreign_key_check")).toEqual([]);
    expect(db.pragma("integrity_check", { simple: true })).toBe("ok");
    db.close();
  });

  it.each([
    ["Commerce slug old value", "subj_wassce_commerce", "slug", "old_value"],
    ["Commerce slug new value", "subj_wassce_commerce", "slug", "new_value"],
    ["Commerce active old value", "subj_wassce_commerce", "is_active", "old_value"],
    ["Commerce active new value", "subj_wassce_commerce", "is_active", "new_value"],
    ["Visual Arts slug old value", "subj_wassce_visual_arts", "slug", "old_value"],
    ["Visual Arts slug new value", "subj_wassce_visual_arts", "slug", "new_value"],
    ["Visual Arts active old value", "subj_wassce_visual_arts", "is_active", "old_value"],
    ["Visual Arts active new value", "subj_wassce_visual_arts", "is_active", "new_value"],
  ] as const)(
    "fails closed when the %s ledger tuple drifts",
    (_label, entityId, fieldName, column) => {
      const db = createFixture();
      db.exec(migrationSql);
      db.prepare(`
        UPDATE question_bank_remediation_log
        SET ${column} = 'corrupted'
        WHERE migration_id = '139_retire_invalid_wassce_catalogue_records'
          AND entity_type = 'subject'
          AND entity_id = ?
          AND field_name = ?
      `).run(entityId, fieldName);
      const subjectsBeforeReplay = subjectSnapshot(db);
      const ledgerBeforeReplay = ledgerSnapshot(db);

      expect(() => db.exec(migrationSql)).toThrow();
      expect(subjectSnapshot(db)).toEqual(subjectsBeforeReplay);
      expect(ledgerSnapshot(db)).toEqual(ledgerBeforeReplay);
      db.close();
    },
  );

  it.each([
    ["questions", "INSERT INTO questions(id, subject_id) VALUES ('q-risk', ?)", "subj_wassce_commerce"],
    ["topics", "INSERT INTO topics(id, subject_id) VALUES ('topic-risk', ?)", "subj_wassce_visual_arts"],
    ["past papers", "INSERT INTO past_papers(id, subject_id) VALUES ('paper-risk', ?)", "subj_wassce_commerce"],
    [
      "subject specifications",
      "INSERT INTO subject_specifications(id, subject_id) VALUES ('spec-risk', ?)",
      "subj_wassce_visual_arts",
    ],
  ])("fails before mutation when %s reference a retirement target", (_label, sql, subjectId) => {
    const db = createFixture();
    db.prepare(sql).run(subjectId);
    const before = subjectSnapshot(db);

    expect(() => db.exec(migrationSql)).toThrow();
    expect(subjectSnapshot(db)).toEqual(before);
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM question_bank_remediation_log").get(),
    ).toEqual({ count: 0 });
    db.close();
  });

  it.each([
    ["a target is missing", "DELETE FROM subjects WHERE id = 'subj_wassce_commerce'"],
    [
      "target metadata drifted",
      "UPDATE subjects SET exam_type_id = 'edexcel_igcse' WHERE id = 'subj_wassce_commerce'",
    ],
    [
      "a retired slug is occupied",
      "UPDATE subjects SET slug = 'wassce-commerce--retired-139' WHERE id = 'subj_edexcel_commerce'",
    ],
  ])("fails before mutation when %s", (_label, setupSql) => {
    const db = createFixture();
    db.exec(setupSql);
    const before = subjectSnapshot(db);

    expect(() => db.exec(migrationSql)).toThrow();
    expect(subjectSnapshot(db)).toEqual(before);
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM question_bank_remediation_log").get(),
    ).toEqual({ count: 0 });
    db.close();
  });
});
