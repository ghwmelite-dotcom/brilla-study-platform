import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { createPoller, type Poller } from '@/utils/polling';

let poller: Poller | null = null;

// Types
export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  role: 'host' | 'co-host' | 'participant';
  isSpeaking: boolean;
  micEnabled: boolean;
  handRaised: boolean;
  cursorX?: number;
  cursorY?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'question' | 'ai_response' | 'system';
  timestamp: Date;
  reactions?: Record<string, string[]>;
}

export interface StudySession {
  id: string;
  title: string;
  description?: string;
  roomCode: string;
  subject: string;
  subjectId: string;
  topic: string;
  topicId?: string;
  examType: string;
  hostId: string;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  participants: Participant[];
  maxParticipants: number;
  aiEnabled: boolean;
  whiteboardEnabled: boolean;
  voiceEnabled: boolean;
  recordingEnabled: boolean;
  isPublic: boolean;
  createdAt: Date;
}

export interface CreateSessionData {
  title: string;
  description?: string;
  subjectId: string;
  topicId?: string;
  examType: string;
  maxParticipants?: number;
  aiEnabled?: boolean;
  whiteboardEnabled?: boolean;
  voiceEnabled?: boolean;
  recordingEnabled?: boolean;
  isPublic?: boolean;
  password?: string;
}

interface StudyRoomState {
  // Current session
  currentSession: StudySession | null;
  isInSession: boolean;

  // Available sessions (lobby)
  availableSessions: StudySession[];
  isLoadingSessions: boolean;

  // Messages
  messages: ChatMessage[];

  // Local state
  micEnabled: boolean;
  handRaised: boolean;

  // Connection state
  isConnecting: boolean;
  connectionError: string | null;

  // Polling
  pollingInterval: NodeJS.Timeout | null;

  // Actions
  createSession: (data: CreateSessionData) => Promise<StudySession>;
  joinSession: (roomCode: string, password?: string) => Promise<void>;
  leaveSession: () => Promise<void>;

  fetchAvailableSessions: () => Promise<void>;

  toggleMic: () => void;
  toggleHand: () => void;

  sendMessage: (content: string) => Promise<void>;
  askAI: (question: string) => Promise<string>;

  updateParticipant: (participantId: string, updates: Partial<Participant>) => void;
  removeParticipant: (participantId: string) => void;

  // Whiteboard sync
  sendDrawingEvent: (event: any) => Promise<void>;

  // Polling
  startPolling: () => void;
  stopPolling: () => void;
  pollForUpdates: () => Promise<void>;

  // Reset
  reset: () => void;
}

const PARTICIPANT_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

// Expose for potential use in creating participants
export { PARTICIPANT_COLORS };

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const useStudyRoomStore = create<StudyRoomState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      isInSession: false,
      availableSessions: [],
      isLoadingSessions: false,
      messages: [],
      micEnabled: false,
      handRaised: false,
      isConnecting: false,
      connectionError: null,
      pollingInterval: null,

      // Create a new study session
      createSession: async (data) => {
        set({ isConnecting: true, connectionError: null });

        try {
          const response = await api.post('/study-rooms', {
            ...data,
            roomCode: generateRoomCode(),
          });

          if (!response.success) {
            throw new Error(response.error || 'Failed to create session');
          }

          const session = response.data as StudySession;

          set({
            currentSession: session,
            isInSession: true,
            isConnecting: false,
            messages: [{
              id: Date.now().toString(),
              senderId: 'system',
              senderName: 'System',
              content: `Study room "${session.title}" created! Share the code: ${session.roomCode}`,
              type: 'system',
              timestamp: new Date(),
            }],
          });

          // Start polling for updates
          get().startPolling();

          return session;
        } catch (error: any) {
          set({ isConnecting: false, connectionError: error.message });
          throw error;
        }
      },

      // Join an existing session
      joinSession: async (roomCode, password) => {
        set({ isConnecting: true, connectionError: null });

        try {
          const response = await api.post(`/study-rooms/${roomCode}/join`, { password });

          if (!response.success) {
            throw new Error(response.error || 'Failed to join session');
          }

          const session = response.data as StudySession;

          set({
            currentSession: session,
            isInSession: true,
            isConnecting: false,
            messages: [{
              id: Date.now().toString(),
              senderId: 'system',
              senderName: 'System',
              content: `You joined "${session.title}"`,
              type: 'system',
              timestamp: new Date(),
            }],
          });

          // Start polling
          get().startPolling();
        } catch (error: any) {
          set({ isConnecting: false, connectionError: error.message });
          throw error;
        }
      },

      // Leave current session
      leaveSession: async () => {
        const { currentSession } = get();
        if (!currentSession) return;

        get().stopPolling();

        try {
          await api.post(`/study-rooms/${currentSession.roomCode}/leave`);
        } catch (error) {
          console.error('Failed to leave session:', error);
        }

        set({
          currentSession: null,
          isInSession: false,
          messages: [],
          micEnabled: false,
          handRaised: false,
        });
      },

      // Fetch available public sessions
      fetchAvailableSessions: async () => {
        set({ isLoadingSessions: true });

        try {
          const response = await api.get('/study-rooms');

          if (response.success) {
            set({ availableSessions: response.data as StudySession[] });
          }
        } catch (error) {
          console.error('Failed to fetch sessions:', error);
        } finally {
          set({ isLoadingSessions: false });
        }
      },

      // Toggle microphone
      toggleMic: () => {
        set(state => ({ micEnabled: !state.micEnabled }));

        const { currentSession, micEnabled } = get();
        if (currentSession) {
          api.post(`/study-rooms/${currentSession.roomCode}/update-status`, {
            micEnabled: !micEnabled,
          }).catch(console.error);
        }
      },

      // Toggle hand raised
      toggleHand: () => {
        set(state => ({ handRaised: !state.handRaised }));

        const { currentSession, handRaised } = get();
        if (currentSession) {
          api.post(`/study-rooms/${currentSession.roomCode}/update-status`, {
            handRaised: !handRaised,
          }).catch(console.error);
        }
      },

      // Send chat message
      sendMessage: async (content) => {
        const { currentSession } = get();
        if (!currentSession) return;

        try {
          await api.post(`/study-rooms/${currentSession.roomCode}/messages`, {
            content,
            type: 'text',
          });
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      },

      // Ask AI tutor
      askAI: async (question) => {
        const { currentSession } = get();
        if (!currentSession) return 'No active session';

        try {
          const response = await api.post(`/study-rooms/${currentSession.roomCode}/ask-ai`, {
            question,
          });

          if (response.success && response.data) {
            const data = response.data as { response: string };
            return data.response;
          }

          return 'Sorry, I encountered an error. Please try again.';
        } catch (error) {
          console.error('Failed to get AI response:', error);
          return 'Failed to get AI response. Please try again.';
        }
      },

      // Update participant
      updateParticipant: (participantId, updates) => {
        set(state => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              participants: state.currentSession.participants.map(p =>
                p.id === participantId ? { ...p, ...updates } : p
              ),
            },
          };
        });
      },

      // Remove participant
      removeParticipant: (participantId) => {
        set(state => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              participants: state.currentSession.participants.filter(p => p.id !== participantId),
            },
          };
        });
      },

      // Send whiteboard drawing event
      sendDrawingEvent: async (event) => {
        const { currentSession } = get();
        if (!currentSession) return;

        try {
          await api.post(`/study-rooms/${currentSession.roomCode}/drawing`, event);
        } catch (error) {
          console.error('Failed to send drawing event:', error);
        }
      },

      // Start polling for updates
      startPolling: () => {
        if (!poller) {
          poller = createPoller(() => get().pollForUpdates(), 2000); // Poll every 2 seconds
        }
        poller.start(); // idempotent
      },

      // Stop polling
      stopPolling: () => {
        poller?.stop();
      },

      // Poll for updates
      pollForUpdates: async () => {
        const { currentSession, messages } = get();
        if (!currentSession) return;

        try {
          const lastMessageId = messages[messages.length - 1]?.id;
          const url = lastMessageId
            ? `/study-rooms/${currentSession.roomCode}/updates?lastMessageId=${lastMessageId}`
            : `/study-rooms/${currentSession.roomCode}/updates`;
          const response = await api.get(url);

          if (response.success && response.data) {
            const data = response.data as {
              participants?: Participant[];
              newMessages?: ChatMessage[];
              sessionStatus?: StudySession['status'];
            };
            const { participants, newMessages, sessionStatus } = data;

            set(state => ({
              currentSession: state.currentSession ? {
                ...state.currentSession,
                participants: participants || state.currentSession.participants,
                status: sessionStatus || state.currentSession.status,
              } : null,
              messages: newMessages && newMessages.length > 0
                ? [...state.messages, ...newMessages]
                : state.messages,
            }));
          }
        } catch (error) {
          console.error('Failed to poll for updates:', error);
        }
      },

      // Reset store
      reset: () => {
        get().stopPolling();
        set({
          currentSession: null,
          isInSession: false,
          availableSessions: [],
          isLoadingSessions: false,
          messages: [],
          micEnabled: false,
          handRaised: false,
          isConnecting: false,
          connectionError: null,
          pollingInterval: null,
        });
      },
    }),
    {
      name: 'brilla-study-room-store',
      partialize: (state) => ({
        // Only persist minimal state
        micEnabled: state.micEnabled,
      }),
    }
  )
);
