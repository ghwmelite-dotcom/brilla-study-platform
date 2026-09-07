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

let poller: Poller | null = null;
let polledBattleId: string | null = null;

interface TeamBattleState {
  current: TeamBattleData | null;
  availableBattles: AvailableTeamBattle[];
  isLoading: boolean;
  error: string | null;

  fetchAvailableBattles: () => Promise<void>;
  fetchBattle: (battleId: string) => Promise<TeamBattleData | null>;
  createBattle: (options: { subjectId?: string; topicId?: string; totalQuestions?: number; timePerQuestion?: number }) => Promise<string>;
  joinBattle: (battleId: string, teamNumber: 1 | 2) => Promise<void>;
  joinByCode: (code: string) => Promise<TeamBattleData>;
  startBattle: (battleId: string) => Promise<void>;
  leaveBattle: (battleId: string) => Promise<void>;
  submitAnswer: (questionId: string, answer: string) => Promise<TeamAnswerResult>;
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
      set({ current: null });
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

  // Single 2s poller while a battle is open (same pattern as the 1v1 store;
  // Phase A removed the doubled component-local interval).
  startPolling: (battleId) => {
    polledBattleId = battleId;
    if (!poller) {
      poller = createPoller(async () => {
        if (polledBattleId) {
          await get().fetchBattle(polledBattleId);
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
    set({ current: null, error: null });
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
