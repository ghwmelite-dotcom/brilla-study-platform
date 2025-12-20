import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PendingUserData, UserStatus, SchoolLevel } from '@/types';

// Full pending user with all registration data
export interface PendingUser extends PendingUserData {
  id: string;
  status: UserStatus;
  createdAt: string;
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

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; status: UserStatus; message: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  clearError: () => void;

  // Admin actions
  loadPendingUsers: () => void;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string, reason: string) => Promise<void>;
  getPendingCount: () => number;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
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
}

// Storage key for pending users (simulating database)
const PENDING_USERS_KEY = 'brilla-pending-users';

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

      setUser: (user) => set({ user, isAuthenticated: !!user && user.status === 'approved' }),

      setToken: (token) => set({ token }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Demo login - check demo accounts first
          const demoUsers: Record<string, User> = {
            'admin@brilla.edu.gh': {
              id: 'admin_1',
              email: 'admin@brilla.edu.gh',
              name: 'System Admin',
              role: 'admin',
              status: 'approved',
              xpPoints: 0,
              level: 1,
              streakDays: 0,
              aiGradingCredits: 100,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            'teacher@brilla.edu.gh': {
              id: 'teacher_1',
              email: 'teacher@brilla.edu.gh',
              name: 'Demo Teacher',
              role: 'teacher',
              status: 'approved',
              xpPoints: 0,
              level: 1,
              streakDays: 0,
              aiGradingCredits: 50,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            'student@brilla.edu.gh': {
              id: 'student_1',
              email: 'student@brilla.edu.gh',
              name: 'Demo Student',
              role: 'student',
              status: 'approved',
              house: 'Blue House',
              yearGroup: 2,
              xpPoints: 1500,
              level: 5,
              streakDays: 7,
              aiGradingCredits: 10,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };

          // Check if it's a demo account
          const demoUser = demoUsers[email];
          if (demoUser && password === 'password123') {
            // Load pending users for admin
            if (demoUser.role === 'admin') {
              const pendingUsers = loadPendingUsersFromStorage();
              set({ pendingUsers, pendingCount: pendingUsers.length });
            }
            set({
              user: demoUser,
              token: 'demo-token',
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          // Check pending users (for registered users trying to login)
          const pendingUsers = loadPendingUsersFromStorage();
          const pendingUser = pendingUsers.find(u => u.email === email);

          if (pendingUser) {
            if (pendingUser.status === 'pending') {
              throw new Error('Your account is pending approval. You will receive a notification once approved.');
            } else if (pendingUser.status === 'rejected') {
              throw new Error('Your registration was not approved. Please contact support for more information.');
            }
          }

          // In production, this would call the actual API
          throw new Error('Invalid email or password. Try demo accounts with password: password123');
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
    }),
    {
      name: 'brilla-auth',
      version: 2,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
