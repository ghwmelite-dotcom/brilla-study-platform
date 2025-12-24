import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AffiliateProfile,
  AffiliateDashboard,
  AffiliateReferral,
  AffiliateCommission,
  AffiliateChallenge,
  AffiliateAchievement,
  AffiliateLeaderboardEntry,
  SchoolLeaderboardEntry,
  AffiliatePayout,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface AffiliateState {
  // State
  profile: AffiliateProfile | null;
  dashboard: AffiliateDashboard | null;
  referrals: AffiliateReferral[];
  commissions: AffiliateCommission[];
  challenges: AffiliateChallenge[];
  achievements: AffiliateAchievement[];
  leaderboard: AffiliateLeaderboardEntry[];
  schoolLeaderboard: SchoolLeaderboardEntry[];
  payouts: AffiliatePayout[];
  isAffiliate: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  joinProgram: () => Promise<boolean>;
  fetchReferrals: (status?: string) => Promise<void>;
  fetchCommissions: (status?: string) => Promise<void>;
  fetchChallenges: () => Promise<void>;
  claimChallenge: (challengeId: string) => Promise<{ xpAwarded: number; cashAwarded: number } | null>;
  fetchAchievements: () => Promise<void>;
  fetchLeaderboard: (period?: string) => Promise<void>;
  fetchSchoolLeaderboard: (period?: string) => Promise<void>;
  fetchPayouts: () => Promise<void>;
  requestPayout: (amount: number) => Promise<boolean>;
  updateMobileMoneyDetails: (number: string, provider: 'mtn' | 'vodafone' | 'airteltigo') => Promise<boolean>;
  copyReferralLink: () => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  profile: null,
  dashboard: null,
  referrals: [],
  commissions: [],
  challenges: [],
  achievements: [],
  leaderboard: [],
  schoolLeaderboard: [],
  payouts: [],
  isAffiliate: false,
  isLoading: false,
  error: null,
};

export const useAffiliateStore = create<AffiliateState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ isLoading: false, isAffiliate: false });
            return;
          }

          const response = await fetch(`${API_BASE}/affiliates/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({ profile: data.data, isAffiliate: true, isLoading: false });
          } else {
            set({ isAffiliate: false, isLoading: false });
          }
        } catch {
          set({ error: 'Failed to fetch profile', isLoading: false, isAffiliate: false });
        }
      },

      fetchDashboard: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ isLoading: false });
            return;
          }

          const response = await fetch(`${API_BASE}/affiliates/dashboard`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({ dashboard: data.data, isAffiliate: true, isLoading: false });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch {
          set({ error: 'Failed to fetch dashboard', isLoading: false });
        }
      },

      joinProgram: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ error: 'Not authenticated', isLoading: false });
            return false;
          }

          const response = await fetch(`${API_BASE}/affiliates/join`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            // Fetch full profile
            await get().fetchProfile();
            set({ isAffiliate: true, isLoading: false });
            return true;
          } else {
            set({ error: data.error, isLoading: false });
            return false;
          }
        } catch {
          set({ error: 'Failed to join program', isLoading: false });
          return false;
        }
      },

      fetchReferrals: async (status?: string) => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return;

          let url = `${API_BASE}/affiliates/referrals`;
          if (status) url += `?status=${status}`;

          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({ referrals: data.data.referrals });
          }
        } catch {
          console.error('Failed to fetch referrals');
        }
      },

      fetchCommissions: async (status?: string) => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return;

          let url = `${API_BASE}/affiliates/commissions`;
          if (status) url += `?status=${status}`;

          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({ commissions: data.data });
          }
        } catch {
          console.error('Failed to fetch commissions');
        }
      },

      fetchChallenges: async () => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return;

          const response = await fetch(`${API_BASE}/affiliates/challenges`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({ challenges: data.data });
          }
        } catch {
          console.error('Failed to fetch challenges');
        }
      },

      claimChallenge: async (challengeId: string) => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return null;

          const response = await fetch(`${API_BASE}/affiliates/challenges/${challengeId}/claim`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            // Refresh challenges
            await get().fetchChallenges();
            return {
              xpAwarded: data.data.xpAwarded,
              cashAwarded: data.data.cashAwarded,
            };
          }
          return null;
        } catch {
          console.error('Failed to claim challenge');
          return null;
        }
      },

      fetchAchievements: async () => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return;

          const response = await fetch(`${API_BASE}/affiliates/achievements`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({ achievements: data.data });
          }
        } catch {
          console.error('Failed to fetch achievements');
        }
      },

      fetchLeaderboard: async (period: string = 'monthly') => {
        try {
          const token = localStorage.getItem('brilla_token');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(`${API_BASE}/affiliates/leaderboard?period=${period}`, {
            headers,
          });
          const data = await response.json();

          if (data.success) {
            set({ leaderboard: data.data.leaderboard });
          }
        } catch {
          console.error('Failed to fetch leaderboard');
        }
      },

      fetchSchoolLeaderboard: async (period: string = 'monthly') => {
        try {
          const token = localStorage.getItem('brilla_token');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(`${API_BASE}/affiliates/leaderboard/schools?period=${period}`, {
            headers,
          });
          const data = await response.json();

          if (data.success) {
            set({ schoolLeaderboard: data.data.leaderboard });
          }
        } catch {
          console.error('Failed to fetch school leaderboard');
        }
      },

      fetchPayouts: async () => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return;

          const response = await fetch(`${API_BASE}/payments/payouts`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({ payouts: data.data });
          }
        } catch {
          console.error('Failed to fetch payouts');
        }
      },

      requestPayout: async (amount: number) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ error: 'Not authenticated', isLoading: false });
            return false;
          }

          const response = await fetch(`${API_BASE}/payments/payout/request`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount }),
          });
          const data = await response.json();

          set({ isLoading: false });

          if (data.success) {
            // Refresh data
            await get().fetchProfile();
            await get().fetchPayouts();
            return true;
          } else {
            set({ error: data.error });
            return false;
          }
        } catch {
          set({ error: 'Failed to request payout', isLoading: false });
          return false;
        }
      },

      updateMobileMoneyDetails: async (number: string, provider: 'mtn' | 'vodafone' | 'airteltigo') => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ error: 'Not authenticated', isLoading: false });
            return false;
          }

          const response = await fetch(`${API_BASE}/payments/mobile-money`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mobileMoneyNumber: number,
              mobileMoneyProvider: provider,
            }),
          });
          const data = await response.json();

          set({ isLoading: false });

          if (data.success) {
            // Refresh profile
            await get().fetchProfile();
            return true;
          } else {
            set({ error: data.error });
            return false;
          }
        } catch {
          set({ error: 'Failed to update mobile money details', isLoading: false });
          return false;
        }
      },

      copyReferralLink: async () => {
        const { profile } = get();
        if (!profile?.referralLink) return false;

        try {
          await navigator.clipboard.writeText(profile.referralLink);
          return true;
        } catch {
          console.error('Failed to copy referral link');
          return false;
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'brilla-affiliate',
      version: 1,
      partialize: (state) => ({
        profile: state.profile,
        isAffiliate: state.isAffiliate,
      }),
    }
  )
);
