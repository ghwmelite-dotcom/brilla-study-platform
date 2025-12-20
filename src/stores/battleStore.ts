import { create } from 'zustand';
import type { Battle, Question, Difficulty } from '@/types';
import { api } from '@/lib/api';

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

  // Actions
  fetchAvailableBattles: () => Promise<void>;
  fetchBattle: (battleId: string) => Promise<void>;
  fetchBattleHistory: (userId: string) => Promise<void>;
  createBattle: (userId: string, options: { subjectId?: string; difficulty?: Difficulty; questionCount?: number }) => Promise<Battle>;
  joinBattle: (battleId: string, userId: string) => Promise<void>;
  submitAnswer: (battleId: string, userId: string, answer: string, questionIndex: number, timeTaken: number) => Promise<{ isCorrect: boolean; correctAnswer: string; explanation?: string; pointsEarned: number; battleComplete: boolean }>;
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
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch battle',
        isLoading: false,
      });
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
        status: 'waiting',
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

  submitAnswer: async (battleId, userId, answer, questionIndex, timeTaken) => {
    try {
      const response = await api.post<{ isCorrect: boolean; correctAnswer: string; explanation?: string; pointsEarned: number; battleComplete: boolean }>(`/battles/${battleId}/answer`, { userId, answer, questionIndex, timeTaken });

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
    const interval = setInterval(async () => {
      await get().fetchBattle(battleId);
    }, 2000);

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
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
