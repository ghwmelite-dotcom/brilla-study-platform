import { create } from 'zustand';
import { api } from '@/lib/api';
import { createPoller, type Poller } from '@/utils/polling';

// Contract mirrors workers/api/teambattles.ts exactly. No mock fallbacks:
// API errors surface as `error` for the UI to render honestly.

export interface TeamBattleMember {
  userId: string;
  name: string;
  avatarUrl?: string;
  isCaptain: boolean;
  teamNumber: 1 | 2;
  score: number;
  correctAnswers: number;
  answeredCount: number;
}

export interface TeamBattleQuestion {
  id: string;
  questionText: string;
  questionType?: string;
  options: { id: string; text: string }[] | null;
}

export type TeamBattleStatus = 'waiting' | 'ready' | 'active' | 'completed' | 'cancelled';

export interface TeamBattleInfo {
  id: string;
  status: TeamBattleStatus;
  subjectName?: string;
  topicName?: string;
  totalQuestions: number;
  timePerQuestion: number;
  team1Score: number;
  team2Score: number;
  winnerTeam: number | null;
  xpReward: number;
  myWinStreak?: number | null;
  myWinStreakBonus?: number | null;
  currentQuestion: number;
  roundEndsAt: string | null;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  question?: TeamBattleQuestion | null;
}

export interface TeamBattleData {
  battle: TeamBattleInfo;
  team1: TeamBattleMember[];
  team2: TeamBattleMember[];
}

export interface AvailableTeamBattle {
  id: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  status: TeamBattleStatus;
  team1Count: number;
  team2Count: number;
  totalQuestions: number;
  timePerQuestion: number;
  xpReward?: number;
  createdAt: string;
}

export interface TeamAnswerResult {
  correct: boolean;
  points: number;
  correctAnswer: string;
  questionIndex: number;
  timeTaken: number;
}

// Spec 1.4c team chat. Contract mirrors the chat endpoints in
// workers/api/teambattles.ts.
export interface TeamBattleChatMessage {
  id: string;
  senderId: string;
  senderName: string | null;
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
}

let poller: Poller | null = null;
let polledBattleId: string | null = null;

// Incremental-chat cursor lives outside zustand (like the poller): it is
// transport state, not render state. Reset on battle switch / leave / reset.
let chatBattleId: string | null = null;
let chatSince: string | null = null;

function clearChatCursor() {
  chatBattleId = null;
  chatSince = null;
}

interface TeamBattleState {
  current: TeamBattleData | null;
  availableBattles: AvailableTeamBattle[];
  isLoading: boolean;
  error: string | null;
  chatMessages: TeamBattleChatMessage[];
  chatError: string | null;

  fetchAvailableBattles: () => Promise<void>;
  fetchBattle: (battleId: string) => Promise<TeamBattleData | null>;
  createBattle: (options: { subjectId?: string; topicId?: string; totalQuestions?: number; timePerQuestion?: number }) => Promise<string>;
  joinBattle: (battleId: string, teamNumber: 1 | 2) => Promise<void>;
  joinByCode: (code: string) => Promise<TeamBattleData>;
  startBattle: (battleId: string) => Promise<void>;
  leaveBattle: (battleId: string) => Promise<void>;
  submitAnswer: (questionId: string, answer: string) => Promise<TeamAnswerResult>;
  fetchChat: (battleId: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  startPolling: (battleId: string) => void;
  stopPolling: () => void;
  reset: () => void;
  clearError: () => void;
}

export const useTeamBattleStore = create<TeamBattleState>()((set, get) => ({
  current: null,
  availableBattles: [],
  isLoading: false,
  error: null,
  chatMessages: [],
  chatError: null,

  fetchAvailableBattles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ battles: AvailableTeamBattle[] }>('/team-battles/available');
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch team battles');
      }
      set({ availableBattles: response.data.battles, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch team battles',
        isLoading: false,
      });
    }
  },

  fetchBattle: async (battleId) => {
    try {
      const response = await api.get<TeamBattleData>(`/team-battles/${battleId}`);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch team battle');
      }
      set({ current: response.data, error: null });
      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch team battle' });
      return null;
    }
  },

  createBattle: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ battleId: string }>('/team-battles/create', options);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create team battle');
      }
      await get().fetchBattle(response.data.battleId);
      set({ isLoading: false });
      return response.data.battleId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create team battle',
        isLoading: false,
      });
      throw error;
    }
  },

  joinBattle: async (battleId, teamNumber) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/team-battles/${battleId}/join`, { teamNumber });
      if (!response.success) {
        throw new Error(response.error || 'Failed to join team battle');
      }
      const data = await get().fetchBattle(battleId);
      set({ isLoading: false });
      if (!data) throw new Error(get().error || 'Failed to load team battle');
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to join team battle',
        isLoading: false,
      });
      throw error;
    }
  },

  joinByCode: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ battleId: string; teamNumber: 1 | 2 }>(
        '/team-battles/join-by-code',
        { code },
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || 'No waiting team battle with that code');
      }
      const data = await get().fetchBattle(response.data.battleId);
      set({ isLoading: false });
      if (!data) throw new Error(get().error || 'Failed to load team battle');
      return data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to join team battle',
        isLoading: false,
      });
      throw error;
    }
  },

  startBattle: async (battleId) => {
    set({ error: null });
    try {
      const response = await api.post(`/team-battles/${battleId}/start`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to start battle');
      }
      await get().fetchBattle(battleId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to start battle' });
      throw error;
    }
  },

  leaveBattle: async (battleId) => {
    try {
      const response = await api.post(`/team-battles/${battleId}/leave`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to leave battle');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to leave battle' });
      throw error;
    } finally {
      get().stopPolling();
      clearChatCursor();
      set({ current: null, chatMessages: [], chatError: null });
    }
  },

  submitAnswer: async (questionId, answer) => {
    const battleId = get().current?.battle.id;
    if (!battleId) throw new Error('No active team battle');

    const response = await api.post<TeamAnswerResult>(`/team-battles/${battleId}/answer`, {
      questionId,
      answer,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to submit answer');
    }
    return response.data;
  },

  // Incremental sync: after the first full page, polls pass the last seen
  // createdAt as `since` (server compares >=, so we dedupe by id here).
  fetchChat: async (battleId) => {
    if (chatBattleId !== battleId) {
      chatBattleId = battleId;
      chatSince = null;
      set({ chatMessages: [], chatError: null });
    }
    try {
      const url = chatSince
        ? `/team-battles/${battleId}/chat?since=${encodeURIComponent(chatSince)}`
        : `/team-battles/${battleId}/chat`;
      const response = await api.get<{ messages: TeamBattleChatMessage[] }>(url);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load team chat');
      }
      const incoming = response.data.messages;
      if (incoming.length > 0) {
        set((state) => {
          const seen = new Set(state.chatMessages.map((m) => m.id));
          const merged = [...state.chatMessages, ...incoming.filter((m) => !seen.has(m.id))];
          return { chatMessages: merged.slice(-100), chatError: null };
        });
        chatSince = incoming[incoming.length - 1].createdAt;
      } else {
        set({ chatError: null });
      }
    } catch (error) {
      // Chat failure must not break battle polling — surface it in the panel only.
      set({ chatError: error instanceof Error ? error.message : 'Failed to load team chat' });
    }
  },

  sendChatMessage: async (message) => {
    const battleId = get().current?.battle.id;
    if (!battleId) throw new Error('No active team battle');

    const response = await api.post<{ message: TeamBattleChatMessage }>(
      `/team-battles/${battleId}/chat`,
      { message },
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to send message');
    }
    const created = response.data.message;
    set((state) =>
      state.chatMessages.some((m) => m.id === created.id)
        ? { chatError: null }
        : { chatMessages: [...state.chatMessages, created].slice(-100), chatError: null },
    );
    chatBattleId = battleId;
    chatSince = created.createdAt;
  },

  // Single 2s poller while a battle is open (same pattern as the 1v1 store;
  // Phase A removed the doubled component-local interval). Team chat rides
  // along on the same tick (spec 1.4c: "poll with battle fetch").
  startPolling: (battleId) => {
    polledBattleId = battleId;
    if (!poller) {
      poller = createPoller(async () => {
        if (polledBattleId) {
          await get().fetchBattle(polledBattleId);
          await get().fetchChat(polledBattleId);
        }
      }, 2000);
    }
    poller.start(); // idempotent
  },

  stopPolling: () => {
    poller?.stop();
    polledBattleId = null;
  },

  reset: () => {
    get().stopPolling();
    clearChatCursor();
    set({ current: null, error: null, chatMessages: [], chatError: null });
  },

  clearError: () => set({ error: null }),
}));

// Helper: Get team color classes
export function getTeamColors(teamIndex: 1 | 2) {
  return teamIndex === 1
    ? {
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-600',
      }
    : {
        bg: 'bg-red-500',
        bgLight: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-600',
      };
}
