import { create } from 'zustand';
import type { UserQuest, QuestTemplate, WeeklyChallenge, QuestType } from '@/types';
import { api } from '@/lib/api';

interface QuestState {
  // Data
  dailyQuests: UserQuest[];
  weeklyQuests: UserQuest[];
  weeklyChallenge: WeeklyChallenge | null;
  questTemplates: QuestTemplate[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDailyQuests: () => Promise<void>;
  fetchWeeklyQuests: () => Promise<void>;
  fetchWeeklyChallenge: () => Promise<void>;
  claimReward: (questId: string) => Promise<{ xp: number; coins?: number } | null>;
  updateQuestProgress: (requirementType: string, amount: number) => void;
  refreshQuests: () => Promise<void>;
  clearError: () => void;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  dailyQuests: [],
  weeklyQuests: [],
  weeklyChallenge: null,
  questTemplates: [],
  isLoading: false,
  error: null,

  fetchDailyQuests: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{
        quests: Array<{
          id: string;
          user_id: string;
          quest_template_id: string;
          progress: number;
          target: number;
          status: string;
          started_at: string;
          completed_at?: string;
          claimed_at?: string;
          expires_at: string;
          quest_name: string;
          quest_description: string;
          quest_icon: string;
          xp_reward: number;
          coin_reward?: number;
          difficulty: string;
          requirement_type: string;
        }>;
      }>('/quests/daily');

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch daily quests');
      }

      const dailyQuests: UserQuest[] = response.data.quests.map((q) => ({
        id: q.id,
        userId: q.user_id,
        questTemplateId: q.quest_template_id,
        progress: q.progress,
        target: q.target,
        status: q.status as UserQuest['status'],
        startedAt: q.started_at,
        completedAt: q.completed_at,
        claimedAt: q.claimed_at,
        expiresAt: q.expires_at,
        quest: {
          id: q.quest_template_id,
          name: q.quest_name,
          description: q.quest_description,
          icon: q.quest_icon,
          questType: 'daily' as QuestType,
          requirementType: q.requirement_type as QuestTemplate['requirementType'],
          requirementValue: q.target,
          xpReward: q.xp_reward,
          coinReward: q.coin_reward,
          difficulty: q.difficulty as QuestTemplate['difficulty'],
          isActive: true,
        },
      }));

      set({ dailyQuests, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch daily quests',
        isLoading: false,
      });
    }
  },

  fetchWeeklyQuests: async () => {
    try {
      const response = await api.get<{
        quests: Array<{
          id: string;
          user_id: string;
          quest_template_id: string;
          progress: number;
          target: number;
          status: string;
          started_at: string;
          completed_at?: string;
          claimed_at?: string;
          expires_at: string;
          quest_name: string;
          quest_description: string;
          quest_icon: string;
          xp_reward: number;
          coin_reward?: number;
          difficulty: string;
          requirement_type: string;
        }>;
      }>('/quests/weekly');

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch weekly quests');
      }

      const weeklyQuests: UserQuest[] = response.data.quests.map((q) => ({
        id: q.id,
        userId: q.user_id,
        questTemplateId: q.quest_template_id,
        progress: q.progress,
        target: q.target,
        status: q.status as UserQuest['status'],
        startedAt: q.started_at,
        completedAt: q.completed_at,
        claimedAt: q.claimed_at,
        expiresAt: q.expires_at,
        quest: {
          id: q.quest_template_id,
          name: q.quest_name,
          description: q.quest_description,
          icon: q.quest_icon,
          questType: 'weekly' as QuestType,
          requirementType: q.requirement_type as QuestTemplate['requirementType'],
          requirementValue: q.target,
          xpReward: q.xp_reward,
          coinReward: q.coin_reward,
          difficulty: q.difficulty as QuestTemplate['difficulty'],
          isActive: true,
        },
      }));

      set({ weeklyQuests });
    } catch (error) {
      console.error('Failed to fetch weekly quests:', error);
    }
  },

  fetchWeeklyChallenge: async () => {
    try {
      const response = await api.get<{
        challenge: {
          id: string;
          title: string;
          description: string;
          icon: string;
          start_date: string;
          end_date: string;
          requirement_type: string;
          requirement_value: number;
          xp_reward: number;
          bonus_reward?: string;
          is_active: number;
          subject_id?: string;
          user_progress?: number;
          user_status?: string;
        } | null;
      }>('/quests/weekly-challenge');

      if (response.success && response.data?.challenge) {
        const c = response.data.challenge;
        set({
          weeklyChallenge: {
            id: c.id,
            title: c.title,
            description: c.description,
            icon: c.icon,
            startDate: c.start_date,
            endDate: c.end_date,
            requirementType: c.requirement_type as WeeklyChallenge['requirementType'],
            requirementValue: c.requirement_value,
            xpReward: c.xp_reward,
            bonusReward: c.bonus_reward,
            isActive: !!c.is_active,
            subjectId: c.subject_id,
            userProgress: c.user_progress,
            userStatus: c.user_status as WeeklyChallenge['userStatus'],
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch weekly challenge:', error);
    }
  },

  claimReward: async (questId: string) => {
    try {
      const response = await api.post<{
        xp: number;
        coins?: number;
      }>(`/quests/${questId}/claim`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to claim reward');
      }

      // Update the quest status locally
      set((state) => ({
        dailyQuests: state.dailyQuests.map((q) =>
          q.id === questId ? { ...q, status: 'claimed' as const, claimedAt: new Date().toISOString() } : q
        ),
        weeklyQuests: state.weeklyQuests.map((q) =>
          q.id === questId ? { ...q, status: 'claimed' as const, claimedAt: new Date().toISOString() } : q
        ),
      }));

      return response.data;
    } catch (error) {
      console.error('Failed to claim reward:', error);
      return null;
    }
  },

  updateQuestProgress: (requirementType: string, amount: number) => {
    // Update local progress for matching quests
    set((state) => {
      const updateQuest = (quest: UserQuest): UserQuest => {
        if (quest.quest?.requirementType !== requirementType) return quest;
        if (quest.status !== 'active') return quest;

        const newProgress = Math.min(quest.progress + amount, quest.target);
        const isCompleted = newProgress >= quest.target;

        return {
          ...quest,
          progress: newProgress,
          status: isCompleted ? 'completed' : 'active',
          completedAt: isCompleted ? new Date().toISOString() : undefined,
        };
      };

      return {
        dailyQuests: state.dailyQuests.map(updateQuest),
        weeklyQuests: state.weeklyQuests.map(updateQuest),
      };
    });
  },

  refreshQuests: async () => {
    const { fetchDailyQuests, fetchWeeklyQuests, fetchWeeklyChallenge } = get();
    await Promise.all([fetchDailyQuests(), fetchWeeklyQuests(), fetchWeeklyChallenge()]);
  },

  clearError: () => set({ error: null }),
}));
