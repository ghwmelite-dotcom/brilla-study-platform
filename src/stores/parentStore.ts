import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ParentStudentLink,
  ParentNotification,
  ParentNotificationPreferences,
  StudentProgressSummary,
  StudentActivity,
  InviteCodeResponse,
} from '@/types';
import { api } from '@/lib/api';

interface ParentState {
  // Linked students
  linkedStudents: ParentStudentLink[];
  selectedStudentId: string | null;

  // Student progress (cached by studentId)
  studentProgress: Record<string, StudentProgressSummary>;
  studentActivities: Record<string, StudentActivity[]>;

  // Notifications
  notifications: ParentNotification[];
  unreadCount: number;

  // Preferences
  preferences: ParentNotificationPreferences | null;

  // Invite code (for students)
  currentInviteCode: InviteCodeResponse | null;

  // Parent links (for student view)
  parentLinks: ParentStudentLink[];

  // Loading states
  isLoading: boolean;
  isLoadingProgress: boolean;
  isLoadingActivity: boolean;
  isLoadingNotifications: boolean;
  error: string | null;

  // Actions - Parent
  fetchLinkedStudents: () => Promise<void>;
  selectStudent: (studentId: string | null) => void;
  fetchStudentProgress: (studentId: string) => Promise<StudentProgressSummary | null>;
  fetchStudentActivity: (studentId: string, limit?: number) => Promise<StudentActivity[]>;
  linkStudent: (inviteCode: string, relationshipType?: 'parent' | 'guardian') => Promise<void>;

  // Actions - Notifications
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Actions - Preferences
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<ParentNotificationPreferences>) => Promise<void>;

  // Actions - Student (generating invite codes)
  generateInviteCode: () => Promise<InviteCodeResponse | null>;
  fetchParentLinks: () => Promise<void>;
  revokeParentAccess: (parentId: string) => Promise<void>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  linkedStudents: [],
  selectedStudentId: null,
  studentProgress: {},
  studentActivities: {},
  notifications: [],
  unreadCount: 0,
  preferences: null,
  currentInviteCode: null,
  parentLinks: [],
  isLoading: false,
  isLoadingProgress: false,
  isLoadingActivity: false,
  isLoadingNotifications: false,
  error: null,
};

export const useParentStore = create<ParentState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================
      // PARENT ACTIONS
      // ========================================

      fetchLinkedStudents: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<ParentStudentLink[]>('/parents/students');

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch linked students');
          }

          set({
            linkedStudents: response.data,
            isLoading: false,
          });

          // Auto-select first student if none selected
          if (!get().selectedStudentId && response.data.length > 0) {
            set({ selectedStudentId: response.data[0].studentId });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch students',
            isLoading: false,
          });
        }
      },

      selectStudent: (studentId) => {
        set({ selectedStudentId: studentId });
      },

      fetchStudentProgress: async (studentId) => {
        set({ isLoadingProgress: true, error: null });
        try {
          const response = await api.get<StudentProgressSummary>(
            `/parents/students/${studentId}/progress`
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch progress');
          }

          set((state) => ({
            studentProgress: {
              ...state.studentProgress,
              [studentId]: response.data!,
            },
            isLoadingProgress: false,
          }));

          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch progress',
            isLoadingProgress: false,
          });
          return null;
        }
      },

      fetchStudentActivity: async (studentId, limit = 30) => {
        set({ isLoadingActivity: true, error: null });
        try {
          const response = await api.get<StudentActivity[]>(
            `/parents/students/${studentId}/activity?limit=${limit}`
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch activity');
          }

          set((state) => ({
            studentActivities: {
              ...state.studentActivities,
              [studentId]: response.data!,
            },
            isLoadingActivity: false,
          }));

          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch activity',
            isLoadingActivity: false,
          });
          return [];
        }
      },

      linkStudent: async (inviteCode, relationshipType = 'parent') => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/parents/link', {
            inviteCode,
            relationshipType,
          });

          if (!response.success) {
            throw new Error(response.error || 'Failed to link student');
          }

          // Refresh linked students
          await get().fetchLinkedStudents();
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to link student',
            isLoading: false,
          });
          throw error;
        }
      },

      // ========================================
      // NOTIFICATION ACTIONS
      // ========================================

      fetchNotifications: async (unreadOnly = false) => {
        set({ isLoadingNotifications: true, error: null });
        try {
          const response = await api.get<{
            notifications: ParentNotification[];
            unreadCount: number;
          }>(`/parents/notifications?unreadOnly=${unreadOnly}`);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch notifications');
          }

          set({
            notifications: response.data.notifications,
            unreadCount: response.data.unreadCount,
            isLoadingNotifications: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch notifications',
            isLoadingNotifications: false,
          });
        }
      },

      markNotificationRead: async (id) => {
        try {
          await api.put(`/parents/notifications/${id}/read`, {});

          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      },

      markAllNotificationsRead: async () => {
        try {
          await api.put('/parents/notifications/read-all', {});

          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          }));
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error);
        }
      },

      // ========================================
      // PREFERENCES ACTIONS
      // ========================================

      fetchPreferences: async () => {
        try {
          const response = await api.get<ParentNotificationPreferences>('/parents/preferences');

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch preferences');
          }

          set({ preferences: response.data });
        } catch (error) {
          console.error('Failed to fetch preferences:', error);
          // Set defaults on error
          set({
            preferences: {
              achievementAlerts: true,
              streakAlerts: true,
              lowPerformanceAlerts: true,
              weeklySummary: true,
              emailNotifications: true,
              lowPerformanceThreshold: 40,
            },
          });
        }
      },

      updatePreferences: async (prefs) => {
        const current = get().preferences;
        const updated = { ...current, ...prefs } as ParentNotificationPreferences;

        // Optimistic update
        set({ preferences: updated });

        try {
          await api.put('/parents/preferences', updated);
        } catch (error) {
          // Revert on error
          set({ preferences: current });
          throw error;
        }
      },

      // ========================================
      // STUDENT ACTIONS (Invite code generation)
      // ========================================

      generateInviteCode: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<InviteCodeResponse>('/students/parent-invite', {});

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to generate invite code');
          }

          set({
            currentInviteCode: response.data,
            isLoading: false,
          });

          return response.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate code',
            isLoading: false,
          });
          return null;
        }
      },

      fetchParentLinks: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<ParentStudentLink[]>('/students/parent-links');

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch parent links');
          }

          set({
            parentLinks: response.data,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch parent links',
            isLoading: false,
          });
        }
      },

      revokeParentAccess: async (parentId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.delete(`/students/parent-link/${parentId}`);

          if (!response.success) {
            throw new Error(response.error || 'Failed to revoke parent access');
          }

          // Refresh parent links
          await get().fetchParentLinks();
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to revoke access',
            isLoading: false,
          });
          throw error;
        }
      },

      // ========================================
      // UTILITY
      // ========================================

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'brilla-parent',
      version: 1,
      partialize: (state) => ({
        selectedStudentId: state.selectedStudentId,
        preferences: state.preferences,
      }),
    }
  )
);
