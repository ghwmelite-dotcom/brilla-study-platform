import { create } from 'zustand';
import type {
  ChatReport,
  ChatModerationAction,
  ChatFilteredWord,
  ReportStatus,
  ReportResolution,
} from '@/types';
import { getApiUrl, getAuthHeaders } from '@/utils/api';

interface ModerationStats {
  reports: {
    byStatus: Array<{ status: string; count: number }>;
    byReason: Array<{ reason: string; count: number }>;
    thisWeek: number;
  };
  actions: {
    byType: Array<{ action_type: string; count: number }>;
    activeRestrictions: Array<{ action_type: string; count: number }>;
  };
  users: {
    topReporters: Array<{ id: string; name: string; report_count: number }>;
    mostReported: Array<{ id: string; name: string; report_count: number }>;
  };
}

interface UserModerationHistory {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
  };
  reportsAgainst: ChatReport[];
  reportsByUser: ChatReport[];
  moderationActions: ChatModerationAction[];
  activeRestrictions: ChatModerationAction[];
}

interface ModerationState {
  // Data
  reports: ChatReport[];
  moderationHistory: ChatModerationAction[];
  filteredWords: ChatFilteredWord[];
  stats: ModerationStats | null;
  userHistory: UserModerationHistory | null;

  // Pagination
  totalReports: number;
  reportsLimit: number;
  reportsOffset: number;

  // Loading states
  isLoadingReports: boolean;
  isLoadingHistory: boolean;
  isLoadingWords: boolean;
  isLoadingStats: boolean;
  isProcessing: boolean;

  // Error
  error: string | null;

  // Report actions
  fetchReports: (status?: ReportStatus, limit?: number, offset?: number) => Promise<void>;
  getReportDetails: (reportId: string) => Promise<{ report: ChatReport; userHistory: unknown } | null>;
  submitReport: (reportedUserId: string, reason: string, description?: string, messageId?: string, roomId?: string) => Promise<boolean>;
  reviewReport: (reportId: string, resolution: ReportResolution, notes?: string) => Promise<void>;
  dismissReport: (reportId: string, notes?: string) => Promise<void>;

  // Moderation actions
  fetchModerationHistory: (userId?: string, roomId?: string, actionType?: string) => Promise<void>;
  fetchUserHistory: (userId: string) => Promise<void>;
  muteUser: (userId: string, roomId?: string, duration?: number, reason?: string) => Promise<void>;
  unmuteUser: (userId: string, roomId?: string, reason?: string) => Promise<void>;
  banUser: (userId: string, roomId?: string, duration?: number, reason?: string) => Promise<void>;
  unbanUser: (userId: string, roomId?: string, reason?: string) => Promise<void>;
  warnUser: (userId: string, roomId?: string, reason?: string) => Promise<void>;
  kickUser: (userId: string, roomId: string, reason?: string) => Promise<void>;

  // Word filter actions
  fetchFilteredWords: () => Promise<void>;
  addFilteredWord: (word: string, severity?: 'low' | 'medium' | 'high', replacement?: string) => Promise<void>;
  removeFilteredWord: (id: string) => Promise<void>;
  updateFilteredWord: (id: string, updates: Partial<ChatFilteredWord>) => Promise<void>;
  checkContent: (content: string) => Promise<{ allowed: boolean; filteredContent: string | null; violations: Array<{ word: string; severity: string }> }>;

  // Stats
  fetchStats: () => Promise<void>;

  // Utility
  clearError: () => void;
  getReportsByStatus: (status: ReportStatus) => ChatReport[];
  getPendingReportsCount: () => number;
  clearAllData: () => void;
}

export const useModerationStore = create<ModerationState>()((set, get) => ({
  // Initial state
  reports: [],
  moderationHistory: [],
  filteredWords: [],
  stats: null,
  userHistory: null,
  totalReports: 0,
  reportsLimit: 50,
  reportsOffset: 0,
  isLoadingReports: false,
  isLoadingHistory: false,
  isLoadingWords: false,
  isLoadingStats: false,
  isProcessing: false,
  error: null,

  // Report actions
  fetchReports: async (status?: ReportStatus, limit = 50, offset = 0) => {
    set({ isLoadingReports: true, error: null });
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`${getApiUrl()}/moderation/reports?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch reports');
      }

      const data = await response.json();

      // Map API response to store format
      const reports: ChatReport[] = (data.reports || []).map((r: Record<string, unknown>) => ({
        id: r.id,
        reporterId: r.reporter_id,
        reportedUserId: r.reported_user_id,
        messageId: r.message_id,
        roomId: r.room_id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        resolution: r.resolution,
        reviewNotes: r.review_notes,
        reviewedBy: r.reviewed_by,
        createdAt: r.created_at,
        reviewedAt: r.reviewed_at,
        reporter: r.reporter_name ? { id: r.reporter_id, name: r.reporter_name } : undefined,
        reportedUser: r.reported_user_name ? { id: r.reported_user_id, name: r.reported_user_name } : undefined,
        reviewer: r.reviewer_name ? { id: r.reviewed_by, name: r.reviewer_name } : undefined,
        message: r.message_content ? { content: r.message_content } : undefined,
        room: r.room_name ? { id: r.room_id, name: r.room_name } : undefined,
      }));

      set({
        reports,
        totalReports: data.total || 0,
        reportsLimit: limit,
        reportsOffset: offset,
        isLoadingReports: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load reports',
        isLoadingReports: false,
      });
    }
  },

  getReportDetails: async (reportId: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/moderation/reports/${reportId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch report details');
      }

      return await response.json();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load report details' });
      return null;
    }
  },

  submitReport: async (reportedUserId: string, reason: string, description?: string, messageId?: string, roomId?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/reports`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          reason,
          description,
          message_id: messageId,
          room_id: roomId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      set({ isProcessing: false });
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to submit report',
        isProcessing: false,
      });
      return false;
    }
  },

  reviewReport: async (reportId: string, resolution: ReportResolution, notes?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'resolved',
          resolution,
          review_notes: notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to review report');
      }

      // Update local state
      set((state) => ({
        reports: state.reports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: 'resolved' as ReportStatus,
                resolution,
                reviewNotes: notes,
                reviewedAt: new Date().toISOString(),
              }
            : report
        ),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to review report',
        isProcessing: false,
      });
    }
  },

  dismissReport: async (reportId: string, notes?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'dismissed',
          review_notes: notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to dismiss report');
      }

      set((state) => ({
        reports: state.reports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: 'dismissed' as ReportStatus,
                reviewNotes: notes,
                reviewedAt: new Date().toISOString(),
              }
            : report
        ),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to dismiss report',
        isProcessing: false,
      });
    }
  },

  // Moderation actions
  fetchModerationHistory: async (userId?: string, roomId?: string, actionType?: string) => {
    set({ isLoadingHistory: true, error: null });
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (roomId) params.append('room_id', roomId);
      if (actionType) params.append('action_type', actionType);

      const response = await fetch(`${getApiUrl()}/moderation/actions?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch moderation history');
      }

      const data = await response.json();

      const actions: ChatModerationAction[] = (data.actions || []).map((a: Record<string, unknown>) => ({
        id: a.id,
        userId: a.user_id,
        roomId: a.room_id,
        moderatorId: a.moderator_id,
        actionType: a.action_type,
        reason: a.reason,
        duration: a.duration,
        expiresAt: a.expires_at,
        isActive: !!a.is_active,
        createdAt: a.created_at,
        user: a.user_name ? { id: a.user_id, name: a.user_name } : undefined,
        moderator: a.moderator_name ? { id: a.moderator_id, name: a.moderator_name } : undefined,
        room: a.room_name ? { id: a.room_id, name: a.room_name } : undefined,
      }));

      set({ moderationHistory: actions, isLoadingHistory: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load moderation history',
        isLoadingHistory: false,
      });
    }
  },

  fetchUserHistory: async (userId: string) => {
    set({ isLoadingHistory: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/user/${userId}/history`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch user history');
      }

      const data = await response.json();
      set({ userHistory: data, isLoadingHistory: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load user history',
        isLoadingHistory: false,
      });
    }
  },

  muteUser: async (userId: string, roomId?: string, duration = 60, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/actions/mute`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          room_id: roomId,
          duration,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mute user');
      }

      const data = await response.json();

      const newAction: ChatModerationAction = {
        id: data.actionId,
        userId,
        roomId,
        moderatorId: '',
        actionType: 'mute',
        reason,
        duration,
        expiresAt: data.expiresAt,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mute user',
        isProcessing: false,
      });
    }
  },

  unmuteUser: async (userId: string, roomId?: string, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/actions/unmute`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          room_id: roomId,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unmute user');
      }

      const data = await response.json();

      const newAction: ChatModerationAction = {
        id: data.actionId,
        userId,
        roomId,
        moderatorId: '',
        actionType: 'unmute',
        isActive: false,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to unmute user',
        isProcessing: false,
      });
    }
  },

  banUser: async (userId: string, roomId?: string, duration?: number, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/actions/ban`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          room_id: roomId,
          duration,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to ban user');
      }

      const data = await response.json();

      const newAction: ChatModerationAction = {
        id: data.actionId,
        userId,
        roomId,
        moderatorId: '',
        actionType: 'ban',
        reason,
        duration,
        expiresAt: data.expiresAt,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to ban user',
        isProcessing: false,
      });
    }
  },

  unbanUser: async (userId: string, roomId?: string, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/actions/unban`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          room_id: roomId,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unban user');
      }

      const data = await response.json();

      const newAction: ChatModerationAction = {
        id: data.actionId,
        userId,
        roomId,
        moderatorId: '',
        actionType: 'unban',
        isActive: false,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to unban user',
        isProcessing: false,
      });
    }
  },

  warnUser: async (userId: string, roomId?: string, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/actions/warn`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          room_id: roomId,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to warn user');
      }

      const data = await response.json();

      const newAction: ChatModerationAction = {
        id: data.actionId,
        userId,
        roomId,
        moderatorId: '',
        actionType: 'warn',
        reason,
        isActive: false,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to warn user',
        isProcessing: false,
      });
    }
  },

  kickUser: async (userId: string, roomId: string, reason?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/actions/kick`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          room_id: roomId,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to kick user');
      }

      const data = await response.json();

      const newAction: ChatModerationAction = {
        id: data.actionId,
        userId,
        roomId,
        moderatorId: '',
        actionType: 'kick',
        reason,
        isActive: false,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        moderationHistory: [newAction, ...state.moderationHistory],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to kick user',
        isProcessing: false,
      });
    }
  },

  // Word filter actions
  fetchFilteredWords: async () => {
    set({ isLoadingWords: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/filters`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch filtered words');
      }

      const data = await response.json();

      const words: ChatFilteredWord[] = (data.filters || []).map((f: Record<string, unknown>) => ({
        id: f.id,
        word: f.word,
        severity: f.severity,
        replacement: f.replacement,
        isActive: !!f.is_active,
        addedBy: f.added_by,
        createdAt: f.created_at,
      }));

      set({ filteredWords: words, isLoadingWords: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load filtered words',
        isLoadingWords: false,
      });
    }
  },

  addFilteredWord: async (word: string, severity: 'low' | 'medium' | 'high' = 'medium', replacement?: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/filters`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word, severity, replacement }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add filtered word');
      }

      const data = await response.json();

      const newWord: ChatFilteredWord = {
        id: data.filterId,
        word: word.toLowerCase(),
        severity,
        replacement: replacement || '***',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        filteredWords: [...state.filteredWords, newWord],
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add filtered word',
        isProcessing: false,
      });
    }
  },

  removeFilteredWord: async (id: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/filters/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove filtered word');
      }

      set((state) => ({
        filteredWords: state.filteredWords.filter((word) => word.id !== id),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to remove filtered word',
        isProcessing: false,
      });
    }
  },

  updateFilteredWord: async (id: string, updates: Partial<ChatFilteredWord>) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/filters/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          severity: updates.severity,
          replacement: updates.replacement,
          is_active: updates.isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update filtered word');
      }

      set((state) => ({
        filteredWords: state.filteredWords.map((word) =>
          word.id === id ? { ...word, ...updates } : word
        ),
        isProcessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update filtered word',
        isProcessing: false,
      });
    }
  },

  checkContent: async (content: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/moderation/check-content`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        // If check fails, allow the content
        return { allowed: true, filteredContent: content, violations: [] };
      }

      return await response.json();
    } catch {
      // If check fails, allow the content
      return { allowed: true, filteredContent: content, violations: [] };
    }
  },

  // Stats
  fetchStats: async () => {
    set({ isLoadingStats: true, error: null });
    try {
      const response = await fetch(`${getApiUrl()}/moderation/stats`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch stats');
      }

      const stats = await response.json();
      set({ stats, isLoadingStats: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load stats',
        isLoadingStats: false,
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

  clearAllData: () => {
    set({
      reports: [],
      moderationHistory: [],
      filteredWords: [],
      stats: null,
      userHistory: null,
      error: null,
    });
  },
}));
