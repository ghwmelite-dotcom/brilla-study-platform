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
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; status: UserStatus; message: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  clearError: () => void;

  // Admin actions - Approvals
  loadPendingUsers: () => void;
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

  // Email verification & password setup
  verifyToken: (token: string) => ManagedUser | null;
  setPassword: (token: string, password: string) => Promise<void>;
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
}

// Storage keys (simulating database for fallback/demo)
const PENDING_USERS_KEY = 'brilla-pending-users';
const ALL_USERS_KEY = 'brilla-all-users';

// Simple password hash (in production, use bcrypt on server)
const hashPassword = (password: string): string => {
  // Simple hash for demo - in production, this would be server-side bcrypt
  return btoa(password + '_brilla_salt');
};

// Helper to load pending users from localStorage
const loadPendingUsersFromStorage = (): PendingUser[] => {
  try {
    const stored = localStorage.getItem(PENDING_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save pending users to localStorage
const savePendingUsersToStorage = (users: PendingUser[]) => {
  localStorage.setItem(PENDING_USERS_KEY, JSON.stringify(users));
};

// Helper to load all users from localStorage
const loadAllUsersFromStorage = (): ManagedUser[] => {
  try {
    const stored = localStorage.getItem(ALL_USERS_KEY);
    return stored ? JSON.parse(stored) : getDefaultUsers();
  } catch {
    return getDefaultUsers();
  }
};

// Helper to save all users to localStorage
const saveAllUsersToStorage = (users: ManagedUser[]) => {
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
};

// Default demo users (these have passwords already set)
const getDefaultUsers = (): ManagedUser[] => [
  {
    id: 'admin_1',
    email: 'admin@brilla.edu.gh',
    name: 'System Admin',
    role: 'admin',
    status: 'approved',
    xpPoints: 0,
    level: 1,
    streakDays: 0,
    aiGradingCredits: 100,
    isActive: true,
    emailVerified: true,
    passwordSet: true,
    passwordHash: hashPassword('password123'),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'teacher_1',
    email: 'teacher@brilla.edu.gh',
    name: 'Demo Teacher',
    role: 'teacher',
    status: 'approved',
    schoolName: 'Achimota School',
    subjectsTaught: ['Mathematics', 'Physics'],
    yearsExperience: '6-10',
    xpPoints: 0,
    level: 1,
    streakDays: 0,
    aiGradingCredits: 50,
    isActive: true,
    emailVerified: true,
    passwordSet: true,
    passwordHash: hashPassword('password123'),
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'student_1',
    email: 'student@brilla.edu.gh',
    name: 'Demo Student',
    role: 'student',
    status: 'approved',
    house: 'Blue House',
    yearGroup: 2,
    schoolLevel: 'shs',
    schoolName: 'Achimota School',
    xpPoints: 1500,
    level: 5,
    streakDays: 7,
    aiGradingCredits: 10,
    isActive: true,
    emailVerified: true,
    passwordSet: true,
    passwordHash: hashPassword('password123'),
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

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

      setToken: (token) => set({ token }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Call the production API
          const response = await api.login(email, password);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Invalid email or password.');
          }

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
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));

          // Check if email already exists
          const existingPending = loadPendingUsersFromStorage();
          if (existingPending.some(u => u.email === data.email)) {
            throw new Error('An account with this email already exists.');
          }

          // Create pending user
          const newPendingUser: PendingUser = {
            id: `pending_${Date.now()}`,
            email: data.email,
            name: data.name,
            role: data.role,
            status: 'pending',
            schoolLevel: data.schoolLevel,
            yearGroup: data.yearGroup,
            schoolName: data.schoolName,
            house: data.house,
            teacherLicenseNumber: data.teacherLicenseNumber,
            subjectsTaught: data.subjectsTaught,
            yearsExperience: data.yearsExperience,
            qualifications: data.qualifications,
            adminCode: data.adminCode,
            registeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };

          // Save to "database" (localStorage)
          const updatedPending = [...existingPending, newPendingUser];
          savePendingUsersToStorage(updatedPending);

          set({ isLoading: false });

          // Return status info
          return {
            success: true,
            status: 'pending' as UserStatus,
            message: 'Your registration is pending approval. You will be notified once an administrator reviews your application.',
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
      loadPendingUsers: () => {
        const pendingUsers = loadPendingUsersFromStorage();
        const pending = pendingUsers.filter(u => u.status === 'pending');
        set({ pendingUsers: pending, pendingCount: pending.length });
      },

      approveUser: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can approve users');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        const allPending = loadPendingUsersFromStorage();
        const userIndex = allPending.findIndex(u => u.id === userId);

        if (userIndex === -1) {
          throw new Error('User not found');
        }

        // Update user status
        allPending[userIndex].status = 'approved';
        savePendingUsersToStorage(allPending);

        // Refresh the pending list
        const pending = allPending.filter(u => u.status === 'pending');
        set({ pendingUsers: pending, pendingCount: pending.length });

        // In production, this would also:
        // 1. Create the actual user account
        // 2. Send email notification to the user
        // 3. Log the approval action
      },

      rejectUser: async (userId: string, reason: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can reject users');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        const allPending = loadPendingUsersFromStorage();
        const userIndex = allPending.findIndex(u => u.id === userId);

        if (userIndex === -1) {
          throw new Error('User not found');
        }

        // Update user status
        allPending[userIndex].status = 'rejected';
        savePendingUsersToStorage(allPending);

        // Refresh the pending list
        const pending = allPending.filter(u => u.status === 'pending');
        set({ pendingUsers: pending, pendingCount: pending.length });

        // In production, this would also send rejection email with reason
        console.log(`User ${userId} rejected with reason: ${reason}`);
      },

      getPendingCount: () => {
        const pendingUsers = loadPendingUsersFromStorage();
        return pendingUsers.filter(u => u.status === 'pending').length;
      },

      // User Management Actions
      loadAllUsers: async () => {
        try {
          const response = await api.get<Record<string, unknown>[]>('/admin/users');
          if (!response.success || !response.data) {
            console.error('Failed to load users:', response.error);
            // Fall back to localStorage for demo mode
            const allUsers = loadAllUsersFromStorage();
            set({ allUsers });
            return;
          }

          const users: ManagedUser[] = response.data.map((u: Record<string, unknown>) => ({
            id: u.id as string,
            email: u.email as string,
            name: u.name as string,
            role: u.role as 'student' | 'teacher' | 'admin',
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
          // Fall back to localStorage for demo mode
          const allUsers = loadAllUsersFromStorage();
          set({ allUsers });
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
            role: u.role as 'student' | 'teacher' | 'admin',
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

      // Email verification & password setup
      verifyToken: (token: string) => {
        const allUsers = loadAllUsersFromStorage();
        const user = allUsers.find(u => u.verificationToken === token);

        if (!user) {
          return null;
        }

        // Check if token is expired
        if (user.verificationTokenExpiry) {
          const expiry = new Date(user.verificationTokenExpiry);
          if (expiry < new Date()) {
            return null; // Token expired
          }
        }

        return user;
      },

      setPassword: async (token: string, password: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const allUsers = loadAllUsersFromStorage();
        const userIndex = allUsers.findIndex(u => u.verificationToken === token);

        if (userIndex === -1) {
          throw new Error('Invalid or expired verification link.');
        }

        const user = allUsers[userIndex];

        // Check if token is expired
        if (user.verificationTokenExpiry) {
          const expiry = new Date(user.verificationTokenExpiry);
          if (expiry < new Date()) {
            throw new Error('This verification link has expired. Please request a new one.');
          }
        }

        // Set password and mark as verified
        allUsers[userIndex] = {
          ...user,
          passwordHash: hashPassword(password),
          passwordSet: true,
          emailVerified: true,
          verificationToken: undefined,
          verificationTokenExpiry: undefined,
          updatedAt: new Date().toISOString(),
        };

        saveAllUsersToStorage(allUsers);
        set({ allUsers });

        // Log success
        console.log('✅ Password set successfully for:', user.email);
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
    }),
    {
      name: 'brilla-auth',
      version: 3,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
