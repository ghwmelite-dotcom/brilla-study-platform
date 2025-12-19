import { create } from 'zustand';
import type { Battle, Question, Difficulty } from '@/types';

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
      const response = await fetch('/api/battles/available');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch battles');
      }

      const battles = data.data.map((b: Record<string, unknown>) => ({
        id: b.id,
        challengerId: b.challenger_id,
        challengerName: b.challenger_name,
        challengerAvatar: b.challenger_avatar,
        opponentId: b.opponent_id,
        opponentName: b.opponent_name,
        subjectId: b.subject_id,
        subjectName: b.subject_name,
        status: b.status,
        difficulty: b.difficulty,
        questionCount: b.question_count,
        challengerScore: b.challenger_score,
        opponentScore: b.opponent_score,
        currentQuestion: b.current_question,
        createdAt: b.created_at,
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
      const response = await fetch(`/api/battles/${battleId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch battle');
      }

      const battle: Battle = {
        id: data.data.id,
        challengerId: data.data.challenger_id,
        challengerName: data.data.challenger_name,
        challengerAvatar: data.data.challenger_avatar,
        opponentId: data.data.opponent_id,
        opponentName: data.data.opponent_name,
        opponentAvatar: data.data.opponent_avatar,
        status: data.data.status,
        subjectId: data.data.subject_id,
        subjectName: data.data.subject_name,
        difficulty: data.data.difficulty,
        questionCount: data.data.question_count,
        questions: data.data.questions,
        challengerScore: data.data.challenger_score,
        opponentScore: data.data.opponent_score,
        currentQuestion: data.data.current_question,
        winnerId: data.data.winner_id,
        createdAt: data.data.created_at,
        startedAt: data.data.started_at,
        completedAt: data.data.completed_at,
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
      const response = await fetch(`/api/battles/history?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch history');
      }

      const battles = data.data.map((b: Record<string, unknown>) => ({
        id: b.id,
        challengerId: b.challenger_id,
        challengerName: b.challenger_name,
        opponentId: b.opponent_id,
        opponentName: b.opponent_name,
        status: b.status,
        subjectName: b.subject_name,
        difficulty: b.difficulty,
        challengerScore: b.challenger_score,
        opponentScore: b.opponent_score,
        winnerId: b.winner_id,
        createdAt: b.created_at,
        completedAt: b.completed_at,
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
      const response = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...options }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create battle');
      }

      const battle: Battle = {
        id: data.data.id,
        challengerId: data.data.challengerId,
        challengerName: data.data.challengerName,
        challengerAvatar: data.data.challengerAvatar,
        status: 'waiting',
        difficulty: data.data.difficulty,
        questionCount: data.data.questionCount,
        challengerScore: 0,
        opponentScore: 0,
        currentQuestion: 0,
        createdAt: data.data.createdAt,
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
      const response = await fetch(`/api/battles/${battleId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join battle');
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
      const response = await fetch(`/api/battles/${battleId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answer, questionIndex, timeTaken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer');
      }

      // Update local score
      if (data.data.isCorrect) {
        set((state) => ({ myScore: state.myScore + data.data.pointsEarned }));
      }

      return data.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to submit answer' });
      throw error;
    }
  },

  cancelBattle: async (battleId, userId) => {
    try {
      const response = await fetch(`/api/battles/${battleId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel battle');
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
