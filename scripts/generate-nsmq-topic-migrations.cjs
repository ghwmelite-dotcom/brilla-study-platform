"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const {
  buildLiveAudit,
  LIVE_ONLY,
  LIVE_TOTAL,
} = require("./generate-nsmq-live-topic-remediation.cjs");
const {
  CONTENT_CORRECTIONS,
  EXISTING_TOPIC_RESOLUTIONS,
  PROPOSALS,
  RESOLVED_WITH_EXCEPTIONS,
  buildProposal,
} = require("./generate-nsmq-topic-taxonomy-proposals.cjs");
const {
  buildTopicResolutions,
  renderCanonicalTopicCase,
} = require("./nsmq-topic-identity-resolver.cjs");

const ROOT = path.join(__dirname, "..");
const MANIFEST_DIR = path.join(
  ROOT,
  "database",
  "manifests",
  "nsmq-topic-remediation",
);
const MIGRATION_DIR = path.join(ROOT, "database", "migrations");
const ROLLBACK_DIR = path.join(ROOT, "database", "rollbacks");
const PREFLIGHT_DIR = path.join(ROOT, "database", "preflight");
const PART_SIZES = [100, 100, 100, 73];
const MIGRATION_IDS = [
  "267_nsmq_topic_remediation_part_1",
  "268_nsmq_topic_remediation_part_2",
  "269_nsmq_topic_remediation_part_3",
  "270_nsmq_topic_remediation_part_4",
];

const NEW_TOPICS = [
  {
    id: "topic_nsmq_math_general_reasoning",
    subjectId: "subj_nsmq_math",
    name: "General Reasoning",
    slug: "general-reasoning",
    description:
      "Constraint-based, logical and lateral reasoning questions assigned to Mathematics rounds.",
    displayOrder: 6,
  },
  {
    id: "topic_nsmq_math_numeration",
    subjectId: "subj_nsmq_math",
    name: "Numeration & Number Systems",
    slug: "numeration-number-systems",
    description:
      "Number representation, notation, bases and number-system conventions.",
    displayOrder: 7,
  },
  {
    id: "topic_nsmq_math_sets",
    subjectId: "subj_nsmq_math",
    name: "Sets",
    slug: "sets",
    description:
      "Set notation, membership, subsets, operations and related reasoning.",
    displayOrder: 8,
  },
  {
    id: "topic_nsmq_chem_environmental",
    subjectId: "subj_nsmq_chemistry",
    name: "Environmental Chemistry",
    slug: "environmental-chemistry",
    description:
      "Chemical processes and substances affecting the atmosphere and environment.",
    displayOrder: 7,
  },
];
const TOPIC_CREATED_AT = "2026-08-26T00:00:00.000Z";

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function fingerprint(row) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        id: row.id,
        subjectId: row.subject_id,
        roundType: row.round_type,
        questionText: row.question_text,
        correctAnswer: row.correct_answer,
        explanation: row.explanation,
      }),
    )
    .digest("hex");
}

function loadSourceRows(ids) {
  const db = new Database(":memory:");
  db.exec(fs.readFileSync(path.join(ROOT, "database", "schema.sql"), "utf8"));
  db.exec(fs.readFileSync(path.join(ROOT, "database", "seed.sql"), "utf8"));
  for (const source of [
    path.join(
      ROOT,
      "database",
      "prod-patches",
      "096_seed_topics_for_empty_subjects.sql",
    ),
    path.join(
      ROOT,
      "database",
      "migrations",
      "100_question_bank_integrity.sql",
    ),
    path.join(
      ROOT,
      "database",
      "migrations",
      "101_atomic_question_allowance.sql",
    ),
    path.join(
      ROOT,
      "database",
      "migrations",
      "102_nsmq_question_alignment.sql",
    ),
    path.join(
      ROOT,
      "database",
      "migrations",
      "103_exact_question_deduplication.sql",
    ),
  ])
    db.exec(fs.readFileSync(source, "utf8"));
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `
    SELECT id, subject_id, round_type, topic_id, question_text, correct_answer, explanation
    FROM questions WHERE id IN (${placeholders}) ORDER BY id
  `,
    )
    .all(...ids);
  db.close();
  if (rows.length !== ids.length)
    throw new Error(
      `Source inventory drift: expected ${ids.length}, found ${rows.length}`,
    );
  return new Map(rows.map((row) => [row.id, row]));
}

function increment(record, key) {
  record[key] = (record[key] || 0) + 1;
}

function buildPlan() {
  const audit = buildLiveAudit();
  const proposal = buildProposal();
  const auditedMappings = Object.values(audit.subjectManifests).flatMap(
    (manifest) => manifest.mappings,
  );
  const proposalMappings = PROPOSALS.flatMap((topic) =>
    topic.affectedQuestionIds.map((questionId) => ({
      questionId,
      subjectId: topic.subjectId,
      topicId: topic.proposedTopicId,
      classificationSource: "approved-bounded-taxonomy-proposal",
    })),
  );
  const reviewedMappings = EXISTING_TOPIC_RESOLUTIONS.map((row) => ({
    questionId: row.questionId,
    subjectId: row.subjectId,
    topicId: row.topicId,
    classificationSource: "reviewed-existing-topic-resolution",
  }));
  const dispositionRows = [
    ...auditedMappings,
    ...proposalMappings,
    ...reviewedMappings,
  ];
  if (
    dispositionRows.length !== 373 ||
    new Set(dispositionRows.map((row) => row.questionId)).size !== 373
  ) {
    throw new Error("Migration plan must contain exactly 373 unique mappings");
  }

  const allIds = [
    ...dispositionRows.map((row) => row.questionId),
    ...RESOLVED_WITH_EXCEPTIONS.map((row) => row.questionId),
  ];
  if (allIds.length !== LIVE_TOTAL || new Set(allIds).size !== LIVE_TOTAL)
    throw new Error("Final dispositions must cover 375 unique rows");
  const sourceById = loadSourceRows(allIds);
  const correction = CONTENT_CORRECTIONS[0];
  const correctionChanges = Object.fromEntries(
    correction.changes.map((change) => [change.field, change]),
  );

  const mappings = dispositionRows.map((mapping) => {
    const source = sourceById.get(mapping.questionId);
    if (
      !source ||
      source.subject_id !== mapping.subjectId ||
      source.topic_id !== null
    ) {
      throw new Error(`Source identity/topic drift for ${mapping.questionId}`);
    }
    const audited = auditedMappings.find(
      (row) => row.questionId === mapping.questionId,
    );
    if (audited && audited.contentFingerprint !== fingerprint(source))
      throw new Error(`Source fingerprint drift for ${mapping.questionId}`);
    return {
      questionId: mapping.questionId,
      subjectId: source.subject_id,
      roundType: source.round_type,
      topicId: mapping.topicId,
      sourceQuestionText: source.question_text,
      sourceCorrectAnswer: source.correct_answer,
      sourceExplanation: source.explanation,
      finalQuestionText:
        mapping.questionId === correction.questionId
          ? correctionChanges.question_text.after
          : source.question_text,
      finalCorrectAnswer:
        mapping.questionId === correction.questionId
          ? correctionChanges.correct_answer.after
          : source.correct_answer,
      finalExplanation:
        mapping.questionId === correction.questionId
          ? correctionChanges.explanation.after
          : source.explanation,
      sourceContentFingerprint: fingerprint(source),
      classificationSource: mapping.classificationSource,
    };
  });

  for (const topic of NEW_TOPICS) {
    const proposalTopic = PROPOSALS.find(
      (row) => row.proposedTopicId === topic.id,
    );
    if (
      !proposalTopic ||
      proposalTopic.subjectId !== topic.subjectId ||
      proposalTopic.proposedName !== topic.name
    ) {
      throw new Error(`New-topic proposal drift for ${topic.id}`);
    }
  }
  const correctionRow = mappings.find(
    (row) => row.questionId === correction.questionId,
  );
  for (const change of correction.changes) {
    const sourceKey = `source${change.field
      .split("_")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join("")}`;
    if (correctionRow[sourceKey] !== change.before)
      throw new Error(`Correction before-value drift for ${change.field}`);
  }

  const priority = new Map([
    ["nsmq_math_rid_012", 0],
    ["nsmq_phy_rid_012", 1],
  ]);
  mappings.sort((a, b) => {
    const pa = priority.has(a.questionId) ? priority.get(a.questionId) : 2;
    const pb = priority.has(b.questionId) ? priority.get(b.questionId) : 2;
    return (
      pa - pb ||
      a.subjectId.localeCompare(b.subjectId) ||
      a.roundType.localeCompare(b.roundType) ||
      a.questionId.localeCompare(b.questionId)
    );
  });
  const parts = [];
  let offset = 0;
  for (let i = 0; i < PART_SIZES.length; i += 1) {
    const rows = mappings.slice(offset, offset + PART_SIZES[i]);
    parts.push({
      migrationId: MIGRATION_IDS[i],
      migrationNumber: 267 + i,
      rows,
    });
    offset += PART_SIZES[i];
  }
  if (
    offset !== mappings.length ||
    parts.some((part, index) => part.rows.length !== PART_SIZES[index])
  )
    throw new Error("Migration chunk drift");
  if (
    !parts[0].rows.some((row) => row.questionId === correction.questionId) ||
    !parts[0].rows.some((row) => row.questionId === "nsmq_phy_rid_012")
  ) {
    throw new Error("Migration 267 must own both reviewed special resolutions");
  }

  const exceptions = RESOLVED_WITH_EXCEPTIONS.map((row) => {
    const source = sourceById.get(row.questionId);
    return {
      ...row,
      sourceQuestionText: source.question_text,
      sourceCorrectAnswer: source.correct_answer,
      sourceExplanation: source.explanation,
      sourceContentFingerprint: fingerprint(source),
    };
  });
  const subjectRoundTotals = {};
  for (const row of [...mappings, ...exceptions]) {
    const key = `${row.subjectId}|${row.roundType}`;
    increment(subjectRoundTotals, key);
  }
  const migrationByQuestion = new Map(
    parts.flatMap((part) =>
      part.rows.map((row) => [row.questionId, part.migrationId]),
    ),
  );
  const planMappings = mappings.map((row) => ({
    ...row,
    migrationId: migrationByQuestion.get(row.questionId),
  }));
  return {
    release: audit.summary.release,
    status: "local-staging-preparation-not-applied",
    authoritativeInventoryCount: LIVE_TOTAL,
    mappingCount: mappings.length,
    exceptionCount: exceptions.length,
    chunkSizes: PART_SIZES,
    migrationIds: MIGRATION_IDS,
    subjectRoundTotals,
    liveOnlyQuestionIds: LIVE_ONLY.map((row) => row.questionId).sort(),
    newTopics: NEW_TOPICS.map((row) => ({
      ...row,
      createdAt: TOPIC_CREATED_AT,
    })),
    contentCorrections: CONTENT_CORRECTIONS,
    topicResolutions: buildTopicResolutions(planMappings, NEW_TOPICS),
    mappings: planMappings,
    reviewedExceptions: exceptions,
    proposalSummary: {
      existingTopicMappingCount: proposal.existingTopicMappingCount,
      proposedNewTopicCount: proposal.proposedNewTopicCount,
      rowsCoveredByProposedTopics: proposal.rowsCoveredByProposedTopics,
      rowsResolvedByExistingTopicAfterReview:
        proposal.rowsResolvedByExistingTopicAfterReview,
    },
    generatedAt: "deterministic-no-runtime-timestamp",
    parts,
  };
}

function valuesSql(rows) {
  return rows.map((row) => `(${row.map(sql).join(",")})`).join(",\n  ");
}

const NEW_TOPIC_IDS_SQL = NEW_TOPICS.map((topic) => sql(topic.id)).join(",");

function mappingTableSql(name, rows, withMigration = false, allowProposedAbsent = false) {
  const columns = withMigration
    ? "q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT,m INTEGER NOT NULL"
    : "q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL,t TEXT";
  const sourceColumns = withMigration ? "q,s,r,k,m" : "q,s,r,k";
  const sourceValues = rows.map((row) => [
    row.questionId,
    row.subjectId,
    row.roundType,
    row.topicId,
    ...(withMigration ? [Number(row.migrationId.slice(0, 3))] : []),
  ]);
  const fallback = allowProposedAbsent
    ? `CASE WHEN source.k IN (${NEW_TOPIC_IDS_SQL}) AND source.s IS ${topicSubjectCase({ key: "source.k" })} THEN source.k END`
    : "NULL";
  return `CREATE TABLE IF NOT EXISTS ${name}(${columns});
DELETE FROM ${name};
WITH source(${sourceColumns}) AS (VALUES ${valuesSql(sourceValues)})
INSERT INTO ${name}
SELECT source.q,source.s,source.r,coalesce((
  SELECT MIN(t.id) FROM topics t
  JOIN subjects s ON s.id=t.subject_id
  WHERE t.id IN (source.k,${renderCanonicalTopicCase("source.k", "source.s")}) AND t.subject_id=source.s
    AND s.exam_type_id='exam_nsmq' AND s.is_active=1
  HAVING COUNT(*)=1
),${fallback})${withMigration ? ",source.m" : ""} FROM source;`;
}

function resolvedMappingSql(name, _resolutionName, rows, withMigration = false, allowProposedAbsent = false) {
  return mappingTableSql(name, rows, withMigration, allowProposedAbsent);
}

function exceptionTableSql(name, rows) {
  return `CREATE TABLE IF NOT EXISTS ${name}(q TEXT PRIMARY KEY,s TEXT NOT NULL,r TEXT NOT NULL);
DELETE FROM ${name};
INSERT INTO ${name} VALUES
  ${valuesSql(rows.map((row) => [row.questionId, row.subjectId, row.roundType]))};`;
}

function topicSubjectCase(alias = "e") {
  const key = typeof alias === "string" ? `${alias}.t` : alias.key;
  return `CASE ${key} ${NEW_TOPICS.map((topic) => `WHEN ${sql(topic.id)} THEN ${sql(topic.subjectId)}`).join(" ")} END`;
}

function topicExactPredicate() {
  return `(SELECT COUNT(*) FROM topics t WHERE ${NEW_TOPICS.map((topic) => `(t.id=${sql(topic.id)} AND t.subject_id=${sql(topic.subjectId)} AND t.parent_id IS NULL AND t.name=${sql(topic.name)} AND t.slug=${sql(topic.slug)} AND t.description=${sql(topic.description)} AND t.theory_content IS NULL AND t.key_formulas IS NULL AND t.display_order=${topic.displayOrder} AND t.created_at=${sql(TOPIC_CREATED_AT)})`).join(" OR ")})=${NEW_TOPICS.length}`;
}

function topicAbsentPredicate() {
  return `(SELECT COUNT(*) FROM topics WHERE id IN (${NEW_TOPIC_IDS_SQL}))=0
  AND NOT EXISTS (SELECT 1 FROM topics t WHERE ${NEW_TOPICS.map((topic) => `(t.subject_id=${sql(topic.subjectId)} AND (t.slug=${sql(topic.slug)} OR lower(t.name)=lower(${sql(topic.name)})))`).join(" OR ")})`;
}

function topicOwnershipPredicate(table) {
  return `NOT EXISTS (SELECT 1 FROM ${table} e LEFT JOIN topics t ON t.id=e.t WHERE
    (e.t NOT IN (${NEW_TOPIC_IDS_SQL}) AND (t.id IS NULL OR t.subject_id IS NOT e.s))
    OR (e.t IN (${NEW_TOPIC_IDS_SQL}) AND e.s IS NOT ${topicSubjectCase("e")}))`;
}

function correctionValues() {
  const correction = CONTENT_CORRECTIONS[0];
  return Object.fromEntries(
    correction.changes.map((change) => [
      change.field,
      { before: change.before, after: change.after },
    ]),
  );
}

function correctionStatePredicate(finalState) {
  const values = correctionValues();
  const side = finalState ? "after" : "before";
  return `EXISTS (SELECT 1 FROM questions WHERE id='nsmq_math_rid_012'
    AND question_text=${sql(values.question_text[side])}
    AND correct_answer=${sql(values.correct_answer[side])}
    AND explanation=${sql(values.explanation[side])})`;
}

function questionStatePredicate(
  table,
  rowCount,
  finalState,
  includeCorrection,
) {
  const topic = finalState ? "q.topic_id IS e.t" : "q.topic_id IS NULL";
  return `(SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id
    WHERE q.subject_id IS e.s AND q.round_type IS e.r AND ${topic})=${rowCount}${includeCorrection ? ` AND ${correctionStatePredicate(finalState)}` : ""}`;
}

function correctionLogPredicate(migrationId) {
  const values = correctionValues();
  return `(SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(migrationId)}
    AND entity_type='question' AND entity_id='nsmq_math_rid_012' AND (
      (field_name='question_text' AND old_value=${sql(values.question_text.before)} AND new_value=${sql(values.question_text.after)})
      OR (field_name='correct_answer' AND old_value=${sql(values.correct_answer.before)} AND new_value=${sql(values.correct_answer.after)})
      OR (field_name='explanation' AND old_value=${sql(values.explanation.before)} AND new_value=${sql(values.explanation.after)})
    ))=3`;
}

function exactLogPredicate(part, table, withMigration = false) {
  const includeCorrection = part.migrationNumber === 267;
  const expected = part.rows.length + (includeCorrection ? 3 : 0);
  const migrationFilter = withMigration
    ? ` AND e.m=${part.migrationNumber}`
    : "";
  return `(SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(part.migrationId)})=${expected}
  AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN ${table} e ON e.q=l.entity_id${migrationFilter}
    WHERE l.migration_id=${sql(part.migrationId)} AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value IS e.t)=${part.rows.length}${
      includeCorrection
        ? `
  AND ${correctionLogPredicate(part.migrationId)}`
        : ""
    }`;
}

function priorAppliedPredicate(parts, index) {
  if (index === 0) return "1=1";
  return parts
    .slice(0, index)
    .map((part) => {
      const expected =
        part.rows.length + (part.migrationNumber === 267 ? 3 : 0);
      return `(SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(part.migrationId)})=${expected}
      AND (SELECT COUNT(*) FROM question_bank_remediation_log l JOIN questions q ON q.id=l.entity_id JOIN topics t ON t.id=l.new_value
        WHERE l.migration_id=${sql(part.migrationId)} AND l.entity_type='question' AND l.field_name='topic_id' AND l.old_value IS NULL AND q.topic_id IS l.new_value AND q.subject_id IS t.subject_id)=${part.rows.length}${
          part.migrationNumber === 267
            ? `
      AND ${correctionLogPredicate(part.migrationId)}`
            : ""
        }`;
    })
    .join("\n  AND ");
}

function laterRolledBackPredicate(parts, index) {
  const later = parts.slice(index + 1).map((part) => sql(part.migrationId));
  return later.length
    ? `(SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id IN (${later.join(",")}))=0`
    : "1=1";
}

function topicInsertSql() {
  return `INSERT OR IGNORE INTO topics(id,subject_id,parent_id,name,slug,description,theory_content,key_formulas,display_order,created_at) VALUES
  ${valuesSql(NEW_TOPICS.map((topic) => [topic.id, topic.subjectId, null, topic.name, topic.slug, topic.description, null, null, topic.displayOrder, TOPIC_CREATED_AT]))};`;
}

function correctionWriteSql(migrationId) {
  const values = correctionValues();
  const fields = ["question_text", "correct_answer", "explanation"];
  const logs = fields
    .map(
      (field) =>
        `INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value) VALUES (${sql(migrationId)},'question','nsmq_math_rid_012',${sql(field)},${sql(values[field].before)},${sql(values[field].after)});`,
    )
    .join("\n");
  return `${logs}
UPDATE questions SET question_text=${sql(values.question_text.after)},correct_answer=${sql(values.correct_answer.after)},explanation=${sql(values.explanation.after)}
WHERE id='nsmq_math_rid_012' AND question_text=${sql(values.question_text.before)} AND correct_answer=${sql(values.correct_answer.before)} AND explanation=${sql(values.explanation.before)};`;
}

function correctionRollbackSql() {
  const values = correctionValues();
  return `UPDATE questions SET question_text=${sql(values.question_text.before)},correct_answer=${sql(values.correct_answer.before)},explanation=${sql(values.explanation.before)}
WHERE id='nsmq_math_rid_012' AND question_text=${sql(values.question_text.after)} AND correct_answer=${sql(values.correct_answer.after)} AND explanation=${sql(values.explanation.after)};`;
}

function renderMigration(part, parts) {
  const { migrationId, migrationNumber, rows } = part;
  const index = parts.indexOf(part);
  const table = `_migration_${migrationNumber}_expected`;
  const resolutions = `_migration_${migrationNumber}_topic_candidates`;
  const guard = `_migration_${migrationNumber}_guard`;
  const includeCorrection = migrationNumber === 267;
  const sourceTopics = includeCorrection
    ? topicAbsentPredicate()
    : topicExactPredicate();
  const finalTopics = topicExactPredicate();
  return `-- ${migrationNumber}: NSMQ null-topic remediation part ${index + 1}/4 (${rows.length} exact mappings).
PRAGMA foreign_keys=ON;
${resolvedMappingSql(table, resolutions, rows, false, includeCorrection)}
CREATE TABLE IF NOT EXISTS ${guard}(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM ${guard};
INSERT INTO ${guard}(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM ${table})=${rows.length}
  AND (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id)=${rows.length}
  AND NOT EXISTS (SELECT 1 FROM ${table} WHERE t IS NULL)
  AND NOT EXISTS (SELECT 1 FROM ${table} e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id IS NOT 'exam_nsmq' OR s.is_active<>1)
  AND (${priorAppliedPredicate(parts, index)})
  AND (
    (${questionStatePredicate(table, rows.length, false, includeCorrection)}
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(migrationId)})=0
      AND ${sourceTopics})
    OR
    (${questionStatePredicate(table, rows.length, true, includeCorrection)}
      AND ${exactLogPredicate(part, table)}
      AND ${finalTopics})
  )
  AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
${includeCorrection ? `${topicInsertSql()}\n` : ""}INSERT OR IGNORE INTO question_bank_remediation_log(migration_id,entity_type,entity_id,field_name,old_value,new_value)
SELECT ${sql(migrationId)},'question',e.q,'topic_id',NULL,e.t FROM ${table} e JOIN questions q ON q.id=e.q WHERE q.topic_id IS NULL;
${includeCorrection ? `${correctionWriteSql(migrationId)}\n` : ""}UPDATE questions SET topic_id=(SELECT e.t FROM ${table} e WHERE e.q=questions.id)
WHERE topic_id IS NULL AND id IN (SELECT q FROM ${table});
DROP TABLE ${table};
DROP TABLE ${guard};
`;
}

function renderRollback(part, parts) {
  const { migrationId, migrationNumber, rows } = part;
  const index = parts.indexOf(part);
  const table = `_rollback_${migrationNumber}_expected`;
  const resolutions = `_rollback_${migrationNumber}_topic_candidates`;
  const guard = `_rollback_${migrationNumber}_guard`;
  const includeCorrection = migrationNumber === 267;
  const sourceTopics = includeCorrection
    ? topicAbsentPredicate()
    : topicExactPredicate();
  return `-- Rollback ${migrationNumber}: restore only exact ledger-backed NSMQ source values.
PRAGMA foreign_keys=ON;
${resolvedMappingSql(table, resolutions, rows, false, includeCorrection)}
CREATE TABLE IF NOT EXISTS ${guard}(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM ${guard};
INSERT INTO ${guard}(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM ${table})=${rows.length}
  AND (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.subject_id IS e.s AND q.round_type IS e.r)=${rows.length}
  AND NOT EXISTS (SELECT 1 FROM ${table} WHERE t IS NULL)
  AND ${topicOwnershipPredicate(table)}
  AND ${laterRolledBackPredicate(parts, index)}
  AND (
    (${questionStatePredicate(table, rows.length, true, includeCorrection)}
      AND ${exactLogPredicate(part, table)}
      AND ${topicExactPredicate()})
    OR
    (${questionStatePredicate(table, rows.length, false, includeCorrection)}
      AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id=${sql(migrationId)})=0
      AND ${sourceTopics})
  )
THEN 1 ELSE 0 END;
UPDATE questions SET topic_id=NULL
WHERE EXISTS (SELECT 1 FROM ${table} e JOIN question_bank_remediation_log l ON l.migration_id=${sql(migrationId)} AND l.entity_type='question' AND l.entity_id=e.q AND l.field_name='topic_id' AND l.old_value IS NULL AND l.new_value=questions.topic_id WHERE e.q=questions.id);
${includeCorrection ? `${correctionRollbackSql()}\n` : ""}DELETE FROM question_bank_remediation_log WHERE migration_id=${sql(migrationId)};
${includeCorrection ? `DELETE FROM topics WHERE id IN (${NEW_TOPIC_IDS_SQL}) AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.topic_id=topics.id);\n` : ""}DROP TABLE ${table};
DROP TABLE ${guard};
`;
}

function subjectRoundPredicate(expectedTable, exceptionTable, totals) {
  return Object.entries(totals)
    .map(([key, count]) => {
      const [subjectId, roundType] = key.split("|");
      return `(SELECT COUNT(*) FROM (SELECT q,s,r FROM ${expectedTable} UNION ALL SELECT q,s,r FROM ${exceptionTable}) x WHERE s=${sql(subjectId)} AND r=${sql(roundType)})=${count}`;
    })
    .join("\n  AND ");
}

function aggregateLogPredicate(plan, table) {
  return plan.parts
    .map((part) => exactLogPredicate(part, table, true))
    .join("\n  AND ");
}

function renderPreflight(plan) {
  const table = "_nsmq_pre_expected";
  const resolutions = "_nsmq_pre_topic_candidates";
  const exceptions = "_nsmq_pre_exceptions";
  return `-- Aggregate fail-closed preflight for NSMQ remediation 267-270.
PRAGMA foreign_keys=ON;
${resolvedMappingSql(table, resolutions, plan.mappings, true, true)}
${exceptionTableSql(exceptions, plan.reviewedExceptions)}
CREATE TABLE IF NOT EXISTS _nsmq_pre_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _nsmq_pre_guard;
INSERT INTO _nsmq_pre_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM ${table})=373
  AND (SELECT COUNT(*) FROM ${exceptions})=2
  AND NOT EXISTS (SELECT 1 FROM ${table} WHERE t IS NULL)
  AND NOT EXISTS (SELECT 1 FROM (SELECT s FROM ${table} UNION SELECT s FROM ${exceptions}) e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id<>'exam_nsmq' OR s.is_active<>1)
  AND (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS NULL)=373
  AND (SELECT COUNT(*) FROM questions q JOIN ${exceptions} e ON e.q=q.id WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS NULL)=2
  AND ${correctionStatePredicate(false)}
  AND ${subjectRoundPredicate(table, exceptions, plan.subjectRoundTotals)}
  AND ${topicOwnershipPredicate(table)}
  AND ${topicAbsentPredicate()}
  AND NOT EXISTS (SELECT 1 FROM question_bank_remediation_log WHERE migration_id IN (${MIGRATION_IDS.map(sql).join(",")}))
  AND (SELECT COUNT(*) FROM questions WHERE id IN (${LIVE_ONLY.map((row) => sql(row.questionId)).join(",")}) AND topic_id IS NULL)=5
  AND NOT EXISTS (SELECT 1 FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.topic_id IS NOT NULL AND q.subject_id IS NOT t.subject_id)
THEN 1 ELSE 0 END;
SELECT 375 authoritative_rows,373 planned_mappings,2 reviewed_null_exceptions,5 live_only_rows;
DROP TABLE ${table};
DROP TABLE ${exceptions};
DROP TABLE _nsmq_pre_guard;
`;
}

function renderPostflight(plan) {
  const table = "_nsmq_post_expected";
  const resolutions = "_nsmq_post_topic_candidates";
  const exceptions = "_nsmq_post_exceptions";
  return `-- Aggregate fail-closed postflight for NSMQ remediation 267-270.
PRAGMA foreign_keys=ON;
${resolvedMappingSql(table, resolutions, plan.mappings, true)}
${exceptionTableSql(exceptions, plan.reviewedExceptions)}
CREATE TABLE IF NOT EXISTS _nsmq_post_guard(valid INTEGER NOT NULL CHECK(valid=1));
DELETE FROM _nsmq_post_guard;
INSERT INTO _nsmq_post_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM ${table})=373
  AND NOT EXISTS (SELECT 1 FROM ${table} WHERE t IS NULL)
  AND NOT EXISTS (SELECT 1 FROM (SELECT s FROM ${table} UNION SELECT s FROM ${exceptions}) e LEFT JOIN subjects s ON s.id=e.s WHERE s.id IS NULL OR s.exam_type_id<>'exam_nsmq' OR s.is_active<>1)
  AND (SELECT COUNT(*) FROM questions q JOIN ${table} e ON e.q=q.id WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS e.t)=373
  AND (SELECT COUNT(*) FROM questions q JOIN ${exceptions} e ON e.q=q.id WHERE q.subject_id IS e.s AND q.round_type IS e.r AND q.topic_id IS NULL)=2
  AND ${correctionStatePredicate(true)}
  AND ${subjectRoundPredicate(table, exceptions, plan.subjectRoundTotals)}
  AND ${topicExactPredicate()}
  AND ${aggregateLogPredicate(plan, table)}
  AND (SELECT COUNT(*) FROM question_bank_remediation_log WHERE migration_id IN (${MIGRATION_IDS.map(sql).join(",")}))=376
  AND (SELECT COUNT(*) FROM questions WHERE id IN (${LIVE_ONLY.map((row) => sql(row.questionId)).join(",")}) AND topic_id IS NOT NULL)=5
  AND NOT EXISTS (SELECT 1 FROM questions q JOIN ${table} e ON e.q=q.id JOIN topics t ON t.id=q.topic_id WHERE q.subject_id IS NOT t.subject_id OR e.s IS NOT t.subject_id)
THEN 1 ELSE 0 END;
SELECT 375 authoritative_rows,373 mapped_rows,2 reviewed_null_exceptions,376 exact_ledger_rows,5 live_only_rows;
PRAGMA foreign_key_check;
DROP TABLE ${table};
DROP TABLE ${exceptions};
DROP TABLE _nsmq_post_guard;
`;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function renderFiles(plan) {
  const manifest = { ...plan };
  delete manifest.parts;
  const files = new Map();
  files.set(
    path.join(MANIFEST_DIR, "migration-plan-267-270.json"),
    stableJson(manifest),
  );
  for (const part of plan.parts) {
    files.set(
      path.join(MIGRATION_DIR, `${part.migrationId}.sql`),
      renderMigration(part, plan.parts),
    );
    files.set(
      path.join(ROLLBACK_DIR, `${part.migrationId}_rollback.sql`),
      renderRollback(part, plan.parts),
    );
  }
  files.set(
    path.join(PREFLIGHT_DIR, "267_270_nsmq_topic_remediation_preflight.sql"),
    renderPreflight(plan),
  );
  files.set(
    path.join(PREFLIGHT_DIR, "267_270_nsmq_topic_remediation_postflight.sql"),
    renderPostflight(plan),
  );
  return files;
}

function writeOrCheck(files, check) {
  for (const [target, content] of files) {
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content)
        throw new Error(
          `Generated NSMQ artifact drift: ${path.relative(ROOT, target)}`,
        );
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
  }
}

function main() {
  const check = process.argv.includes("--check");
  const plan = buildPlan();
  writeOrCheck(renderFiles(plan), check);
  process.stdout.write(
    `${JSON.stringify(
      {
        status: plan.status,
        mappings: plan.mappingCount,
        exceptions: plan.exceptionCount,
        chunks: plan.chunkSizes,
      },
      null,
      2,
    )}\n`,
  );
}

if (require.main === module) main();

module.exports = {
  MIGRATION_IDS,
  NEW_TOPICS,
  PART_SIZES,
  buildPlan,
  renderFiles,
  writeOrCheck,
};
