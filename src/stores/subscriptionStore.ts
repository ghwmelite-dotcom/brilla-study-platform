import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  TrialStatus,
  PaymentTransaction,
  PaymentInitResponse,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface SubscriptionState {
  // State
  plans: SubscriptionPlan[];
  subscriptionStatus: SubscriptionStatus | null;
  trialStatus: TrialStatus | null;
  paymentHistory: PaymentTransaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPlans: () => Promise<void>;
  fetchStatus: () => Promise<void>;
  fetchTrialStatus: () => Promise<void>;
  startTrial: () => Promise<boolean>;
  completeTrialTask: (taskId: string) => Promise<boolean>;
  claimBonusWeek: () => Promise<boolean>;
  initializePayment: (planId: string, billingCycle: 'monthly' | 'yearly') => Promise<PaymentInitResponse | null>;
  verifyPayment: (reference: string) => Promise<{ success: boolean; planId?: string; expiresAt?: string }>;
  fetchPaymentHistory: () => Promise<void>;
  cancelSubscription: () => Promise<boolean>;
  getFeatureAccess: () => Promise<{
    isSubscribed: boolean;
    isTrial: boolean;
    hasAccess: boolean;
    features: Record<string, boolean | number>;
  }>;
  reset: () => void;
}

const initialState = {
  plans: [],
  subscriptionStatus: null,
  trialStatus: null,
  paymentHistory: [],
  isLoading: false,
  error: null,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchPlans: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(`${API_BASE}/subscriptions/plans`, { headers });
          const data = await response.json();

          if (data.success) {
            set({ plans: data.data, isLoading: false });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to fetch plans', isLoading: false });
        }
      },

      fetchStatus: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ isLoading: false });
            return;
          }

          const response = await fetch(`${API_BASE}/subscriptions/status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({
              subscriptionStatus: data.data,
              trialStatus: data.data.trial,
              isLoading: false,
            });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to fetch subscription status', isLoading: false });
        }
      },

      fetchTrialStatus: async () => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return;

          const response = await fetch(`${API_BASE}/subscriptions/trial/status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({ trialStatus: data.data.trial });
          }
        } catch (error) {
          console.error('Failed to fetch trial status:', error);
        }
      },

      startTrial: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ error: 'Not authenticated', isLoading: false });
            return false;
          }

          const response = await fetch(`${API_BASE}/subscriptions/trial/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            // Refresh status
            await get().fetchStatus();
            set({ isLoading: false });
            return true;
          } else {
            set({ error: data.error, isLoading: false });
            return false;
          }
        } catch (error) {
          set({ error: 'Failed to start trial', isLoading: false });
          return false;
        }
      },

      completeTrialTask: async (taskId: string) => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return false;

          const response = await fetch(`${API_BASE}/subscriptions/trial/task/${taskId}/complete`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            // Refresh trial status
            await get().fetchTrialStatus();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to complete trial task:', error);
          return false;
        }
      },

      claimBonusWeek: async () => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return false;

          const response = await fetch(`${API_BASE}/subscriptions/trial/bonus-week`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            await get().fetchTrialStatus();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to claim bonus week:', error);
          return false;
        }
      },

      initializePayment: async (planId: string, billingCycle: 'monthly' | 'yearly') => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ error: 'Not authenticated', isLoading: false });
            return null;
          }

          const response = await fetch(`${API_BASE}/payments/initialize`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ planId, billingCycle }),
          });
          const data = await response.json();

          set({ isLoading: false });

          if (data.success) {
            return data.data as PaymentInitResponse;
          } else {
            set({ error: data.error });
            return null;
          }
        } catch (error) {
          set({ error: 'Failed to initialize payment', isLoading: false });
          return null;
        }
      },

      verifyPayment: async (reference: string) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ error: 'Not authenticated', isLoading: false });
            return { success: false };
          }

          const response = await fetch(`${API_BASE}/payments/verify/${reference}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          set({ isLoading: false });

          if (data.success) {
            // Refresh subscription status
            await get().fetchStatus();
            return {
              success: true,
              planId: data.data.planId,
              expiresAt: data.data.expiresAt,
            };
          } else {
            set({ error: data.error });
            return { success: false };
          }
        } catch (error) {
          set({ error: 'Failed to verify payment', isLoading: false });
          return { success: false };
        }
      },

      fetchPaymentHistory: async () => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) return;

          const response = await fetch(`${API_BASE}/payments/history`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            set({ paymentHistory: data.data });
          }
        } catch (error) {
          console.error('Failed to fetch payment history:', error);
        }
      },

      cancelSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            set({ error: 'Not authenticated', isLoading: false });
            return false;
          }

          const response = await fetch(`${API_BASE}/subscriptions/cancel`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          set({ isLoading: false });

          if (data.success) {
            await get().fetchStatus();
            return true;
          } else {
            set({ error: data.error });
            return false;
          }
        } catch (error) {
          set({ error: 'Failed to cancel subscription', isLoading: false });
          return false;
        }
      },

      getFeatureAccess: async () => {
        try {
          const token = localStorage.getItem('brilla_token');
          if (!token) {
            return {
              isSubscribed: false,
              isTrial: false,
              hasAccess: false,
              features: {},
            };
          }

          const response = await fetch(`${API_BASE}/subscriptions/features`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          if (data.success) {
            return data.data;
          }
          return {
            isSubscribed: false,
            isTrial: false,
            hasAccess: false,
            features: {},
          };
        } catch (error) {
          console.error('Failed to fetch feature access:', error);
          return {
            isSubscribed: false,
            isTrial: false,
            hasAccess: false,
            features: {},
          };
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'brilla-subscription',
      version: 1,
      partialize: (state) => ({
        subscriptionStatus: state.subscriptionStatus,
        trialStatus: state.trialStatus,
      }),
    }
  )
);
