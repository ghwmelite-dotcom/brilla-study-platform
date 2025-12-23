import { create } from 'zustand';
import { api } from '@/lib/api';

// Types
export type NotificationType = 'achievement' | 'streak' | 'xp' | 'challenge' | 'content' | 'system' | 'reminder' | 'social';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface StreakDay {
  date: string;
  activityCount: number;
  xpEarned: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  todayCompleted: boolean;
  todayXP: number;
  history: StreakDay[];
}

export interface XPTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface XPBreakdown {
  type: string;
  total: number;
}

export interface XPData {
  totalXP: number;
  level: number;
  progressXP: number;
  neededXP: number;
  progressPercent: number;
  xpToNextLevel: number;
  transactions: XPTransaction[];
  breakdown: XPBreakdown[];
}

interface NotificationState {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  isLoadingNotifications: boolean;

  // Streak
  streakData: StreakData | null;
  isLoadingStreak: boolean;

  // XP
  xpData: XPData | null;
  isLoadingXP: boolean;

  // UI State
  isNotificationPanelOpen: boolean;
  isStreakPopupOpen: boolean;
  isXPPopupOpen: boolean;

  // Actions - Notifications
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

  // Actions - Streak
  fetchStreakData: () => Promise<void>;

  // Actions - XP
  fetchXPData: () => Promise<void>;

  // Actions - UI
  toggleNotificationPanel: () => void;
  toggleStreakPopup: () => void;
  toggleXPPopup: () => void;
  closeAllPopups: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoadingNotifications: false,

  streakData: null,
  isLoadingStreak: false,

  xpData: null,
  isLoadingXP: false,

  isNotificationPanelOpen: false,
  isStreakPopupOpen: false,
  isXPPopupOpen: false,

  // Notification actions
  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoadingNotifications: true });
    try {
      const response = await api.get<{
        notifications: Notification[];
        unreadCount: number;
      }>(`/notifications${unreadOnly ? '?unread=true' : ''}`);

      if (response.success && response.data) {
        set({
          notifications: response.data.notifications,
          unreadCount: response.data.unreadCount,
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoadingNotifications: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get<{ count: number }>('/notifications/count');
      if (response.success && response.data) {
        set({ unreadCount: response.data.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/read`, {});
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/read-all', {});
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      const notification = get().notifications.find((n) => n.id === notificationId);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: notification && !notification.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  // Streak actions
  fetchStreakData: async () => {
    set({ isLoadingStreak: true });
    try {
      const response = await api.get<StreakData>('/notifications/streak');
      if (response.success && response.data) {
        set({ streakData: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
    } finally {
      set({ isLoadingStreak: false });
    }
  },

  // XP actions
  fetchXPData: async () => {
    set({ isLoadingXP: true });
    try {
      const response = await api.get<XPData>('/notifications/xp');
      if (response.success && response.data) {
        set({ xpData: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch XP data:', error);
    } finally {
      set({ isLoadingXP: false });
    }
  },

  // UI actions
  toggleNotificationPanel: () => {
    const isOpen = !get().isNotificationPanelOpen;
    set({
      isNotificationPanelOpen: isOpen,
      isStreakPopupOpen: false,
      isXPPopupOpen: false,
    });
    if (isOpen) {
      get().fetchNotifications();
    }
  },

  toggleStreakPopup: () => {
    const isOpen = !get().isStreakPopupOpen;
    set({
      isStreakPopupOpen: isOpen,
      isNotificationPanelOpen: false,
      isXPPopupOpen: false,
    });
    if (isOpen) {
      get().fetchStreakData();
    }
  },

  toggleXPPopup: () => {
    const isOpen = !get().isXPPopupOpen;
    set({
      isXPPopupOpen: isOpen,
      isNotificationPanelOpen: false,
      isStreakPopupOpen: false,
    });
    if (isOpen) {
      get().fetchXPData();
    }
  },

  closeAllPopups: () => {
    set({
      isNotificationPanelOpen: false,
      isStreakPopupOpen: false,
      isXPPopupOpen: false,
    });
  },
}));
