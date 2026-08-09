import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReminderSettings } from '@/types';
import { api } from '@/lib/api';

interface ReminderState {
  settings: ReminderSettings | null;
  isLoading: boolean;
  error: string | null;
  notificationPermission: NotificationPermission | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<ReminderSettings>) => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  scheduleLocalReminder: (title: string, body: string, delay: number) => void;
  clearError: () => void;
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,
      notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : null,

      fetchSettings: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get<{
            settings: {
              id: string;
              user_id: string;
              enabled: number;
              daily_goal_reminder: number;
              streak_reminder: number;
              quest_reminder: number;
              study_time: string;
              timezone: string;
              days_of_week: string;
              push_enabled: number;
              email_enabled: number;
            } | null;
          }>('/notifications/reminders/settings');

          if (response.success && response.data?.settings) {
            const s = response.data.settings;
            set({
              settings: {
                id: s.id,
                userId: s.user_id,
                enabled: !!s.enabled,
                dailyGoalReminder: !!s.daily_goal_reminder,
                streakReminder: !!s.streak_reminder,
                questReminder: !!s.quest_reminder,
                studyTime: s.study_time,
                timezone: s.timezone,
                daysOfWeek: s.days_of_week.split(',').map(Number),
                pushEnabled: !!s.push_enabled,
                emailEnabled: !!s.email_enabled,
              },
              isLoading: false,
            });
          } else {
            // Create default settings
            set({
              settings: {
                id: '',
                userId: '',
                enabled: true,
                dailyGoalReminder: true,
                streakReminder: true,
                questReminder: true,
                studyTime: '18:00',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                pushEnabled: false,
                emailEnabled: false,
              },
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch settings',
            isLoading: false,
          });
        }
      },

      updateSettings: async (updates) => {
        const { settings } = get();
        if (!settings) return false;

        try {
          const newSettings = { ...settings, ...updates };

          const response = await api.post('/notifications/reminders/settings', {
            enabled: newSettings.enabled,
            daily_goal_reminder: newSettings.dailyGoalReminder,
            streak_reminder: newSettings.streakReminder,
            quest_reminder: newSettings.questReminder,
            study_time: newSettings.studyTime,
            timezone: newSettings.timezone,
            days_of_week: newSettings.daysOfWeek.join(','),
            push_enabled: newSettings.pushEnabled,
            email_enabled: newSettings.emailEnabled,
          });

          if (response.success) {
            set({ settings: newSettings });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to update settings:', error);
          return false;
        }
      },

      requestNotificationPermission: async () => {
        if (typeof Notification === 'undefined') {
          return false;
        }

        try {
          const permission = await Notification.requestPermission();
          set({ notificationPermission: permission });
          return permission === 'granted';
        } catch (error) {
          console.error('Failed to request notification permission:', error);
          return false;
        }
      },

      scheduleLocalReminder: (title, body, delay) => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
          return;
        }

        setTimeout(() => {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'brilla-reminder',
          });
        }, delay);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-reminders',
      partialize: (state) => ({
        settings: state.settings,
        notificationPermission: state.notificationPermission,
      }),
    }
  )
);
