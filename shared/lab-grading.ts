// =============================================
// VIRTUAL LAB — SHARED GRADING DOMAIN
// Consumed by both the worker (workers/api/lab.ts, authoritative grading)
// and the frontend (src/, live progress hints) via relative import,
// exactly like shared/freemium-policy.ts.
// =============================================

export type LabMode = 'guided' | 'sandbox';
export type SimulationType = 'custom' | 'phet';
export type ApparatusCategory =
  | 'measurement'
  | 'container'
  | 'heating'
  | 'optical'
  | 'electrical'
  | 'biological'
  | 'support'
  | 'chemical';

export interface InteractionPoint {
  id: string;
  name: string;
  type: 'input' | 'output' | 'connect' | 'measure' | 'adjust';
  position: { x: number; y: number };
  acceptsFrom?: string[];
}

export interface ApparatusProperties {
  isDraggable: boolean;
  isConnectable: boolean;
  hasReading?: boolean;
  readingType?: 'numeric' | 'visual' | 'color';
  readingUnit?: string;
  minValue?: number;
  maxValue?: number;
  precision?: number;
  defaultValue?: number;
}

export interface Apparatus {
  id: string;
  name: string;
  description: string;
  category: ApparatusCategory;
  iconUrl?: string;
  spriteUrl?: string;
  interactionPoints: InteractionPoint[];
  properties: ApparatusProperties;
  subjectId: string;
}

export interface Material {
  name: string;
  quantity: string;
  concentration?: string;
}

export type LabActionType =
  | 'drag' | 'connect' | 'adjust' | 'measure' | 'record' | 'observe' | 'pour' | 'heat';

export interface RequiredAction {
  actionType: LabActionType;
  targetApparatus: string;
  targetValue?: number;
  tolerance?: number;
  description: string;
}

export interface ProcedureStep {
  stepNumber: number;
  instruction: string;
  hint?: string;
  requiredActions: RequiredAction[];
  expectedOutcome?: string;
  imageUrl?: string;
  videoUrl?: string;
  isCheckpoint: boolean;
  maxMarks: number;
}

export interface ExpectedResult {
  condition: string;
  value: string | number;
  tolerance?: number;
  unit?: string;
}

export interface AssessmentCriterion {
  id: string;
  name: string;
  description: string;
  maxMarks: number;
  rubric: {
    marks: number;
    description: string;
  }[];
}

export interface Experiment {
  id: string;
  subjectId: string;
  topicId: string;
  name: string;
  slug: string;
  description: string;
  objectives: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  simulationType: SimulationType;
  phetSimUrl?: string;
  apparatus: string[]; // Apparatus IDs
  materials: Material[];
  safetyNotes: string[];
  procedure: ProcedureStep[];
  expectedResults: ExpectedResult[];
  assessmentCriteria: AssessmentCriterion[];
  examTypeId: string;
  paperTypeId: string;
  waecPastYears?: number[];
  isActive: boolean;
  isPremium?: boolean;
}

// =============================================
// EVENT STREAM — payloads stored in lab_session_events.payload
// =============================================

export type LabEventType = 'measurement' | 'action' | 'observation' | 'step_complete';

export interface MeasurementEventPayload {
  value: number;
  unit: string;
  label: string;
  /** Normalized-exact match key against ExpectedResult.condition. */
  condition?: string;
  /** Optional: sims that know the apparatus (e.g. titration burette) set it. */
  apparatusId?: string;
  stepNumber?: number;
}

export interface ActionEventPayload {
  actionType: LabActionType;
  targetApparatus: string;
  value?: number;
  stepNumber?: number;
}

export interface ObservationEventPayload {
  text: string;
  stepNumber?: number;
}

export interface StepCompleteEventPayload {
  stepNumber: number;
}

export type LabEventPayload =
  | MeasurementEventPayload
  | ActionEventPayload
  | ObservationEventPayload
  | StepCompleteEventPayload;

export interface LabEventInput {
  clientEventId: string;
  eventType: LabEventType;
  payload: LabEventPayload;
}

// =============================================
// GRADING RESULT — stored in lab_sessions.grading_json
// =============================================

export type StepEvidence = 'full' | 'partial' | 'self_report_only';

export interface StepScore {
  stepNumber: number;
  marksEarned: number;
  maxMarks: number;
  evidence: StepEvidence;
  feedback: string;
}

export interface CriterionScore {
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
  feedback: string; // rubric band description from the experiment's own rubric[]
}

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  criteriaScores: CriterionScore[];
  stepScores: StepScore[];
}

// =============================================
// GRADING ENGINE — pure, deterministic, no I/O, no AI.
// Same events + same experiment → identical GradingResult.
// =============================================

const MEASUREMENT_CRITERION_PATTERN =
  /\b(accuracy|measurements?|data|observations?|recordings?|calculations?|analysis|graph|results?|identification)\b/i;

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

interface TypedEvent {
  eventType: LabEventType;
  payload: LabEventPayload;
}

function matchesRequiredAction(action: TypedEvent, required: RequiredAction, stepNumber: number): boolean {
  const p = action.payload as ActionEventPayload;
  if (p.stepNumber !== stepNumber) return false;
  if (p.actionType !== required.actionType) return false;
  if (normalize(p.targetApparatus) !== normalize(required.targetApparatus)) return false;
  if (required.targetValue === undefined) return true;
  if (typeof p.value !== 'number') return false;
  return Math.abs(p.value - required.targetValue) <= (required.tolerance ?? 0);
}

function rubricFeedback(criterion: AssessmentCriterion, score: number): string {
  const bands = [...criterion.rubric].sort((a, b) => b.marks - a.marks);
  const band = bands.find((b) => score >= b.marks) ?? bands[bands.length - 1];
  return band?.description ?? '';
}

export function gradeSession(experiment: Experiment, events: LabEventInput[]): GradingResult {
  const typed: TypedEvent[] = events.map((e) => ({ eventType: e.eventType, payload: e.payload }));
  const actions = typed.filter((e) => e.eventType === 'action');
  const measurements = typed.filter((e) => e.eventType === 'measurement');
  const observations = typed.filter((e) => e.eventType === 'observation');
  const stepCompletes = new Set(
    typed
      .filter((e) => e.eventType === 'step_complete')
      .map((e) => (e.payload as StepCompleteEventPayload).stepNumber),
  );

  // --- Steps from evidence, never self-report alone ---
  const stepScores: StepScore[] = experiment.procedure.map((step) => {
    const matched = step.requiredActions.filter((ra) =>
      actions.some((a) => matchesRequiredAction(a, ra, step.stepNumber)),
    ).length;
    const hasStepComplete = stepCompletes.has(step.stepNumber);

    if (step.requiredActions.length === 0) {
      // A bare step_complete is self-report, not evidence: the tagged event
      // must be something other than the completion mark itself.
      const hasAnyStepEvent = typed.some(
        (e) =>
          e.eventType !== 'step_complete' &&
          (e.payload as { stepNumber?: number }).stepNumber === step.stepNumber,
      );
      const earned = hasStepComplete && hasAnyStepEvent ? step.maxMarks : 0;
      return {
        stepNumber: step.stepNumber,
        marksEarned: earned,
        maxMarks: step.maxMarks,
        evidence: earned > 0 ? 'full' : 'partial',
        feedback: earned > 0 ? 'Step completed with recorded evidence' : 'No evidence recorded for this step',
      };
    }

    if (matched === step.requiredActions.length) {
      return {
        stepNumber: step.stepNumber,
        marksEarned: step.maxMarks,
        maxMarks: step.maxMarks,
        evidence: 'full',
        feedback: 'All required actions observed',
      };
    }
    if (matched === 0 && hasStepComplete) {
      return {
        stepNumber: step.stepNumber,
        marksEarned: 0,
        maxMarks: step.maxMarks,
        evidence: 'self_report_only',
        feedback: 'Marked complete but no supporting actions recorded',
      };
    }
    return {
      stepNumber: step.stepNumber,
      marksEarned: Math.round((step.maxMarks * matched) / step.requiredActions.length),
      maxMarks: step.maxMarks,
      evidence: 'partial',
      feedback:
        matched === 0
          ? 'No evidence recorded for this step'
          : `${matched} of ${step.requiredActions.length} required actions observed`,
    };
  });

  const stepMaxTotal = experiment.procedure.reduce((sum, s) => sum + s.maxMarks, 0);
  const stepEarnedTotal = stepScores.reduce((sum, s) => sum + s.marksEarned, 0);
  const procedureFraction = stepMaxTotal > 0 ? stepEarnedTotal / stepMaxTotal : 0;

  // --- Measurements vs expectedResults (numeric expectations only) ---
  const numericExpectations = experiment.expectedResults.filter((r) => typeof r.value === 'number');
  let passedExpectations = 0;
  const expectationFeedback: string[] = [];
  for (const expected of numericExpectations) {
    const matches = measurements.filter((m) => {
      const p = m.payload as MeasurementEventPayload;
      return normalize(p.condition ?? p.label) === normalize(expected.condition);
    });
    if (matches.length === 0) {
      // Absence is already covered by the rubric band text ("Readings missing
      // or wrong"); only recorded-but-failed measurements add detail.
      continue;
    }
    const units = new Set(matches.map((m) => normalize((m.payload as MeasurementEventPayload).unit)));
    if (expected.unit && units.size === 1 && !units.has(normalize(expected.unit))) {
      expectationFeedback.push(
        `Unit mismatch: expected ${expected.unit}, recorded ${[...units][0]}`,
      );
      continue;
    }
    if (expected.tolerance === undefined) {
      expectationFeedback.push(
        `Experiment definition is missing a tolerance for '${expected.condition}'; cannot grade this measurement`,
      );
      continue;
    }
    const mean =
      matches.reduce((sum, m) => sum + (m.payload as MeasurementEventPayload).value, 0) / matches.length;
    if (Math.abs(mean - (expected.value as number)) <= expected.tolerance) {
      passedExpectations += 1;
    } else {
      expectationFeedback.push(
        `'${expected.condition}': recorded mean ${Number(mean.toFixed(4))} ${expected.unit ?? ''} outside ±${expected.tolerance} of expected ${expected.value}`,
      );
    }
  }
  const measurementFraction =
    numericExpectations.length > 0
      ? passedExpectations / numericExpectations.length
      : experiment.procedure.length > 0
        ? experiment.procedure.filter((step) =>
            [...measurements, ...observations].some(
              (e) => (e.payload as { stepNumber?: number }).stepNumber === step.stepNumber,
            ),
          ).length / experiment.procedure.length
        : 0;

  // --- Criteria map onto evidence; feedback is authored rubric text ---
  let criteriaScores: CriterionScore[] = experiment.assessmentCriteria.map((criterion) => {
    const isMeasurement = MEASUREMENT_CRITERION_PATTERN.test(
      `${criterion.name} ${criterion.description}`,
    );
    const fraction = isMeasurement ? measurementFraction : procedureFraction;
    const score = Math.round(criterion.maxMarks * fraction);
    const base = rubricFeedback(criterion, score);
    const problems =
      isMeasurement && score < criterion.maxMarks && expectationFeedback.length > 0
        ? `${base} (${expectationFeedback.join('; ')})`
        : base;
    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      score,
      maxScore: criterion.maxMarks,
      feedback: problems,
    };
  });

  // Fall back to the procedure mark scheme when no criteria are authored.
  if (criteriaScores.length === 0) {
    criteriaScores = [
      {
        criterionId: 'crit_procedure',
        criterionName: 'Procedure',
        score: stepEarnedTotal,
        maxScore: stepMaxTotal,
        feedback: 'Scored from recorded step evidence',
      },
    ];
  }

  const totalScore = criteriaScores.reduce((sum, c) => sum + c.score, 0);
  const maxScore = criteriaScores.reduce((sum, c) => sum + c.maxScore, 0);
  return {
    totalScore,
    maxScore,
    percentageScore: maxScore > 0 ? Math.round((100 * totalScore) / maxScore) : 0,
    criteriaScores,
    stepScores,
  };
}
