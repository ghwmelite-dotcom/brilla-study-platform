import { create } from 'zustand';
import type {
  ChatReport,
  ChatModerationAction,
  ChatFilteredWord,
  ReportStatus,
  ReportResolution,
} from '@/types';

// Mock data for demo
const mockReports: ChatReport[] = [
  {
    id: 'report_1',
    reporterId: 'user_1',
    reportedUserId: 'user_5',
    messageId: 'msg_spam_1',
    roomId: 'room_wassce_physics',
    reason: 'spam',
    description: 'User is posting repeated promotional content',
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    reporter: { id: 'user_1', name: 'Kofi Mensah' },
    reportedUser: { id: 'user_5', name: 'Spam User' },
    message: { id: 'msg_spam_1', content: 'Buy cheap answers at...' },
    room: { id: 'room_wassce_physics', name: 'WASSCE Physics 2025' },
  },
  {
    id: 'report_2',
    reporterId: 'user_2',
    reportedUserId: 'user_6',
    roomId: 'room_nsmq_prep',
    reason: 'harassment',
    description: 'User is being rude and attacking other members',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    reporter: { id: 'user_2', name: 'Ama Asante' },
    reportedUser: { id: 'user_6', name: 'Rude User' },
    room: { id: 'room_nsmq_prep', name: 'NSMQ Prep Zone' },
  },
];

const mockModerationHistory: ChatModerationAction[] = [
  {
    id: 'action_1',
    userId: 'user_7',
    moderatorId: 'user_admin',
    actionType: 'warn',
    reason: 'Off-topic discussions',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    user: { id: 'user_7', name: 'Test User' },
    moderator: { id: 'user_admin', name: 'Admin User' },
  },
];

const mockFilteredWords: ChatFilteredWord[] = [
  { id: 'word_1', word: 'spam', severity: 'low', replacement: '***', isActive: true, createdAt: new Date().toISOString() },
  { id: 'word_2', word: 'scam', severity: 'high', replacement: '***', isActive: true, createdAt: new Date().toISOString() },
];

interface ModerationState {
  // Data
  reports: ChatReport[];
  moderationHistory: ChatModerationAction[];
  filteredWords: ChatFilteredWord[];

  // Loading states
  isLoadingReports: boolean;
  isLoadingHistory: boolean;
  isLoadingWords: boolean;
  isProcessing: boolean;

  // Error
  error: string | null;

  // Report actions
  fetchReports: (status?: ReportStatus) => Promise<void>;
  reviewReport: (reportId: string, resolution: ReportResolution, notes?: string) => Promise<void>;
  dismissReport: (reportId: string, notes?: string) => Promise<void>;

  // Moderation actions
  fetchModerationHistory: (userId?: string) => Promise<void>;
  muteUser: (userId: string, roomId?: string, duration?: number, reason?: string) => Promise<void>;
  unmuteUser: (userId: string, roomId?: string) => Promise<void>;
  banUser: (userId: string, roomId?: string, duration?: number, reason?: string) => Promise<void>;
  unbanUser: (userId: string, roomId?: string) => Promise<void>;
  warnUser: (userId: string, roomId?: string, reason?: string) => Promise<void>;
  kickUser: (userId: string, roomId: string, reason?: string) => Promise<void>;

  // Word filter actions
  fetchFilteredWords: () => Promise<void>;
  addFilteredWord: (word: string, severity?: 'low' | 'medium' | 'high') => Promise<void>;
  removeFilteredWord: (id: string) => Promise<void>;
  updateFilteredWord: (id: string, updates: Partial<ChatFilteredWord>) => Promise<void>;

  // Utility
  clearError: () => void;
  getReportsByStatus: (status: ReportStatus) => ChatReport[];
  getPendingReportsCount: () => number;
}

export const useModerationStore = create<ModerationState>()((set, get) => ({
  // Initial state
  reports: mockReports,
  moderationHistory: mockModerationHistory,
  filteredWords: mockFilteredWords,
  isLoadingReports: false,
  isLoadingHistory: false,
  isLoadingWords: false,
  isProcessing: false,
  error: null,

  // Report actions
  fetchReports: async (_status?: ReportStatus) => {
    set({ isLoadingReports: true, error: null });
    try {
      // TODO: Replace with API call that filters by _status
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ isLoadingReports: false });
    } catch (error) {
      set({
        error: 'Failed to load reports',
        isLoadingReports: false,
      });
    }
  },

  reviewReport: async (reportId: string, resolution: ReportResolution, notes?: string) => {
    set({ isProcessing: true, error: null });
    try {
      // TODO: Replace with API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      set((state) => ({
        reports: state.reports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: 'resolved' as ReportStatus,
                resolution,
                reviewNotes: notes,
                reviewedAt: new Date().toISOString(),
                reviewedBy: 'user_admin',
                reviewer: { id: 'user_admin', name: 'Admin User' },
              }
            : report
        ),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to review report',
        isProcessing: false,
      });
    }
  },

  dismissReport: async (reportId: string, notes?: string) => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      set((state) => ({
        reports: state.reports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: 'dismissed' as ReportStatus,
                reviewNotes: notes,
                reviewedAt: new Date().toISOString(),
                reviewedBy: 'user_admin',
              }
            : report
        ),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to dismiss report',
        isProcessing: false,
      });
    }
  },

  // Moderation actions
  fetchModerationHistory: async (_userId?: string) => {
    set({ isLoadingHistory: true, error: null });
    try {
      // TODO: Replace with API call that filters by _userId
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ isLoadingHistory: false });
    } catch (error) {
      set({
        error: 'Failed to load moderation history',
        isLoadingHistory: false,
      });
    }
  },

  muteUser: async (userId: string, roomId?: string, duration?: number, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newAction: ChatModerationAction = {
        id: `action_${Date.now()}`,
        userId,
        roomId,
        moderatorId: 'user_admin',
        actionType: 'mute',
        reason,
        duration,
        expiresAt: duration ? new Date(Date.now() + duration * 60000).toISOString() : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        user: { id: userId, name: 'User' },
        moderator: { id: 'user_admin', name: 'Admin User' },
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to mute user',
        isProcessing: false,
      });
    }
  },

  unmuteUser: async (userId: string, roomId?: string) => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newAction: ChatModerationAction = {
        id: `action_${Date.now()}`,
        userId,
        roomId,
        moderatorId: 'user_admin',
        actionType: 'unmute',
        isActive: true,
        createdAt: new Date().toISOString(),
        user: { id: userId, name: 'User' },
        moderator: { id: 'user_admin', name: 'Admin User' },
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to unmute user',
        isProcessing: false,
      });
    }
  },

  banUser: async (userId: string, roomId?: string, duration?: number, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newAction: ChatModerationAction = {
        id: `action_${Date.now()}`,
        userId,
        roomId,
        moderatorId: 'user_admin',
        actionType: 'ban',
        reason,
        duration,
        expiresAt: duration ? new Date(Date.now() + duration * 60000).toISOString() : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        user: { id: userId, name: 'User' },
        moderator: { id: 'user_admin', name: 'Admin User' },
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to ban user',
        isProcessing: false,
      });
    }
  },

  unbanUser: async (userId: string, roomId?: string) => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newAction: ChatModerationAction = {
        id: `action_${Date.now()}`,
        userId,
        roomId,
        moderatorId: 'user_admin',
        actionType: 'unban',
        isActive: true,
        createdAt: new Date().toISOString(),
        user: { id: userId, name: 'User' },
        moderator: { id: 'user_admin', name: 'Admin User' },
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to unban user',
        isProcessing: false,
      });
    }
  },

  warnUser: async (userId: string, roomId?: string, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newAction: ChatModerationAction = {
        id: `action_${Date.now()}`,
        userId,
        roomId,
        moderatorId: 'user_admin',
        actionType: 'warn',
        reason,
        isActive: true,
        createdAt: new Date().toISOString(),
        user: { id: userId, name: 'User' },
        moderator: { id: 'user_admin', name: 'Admin User' },
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to warn user',
        isProcessing: false,
      });
    }
  },

  kickUser: async (userId: string, roomId: string, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newAction: ChatModerationAction = {
        id: `action_${Date.now()}`,
        userId,
        roomId,
        moderatorId: 'user_admin',
        actionType: 'kick',
        reason,
        isActive: true,
        createdAt: new Date().toISOString(),
        user: { id: userId, name: 'User' },
        moderator: { id: 'user_admin', name: 'Admin User' },
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to kick user',
        isProcessing: false,
      });
    }
  },

  // Word filter actions
  fetchFilteredWords: async () => {
    set({ isLoadingWords: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ isLoadingWords: false });
    } catch (error) {
      set({
        error: 'Failed to load filtered words',
        isLoadingWords: false,
      });
    }
  },

  addFilteredWord: async (word: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newWord: ChatFilteredWord = {
        id: `word_${Date.now()}`,
        word: word.toLowerCase(),
        severity,
        replacement: '***',
        isActive: true,
        addedBy: 'user_admin',
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        filteredWords: [...state.filteredWords, newWord],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to add filtered word',
        isProcessing: false,
      });
    }
  },

  removeFilteredWord: async (id: string) => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      set((state) => ({
        filteredWords: state.filteredWords.filter((word) => word.id !== id),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to remove filtered word',
        isProcessing: false,
      });
    }
  },

  updateFilteredWord: async (id: string, updates: Partial<ChatFilteredWord>) => {
    set({ isProcessing: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      set((state) => ({
        filteredWords: state.filteredWords.map((word) =>
          word.id === id ? { ...word, ...updates } : word
        ),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to update filtered word',
        isProcessing: false,
      });
    }
  },

  // Utility
  clearError: () => set({ error: null }),

  getReportsByStatus: (status: ReportStatus) => {
    return get().reports.filter((report) => report.status === status);
  },

  getPendingReportsCount: () => {
    return get().reports.filter((report) => report.status === 'pending').length;
  },
}));
