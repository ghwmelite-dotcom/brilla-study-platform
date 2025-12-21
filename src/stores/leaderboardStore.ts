import { create } from 'zustand';
import type { LeaderboardEntry, LeaderboardPeriod } from '@/types';
import { api } from '@/lib/api';

interface LeaderboardState {
  // Data
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  currentUserEntry: LeaderboardEntry | null;
  period: LeaderboardPeriod;
  totalParticipants: number;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLeaderboard: (period?: LeaderboardPeriod) => Promise<void>;
  fetchUserRank: (userId: string) => Promise<void>;
  setPeriod: (period: LeaderboardPeriod) => void;
  clearError: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],
  currentUserRank: null,
  currentUserEntry: null,
  period: 'weekly',
  totalParticipants: 0,
  isLoading: false,
  error: null,

  fetchLeaderboard: async (period?: LeaderboardPeriod) => {
    const selectedPeriod = period || get().period;
    set({ isLoading: true, error: null, period: selectedPeriod });

    try {
      const response = await api.get<{
        entries: Array<{
          id: string;
          user_id: string;
          user_name: string;
          user_avatar?: string;
          house?: string;
          score: number;
          rank?: number;
        }>;
        period: string;
        total?: number;
      }>(`/leaderboard?period=${selectedPeriod}`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch leaderboard');
      }

      const entries: LeaderboardEntry[] = response.data.entries.map((entry, index) => ({
        id: entry.id,
        userId: entry.user_id,
        userName: entry.user_name,
        userAvatar: entry.user_avatar,
        house: entry.house,
        period: selectedPeriod,
        score: entry.score,
        rank: entry.rank || index + 1,
      }));

      set({
        entries,
        totalParticipants: response.data.total || entries.length,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
        isLoading: false,
      });
    }
  },

  fetchUserRank: async (userId: string) => {
    try {
      const { entries, period } = get();

      // First check if user is in current entries
      const userEntry = entries.find(e => e.userId === userId);
      if (userEntry) {
        set({
          currentUserRank: userEntry.rank,
          currentUserEntry: userEntry,
        });
        return;
      }

      // If not in top 100, fetch their specific rank
      const response = await api.get<{
        rank: number;
        score: number;
        total: number;
      }>(`/leaderboard/user/${userId}?period=${period}`);

      if (response.success && response.data) {
        set({
          currentUserRank: response.data.rank,
          currentUserEntry: {
            id: `user_${userId}`,
            userId,
            userName: '',
            period,
            score: response.data.score,
            rank: response.data.rank,
          },
          totalParticipants: response.data.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user rank:', error);
    }
  },

  setPeriod: (period: LeaderboardPeriod) => {
    set({ period });
    get().fetchLeaderboard(period);
  },

  clearError: () => set({ error: null }),
}));
