import { create } from 'zustand';
import type { Battle, Question, Difficulty } from '@/types';
import { api } from '@/lib/api';
import { createPoller, type Poller } from '@/utils/polling';

// Ranked matchmaking types (spec 1.4b) — defined locally because
// src/types/index.ts is owned elsewhere.
export interface RankedQueueStatus {
  queued: boolean;
  matched: boolean;
  battleId?: string;
  rating?: number;
  queuedAt?: string;
}

export interface RankedDelta {
  battleId: string;
  delta: number;
  rating: number | null;
}

export interface RankedLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl?: string | null;
  rating: number;
  wins: number;
  losses: number;
}

let poller: Poller | null = null;
let polledBattleId: string | null = null;

interface BattleState {
  currentBattle: Battle | null;
  availableBattles: Battle[];
  battleHistory: Battle[];
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  myScore: number;
  opponentScore: number;
  isLoading: boolean;
  error: string | null;
  pollingInterval: NodeJS.Timeout | null;
  rankedQueueStatus: RankedQueueStatus | null;
  rankedLeaderboard: RankedLeaderboardEntry[];
  rankedLeaderboardLoading: boolean;

  // Actions
  fetchAvailableBattles: () => Promise<void>;
  fetchBattle: (battleId: string) => Promise<Battle | null>;
  fetchBattleHistory: (userId: string) => Promise<void>;
  createBattle: (userId: string, options: { subjectId?: string; difficulty?: Difficulty; questionCount?: number; vsBot?: boolean }) => Promise<Battle>;
  joinBattle: (battleId: string, userId: string) => Promise<void>;
  joinByCode: (code: string) => Promise<Battle>;
  joinRankedQueue: (options?: { subjectId?: string; difficulty?: Difficulty; questionCount?: number }) => Promise<Battle | null>;
  fetchRankedQueueStatus: () => Promise<RankedQueueStatus | null>;
  leaveRankedQueue: () => Promise<void>;
  fetchRankedDelta: (battleId: string) => Promise<RankedDelta | null>;
  fetchRankedLeaderboard: () => Promise<void>;
  submitAnswer: (battleId: string, userId: string, answer: string, questionIndex: number, timeTaken: number) => Promise<{ isCorrect: boolean; correctAnswer: string; correctOptionId: string | null; explanation?: string; pointsEarned: number; battleComplete: boolean }>;
  cancelBattle: (battleId: string, userId: string) => Promise<void>;
  startPolling: (battleId: string) => void;
  stopPolling: () => void;
  nextQuestion: () => void;
  resetBattle: () => void;
  clearError: () => void;
}

export const useBattleStore = create<BattleState>()((set, get) => ({
  currentBattle: null,
  availableBattles: [],
  battleHistory: [],
  currentQuestion: null,
  currentQuestionIndex: 0,
  myScore: 0,
  opponentScore: 0,
  isLoading: false,
  error: null,
  pollingInterval: null,
  rankedQueueStatus: null,
  rankedLeaderboard: [],
  rankedLeaderboardLoading: false,

  fetchAvailableBattles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Record<string, unknown>[]>('/battles/available');

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch battles');
      }

      const battles: Battle[] = response.data.map((b: Record<string, unknown>) => ({
        id: b.id as string,
        challengerId: b.challenger_id as string,
        challengerName: b.challenger_name as string,
        challengerAvatar: b.challenger_avatar as string | undefined,
        opponentId: b.opponent_id as string | undefined,
        opponentName: b.opponent_name as string | undefined,
        subjectId: b.subject_id as string | undefined,
        subjectName: b.subject_name as string | undefined,
        status: b.status as Battle['status'],
        difficulty: b.difficulty as Difficulty,
        questionCount: b.question_count as number,
        challengerScore: b.challenger_score as number,
        opponentScore: b.opponent_score as number,
        currentQuestion: b.current_question as number,
        createdAt: b.created_at as string,
      }));

      set({ availableBattles: battles, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch battles',
        isLoading: false,
      });
    }
  },

  fetchBattle: async (battleId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Record<string, unknown>>(`/battles/${battleId}`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch battle');
      }

      const data = response.data;
      const battle: Battle = {
        id: data.id as string,
        challengerId: data.challenger_id as string,
        challengerName: data.challenger_name as string,
        challengerAvatar: data.challenger_avatar as string | undefined,
        opponentId: data.opponent_id as string | undefined,
        opponentName: data.opponent_name as string | undefined,
        opponentAvatar: data.opponent_avatar as string | undefined,
        status: data.status as Battle['status'],
        subjectId: data.subject_id as string | undefined,
        subjectName: data.subject_name as string | undefined,
        difficulty: data.difficulty as Difficulty,
        questionCount: data.question_count as number,
        questions: data.questions as Question[] | undefined,
        challengerScore: data.challenger_score as number,
        opponentScore: data.opponent_score as number,
        currentQuestion: data.current_question as number,
        winnerId: data.winner_id as string | undefined,
        winnerStreak: data.winner_streak as number | undefined,
        winnerStreakBonus: data.winner_streak_bonus as number | undefined,
        createdAt: data.created_at as string,
        startedAt: data.started_at as string | undefined,
        completedAt: data.completed_at as string | undefined,
      };

      const currentQuestion = battle.questions?.[get().currentQuestionIndex] || null;

      set({
        currentBattle: battle,
        currentQuestion,
        isLoading: false,
      });
      return battle;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch battle',
        isLoading: false,
      });
      return null;
    }
  },

  fetchBattleHistory: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Record<string, unknown>[]>(`/battles/history?userId=${userId}`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch history');
      }

      const battles: Battle[] = response.data.map((b: Record<string, unknown>) => ({
        id: b.id as string,
        challengerId: b.challenger_id as string,
        challengerName: b.challenger_name as string,
        opponentId: b.opponent_id as string | undefined,
        opponentName: b.opponent_name as string | undefined,
        status: b.status as Battle['status'],
        subjectName: b.subject_name as string | undefined,
        difficulty: b.difficulty as Difficulty,
        questionCount: b.question_count as number || 0,
        currentQuestion: b.current_question as number || 0,
        challengerScore: b.challenger_score as number,
        opponentScore: b.opponent_score as number,
        winnerId: b.winner_id as string | undefined,
        createdAt: b.created_at as string,
        completedAt: b.completed_at as string | undefined,
      }));

      set({ battleHistory: battles, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch history',
        isLoading: false,
      });
    }
  },

  createBattle: async (userId, options) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<Record<string, unknown>>('/battles', { userId, ...options });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create battle');
      }

      const data = response.data;
      const battle: Battle = {
        id: data.id as string,
        challengerId: data.challengerId as string,
        challengerName: data.challengerName as string,
        challengerAvatar: data.challengerAvatar as string | undefined,
        opponentId: data.opponentId as string | undefined,
        opponentName: data.opponentName as string | undefined,
        status: (data.status as Battle['status']) || 'waiting',
        difficulty: data.difficulty as Difficulty,
        questionCount: data.questionCount as number,
        challengerScore: 0,
        opponentScore: 0,
        currentQuestion: 0,
        createdAt: data.createdAt as string,
      };

      set({ currentBattle: battle, isLoading: false });
      return battle;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create battle',
        isLoading: false,
      });
      throw error;
    }
  },

  joinBattle: async (battleId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/battles/${battleId}/join`, { userId });

      if (!response.success) {
        throw new Error(response.error || 'Failed to join battle');
      }

      // Fetch the updated battle
      await get().fetchBattle(battleId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to join battle',
        isLoading: false,
      });
      throw error;
    }
  },

  joinByCode: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ battleId: string }>('/battles/join-by-code', { code });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'No waiting battle with that code');
      }

      const battle = await get().fetchBattle(response.data.battleId);
      if (!battle) {
        throw new Error(get().error || 'Failed to load battle');
      }
      set({ isLoading: false });
      return battle;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to join battle',
        isLoading: false,
      });
      throw error;
    }
  },

  joinRankedQueue: async (options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<Record<string, unknown>>('/battles/ranked/queue', options);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to join ranked queue');
      }

      const data = response.data;
      if (data.queued) {
        const status: RankedQueueStatus = {
          queued: true,
          matched: false,
          rating: data.rating as number | undefined,
        };
        set({ rankedQueueStatus: status, isLoading: false });
        return null;
      }

      const b = data.battle as Record<string, unknown>;
      const battle: Battle = {
        id: b.id as string,
        challengerId: b.challengerId as string,
        challengerName: b.challengerName as string,
        challengerAvatar: b.challengerAvatar as string | undefined,
        opponentId: b.opponentId as string | undefined,
        opponentName: b.opponentName as string | undefined,
        opponentAvatar: b.opponentAvatar as string | undefined,
        status: (b.status as Battle['status']) || 'active',
        difficulty: b.difficulty as Difficulty,
        questionCount: b.questionCount as number,
        challengerScore: 0,
        opponentScore: 0,
        currentQuestion: 0,
        createdAt: b.createdAt as string,
      };

      set({ currentBattle: battle, rankedQueueStatus: { queued: false, matched: true, battleId: battle.id }, isLoading: false });
      return battle;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to join ranked queue',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchRankedQueueStatus: async () => {
    try {
      const response = await api.get<Record<string, unknown>>('/battles/ranked/queue/status');
      if (!response.success || !response.data) {
        return null;
      }
      const status: RankedQueueStatus = {
        queued: Boolean(response.data.queued),
        matched: Boolean(response.data.matched),
        battleId: response.data.battleId as string | undefined,
        rating: response.data.rating as number | undefined,
        queuedAt: response.data.queuedAt as string | undefined,
      };
      set({ rankedQueueStatus: status });
      return status;
    } catch {
      return null;
    }
  },

  leaveRankedQueue: async () => {
    try {
      await api.delete('/battles/ranked/queue');
    } finally {
      set((state) => ({
        rankedQueueStatus: state.rankedQueueStatus
          ? { ...state.rankedQueueStatus, queued: false, matched: false }
          : null,
      }));
    }
  },

  fetchRankedDelta: async (battleId) => {
    try {
      const response = await api.get<RankedDelta>(`/battles/ranked/delta/${battleId}`);
      if (!response.success || !response.data) {
        return null;
      }
      return response.data;
    } catch {
      // Unranked battles 404 — the results screen just hides the delta.
      return null;
    }
  },

  fetchRankedLeaderboard: async () => {
    set({ rankedLeaderboardLoading: true });
    try {
      const response = await api.get<RankedLeaderboardEntry[]>('/battles/ranked/leaderboard');
      if (response.success && response.data) {
        set({ rankedLeaderboard: response.data, rankedLeaderboardLoading: false });
      } else {
        set({ rankedLeaderboardLoading: false });
      }
    } catch {
      set({ rankedLeaderboardLoading: false });
    }
  },

  submitAnswer: async (battleId, userId, answer, questionIndex, timeTaken) => {
    try {
      const response = await api.post<{ isCorrect: boolean; correctAnswer: string; correctOptionId: string | null; explanation?: string; pointsEarned: number; battleComplete: boolean }>(`/battles/${battleId}/answer`, { userId, answer, questionIndex, timeTaken });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to submit answer');
      }

      // Update local score
      if (response.data.isCorrect) {
        set((state) => ({ myScore: state.myScore + response.data!.pointsEarned }));
      }

      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to submit answer' });
      throw error;
    }
  },

  cancelBattle: async (battleId, userId) => {
    try {
      const response = await api.post(`/battles/${battleId}/cancel`, { userId });

      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel battle');
      }

      get().stopPolling();
      set({ currentBattle: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to cancel battle' });
      throw error;
    }
  },

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

  nextQuestion: () => {
    const { currentBattle, currentQuestionIndex } = get();
    if (!currentBattle?.questions) return;

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < currentBattle.questions.length) {
      set({
        currentQuestionIndex: nextIndex,
        currentQuestion: currentBattle.questions[nextIndex],
      });
    }
  },

  resetBattle: () => {
    get().stopPolling();
    set({
      currentBattle: null,
      currentQuestion: null,
      currentQuestionIndex: 0,
      myScore: 0,
      opponentScore: 0,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
