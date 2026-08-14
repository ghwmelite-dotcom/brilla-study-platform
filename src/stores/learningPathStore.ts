import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subjects as examSubjects } from '@/data/examData';
import {
  GUIDANCE_EXAM_OPTIONS,
  toGuidanceExamType,
  type GuidanceExamType,
} from '@/lib/guidanceExamCatalog';
import type { ExamTypeSlug } from '@/types';
import { useExamStore } from './examStore';
import { useGuidanceStore, type BriePlan, type RoadmapNode, type UserGoal } from './guidanceStore';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationReason = RoadmapNode['reason'] | 'exam_focus' | 'streak_building' | 'trending_topic';

export interface RecommendedTopic {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  priority: RecommendationPriority;
  reason: RecommendationReason;
  reasonText: string;
  mastery: number;
  estimatedTime: number;
  questionCount: number;
  lastAttemptedAt?: string;
  examWeight?: number;
}

export interface ExamReadiness {
  examType: string;
  examName: string;
  overallReadiness: number;
  subjectReadiness: SubjectReadiness[];
  predictedScore: { low: number; mid: number; high: number };
  daysUntilExam?: number;
  recommendedFocus: string[];
}

export interface SubjectReadiness {
  subjectId: string;
  subjectName: string;
  readiness: number;
  topicsCompleted: number;
  totalTopics: number;
  weakTopics: string[];
  strongTopics: string[];
}

export interface StudyPlanItem {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  date: string;
  topics: StudyPlanTopic[];
  completed: boolean;
  xpTarget: number;
  xpEarned: number;
}

export interface StudyPlanTopic {
  topicId: string;
  topicName: string;
  subjectId: string;
  estimatedMinutes: number;
  completed: boolean;
  priority: RecommendationPriority;
}

export interface LearningGoal {
  id: string;
  type: 'daily' | 'weekly' | 'exam_prep';
  title: string;
  description: string;
  target: number;
  progress: number;
  unit: string;
  deadline?: string;
  completed: boolean;
}

interface LearningPathState {
  recommendedTopics: RecommendedTopic[];
  examReadiness: ExamReadiness | null;
  studyPlan: StudyPlanItem[];
  learningGoals: LearningGoal[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  generateRecommendations: () => Promise<void>;
  calculateExamReadiness: (examType: string) => Promise<void>;
  generateStudyPlan: (daysCount?: number) => Promise<void>;
  updateGoalProgress: (goalId: string, progress: number) => void;
  markStudyPlanItemComplete: (itemId: string) => void;
  markTopicComplete: (itemId: string, topicId: string) => void;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}


const DAY_NAMES: StudyPlanItem['day'][] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getSubjectName(subjectId: string): string {
  return examSubjects.find((subject) => subject.id === subjectId)?.name ?? 'Your subject';
}

function getExamName(examType: string): string {
  return examType.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase())
    .replace('Nsmq', 'NSMQ').replace('Wassce', 'WASSCE').replace('Bece', 'BECE').replace('Igcse', 'IGCSE');
}

function reasonText(node: RoadmapNode): string {
  switch (node.reason) {
    case 'weak_area': return `${node.masteryScore}% mastery - this is the fastest place to gain ground`;
    case 'not_started': return 'A syllabus topic you have not attempted yet';
    case 'review_needed': return 'Review now to strengthen what you already know';
    case 'maintain': return 'Keep this strong topic fresh';
  }
}

async function getGuidancePlan(examType?: string): Promise<{ goal: UserGoal; plan: BriePlan }> {
  const guidance = useGuidanceStore.getState();
  const goals = guidance.goals.length > 0 ? guidance.goals : await guidance.fetchGoals();
  const requestedExam = examType ?? useExamStore.getState().currentExamType;
  const wantedExam = GUIDANCE_EXAM_OPTIONS.some((exam) => exam.apiId === requestedExam)
    ? requestedExam as GuidanceExamType
    : toGuidanceExamType(requestedExam as ExamTypeSlug);
  const goal = goals.find((candidate) => candidate.examType === wantedExam) ?? goals[0];
  if (!goal) throw new Error('Set a goal with Counselor Brie to create your study plan.');
  await useGuidanceStore.getState().fetchPlan(goal.examType, goal.subjectId);
  const plan = useGuidanceStore.getState().plan;
  if (!plan) throw new Error(useGuidanceStore.getState().error ?? 'Your study plan is not available yet.');
  return { goal, plan };
}

function roadmapToRecommendations(goal: UserGoal, roadmap: RoadmapNode[]): RecommendedTopic[] {
  return roadmap.map((node) => ({
    topicId: node.topicId, topicName: node.topicName, subjectId: goal.subjectId,
    subjectName: getSubjectName(goal.subjectId), priority: node.priority, reason: node.reason,
    reasonText: reasonText(node), mastery: node.masteryScore, estimatedTime: node.estimatedTime,
    questionCount: node.questionsAttempted,
  }));
}

function roadmapToStudyPlan(goal: UserGoal, plan: BriePlan): StudyPlanItem[] {
  if (plan.thisWeek.length === 0) return [];
  const today = new Date();
  return [{
    id: `guidance-week-${goal.id}`, day: DAY_NAMES[today.getDay()] ?? 'monday', date: today.toISOString().slice(0, 10),
    topics: plan.thisWeek.map((node) => ({
      topicId: node.topicId, topicName: node.topicName, subjectId: goal.subjectId,
      estimatedMinutes: node.estimatedTime, completed: false, priority: node.priority,
    })),
    completed: false, xpTarget: 0, xpEarned: 0,
  }];
}

function planToReadiness(goal: UserGoal, plan: BriePlan): ExamReadiness {
  const weakTopics = plan.roadmap.filter((node) => node.masteryScore < 50).map((node) => node.topicName);
  const strongTopics = plan.roadmap.filter((node) => node.masteryScore >= 70).map((node) => node.topicName);
  const readiness = Math.round(plan.readiness);
  const examDate = goal.examYear === null ? null : Date.UTC(goal.examYear, goal.examMonth ?? 12, 0, 23, 59, 59);
  const daysUntilExam = examDate === null ? undefined : Math.max(0, Math.ceil((examDate - Date.now()) / 86_400_000));
  return {
    examType: goal.examType, examName: getExamName(goal.examType), overallReadiness: readiness,
    subjectReadiness: [{
      subjectId: goal.subjectId, subjectName: getSubjectName(goal.subjectId), readiness,
      topicsCompleted: strongTopics.length, totalTopics: plan.roadmap.length, weakTopics, strongTopics,
    }],
    predictedScore: { low: readiness, mid: readiness, high: readiness },
    daysUntilExam, recommendedFocus: weakTopics.slice(0, 3),
  };
}

export const useLearningPathStore = create<LearningPathState>()(
  persist(
    (set, get) => ({
      recommendedTopics: [], examReadiness: null, studyPlan: [], learningGoals: [],
      isLoading: false, error: null, lastUpdated: null,

      generateRecommendations: async () => {
        set({ isLoading: true, error: null });
        try {
          const { goal, plan } = await getGuidancePlan();
          set({ recommendedTopics: roadmapToRecommendations(goal, plan.roadmap), isLoading: false, lastUpdated: new Date().toISOString() });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load recommendations', isLoading: false });
        }
      },

      calculateExamReadiness: async (examType) => {
        set({ isLoading: true, error: null });
        try {
          const { goal, plan } = await getGuidancePlan(examType);
          set({ examReadiness: planToReadiness(goal, plan), isLoading: false, lastUpdated: new Date().toISOString() });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load exam readiness', isLoading: false });
        }
      },

      // Backwards-compatible action: maps Brie's `thisWeek`; never creates a second daily schedule.
      generateStudyPlan: async () => {
        set({ isLoading: true, error: null });
        try {
          const { goal, plan } = await getGuidancePlan();
          set({
            recommendedTopics: roadmapToRecommendations(goal, plan.roadmap),
            examReadiness: planToReadiness(goal, plan), studyPlan: roadmapToStudyPlan(goal, plan),
            isLoading: false, lastUpdated: new Date().toISOString(),
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load your study plan', isLoading: false });
        }
      },

      updateGoalProgress: (goalId, progress) => set((state) => ({
        learningGoals: state.learningGoals.map((goal) => goal.id === goalId
          ? { ...goal, progress, completed: progress >= goal.target } : goal),
      })),

      markStudyPlanItemComplete: (itemId) => set((state) => ({
        studyPlan: state.studyPlan.map((item) => item.id === itemId
          ? { ...item, completed: true, topics: item.topics.map((topic) => ({ ...topic, completed: true })) } : item),
      })),

      markTopicComplete: (itemId, topicId) => set((state) => ({
        studyPlan: state.studyPlan.map((item) => {
          if (item.id !== itemId) return item;
          const topics = item.topics.map((topic) => topic.topicId === topicId ? { ...topic, completed: true } : topic);
          return { ...item, topics, completed: topics.every((topic) => topic.completed) };
        }),
      })),

      refreshAll: async () => { await get().generateStudyPlan(); },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-learning-path', version: 2,
      partialize: (state) => ({ learningGoals: state.learningGoals, lastUpdated: state.lastUpdated }),
    },
  ),
);
