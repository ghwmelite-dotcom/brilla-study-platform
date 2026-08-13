import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PendingUserData, UserStatus, SchoolLevel, UserRole } from '@/types';
import { api } from '@/lib/api';

// Full pending user with all registration data
export interface PendingUser extends PendingUserData {
  id: string;
  status: UserStatus;
  createdAt: string;
}

// Email verification status
export type EmailVerificationStatus = 'verified' | 'pending' | 'expired';

// Extended user with additional fields for management
export interface ManagedUser extends User {
  schoolName?: string;
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
  isActive: boolean;
  lastLoginAt?: string;
  // Email verification fields
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: string;
  passwordSet: boolean;
  // Password hash (in production, this would be hashed server-side)
  passwordHash?: string;
  // Parent-specific fields
  phoneNumber?: string;
  linkedStudentCount?: number;
}

// User stats for dashboard
export interface UserStats {
  total: number;
  students: number;
  teachers: number;
  admins: number;
  pending: number;
  activeToday: number;
}

// Data for creating a new user
export interface CreateUserData {
  email: string;
  name: string;
  role: UserRole;
  schoolLevel?: SchoolLevel;
  yearGroup?: number;
  schoolName?: string;
  house?: string;
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
  // Parent-specific fields
  phoneNumber?: string;
  // Turnstile token for bot protection
  turnstileToken?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Pending users (for admin approval workflow)
  pendingUsers: PendingUser[];
  pendingCount: number;

  // All users (for user management)
  allUsers: ManagedUser[];

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; status: UserStatus; message: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  clearError: () => void;

  // Admin actions - Approvals
  loadPendingUsers: () => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string, reason: string) => Promise<void>;
  getPendingCount: () => number;

  // Admin actions - User Management
  loadAllUsers: () => Promise<void>;
  createUser: (data: CreateUserData) => Promise<ManagedUser>;
  updateUser: (userId: string, updates: Partial<ManagedUser>) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  reactivateUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserStats: () => UserStats;
  resendVerificationEmail: (userId: string) => Promise<void>;

  // OAuth actions
  initiateGoogleAuth: (
    intent: 'login' | 'register',
    role?: 'student' | 'teacher' | 'admin' | 'parent',
    registrationData?: Record<string, unknown>,
    turnstileToken?: string
  ) => Promise<void>;
  completeGoogleAuth: (code: string, state: string) => Promise<{
    success: boolean;
    error?: string;
    code?: string;
    isNewUser?: boolean;
  }>;
  getLinkedProviders: () => Promise<{ hasPassword: boolean; providers: Array<{ provider: string; email: string }> }>;
  unlinkGoogle: () => Promise<void>;

  // Admin subscription management
  extendUserTrial: (userId: string, days: number) => Promise<{ newExpiryDate: string; daysAdded: number }>;
  addUserCredits: (userId: string, credits: number) => Promise<{ newTotal: number; creditsAdded: number }>;
  getUserSubscriptionDetails: (userId: string) => Promise<UserSubscriptionDetails | null>;
  setUserTier: (userId: string, tierId: string, durationDays: number) => Promise<{ tierName: string; expiresAt: string; creditsAdded: number }>;
}

// User subscription details for admin view
export interface UserSubscriptionDetails {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    aiGradingCredits: number;
  };
  trial: {
    id: string;
    status: 'active' | 'expired' | 'converted';
    startedAt: string;
    expiresAt: string;
    daysRemaining: number;
    tasksCompleted: number;
  } | null;
  subscription: {
    planName: string;
    status: string;
    billingCycle: 'monthly' | 'yearly';
    expiresAt: string;
    daysRemaining: number;
    aiGradingQuota: number;
  } | null;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  // Student fields
  schoolLevel?: SchoolLevel;
  yearGroup?: number;
  schoolName?: string;
  house?: string;
  // Teacher fields
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
  // Admin fields
  adminCode?: string;
  // Parent fields
  phoneNumber?: string;
  inviteCode?: string; // Optional: link to student during registration
  // Premium tier selection (for auto-trial on approval)
  selectedTierId?: string;
  // Turnstile token for bot protection
  turnstileToken?: string;
  // Exam type preferences (for students and teachers)
  examTypeIds?: string[];
  primaryExamTypeId?: string;
  // Affiliate referral/invite code (required when backend runs in invite mode)
  referralCode?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pendingUsers: [],
      pendingCount: 0,
      allUsers: [],

      setUser: (user) => set({ user, isAuthenticated: !!user && user.status === 'approved' }),

      setToken: (token) => {
        // Also update the API client token
        api.setToken(token);
        set({ token });
      },

      login: async (email, password, turnstileToken?) => {
        set({ isLoading: true, error: null });
        try {
          // Try the production API first
          const response = await api.login(email, password, turnstileToken);

          if (response.success && response.data) {
            const { user: apiUser, token } = response.data;

            // Map API user to local user format
            const user: ManagedUser = {
              id: apiUser.id,
              email: apiUser.email,
              name: apiUser.name,
              role: apiUser.role,
              status: apiUser.status as UserStatus,
              house: apiUser.house || undefined,
              yearGroup: apiUser.yearGroup || undefined,
              schoolLevel: apiUser.schoolLevel as SchoolLevel | undefined,
              schoolName: apiUser.schoolName || undefined,
              xpPoints: apiUser.xpPoints || 0,
              level: apiUser.level || 1,
              streakDays: apiUser.streakDays || 0,
              aiGradingCredits: apiUser.aiGradingCredits || 0,
              emailVerified: true,
              isActive: true,
              passwordSet: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Store the token in the API client
            api.setToken(token);

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          // If API returned an error (not network error), throw it
          if (response.error && !response.error.includes('Network error')) {
            throw new Error(response.error);
          }

          // API unreachable — no client-side demo fallback
          throw new Error('Network error. Please check your connection.');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          // Call the API to register user
          const response = await api.post<{ status?: string; message?: string; codeRequired?: boolean }>('/auth/register', {
            email: data.email,
            password: data.password,
            name: data.name,
            role: data.role,
            schoolLevel: data.schoolLevel,
            yearGroup: data.yearGroup,
            schoolName: data.schoolName,
            house: data.house,
            teacherLicenseNumber: data.teacherLicenseNumber,
            subjectsTaught: data.subjectsTaught,
            yearsExperience: data.yearsExperience,
            qualifications: data.qualifications,
            adminCode: data.adminCode,
            selectedTierId: data.selectedTierId,
            turnstileToken: data.turnstileToken,
            // Include exam type preferences
            examTypeIds: data.examTypeIds,
            primaryExamTypeId: data.primaryExamTypeId,
            // Affiliate referral/invite code (growth loop; required in invite mode)
            referralCode: data.referralCode,
          });

          set({ isLoading: false });

          // The envelope client never throws on success:false — surface API
          // errors (e.g. invite-mode codeRequired 400) to the caller.
          if (!response.success) {
            const err = new Error(response.error || 'Registration failed');
            if (response.data?.codeRequired) {
              (err as Error & { codeRequired?: boolean }).codeRequired = true;
            }
            throw err;
          }

          // Return status info from API response
          return {
            success: true,
            status: (response.data?.status || 'pending') as UserStatus,
            message: response.data?.message || 'Your registration is pending approval. You will be notified once an administrator reviews your application.',
          };
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        // Clear token from API client
        api.setToken(null);

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateProfile: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      clearError: () => set({ error: null }),

      // Admin actions
      loadPendingUsers: async () => {
        try {
          const response = await api.get<Record<string, unknown>[]>('/admin/users/pending');
          if (response.success && response.data) {
            const pending: PendingUser[] = response.data.map((u) => ({
              id: u.id as string,
              email: u.email as string,
              name: u.name as string,
              role: u.role as UserRole,
              status: 'pending' as const,
              schoolLevel: u.school_level as SchoolLevel | undefined,
              yearGroup: u.year_group as number | undefined,
              schoolName: u.school_name as string | undefined,
              house: u.house as string | undefined,
              teacherLicenseNumber: u.teacher_license_number as string | undefined,
              subjectsTaught: u.subjectsTaught as string[] | undefined,
              yearsExperience: u.years_experience as string | undefined,
              qualifications: u.qualifications as string | undefined,
              registeredAt: u.created_at as string,
              createdAt: u.created_at as string,
            }));
            set({ pendingUsers: pending, pendingCount: pending.length });
          } else {
            set({ pendingUsers: [], pendingCount: 0, error: response.error || 'Failed to load pending users' });
          }
        } catch (error) {
          console.error('Failed to load pending users:', error);
          set({ pendingUsers: [], pendingCount: 0, error: 'Failed to load pending users' });
        }
      },

      approveUser: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can approve users');
        }

        try {
          const response = await api.post(`/admin/users/${userId}/approve`, {});
          if (response.success) {
            // Refresh the pending list from API
            const { loadPendingUsers } = get();
            await loadPendingUsers();
          } else {
            throw new Error(response.error || 'Failed to approve user');
          }
        } catch (error) {
          console.error('Failed to approve user:', error);
          throw error;
        }
      },

      rejectUser: async (userId: string, reason: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can reject users');
        }

        try {
          const response = await api.post(`/admin/users/${userId}/reject`, { reason });
          if (response.success) {
            // Refresh the pending list from API
            const { loadPendingUsers } = get();
            await loadPendingUsers();
          } else {
            throw new Error(response.error || 'Failed to reject user');
          }
        } catch (error) {
          console.error('Failed to reject user:', error);
          throw error;
        }
      },

      getPendingCount: () => {
        return get().pendingCount;
      },

      // User Management Actions
      loadAllUsers: async () => {
        try {
          type UsersPage = {
            users: Record<string, unknown>[];
            total: number;
            page: number;
            limit: number;
          };
          // TODO: N sequential requests for large user bases — replace with
          // real UI pagination in UserManagement.tsx.
          const rawUsers: Record<string, unknown>[] = [];
          let page = 1;
          let total = Infinity;
          while (rawUsers.length < total) {
            const response = await api.get<UsersPage>(`/admin/users?page=${page}&limit=100`);
            if (!response.success || !response.data) {
              console.error('Failed to load users:', response.error);
              set({ allUsers: [], error: response.error || 'Failed to load users' });
              return;
            }
            total = response.data.total;
            rawUsers.push(...response.data.users);
            // Guard against a short/empty page looping forever
            if (response.data.users.length === 0) break;
            page += 1;
          }

          const users: ManagedUser[] = rawUsers.map((u: Record<string, unknown>) => ({
            id: u.id as string,
            email: u.email as string,
            name: u.name as string,
            role: u.role as UserRole,
            status: (u.status as UserStatus) || 'approved',
            house: u.house as string | undefined,
            yearGroup: u.year_group as number | undefined,
            schoolLevel: u.school_level as SchoolLevel | undefined,
            schoolName: u.school_name as string | undefined,
            teacherLicenseNumber: u.teacher_license_number as string | undefined,
            subjectsTaught: u.subjectsTaught as string[] | undefined,
            yearsExperience: u.years_experience as string | undefined,
            qualifications: u.qualifications as string | undefined,
            xpPoints: (u.xp_points as number) || 0,
            level: (u.level as number) || 1,
            streakDays: (u.streak_days as number) || 0,
            aiGradingCredits: (u.ai_grading_credits as number) || 0,
            isActive: (u.is_active as number) === 1,
            emailVerified: (u.email_verified as number) === 1,
            passwordSet: !!(u.password_hash),
            lastLoginAt: u.last_login_at as string | undefined,
            createdAt: u.created_at as string,
            updatedAt: u.updated_at as string,
          }));

          set({ allUsers: users });
        } catch (error) {
          console.error('Failed to load users from API:', error);
          set({ allUsers: [], error: 'Failed to load users' });
        }
      },

      createUser: async (data: CreateUserData) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can create users');
        }

        try {
          const response = await api.post<Record<string, unknown>>('/admin/users', {
            email: data.email,
            name: data.name,
            role: data.role,
            schoolLevel: data.schoolLevel,
            yearGroup: data.yearGroup,
            schoolName: data.schoolName,
            house: data.house,
            teacherLicenseNumber: data.teacherLicenseNumber,
            subjectsTaught: data.subjectsTaught,
            yearsExperience: data.yearsExperience,
            qualifications: data.qualifications,
          });

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to create user');
          }

          const u = response.data;
          const newUser: ManagedUser = {
            id: u.id as string,
            email: u.email as string,
            name: u.name as string,
            role: u.role as UserRole,
            status: 'approved',
            schoolLevel: data.schoolLevel,
            yearGroup: data.yearGroup,
            schoolName: data.schoolName,
            house: data.house,
            teacherLicenseNumber: data.teacherLicenseNumber,
            subjectsTaught: data.subjectsTaught,
            yearsExperience: data.yearsExperience,
            qualifications: data.qualifications,
            xpPoints: 0,
            level: 1,
            streakDays: 0,
            aiGradingCredits: data.role === 'admin' ? 100 : data.role === 'teacher' ? 50 : 10,
            isActive: true,
            emailVerified: false,
            passwordSet: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Refresh user list
          await get().loadAllUsers();

          return newUser;
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to create user');
        }
      },

      updateUser: async (userId: string, updates: Partial<ManagedUser>) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can update users');
        }

        try {
          const response = await api.put(`/admin/users/${userId}`, {
            name: updates.name,
            email: updates.email,
            schoolLevel: updates.schoolLevel,
            yearGroup: updates.yearGroup,
            schoolName: updates.schoolName,
            house: updates.house,
            teacherLicenseNumber: updates.teacherLicenseNumber,
            subjectsTaught: updates.subjectsTaught,
            yearsExperience: updates.yearsExperience,
            qualifications: updates.qualifications,
          });

          if (!response.success) {
            throw new Error(response.error || 'Failed to update user');
          }

          // Refresh user list
          await get().loadAllUsers();
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to update user');
        }
      },

      deactivateUser: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can deactivate users');
        }

        if (userId === user.id) {
          throw new Error('You cannot deactivate your own account');
        }

        try {
          const response = await api.post(`/admin/users/${userId}/deactivate`, {});

          if (!response.success) {
            throw new Error(response.error || 'Failed to deactivate user');
          }

          // Refresh user list
          await get().loadAllUsers();
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to deactivate user');
        }
      },

      reactivateUser: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can reactivate users');
        }

        try {
          const response = await api.post(`/admin/users/${userId}/reactivate`, {});

          if (!response.success) {
            throw new Error(response.error || 'Failed to reactivate user');
          }

          // Refresh user list
          await get().loadAllUsers();
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to reactivate user');
        }
      },

      deleteUser: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can delete users');
        }

        if (userId === user.id) {
          throw new Error('You cannot delete your own account');
        }

        try {
          const response = await api.delete(`/admin/users/${userId}`);

          if (!response.success) {
            throw new Error(response.error || 'Failed to delete user');
          }

          // Refresh user list
          await get().loadAllUsers();
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to delete user');
        }
      },

      getUserStats: () => {
        // Use the current allUsers from state (populated by loadAllUsers from API)
        const { allUsers } = get();

        const today = new Date().toDateString();
        const activeToday = allUsers.filter(u => {
          if (!u.lastLoginAt) return false;
          return new Date(u.lastLoginAt).toDateString() === today;
        }).length;

        // Count pending from allUsers (users with status 'pending')
        const pending = allUsers.filter(u => u.status === 'pending').length;

        return {
          total: allUsers.length,
          students: allUsers.filter(u => u.role === 'student' && u.isActive).length,
          teachers: allUsers.filter(u => u.role === 'teacher' && u.isActive).length,
          admins: allUsers.filter(u => u.role === 'admin' && u.isActive).length,
          pending,
          activeToday,
        };
      },

      resendVerificationEmail: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can resend verification emails');
        }

        try {
          const response = await api.post(`/admin/users/${userId}/resend-verification`, {});

          if (!response.success) {
            throw new Error(response.error || 'Failed to resend verification email');
          }

          // Refresh user list
          await get().loadAllUsers();
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to resend verification email');
        }
      },

      // OAuth actions
      initiateGoogleAuth: async (intent, role, registrationData, turnstileToken) => {
        try {
          const response = await api.post<{ authUrl: string; state: string }>('/auth/oauth/google/init', {
            intent,
            role,
            registrationData,
            turnstileToken,
          });

          if (response.success && response.data) {
            // Store state in sessionStorage for verification on callback
            sessionStorage.setItem('oauth_state', response.data.state);
            // Redirect to Google
            window.location.href = response.data.authUrl;
          } else {
            throw new Error(response.error || 'Failed to initiate Google authentication');
          }
        } catch (error) {
          console.error('OAuth init error:', error);
          throw error;
        }
      },

      completeGoogleAuth: async (code, state) => {
        try {
          interface OAuthCallbackResponse {
            user: {
              id: string;
              email: string;
              name: string;
              role: string;
              status: string;
              house?: string;
              yearGroup?: number;
              schoolLevel?: string;
              schoolName?: string;
              xpPoints?: number;
              level?: number;
              streakDays?: number;
              aiGradingCredits?: number;
            };
            token: string;
            isNewUser: boolean;
          }
          const response = await api.post<OAuthCallbackResponse>('/auth/oauth/google/callback', { code, state });

          if (response.success && response.data) {
            const { user: apiUser, token, isNewUser } = response.data;

            // Map API user to local user format
            const user: ManagedUser = {
              id: apiUser.id,
              email: apiUser.email,
              name: apiUser.name,
              role: apiUser.role as UserRole,
              status: apiUser.status as UserStatus,
              house: apiUser.house || undefined,
              yearGroup: apiUser.yearGroup || undefined,
              schoolLevel: apiUser.schoolLevel as SchoolLevel | undefined,
              schoolName: apiUser.schoolName || undefined,
              xpPoints: apiUser.xpPoints || 0,
              level: apiUser.level || 1,
              streakDays: apiUser.streakDays || 0,
              aiGradingCredits: apiUser.aiGradingCredits || 0,
              emailVerified: true,
              isActive: true,
              passwordSet: false, // Google users may not have password
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Update store
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Set token in API client
            api.setToken(token);

            return { success: true, isNewUser };
          } else {
            // Error response may include a code from API
            const errorResponse = response as { error?: string; code?: string };
            return {
              success: false,
              error: errorResponse.error || 'Authentication failed',
              code: errorResponse.code,
            };
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
          };
        }
      },

      getLinkedProviders: async () => {
        try {
          const response = await api.get<{ hasPassword: boolean; providers: { provider: string; email: string }[] }>('/auth/oauth/providers');
          if (response.success && response.data) {
            return response.data;
          }
          return { hasPassword: true, providers: [] };
        } catch {
          return { hasPassword: true, providers: [] };
        }
      },

      unlinkGoogle: async () => {
        try {
          const response = await api.delete('/auth/oauth/unlink/google');
          if (!response.success) {
            throw new Error(response.error || 'Failed to unlink Google account');
          }
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to unlink Google account');
        }
      },

      // Admin subscription management
      extendUserTrial: async (userId: string, days: number) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can extend user trials');
        }

        try {
          const response = await api.post<{ newExpiryDate: string; daysAdded: number }>(
            `/admin/users/${userId}/extend-trial`,
            { days }
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to extend trial');
          }

          return {
            newExpiryDate: response.data.newExpiryDate,
            daysAdded: response.data.daysAdded,
          };
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to extend trial');
        }
      },

      addUserCredits: async (userId: string, credits: number) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can add credits');
        }

        try {
          const response = await api.post<{ newTotal: number; creditsAdded: number }>(
            `/admin/users/${userId}/add-credits`,
            { credits }
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to add credits');
          }

          return {
            newTotal: response.data.newTotal,
            creditsAdded: response.data.creditsAdded,
          };
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to add credits');
        }
      },

      setUserTier: async (userId: string, tierId: string, durationDays: number) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can set subscription tiers');
        }

        try {
          const response = await api.post<{ tierName: string; expiresAt: string; creditsAdded: number }>(
            `/admin/users/${userId}/set-tier`,
            { tierId, durationDays }
          );

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to set subscription tier');
          }

          return response.data;
        } catch (error) {
          throw error instanceof Error ? error : new Error('Failed to set subscription tier');
        }
      },

      getUserSubscriptionDetails: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can view subscription details');
        }

        try {
          const response = await api.get<UserSubscriptionDetails>(`/admin/users/${userId}/subscription`);

          if (!response.success || !response.data) {
            return null;
          }

          return response.data;
        } catch (error) {
          console.error('Failed to get subscription details:', error);
          return null;
        }
      },
    }),
    {
      name: 'brilla-auth',
      version: 3,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore token to API client after rehydration
        if (state?.token) {
          api.setToken(state.token);
        }
      },
    }
  )
);
