import { create } from 'zustand';
import type { Achievement } from '@/types';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'xp' | 'streak' | 'level_up';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  icon?: string;
  // For achievements
  achievement?: Achievement;
  // For XP gains
  xpAmount?: number;
  // For level ups
  newLevel?: number;
  // For streaks
  streakDays?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Convenience methods
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;

  // Gamification toasts
  showAchievement: (achievement: Achievement) => void;
  showXpGain: (amount: number, reason?: string) => void;
  showLevelUp: (newLevel: number) => void;
  showStreak: (days: number) => void;
}

const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration (if not persistent)
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Basic toasts
  showSuccess: (title, message) => {
    get().addToast({ type: 'success', title, message });
  },

  showError: (title, message) => {
    get().addToast({ type: 'error', title, message, duration: 8000 });
  },

  showWarning: (title, message) => {
    get().addToast({ type: 'warning', title, message });
  },

  showInfo: (title, message) => {
    get().addToast({ type: 'info', title, message });
  },

  // Gamification toasts
  showAchievement: (achievement) => {
    get().addToast({
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: achievement.name,
      achievement,
      duration: 8000,
    });
  },

  showXpGain: (amount, reason) => {
    get().addToast({
      type: 'xp',
      title: `+${amount} XP`,
      message: reason,
      xpAmount: amount,
      duration: 3000,
    });
  },

  showLevelUp: (newLevel) => {
    get().addToast({
      type: 'level_up',
      title: 'Level Up!',
      message: `You reached Level ${newLevel}`,
      newLevel,
      duration: 8000,
    });
  },

  showStreak: (days) => {
    get().addToast({
      type: 'streak',
      title: `${days} Day Streak!`,
      message: days === 7 ? 'Week streak!' : days === 30 ? 'Month streak!' : 'Keep it up!',
      streakDays: days,
      duration: 5000,
    });
  },
}));
