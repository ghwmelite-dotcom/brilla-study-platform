import { create } from 'zustand';
import { api } from '@/services/api';
import type {
  TeacherDirectoryCard,
  TeacherDirectoryProfile,
  TeacherReview,
  TutoringRequest,
  TutoringSession,
  TeacherEarnings,
  DirectoryFilters,
  CreateTutoringRequestData,
  ReviewFormData,
} from '@/types/tutoring';

interface TutoringState {
  // Directory state
  teachers: TeacherDirectoryCard[];
  selectedTeacher: TeacherDirectoryProfile | null;
  teacherReviews: TeacherReview[];
  filters: DirectoryFilters;
  totalTeachers: number;
  hasMore: boolean;
  isLoadingDirectory: boolean;
  isLoadingProfile: boolean;

  // Student state
  myRequests: TutoringRequest[];
  mySessions: TutoringSession[];
  isLoadingRequests: boolean;
  isLoadingSessions: boolean;

  // Teacher state
  myProfile: TeacherDirectoryProfile | null;
  incomingRequests: TutoringRequest[];
  teacherSessions: TutoringSession[];
  earnings: TeacherEarnings | null;
  isLoadingMyProfile: boolean;
  isLoadingIncomingRequests: boolean;
  isLoadingEarnings: boolean;

  // Error state
  error: string | null;

  // Convenience computed property - true if any loading state is active
  isLoading: boolean;

  // Directory actions
  loadDirectory: (filters?: DirectoryFilters, append?: boolean) => Promise<void>;
  loadTeacherProfile: (id: string) => Promise<void>;
  loadTeacherReviews: (id: string, page?: number) => Promise<void>;
  setFilters: (filters: DirectoryFilters) => void;
  clearFilters: () => void;

  // Student actions
  createRequest: (data: CreateTutoringRequestData) => Promise<string>;
  loadMyRequests: (status?: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  loadMySessions: (upcoming?: boolean) => Promise<void>;
  submitReview: (sessionId: string, data: ReviewFormData) => Promise<void>;

  // Teacher actions
  loadMyProfile: () => Promise<void>;
  saveMyProfile: (data: Partial<TeacherDirectoryProfile>) => Promise<void>;
  updateMyProfile: (data: Partial<TeacherDirectoryProfile>) => Promise<void>; // Alias for saveMyProfile
  submitProfileForApproval: () => Promise<void>;
  loadIncomingRequests: (status?: string) => Promise<void>;
  acceptRequest: (requestId: string, response?: string, confirmedDatetime?: string) => Promise<void>;
  declineRequest: (requestId: string, reason?: string) => Promise<void>;
  loadTeacherSessions: () => Promise<void>;
  loadEarnings: () => Promise<void>;
  updatePayoutDetails: (data: {
    mobileMoneyNumber?: string;
    mobileMoneyProvider?: string;
    preferredPayoutMethod?: string;
  }) => Promise<void>;
  respondToReview: (reviewId: string, response: string) => Promise<void>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  teachers: [],
  selectedTeacher: null,
  teacherReviews: [],
  filters: {},
  totalTeachers: 0,
  hasMore: false,
  isLoadingDirectory: false,
  isLoadingProfile: false,
  myRequests: [],
  mySessions: [],
  isLoadingRequests: false,
  isLoadingSessions: false,
  myProfile: null,
  incomingRequests: [],
  teacherSessions: [],
  earnings: null,
  isLoadingMyProfile: false,
  isLoadingIncomingRequests: false,
  isLoadingEarnings: false,
  error: null,
  isLoading: false, // Will be computed
};

export const useTutoringStore = create<TutoringState>((set, get) => ({
  ...initialState,

  // ============================================
  // DIRECTORY ACTIONS
  // ============================================

  loadDirectory: async (filters?: DirectoryFilters, append = false) => {
    set({ isLoadingDirectory: true, error: null });
    try {
      const currentFilters = filters || get().filters;
      const page = currentFilters.page || 1;

      const queryParams = new URLSearchParams();
      if (currentFilters.search) queryParams.set('search', currentFilters.search);
      if (currentFilters.subjectId) queryParams.set('subjectId', currentFilters.subjectId);
      if (currentFilters.sessionTypes?.length) {
        queryParams.set('sessionType', currentFilters.sessionTypes[0]);
      }
      if (currentFilters.minRating) queryParams.set('minRating', currentFilters.minRating.toString());
      if (currentFilters.minHourlyRate) queryParams.set('minRate', currentFilters.minHourlyRate.toString());
      if (currentFilters.maxHourlyRate) queryParams.set('maxRate', currentFilters.maxHourlyRate.toString());
      if (currentFilters.sortBy) queryParams.set('sortBy', currentFilters.sortBy);
      queryParams.set('page', page.toString());
      queryParams.set('pageSize', (currentFilters.pageSize || 12).toString());

      const query = queryParams.toString();
      const response = await api.get<{
        teachers: TeacherDirectoryCard[];
        total: number;
        page: number;
        pageSize: number;
        hasMore: boolean;
      }>(`/tutoring/directory${query ? `?${query}` : ''}`);

      set({
        teachers: append ? [...get().teachers, ...response.teachers] : response.teachers,
        totalTeachers: response.total,
        hasMore: response.hasMore,
        filters: currentFilters,
        isLoadingDirectory: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load teachers',
        isLoadingDirectory: false,
      });
    }
  },

  loadTeacherProfile: async (id: string) => {
    set({ isLoadingProfile: true, error: null, selectedTeacher: null });
    try {
      const profile = await api.get<TeacherDirectoryProfile>(`/tutoring/directory/${id}`);
      set({ selectedTeacher: profile, isLoadingProfile: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load teacher profile',
        isLoadingProfile: false,
      });
    }
  },

  loadTeacherReviews: async (id: string, page = 1) => {
    try {
      const response = await api.get<{
        reviews: TeacherReview[];
        total: number;
        page: number;
        hasMore: boolean;
      }>(`/tutoring/directory/${id}/reviews?page=${page}`);

      set({
        teacherReviews: page === 1 ? response.reviews : [...get().teacherReviews, ...response.reviews],
      });
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  },

  setFilters: (filters: DirectoryFilters) => {
    set({ filters: { ...get().filters, ...filters, page: 1 } });
    get().loadDirectory();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().loadDirectory();
  },

  // ============================================
  // STUDENT ACTIONS
  // ============================================

  createRequest: async (data: CreateTutoringRequestData) => {
    set({ error: null });
    try {
      const response = await api.post<{ id: string }>('/tutoring/requests', data);
      await get().loadMyRequests();
      return response.id;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create request' });
      throw error;
    }
  },

  loadMyRequests: async (status?: string) => {
    set({ isLoadingRequests: true, error: null });
    try {
      const query = status ? `?status=${status}` : '';
      const response = await api.get<{ requests: TutoringRequest[] }>(`/tutoring/requests${query}`);
      set({ myRequests: response.requests, isLoadingRequests: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load requests',
        isLoadingRequests: false,
      });
    }
  },

  cancelRequest: async (requestId: string) => {
    try {
      await api.post(`/tutoring/requests/${requestId}/cancel`);
      await get().loadMyRequests();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to cancel request' });
      throw error;
    }
  },

  loadMySessions: async (upcoming = false) => {
    set({ isLoadingSessions: true, error: null });
    try {
      const query = upcoming ? '?upcoming=true' : '';
      const response = await api.get<{ sessions: TutoringSession[] }>(`/tutoring/sessions${query}`);
      set({ mySessions: response.sessions, isLoadingSessions: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load sessions',
        isLoadingSessions: false,
      });
    }
  },

  submitReview: async (sessionId: string, data: ReviewFormData) => {
    try {
      await api.post(`/tutoring/sessions/${sessionId}/review`, data);
      await get().loadMySessions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to submit review' });
      throw error;
    }
  },

  // ============================================
  // TEACHER ACTIONS
  // ============================================

  loadMyProfile: async () => {
    set({ isLoadingMyProfile: true, error: null });
    try {
      const profile = await api.get<TeacherDirectoryProfile | null>('/tutoring/teacher/profile');
      set({ myProfile: profile, isLoadingMyProfile: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load profile',
        isLoadingMyProfile: false,
      });
    }
  },

  saveMyProfile: async (data: Partial<TeacherDirectoryProfile>) => {
    set({ error: null });
    try {
      await api.post('/tutoring/teacher/profile', data);
      await get().loadMyProfile();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save profile' });
      throw error;
    }
  },

  // Alias for saveMyProfile for convenience
  updateMyProfile: async (data: Partial<TeacherDirectoryProfile>) => {
    return get().saveMyProfile(data);
  },

  submitProfileForApproval: async () => {
    set({ error: null });
    try {
      await api.post('/tutoring/teacher/profile/submit');
      await get().loadMyProfile();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to submit profile' });
      throw error;
    }
  },

  loadIncomingRequests: async (status?: string) => {
    set({ isLoadingIncomingRequests: true, error: null });
    try {
      const query = status ? `?status=${status}` : '';
      const response = await api.get<{ requests: TutoringRequest[] }>(`/tutoring/requests${query}`);
      set({ incomingRequests: response.requests, isLoadingIncomingRequests: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load requests',
        isLoadingIncomingRequests: false,
      });
    }
  },

  acceptRequest: async (requestId: string, response?: string, confirmedDatetime?: string) => {
    try {
      await api.post(`/tutoring/teacher/requests/${requestId}/accept`, {
        response,
        confirmedDatetime,
      });
      await get().loadIncomingRequests();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to accept request' });
      throw error;
    }
  },

  declineRequest: async (requestId: string, reason?: string) => {
    try {
      await api.post(`/tutoring/teacher/requests/${requestId}/decline`, { reason });
      await get().loadIncomingRequests();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to decline request' });
      throw error;
    }
  },

  loadTeacherSessions: async () => {
    set({ isLoadingSessions: true, error: null });
    try {
      const response = await api.get<{ sessions: TutoringSession[] }>('/tutoring/sessions');
      set({ teacherSessions: response.sessions, isLoadingSessions: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load sessions',
        isLoadingSessions: false,
      });
    }
  },

  loadEarnings: async () => {
    set({ isLoadingEarnings: true, error: null });
    try {
      const response = await api.get<{ earnings: TeacherEarnings }>('/tutoring/teacher/earnings');
      set({ earnings: response.earnings, isLoadingEarnings: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load earnings',
        isLoadingEarnings: false,
      });
    }
  },

  updatePayoutDetails: async (data) => {
    try {
      await api.put('/tutoring/teacher/payout-details', data);
      await get().loadEarnings();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update payout details' });
      throw error;
    }
  },

  respondToReview: async (reviewId: string, response: string) => {
    try {
      await api.post(`/tutoring/teacher/reviews/${reviewId}/respond`, { response });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to respond to review' });
      throw error;
    }
  },

  // ============================================
  // UTILITY
  // ============================================

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
