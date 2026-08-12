import { create } from 'zustand';
import type { House, HouseStanding, HousePoints } from '@/types';
import { fetchWithAuth } from '@/lib/api';

interface HouseState {
  houses: House[];
  standings: HouseStanding[];
  recentActivity: (HousePoints & { userName?: string; houseName?: string; houseColor?: string })[];
  userHouse: House | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchHouses: () => Promise<void>;
  fetchStandings: (period?: string) => Promise<void>;
  fetchActivity: (limit?: number) => Promise<void>;
  setUserHouse: (house: House | null) => void;
  awardPoints: (houseId: string, userId: string, points: number, source: string, sourceId?: string) => Promise<void>;
  createHouse: (userId: string, data: { name: string; color: string; icon?: string; description?: string }) => Promise<House>;
  updateUserHouse: (userId: string, houseId: string) => Promise<void>;
  clearError: () => void;
}

export const useHouseStore = create<HouseState>()((set, get) => ({
  houses: [],
  standings: [],
  recentActivity: [],
  userHouse: null,
  isLoading: false,
  error: null,

  fetchHouses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/houses');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch houses');
      }

      const houses = data.data.map((h: Record<string, unknown>) => ({
        id: h.id,
        name: h.name,
        color: h.color,
        icon: h.icon || 'shield',
        description: h.description,
        isDefault: h.is_default === 1,
        schoolId: h.school_id,
        memberCount: h.member_count,
        totalPoints: h.total_points,
        createdAt: h.created_at,
      }));

      set({ houses, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch houses',
        isLoading: false,
      });
    }
  },

  fetchStandings: async (period = 'all_time') => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/houses/standings?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch standings');
      }

      const standings = data.data.map((s: Record<string, unknown>) => ({
        id: `${s.house_id}_${period}`,
        houseId: s.house_id,
        houseName: s.house_name,
        houseColor: s.house_color,
        period: s.period,
        periodValue: s.period_value || 'all',
        totalPoints: s.total_points,
        memberCount: s.member_count,
        rank: s.rank,
      }));

      set({ standings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch standings',
        isLoading: false,
      });
    }
  },

  fetchActivity: async (limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/houses/activity?limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activity');
      }

      const recentActivity = data.data.map((a: Record<string, unknown>) => ({
        id: a.id,
        houseId: a.house_id,
        userId: a.user_id,
        points: a.points,
        source: a.source,
        sourceId: a.source_id,
        period: a.period,
        createdAt: a.created_at,
        userName: a.user_name,
        houseName: a.house_name,
        houseColor: a.house_color,
      }));

      set({ recentActivity, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activity',
        isLoading: false,
      });
    }
  },

  setUserHouse: (house) => set({ userHouse: house }),

  awardPoints: async (houseId, userId, points, source, sourceId) => {
    try {
      const response = await fetchWithAuth('/api/houses/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseId, userId, points, source, sourceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to award points');
      }

      // Refresh standings after awarding points
      await get().fetchStandings();
      await get().fetchActivity();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to award points',
      });
      throw error;
    }
  },

  createHouse: async (userId, houseData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithAuth('/api/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...houseData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create house');
      }

      const newHouse: House = {
        id: data.data.id,
        name: data.data.name,
        color: data.data.color,
        icon: data.data.icon || 'shield',
        description: data.data.description,
        isDefault: false,
        schoolId: data.data.schoolId,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        houses: [...state.houses, newHouse],
        isLoading: false,
      }));

      return newHouse;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create house',
        isLoading: false,
      });
      throw error;
    }
  },

  updateUserHouse: async (userId, houseId) => {
    try {
      const response = await fetchWithAuth(`/api/users/${userId}/house`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update house');
      }

      // Find and set the user's house
      const { houses } = get();
      const house = houses.find((h) => h.id === houseId);
      if (house) {
        set({ userHouse: house });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update house',
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
