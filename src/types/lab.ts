// Virtual Lab Type Definitions

// Domain types shared with the server-side grader live in shared/lab-grading.ts.
// Re-exported here so existing `@/types` imports keep working.
// NOTE: the shared GradingResult is intentionally NOT re-exported yet — the
// legacy GradingResult below still backs labStore's scoring stub and the
// LabWorkspace results screen until those are reworked (plan tasks 6 and 10).
export type {
  LabMode,
  SimulationType,
  ApparatusCategory,
  InteractionPoint,
  ApparatusProperties,
  Apparatus,
  Material,
  LabActionType,
  RequiredAction,
  ProcedureStep,
  ExpectedResult,
  AssessmentCriterion,
  Experiment,
  LabEventType,
  MeasurementEventPayload,
  ActionEventPayload,
  ObservationEventPayload,
  StepCompleteEventPayload,
  LabEventPayload,
  LabEventInput,
  StepEvidence,
  StepScore,
  CriterionScore,
} from '../../shared/lab-grading';
import type { Apparatus, LabMode } from '../../shared/lab-grading';

// =============================================
// CORE TYPES
// =============================================

export type LabSessionStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

// =============================================
// APPARATUS TYPES
// =============================================

export interface ApparatusInstance {
  instanceId: string;
  apparatusId: string;
  apparatus: Apparatus;
  position: Position;
  rotation: number;
  currentValue?: number;
  isActive: boolean;
}

export interface Connection {
  id: string;
  fromInstanceId: string;
  fromPoint: string;
  toInstanceId: string;
  toPoint: string;
}

export interface Position {
  x: number;
  y: number;
}

// =============================================
// EXPERIMENT TYPES
// =============================================
// (Material, RequiredAction, ProcedureStep, ExpectedResult,
//  AssessmentCriterion, and Experiment moved to shared/lab-grading.ts
//  and are re-exported at the top of this file.)

// =============================================
// LAB SESSION TYPES
// =============================================

export interface PerformedAction {
  actionType: string;
  apparatusId: string;
  value?: number;
  timestamp: string;
  isCorrect: boolean;
}

export interface StepProgress {
  stepNumber: number;
  isCompleted: boolean;
  completedAt?: string;
  actionsPerformed: PerformedAction[];
  marksEarned: number;
  feedback?: string;
}

export interface Measurement {
  id: string;
  apparatusId: string;
  value: number;
  unit: string;
  timestamp: string;
  stepNumber: number;
}

export interface Observation {
  id: string;
  stepNumber: number;
  text: string;
  timestamp: string;
}

export interface LabSession {
  id: string;
  userId: string;
  experimentId: string;
  mode: LabMode;
  status: LabSessionStatus;
  currentStepIndex: number;
  startedAt: string;
  completedAt?: string;
  timeSpent: number; // seconds
  stepProgress: StepProgress[];
  measurements: Measurement[];
  observations: Observation[];
  canvasState?: string; // Serialized canvas state
}

// =============================================
// ASSESSMENT TYPES
// =============================================

export interface CriteriaScore {
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface LabFeedback {
  overall: string;
  strengths: string[];
  improvements: string[];
  suggestedExperiments?: string[];
}

// LEGACY client-side grading shape — still consumed by labStore's scoring
// stub and the LabWorkspace results screen. The server-side GradingResult
// (criteriaScores + stepScores) lives in shared/lab-grading.ts; this legacy
// interface is deleted when those two consumers are reworked.
export interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  criteriaScores: CriteriaScore[];
  procedureAccuracy: number;
  measurementAccuracy: number;
  feedback: LabFeedback;
}

export interface LabAttempt {
  id: string;
  oduserId: string;
  experimentId: string;
  sessionId: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  criteriaScores: CriteriaScore[];
  procedureAccuracy: number;
  measurementAccuracy: number;
  conclusionScore: number;
  timeBonus?: number;
  feedback: LabFeedback;
  submittedAt: string;
}

// =============================================
// PROGRESS TYPES
// =============================================

export interface SkillMastery {
  skillName: string;
  level: number; // 0-100
  practiceCount: number;
}

export interface LabProgress {
  userId: string;
  subjectId: string;
  experimentsAttempted: number;
  experimentsCompleted: number;
  averageScore: number;
  skillsMastered: SkillMastery[];
  lastAttemptAt: string;
}

// =============================================
// CANVAS STATE TYPES
// =============================================

export interface CanvasState {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
}

// =============================================
// PHET INTEGRATION TYPES
// =============================================

export interface PhETProgress {
  timeSpent: number;
  interactions: number;
  checkpointsReached: string[];
}

export const PHET_SIMULATIONS: Record<string, string> = {
  'ohms-law': 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_en.html',
  'hookes-law': 'https://phet.colorado.edu/sims/html/hookes-law/latest/hookes-law_en.html',
  'pendulum-lab': 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_en.html',
  'geometric-optics': 'https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_en.html',
  'acid-base-solutions': 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html',
  'concentration': 'https://phet.colorado.edu/sims/html/concentration/latest/concentration_en.html',
  'ph-scale': 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_en.html',
  'masses-and-springs': 'https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs_en.html',
};
