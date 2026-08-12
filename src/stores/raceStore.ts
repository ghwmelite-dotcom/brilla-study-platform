import { create } from 'zustand';
import { api } from '@/lib/api';

export interface RaceCycle {
  id: string;
  scope: 'platform' | 'school';
  schoolId: string | null;
  targetPoints: number;
  startsAt: string;
  endsAt: string;
  targetHitAt: string | null;
}

export interface RaceEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
}

export interface RaceCurrent {
  cycle: RaceCycle | null;
  top: RaceEntry[];
  me: { rank: number; score: number } | null;
}

interface RaceState {
  // Data
  current: RaceCurrent | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCurrent: () => Promise<void>;
  clearError: () => void;
}

export const useRaceStore = create<RaceState>((set) => ({
  current: null,
  isLoading: false,
  error: null,

  fetchCurrent: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<RaceCurrent>('/race/current');

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch race');
      }

      set({ current: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch race',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
