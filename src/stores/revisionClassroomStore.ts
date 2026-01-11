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

  // Actions - Checkpoints
  answerCheckpoint: (checkpointId: string, answer: string, timeTaken?: number) => Promise<CheckpointResponse>;
  generateMorePractice: () => Promise<void>;

  // Actions - Topic Mastery
  updateTopicMastery: (topicId: string, examType: string, updates: Partial<TopicMastery>) => Promise<void>;
  fetchTopicMastery: (examType?: string, subjectId?: string) => Promise<void>;
  fetchDueTopics: (examType?: string) => Promise<TopicMastery[]>;

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
            ...session,
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
          set({
            error: error instanceof Error ? error.message : 'Failed to start session',
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

          const lessonsWithNames = lessons.map((l: any) => ({
            ...l,
            topicName: l.topic_name || l.title,
          }));

          const currentLesson = session.currentLessonId
            ? lessonsWithNames.find((l: RevisionLesson) => l.id === session.currentLessonId) || lessonsWithNames[0]
            : lessonsWithNames[0];

          set({
            currentSession: { ...session, status: 'active' },
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
        const { currentLesson, currentSession } = get();
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
          // Generate AI content
          const content = await generateAITeachingContent(
            currentLesson,
            phase,
            currentSession.examType
          );

          // Record interaction on server
          await api.post(`/revision-classroom/lessons/${currentLesson.id}/interactions`, {
            interactionType: 'teaching',
            aiMessage: content,
          });

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
          }));
        } catch (error) {
          console.error('Error generating AI teaching:', error);
          set(state => ({
            aiTeachingState: {
              ...state.aiTeachingState,
              isThinking: false,
            },
            error: 'Failed to generate teaching content',
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
        const { currentLesson, currentSession } = get();
        if (!currentLesson || !currentSession) return;

        set(state => ({
          aiTeachingState: {
            ...state.aiTeachingState,
            isThinking: true,
          },
        }));

        try {
          // Generate clarification response
          const response = `Great question! Let me clarify that for you.

${question.toLowerCase().includes('why') ? 'The reason is that this concept helps us understand...' : 'Here\'s how it works...'}

Understanding this is important because it helps you see how ${currentLesson.topicName || currentLesson.title} connects to exam questions.

Does this help? Feel free to ask more questions!`;

          // Record interaction
          await api.post(`/revision-classroom/lessons/${currentLesson.id}/interactions`, {
            interactionType: 'clarification',
            aiMessage: response,
            userResponse: question,
          });

          const message: RevisionAIMessage = {
            id: generateLocalId('msg'),
            lessonId: currentLesson.id,
            interactionType: 'clarification',
            aiMessage: response,
            userResponse: question,
            timestamp: new Date().toISOString(),
          };

          set(state => ({
            aiMessages: [...state.aiMessages, message],
            aiTeachingState: {
              ...state.aiTeachingState,
              currentMessage: response,
              isThinking: false,
            },
          }));
        } catch (error) {
          console.error('Error asking question:', error);
          set(state => ({
            aiTeachingState: { ...state.aiTeachingState, isThinking: false },
          }));
        }
      },

      requestClarification: async (topic) => {
        await get().askQuestion(`Can you explain ${topic} in more detail?`);
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
            set({ pastSessions: response.data.sessions, isLoading: false });
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
