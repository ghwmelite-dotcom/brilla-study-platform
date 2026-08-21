import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export type RewardType = 'xp' | 'coins' | 'cosmetic' | 'streak_protection' | 'bonus_time' | 'mystery';

export interface DailyMultiplier {
  id: string;
  multiplier: number; // 1.5x, 2x, 3x, up to 10x
  appliesTo: 'all' | 'subject' | 'quiz_type' | 'battles';
  targetId?: string;
  targetName?: string;
  expiresAt: string;
  claimedAt?: string;
}

export interface ChestReward {
  id: string;
  type: RewardType;
  amount?: number;
  cosmeticId?: string;
  cosmeticName?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  message: string;
  wheelSegmentId?: number;
}

export interface MysteryChest {
  id: string;
  type: 'bronze' | 'silver' | 'gold' | 'diamond';
  available: boolean;
  unlocksAt?: string; // After X achievements or time
  unlockProgress?: number; // 0-100%
  possibleRewards: ChestReward[];
}

export interface WheelSegment {
  id: string;
  label: string;
  type: RewardType;
  amount?: number;
  cosmeticId?: string;
  probability: number; // 0-1
  color: string;
}

export interface LuckyWheelState {
  available: boolean;
  nextSpinAt?: string;
  spinsRemaining: number;
  segments: WheelSegment[];
}

interface WheelStatusSegment {
  id: number;
  type: 'xp' | 'multiplier' | 'protection' | 'chest';
  label: string;
}

interface WheelStatusResponse {
  canSpin: boolean;
  weeklySpins: number;
  maxWeeklySpins: number;
  segments: WheelStatusSegment[];
}

interface WheelSpinResponse {
  segment: number;
  type: 'xp' | 'multiplier' | 'protection' | 'chest';
  value: number | string;
  label: string;
  spinsRemaining: number;
}

function mapWheelReward(spin: WheelSpinResponse): ChestReward {
  const type: RewardType = spin.type === 'protection'
    ? 'streak_protection'
    : spin.type === 'multiplier'
      ? 'bonus_time'
      : spin.type === 'chest'
        ? 'mystery'
        : 'xp';
  return {
    id: `wheel_${spin.segment}_${Date.now()}`,
    type,
    amount: typeof spin.value === 'number' ? spin.value : undefined,
    rarity: spin.type === 'chest' ? 'epic' : 'common',
    message: `You won ${spin.label}!`,
    wheelSegmentId: spin.segment,
  };
}

export interface SurpriseChallenge {
  id: string;
  title: string;
  description: string;
  xpMultiplier: number;
  timeLimit: number; // seconds
  expiresAt: string;
  requirement: {
    type: 'quiz' | 'battle' | 'streak' | 'perfect_score';
    target: number;
  };
}

interface RewardState {
  // Daily Multiplier
  dailyMultiplier: DailyMultiplier | null;

  // Mystery Chests
  availableChests: MysteryChest[];
  chestProgress: number; // Progress toward next chest

  // Lucky Wheel
  luckyWheel: LuckyWheelState | null;

  // Surprise Challenges
  activeChallenge: SurpriseChallenge | null;

  // History
  recentRewards: ChestReward[];

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDailyMultiplier: () => Promise<void>;
  claimDailyMultiplier: () => Promise<DailyMultiplier | null>;
  fetchAvailableChests: () => Promise<void>;
  openMysteryChest: (chestId: string) => Promise<ChestReward | null>;
  fetchLuckyWheel: () => Promise<void>;
  spinLuckyWheel: () => Promise<ChestReward | null>;
  checkForSurpriseChallenge: () => Promise<void>;
  completeSurpriseChallenge: () => Promise<ChestReward | null>;
  dismissSurpriseChallenge: () => void;
  addChestProgress: (amount: number) => void;
  clearError: () => void;
}

// Generate random multiplier
function generateDailyMultiplier(): DailyMultiplier {
  const multipliers = [1.5, 2, 2, 2, 2.5, 2.5, 3, 3, 5, 10];
  const appliesOptions: DailyMultiplier['appliesTo'][] = ['all', 'subject', 'quiz_type', 'battles'];
  const subjects = [
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'english', name: 'English' },
    { id: 'science', name: 'Integrated Science' },
    { id: 'social', name: 'Social Studies' },
  ];

  const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
  const appliesTo = appliesOptions[Math.floor(Math.random() * appliesOptions.length)];

  let targetId: string | undefined;
  let targetName: string | undefined;

  if (appliesTo === 'subject') {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    targetId = subject.id;
    targetName = subject.name;
  }

  return {
    id: `mult_${Date.now()}`,
    multiplier,
    appliesTo,
    targetId,
    targetName,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

const WHEEL_SEGMENT_COLORS = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#6366f1',
];

function mapWheelSegments(segments: WheelStatusSegment[]): WheelSegment[] {
  const probability = 1 / Math.max(1, segments.length);
  return segments.map((segment, index) => ({
    id: `w${segment.id}`,
    label: segment.label,
    type: segment.type === 'protection'
      ? 'streak_protection'
      : segment.type === 'multiplier'
        ? 'bonus_time'
        : segment.type === 'chest'
          ? 'mystery'
          : 'xp',
    probability,
    color: WHEEL_SEGMENT_COLORS[index % WHEEL_SEGMENT_COLORS.length],
  }));
}

// Generate mystery chests
function generateChests(): MysteryChest[] {
  const chestTypes: MysteryChest['type'][] = ['bronze', 'silver', 'gold', 'diamond'];

  return chestTypes.map((type, index) => ({
    id: `chest_${type}`,
    type,
    available: index === 0, // Only first chest available initially
    unlockProgress: index === 0 ? 100 : index === 1 ? 60 : 0,
    possibleRewards: generateChestRewards(type),
  }));
}

function generateChestRewards(type: MysteryChest['type']): ChestReward[] {
  const baseRewards: Record<MysteryChest['type'], ChestReward[]> = {
    bronze: [
      { id: 'r1', type: 'xp', amount: 50, rarity: 'common', message: 'You found 50 XP!' },
      { id: 'r2', type: 'xp', amount: 100, rarity: 'common', message: 'Nice! 100 XP!' },
      { id: 'r3', type: 'coins', amount: 25, rarity: 'common', message: '25 coins found!' },
      { id: 'r4', type: 'xp', amount: 150, rarity: 'rare', message: 'Rare find! 150 XP!' },
    ],
    silver: [
      { id: 'r5', type: 'xp', amount: 100, rarity: 'common', message: '100 XP!' },
      { id: 'r6', type: 'xp', amount: 200, rarity: 'rare', message: 'Great! 200 XP!' },
      { id: 'r7', type: 'coins', amount: 50, rarity: 'common', message: '50 coins!' },
      { id: 'r8', type: 'streak_protection', amount: 1, rarity: 'rare', message: 'Streak Shield!' },
    ],
    gold: [
      { id: 'r9', type: 'xp', amount: 300, rarity: 'rare', message: '300 XP!' },
      { id: 'r10', type: 'xp', amount: 500, rarity: 'epic', message: 'Epic! 500 XP!' },
      { id: 'r11', type: 'coins', amount: 100, rarity: 'rare', message: '100 coins!' },
      { id: 'r12', type: 'cosmetic', cosmeticId: 'frame_gradient_sunset', cosmeticName: 'Sunset Glow Frame', rarity: 'epic', message: 'Cosmetic unlocked!' },
    ],
    diamond: [
      { id: 'r13', type: 'xp', amount: 500, rarity: 'epic', message: '500 XP!' },
      { id: 'r14', type: 'xp', amount: 1000, rarity: 'legendary', message: 'LEGENDARY! 1000 XP!' },
      { id: 'r15', type: 'coins', amount: 250, rarity: 'epic', message: '250 coins!' },
      { id: 'r16', type: 'cosmetic', cosmeticId: 'frame_galaxy', cosmeticName: 'Galaxy Swirl Frame', rarity: 'legendary', message: 'Legendary Cosmetic!' },
    ],
  };

  return baseRewards[type];
}

export const useRewardStore = create<RewardState>()(
  persist(
    (set, get) => ({
      dailyMultiplier: null,
      availableChests: [],
      chestProgress: 0,
      luckyWheel: null,
      activeChallenge: null,
      recentRewards: [],
      isLoading: false,
      error: null,

      fetchDailyMultiplier: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get<{ multiplier: DailyMultiplier }>('/rewards/daily-multiplier');

          if (response.success && response.data) {
            set({
              dailyMultiplier: response.data.multiplier,
              isLoading: false,
            });
          } else {
            // Generate mock multiplier
            const existing = get().dailyMultiplier;
            if (!existing || new Date(existing.expiresAt) < new Date()) {
              set({
                dailyMultiplier: generateDailyMultiplier(),
                isLoading: false,
              });
            } else {
              set({ isLoading: false });
            }
          }
        } catch {
          const existing = get().dailyMultiplier;
          if (!existing || new Date(existing.expiresAt) < new Date()) {
            set({
              dailyMultiplier: generateDailyMultiplier(),
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        }
      },

      claimDailyMultiplier: async () => {
        const { dailyMultiplier } = get();
        if (!dailyMultiplier || dailyMultiplier.claimedAt) return null;

        try {
          await api.post('/rewards/daily-multiplier/claim');

          const claimed = {
            ...dailyMultiplier,
            claimedAt: new Date().toISOString(),
          };

          set({ dailyMultiplier: claimed });
          return claimed;
        } catch {
          const claimed = {
            ...dailyMultiplier,
            claimedAt: new Date().toISOString(),
          };
          set({ dailyMultiplier: claimed });
          return claimed;
        }
      },

      fetchAvailableChests: async () => {
        set({ isLoading: true });

        try {
          const response = await api.get<{ chests: MysteryChest[] }>('/rewards/chests');

          if (response.success && response.data) {
            set({
              availableChests: response.data.chests,
              isLoading: false,
            });
          } else {
            set({
              availableChests: generateChests(),
              isLoading: false,
            });
          }
        } catch {
          set({
            availableChests: generateChests(),
            isLoading: false,
          });
        }
      },

      openMysteryChest: async (chestId) => {
        const { availableChests } = get();
        const chest = availableChests.find((c) => c.id === chestId);

        if (!chest || !chest.available) return null;

        set({ isLoading: true });

        try {
          const response = await api.post<{ reward: ChestReward }>(`/rewards/chests/${chestId}/open`);

          if (response.success && response.data) {
            const rewardData = response.data.reward;
            set((state) => ({
              availableChests: state.availableChests.map((c) =>
                c.id === chestId ? { ...c, available: false, unlockProgress: 0 } : c
              ),
              recentRewards: [rewardData, ...state.recentRewards.slice(0, 9)],
              isLoading: false,
            }));
            return rewardData;
          }

          // Mock reward
          const rewards = chest.possibleRewards;
          const reward = rewards[Math.floor(Math.random() * rewards.length)];

          set((state) => ({
            availableChests: state.availableChests.map((c) =>
              c.id === chestId ? { ...c, available: false, unlockProgress: 0 } : c
            ),
            recentRewards: [reward, ...state.recentRewards.slice(0, 9)],
            isLoading: false,
          }));

          return reward;
        } catch {
          const rewards = chest.possibleRewards;
          const reward = rewards[Math.floor(Math.random() * rewards.length)];

          set((state) => ({
            availableChests: state.availableChests.map((c) =>
              c.id === chestId ? { ...c, available: false, unlockProgress: 0 } : c
            ),
            recentRewards: [reward, ...state.recentRewards.slice(0, 9)],
            isLoading: false,
          }));

          return reward;
        }
      },

      fetchLuckyWheel: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get<WheelStatusResponse>('/rewards/wheel/status');
          if (response.success && response.data) {
            const spinsRemaining = Math.max(
              0,
              response.data.maxWeeklySpins - response.data.weeklySpins,
            );
            set({
              luckyWheel: {
                available: response.data.canSpin && spinsRemaining > 0,
                spinsRemaining,
                segments: mapWheelSegments(response.data.segments),
              },
              isLoading: false,
            });
            return;
          }
          set({
            luckyWheel: null,
            isLoading: false,
            error: response.error || 'Unable to load wheel status',
          });
        } catch {
          set({
            luckyWheel: null,
            isLoading: false,
            error: 'Unable to load wheel status',
          });
        }
      },

      spinLuckyWheel: async () => {
        const { luckyWheel } = get();
        if (!luckyWheel || !luckyWheel.available || luckyWheel.spinsRemaining <= 0) return null;

        set({ isLoading: true });

        try {
          const response = await api.post<WheelSpinResponse>('/rewards/wheel/spin');

          if (response.success && response.data) {
            const spinResult = response.data;
            const wheelReward = mapWheelReward(spinResult);
            set((state) => ({
              luckyWheel: state.luckyWheel
                ? {
                    ...state.luckyWheel,
                    spinsRemaining: Math.max(0, spinResult.spinsRemaining),
                    available: spinResult.spinsRemaining > 0,
                    nextSpinAt: undefined,
                  }
                : null,
              recentRewards: [wheelReward, ...state.recentRewards.slice(0, 9)],
              isLoading: false,
            }));
            return wheelReward;
          }

          set({ isLoading: false, error: response.error || 'Unable to spin wheel' });
          return null;
        } catch {
          set({ isLoading: false, error: 'Unable to spin wheel' });
          return null;
        }
      },

      checkForSurpriseChallenge: async () => {
        // Surprise challenges have no server-side issuance/replay contract yet.
        // Keep the surface disabled instead of fabricating rewards in the client.
        set({ activeChallenge: null });
      },

      completeSurpriseChallenge: async () => {
        set({ activeChallenge: null });
        return null;
      },

      dismissSurpriseChallenge: () => {
        set({ activeChallenge: null });
      },

      addChestProgress: (amount) => {
        set((state) => {
          const newProgress = Math.min(100, state.chestProgress + amount);

          // If progress reaches 100, unlock next chest
          if (newProgress >= 100) {
            const updatedChests = state.availableChests.map((chest, index) => {
              if (!chest.available && state.availableChests[index - 1]?.available === false) {
                return { ...chest, available: true, unlockProgress: 100 };
              }
              return chest;
            });

            return {
              chestProgress: newProgress - 100,
              availableChests: updatedChests,
            };
          }

          return { chestProgress: newProgress };
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-rewards',
      partialize: (state) => ({
        dailyMultiplier: state.dailyMultiplier,
        chestProgress: state.chestProgress,
        recentRewards: state.recentRewards,
      }),
    }
  )
);

// Helper to calculate XP with active multiplier
export function applyMultiplier(baseXp: number, multiplier: DailyMultiplier | null): number {
  if (!multiplier || multiplier.claimedAt || new Date(multiplier.expiresAt) < new Date()) {
    return baseXp;
  }
  return Math.floor(baseXp * multiplier.multiplier);
}

// Chest tier configuration
export const chestConfig = {
  bronze: {
    color: 'from-amber-600 to-amber-800',
    glow: 'shadow-amber-500/50',
    icon: '🥉',
  },
  silver: {
    color: 'from-slate-300 to-slate-500',
    glow: 'shadow-slate-400/50',
    icon: '🥈',
  },
  gold: {
    color: 'from-yellow-400 to-amber-600',
    glow: 'shadow-yellow-400/60',
    icon: '🥇',
  },
  diamond: {
    color: 'from-cyan-300 to-blue-500',
    glow: 'shadow-cyan-400/70',
    icon: '💎',
  },
};
