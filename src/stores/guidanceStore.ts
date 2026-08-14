import { create } from 'zustand';
import { api, type ApiResponse } from '@/lib/api';
import type { GuidanceExamType } from '@/lib/guidanceExamCatalog';

export type GuidanceConfidence = 'low' | 'medium' | 'high';

export interface TopicCoverage {
  covered: number;
  total: number;
  ratio: number;
}

export interface GuidanceEvidence {
  evidenceCount: number;
  topicCoverage: TopicCoverage;
  /** ISO timestamp for the latest evidence, or null when no evidence exists. */
  freshness: string | null;
  confidence: GuidanceConfidence;
  algorithmVersion: string;
  completedEarly: boolean;
}

export interface UserGoal {
  id: string;
  examType: GuidanceExamType;
  subjectId: string;
  targetGrade: string | null;
  examYear: number | null;
  examMonth: number | null;
  updatedAt: string;
}

export interface PublicQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false';
  options: string[] | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  topicName: string | null;
}

export interface RoadmapNode {
  topicId: string;
  topicName: string;
  masteryScore: number;
  questionsAttempted: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: 'weak_area' | 'not_started' | 'review_needed' | 'maintain';
  estimatedTime: number;
  href: string;
}

export interface BriePlan extends GuidanceEvidence {
  goal: UserGoal | null;
  readiness: number;
  readinessSource: 'assessment' | 'mastery' | 'none';
  readinessBand: number;
  roadmap: RoadmapNode[];
  thisWeek: RoadmapNode[];
  narrative: string;
  narrativeCached: boolean;
  fallback: boolean;
}

export interface AssessmentDone extends GuidanceEvidence {
  readiness: number;
}

export interface AnswerResult {
  correct: boolean;
  version: number;
  explanation: string | null;
  runningEstimate: number;
  askedSoFar: number;
  idempotent: boolean;
  nextQuestion?: PublicQuestion;
  done?: AssessmentDone;
}

interface AssessmentQuizStart extends GuidanceEvidence {
  sessionId: string;
  version: number;
  nextQuestion: PublicQuestion;
  askedSoFar: number;
  target: number;
  skip?: false;
}

interface AssessmentSkipStart extends GuidanceEvidence {
  skip: true;
  readiness: number;
  source: 'mastery';
}

interface AssessmentCompleteStart extends GuidanceEvidence {
  sessionId: string;
  version: number;
  askedSoFar: number;
  target: number;
  done: AssessmentDone;
}

type AssessmentStartResponse = AssessmentQuizStart | AssessmentSkipStart | AssessmentCompleteStart;
export type AssessmentStartResult = 'quiz' | 'skip' | 'complete' | 'cooldown' | 'error';

export interface SaveGoalInput {
  examType: GuidanceExamType;
  subjectId: string;
  targetGrade?: string;
  examYear?: number;
  examMonth?: number;
}

interface RetakeCooldownResponse extends ApiResponse<AssessmentStartResponse> {
  code?: 'RETAKE_COOLDOWN' | string;
  retryAfterSeconds?: number;
}

interface PendingAnswer {
  sessionId: string;
  questionId: string;
  version: number;
  answer: string;
  timeTaken: number;
  idempotencyKey: string;
}

interface GuidanceState {
  goals: UserGoal[];
  plan: BriePlan | null;
  wizardOpen: boolean;
  sessionId: string | null;
  sessionVersion: number | null;
  activeExamType: GuidanceExamType | null;
  activeSubjectId: string | null;
  currentQuestion: PublicQuestion | null;
  askedSoFar: number;
  target: number;
  readiness: number | null;
  evidence: GuidanceEvidence | null;
  lastAnswer: { correct: boolean; explanation: string | null } | null;
  skipped: boolean;
  retakeCooldownSeconds: number | null;
  isLoading: boolean;
  error: string | null;
  pendingAnswer: PendingAnswer | null;
  fetchGoals: () => Promise<UserGoal[]>;
  saveGoal: (goal: SaveGoalInput) => Promise<boolean>;
  startAssessment: (
    examType: GuidanceExamType,
    subjectId: string,
    options?: { forceRetake?: boolean }
  ) => Promise<AssessmentStartResult>;
  submitAnswer: (questionId: string, answer: string, timeTaken?: number) => Promise<AnswerResult | null>;
  fetchPlan: (examType: GuidanceExamType, subjectId: string) => Promise<BriePlan | null>;
  regeneratePlan: (
    examType: GuidanceExamType,
    subjectId: string
  ) => Promise<'ok' | 'premium_required' | 'error'>;
  openWizard: () => void;
  closeWizard: () => void;
  clearError: () => void;
  resetQuiz: () => void;
}

const EMPTY_QUIZ_STATE = {
  sessionId: null,
  sessionVersion: null,
  activeExamType: null,
  activeSubjectId: null,
  currentQuestion: null,
  askedSoFar: 0,
  target: 9,
  readiness: null,
  evidence: null,
  lastAnswer: null,
  skipped: false,
  retakeCooldownSeconds: null,
  pendingAnswer: null,
} satisfies Partial<GuidanceState>;

function evidenceFrom(value: GuidanceEvidence): GuidanceEvidence {
  return {
    evidenceCount: value.evidenceCount,
    topicCoverage: value.topicCoverage,
    freshness: value.freshness,
    confidence: value.confidence,
    algorithmVersion: value.algorithmVersion,
    completedEarly: value.completedEarly,
  };
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `brie-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useGuidanceStore = create<GuidanceState>((set, get) => ({
  goals: [],
  plan: null,
  wizardOpen: false,
  isLoading: false,
  error: null,
  ...EMPTY_QUIZ_STATE,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    const response = await api.get<{ goals: UserGoal[] }>('/guidance/goals');
    if (!response.success || !response.data) {
      set({ isLoading: false, error: response.error || 'Brie could not load your goals.' });
      return [];
    }
    set({ goals: response.data.goals, isLoading: false });
    return response.data.goals;
  },

  saveGoal: async (goal) => {
    set({ isLoading: true, error: null });
    const response = await api.post<{ goal: UserGoal }>('/guidance/goals', goal);
    if (!response.success || !response.data) {
      set({ isLoading: false, error: response.error || 'Brie could not save your goal.' });
      return false;
    }
    const savedGoal = response.data.goal;
    set((state) => ({
      goals: [
        savedGoal,
        ...state.goals.filter(
          (item) => item.examType !== savedGoal.examType || item.subjectId !== savedGoal.subjectId
        ),
      ],
      activeExamType: savedGoal.examType,
      activeSubjectId: savedGoal.subjectId,
      isLoading: false,
    }));
    return true;
  },

  startAssessment: async (examType, subjectId, options = {}) => {
    set({
      ...(options.forceRetake ? EMPTY_QUIZ_STATE : {}),
      isLoading: true,
      error: null,
      retakeCooldownSeconds: null,
      activeExamType: examType,
      activeSubjectId: subjectId,
    });
    const response = (await api.post<AssessmentStartResponse>('/guidance/assessment/start', {
      examType,
      subjectId,
      forceRetake: options.forceRetake || undefined,
    })) as RetakeCooldownResponse;

    if (!response.success || !response.data) {
      const cooldown = response.code === 'RETAKE_COOLDOWN';
      set({
        isLoading: false,
        error: response.error || (cooldown ? 'Your next level check is not ready yet.' : 'Brie could not start the level check.'),
        retakeCooldownSeconds: cooldown ? response.retryAfterSeconds ?? null : null,
      });
      return cooldown ? 'cooldown' : 'error';
    }

    if ('done' in response.data) {
      const completed = response.data;
      set({
        sessionId: null,
        sessionVersion: completed.version,
        currentQuestion: null,
        askedSoFar: completed.askedSoFar,
        target: completed.target,
        readiness: completed.done.readiness,
        evidence: evidenceFrom(completed.done),
        skipped: false,
        isLoading: false,
      });
      await get().fetchPlan(examType, subjectId);
      return 'complete';
    }

    if ('skip' in response.data && response.data.skip) {
      const skipped = response.data;
      set({
        sessionId: null,
        sessionVersion: null,
        currentQuestion: null,
        readiness: skipped.readiness,
        evidence: evidenceFrom(skipped),
        skipped: true,
        isLoading: false,
      });
      await get().fetchPlan(examType, subjectId);
      return 'skip';
    }

    const started = response.data as AssessmentQuizStart;
    set({
      sessionId: started.sessionId,
      sessionVersion: started.version,
      currentQuestion: started.nextQuestion,
      askedSoFar: started.askedSoFar,
      target: started.target,
      evidence: evidenceFrom(started),
      readiness: null,
      skipped: false,
      lastAnswer: null,
      isLoading: false,
    });
    return 'quiz';
  },

  submitAnswer: async (questionId, answer, timeTaken = 0) => {
    const { sessionId, sessionVersion, pendingAnswer } = get();
    if (!sessionId || sessionVersion === null) {
      set({ error: 'There is no active level check.' });
      return null;
    }

    const request =
      pendingAnswer &&
      pendingAnswer.sessionId === sessionId &&
      pendingAnswer.questionId === questionId &&
      pendingAnswer.version === sessionVersion &&
      pendingAnswer.answer === answer
        ? pendingAnswer
        : { sessionId, version: sessionVersion, questionId, answer, timeTaken, idempotencyKey: createIdempotencyKey() };

    set({ isLoading: true, error: null, pendingAnswer: request });
    const response = await api.post<AnswerResult>(`/guidance/assessment/${sessionId}/answer`, {
      questionId,
      answer,
      version: request.version,
      timeTaken,
      idempotencyKey: request.idempotencyKey,
    });
    if (!response.success || !response.data) {
      set({ isLoading: false, error: response.error || 'Brie could not record that answer.' });
      return null;
    }

    const result = response.data;
    set({
      currentQuestion: result.nextQuestion ?? null,
      askedSoFar: result.askedSoFar,
      sessionVersion: result.version,
      lastAnswer: { correct: result.correct, explanation: result.explanation },
      readiness: result.done?.readiness ?? get().readiness,
      evidence: result.done ? evidenceFrom(result.done) : get().evidence,
      isLoading: false,
      pendingAnswer: null,
    });

    if (result.done) {
      const { activeExamType, activeSubjectId } = get();
      if (activeExamType && activeSubjectId) await get().fetchPlan(activeExamType, activeSubjectId);
    }
    return result;
  },

  fetchPlan: async (examType, subjectId) => {
    set({ isLoading: true, error: null, activeExamType: examType, activeSubjectId: subjectId });
    const query = new URLSearchParams({ examType, subjectId });
    const response = await api.get<{ plan: BriePlan }>(`/guidance/plan?${query.toString()}`);
    if (!response.success || !response.data) {
      set({ isLoading: false, error: response.error || 'Brie could not load your study plan.' });
      return null;
    }
    const plan = response.data.plan;
    set({ plan, readiness: plan.readiness, evidence: evidenceFrom(plan), isLoading: false });
    return plan;
  },

  regeneratePlan: async (examType, subjectId) => {
    set({ isLoading: true, error: null });
    const response = await api.post<{ plan: BriePlan }>('/guidance/plan/regenerate', {
      examType,
      subjectId,
    });
    if (!response.success || !response.data) {
      const premiumRequired = (response as ApiResponse<{ plan: BriePlan }> & { upgradeRequired?: boolean })
        .upgradeRequired;
      set({ isLoading: false, error: response.error || 'Brie could not refresh your plan.' });
      return premiumRequired ? 'premium_required' : 'error';
    }
    set({ plan: response.data.plan, evidence: evidenceFrom(response.data.plan), isLoading: false });
    return 'ok';
  },

  openWizard: () => set({ wizardOpen: true, error: null }),
  closeWizard: () => set({ wizardOpen: false }),
  clearError: () => set({ error: null }),
  resetQuiz: () => set({ ...EMPTY_QUIZ_STATE, plan: null, error: null }),
}));
