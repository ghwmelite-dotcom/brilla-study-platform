import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { ExamTypeSlug } from '@/types';

// Types for the AI Revision Classroom
export type RevisionSessionType = 'full_revision' | 'topic_review' | 'quick_recap' | 'exam_prep';
export type RevisionSessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type LessonType = 'concept' | 'example' | 'practice' | 'assessment';
export type LessonStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'mastered';
export type CheckpointType = 'quick_check' | 'concept_check' | 'application' | 'exam_style';

export interface RevisionSession {
  id: string;
  visitorId?: string;
  examType: ExamTypeSlug;
  subjectId: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  sessionType: RevisionSessionType;
  status: RevisionSessionStatus;
  progressPercentage: number;
  currentLessonId?: string;
  lessonsCompleted: number;
  totalLessons: number;
  masteryScore: number;
  timeSpentMinutes: number;
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
}

export interface RevisionLesson {
  id: string;
  sessionId: string;
  topicId: string;
  topicName?: string;
  lessonOrder: number;
  title: string;
  description?: string;
  lessonType: LessonType;
  status: LessonStatus;

  // AI Teaching Content
  hookContent?: string;
  explanationContent?: string;
  visualAids?: string[];
  examples?: WorkedExample[];
  keyPoints?: string[];

  // Student Progress
  understandingLevel: number;
  questionsAttempted: number;
  questionsCorrect: number;
  timeSpentSeconds: number;

  startedAt?: string;
  completedAt?: string;
}

export interface WorkedExample {
  title: string;
  problem: string;
  steps: string[];
  solution: string;
  explanation: string;
}

export interface TopicMastery {
  id: string;
  visitorId: string;
  topicId: string;
  topicName?: string;
  examType: ExamTypeSlug;
  masteryLevel: number;
  confidenceLevel: ConfidenceLevel;
  lessonsCompleted: number;
  practiceQuestionsAttempted: number;
  practiceQuestionsCorrect: number;
  revisionCount: number;
  lastRevisedAt?: string;
  nextRevisionDue?: string;
  examBoardTips?: string[];
  commonMistakes?: string[];
  highYieldPoints?: string[];
  improvementPercentage: number;
}

export interface RevisionCheckpoint {
  id: string;
  lessonId: string;
  checkpointType: CheckpointType;
  questionText: string;
  questionType: 'multiple_choice' | 'short_answer' | 'true_false' | 'fill_blank';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface CheckpointResponse {
  id: string;
  checkpointId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
  aiFeedback?: string;
}

export interface RevisionAIMessage {
  id: string;
  lessonId: string;
  interactionType: 'teaching' | 'question' | 'clarification' | 'encouragement' | 'summary';
  aiMessage: string;
  userResponse?: string;
  timestamp: string;
}

// Teaching phases in a lesson
export type TeachingPhase = 'hook' | 'explain' | 'check' | 'practice' | 'confirm' | 'connect';

// AI Teaching State
export interface AITeachingState {
  isTeaching: boolean;
  currentPhase: TeachingPhase;
  currentMessage: string;
  isThinking: boolean;
  awaitingResponse: boolean;
}

// Whiteboard Teaching Types
export type WhiteboardLessonType = 'diagram' | 'step-by-step' | 'problem-solving' | 'concept-map';

export interface WhiteboardDrawCommand {
  type: 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'path' | 'polygon' | 'group';
  id: string;
  props: Record<string, any>;
}

export interface WhiteboardStep {
  stepNumber: number;
  explanation: string;
  voiceOver?: string;
  duration: number;
  commands: WhiteboardDrawCommand[];
  highlights?: string[];
  clearPrevious?: boolean;
}

interface RevisionClassroomState {
  // Sessions
  currentSession: RevisionSession | null;
  pastSessions: RevisionSession[];

  // Current Lesson
  currentLesson: RevisionLesson | null;
  lessonPlan: RevisionLesson[];

  // Topic Mastery
  topicMasteries: Record<string, TopicMastery>;

  // Checkpoints & Responses
  currentCheckpoints: RevisionCheckpoint[];
  checkpointResponses: CheckpointResponse[];

  // AI Teaching
  aiTeachingState: AITeachingState;
  aiMessages: RevisionAIMessage[];

  // AI Whiteboard Teaching (progressive per-step protocol)
  whiteboardOutline: string[] | null;
  whiteboardSteps: WhiteboardStep[];
  whiteboardTotalSteps: number;
  whiteboardLessonType: WhiteboardLessonType | null;
  isWhiteboardLoading: boolean;
  whiteboardStepLoading: boolean;
  // Distinct per-step fetch failure — drives the component's Retry button.
  whiteboardStepError: string | null;
  whiteboardMode: boolean;
  // Guard against duplicate/in-flight per-step fetches (values are step
  // indices). Mutated in place — not reactive state.
  whiteboardStepsInFlight: Set<number>;
  // Step indices that already used their one automatic retry. Mutated in
  // place — not reactive state.
  whiteboardStepsAutoRetried: Set<number>;

  // Entitlement / usage-limit state (session-only; not persisted)
  whiteboardLocked: boolean;
  whiteboardFallback: boolean;
  aiLimitReached: boolean;
  freeAiRemaining: number | null; // -1 = unlimited; null = unknown

  // Tutor Integration
  tutorPresence: {
    isConnected: boolean;
    tutorId?: string;
    tutorName?: string;
    tutorAvatarUrl?: string;
    mode: 'observe' | 'co_teach' | 'takeover' | null;
    joinedAt?: string;
  } | null;

  struggleSignals: {
    consecutiveWrongAnswers: number;
    timeStuckSeconds: number;
    repeatedQuestionsCount: number;
    clarificationRequestsCount: number;
    struggleScore: number;
    lastActivityAt: string;
  };

  handoffState: {
    status: 'none' | 'suggested' | 'requested' | 'pending' | 'connected' | 'declined';
    reason?: string;
    suggestedAt?: string;
    requestedAt?: string;
  };

  aiSessionId: string | null; // ID for tutor observation system

  // Statistics
  stats: {
    totalTimeMinutes: number;
    sessionsCompleted: number;
    topicsMastered: number;
    averageMastery: number;
    achievementCount: number;
    totalXP: number;
  } | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions - Sessions
  startRevisionSession: (
    visitorId: string,
    examType: ExamTypeSlug,
    subjectId: string,
    subjectName: string,
    sessionType?: RevisionSessionType,
    topicId?: string,
    topicName?: string
  ) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  completeSession: () => Promise<void>;
  abandonSession: () => Promise<void>;

  // Actions - Lessons
  startLesson: (lessonId: string) => Promise<void>;
  completeLesson: () => Promise<void>;
  skipLesson: () => Promise<void>;
  nextLesson: () => Promise<void>;

  // Actions - AI Teaching
  requestAITeaching: (phase: TeachingPhase) => Promise<void>;
  respondToAI: (response: string) => Promise<void>;
  askQuestion: (question: string) => Promise<void>;
  requestClarification: (topic: string) => Promise<void>;

  // Actions - AI Whiteboard Teaching
  requestWhiteboardTeaching: (lessonType: WhiteboardLessonType) => Promise<void>;
  fetchNextWhiteboardStep: (nextIndex: number) => Promise<void>;
  toggleWhiteboardMode: () => void;
  clearWhiteboardContent: () => void;

  // Actions - Checkpoints
  answerCheckpoint: (checkpointId: string, answer: string, timeTaken?: number) => Promise<CheckpointResponse>;
  generateMorePractice: () => Promise<void>;

  // Actions - Topic Mastery
  updateTopicMastery: (topicId: string, examType: string, updates: Partial<TopicMastery>) => Promise<void>;
  fetchTopicMastery: (examType?: string, subjectId?: string) => Promise<void>;
  fetchDueTopics: (examType?: string) => Promise<TopicMastery[]>;

  // Actions - Tutor Integration
  updateStruggleSignals: (updates: Partial<RevisionClassroomState['struggleSignals']>) => void;
  requestHumanTutor: (reason?: string) => Promise<void>;
  acceptHandoffSuggestion: () => Promise<void>;
  declineHandoffSuggestion: () => void;
  dismissTutor: () => Promise<void>;

  // Actions - Utility
  fetchPastSessions: (status?: string, examType?: string) => Promise<void>;
  fetchStats: (examType?: string) => Promise<void>;
  clearError: () => void;
  resetClassroom: () => void;
}

// Helper to generate unique IDs (for local messages before API sync)
const generateLocalId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Generate AI teaching content based on phase and topic
async function generateAITeachingContent(
  lesson: RevisionLesson,
  phase: TeachingPhase,
  examType: ExamTypeSlug,
  userName?: string
): Promise<string> {
  const topicName = lesson.topicName || lesson.title;
  const greeting = userName ? `${userName}, ` : '';

  // In a production system, this would call an AI API
  // For now, we generate contextual content based on phase
  switch (phase) {
    case 'hook':
      return `${greeting}let me share something fascinating about ${topicName}!

Have you ever wondered why this topic is so important? In your ${examType.toUpperCase()} exam, ${topicName} questions can appear in multiple forms and are worth significant marks.

This topic connects to real-world applications that you encounter daily. Understanding it deeply will not only help you ace your exams but also give you practical knowledge you can use.

Ready to dive in and master this topic? Let's make sure you understand it so well that exam questions feel easy!`;

    case 'explain':
      return `Now let me explain ${topicName} step by step.

**Key Concepts:**
This topic forms the foundation for many exam questions. The core idea is to understand the underlying principles and how to apply them systematically.

**Important Points to Remember:**
1. Understand the definitions and key terms
2. Know the formulas and when to apply them
3. Practice identifying which method to use
4. Check your work using different approaches
5. Connect to related topics for deeper understanding

Take a moment to read through this carefully. When you're ready, let me know and I'll check your understanding with a quick question.`;

    case 'check':
      return `${greeting}let's check your understanding with a quick question.

Don't worry if you're not sure - this is just to see what you've grasped so far. I'll explain anything you find tricky.

Think about the key concepts we just covered and how they apply here. Ready? Share your thoughts!`;

    case 'practice':
      return `Excellent progress! Now let's put your knowledge into practice.

**Practice Challenge:**
Try applying what you've learned to solve a problem. Think about which concepts apply and show your working clearly.

**Remember:**
- Read the question carefully
- Identify what's being asked
- Show all your working
- Check your units
- Review your answer

Take your time to work through this. When you're ready, share your answer and I'll walk through the solution with you.`;

    case 'confirm':
      return `${greeting}you're making great progress! Let me summarize what we've covered:

**${topicName} - Key Takeaways:**
1. We covered the core concepts and definitions
2. You learned the key formulas and methods
3. You practiced applying these to problems
4. You now understand common exam question styles

**Exam Tips for ${examType.toUpperCase()}:**
- This topic typically appears in multiple question formats
- Show all working to earn method marks
- Common mistakes: rushing calculations, not reading questions carefully
- Practice past paper questions for best preparation

Do you have any questions before we move on? I'm here to clarify anything.`;

    case 'connect':
      return `Before we finish ${topicName}, let's see how it connects to other topics:

**Connections:**
- This topic builds on foundational concepts you've already learned
- It's essential for understanding more advanced topics coming up
- Exam questions often combine this with related areas

**What's Next:**
Understanding these connections will help you tackle complex exam questions that combine multiple concepts.

Well done on completing this revision! You're one step closer to exam success. Ready to continue to the next topic?`;

    default:
      return `Let's continue with ${topicName}...`;
  }
}

// The API returns raw D1 rows (snake_case), while the UI works with the
// camelCase RevisionSession shape. Normalize at the store boundary so every
// ingress point (create/resume/list) yields the same shape; the original
// fields are kept for code that still reads snake_case fallbacks.
const mapSession = (raw: any): RevisionSession => ({
  ...raw,
  visitorId: raw.visitorId ?? raw.user_id,
  examType: raw.examType ?? raw.exam_type,
  subjectId: raw.subjectId ?? raw.subject_id,
  subjectName: raw.subjectName ?? raw.subject_name,
  topicId: raw.topicId ?? raw.topic_id ?? undefined,
  topicName: raw.topicName ?? raw.topic_name ?? undefined,
  sessionType: raw.sessionType ?? raw.session_type,
  progressPercentage: raw.progressPercentage ?? raw.progress_percentage ?? 0,
  currentLessonId: raw.currentLessonId ?? raw.current_lesson_id ?? undefined,
  lessonsCompleted: raw.lessonsCompleted ?? raw.lessons_completed ?? 0,
  totalLessons: raw.totalLessons ?? raw.total_lessons ?? 0,
  masteryScore: raw.masteryScore ?? raw.mastery_score ?? 0,
  timeSpentMinutes: raw.timeSpentMinutes ?? raw.time_spent_minutes ?? 0,
  startedAt: raw.startedAt ?? raw.started_at,
  lastActivityAt: raw.lastActivityAt ?? raw.last_activity_at,
  completedAt: raw.completedAt ?? raw.completed_at ?? undefined,
});

export const useRevisionClassroomStore = create<RevisionClassroomState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      pastSessions: [],
      currentLesson: null,
      lessonPlan: [],
      topicMasteries: {},
      currentCheckpoints: [],
      checkpointResponses: [],
      aiTeachingState: {
        isTeaching: false,
        currentPhase: 'hook',
        currentMessage: '',
        isThinking: false,
        awaitingResponse: false,
      },
      aiMessages: [],
      whiteboardOutline: null,
      whiteboardSteps: [],
      whiteboardTotalSteps: 0,
      whiteboardLessonType: null,
      isWhiteboardLoading: false,
      whiteboardStepLoading: false,
      whiteboardStepError: null,
      whiteboardMode: false,
      whiteboardStepsInFlight: new Set<number>(),
      whiteboardStepsAutoRetried: new Set<number>(),
      whiteboardLocked: false,
      whiteboardFallback: false,
      aiLimitReached: false,
      freeAiRemaining: null,
      tutorPresence: null,
      struggleSignals: {
        consecutiveWrongAnswers: 0,
        timeStuckSeconds: 0,
        repeatedQuestionsCount: 0,
        clarificationRequestsCount: 0,
        struggleScore: 0,
        lastActivityAt: new Date().toISOString(),
      },
      handoffState: {
        status: 'none',
      },
      aiSessionId: null,
      stats: null,
      isLoading: false,
      error: null,

      // =============================================
      // SESSION ACTIONS
      // =============================================

      startRevisionSession: async (
        visitorId,
        examType,
        subjectId,
        subjectName,
        sessionType = 'full_revision',
        topicId,
        _topicName
      ) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post<{ session: RevisionSession; lessons: RevisionLesson[] }>(
            '/revision-classroom/sessions',
            {
              examType,
              subjectId,
              sessionType,
              topicId,
            }
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to create session');
          }

          const { session, lessons } = response.data;

          // Add subject name to session for display
          const sessionWithName = {
            ...mapSession(session),
            subjectName,
            visitorId,
          };

          // Add topic names to lessons
          const lessonsWithNames = lessons.map((l: any) => ({
            ...l,
            topicName: l.topic_name || l.title,
          }));

          set({
            currentSession: sessionWithName,
            lessonPlan: lessonsWithNames,
            currentLesson: lessonsWithNames[0] || null,
            isLoading: false,
            aiMessages: [],
            checkpointResponses: [],
          });

          // Start the first lesson automatically
          if (lessonsWithNames[0]) {
            await get().startLesson(lessonsWithNames[0].id);
          }
        } catch (error) {
          console.error('Error starting revision session:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to start revision session';
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      resumeSession: async (sessionId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get<{ session: RevisionSession; lessons: RevisionLesson[] }>(
            `/revision-classroom/sessions/${sessionId}`
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Session not found');
          }

          const { session, lessons } = response.data;

          // Update session status to active
          await api.patch(`/revision-classroom/sessions/${sessionId}`, {
            status: 'active',
          });

          const mappedSession = mapSession(session);

          const lessonsWithNames = lessons.map((l: any) => ({
            ...l,
            topicName: l.topic_name || l.title,
          }));

          const currentLesson = mappedSession.currentLessonId
            ? lessonsWithNames.find((l: RevisionLesson) => l.id === mappedSession.currentLessonId) || lessonsWithNames[0]
            : lessonsWithNames[0];

          set({
            currentSession: { ...mappedSession, status: 'active' },
            lessonPlan: lessonsWithNames,
            currentLesson,
            isLoading: false,
          });

          // Resume AI teaching if there's a current lesson
          if (currentLesson) {
            await get().requestAITeaching('hook');
          }
        } catch (error) {
          console.error('Error resuming session:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to resume session',
            isLoading: false,
          });
        }
      },

      pauseSession: async () => {
        const { currentSession, pastSessions } = get();
        if (!currentSession) return;

        try {
          await api.patch(`/revision-classroom/sessions/${currentSession.id}`, {
            status: 'paused',
          });

          const pausedSession = { ...currentSession, status: 'paused' as const };

          set({
            pastSessions: [...pastSessions.filter(s => s.id !== currentSession.id), pausedSession],
            currentSession: null,
            currentLesson: null,
            aiTeachingState: {
              isTeaching: false,
              currentPhase: 'hook',
              currentMessage: '',
              isThinking: false,
              awaitingResponse: false,
            },
            aiMessages: [],
          });
        } catch (error) {
          console.error('Error pausing session:', error);
        }
      },

      completeSession: async () => {
        const { currentSession, pastSessions, lessonPlan } = get();
        if (!currentSession) return;

        try {
          await api.patch(`/revision-classroom/sessions/${currentSession.id}`, {
            status: 'completed',
            progressPercentage: 100,
          });

          const completedSession = {
            ...currentSession,
            status: 'completed' as const,
            progressPercentage: 100,
            lessonsCompleted: lessonPlan.length,
            completedAt: new Date().toISOString(),
          };

          set({
            pastSessions: [...pastSessions.filter(s => s.id !== currentSession.id), completedSession],
            currentSession: null,
            currentLesson: null,
            lessonPlan: [],
            aiTeachingState: {
              isTeaching: false,
              currentPhase: 'hook',
              currentMessage: '',
              isThinking: false,
              awaitingResponse: false,
            },
            aiMessages: [],
          });
        } catch (error) {
          console.error('Error completing session:', error);
        }
      },

      abandonSession: async () => {
        const { currentSession, pastSessions } = get();
        if (!currentSession) return;

        try {
          await api.patch(`/revision-classroom/sessions/${currentSession.id}`, {
            status: 'abandoned',
          });

          const abandonedSession = { ...currentSession, status: 'abandoned' as const };

          set({
            pastSessions: [...pastSessions.filter(s => s.id !== currentSession.id), abandonedSession],
            currentSession: null,
            currentLesson: null,
            lessonPlan: [],
            aiTeachingState: {
              isTeaching: false,
              currentPhase: 'hook',
              currentMessage: '',
              isThinking: false,
              awaitingResponse: false,
            },
            aiMessages: [],
          });
        } catch (error) {
          console.error('Error abandoning session:', error);
        }
      },

      // =============================================
      // LESSON ACTIONS
      // =============================================

      startLesson: async (lessonId) => {
        set({ isLoading: true });

        try {
          const { lessonPlan, currentSession } = get();
          const lesson = lessonPlan.find(l => l.id === lessonId);

          if (!lesson || !currentSession) {
            set({ error: 'Lesson not found', isLoading: false });
            return;
          }

          // Update lesson status on server
          await api.patch(`/revision-classroom/lessons/${lessonId}`, {
            status: 'in_progress',
          });

          const updatedLesson = {
            ...lesson,
            status: 'in_progress' as const,
            startedAt: new Date().toISOString(),
          };

          const updatedPlan = lessonPlan.map(l =>
            l.id === lessonId ? updatedLesson : l
          );

          // Update session's current lesson
          await api.patch(`/revision-classroom/sessions/${currentSession.id}`, {
            currentLessonId: lessonId,
          });

          set({
            currentLesson: updatedLesson,
            lessonPlan: updatedPlan,
            currentSession: { ...currentSession, currentLessonId: lessonId },
            isLoading: false,
            aiMessages: [], // Clear messages for new lesson
          });

          // Start AI teaching with hook phase
          await get().requestAITeaching('hook');
        } catch (error) {
          console.error('Error starting lesson:', error);
          set({ error: 'Failed to start lesson', isLoading: false });
        }
      },

      completeLesson: async () => {
        const { currentLesson, lessonPlan, currentSession } = get();
        if (!currentLesson || !currentSession) return;

        try {
          // Update lesson status on server
          await api.patch(`/revision-classroom/lessons/${currentLesson.id}`, {
            status: 'completed',
          });

          const updatedLesson = {
            ...currentLesson,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
          };

          const updatedPlan = lessonPlan.map(l =>
            l.id === currentLesson.id ? updatedLesson : l
          );

          const completedCount = updatedPlan.filter(l => l.status === 'completed').length;
          const progress = Math.round((completedCount / updatedPlan.length) * 100);

          // Update topic mastery
          if (currentLesson.topicId) {
            await get().updateTopicMastery(currentLesson.topicId, currentSession.examType, {
              lessonsCompleted: 1,
              masteryLevel: Math.min(100, progress + 10),
            });
          }

          set({
            currentLesson: null,
            lessonPlan: updatedPlan,
            currentSession: {
              ...currentSession,
              lessonsCompleted: completedCount,
              progressPercentage: progress,
            },
          });
        } catch (error) {
          console.error('Error completing lesson:', error);
        }
      },

      skipLesson: async () => {
        const { currentLesson, lessonPlan } = get();
        if (!currentLesson) return;

        try {
          await api.patch(`/revision-classroom/lessons/${currentLesson.id}`, {
            status: 'skipped',
          });

          const updatedPlan = lessonPlan.map(l =>
            l.id === currentLesson.id ? { ...l, status: 'skipped' as const } : l
          );

          set({
            currentLesson: null,
            lessonPlan: updatedPlan,
          });

          // Move to next lesson
          await get().nextLesson();
        } catch (error) {
          console.error('Error skipping lesson:', error);
        }
      },

      nextLesson: async () => {
        const { lessonPlan, currentLesson } = get();

        if (currentLesson) {
          const currentIndex = lessonPlan.findIndex(l => l.id === currentLesson.id);
          const nextLesson = lessonPlan[currentIndex + 1];

          if (nextLesson) {
            await get().startLesson(nextLesson.id);
          } else {
            // No more lessons - complete the session
            await get().completeSession();
          }
        }
      },

      // =============================================
      // AI TEACHING ACTIONS
      // =============================================

      requestAITeaching: async (phase) => {
        const { currentLesson, currentSession, aiMessages } = get();
        if (!currentLesson || !currentSession) return;

        set({
          aiTeachingState: {
            isTeaching: true,
            currentPhase: phase,
            currentMessage: '',
            isThinking: true,
            awaitingResponse: false,
          },
        });

        try {
          // Build previous messages context for AI
          const previousMessages = aiMessages.slice(-6).map(msg => ({
            role: msg.userResponse ? 'user' : 'assistant',
            content: msg.userResponse || msg.aiMessage,
          })).filter(msg => msg.content);

          // Call the AI teaching API endpoint
          const response = await api.post<{
            content: string;
            phase: string;
            interactionId: string;
            context: { topicName: string; subjectName: string; examType: string };
          }>(`/revision-classroom/lessons/${currentLesson.id}/teach`, {
            phase,
            previousMessages,
          });

          if (!response.success || !response.data) {
            if ((response as { aiLimitReached?: boolean }).aiLimitReached) {
              set({
                aiLimitReached: true,
                freeAiRemaining: 0,
                aiTeachingState: { ...get().aiTeachingState, isThinking: false, isTeaching: false },
              });
              return;
            }
            throw new Error(response.error || 'Failed to get AI response');
          }

          const content = response.data.content;

          const remainingTeach = (response.data as { remainingFreeToday?: number }).remainingFreeToday;
          if (remainingTeach !== undefined) set({ freeAiRemaining: remainingTeach });

          const message: RevisionAIMessage = {
            id: response.data.interactionId || generateLocalId('msg'),
            lessonId: currentLesson.id,
            interactionType: 'teaching',
            aiMessage: content,
            timestamp: new Date().toISOString(),
          };

          set(state => ({
            aiTeachingState: {
              ...state.aiTeachingState,
              currentMessage: content,
              isThinking: false,
              awaitingResponse: phase === 'check' || phase === 'practice',
            },
            aiMessages: [...state.aiMessages, message],
          }));
        } catch (error) {
          console.error('Error generating AI teaching:', error);

          // Fallback to local generation if API fails
          const content = await generateAITeachingContent(
            currentLesson,
            phase,
            currentSession.examType
          );

          const message: RevisionAIMessage = {
            id: generateLocalId('msg'),
            lessonId: currentLesson.id,
            interactionType: 'teaching',
            aiMessage: content,
            timestamp: new Date().toISOString(),
          };

          set(state => ({
            aiTeachingState: {
              ...state.aiTeachingState,
              currentMessage: content,
              isThinking: false,
              awaitingResponse: phase === 'check' || phase === 'practice',
            },
            aiMessages: [...state.aiMessages, message],
            error: undefined, // Clear error since we recovered with fallback
          }));
        }
      },

      respondToAI: async (response) => {
        const { currentLesson, aiTeachingState, currentSession } = get();
        if (!currentLesson || !currentSession) return;

        // Add user response to messages
        const userMessage: RevisionAIMessage = {
          id: generateLocalId('msg'),
          lessonId: currentLesson.id,
          interactionType: 'question',
          aiMessage: '',
          userResponse: response,
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          aiMessages: [...state.aiMessages, userMessage],
          aiTeachingState: {
            ...state.aiTeachingState,
            isThinking: true,
            awaitingResponse: false,
          },
        }));

        // Record interaction
        await api.post(`/revision-classroom/lessons/${currentLesson.id}/interactions`, {
          interactionType: 'question',
          aiMessage: '',
          userResponse: response,
        });

        // Determine next phase
        const { currentPhase } = aiTeachingState;
        let nextPhase: TeachingPhase;

        switch (currentPhase) {
          case 'hook':
            nextPhase = 'explain';
            break;
          case 'explain':
            nextPhase = 'check';
            break;
          case 'check':
            nextPhase = 'practice';
            break;
          case 'practice':
            nextPhase = 'confirm';
            break;
          case 'confirm':
            nextPhase = 'connect';
            break;
          case 'connect':
            // Lesson complete
            await get().completeLesson();
            await get().nextLesson();
            return;
          default:
            nextPhase = 'explain';
        }

        // Move to next phase
        await get().requestAITeaching(nextPhase);
      },

      askQuestion: async (question) => {
        const { currentLesson, currentSession, aiMessages } = get();
        if (!currentLesson || !currentSession) return;

        // Add user's question to messages immediately
        const userMessage: RevisionAIMessage = {
          id: generateLocalId('msg'),
          lessonId: currentLesson.id,
          interactionType: 'question',
          aiMessage: '',
          userResponse: question,
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          aiMessages: [...state.aiMessages, userMessage],
          aiTeachingState: {
            ...state.aiTeachingState,
            isThinking: true,
          },
        }));

        try {
          // Build previous messages context
          const previousMessages = aiMessages.slice(-6).map(msg => ({
            role: msg.userResponse ? 'user' : 'assistant',
            content: msg.userResponse || msg.aiMessage,
          })).filter(msg => msg.content);

          // Call the AI ask endpoint
          const apiResponse = await api.post<{
            answer: string;
            interactionId?: string;
          }>(`/revision-classroom/lessons/${currentLesson.id}/ask`, {
            question,
            previousMessages,
          });

          if (!apiResponse.success || !apiResponse.data) {
            if ((apiResponse as { aiLimitReached?: boolean }).aiLimitReached) {
              set({
                aiLimitReached: true,
                freeAiRemaining: 0,
                aiTeachingState: { ...get().aiTeachingState, isThinking: false, isTeaching: false },
              });
              return;
            }
            throw new Error(apiResponse.error || 'Failed to get AI response');
          }

          const answer = apiResponse.data.answer;

          const remainingAsk = (apiResponse.data as { remainingFreeToday?: number }).remainingFreeToday;
          if (remainingAsk !== undefined) set({ freeAiRemaining: remainingAsk });

          const aiMessage: RevisionAIMessage = {
            id: apiResponse.data.interactionId || generateLocalId('msg'),
            lessonId: currentLesson.id,
            interactionType: 'clarification',
            aiMessage: answer,
            timestamp: new Date().toISOString(),
          };

          set(state => ({
            aiMessages: [...state.aiMessages, aiMessage],
            aiTeachingState: {
              ...state.aiTeachingState,
              currentMessage: answer,
              isThinking: false,
            },
          }));
        } catch (error) {
          console.error('Error asking question:', error);

          // Fallback response
          const fallbackAnswer = `Great question about "${question}"! Let me help you understand this.

${question.toLowerCase().includes('why') ? 'The reason relates to the core principles of this topic...' : 'Here\'s how it works...'}

Understanding this is important because it helps you see how ${currentLesson.topicName || currentLesson.title} connects to exam questions.

Does this help? Feel free to ask more questions!`;

          const fallbackMessage: RevisionAIMessage = {
            id: generateLocalId('msg'),
            lessonId: currentLesson.id,
            interactionType: 'clarification',
            aiMessage: fallbackAnswer,
            timestamp: new Date().toISOString(),
          };

          set(state => ({
            aiMessages: [...state.aiMessages, fallbackMessage],
            aiTeachingState: {
              ...state.aiTeachingState,
              currentMessage: fallbackAnswer,
              isThinking: false,
            },
          }));
        }
      },

      requestClarification: async (topic) => {
        await get().askQuestion(`Can you explain ${topic} in more detail?`);
      },

      // =============================================
      // AI WHITEBOARD TEACHING ACTIONS
      // =============================================

      requestWhiteboardTeaching: async (lessonType) => {
        const { currentLesson, currentSession } = get();
        if (!currentLesson || !currentSession) return;

        get().whiteboardStepsInFlight.clear();
        get().whiteboardStepsAutoRetried.clear();
        set({
          isWhiteboardLoading: true,
          whiteboardMode: true,
          whiteboardOutline: null,
          whiteboardSteps: [],
          whiteboardTotalSteps: 0,
          whiteboardLessonType: lessonType,
          whiteboardStepLoading: false,
          whiteboardStepError: null,
        });

        try {
          const response = await api.post<{
            outline: string[];
            totalSteps: number;
            step: WhiteboardStep;
            stepIndex: number;
            fallback?: boolean;
            cached?: boolean;
          }>(`/revision-classroom/lessons/${currentLesson.id}/whiteboard-teach`, {
            lessonType,
          });

          if (!response.success || !response.data) {
            if ((response as { upgradeRequired?: boolean }).upgradeRequired) {
              set({ whiteboardLocked: true, isWhiteboardLoading: false });
              return;
            }
            throw new Error(response.error || 'Failed to generate whiteboard content');
          }

          const data = response.data;
          set({
            whiteboardOutline: data.outline,
            whiteboardSteps: [data.step],
            whiteboardTotalSteps: data.totalSteps,
            whiteboardFallback: data.fallback === true,
            isWhiteboardLoading: false,
          });
        } catch (error) {
          console.error('Error generating whiteboard content:', error);
          set({
            isWhiteboardLoading: false,
            error: error instanceof Error ? error.message : 'Failed to generate whiteboard content',
          });
        }
      },

      fetchNextWhiteboardStep: async (nextIndex) => {
        const {
          currentLesson,
          whiteboardOutline,
          whiteboardSteps,
          whiteboardLessonType,
          whiteboardStepsInFlight,
        } = get();
        if (!currentLesson || !whiteboardOutline || !whiteboardLessonType) return;
        if (nextIndex < 0 || nextIndex >= whiteboardOutline.length) return;
        // Already have it, or already fetching it.
        if (whiteboardSteps[nextIndex] || whiteboardStepsInFlight.has(nextIndex)) return;

        whiteboardStepsInFlight.add(nextIndex);
        set({ whiteboardStepLoading: true, whiteboardStepError: null });
        const lessonId = currentLesson.id;
        const outlineSnapshot = whiteboardOutline;

        try {
          const response = await api.post<{
            step: WhiteboardStep;
            stepIndex: number;
            totalSteps: number;
            fallback?: boolean;
            cached?: boolean;
          }>(`/revision-classroom/lessons/${lessonId}/whiteboard-teach`, {
            lessonType: whiteboardLessonType,
            stepIndex: nextIndex,
            outline: whiteboardOutline,
          });

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to generate whiteboard step');
          }

          // Discard if the user restarted the whiteboard (new outline) or
          // changed lessons while this step was generating.
          if (get().currentLesson?.id !== lessonId || get().whiteboardOutline !== outlineSnapshot) return;

          const data = response.data;
          set(state => {
            const steps = [...state.whiteboardSteps];
            steps[data.stepIndex] = data.step;
            return {
              whiteboardSteps: steps,
              whiteboardTotalSteps: data.totalSteps || state.whiteboardTotalSteps,
              whiteboardStepError: null,
            };
          });
        } catch (error) {
          console.error('Error generating whiteboard step:', error);
          const message = error instanceof Error ? error.message : 'Failed to generate whiteboard step';
          set({ error: message, whiteboardStepError: message });

          // One bounded automatic retry — guarded so it only fires if the
          // step is still needed and this outline/lesson is still current.
          // If the retry also fails, the component's Retry button is the
          // recovery path; no further auto-retries are scheduled.
          if (!get().whiteboardStepsAutoRetried.has(nextIndex)) {
            get().whiteboardStepsAutoRetried.add(nextIndex);
            setTimeout(() => {
              const s = get();
              if (
                s.currentLesson?.id === lessonId &&
                s.whiteboardOutline === outlineSnapshot &&
                !s.whiteboardSteps[nextIndex] &&
                !s.whiteboardStepsInFlight.has(nextIndex)
              ) {
                void s.fetchNextWhiteboardStep(nextIndex);
              }
            }, 3000);
          }
        } finally {
          get().whiteboardStepsInFlight.delete(nextIndex);
          if (get().whiteboardStepsInFlight.size === 0) {
            set({ whiteboardStepLoading: false });
          }
        }
      },

      toggleWhiteboardMode: () => {
        set(state => ({ whiteboardMode: !state.whiteboardMode }));
      },

      clearWhiteboardContent: () => {
        get().whiteboardStepsInFlight.clear();
        get().whiteboardStepsAutoRetried.clear();
        set({
          whiteboardOutline: null,
          whiteboardSteps: [],
          whiteboardTotalSteps: 0,
          whiteboardLessonType: null,
          whiteboardStepLoading: false,
          whiteboardStepError: null,
          whiteboardMode: false,
        });
      },

      // =============================================
      // TUTOR INTEGRATION ACTIONS
      // =============================================

      updateStruggleSignals: (updates) => {
        const { struggleSignals } = get();

        // Calculate struggle score based on weighted signals
        const updatedSignals = { ...struggleSignals, ...updates, lastActivityAt: new Date().toISOString() };

        const wrongAnswerScore = Math.min(updatedSignals.consecutiveWrongAnswers * 25, 100) * 0.25;
        const timeStuckScore = Math.min(updatedSignals.timeStuckSeconds / 3, 100) * 0.25;
        const repeatedScore = Math.min(updatedSignals.repeatedQuestionsCount * 20, 100) * 0.20;
        const clarificationScore = Math.min(updatedSignals.clarificationRequestsCount * 25, 100) * 0.30;

        const struggleScore = wrongAnswerScore + timeStuckScore + repeatedScore + clarificationScore;
        updatedSignals.struggleScore = Math.round(struggleScore);

        // Auto-suggest handoff if struggle score exceeds threshold
        const { handoffState, aiSessionId } = get();
        if (struggleScore >= 60 && handoffState.status === 'none') {
          set({
            struggleSignals: updatedSignals,
            handoffState: {
              status: 'suggested',
              suggestedAt: new Date().toISOString(),
            },
          });

          // Notify API about high struggle (for tutor observation dashboard)
          if (aiSessionId) {
            api.post(`/tutor-classroom/ai-sessions/${aiSessionId}/struggle-update`, {
              struggleScore: updatedSignals.struggleScore,
              signals: updatedSignals,
            }).catch(console.error);
          }
        } else {
          set({ struggleSignals: updatedSignals });
        }
      },

      requestHumanTutor: async (reason) => {
        const { aiSessionId, currentSession } = get();
        if (!aiSessionId && !currentSession) return;

        try {
          await api.post('/tutor-classroom/student/request-handoff', {
            aiSessionId,
            reason,
          });

          set({
            handoffState: {
              status: 'requested',
              reason,
              requestedAt: new Date().toISOString(),
            },
          });
        } catch (error: any) {
          console.error('Failed to request tutor:', error);
          set({ error: error.message || 'Failed to request tutor' });
        }
      },

      acceptHandoffSuggestion: async () => {
        const { aiSessionId } = get();
        if (!aiSessionId) return;

        try {
          await api.post('/tutor-classroom/student/accept-handoff-suggestion', {
            aiSessionId,
          });

          set({
            handoffState: {
              status: 'pending',
              requestedAt: new Date().toISOString(),
            },
          });
        } catch (error: any) {
          console.error('Failed to accept handoff:', error);
        }
      },

      declineHandoffSuggestion: () => {
        set({
          handoffState: {
            status: 'none',
          },
        });
      },

      dismissTutor: async () => {
        const { aiSessionId } = get();
        if (!aiSessionId) return;

        try {
          await api.post('/tutor-classroom/student/dismiss-tutor', { aiSessionId });

          set({
            tutorPresence: null,
            handoffState: { status: 'none' },
          });
        } catch (error: any) {
          console.error('Failed to dismiss tutor:', error);
        }
      },

      // =============================================
      // CHECKPOINT ACTIONS
      // =============================================

      answerCheckpoint: async (checkpointId, answer, timeTaken = 30) => {
        try {
          const response = await api.post<{
            responseId: string;
            isCorrect: boolean;
            correctAnswer: string;
            explanation: string;
            aiFeedback: string;
            points: number;
          }>(`/revision-classroom/checkpoints/${checkpointId}/respond`, {
            userAnswer: answer,
            timeTakenSeconds: timeTaken,
          });

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to submit answer');
          }

          const checkpointResponse: CheckpointResponse = {
            id: response.data.responseId,
            checkpointId,
            userAnswer: answer,
            isCorrect: response.data.isCorrect,
            timeTakenSeconds: timeTaken,
            aiFeedback: response.data.aiFeedback,
          };

          set(state => ({
            checkpointResponses: [...state.checkpointResponses, checkpointResponse],
            currentLesson: state.currentLesson
              ? {
                  ...state.currentLesson,
                  questionsAttempted: state.currentLesson.questionsAttempted + 1,
                  questionsCorrect: state.currentLesson.questionsCorrect + (response.data!.isCorrect ? 1 : 0),
                }
              : null,
          }));

          return checkpointResponse;
        } catch (error) {
          console.error('Error answering checkpoint:', error);
          // Return a fallback response
          return {
            id: generateLocalId('response'),
            checkpointId,
            userAnswer: answer,
            isCorrect: false,
            timeTakenSeconds: timeTaken,
            aiFeedback: 'Unable to validate answer. Please try again.',
          };
        }
      },

      generateMorePractice: async () => {
        // Would call API to generate more checkpoints
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({ isLoading: false });
      },

      // =============================================
      // TOPIC MASTERY ACTIONS
      // =============================================

      updateTopicMastery: async (topicId, examType, updates) => {
        try {
          const response = await api.post<{ mastery: TopicMastery }>('/revision-classroom/mastery', {
            topicId,
            examType,
            ...updates,
          });

          if (response.success && response.data) {
            set(state => ({
              topicMasteries: {
                ...state.topicMasteries,
                [topicId]: response.data!.mastery,
              },
            }));
          }
        } catch (error) {
          console.error('Error updating topic mastery:', error);
        }
      },

      fetchTopicMastery: async (examType, subjectId) => {
        try {
          let endpoint = '/revision-classroom/mastery';
          const params = new URLSearchParams();
          if (examType) params.append('examType', examType);
          if (subjectId) params.append('subjectId', subjectId);
          if (params.toString()) endpoint += `?${params.toString()}`;

          const response = await api.get<{ mastery: TopicMastery[] }>(endpoint);

          if (response.success && response.data) {
            const masteryMap: Record<string, TopicMastery> = {};
            response.data.mastery.forEach(m => {
              masteryMap[m.topicId] = m;
            });
            set({ topicMasteries: masteryMap });
          }
        } catch (error) {
          console.error('Error fetching topic mastery:', error);
        }
      },

      fetchDueTopics: async (examType) => {
        try {
          let endpoint = '/revision-classroom/mastery/due';
          if (examType) endpoint += `?examType=${examType}`;

          const response = await api.get<{ dueTopics: TopicMastery[] }>(endpoint);

          if (response.success && response.data) {
            return response.data.dueTopics;
          }
          return [];
        } catch (error) {
          console.error('Error fetching due topics:', error);
          return [];
        }
      },

      // =============================================
      // UTILITY ACTIONS
      // =============================================

      fetchPastSessions: async (status, examType) => {
        set({ isLoading: true });

        try {
          let endpoint = '/revision-classroom/sessions';
          const params = new URLSearchParams();
          if (status) params.append('status', status);
          if (examType) params.append('examType', examType);
          if (params.toString()) endpoint += `?${params.toString()}`;

          const response = await api.get<{ sessions: RevisionSession[] }>(endpoint);

          if (response.success && response.data) {
            set({ pastSessions: response.data.sessions.map(mapSession), isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Error fetching past sessions:', error);
          set({ isLoading: false });
        }
      },

      fetchStats: async (examType) => {
        try {
          let endpoint = '/revision-classroom/stats';
          if (examType) endpoint += `?examType=${examType}`;

          const response = await api.get<{
            sessions: { total: number; status: string }[];
            totalTimeMinutes: number;
            mastery: {
              total_topics: number;
              mastered: number;
              progressing: number;
              needs_work: number;
              average_mastery: number;
            };
            achievements: { total: number; total_xp: number };
          }>(endpoint);

          if (response.success && response.data) {
            const sessionsCompleted = response.data.sessions
              .filter(s => s.status === 'completed')
              .reduce((acc, s) => acc + s.total, 0);

            set({
              stats: {
                totalTimeMinutes: response.data.totalTimeMinutes || 0,
                sessionsCompleted,
                topicsMastered: response.data.mastery?.mastered || 0,
                averageMastery: response.data.mastery?.average_mastery || 0,
                achievementCount: response.data.achievements?.total || 0,
                totalXP: response.data.achievements?.total_xp || 0,
              },
            });
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      },

      clearError: () => set({ error: null }),

      resetClassroom: () => set({
        currentSession: null,
        currentLesson: null,
        lessonPlan: [],
        currentCheckpoints: [],
        checkpointResponses: [],
        aiTeachingState: {
          isTeaching: false,
          currentPhase: 'hook',
          currentMessage: '',
          isThinking: false,
          awaitingResponse: false,
        },
        aiMessages: [],
        error: null,
      }),
    }),
    {
      name: 'brilla-revision-classroom',
      version: 2,
      partialize: (state) => ({
        pastSessions: state.pastSessions,
        topicMasteries: state.topicMasteries,
        stats: state.stats,
      }),
    }
  )
);
