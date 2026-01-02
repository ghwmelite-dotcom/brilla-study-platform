import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProgressStore } from './progressStore';

// Types
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationReason =
  | 'weak_area'
  | 'not_started'
  | 'review_needed'
  | 'exam_focus'
  | 'streak_building'
  | 'trending_topic';

export interface RecommendedTopic {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  priority: RecommendationPriority;
  reason: RecommendationReason;
  reasonText: string;
  mastery: number;
  estimatedTime: number; // minutes
  questionCount: number;
  lastAttemptedAt?: string;
  examWeight?: number; // How important for exam (0-100)
}

export interface ExamReadiness {
  examType: string;
  examName: string;
  overallReadiness: number; // 0-100
  subjectReadiness: SubjectReadiness[];
  predictedScore: {
    low: number;
    mid: number;
    high: number;
  };
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
  // Data
  recommendedTopics: RecommendedTopic[];
  examReadiness: ExamReadiness | null;
  studyPlan: StudyPlanItem[];
  learningGoals: LearningGoal[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  generateRecommendations: () => Promise<void>;
  calculateExamReadiness: (examType: string) => Promise<void>;
  generateStudyPlan: (daysCount?: number) => Promise<void>;
  updateGoalProgress: (goalId: string, progress: number) => void;
  markStudyPlanItemComplete: (itemId: string) => void;
  markTopicComplete: (itemId: string, topicId: string) => void;
  refreshAll: () => Promise<void>;

  // Utils
  clearError: () => void;
}

// Subject data (would come from API in production)
const SUBJECTS: Record<string, { name: string; topics: { id: string; name: string; weight: number }[] }> = {
  mathematics: {
    name: 'Mathematics',
    topics: [
      { id: 'algebra', name: 'Algebra', weight: 20 },
      { id: 'geometry', name: 'Geometry', weight: 15 },
      { id: 'trigonometry', name: 'Trigonometry', weight: 15 },
      { id: 'calculus', name: 'Calculus', weight: 20 },
      { id: 'statistics', name: 'Statistics', weight: 15 },
      { id: 'probability', name: 'Probability', weight: 15 },
    ],
  },
  physics: {
    name: 'Physics',
    topics: [
      { id: 'mechanics', name: 'Mechanics', weight: 25 },
      { id: 'waves', name: 'Waves & Optics', weight: 20 },
      { id: 'electricity', name: 'Electricity', weight: 20 },
      { id: 'magnetism', name: 'Magnetism', weight: 15 },
      { id: 'thermodynamics', name: 'Thermodynamics', weight: 10 },
      { id: 'modern_physics', name: 'Modern Physics', weight: 10 },
    ],
  },
  chemistry: {
    name: 'Chemistry',
    topics: [
      { id: 'atomic_structure', name: 'Atomic Structure', weight: 15 },
      { id: 'bonding', name: 'Chemical Bonding', weight: 15 },
      { id: 'organic', name: 'Organic Chemistry', weight: 25 },
      { id: 'reactions', name: 'Chemical Reactions', weight: 20 },
      { id: 'acids_bases', name: 'Acids & Bases', weight: 15 },
      { id: 'equilibrium', name: 'Chemical Equilibrium', weight: 10 },
    ],
  },
  biology: {
    name: 'Biology',
    topics: [
      { id: 'cell_biology', name: 'Cell Biology', weight: 20 },
      { id: 'genetics', name: 'Genetics', weight: 20 },
      { id: 'ecology', name: 'Ecology', weight: 15 },
      { id: 'human_biology', name: 'Human Biology', weight: 20 },
      { id: 'plant_biology', name: 'Plant Biology', weight: 15 },
      { id: 'evolution', name: 'Evolution', weight: 10 },
    ],
  },
  english: {
    name: 'English',
    topics: [
      { id: 'comprehension', name: 'Comprehension', weight: 25 },
      { id: 'grammar', name: 'Grammar', weight: 20 },
      { id: 'essay_writing', name: 'Essay Writing', weight: 25 },
      { id: 'literature', name: 'Literature', weight: 20 },
      { id: 'vocabulary', name: 'Vocabulary', weight: 10 },
    ],
  },
};

// Helper function to get priority based on mastery
const getPriority = (mastery: number, examWeight: number): RecommendationPriority => {
  if (mastery < 30 && examWeight > 15) return 'critical';
  if (mastery < 50) return 'high';
  if (mastery < 70) return 'medium';
  return 'low';
};

// Helper function to get reason text
const getReasonText = (reason: RecommendationReason, mastery: number): string => {
  switch (reason) {
    case 'weak_area':
      return `Only ${mastery}% mastery - needs improvement`;
    case 'not_started':
      return 'You haven\'t started this topic yet';
    case 'review_needed':
      return 'Last practiced over 7 days ago';
    case 'exam_focus':
      return 'High-weight topic for your exam';
    case 'streak_building':
      return 'Keep your learning streak going!';
    case 'trending_topic':
      return 'Popular topic this week';
    default:
      return 'Recommended for you';
  }
};

// Helper to get estimated time based on mastery
const getEstimatedTime = (mastery: number): number => {
  if (mastery === 0) return 30;
  if (mastery < 30) return 25;
  if (mastery < 50) return 20;
  if (mastery < 70) return 15;
  return 10;
};

export const useLearningPathStore = create<LearningPathState>()(
  persist(
    (set, get) => ({
      // Initial state
      recommendedTopics: [],
      examReadiness: null,
      studyPlan: [],
      learningGoals: [],
      isLoading: false,
      error: null,
      lastUpdated: null,

      // Generate personalized recommendations
      generateRecommendations: async () => {
        set({ isLoading: true, error: null });

        try {
          // Get progress data
          const progressStore = useProgressStore.getState();
          const { topicProgress } = progressStore;

          const recommendations: RecommendedTopic[] = [];

          // Process each subject
          Object.entries(SUBJECTS).forEach(([subjectId, subject]) => {
            subject.topics.forEach((topic) => {
              const progress = topicProgress[`${subjectId}_${topic.id}`];
              const mastery = progress?.masteryLevel || 0;
              const lastAttempted = progress?.lastAttemptAt;

              // Determine if this topic needs attention
              let reason: RecommendationReason | null = null;

              if (mastery === 0) {
                reason = 'not_started';
              } else if (mastery < 50) {
                reason = 'weak_area';
              } else if (lastAttempted) {
                const daysSinceAttempt = Math.floor(
                  (Date.now() - new Date(lastAttempted).getTime()) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceAttempt > 7) {
                  reason = 'review_needed';
                }
              }

              // Include topic if it needs attention or is high-weight
              if (reason || topic.weight >= 20) {
                if (!reason && topic.weight >= 20 && mastery < 80) {
                  reason = 'exam_focus';
                }

                if (reason) {
                  recommendations.push({
                    topicId: topic.id,
                    topicName: topic.name,
                    subjectId,
                    subjectName: subject.name,
                    priority: getPriority(mastery, topic.weight),
                    reason,
                    reasonText: getReasonText(reason, mastery),
                    mastery,
                    estimatedTime: getEstimatedTime(mastery),
                    questionCount: Math.max(5, Math.round((100 - mastery) / 10)),
                    lastAttemptedAt: lastAttempted,
                    examWeight: topic.weight,
                  });
                }
              }
            });
          });

          // Sort by priority (critical > high > medium > low), then by mastery (lowest first)
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          recommendations.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.mastery - b.mastery;
          });

          // Take top 10 recommendations
          set({
            recommendedTopics: recommendations.slice(0, 10),
            isLoading: false,
            lastUpdated: new Date().toISOString(),
          });
        } catch (error) {
          set({ error: 'Failed to generate recommendations', isLoading: false });
        }
      },

      // Calculate exam readiness
      calculateExamReadiness: async (examType: string) => {
        set({ isLoading: true, error: null });

        try {
          const progressStore = useProgressStore.getState();
          const { topicProgress } = progressStore;

          const subjectReadiness: SubjectReadiness[] = [];
          let totalReadiness = 0;
          let totalWeight = 0;

          Object.entries(SUBJECTS).forEach(([subjectId, subject]) => {
            let subjectTotal = 0;
            let topicsCompleted = 0;
            const weakTopics: string[] = [];
            const strongTopics: string[] = [];

            subject.topics.forEach((topic) => {
              const progress = topicProgress[`${subjectId}_${topic.id}`];
              const mastery = progress?.masteryLevel || 0;
              const weightedMastery = mastery * (topic.weight / 100);

              subjectTotal += weightedMastery;
              totalWeight += topic.weight;

              if (mastery >= 70) {
                topicsCompleted++;
                if (mastery >= 85) strongTopics.push(topic.name);
              } else if (mastery < 50) {
                weakTopics.push(topic.name);
              }
            });

            const readiness = Math.round(subjectTotal);
            subjectReadiness.push({
              subjectId,
              subjectName: subject.name,
              readiness,
              topicsCompleted,
              totalTopics: subject.topics.length,
              weakTopics,
              strongTopics,
            });

            totalReadiness += readiness;
          });

          const overallReadiness = Math.round(totalReadiness / Object.keys(SUBJECTS).length);

          // Calculate predicted scores based on readiness
          const predictedScore = {
            low: Math.max(0, overallReadiness - 15),
            mid: overallReadiness,
            high: Math.min(100, overallReadiness + 10),
          };

          // Get recommended focus areas (subjects with lowest readiness)
          const recommendedFocus = subjectReadiness
            .sort((a, b) => a.readiness - b.readiness)
            .slice(0, 3)
            .map((s) => s.subjectName);

          set({
            examReadiness: {
              examType,
              examName: examType === 'wassce' ? 'WASSCE' : examType === 'bece' ? 'BECE' : 'NSMQ',
              overallReadiness,
              subjectReadiness,
              predictedScore,
              recommendedFocus,
            },
            isLoading: false,
          });
        } catch (error) {
          set({ error: 'Failed to calculate exam readiness', isLoading: false });
        }
      },

      // Generate study plan
      generateStudyPlan: async (daysCount = 7) => {
        set({ isLoading: true, error: null });

        try {
          const { recommendedTopics } = get();

          // If no recommendations, generate them first
          if (recommendedTopics.length === 0) {
            await get().generateRecommendations();
          }

          const topics = get().recommendedTopics;
          const days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[] =
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

          const today = new Date();
          const studyPlan: StudyPlanItem[] = [];

          for (let i = 0; i < daysCount; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayIndex = date.getDay();
            const dayName = days[(dayIndex + 6) % 7]; // Adjust for Monday start

            // Assign 2-3 topics per day based on priority
            const dayTopics = topics
              .slice(i * 2, i * 2 + 3)
              .map((topic) => ({
                topicId: topic.topicId,
                topicName: topic.topicName,
                subjectId: topic.subjectId,
                estimatedMinutes: topic.estimatedTime,
                completed: false,
                priority: topic.priority,
              }));

            if (dayTopics.length > 0) {
              studyPlan.push({
                id: `plan_${date.toISOString().split('T')[0]}`,
                day: dayName,
                date: date.toISOString().split('T')[0],
                topics: dayTopics,
                completed: false,
                xpTarget: dayTopics.length * 50,
                xpEarned: 0,
              });
            }
          }

          set({
            studyPlan,
            isLoading: false,
          });
        } catch (error) {
          set({ error: 'Failed to generate study plan', isLoading: false });
        }
      },

      // Update goal progress
      updateGoalProgress: (goalId: string, progress: number) => {
        const { learningGoals } = get();
        const updatedGoals = learningGoals.map((goal) =>
          goal.id === goalId
            ? { ...goal, progress, completed: progress >= goal.target }
            : goal
        );
        set({ learningGoals: updatedGoals });
      },

      // Mark study plan item complete
      markStudyPlanItemComplete: (itemId: string) => {
        const { studyPlan } = get();
        const updatedPlan = studyPlan.map((item) =>
          item.id === itemId
            ? {
                ...item,
                completed: true,
                topics: item.topics.map((t) => ({ ...t, completed: true })),
              }
            : item
        );
        set({ studyPlan: updatedPlan });
      },

      // Mark individual topic complete
      markTopicComplete: (itemId: string, topicId: string) => {
        const { studyPlan } = get();
        const updatedPlan = studyPlan.map((item) => {
          if (item.id !== itemId) return item;

          const updatedTopics = item.topics.map((t) =>
            t.topicId === topicId ? { ...t, completed: true } : t
          );
          const allComplete = updatedTopics.every((t) => t.completed);

          return {
            ...item,
            topics: updatedTopics,
            completed: allComplete,
            xpEarned: updatedTopics.filter((t) => t.completed).length * 50,
          };
        });
        set({ studyPlan: updatedPlan });
      },

      // Refresh all data
      refreshAll: async () => {
        await get().generateRecommendations();
        await get().calculateExamReadiness('wassce');
        await get().generateStudyPlan();
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-learning-path',
      version: 1,
      partialize: (state) => ({
        studyPlan: state.studyPlan,
        learningGoals: state.learningGoals,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
