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
