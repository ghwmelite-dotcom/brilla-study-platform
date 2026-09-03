import { describe, expect, it } from 'vitest';
import { getExperimentBySlug, allExperiments } from './experiments';
import { gradeSession } from './lab-grading';
import type { Experiment, LabEventInput } from './lab-grading';

const titration = getExperimentBySlug('acid-base-titration')!;

// Synthetic experiment isolating one numeric expectation and one 2-action step.
const synthetic: Experiment = {
  id: 'exp_test', subjectId: 's', topicId: 't', name: 'Test', slug: 'test-exp',
  description: '', objectives: [], difficulty: 'easy', estimatedTime: 10,
  simulationType: 'custom', apparatus: [], materials: [], safetyNotes: [],
  procedure: [
    {
      stepNumber: 1, instruction: 'Do the thing', isCheckpoint: true, maxMarks: 4,
      requiredActions: [
        { actionType: 'pour', targetApparatus: 'app_flask', description: 'Pour' },
        { actionType: 'adjust', targetApparatus: 'app_psu', targetValue: 6, tolerance: 0.5, description: 'Set 6V' },
      ],
    },
    {
      stepNumber: 2, instruction: 'Watch', isCheckpoint: false, maxMarks: 2,
      requiredActions: [],
    },
  ],
  expectedResults: [{ condition: 'Final temperature', value: 40, tolerance: 2, unit: '°C' }],
  assessmentCriteria: [
    {
      id: 'crit_tech', name: 'Experimental Technique', description: 'Handling', maxMarks: 6,
      rubric: [
        { marks: 6, description: 'Perfect technique' },
        { marks: 3, description: 'Minor issues' },
        { marks: 1, description: 'Poor technique' },
      ],
    },
    {
      id: 'crit_meas', name: 'Measurements', description: 'Accurate readings', maxMarks: 4,
      rubric: [
        { marks: 4, description: 'All readings within tolerance' },
        { marks: 2, description: 'Some readings off' },
        { marks: 0, description: 'Readings missing or wrong' },
      ],
    },
  ],
  examTypeId: 'e', paperTypeId: 'p', isActive: true,
};

const ev = (
  clientEventId: string,
  eventType: LabEventInput['eventType'],
  payload: LabEventInput['payload'],
): LabEventInput => ({ clientEventId, eventType, payload });

describe('gradeSession — measurements vs expectedResults', () => {
  const base = [ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
                ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 6, stepNumber: 1 })];

  it('passes a measurement within tolerance and at the inclusive boundary', () => {
    const within = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 41, unit: '°C', label: 'Final temperature', condition: 'Final temperature' })]);
    expect(within.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(4);

    const atBoundary = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 42, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    expect(atBoundary.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(4);
  });

  it('fails a measurement outside tolerance', () => {
    const result = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 42.1, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(0);
  });

  it('scores zero with explicit feedback on unit mismatch', () => {
    const result = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 40, unit: 'K', label: 'x', condition: 'Final temperature' })]);
    const crit = result.criteriaScores.find((c) => c.criterionId === 'crit_meas')!;
    expect(crit.score).toBe(0);
    expect(crit.feedback).toContain('Unit mismatch');
  });

  it('scores zero and flags the data when a numeric expectation lacks a tolerance', () => {
    const noTol: Experiment = {
      ...synthetic,
      expectedResults: [{ condition: 'Final temperature', value: 40, unit: '°C' }],
    };
    const result = gradeSession(noTol, [...base,
      ev('m1', 'measurement', { value: 40, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    const crit = result.criteriaScores.find((c) => c.criterionId === 'crit_meas')!;
    expect(crit.score).toBe(0);
    expect(crit.feedback).toContain('missing a tolerance');
  });

  it('aggregates repeated measurements by mean before comparing', () => {
    const result = gradeSession(synthetic, [...base,
      ev('m1', 'measurement', { value: 39, unit: '°C', label: 'x', condition: 'Final temperature' }),
      ev('m2', 'measurement', { value: 41, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(4); // mean 40
  });

  it('ignores string-valued expectedResults for numeric scoring', () => {
    const withString: Experiment = {
      ...synthetic,
      expectedResults: [
        { condition: 'Final temperature', value: 40, tolerance: 2, unit: '°C' },
        { condition: 'Concordant readings', value: 'within 0.1ml' },
      ],
    };
    const result = gradeSession(withString, [...base,
      ev('m1', 'measurement', { value: 40, unit: '°C', label: 'x', condition: 'Final temperature' })]);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.score).toBe(4);
  });
});

describe('gradeSession — actions and step evidence', () => {
  it('awards full marks when all required actions are observed, in any order', () => {
    const result = gradeSession(synthetic, [
      ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 6.4, stepNumber: 1 }),
      ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
      ev('m1', 'measurement', { value: 40, unit: '°C', label: 'x', condition: 'Final temperature' }),
    ]);
    expect(result.stepScores[0]).toMatchObject({ stepNumber: 1, marksEarned: 4, maxMarks: 4, evidence: 'full' });
  });

  it('rejects an adjust action outside its tolerance', () => {
    const result = gradeSession(synthetic, [
      ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
      ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 9, stepNumber: 1 }),
    ]);
    expect(result.stepScores[0]).toMatchObject({ marksEarned: 2, evidence: 'partial' }); // 4 * 1/2
  });

  it('flags step_complete with no supporting actions as self_report_only with zero marks', () => {
    const result = gradeSession(synthetic, [
      ev('s1', 'step_complete', { stepNumber: 1 }),
    ]);
    expect(result.stepScores[0]).toMatchObject({
      marksEarned: 0,
      evidence: 'self_report_only',
      feedback: 'Marked complete but no supporting actions recorded',
    });
  });

  it('accepts step_complete when the required actions are present', () => {
    const result = gradeSession(synthetic, [
      ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
      ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 6, stepNumber: 1 }),
      ev('s1', 'step_complete', { stepNumber: 1 }),
    ]);
    expect(result.stepScores[0].evidence).toBe('full');
  });

  it('scores an empty-requiredActions step from step_complete plus any tagged event', () => {
    const earned = gradeSession(synthetic, [
      ev('s2', 'step_complete', { stepNumber: 2 }),
      ev('o1', 'observation', { text: 'colour changed', stepNumber: 2 }),
    ]);
    expect(earned.stepScores[1]).toMatchObject({ marksEarned: 2, evidence: 'full' });

    const bare = gradeSession(synthetic, [ev('s2', 'step_complete', { stepNumber: 2 })]);
    expect(bare.stepScores[1]).toMatchObject({ marksEarned: 0 });
  });

  it('honors per-step maxMarks (no step can exceed its own cap)', () => {
    const result = gradeSession(synthetic, [
      ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
      ev('a1b', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
    ]);
    expect(result.stepScores[0].marksEarned).toBeLessThanOrEqual(4);
  });

  it('scores an empty event stream as all zeros, honestly', () => {
    const result = gradeSession(synthetic, []);
    expect(result.totalScore).toBe(0);
    expect(result.percentageScore).toBe(0);
    expect(result.stepScores.every((s) => s.marksEarned === 0)).toBe(true);
  });
});

describe('gradeSession — criteria, rubric bands, totals', () => {
  const fullEvidence: LabEventInput[] = [
    ev('a1', 'action', { actionType: 'pour', targetApparatus: 'app_flask', stepNumber: 1 }),
    ev('a2', 'action', { actionType: 'adjust', targetApparatus: 'app_psu', value: 6, stepNumber: 1 }),
    ev('s2', 'step_complete', { stepNumber: 2 }),
    ev('o1', 'observation', { text: 'done', stepNumber: 2 }),
    ev('m1', 'measurement', { value: 40, unit: '°C', label: 'x', condition: 'Final temperature' }),
  ];

  it('maps criterion scores to the matching rubric band description', () => {
    const result = gradeSession(synthetic, fullEvidence);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_tech')?.feedback).toBe('Perfect technique');
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.feedback)
      .toBe('All readings within tolerance');
  });

  it('uses the lowest band when the score is below every band', () => {
    const result = gradeSession(synthetic, []);
    expect(result.criteriaScores.find((c) => c.criterionId === 'crit_meas')?.feedback)
      .toBe('Readings missing or wrong');
  });

  it('computes totals from the criteria mark scheme', () => {
    const result = gradeSession(synthetic, fullEvidence);
    expect(result.maxScore).toBe(10); // 6 + 4
    expect(result.totalScore).toBe(10);
    expect(result.percentageScore).toBe(100);
  });

  it('is deterministic: same input twice gives byte-identical output', () => {
    const a = JSON.stringify(gradeSession(titration, fullEvidence));
    const b = JSON.stringify(gradeSession(titration, fullEvidence));
    expect(a).toBe(b);
  });

  it('a real experiment: bare self-marks earn nothing', () => {
    const selfMarked = titration.procedure.map((s, i) =>
      ev(`s${i}`, 'step_complete', { stepNumber: s.stepNumber }));
    const result = gradeSession(titration, selfMarked);
    expect(result.totalScore).toBe(0);
    expect(result.stepScores.every((s) => s.evidence === 'self_report_only' || s.marksEarned === 0)).toBe(true);
  });
});

describe('experiment data audit', () => {
  it('every numeric expectedResult in the corpus declares a tolerance', () => {
    const missing = allExperiments.flatMap((exp) =>
      exp.expectedResults
        .filter((r) => typeof r.value === 'number' && r.tolerance === undefined)
        .map((r) => `${exp.slug}: ${r.condition}`),
    );
    expect(missing).toEqual([]);
  });
});
