"use strict";

const EXISTING_TOPIC_CANDIDATES = Object.freeze({
  topic_algebra: ["subj_nsmq_math", "topic_nsmq_math_algebra"],
  topic_calculus: ["subj_nsmq_math", "topic_nsmq_math_calculus"],
  topic_geometry: ["subj_nsmq_math", "topic_nsmq_math_geometry"],
  topic_quadratic: ["subj_nsmq_math", "topic_nsmq_math_quadratic"],
  topic_statistics: ["subj_nsmq_math", "topic_nsmq_math_statistics"],
  topic_trigonometry: ["subj_nsmq_math", "topic_nsmq_math_trigonometry"],
  topic_atomic: ["subj_nsmq_chemistry", "topic_nsmq_chem_atomic"],
  topic_bonding: ["subj_nsmq_chemistry", "topic_nsmq_chem_bonding"],
  topic_electrochemistry: ["subj_nsmq_chemistry", "topic_nsmq_chem_electrochemistry"],
  topic_equilibrium: ["subj_nsmq_chemistry", "topic_nsmq_chem_equilibrium"],
  topic_organic: ["subj_nsmq_chemistry", "topic_nsmq_chem_organic"],
  topic_stoichiometry: ["subj_nsmq_chemistry", "topic_nsmq_chem_stoichiometry"],
  topic_biochemistry: ["subj_nsmq_biology", "topic_nsmq_bio_biochemistry"],
  topic_cells: ["subj_nsmq_biology", "topic_nsmq_bio_cells"],
  topic_ecology: ["subj_nsmq_biology", "topic_nsmq_bio_ecology"],
  topic_genetics: ["subj_nsmq_biology", "topic_nsmq_bio_genetics"],
  topic_physiology: ["subj_nsmq_biology", "topic_nsmq_bio_physiology"],
  topic_electricity: ["subj_nsmq_physics", "topic_nsmq_phys_electricity"],
  topic_mechanics: ["subj_nsmq_physics", "topic_nsmq_phys_mechanics"],
  topic_modern_physics: ["subj_nsmq_physics", "topic_nsmq_phys_modern_physics"],
  topic_thermodynamics: ["subj_nsmq_physics", "topic_nsmq_phys_thermodynamics"],
  topic_waves: ["subj_nsmq_physics", "topic_nsmq_phys_waves"],
});

function buildTopicResolutions(rows, proposedTopics = []) {
  const proposedById = new Map(proposedTopics.map((topic) => [topic.id, topic.subjectId]));
  const resolutions = new Map();
  for (const row of rows) {
    const logicalTopicId = row.topicId;
    const subjectId = row.subjectId;
    if (!logicalTopicId || !subjectId) throw new Error("Topic resolution row is incomplete");
    let candidateTopicIds;
    if (proposedById.has(logicalTopicId)) {
      if (proposedById.get(logicalTopicId) !== subjectId) {
        throw new Error(`Proposed topic ownership drift for ${logicalTopicId}`);
      }
      candidateTopicIds = [logicalTopicId];
    } else if (EXISTING_TOPIC_CANDIDATES[logicalTopicId]) {
      const [expectedSubject, canonicalTopicId] = EXISTING_TOPIC_CANDIDATES[logicalTopicId];
      if (expectedSubject !== subjectId) {
        throw new Error(`Logical topic ownership drift for ${logicalTopicId}`);
      }
      candidateTopicIds = [canonicalTopicId, logicalTopicId];
    } else if (logicalTopicId.startsWith("topic_nsmq_")) {
      candidateTopicIds = [logicalTopicId];
    } else {
      throw new Error(`No canonical NSMQ topic resolution for ${logicalTopicId}`);
    }
    const key = `${logicalTopicId}\u0000${subjectId}`;
    const existing = resolutions.get(key);
    if (existing && existing.candidateTopicIds.join("\u0000") !== candidateTopicIds.join("\u0000")) {
      throw new Error(`Conflicting topic candidates for ${logicalTopicId}`);
    }
    resolutions.set(key, { logicalTopicId, subjectId, candidateTopicIds });
  }
  return [...resolutions.values()].sort((left, right) =>
    left.subjectId.localeCompare(right.subjectId) || left.logicalTopicId.localeCompare(right.logicalTopicId),
  );
}

function renderCanonicalTopicCase(topicExpression, subjectExpression) {
  return `CASE ${subjectExpression}
    WHEN 'subj_nsmq_math' THEN 'topic_nsmq_math_'||substr(${topicExpression},7)
    WHEN 'subj_nsmq_physics' THEN 'topic_nsmq_phys_'||substr(${topicExpression},7)
    WHEN 'subj_nsmq_chemistry' THEN 'topic_nsmq_chem_'||substr(${topicExpression},7)
    WHEN 'subj_nsmq_biology' THEN 'topic_nsmq_bio_'||substr(${topicExpression},7)
    ELSE ${topicExpression} END`;
}

module.exports = { EXISTING_TOPIC_CANDIDATES, buildTopicResolutions, renderCanonicalTopicCase };
