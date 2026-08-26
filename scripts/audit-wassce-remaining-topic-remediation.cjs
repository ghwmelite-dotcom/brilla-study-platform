"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const {
  EXCLUDED_SUBJECT_ID,
  OUTPUT_DIR,
  REPO_ONLY_EXCLUDED_IDS,
  buildExceptionLedger,
  buildSubjectManifests,
  buildTaxonomyProposal,
} = require("./generate-wassce-remaining-topic-remediation.cjs");

const ROOT = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const manifests = buildSubjectManifests();
const exceptionLedger = buildExceptionLedger(manifests);
const taxonomyProposal = buildTaxonomyProposal(manifests);
const proposedTopicIds = new Set(
  taxonomyProposal.topics.map((item) => item.topicId),
);
const repoOnlyExcludedIds = new Set(REPO_ONLY_EXCLUDED_IDS);

function createFixture() {
  const db = new DatabaseSync(":memory:");
  for (const relative of [
    "database/schema.sql",
    "database/seed.sql",
    "database/prod-patches/096_seed_topics_for_empty_subjects.sql",
  ])
    db.exec(read(relative));
  for (const migration of [
    "100_question_bank_integrity.sql",
    "101_atomic_question_allowance.sql",
    "102_nsmq_question_alignment.sql",
    "103_exact_question_deduplication.sql",
  ])
    db.exec(read(`database/migrations/${migration}`));
  return db;
}

function expectedManifestFilenames() {
  return [
    ...manifests.map(
      (manifest) => `${manifest.subjectId.replace(/^subj_wassce_/, "")}.json`,
    ),
    "reviewed-exceptions.json",
    "taxonomy-proposals.json",
  ].sort();
}

assert.deepEqual(
  fs
    .readdirSync(OUTPUT_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort(),
  expectedManifestFilenames(),
  "manifest directory contains missing or stale JSON artifacts",
);

for (const manifest of manifests) {
  const filename = `${manifest.subjectId.replace(/^subj_wassce_/, "")}.json`;
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, filename), "utf8")),
    manifest,
    `${filename}: generator drift`,
  );
}
assert.deepEqual(
  JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, "reviewed-exceptions.json"), "utf8"),
  ),
  exceptionLedger,
  "reviewed exception ledger drift",
);
assert.deepEqual(
  JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, "taxonomy-proposals.json"), "utf8"),
  ),
  taxonomyProposal,
  "taxonomy proposal artifact drift",
);

const db = createFixture();
const repositoryRows = db
  .prepare(
    `
  SELECT q.id, q.subject_id
  FROM questions q
  JOIN subjects s ON s.id = q.subject_id
  WHERE s.exam_type_id = 'exam_wassce'
    AND s.is_active = 1
    AND q.topic_id IS NULL
    AND q.subject_id <> ?
  ORDER BY q.subject_id, q.id
`,
  )
  .all(EXCLUDED_SUBJECT_ID);

assert.equal(
  repositoryRows.length,
  1569,
  "repository fixture WASSCE null-topic baseline drift",
);
assert.equal(
  REPO_ONLY_EXCLUDED_IDS.length,
  69,
  "authoritative overlay exclusion count drift",
);
assert.equal(
  repoOnlyExcludedIds.size,
  REPO_ONLY_EXCLUDED_IDS.length,
  "authoritative overlay contains duplicate exclusion IDs",
);
const repositoryIds = new Set(repositoryRows.map((row) => row.id));
for (const questionId of REPO_ONLY_EXCLUDED_IDS) {
  assert.ok(
    repositoryIds.has(questionId),
    `${questionId}: authoritative repo-only exclusion is absent from fixture`,
  );
}
const authoritativeRows = repositoryRows.filter(
  (row) => !repoOnlyExcludedIds.has(row.id),
);
assert.equal(
  authoritativeRows.length,
  1500,
  "authoritative production WASSCE null-topic overlay drift",
);
const authoritativeRowsBySubject = new Map();
for (const row of authoritativeRows) {
  const rows = authoritativeRowsBySubject.get(row.subject_id) ?? [];
  rows.push(row.id);
  authoritativeRowsBySubject.set(row.subject_id, rows);
}
assert.equal(
  authoritativeRowsBySubject.size,
  16,
  "unexpected number of authoritative WASSCE subjects",
);
assert.equal(exceptionLedger.totalExpectedNullTopicCount, 1500);
assert.equal(exceptionLedger.totalMappedQuestionCount, 1500);
assert.equal(exceptionLedger.totalExceptionCount, 0);
assert.deepEqual(exceptionLedger.subjects, []);
assert.equal(taxonomyProposal.proposedTopicCount, 20);
assert.equal(taxonomyProposal.proposedQuestionCount, 536);
assert.equal(taxonomyProposal.residualExceptionCount, 0);
assert.deepEqual(
  taxonomyProposal.liveInventoryOverlay.excludedRepoOnlyQuestionIds,
  REPO_ONLY_EXCLUDED_IDS,
  "taxonomy proposal live-overlay exclusion drift",
);

const configuredSubjectIds = manifests
  .map((manifest) => manifest.subjectId)
  .sort();
assert.deepEqual(
  configuredSubjectIds,
  [...authoritativeRowsBySubject.keys()].sort(),
  "subject manifest coverage drift",
);

const allowedSourceHosts = new Set([
  "nacca.gov.gh",
  "waecgh.org",
  "waeconline.org.ng",
]);
const proposedQuestionIds = [];
for (const topic of taxonomyProposal.topics) {
  assert.equal(
    topic.evidenceBasis,
    "official-curriculum-and-reviewed-question-semantics",
    `${topic.topicId}: proposal lacks official-plus-semantic evidence basis`,
  );
  assert.ok(topic.name.length >= 5 && topic.description.length >= 40);
  assert.ok(topic.officialSources.length > 0);
  for (const source of topic.officialSources) {
    const url = new URL(source.url);
    const host = url.hostname.replace(/^www\./, "");
    assert.equal(url.protocol, "https:");
    assert.ok(
      allowedSourceHosts.has(host),
      `${topic.topicId}: non-official source host ${host}`,
    );
    assert.ok(source.title.length >= 20 && source.authority.length >= 20);
  }
  proposedQuestionIds.push(...topic.questionIds);
}
assert.equal(new Set(proposedQuestionIds).size, proposedQuestionIds.length);
assert.equal(proposedQuestionIds.length, 536);

const allConfiguredQuestionIds = [];
for (const manifest of manifests) {
  const subject = db
    .prepare(
      "SELECT id FROM subjects WHERE id=? AND exam_type_id=? AND is_active=1",
    )
    .get(manifest.subjectId, "exam_wassce");
  assert.ok(subject, `${manifest.subjectId}: expected active WASSCE subject`);

  const databaseIds = [
    ...(authoritativeRowsBySubject.get(manifest.subjectId) ?? []),
  ].sort();
  const mappingIds = manifest.mappingGroups.flatMap((item) => item.questionIds);
  const exceptionIds = manifest.reviewedExceptions.flatMap(
    (item) => item.questionIds,
  );
  const configuredIds = [...mappingIds, ...exceptionIds].sort();

  assert.equal(
    databaseIds.length,
    manifest.expectedNullTopicCount,
    `${manifest.subjectId}: authoritative null-topic count drift`,
  );
  assert.deepEqual(
    configuredIds,
    databaseIds,
    `${manifest.subjectId}: mapping/exception coverage drift`,
  );
  assert.equal(
    new Set(configuredIds).size,
    configuredIds.length,
    `${manifest.subjectId}: duplicate question coverage`,
  );
  allConfiguredQuestionIds.push(...configuredIds);

  for (const mappingGroup of manifest.mappingGroups) {
    assert.ok(
      mappingGroup.evidence.length >= 40,
      `${manifest.subjectId}/${mappingGroup.topicId}: weak evidence note`,
    );
    assert.ok(
      [
        "reviewed-question-semantics-and-source-range",
        "id-prefix-and-reviewed-question-semantics",
        "official-curriculum-and-reviewed-question-semantics",
      ].includes(mappingGroup.evidenceBasis),
      `${manifest.subjectId}/${mappingGroup.topicId}: unsupported evidence basis`,
    );
    if (proposedTopicIds.has(mappingGroup.topicId)) {
      const proposed = taxonomyProposal.topics.find(
        (item) => item.topicId === mappingGroup.topicId,
      );
      assert.equal(proposed.subjectId, manifest.subjectId);
      assert.deepEqual(
        proposed.questionIds,
        [...mappingGroup.questionIds].sort(),
      );
      const collision = db
        .prepare(
          "SELECT id FROM topics WHERE id=? OR (subject_id=? AND (slug=? OR lower(name)=lower(?)))",
        )
        .get(
          proposed.topicId,
          proposed.subjectId,
          proposed.slug,
          proposed.name,
        );
      assert.equal(
        collision,
        undefined,
        `${manifest.subjectId}/${mappingGroup.topicId}: proposed topic collides with current taxonomy`,
      );
    } else {
      const topic = db
        .prepare("SELECT id FROM topics WHERE id=? AND subject_id=?")
        .get(mappingGroup.topicId, manifest.subjectId);
      assert.ok(
        topic,
        `${manifest.subjectId}/${mappingGroup.topicId}: missing or cross-subject topic`,
      );
    }
    for (const questionId of mappingGroup.questionIds) {
      const question = db
        .prepare(
          "SELECT id FROM questions WHERE id=? AND subject_id=? AND topic_id IS NULL",
        )
        .get(questionId, manifest.subjectId);
      assert.ok(
        question,
        `${manifest.subjectId}/${questionId}: missing, non-null or cross-subject question`,
      );
      assert.ok(
        !repoOnlyExcludedIds.has(questionId),
        `${manifest.subjectId}/${questionId}: repo-only row leaked into production scope`,
      );
    }
  }

  assert.deepEqual(
    manifest.reviewedExceptions,
    [],
    `${manifest.subjectId}: avoidable exception remains`,
  );
  for (const reviewedException of manifest.reviewedExceptions) {
    assert.ok(
      reviewedException.reasonCode.length > 0 &&
        reviewedException.reason.length >= 40 &&
        reviewedException.evidence.length >= 40,
      `${manifest.subjectId}: incomplete exception evidence`,
    );
    for (const questionId of reviewedException.questionIds) {
      const question = db
        .prepare(
          "SELECT id FROM questions WHERE id=? AND subject_id=? AND topic_id IS NULL",
        )
        .get(questionId, manifest.subjectId);
      assert.ok(
        question,
        `${manifest.subjectId}/${questionId}: invalid exception scope`,
      );
    }
    if (reviewedException.reasonCode === "missing_subject_taxonomy") {
      const topicCount = db
        .prepare("SELECT COUNT(*) AS count FROM topics WHERE subject_id=?")
        .get(manifest.subjectId).count;
      assert.equal(
        topicCount,
        0,
        `${manifest.subjectId}: missing-taxonomy exception no longer valid`,
      );
    }
  }
}

assert.equal(
  new Set(allConfiguredQuestionIds).size,
  allConfiguredQuestionIds.length,
  "question appears in more than one subject manifest",
);
assert.ok(
  allConfiguredQuestionIds.every(
    (questionId) =>
      !questionId.startsWith("q_wassce_emath_") &&
      !questionId.startsWith("q_em_2023_"),
  ),
  "Elective Mathematics leaked into remaining-WASSCE scope",
);
assert.deepEqual(
  db.prepare("PRAGMA foreign_key_check").all(),
  [],
  "fixture has foreign-key violations",
);

const summary = manifests.map((manifest) => ({
  subjectId: manifest.subjectId,
  nullTopicRows: manifest.expectedNullTopicCount,
  mapped: manifest.mappedQuestionCount,
  exceptions: manifest.exceptionCount,
}));
process.stdout.write(
  `${JSON.stringify(
    {
      repositoryFixtureTotal: 1569,
      excludedRepoOnly: 69,
      total: 1500,
      mapped: 1500,
      exceptions: 0,
      proposedTopics: 20,
      proposedQuestionMappings: 536,
      subjects: summary,
    },
    null,
    2,
  )}\n`,
);
