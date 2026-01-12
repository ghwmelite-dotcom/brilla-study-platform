import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

// Helper type for API responses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiData = Record<string, any>;

// Types for Tutor-AI Classroom Integration

export type HandoffStatus = 'none' | 'suggested' | 'requested' | 'pending' | 'connected' | 'declined';
export type TutorMode = 'observe' | 'co_teach' | 'takeover';
export type SessionVisibility = 'public' | 'private';
export type ScheduledSessionStatus = 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled' | 'no_show';
export type AICopilotMode = 'assistant' | 'silent' | 'disabled';
export type AnnotationType = 'highlight' | 'circle' | 'arrow' | 'text_note' | 'correction' | 'star' | 'checkmark';
export type TeachingPhase = 'hook' | 'explain' | 'check' | 'practice' | 'confirm' | 'connect';

export interface TutorAvailability {
  id: string;
  tutorId: string;
  acceptingHandoffs: boolean;
  acceptingObservation: boolean;
  maxObservedSessions: number;
  isOnline: boolean;
  currentSessionCount: number;
  lastHeartbeat: string;
  preferredSubjects: string[];
  preferredExamTypes: string[];
  preferredDifficultyLevels: string[];
  notifyOnHandoffRequest: boolean;
  notifyOnHighStruggle: boolean;
  minStruggleScoreNotify: number;
}

export interface ObservableSession {
  id: string;
  revisionSessionId?: string;
  studentId: string;
  studentName?: string;
  studentAvatarUrl?: string;

  // Context
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  examType?: string;

  // Teaching state
  currentPhase: TeachingPhase;
  currentLessonId?: string;
  lessonTitle?: string;
  lessonProgressPercent: number;

  // Struggle detection
  struggleScore: number;
  consecutiveWrongAnswers: number;
  timeStuckSeconds: number;
  repeatedQuestionsCount: number;
  clarificationRequestsCount: number;
  lastActivityAt: string;

  // Handoff state
  handoffStatus: HandoffStatus;
  handoffReason?: string;
  handoffSuggestedAt?: string;
  handoffRequestedAt?: string;

  // Connected tutor
  tutorId?: string;
  tutorName?: string;
  tutorAvatarUrl?: string;
  tutorJoinedAt?: string;
  tutorMode?: TutorMode;

  // Session state
  isActive: boolean;
  visibility: SessionVisibility;

  // AI context
  aiMessagesSummary?: string;
  lastAiMessage?: string;
  lastStudentResponse?: string;

  startedAt: string;
}

export interface TutorObservation {
  id: string;
  tutorId: string;
  aiSessionId: string;
  isActive: boolean;
  startedAt: string;
  endedAt?: string;
  lastEventId?: string;
  lastPollAt: string;
}

export interface TutorClassroomEvent {
  id: string;
  aiSessionId: string;
  tutorId?: string;
  studentId?: string;
  eventType: string;
  eventData?: any;
  content?: string;
  contentType?: string;
  annotationType?: AnnotationType;
  annotationData?: any;
  annotationColor?: string;
  isVisibleToStudent: boolean;
  createdAt: string;
}

export interface ScheduledSession {
  id: string;
  tutoringSessionId?: string;
  tutorId: string;
  studentId: string;

  // Details
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  examType?: string;
  title?: string;
  description?: string;
  objectives?: string[];

  // Scheduling
  scheduledDatetime: string;
  scheduledDurationMinutes: number;
  timezone: string;

  // Join info
  roomCode?: string;
  joinUrl?: string;

  // AI settings
  aiCopilotEnabled: boolean;
  aiCopilotMode: AICopilotMode;

  // Features
  whiteboardEnabled: boolean;
  voiceEnabled: boolean;
  recordingEnabled: boolean;
  screenShareEnabled: boolean;

  // Status
  status: ScheduledSessionStatus;
  startedAt?: string;
  endedAt?: string;
  actualDurationMinutes?: number;

  // Notes
  tutorNotes?: string;
  sessionSummary?: string;
  homeworkAssigned?: string;

  // Rating
  studentRating?: number;
  studentFeedback?: string;

  createdAt: string;
}

export interface HandoffRequest {
  sessionId: string;
  studentId: string;
  studentName?: string;
  studentAvatarUrl?: string;
  subjectName?: string;
  topicName?: string;
  examType?: string;
  struggleScore: number;
  handoffReason?: string;
  requestedAt: string;
  aiMessagesSummary?: string;
}

export interface CoTeachState {
  sessionId: string;
  tutorMode: TutorMode;
  isConnected: boolean;

  // Session info
  studentName?: string;
  subjectName?: string;
  topicName?: string;

  // Real-time state
  currentPhase: TeachingPhase;
  lessonProgress: number;
  recentEvents: TutorClassroomEvent[];

  // Whiteboard
  whiteboardState?: string;

  // AI context
  lastAiMessage?: string;
  lastStudentResponse?: string;
}

interface TutorClassroomState {
  // Tutor availability
  availability: TutorAvailability | null;
  isUpdatingAvailability: boolean;

  // Observable sessions (dashboard)
  observableSessions: ObservableSession[];
  isLoadingObservable: boolean;
  observableFilters: {
    subjectId?: string;
    examType?: string;
    minStruggleScore?: number;
  };

  // Currently observing
  observations: Map<string, TutorObservation>;
  observedSessionDetails: Map<string, ObservableSession>;
  observedSessionEvents: Map<string, TutorClassroomEvent[]>;

  // Handoff requests
  pendingHandoffs: HandoffRequest[];
  isLoadingHandoffs: boolean;

  // Active co-teaching session
  coTeachSession: CoTeachState | null;

  // Scheduled sessions
  scheduledSessions: ScheduledSession[];
  isLoadingScheduled: boolean;

  // Active live session
  activeLiveSession: ScheduledSession | null;

  // Polling state
  pollingInterval: NodeJS.Timeout | null;

  // Error handling
  error: string | null;

  // Actions - Availability
  fetchAvailability: () => Promise<void>;
  updateAvailability: (updates: Partial<TutorAvailability>) => Promise<void>;
  sendHeartbeat: () => Promise<void>;

  // Actions - Observable Sessions
  fetchObservableSessions: () => Promise<void>;
  setObservableFilters: (filters: TutorClassroomState['observableFilters']) => void;

  // Actions - Observation
  startObserving: (sessionId: string) => Promise<void>;
  stopObserving: (sessionId: string) => Promise<void>;
  pollSessionUpdates: (sessionId: string) => Promise<TutorClassroomEvent[]>;

  // Actions - Handoffs
  fetchPendingHandoffs: () => Promise<void>;
  acceptHandoff: (sessionId: string) => Promise<void>;
  declineHandoff: (sessionId: string, reason?: string) => Promise<void>;

  // Actions - Co-Teaching
  sendMessage: (sessionId: string, content: string, isVisibleToStudent?: boolean) => Promise<void>;
  addAnnotation: (sessionId: string, annotation: any) => Promise<void>;
  guideAI: (sessionId: string, guidance: string) => Promise<void>;
  changeMode: (sessionId: string, mode: TutorMode) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;

  // Actions - Scheduled Sessions
  fetchScheduledSessions: () => Promise<void>;
  createScheduledSession: (session: Partial<ScheduledSession>) => Promise<ScheduledSession>;
  updateScheduledSession: (sessionId: string, updates: Partial<ScheduledSession>) => Promise<void>;
  cancelScheduledSession: (sessionId: string) => Promise<void>;
  startLiveSession: (sessionId: string) => Promise<void>;
  joinLiveSession: (roomCode: string) => Promise<ScheduledSession>;
  requestAIAssist: (sessionId: string, requestType: string, context?: any) => Promise<string>;
  endLiveSession: (sessionId: string, summary?: string) => Promise<void>;

  // Actions - Polling Management
  startPolling: () => void;
  stopPolling: () => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;
}

const POLLING_INTERVAL = 3000; // 3 seconds

export const useTutorClassroomStore = create<TutorClassroomState>()(
  persist(
    (set, get) => ({
      // Initial state
      availability: null,
      isUpdatingAvailability: false,

      observableSessions: [],
      isLoadingObservable: false,
      observableFilters: {},

      observations: new Map(),
      observedSessionDetails: new Map(),
      observedSessionEvents: new Map(),

      pendingHandoffs: [],
      isLoadingHandoffs: false,

      coTeachSession: null,

      scheduledSessions: [],
      isLoadingScheduled: false,

      activeLiveSession: null,

      pollingInterval: null,

      error: null,

      // Availability Actions
      fetchAvailability: async () => {
        try {
          const response = await api.get<{ availability: TutorAvailability }>('/tutor-classroom/availability');
          if (response.data?.availability) {
            set({ availability: response.data.availability });
          }
        } catch (error: any) {
          console.error('Failed to fetch availability:', error);
          set({ error: error.message || 'Failed to fetch availability' });
        }
      },

      updateAvailability: async (updates) => {
        set({ isUpdatingAvailability: true });
        try {
          const response = await api.post<{ availability: TutorAvailability }>('/tutor-classroom/availability', updates);
          set({
            availability: response.data?.availability || null,
            isUpdatingAvailability: false
          });
        } catch (error: any) {
          console.error('Failed to update availability:', error);
          set({
            error: error.message || 'Failed to update availability',
            isUpdatingAvailability: false
          });
        }
      },

      sendHeartbeat: async () => {
        try {
          const response = await api.post<{ availability: TutorAvailability }>('/tutor-classroom/heartbeat');
          if (response.data?.availability) {
            set({ availability: response.data.availability });
          }
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      },

      // Observable Sessions Actions
      fetchObservableSessions: async () => {
        set({ isLoadingObservable: true });
        try {
          const { observableFilters } = get();
          const params = new URLSearchParams();
          if (observableFilters.subjectId) params.append('subjectId', observableFilters.subjectId);
          if (observableFilters.examType) params.append('examType', observableFilters.examType);
          if (observableFilters.minStruggleScore) params.append('minStruggleScore', String(observableFilters.minStruggleScore));

          const response = await api.get<{ sessions: ObservableSession[] }>(`/tutor-classroom/observable-sessions?${params}`);
          set({
            observableSessions: response.data?.sessions || [],
            isLoadingObservable: false
          });
        } catch (error: any) {
          console.error('Failed to fetch observable sessions:', error);
          set({
            error: error.message || 'Failed to fetch sessions',
            isLoadingObservable: false
          });
        }
      },

      setObservableFilters: (filters) => {
        set({ observableFilters: filters });
        get().fetchObservableSessions();
      },

      // Observation Actions
      startObserving: async (sessionId) => {
        try {
          const response = await api.post<ApiData>(`/tutor-classroom/observable-sessions/${sessionId}/observe`);
          const { observations, observedSessionDetails, observedSessionEvents } = get();

          observations.set(sessionId, response.data?.observation);
          observedSessionDetails.set(sessionId, response.data?.session);
          observedSessionEvents.set(sessionId, response.data?.recentEvents || []);

          set({ observations, observedSessionDetails, observedSessionEvents });
        } catch (error: any) {
          console.error('Failed to start observing:', error);
          set({ error: error.message || 'Failed to start observation' });
        }
      },

      stopObserving: async (sessionId) => {
        try {
          await api.post(`/tutor-classroom/observable-sessions/${sessionId}/stop-observe`);
          const { observations, observedSessionDetails, observedSessionEvents } = get();

          observations.delete(sessionId);
          observedSessionDetails.delete(sessionId);
          observedSessionEvents.delete(sessionId);

          set({ observations, observedSessionDetails, observedSessionEvents });
        } catch (error: any) {
          console.error('Failed to stop observing:', error);
        }
      },

      pollSessionUpdates: async (sessionId) => {
        try {
          const { observations, observedSessionEvents } = get();
          const observation = observations.get(sessionId);
          const lastEventId = observation?.lastEventId;

          const response = await api.get<ApiData>(
            `/tutor-classroom/observable-sessions/${sessionId}/updates${lastEventId ? `?since=${lastEventId}` : ''}`
          );

          const newEvents = response.data?.events || [];

          if (newEvents.length > 0) {
            const existingEvents = observedSessionEvents.get(sessionId) || [];
            observedSessionEvents.set(sessionId, [...existingEvents, ...newEvents]);

            // Update last event ID
            if (observation) {
              observation.lastEventId = newEvents[newEvents.length - 1].id;
              observations.set(sessionId, observation);
            }

            set({ observations, observedSessionEvents });
          }

          // Update session details if provided
          if (response.data?.session) {
            const { observedSessionDetails } = get();
            observedSessionDetails.set(sessionId, response.data.session);
            set({ observedSessionDetails });
          }

          return newEvents;
        } catch (error) {
          console.error('Failed to poll updates:', error);
          return [];
        }
      },

      // Handoff Actions
      fetchPendingHandoffs: async () => {
        set({ isLoadingHandoffs: true });
        try {
          const response = await api.get<ApiData>('/tutor-classroom/handoff-requests');
          set({
            pendingHandoffs: response.data?.requests || [],
            isLoadingHandoffs: false
          });
        } catch (error: any) {
          console.error('Failed to fetch handoffs:', error);
          set({
            error: error.message || 'Failed to fetch handoff requests',
            isLoadingHandoffs: false
          });
        }
      },

      acceptHandoff: async (sessionId) => {
        try {
          const response = await api.post<ApiData>(`/tutor-classroom/handoff-requests/${sessionId}/accept`);

          // Remove from pending
          const { pendingHandoffs } = get();
          set({
            pendingHandoffs: pendingHandoffs.filter(h => h.sessionId !== sessionId),
            coTeachSession: {
              sessionId,
              tutorMode: 'co_teach',
              isConnected: true,
              studentName: response.data?.session?.studentName,
              subjectName: response.data?.session?.subjectName,
              topicName: response.data?.session?.topicName,
              currentPhase: response.data?.session?.currentPhase || 'explain',
              lessonProgress: response.data?.session?.lessonProgressPercent || 0,
              recentEvents: response.data?.recentEvents || [],
              lastAiMessage: response.data?.session?.lastAiMessage,
              lastStudentResponse: response.data?.session?.lastStudentResponse,
            }
          });
        } catch (error: any) {
          console.error('Failed to accept handoff:', error);
          set({ error: error.message || 'Failed to accept handoff' });
        }
      },

      declineHandoff: async (sessionId, reason) => {
        try {
          await api.post(`/tutor-classroom/handoff-requests/${sessionId}/decline`, { reason });
          const { pendingHandoffs } = get();
          set({
            pendingHandoffs: pendingHandoffs.filter(h => h.sessionId !== sessionId)
          });
        } catch (error: any) {
          console.error('Failed to decline handoff:', error);
        }
      },

      // Co-Teaching Actions
      sendMessage: async (sessionId, content, isVisibleToStudent = true) => {
        try {
          const response = await api.post<ApiData>(`/tutor-classroom/ai-sessions/${sessionId}/send-message`, {
            content,
            isVisibleToStudent,
          });

          // Add to events
          const { observedSessionEvents, coTeachSession } = get();
          if (response.data?.event) {
            const events = observedSessionEvents.get(sessionId) || [];
            events.push(response.data.event);
            observedSessionEvents.set(sessionId, events);

            if (coTeachSession?.sessionId === sessionId) {
              coTeachSession.recentEvents = [...coTeachSession.recentEvents, response.data.event];
              set({ coTeachSession });
            }

            set({ observedSessionEvents });
          }
        } catch (error: any) {
          console.error('Failed to send message:', error);
          set({ error: error.message || 'Failed to send message' });
        }
      },

      addAnnotation: async (sessionId, annotation) => {
        try {
          const response = await api.post<ApiData>(`/tutor-classroom/ai-sessions/${sessionId}/add-annotation`, annotation);

          // Add to events
          const { observedSessionEvents } = get();
          if (response.data?.event) {
            const events = observedSessionEvents.get(sessionId) || [];
            events.push(response.data.event);
            observedSessionEvents.set(sessionId, events);
            set({ observedSessionEvents });
          }
        } catch (error: any) {
          console.error('Failed to add annotation:', error);
          set({ error: error.message || 'Failed to add annotation' });
        }
      },

      guideAI: async (sessionId, guidance) => {
        try {
          await api.post(`/tutor-classroom/ai-sessions/${sessionId}/guide-ai`, { guidance });
        } catch (error: any) {
          console.error('Failed to guide AI:', error);
          set({ error: error.message || 'Failed to guide AI' });
        }
      },

      changeMode: async (sessionId, mode) => {
        try {
          await api.post(`/tutor-classroom/ai-sessions/${sessionId}/change-mode`, { mode });

          const { coTeachSession } = get();
          if (coTeachSession?.sessionId === sessionId) {
            set({ coTeachSession: { ...coTeachSession, tutorMode: mode } });
          }
        } catch (error: any) {
          console.error('Failed to change mode:', error);
          set({ error: error.message || 'Failed to change mode' });
        }
      },

      leaveSession: async (sessionId) => {
        try {
          await api.post(`/tutor-classroom/ai-sessions/${sessionId}/leave`);

          const { coTeachSession } = get();
          if (coTeachSession?.sessionId === sessionId) {
            set({ coTeachSession: null });
          }
        } catch (error: any) {
          console.error('Failed to leave session:', error);
        }
      },

      // Scheduled Sessions Actions
      fetchScheduledSessions: async () => {
        set({ isLoadingScheduled: true });
        try {
          const response = await api.get<ApiData>('/tutor-classroom/scheduled-sessions');
          set({
            scheduledSessions: response.data?.sessions || [],
            isLoadingScheduled: false
          });
        } catch (error: any) {
          console.error('Failed to fetch scheduled sessions:', error);
          set({
            error: error.message || 'Failed to fetch scheduled sessions',
            isLoadingScheduled: false
          });
        }
      },

      createScheduledSession: async (session) => {
        try {
          const response = await api.post<ApiData>('/tutor-classroom/scheduled-sessions', session);
          const { scheduledSessions } = get();
          set({ scheduledSessions: [...scheduledSessions, response.data?.session] });
          return response.data?.session;
        } catch (error: any) {
          console.error('Failed to create scheduled session:', error);
          set({ error: error.message || 'Failed to create session' });
          throw error;
        }
      },

      updateScheduledSession: async (sessionId, updates) => {
        try {
          const response = await api.patch<ApiData>(`/tutor-classroom/scheduled-sessions/${sessionId}`, updates);
          const { scheduledSessions } = get();
          set({
            scheduledSessions: scheduledSessions.map(s =>
              s.id === sessionId ? response.data?.session : s
            )
          });
        } catch (error: any) {
          console.error('Failed to update session:', error);
          set({ error: error.message || 'Failed to update session' });
        }
      },

      cancelScheduledSession: async (sessionId) => {
        try {
          await api.delete(`/tutor-classroom/scheduled-sessions/${sessionId}`);
          const { scheduledSessions } = get();
          set({
            scheduledSessions: scheduledSessions.filter(s => s.id !== sessionId)
          });
        } catch (error: any) {
          console.error('Failed to cancel session:', error);
          set({ error: error.message || 'Failed to cancel session' });
        }
      },

      startLiveSession: async (sessionId) => {
        try {
          const response = await api.post<ApiData>(`/tutor-classroom/scheduled-sessions/${sessionId}/start`);
          const { scheduledSessions } = get();
          const updatedSession = response.data?.session;

          set({
            activeLiveSession: updatedSession,
            scheduledSessions: scheduledSessions.map(s =>
              s.id === sessionId ? updatedSession : s
            )
          });
        } catch (error: any) {
          console.error('Failed to start session:', error);
          set({ error: error.message || 'Failed to start session' });
        }
      },

      joinLiveSession: async (roomCode) => {
        try {
          const response = await api.post<ApiData>('/tutor-classroom/scheduled-sessions/join', { roomCode });
          set({ activeLiveSession: response.data?.session });
          return response.data?.session;
        } catch (error: any) {
          console.error('Failed to join session:', error);
          set({ error: error.message || 'Failed to join session' });
          throw error;
        }
      },

      requestAIAssist: async (sessionId, requestType, context) => {
        try {
          const response = await api.post<ApiData>(`/tutor-classroom/scheduled-sessions/${sessionId}/ai-assist`, {
            requestType,
            context,
          });
          return response.data?.aiResponse;
        } catch (error: any) {
          console.error('Failed to get AI assist:', error);
          set({ error: error.message || 'Failed to get AI assistance' });
          throw error;
        }
      },

      endLiveSession: async (sessionId, summary) => {
        try {
          const response = await api.post<ApiData>(`/tutor-classroom/scheduled-sessions/${sessionId}/end`, { summary });
          const { scheduledSessions } = get();

          set({
            activeLiveSession: null,
            scheduledSessions: scheduledSessions.map(s =>
              s.id === sessionId ? response.data?.session : s
            )
          });
        } catch (error: any) {
          console.error('Failed to end session:', error);
          set({ error: error.message || 'Failed to end session' });
        }
      },

      // Polling Management
      startPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) return;

        const interval = setInterval(async () => {
          const { observations, coTeachSession } = get();

          // Poll for each observed session
          for (const [sessionId] of observations) {
            await get().pollSessionUpdates(sessionId);
          }

          // Poll for co-teach session
          if (coTeachSession?.isConnected) {
            await get().pollSessionUpdates(coTeachSession.sessionId);
          }

          // Send heartbeat
          await get().sendHeartbeat();

          // Refresh handoffs and observable sessions
          await get().fetchPendingHandoffs();
          await get().fetchObservableSessions();
        }, POLLING_INTERVAL);

        set({ pollingInterval: interval });
      },

      stopPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) {
          clearInterval(pollingInterval);
          set({ pollingInterval: null });
        }
      },

      // Utility
      clearError: () => set({ error: null }),

      reset: () => {
        get().stopPolling();
        set({
          availability: null,
          isUpdatingAvailability: false,
          observableSessions: [],
          isLoadingObservable: false,
          observableFilters: {},
          observations: new Map(),
          observedSessionDetails: new Map(),
          observedSessionEvents: new Map(),
          pendingHandoffs: [],
          isLoadingHandoffs: false,
          coTeachSession: null,
          scheduledSessions: [],
          isLoadingScheduled: false,
          activeLiveSession: null,
          pollingInterval: null,
          error: null,
        });
      },
    }),
    {
      name: 'tutor-classroom-store',
      partialize: (state) => ({
        // Only persist availability settings
        availability: state.availability,
        observableFilters: state.observableFilters,
      }),
    }
  )
);

export default useTutorClassroomStore;
