import { create } from 'zustand';
import type { XpEvent } from '@/types';
import { api } from '@/lib/api';

interface XpEventState {
  activeEvents: XpEvent[];
  currentMultiplier: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchActiveEvents: () => Promise<void>;
  getMultiplierForContext: (subjectId?: string, houseId?: string) => number;
  clearError: () => void;
}

export const useXpEventStore = create<XpEventState>((set, get) => ({
  activeEvents: [],
  currentMultiplier: 1,
  isLoading: false,
  error: null,

  fetchActiveEvents: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{
        events: Array<{
          id: string;
          name: string;
          description: string;
          multiplier: number;
          event_type: string;
          subject_id?: string;
          house_id?: string;
          start_time: string;
          end_time: string;
          is_active: number;
        }>;
      }>('/xp-events/active');

      if (response.success && response.data) {
        const now = Date.now();
        const events: XpEvent[] = response.data.events.map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          multiplier: e.multiplier,
          eventType: e.event_type as XpEvent['eventType'],
          subjectId: e.subject_id,
          houseId: e.house_id,
          startTime: e.start_time,
          endTime: e.end_time,
          isActive: !!e.is_active,
          timeRemaining: Math.max(0, new Date(e.end_time).getTime() - now),
        }));

        // Calculate highest global multiplier
        const globalMultiplier = events
          .filter((e) => e.eventType === 'global')
          .reduce((max, e) => Math.max(max, e.multiplier), 1);

        set({
          activeEvents: events,
          currentMultiplier: globalMultiplier,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch XP events',
        isLoading: false,
      });
    }
  },

  getMultiplierForContext: (subjectId, houseId) => {
    const { activeEvents } = get();
    let multiplier = 1;

    activeEvents.forEach((event) => {
      const isApplicable =
        event.eventType === 'global' ||
        (event.eventType === 'subject' && event.subjectId === subjectId) ||
        (event.eventType === 'house' && event.houseId === houseId);

      if (isApplicable) {
        multiplier = Math.max(multiplier, event.multiplier);
      }
    });

    return multiplier;
  },

  clearError: () => set({ error: null }),
}));
