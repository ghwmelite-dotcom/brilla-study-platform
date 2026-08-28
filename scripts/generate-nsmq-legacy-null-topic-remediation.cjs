"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const Database = require("better-sqlite3");
const { buildTopicResolutions } = require("./nsmq-topic-identity-resolver.cjs");

const ROOT = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "database", "manifests", "nsmq-topic-remediation", "legacy-null-topic-plan-278-280.json");
const MIGRATION_DIR = path.join(ROOT, "database", "migrations");
const ROLLBACK_DIR = path.join(ROOT, "database", "rollbacks");
const PREFLIGHT_DIR = path.join(ROOT, "database", "preflight");
const RELEASE = "nsmq-legacy-null-topic-remediation-2026-08-26";
const STAGING_DATABASE = "brilla-db-staging";
const MIGRATION_IDS = [
  "278_nsmq_legacy_null_topic_part_1",
  "279_nsmq_legacy_null_topic_part_2",
  "280_nsmq_legacy_null_topic_part_3",
];
const PART_SIZES = [90, 90, 88];

const SUBJECTS = {
  subj_nsmq_math: { label: "Mathematics", oldId: "subj_math" },
  subj_nsmq_physics: { label: "Physics", oldId: "subj_physics" },
  subj_nsmq_chemistry: { label: "Chemistry", oldId: "subj_chemistry" },
  subj_nsmq_biology: { label: "Biology", oldId: "subj_biology" },
};
const OLD_TO_CURRENT_SUBJECT = Object.fromEntries(Object.entries(SUBJECTS).map(([id, value]) => [value.oldId, id]));

const seq = (prefix, start, end) => Array.from({ length: end - start + 1 }, (_, index) => `${prefix}${String(start + index).padStart(3, "0")}`);
const group = (subjectId, topicId, evidenceCode, ids) => ({ subjectId, topicId, evidenceCode, ids });

const EVIDENCE = {
  math_algebra: "Explicit arithmetic, number properties, algebraic manipulation, equations, indices, roots, logarithms or ratios; follows the existing broad NSMQ Algebra convention.",
  math_geometry: "Explicit plane or solid geometry, mensuration, circle, angle or shape property.",
  math_statistics: "Explicit sequence, factorial/counting or figurate-number content; follows the existing NSMQ Statistics and Probability grouping convention.",
  math_trigonometry: "Explicit trigonometric ratio or degree-radian conversion.",
  physics_mechanics: "Explicit force, motion, work, energy, momentum, power, pressure or Newtonian mechanics.",
  physics_waves: "Explicit sound, light, frequency, wavelength, reflection, refraction, optics or dispersion.",
  physics_electricity: "Explicit charge, current, resistance, circuits, induction, generation or electrical energy.",
  physics_thermodynamics: "Explicit temperature, heat transfer, thermal expansion, phase change or heat capacity.",
  physics_modern: "Explicit atomic, nuclear, radiation, isotope or mass-energy content.",
  chemistry_atomic: "Explicit element identity, periodic group, atomic number, shells, electron configuration or flame identification.",
  chemistry_bonding: "Explicit compound identity/formula, valency, ions, molecular composition or chemical bonding.",
  chemistry_stoichiometry: "Explicit formula counting, molar mass, balancing, conservation or qualitative reaction/gas-test content under the existing broad Stoichiometry convention.",
  chemistry_equilibrium: "Explicit acid-base chemistry, pH, neutralisation, energetics, kinetics or catalysis under the existing broad Equilibrium convention.",
  chemistry_organic: "Explicit hydrocarbon, petroleum, functional-group or polymer chemistry.",
  chemistry_electrochemistry: "Explicit oxidation state, electron-transfer oxidation/reduction or corrosion.",
  chemistry_environmental: "Explicit atmospheric composition/environmental chemistry.",
  biology_cells: "Explicit cell structure, organelle, membrane, mitosis or cellular function.",
  biology_genetics: "Explicit meiosis, chromosome, DNA, gene, allele, mutation, inheritance or evolution.",
  biology_ecology: "Explicit organism relationship, ecosystem, food chain, biogeochemical cycle, habitat or biodiversity.",
  biology_physiology: "Explicit human or plant organ, tissue, transport, digestion, excretion, reproduction or homeostatic function.",
  biology_biochemistry: "Explicit photosynthesis, respiration, chlorophyll or biochemical energy conversion.",
};

const GROUPS = [
  group("subj_nsmq_math", "topic_algebra", "math_algebra", [
    ...seq("nsmq_math_sr_", 1, 6), "nsmq_math_sr_008", ...seq("nsmq_math_sr_", 10, 14), "nsmq_math_sr_019",
    ...seq("nsmq_math_sr_", 27, 35), ...seq("nsmq_math_sr_", 46, 56), "nsmq_math_sr_059", "nsmq_math_sr_061",
    "nsmq_math_sr_064", "nsmq_math_sr_065", "nsmq_math_sr_070", ...seq("nsmq_math_sr_", 72, 75),
  ]),
  group("subj_nsmq_math", "topic_geometry", "math_geometry", [
    "nsmq_math_sr_007", "nsmq_math_sr_009", "nsmq_math_sr_015", "nsmq_math_sr_016", "nsmq_math_sr_018", "nsmq_math_sr_020",
    ...seq("nsmq_math_sr_", 36, 45), "nsmq_math_sr_071",
  ]),
  group("subj_nsmq_math", "topic_statistics", "math_statistics", [
    "nsmq_math_sr_017", "nsmq_math_sr_057", "nsmq_math_sr_058", "nsmq_math_sr_060", "nsmq_math_sr_062", "nsmq_math_sr_063",
  ]),
  group("subj_nsmq_math", "topic_trigonometry", "math_trigonometry", seq("nsmq_math_sr_", 66, 69)),

  group("subj_nsmq_physics", "topic_mechanics", "physics_mechanics", seq("nsmq_phys_sr_", 27, 35)),
  group("subj_nsmq_physics", "topic_waves", "physics_waves", seq("nsmq_phys_sr_", 36, 45)),
  group("subj_nsmq_physics", "topic_electricity", "physics_electricity", seq("nsmq_phys_sr_", 46, 55)),
  group("subj_nsmq_physics", "topic_thermodynamics", "physics_thermodynamics", seq("nsmq_phys_sr_", 56, 65)),
  group("subj_nsmq_physics", "topic_modern_physics", "physics_modern", seq("nsmq_phys_sr_", 66, 75)),

  group("subj_nsmq_chemistry", "topic_atomic", "chemistry_atomic", [
    "nsmq_chem_sr_001", "nsmq_chem_sr_002", "nsmq_chem_sr_011", "nsmq_chem_sr_017", "nsmq_chem_sr_018", "nsmq_chem_sr_022", "nsmq_chem_sr_024",
    ...seq("nsmq_chem_sr_", 26, 35),
  ]),
  group("subj_nsmq_chemistry", "topic_bonding", "chemistry_bonding", [
    "nsmq_chem_sr_004", "nsmq_chem_sr_007", "nsmq_chem_sr_009", "nsmq_chem_sr_010", "nsmq_chem_sr_014", "nsmq_chem_sr_016", "nsmq_chem_sr_020",
    ...seq("nsmq_chem_sr_", 36, 45),
  ]),
  group("subj_nsmq_chemistry", "topic_stoichiometry", "chemistry_stoichiometry", [
    "nsmq_chem_sr_003", "nsmq_chem_sr_005", "nsmq_chem_sr_023", "nsmq_chem_sr_056", "nsmq_chem_sr_060", "nsmq_chem_sr_064", "nsmq_chem_sr_065",
  ]),
  group("subj_nsmq_chemistry", "topic_equilibrium", "chemistry_equilibrium", [
    "nsmq_chem_sr_006", "nsmq_chem_sr_013", "nsmq_chem_sr_015", ...seq("nsmq_chem_sr_", 46, 55),
    "nsmq_chem_sr_057", "nsmq_chem_sr_061", "nsmq_chem_sr_062", "nsmq_chem_sr_063",
  ]),
  group("subj_nsmq_chemistry", "topic_organic", "chemistry_organic", ["nsmq_chem_sr_012", "nsmq_chem_sr_019", ...seq("nsmq_chem_sr_", 66, 75)]),
  group("subj_nsmq_chemistry", "topic_electrochemistry", "chemistry_electrochemistry", ["nsmq_chem_sr_021", "nsmq_chem_sr_025", "nsmq_chem_sr_058", "nsmq_chem_sr_059"]),
  group("subj_nsmq_chemistry", "topic_nsmq_chem_environmental", "chemistry_environmental", ["nsmq_chem_sr_008"]),

  group("subj_nsmq_biology", "topic_cells", "biology_cells", ["nsmq_bio_sr_012", "nsmq_bio_sr_016", "nsmq_bio_sr_026", "nsmq_bio_sr_027", "nsmq_bio_sr_028", ...seq("nsmq_bio_sr_", 30, 33)]),
  group("subj_nsmq_biology", "topic_genetics", "biology_genetics", ["nsmq_bio_sr_021", "nsmq_bio_sr_034", "nsmq_bio_sr_035", ...seq("nsmq_bio_sr_", 56, 65)]),
  group("subj_nsmq_biology", "topic_ecology", "biology_ecology", ["nsmq_bio_sr_007", "nsmq_bio_sr_025", ...seq("nsmq_bio_sr_", 66, 75)]),
  group("subj_nsmq_biology", "topic_physiology", "biology_physiology", [
    "nsmq_bio_sr_001", ...seq("nsmq_bio_sr_", 4, 6), ...seq("nsmq_bio_sr_", 8, 11), ...seq("nsmq_bio_sr_", 13, 15),
    ...seq("nsmq_bio_sr_", 17, 20), ...seq("nsmq_bio_sr_", 22, 24), ...seq("nsmq_bio_sr_", 36, 45), ...seq("nsmq_bio_sr_", 48, 55),
  ]),
  group("subj_nsmq_biology", "topic_biochemistry", "biology_biochemistry", ["nsmq_bio_sr_002", "nsmq_bio_sr_003", "nsmq_bio_sr_029", "nsmq_bio_sr_046", "nsmq_bio_sr_047"]),
];

const QUARANTINES = [
  { questionId: "nsmq_phy_rid_001", subjectId: "subj_nsmq_physics", roundType: "riddles", reasonCode: "MISCLASSIFIED_NON_SUBJECT_CONTENT", reviewNote: "Reviewed wordplay does not assess Physics; keep null-topic so it remains unusable." },
  { questionId: "nsmq_phy_rid_003", subjectId: "subj_nsmq_physics", roundType: "riddles", reasonCode: "MISCLASSIFIED_NON_SUBJECT_CONTENT", reviewNote: "Reviewed lateral wordplay does not assess Physics; keep null-topic so it remains unusable." },
];

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fingerprint(row) {
  return sha(JSON.stringify({
    id: row.id,
    subjectId: row.subject_id,
    roundType: row.round_type,
    questionText: row.question_text,
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
  }));
}

function allDispositionIds() {
  return [...GROUPS.flatMap((item) => item.ids), ...QUARANTINES.map((item) => item.questionId)];
}

function loadArchiveRows() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE questions(
    id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, question_text TEXT NOT NULL,
    question_type TEXT, round_type TEXT, topic_id TEXT, options TEXT,
    correct_answer TEXT NOT NULL, explanation TEXT, difficulty TEXT,
    points INTEGER, marks INTEGER, time_limit INTEGER, is_compulsory INTEGER
  );`);
  for (const file of ["041_nsmq_speed_race.sql", "042_more_speed_race_questions.sql", "044_nsmq_riddles.sql"]) {
    db.exec(fs.readFileSync(path.join(ROOT, "database", "migrations", "archive", file), "utf8"));
  }
  const wanted = new Set(allDispositionIds());
  const rows = db.prepare("SELECT id,subject_id,round_type,question_text,correct_answer,explanation FROM questions ORDER BY id").all()
    .filter((row) => wanted.has(row.id))
    .map((row) => ({ ...row, subject_id: OLD_TO_CURRENT_SUBJECT[row.subject_id] || row.subject_id }));
  db.close();
  if (rows.length !== wanted.size) throw new Error(`Archive inventory drift: expected ${wanted.size}, found ${rows.length}`);
  return rows;
}

function captureStagingRows() {
  const executable = process.execPath;
  const wrangler = path.join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
  const rows = [];
  for (const subjectId of Object.keys(SUBJECTS)) {
    const query = `SELECT id,subject_id,round_type,length(question_text) AS question_length,length(correct_answer) AS answer_length,length(coalesce(explanation,'')) AS explanation_length FROM questions WHERE topic_id IS NULL AND subject_id='${subjectId}' ORDER BY id LIMIT 100`;
    const output = execFileSync(executable, [wrangler, "d1", "execute", STAGING_DATABASE, "--env", "staging", "--remote", "--json", "--command", query], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      stdio: ["ignore", "pipe", "inherit"],
    });
    const result = JSON.parse(output);
    rows.push(...result.flatMap((entry) => entry.results || []));
  }
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

function validateTaxonomy(mappings) {
  const db = new Database(":memory:");
  db.exec(fs.readFileSync(path.join(ROOT, "database", "schema.sql"), "utf8"));
  db.exec(fs.readFileSync(path.join(ROOT, "database", "seed.sql"), "utf8"));
  db.prepare("INSERT OR IGNORE INTO topics(id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)").run("topic_nsmq_chem_environmental", "subj_nsmq_chemistry", null, "Environmental Chemistry", "environmental-chemistry", "Chemical processes and substances affecting the atmosphere and environment.", null, null, 7, "2026-08-26T00:00:00.000Z");
  const topic = db.prepare(`SELECT t.id FROM topics t JOIN subjects s ON s.id=t.subject_id
    WHERE t.id=? AND t.subject_id=? AND s.exam_type_id='exam_nsmq' AND s.is_active=1`);
  for (const resolution of buildTopicResolutions(mappings)) {
    const valid = resolution.candidateTopicIds.filter((topicId) =>
      topic.get(topicId, resolution.subjectId),
    );
    if (valid.length !== 1) {
      throw new Error(
        `Topic resolution drift for ${resolution.logicalTopicId}: expected exactly one valid candidate, got ${valid.length}`,
      );
    }
  }
  db.close();
}

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) counts[row[field]] = (counts[row[field]] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function buildPlan(sourceRows = loadArchiveRows(), source = "staging-d1-identity-and-shape-verified-against-archive") {
  const ids = allDispositionIds();
  if (ids.length !== 270 || new Set(ids).size !== 270) throw new Error(`Disposition cardinality drift: rows=${ids.length}, unique=${new Set(ids).size}`);
  const byId = new Map(sourceRows.map((row) => [row.id, row]));
  if (sourceRows.length !== 270 || byId.size !== 270) throw new Error(`Source inventory must contain exactly 270 unique rows`);
  const mappings = [];
  for (const item of GROUPS) {
    for (const questionId of item.ids) {
      const row = byId.get(questionId);
      if (!row || row.subject_id !== item.subjectId || row.round_type !== "speed_race") throw new Error(`Source identity drift for ${questionId}`);
      mappings.push({
        questionId,
        subjectId: item.subjectId,
        roundType: row.round_type,
        topicId: item.topicId,
        classificationSource: "archived-source-content-review",
        evidenceCode: item.evidenceCode,
        evidence: EVIDENCE[item.evidenceCode],
        provenance: questionId.match(/_(0(?:0[1-9]|1\d|2[0-5]))$/) ? "database/migrations/archive/041_nsmq_speed_race.sql" : "database/migrations/archive/042_more_speed_race_questions.sql",
        sourceContentFingerprint: fingerprint(row),
      });
    }
  }
  if (mappings.length !== 268 || new Set(mappings.map((row) => row.questionId)).size !== 268) throw new Error("Mapping plan must contain exactly 268 unique rows");
  const quarantines = QUARANTINES.map((item) => {
    const row = byId.get(item.questionId);
    if (!row || row.subject_id !== item.subjectId || row.round_type !== item.roundType) throw new Error(`Quarantine identity drift for ${item.questionId}`);
    return { ...item, provenance: "database/migrations/archive/044_nsmq_riddles.sql", sourceContentFingerprint: fingerprint(row) };
  });
  validateTaxonomy(mappings);
  mappings.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.questionId.localeCompare(b.questionId));
  const parts = [];
  let offset = 0;
  for (let index = 0; index < PART_SIZES.length; index += 1) {
    const rows = mappings.slice(offset, offset + PART_SIZES[index]);
    parts.push({ migrationId: MIGRATION_IDS[index], migrationNumber: 278 + index, rows });
    offset += PART_SIZES[index];
  }
  if (offset !== mappings.length || parts.some((part, index) => part.rows.length !== PART_SIZES[index])) throw new Error("Migration chunk drift");
  const migrationByQuestion = new Map(parts.flatMap((part) => part.rows.map((row) => [row.questionId, part.migrationId])));
  const inventoryHash = sha(sourceRows.slice().sort((a, b) => a.id.localeCompare(b.id)).map((row) => `${row.id}:${fingerprint(row)}`).join("\n"));
  return {
    release: RELEASE,
    status: "staging-verified-local-artifacts-not-applied",
    source,
    authoritativeNullTopicCount: 270,
    mappingCount: 268,
    quarantineCount: 2,
    unresolvedCount: 0,
    chunkSizes: PART_SIZES,
    migrationIds: MIGRATION_IDS,
    sourceInventoryHash: inventoryHash,
    subjectTotals: countBy([...mappings, ...quarantines], "subjectId"),
    topicCounts: countBy(mappings, "topicId"),
    evidenceDefinitions: EVIDENCE,
    generationContract: "Every staging null-topic NSMQ row has exactly one disposition; mappings require exact ID, subject, round and source-content fingerprint; each logical topic must resolve to exactly one existing topic owned by the expected active NSMQ subject; zero or multiple candidates fail closed; non-subject riddles remain quarantined and unusable.",
    topicResolutions: buildTopicResolutions(mappings),
    mappings: mappings.map((row) => ({ ...row, migrationId: migrationByQuestion.get(row.questionId) })),
    quarantines,
    generatedAt: "deterministic-no-runtime-timestamp",
    parts,
  };
}

function compareStagingToArchive(stagingRows) {
  const archiveRows = loadArchiveRows();
  const archive = new Map(archiveRows.map((row) => [row.id, row]));
  const expected = new Set(allDispositionIds());
  const actual = new Set(stagingRows.map((row) => row.id));
  if (actual.size !== 270 || expected.size !== 270 || [...expected].some((id) => !actual.has(id)) || [...actual].some((id) => !expected.has(id))) {
    throw new Error(`Staging inventory ID drift: expected=${expected.size}, actual=${actual.size}`);
  }
  for (const row of stagingRows) {
    const local = archive.get(row.id);
    if (!local || local.subject_id !== row.subject_id || local.round_type !== row.round_type) throw new Error(`Staging/archive identity drift for ${row.id}`);
    if (local.question_text.length !== row.question_length || local.correct_answer.length !== row.answer_length || (local.explanation || "").length !== row.explanation_length) {
      throw new Error(`Staging/archive content-shape drift for ${row.id}`);
    }
  }
}

function sql(value) {
  return value === null || value === undefined ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
}

function valuesSql(rows) {
  return rows.map((row) => `(${row.map(sql).join(",")})`).join(",\n  ");
}

function mappingTable(name, rows, withMigration = false) {
  const columns = withMigration ? "q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,k TEXT NOT NULL,t TEXT,m INTEGER NOT NULL" : "q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,k TEXT NOT NULL,t TEXT";
  const sourceColumns = withMigration ? "q,s,r,k,m" : "q,s,r,k";
  const sourceValues = rows.map((row) => [
    row.questionId,
    row.subjectId,
    row.roundType,
    row.topicId,
    ...(withMigration ? [Number(row.migrationId.slice(0, 3))] : []),
  ]);
  const candidates = buildTopicResolutions(rows).flatMap((resolution) =>
    resolution.candidateTopicIds.map((topicId, priority) => [
      resolution.logicalTopicId,
      resolution.subjectId,
      topicId,
      priority,
    ]),
  );
  return `CREATE TABLE IF NOT EXISTS ${name}(${columns});
DELETE FROM ${name};
WITH source(${sourceColumns}) AS (VALUES ${valuesSql(sourceValues)}),
candidates(k,s,t,p) AS (VALUES ${valuesSql(candidates)})
INSERT INTO ${name}
SELECT source.q,source.s,source.r,source.k,(
  SELECT MIN(c.t) FROM candidates c
  JOIN topics t ON t.id=c.t AND t.subject_id=c.s
  JOIN subjects s ON s.id=t.subject_id
  WHERE c.k=source.k AND c.s=source.s AND s.exam_type_id='exam_nsmq' AND s.is_active=1
  HAVING COUNT(*)=1
),${withMigration ? "source.m" : ""} FROM source;`.replace(", FROM source", " FROM source");
}

function quarantineTable(name, rows) {
  return `CREATE TABLE IF NOT EXISTS ${name}(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,reason TEXT NOT NULL);\nDELETE FROM ${name};\nINSERT INTO ${name} VALUES\n  ${valuesSql(rows.map((row) => [row.questionId, row.subjectId, row.roundType, row.reasonCode]))};`;
}

function exactLogPredicate(part, table, withMigration = false) {
  const migrationFilter = withMigration ? ` AND e.m=${part.migrationNumber}` : "";
  return `(SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(part.migrationId)})=${part.rows.length}\n  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${table} e ON e.q=l.entity_id${migrationFilter}\n    WHERE l.migration_id=${sql(part.migrationId)} AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=e.t)=${part.rows.length}`;
}

function priorApplied(parts, index) {
  return index === 0 ? "1=1" : parts.slice(0, index).map((part) => `(SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(part.migrationId)})=${part.rows.length}`).join("\n  AND ");
}

function laterRolledBack(parts, index) {
  const ids = parts.slice(index + 1).map((part) => sql(part.migrationId));
  return ids.length ? `(SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id IN (${ids.join(",")}))=0` : "1=1";
}

function renderMigration(part, parts) {
  const index = parts.indexOf(part);
  const table = `_nsmq_legacy_${part.migrationNumber}_expected`;
  const guard = `_nsmq_legacy_${part.migrationNumber}_guard`;
  return `-- ${part.migrationNumber}: legacy NSMQ null-topic remediation part ${index + 1}/3 (${part.rows.length} exact mappings).\nPRAGMA foreign_keys=ON;\n${mappingTable(table, part.rows)}\nCREATE TABLE IF NOT EXISTS ${guard}(valid INTEGER NOT NULL CHECK(valid=1));\nDELETE FROM ${guard};\nINSERT INTO ${guard}(valid)\nSELECT CASE WHEN\n  (SELECT COUNT(*) FROM ${table})=${part.rows.length}\n  AND (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=${part.rows.length}\n  AND NOT EXISTS (SELECT 1 FROM ${table} e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id<>'exam_nsmq' OR s.is_active<>1)\n  AND NOT EXISTS (SELECT 1 FROM ${table} e LEFT JOIN topics t ON t.id=e.t WHERE t.id IS NULL OR t.subject_id<>e.s)\n  AND (${priorApplied(parts, index)})\n  AND ((\n    (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.topic_id IS NULL)=${part.rows.length}\n    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(part.migrationId)})=0\n  ) OR (\n    (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.topic_id=e.t)=${part.rows.length}\n    AND ${exactLogPredicate(part, table)}\n  ))\n  AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id<>t.subject_id)\nTHEN 1 ELSE 0 END;\nINSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)\nSELECT ${sql(part.migrationId)},'question',e.q,'topic_id',NULL,e.t FROM ${table} e JOIN questions q ON q.id=e.q WHERE q.topic_id IS NULL;\nUPDATE questions SET topic_id=(SELECT e.t FROM ${table} e WHERE e.q=questions.id) WHERE topic_id IS NULL AND id IN (SELECT q FROM ${table});\nDROP TABLE ${table};\nDROP TABLE ${guard};\n`;
}

function renderRollback(part, parts) {
  const index = parts.indexOf(part);
  const table = `_nsmq_legacy_rb_${part.migrationNumber}_expected`;
  const guard = `_nsmq_legacy_rb_${part.migrationNumber}_guard`;
  return `-- Rollback ${part.migrationNumber}: restore exact ledger-backed legacy NSMQ topic values to NULL.\nPRAGMA foreign_keys=ON;\n${mappingTable(table, part.rows)}\nCREATE TABLE IF NOT EXISTS ${guard}(valid INTEGER NOT NULL CHECK(valid=1));\nDELETE FROM ${guard};\nINSERT INTO ${guard}(valid)\nSELECT CASE WHEN\n  (SELECT COUNT(*) FROM ${table})=${part.rows.length}\n  AND (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r)=${part.rows.length}\n  AND (${laterRolledBack(parts, index)})\n  AND ((\n    (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.topic_id=e.t)=${part.rows.length}\n    AND ${exactLogPredicate(part, table)}\n  ) OR (\n    (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.topic_id IS NULL)=${part.rows.length}\n    AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(part.migrationId)})=0\n  ))\nTHEN 1 ELSE 0 END;\nUPDATE questions SET topic_id=NULL WHERE EXISTS (SELECT 1 FROM ${table} e JOIN question_bank_remediation_log l ON l.migration_id=${sql(part.migrationId)} AND l.entity_type='question' AND l.entity_id=e.q AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=questions.topic_id WHERE e.q=questions.id);\nDELETE FROM question_bank_remediation_log WHERE migration_id=${sql(part.migrationId)};\nDROP TABLE ${table};\nDROP TABLE ${guard};\n`;
}

function renderPreflight(plan) {
  const table = "_nsmq_legacy_pre_expected";
  const quarantine = "_nsmq_legacy_pre_quarantine";
  return `-- Aggregate fail-closed preflight for legacy NSMQ remediation 278-280.\nPRAGMA foreign_keys=ON;\n${mappingTable(table, plan.mappings, true)}\n${quarantineTable(quarantine, plan.quarantines)}\nCREATE TABLE IF NOT EXISTS _nsmq_legacy_pre_guard(valid INTEGER NOT NULL CHECK(valid=1));\nDELETE FROM _nsmq_legacy_pre_guard;\nINSERT INTO _nsmq_legacy_pre_guard(valid)\nSELECT CASE WHEN\n  (SELECT COUNT(*) FROM ${table})=268\n  AND (SELECT COUNT(*) FROM ${quarantine})=2\n  AND NOT EXISTS (SELECT 1 FROM (SELECT s FROM ${table} UNION SELECT s FROM ${quarantine}) e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id<>'exam_nsmq' OR s.is_active<>1)\n  AND (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r AND q.topic_id IS NULL)=268\n  AND (SELECT COUNT(*) FROM questions q JOIN ${quarantine} e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r AND q.topic_id IS NULL)=2\n  AND NOT EXISTS (SELECT 1 FROM ${table} e LEFT JOIN topics t ON t.id=e.t WHERE t.id IS NULL OR t.subject_id<>e.s)\n  AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log WHERE migration_id IN (${MIGRATION_IDS.map(sql).join(",")}))\n  AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id<>t.subject_id)\nTHEN 1 ELSE 0 END;\nSELECT 270 raw_dispositions,268 planned_mappings,2 quarantined_rows;\nDROP TABLE ${table};\nDROP TABLE ${quarantine};\nDROP TABLE _nsmq_legacy_pre_guard;\n`;
}

function renderPostflight(plan) {
  const table = "_nsmq_legacy_post_expected";
  const quarantine = "_nsmq_legacy_post_quarantine";
  const logPredicates = plan.parts.map((part) => exactLogPredicate(part, table, true)).join("\n  AND ");
  return `-- Aggregate fail-closed postflight for legacy NSMQ remediation 278-280.\nPRAGMA foreign_keys=ON;\n${mappingTable(table, plan.mappings, true)}\n${quarantineTable(quarantine, plan.quarantines)}\nCREATE TABLE IF NOT EXISTS _nsmq_legacy_post_guard(valid INTEGER NOT NULL CHECK(valid=1));\nDELETE FROM _nsmq_legacy_post_guard;\nINSERT INTO _nsmq_legacy_post_guard(valid)\nSELECT CASE WHEN\n  (SELECT COUNT(*) FROM ${table})=268\n  AND (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r AND q.topic_id=e.t)=268\n  AND NOT EXISTS (SELECT 1 FROM (SELECT s FROM ${table} UNION SELECT s FROM ${quarantine}) e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id<>'exam_nsmq' OR s.is_active<>1)\n  AND (SELECT COUNT(*) FROM questions q JOIN ${quarantine} e ON e.q=q.id WHERE q.subject_id=e.s AND q.round_type=e.r AND q.topic_id IS NULL)=2\n  AND ${logPredicates}\n  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id IN (${MIGRATION_IDS.map(sql).join(",")}))=268\n  AND NOT EXISTS (SELECT 1 FROM questions q JOIN ${table} e ON e.q=q.id JOIN topics t ON t.id=q.topic_id WHERE q.subject_id<>t.subject_id OR e.s<>t.subject_id)\nTHEN 1 ELSE 0 END;\nSELECT 270 raw_dispositions,268 mapped_rows,2 quarantined_rows,268 exact_ledger_rows;\nPRAGMA foreign_key_check;\nDROP TABLE ${table};\nDROP TABLE ${quarantine};\nDROP TABLE _nsmq_legacy_post_guard;\n`;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function renderFiles(plan) {
  const manifest = { ...plan };
  delete manifest.parts;
  const files = new Map([[MANIFEST_PATH, stableJson(manifest)]]);
  for (const part of plan.parts) {
    files.set(path.join(MIGRATION_DIR, `${part.migrationId}.sql`), renderMigration(part, plan.parts));
    files.set(path.join(ROLLBACK_DIR, `${part.migrationId}_rollback.sql`), renderRollback(part, plan.parts));
  }
  files.set(path.join(PREFLIGHT_DIR, "278_280_nsmq_legacy_null_topic_preflight.sql"), renderPreflight(plan));
  files.set(path.join(PREFLIGHT_DIR, "278_280_nsmq_legacy_null_topic_postflight.sql"), renderPostflight(plan));
  return files;
}

function writeOrCheck(files, check) {
  for (const [target, content] of files) {
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) throw new Error(`Generated artifact drift: ${path.relative(ROOT, target)}`);
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
  }
}

function auditArtifacts() {
  const plan = buildPlan();
  const problems = [];
  try { writeOrCheck(renderFiles(plan), true); } catch (error) { problems.push(error instanceof Error ? error.message : String(error)); }
  for (const part of plan.parts) {
    const migration = path.join(MIGRATION_DIR, `${part.migrationId}.sql`);
    const size = fs.existsSync(migration) ? fs.statSync(migration).size : 0;
    if (size >= 19_500) problems.push(`${path.basename(migration)} is ${size} bytes`);
  }
  for (const file of renderFiles(plan).keys()) {
    if (!fs.existsSync(file)) continue;
    const sqlText = file.endsWith(".sql") ? fs.readFileSync(file, "utf8") : "";
    if (/\bTEMP(?:ORARY)?\b|CREATE\s+TABLE\s+\S+\s+AS\s+SELECT/i.test(sqlText)) problems.push(`${path.basename(file)} uses forbidden TEMP/CTAS scratch`);
  }
  return { ok: problems.length === 0, dispositions: 270, mappings: 268, quarantines: 2, unresolved: 0, problems };
}

function main() {
  const capture = process.argv.includes("--capture-staging");
  const check = process.argv.includes("--check");
  const sourceRows = loadArchiveRows();
  if (capture) {
    compareStagingToArchive(captureStagingRows());
  }
  const plan = buildPlan(sourceRows, "staging-d1-identity-and-shape-verified-against-archive");
  writeOrCheck(renderFiles(plan), check);
  process.stdout.write(`${JSON.stringify({ status: plan.status, dispositions: 270, mappings: 268, quarantines: 2, chunks: PART_SIZES, inventoryHash: plan.sourceInventoryHash }, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = { EVIDENCE, GROUPS, MIGRATION_IDS, PART_SIZES, QUARANTINES, RELEASE, auditArtifacts, buildPlan, compareStagingToArchive, loadArchiveRows, renderFiles, writeOrCheck };
