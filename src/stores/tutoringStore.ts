import { create } from 'zustand';
import { api } from '@/lib/api';
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
      const res = await api.get<{
        teachers: TeacherDirectoryCard[];
        total: number;
        page: number;
        pageSize: number;
        hasMore: boolean;
      }>(`/tutoring/directory${query ? `?${query}` : ''}`);

      if (res.success && res.data) {
        set({
          teachers: append ? [...get().teachers, ...res.data.teachers] : res.data.teachers,
          totalTeachers: res.data.total,
          hasMore: res.data.hasMore,
          filters: currentFilters,
          isLoadingDirectory: false,
        });
      } else {
        set({
          error: res.error || 'Failed to load teachers',
          isLoadingDirectory: false,
        });
      }
  },

  loadTeacherProfile: async (id: string) => {
    set({ isLoadingProfile: true, error: null, selectedTeacher: null });
    const res = await api.get<TeacherDirectoryProfile>(`/tutoring/directory/${id}`);
    if (res.success && res.data) {
      set({ selectedTeacher: res.data, isLoadingProfile: false });
    } else {
      set({
        error: res.error || 'Failed to load teacher profile',
        isLoadingProfile: false,
      });
    }
  },

  loadTeacherReviews: async (id: string, page = 1) => {
    const res = await api.get<{
      reviews: TeacherReview[];
      total: number;
      page: number;
      hasMore: boolean;
    }>(`/tutoring/directory/${id}/reviews?page=${page}`);

    if (res.success && res.data) {
      set({
        teacherReviews: page === 1 ? res.data.reviews : [...get().teacherReviews, ...res.data.reviews],
      });
    } else {
      console.error('Failed to load reviews:', res.error);
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
    const res = await api.post<{ id: string }>('/tutoring/requests', data);
    if (!res.success || !res.data) {
      const message = res.error || 'Failed to create request';
      set({ error: message });
      throw new Error(message);
    }
    await get().loadMyRequests();
    return res.data.id;
  },

  loadMyRequests: async (status?: string) => {
    set({ isLoadingRequests: true, error: null });
    const query = status ? `?status=${status}` : '';
    const res = await api.get<{ requests: TutoringRequest[] }>(`/tutoring/requests${query}`);
    if (res.success && res.data) {
      set({ myRequests: res.data.requests, isLoadingRequests: false });
    } else {
      set({
        error: res.error || 'Failed to load requests',
        isLoadingRequests: false,
      });
    }
  },

  cancelRequest: async (requestId: string) => {
    const res = await api.post(`/tutoring/requests/${requestId}/cancel`);
    if (!res.success) {
      const message = res.error || 'Failed to cancel request';
      set({ error: message });
      throw new Error(message);
    }
    await get().loadMyRequests();
  },

  loadMySessions: async (upcoming = false) => {
    set({ isLoadingSessions: true, error: null });
    const query = upcoming ? '?upcoming=true' : '';
    const res = await api.get<{ sessions: TutoringSession[] }>(`/tutoring/sessions${query}`);
    if (res.success && res.data) {
      set({ mySessions: res.data.sessions, isLoadingSessions: false });
    } else {
      set({
        error: res.error || 'Failed to load sessions',
        isLoadingSessions: false,
      });
    }
  },

  submitReview: async (sessionId: string, data: ReviewFormData) => {
    const res = await api.post(`/tutoring/sessions/${sessionId}/review`, data);
    if (!res.success) {
      const message = res.error || 'Failed to submit review';
      set({ error: message });
      throw new Error(message);
    }
    await get().loadMySessions();
  },

  // ============================================
  // TEACHER ACTIONS
  // ============================================

  loadMyProfile: async () => {
    set({ isLoadingMyProfile: true, error: null });
    const res = await api.get<TeacherDirectoryProfile | null>('/tutoring/teacher/profile');
    if (res.success) {
      set({ myProfile: res.data ?? null, isLoadingMyProfile: false });
    } else {
      set({
        error: res.error || 'Failed to load profile',
        isLoadingMyProfile: false,
      });
    }
  },

  saveMyProfile: async (data: Partial<TeacherDirectoryProfile>) => {
    set({ error: null });
    const res = await api.post('/tutoring/teacher/profile', data);
    if (!res.success) {
      const message = res.error || 'Failed to save profile';
      set({ error: message });
      throw new Error(message);
    }
    await get().loadMyProfile();
  },

  // Alias for saveMyProfile for convenience
  updateMyProfile: async (data: Partial<TeacherDirectoryProfile>) => {
    return get().saveMyProfile(data);
  },

  submitProfileForApproval: async () => {
    set({ error: null });
    const res = await api.post('/tutoring/teacher/profile/submit');
    if (!res.success) {
      const message = res.error || 'Failed to submit profile';
      set({ error: message });
      throw new Error(message);
    }
    await get().loadMyProfile();
  },

  loadIncomingRequests: async (status?: string) => {
    set({ isLoadingIncomingRequests: true, error: null });
    const query = status ? `?status=${status}` : '';
    const res = await api.get<{ requests: TutoringRequest[] }>(`/tutoring/requests${query}`);
    if (res.success && res.data) {
      set({ incomingRequests: res.data.requests, isLoadingIncomingRequests: false });
    } else {
      set({
        error: res.error || 'Failed to load requests',
        isLoadingIncomingRequests: false,
      });
    }
  },

  acceptRequest: async (requestId: string, response?: string, confirmedDatetime?: string) => {
    const res = await api.post(`/tutoring/teacher/requests/${requestId}/accept`, {
      response,
      confirmedDatetime,
    });
    if (!res.success) {
      const message = res.error || 'Failed to accept request';
      set({ error: message });
      throw new Error(message);
    }
    await get().loadIncomingRequests();
  },

  declineRequest: async (requestId: string, reason?: string) => {
    const res = await api.post(`/tutoring/teacher/requests/${requestId}/decline`, { reason });
    if (!res.success) {
      const message = res.error || 'Failed to decline request';
      set({ error: message });
      throw new Error(message);
    }
    await get().loadIncomingRequests();
  },

  loadTeacherSessions: async () => {
    set({ isLoadingSessions: true, error: null });
    const res = await api.get<{ sessions: TutoringSession[] }>('/tutoring/sessions');
    if (res.success && res.data) {
      set({ teacherSessions: res.data.sessions, isLoadingSessions: false });
    } else {
      set({
        error: res.error || 'Failed to load sessions',
        isLoadingSessions: false,
      });
    }
  },

  loadEarnings: async () => {
    set({ isLoadingEarnings: true, error: null });
    const res = await api.get<{ earnings: TeacherEarnings }>('/tutoring/teacher/earnings');
    if (res.success && res.data) {
      set({ earnings: res.data.earnings, isLoadingEarnings: false });
    } else {
      set({
        error: res.error || 'Failed to load earnings',
        isLoadingEarnings: false,
      });
    }
  },

  updatePayoutDetails: async (data) => {
    const res = await api.put('/tutoring/teacher/payout-details', data);
    if (!res.success) {
      const message = res.error || 'Failed to update payout details';
      set({ error: message });
      throw new Error(message);
    }
    await get().loadEarnings();
  },

  respondToReview: async (reviewId: string, response: string) => {
    const res = await api.post(`/tutoring/teacher/reviews/${reviewId}/respond`, { response });
    if (!res.success) {
      const message = res.error || 'Failed to respond to review';
      set({ error: message });
      throw new Error(message);
    }
  },

  // ============================================
  // UTILITY
  // ============================================

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
