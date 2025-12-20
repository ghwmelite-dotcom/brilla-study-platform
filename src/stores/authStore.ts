import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PendingUserData, UserStatus, SchoolLevel } from '@/types';

// Full pending user with all registration data
export interface PendingUser extends PendingUserData {
  id: string;
  status: UserStatus;
  createdAt: string;
}

// Extended user with additional fields for management
export interface ManagedUser extends User {
  schoolName?: string;
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
  isActive: boolean;
  lastLoginAt?: string;
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
  role: 'student' | 'teacher' | 'admin';
  schoolLevel?: SchoolLevel;
  yearGroup?: number;
  schoolName?: string;
  house?: string;
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
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
  loadAllUsers: () => void;
  createUser: (data: CreateUserData) => Promise<ManagedUser>;
  updateUser: (userId: string, updates: Partial<ManagedUser>) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  reactivateUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserStats: () => UserStats;
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

// Storage keys (simulating database)
const PENDING_USERS_KEY = 'brilla-pending-users';
const ALL_USERS_KEY = 'brilla-all-users';

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

// Default demo users
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
          // Load all users from storage
          const allUsers = loadAllUsersFromStorage();

          // Find user in our user list
          const foundUser = allUsers.find(u => u.email === email);

          if (foundUser && password === 'password123') {
            if (!foundUser.isActive) {
              throw new Error('Your account has been deactivated. Please contact support.');
            }

            // Update last login
            foundUser.lastLoginAt = new Date().toISOString();
            saveAllUsersToStorage(allUsers);

            // Load pending users for admin
            if (foundUser.role === 'admin') {
              const pendingUsers = loadPendingUsersFromStorage();
              const pending = pendingUsers.filter(u => u.status === 'pending');
              set({ pendingUsers: pending, pendingCount: pending.length, allUsers });
            }

            set({
              user: foundUser,
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

      // User Management Actions
      loadAllUsers: () => {
        const allUsers = loadAllUsersFromStorage();
        set({ allUsers });
      },

      createUser: async (data: CreateUserData) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can create users');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        const allUsers = loadAllUsersFromStorage();

        // Check if email already exists
        if (allUsers.some(u => u.email === data.email)) {
          throw new Error('A user with this email already exists.');
        }

        // Check pending users too
        const pendingUsers = loadPendingUsersFromStorage();
        if (pendingUsers.some(u => u.email === data.email)) {
          throw new Error('A pending registration with this email already exists.');
        }

        const newUser: ManagedUser = {
          id: `user_${Date.now()}`,
          email: data.email,
          name: data.name,
          role: data.role,
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedUsers = [...allUsers, newUser];
        saveAllUsersToStorage(updatedUsers);
        set({ allUsers: updatedUsers });

        return newUser;
      },

      updateUser: async (userId: string, updates: Partial<ManagedUser>) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can update users');
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        const allUsers = loadAllUsersFromStorage();
        const userIndex = allUsers.findIndex(u => u.id === userId);

        if (userIndex === -1) {
          throw new Error('User not found');
        }

        // Don't allow changing email to an existing one
        if (updates.email && updates.email !== allUsers[userIndex].email) {
          if (allUsers.some(u => u.email === updates.email)) {
            throw new Error('A user with this email already exists.');
          }
        }

        allUsers[userIndex] = {
          ...allUsers[userIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        saveAllUsersToStorage(allUsers);
        set({ allUsers });
      },

      deactivateUser: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can deactivate users');
        }

        if (userId === user.id) {
          throw new Error('You cannot deactivate your own account');
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        const allUsers = loadAllUsersFromStorage();
        const userIndex = allUsers.findIndex(u => u.id === userId);

        if (userIndex === -1) {
          throw new Error('User not found');
        }

        allUsers[userIndex].isActive = false;
        allUsers[userIndex].updatedAt = new Date().toISOString();

        saveAllUsersToStorage(allUsers);
        set({ allUsers });
      },

      reactivateUser: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can reactivate users');
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        const allUsers = loadAllUsersFromStorage();
        const userIndex = allUsers.findIndex(u => u.id === userId);

        if (userIndex === -1) {
          throw new Error('User not found');
        }

        allUsers[userIndex].isActive = true;
        allUsers[userIndex].updatedAt = new Date().toISOString();

        saveAllUsersToStorage(allUsers);
        set({ allUsers });
      },

      deleteUser: async (userId: string) => {
        const { user } = get();
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can delete users');
        }

        if (userId === user.id) {
          throw new Error('You cannot delete your own account');
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        const allUsers = loadAllUsersFromStorage();
        const filteredUsers = allUsers.filter(u => u.id !== userId);

        if (filteredUsers.length === allUsers.length) {
          throw new Error('User not found');
        }

        saveAllUsersToStorage(filteredUsers);
        set({ allUsers: filteredUsers });
      },

      getUserStats: () => {
        const allUsers = loadAllUsersFromStorage();
        const pendingUsers = loadPendingUsersFromStorage();
        const pending = pendingUsers.filter(u => u.status === 'pending');

        const today = new Date().toDateString();
        const activeToday = allUsers.filter(u => {
          if (!u.lastLoginAt) return false;
          return new Date(u.lastLoginAt).toDateString() === today;
        }).length;

        return {
          total: allUsers.length,
          students: allUsers.filter(u => u.role === 'student' && u.isActive).length,
          teachers: allUsers.filter(u => u.role === 'teacher' && u.isActive).length,
          admins: allUsers.filter(u => u.role === 'admin' && u.isActive).length,
          pending: pending.length,
          activeToday,
        };
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
