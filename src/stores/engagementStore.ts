import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export type NudgeType = 'streak_warning' | 'friend_activity' | 'missed_goal' | 'comeback' | 'celebration' | 'reminder';

export interface EngagementNudge {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
  actionLabel: string;
  actionLink: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  expiresAt?: string;
  dismissed?: boolean;
}

export interface ComebackTask {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
}

export interface ComebackChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  expiresIn: number; // hours
  expiresAt: string;
  tasks: ComebackTask[];
  claimed: boolean;
}

export interface EngagementStatus {
  streakAtRisk: boolean;
  hoursUntilStreakLost: number;
  daysInactive: number;
  lastActiveDate: string;
  engagementScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'churning';
  recentActivityCount: number; // activities in last 7 days
}

interface EngagementState {
  // Status
  engagementStatus: EngagementStatus | null;

  // Interventions
  comebackChallenge: ComebackChallenge | null;
  nudges: EngagementNudge[];
  hasSeenComebackModal: boolean;

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions
  checkEngagementStatus: () => Promise<void>;
  acceptComebackChallenge: () => Promise<void>;
  completeComebackTask: (taskId: string) => Promise<void>;
  claimComebackReward: () => Promise<number>;
  dismissNudge: (nudgeId: string) => void;
  addNudge: (nudge: Omit<EngagementNudge, 'id' | 'createdAt'>) => void;
  markComebackModalSeen: () => void;
  generateStreakWarning: () => void;
  generateFriendNudge: (friendName: string, friendActivity: string) => void;
  clearExpiredNudges: () => void;
  clearError: () => void;
}

// Calculate engagement score based on activity
function calculateEngagementScore(daysInactive: number, recentActivityCount: number): number {
  // Base score from recent activity
  const activityScore = Math.min(50, recentActivityCount * 10);

  // Penalty for inactivity
  const inactivityPenalty = Math.min(50, daysInactive * 15);

  return Math.max(0, Math.min(100, activityScore + 50 - inactivityPenalty));
}

// Determine risk level
function determineRiskLevel(daysInactive: number, engagementScore: number): EngagementStatus['riskLevel'] {
  if (daysInactive >= 7 || engagementScore < 20) return 'churning';
  if (daysInactive >= 3 || engagementScore < 40) return 'high';
  if (daysInactive >= 1 || engagementScore < 60) return 'medium';
  return 'low';
}

// Generate comeback challenge based on inactivity
function generateComebackChallenge(daysInactive: number): ComebackChallenge {
  const baseXp = daysInactive <= 3 ? 200 : daysInactive <= 7 ? 400 : 600;

  const tasks: ComebackTask[] = [
    {
      id: 'comeback_1',
      title: 'Quick Warmup',
      description: 'Complete any quiz with at least 50% accuracy',
      xpReward: Math.floor(baseXp * 0.3),
      completed: false,
    },
    {
      id: 'comeback_2',
      title: 'Study Session',
      description: 'Spend at least 10 minutes studying',
      xpReward: Math.floor(baseXp * 0.3),
      completed: false,
    },
    {
      id: 'comeback_3',
      title: 'Challenge Accepted',
      description: 'Complete 3 quizzes in any subject',
      xpReward: Math.floor(baseXp * 0.4),
      completed: false,
    },
  ];

  return {
    id: `comeback_${Date.now()}`,
    title: daysInactive <= 3 ? 'Welcome Back!' : daysInactive <= 7 ? 'We Missed You!' : 'Great to See You Again!',
    description: `Complete these tasks within 24 hours to earn bonus XP and get back on track!`,
    xpReward: baseXp,
    expiresIn: 24,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    tasks,
    claimed: false,
  };
}

// Generate mock engagement status
function generateEngagementStatus(lastActiveDate: string): EngagementStatus {
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const diffMs = now.getTime() - lastActive.getTime();
  const daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Simulate recent activity
  const recentActivityCount = Math.max(0, 5 - daysInactive);

  const engagementScore = calculateEngagementScore(daysInactive, recentActivityCount);
  const riskLevel = determineRiskLevel(daysInactive, engagementScore);

  // Calculate hours until streak is lost (assumes 24 hour streak window)
  const hoursUntilStreakLost = Math.max(0, 24 - Math.floor(diffMs / (1000 * 60 * 60)));

  return {
    streakAtRisk: hoursUntilStreakLost <= 6 && daysInactive === 0,
    hoursUntilStreakLost,
    daysInactive,
    lastActiveDate,
    engagementScore,
    riskLevel,
    recentActivityCount,
  };
}

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      engagementStatus: null,
      comebackChallenge: null,
      nudges: [],
      hasSeenComebackModal: false,
      isLoading: false,
      error: null,

      checkEngagementStatus: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get<{
            status: EngagementStatus;
            comeback?: ComebackChallenge;
          }>('/engagement/status');

          if (response.success && response.data) {
            set({
              engagementStatus: response.data.status,
              comebackChallenge: response.data.comeback || null,
              isLoading: false,
            });

            // Generate appropriate nudges based on status
            const { generateStreakWarning } = get();
            if (response.data.status.streakAtRisk) {
              generateStreakWarning();
            }
          } else {
            // Mock status - assume last active was some time ago for demo
            const lastActive = get().engagementStatus?.lastActiveDate || new Date().toISOString();
            const status = generateEngagementStatus(lastActive);

            let comeback: ComebackChallenge | null = null;
            if (status.daysInactive >= 1 && !get().hasSeenComebackModal) {
              comeback = generateComebackChallenge(status.daysInactive);
            }

            set({
              engagementStatus: status,
              comebackChallenge: comeback,
              isLoading: false,
            });

            if (status.streakAtRisk) {
              get().generateStreakWarning();
            }
          }
        } catch {
          // Offline - use cached or generate mock
          const lastActive = get().engagementStatus?.lastActiveDate || new Date().toISOString();
          const status = generateEngagementStatus(lastActive);

          set({
            engagementStatus: status,
            isLoading: false,
          });
        }
      },

      acceptComebackChallenge: async () => {
        const { comebackChallenge } = get();
        if (!comebackChallenge) return;

        try {
          await api.post('/engagement/comeback/accept');

          set({ hasSeenComebackModal: true });
        } catch {
          set({ hasSeenComebackModal: true });
        }
      },

      completeComebackTask: async (taskId) => {
        const { comebackChallenge } = get();
        if (!comebackChallenge) return;

        try {
          await api.post(`/engagement/comeback/task/${taskId}/complete`);

          set((state) => ({
            comebackChallenge: state.comebackChallenge
              ? {
                  ...state.comebackChallenge,
                  tasks: state.comebackChallenge.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: true } : t
                  ),
                }
              : null,
          }));
        } catch {
          set((state) => ({
            comebackChallenge: state.comebackChallenge
              ? {
                  ...state.comebackChallenge,
                  tasks: state.comebackChallenge.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: true } : t
                  ),
                }
              : null,
          }));
        }
      },

      claimComebackReward: async () => {
        const { comebackChallenge } = get();
        if (!comebackChallenge) return 0;

        // Calculate earned XP from completed tasks
        const earnedXp = comebackChallenge.tasks
          .filter((t) => t.completed)
          .reduce((sum, t) => sum + t.xpReward, 0);

        try {
          await api.post('/engagement/comeback/claim');

          set((state) => ({
            comebackChallenge: state.comebackChallenge
              ? { ...state.comebackChallenge, claimed: true }
              : null,
          }));

          return earnedXp;
        } catch {
          set((state) => ({
            comebackChallenge: state.comebackChallenge
              ? { ...state.comebackChallenge, claimed: true }
              : null,
          }));
          return earnedXp;
        }
      },

      dismissNudge: (nudgeId) => {
        set((state) => ({
          nudges: state.nudges.map((n) =>
            n.id === nudgeId ? { ...n, dismissed: true } : n
          ),
        }));
      },

      addNudge: (nudge) => {
        const newNudge: EngagementNudge = {
          ...nudge,
          id: `nudge_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          nudges: [newNudge, ...state.nudges.filter((n) => !n.dismissed)],
        }));
      },

      markComebackModalSeen: () => {
        set({ hasSeenComebackModal: true });
      },

      generateStreakWarning: () => {
        const { engagementStatus, nudges } = get();
        if (!engagementStatus?.streakAtRisk) return;

        // Don't add duplicate warnings
        const hasExistingWarning = nudges.some(
          (n) => n.type === 'streak_warning' && !n.dismissed
        );
        if (hasExistingWarning) return;

        const hours = engagementStatus.hoursUntilStreakLost;
        get().addNudge({
          type: 'streak_warning',
          title: 'Your Streak is at Risk!',
          message: `Only ${hours} hour${hours !== 1 ? 's' : ''} left to maintain your streak. Complete any activity now!`,
          actionLabel: 'Start Quiz',
          actionLink: '/practice',
          priority: hours <= 2 ? 'urgent' : 'high',
          expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
        });
      },

      generateFriendNudge: (friendName, friendActivity) => {
        get().addNudge({
          type: 'friend_activity',
          title: `${friendName} is studying!`,
          message: `${friendName} just ${friendActivity}. Join them and study together!`,
          actionLabel: 'Join Now',
          actionLink: '/practice',
          priority: 'medium',
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        });
      },

      clearExpiredNudges: () => {
        const now = new Date();
        set((state) => ({
          nudges: state.nudges.filter(
            (n) => !n.expiresAt || new Date(n.expiresAt) > now
          ),
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-engagement',
      partialize: (state) => ({
        engagementStatus: state.engagementStatus,
        hasSeenComebackModal: state.hasSeenComebackModal,
        nudges: state.nudges.filter((n) => !n.dismissed),
      }),
    }
  )
);

// Helper to get nudge icon
export function getNudgeIcon(type: NudgeType): string {
  switch (type) {
    case 'streak_warning':
      return '🔥';
    case 'friend_activity':
      return '👋';
    case 'missed_goal':
      return '🎯';
    case 'comeback':
      return '🎉';
    case 'celebration':
      return '🏆';
    case 'reminder':
      return '⏰';
    default:
      return '📌';
  }
}

// Helper to get priority color
export function getPriorityColor(priority: EngagementNudge['priority']): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-neutral-500';
  }
}

// Helper to get risk level styling
export function getRiskLevelStyle(riskLevel: EngagementStatus['riskLevel']): {
  bg: string;
  text: string;
  border: string;
} {
  switch (riskLevel) {
    case 'churning':
      return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-300' };
    case 'high':
      return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-300' };
    case 'medium':
      return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-300' };
    case 'low':
      return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-300' };
    default:
      return { bg: 'bg-neutral-50', text: 'text-neutral-600', border: 'border-neutral-300' };
  }
}
