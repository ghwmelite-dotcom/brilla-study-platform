// Virtual Lab Type Definitions

// =============================================
// CORE TYPES
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

export type LabSessionStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

// =============================================
// APPARATUS TYPES
// =============================================

export interface InteractionPoint {
  id: string;
  name: string;
  type: 'input' | 'output' | 'connect' | 'measure' | 'adjust';
  position: { x: number; y: number };
  acceptsFrom?: string[]; // Apparatus IDs that can connect
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

export interface Material {
  name: string;
  quantity: string;
  concentration?: string;
}

export interface RequiredAction {
  actionType: 'drag' | 'connect' | 'adjust' | 'measure' | 'record' | 'observe' | 'pour' | 'heat';
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
