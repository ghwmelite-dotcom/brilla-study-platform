import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export type CosmeticSlot = 'avatarFrame' | 'title' | 'profileTheme' | 'badgeStyle' | 'nameEffect';
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UnlockMethod = 'level' | 'achievement' | 'purchase' | 'event' | 'streak' | 'battle';

export interface Cosmetic {
  id: string;
  name: string;
  description: string;
  type: CosmeticSlot;
  rarity: CosmeticRarity;
  unlockMethod: UnlockMethod;
  unlockRequirement?: string;
  unlockLevel?: number;
  price?: number; // in coins
  previewUrl?: string;
  cssClass?: string;
  gradient?: string;
  animation?: string;
  isLimited?: boolean;
  expiresAt?: string;
}

export interface EquippedCosmetics {
  avatarFrame?: string;
  title?: string;
  profileTheme?: string;
  badgeStyle?: string;
  nameEffect?: string;
}

interface OwnedCosmetic {
  cosmeticId: string;
  acquiredAt: string;
  source: UnlockMethod;
}

interface CosmeticsState {
  ownedCosmetics: OwnedCosmetic[];
  equippedCosmetics: EquippedCosmetics;
  availableCosmetics: Cosmetic[];
  coins: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCosmetics: () => Promise<void>;
  equipCosmetic: (cosmeticId: string, slot: CosmeticSlot) => Promise<void>;
  unequipCosmetic: (slot: CosmeticSlot) => Promise<void>;
  purchaseCosmetic: (cosmeticId: string) => Promise<boolean>;
  unlockCosmetic: (cosmeticId: string, source: UnlockMethod) => void;
  hasCosmetic: (cosmeticId: string) => boolean;
  getEquippedCosmetic: (slot: CosmeticSlot) => Cosmetic | undefined;
  addCoins: (amount: number) => void;
  clearError: () => void;
}

// All available cosmetics in the system
const allCosmetics: Cosmetic[] = [
  // Avatar Frames - Common
  {
    id: 'frame_basic_blue',
    name: 'Blue Circle',
    description: 'A simple blue circular frame',
    type: 'avatarFrame',
    rarity: 'common',
    unlockMethod: 'level',
    unlockLevel: 1,
    cssClass: 'ring-4 ring-blue-400',
  },
  {
    id: 'frame_basic_green',
    name: 'Green Circle',
    description: 'A fresh green circular frame',
    type: 'avatarFrame',
    rarity: 'common',
    unlockMethod: 'level',
    unlockLevel: 3,
    cssClass: 'ring-4 ring-emerald-400',
  },
  {
    id: 'frame_basic_purple',
    name: 'Purple Circle',
    description: 'A royal purple circular frame',
    type: 'avatarFrame',
    rarity: 'common',
    unlockMethod: 'level',
    unlockLevel: 5,
    cssClass: 'ring-4 ring-purple-400',
  },

  // Avatar Frames - Rare
  {
    id: 'frame_gradient_sunset',
    name: 'Sunset Glow',
    description: 'A warm gradient frame like a sunset',
    type: 'avatarFrame',
    rarity: 'rare',
    unlockMethod: 'level',
    unlockLevel: 10,
    cssClass: 'ring-4 ring-gradient-to-r from-orange-400 to-pink-500',
    gradient: 'linear-gradient(135deg, #f97316, #ec4899)',
  },
  {
    id: 'frame_double_ring',
    name: 'Double Ring',
    description: 'An elegant double-ring frame',
    type: 'avatarFrame',
    rarity: 'rare',
    unlockMethod: 'achievement',
    unlockRequirement: 'first_perfect_quiz',
    cssClass: 'ring-4 ring-amber-400 ring-offset-4 ring-offset-amber-200',
  },
  {
    id: 'frame_streak_fire',
    name: 'Streak Fire',
    description: 'Earned by maintaining a 7-day streak',
    type: 'avatarFrame',
    rarity: 'rare',
    unlockMethod: 'streak',
    unlockRequirement: '7_day_streak',
    cssClass: 'ring-4 ring-orange-500 animate-pulse',
  },

  // Avatar Frames - Epic
  {
    id: 'frame_galaxy',
    name: 'Galaxy Swirl',
    description: 'A cosmic frame with swirling galaxies',
    type: 'avatarFrame',
    rarity: 'epic',
    unlockMethod: 'level',
    unlockLevel: 25,
    cssClass: 'ring-4 ring-purple-600 shadow-lg shadow-purple-500/50',
    gradient: 'linear-gradient(135deg, #7c3aed, #2563eb, #7c3aed)',
    animation: 'animate-gradient',
  },
  {
    id: 'frame_champion',
    name: 'Champion\'s Crown',
    description: 'Win 10 battles to earn this frame',
    type: 'avatarFrame',
    rarity: 'epic',
    unlockMethod: 'battle',
    unlockRequirement: '10_battle_wins',
    cssClass: 'ring-4 ring-amber-500 shadow-lg shadow-amber-400/50',
  },

  // Avatar Frames - Legendary
  {
    id: 'frame_legendary_phoenix',
    name: 'Phoenix Rising',
    description: 'A legendary frame for true masters',
    type: 'avatarFrame',
    rarity: 'legendary',
    unlockMethod: 'level',
    unlockLevel: 50,
    cssClass: 'ring-4 ring-orange-600 shadow-xl shadow-orange-500/60 animate-pulse',
    gradient: 'linear-gradient(135deg, #ea580c, #facc15, #ea580c)',
    animation: 'animate-shimmer',
  },
  {
    id: 'frame_diamond',
    name: 'Diamond Prestige',
    description: 'Reach Level 100 to unlock this ultimate frame',
    type: 'avatarFrame',
    rarity: 'legendary',
    unlockMethod: 'level',
    unlockLevel: 100,
    cssClass: 'ring-4 ring-cyan-300 shadow-xl shadow-cyan-400/70',
    animation: 'animate-sparkle',
  },

  // Titles - Common
  {
    id: 'title_learner',
    name: 'Learner',
    description: 'Every journey starts here',
    type: 'title',
    rarity: 'common',
    unlockMethod: 'level',
    unlockLevel: 1,
  },
  {
    id: 'title_student',
    name: 'Student',
    description: 'You\'re making progress!',
    type: 'title',
    rarity: 'common',
    unlockMethod: 'level',
    unlockLevel: 5,
  },

  // Titles - Rare
  {
    id: 'title_rising_star',
    name: 'Rising Star',
    description: 'A star in the making',
    type: 'title',
    rarity: 'rare',
    unlockMethod: 'level',
    unlockLevel: 10,
  },
  {
    id: 'title_quiz_master',
    name: 'Quiz Master',
    description: 'Complete 50 quizzes',
    type: 'title',
    rarity: 'rare',
    unlockMethod: 'achievement',
    unlockRequirement: '50_quizzes_completed',
  },
  {
    id: 'title_streak_keeper',
    name: 'Streak Keeper',
    description: 'Maintain a 14-day streak',
    type: 'title',
    rarity: 'rare',
    unlockMethod: 'streak',
    unlockRequirement: '14_day_streak',
  },

  // Titles - Epic
  {
    id: 'title_scholar',
    name: 'Scholar',
    description: 'A dedicated student of knowledge',
    type: 'title',
    rarity: 'epic',
    unlockMethod: 'level',
    unlockLevel: 25,
  },
  {
    id: 'title_champion',
    name: 'Champion',
    description: 'Win 25 battles',
    type: 'title',
    rarity: 'epic',
    unlockMethod: 'battle',
    unlockRequirement: '25_battle_wins',
  },
  {
    id: 'title_perfectionist',
    name: 'Perfectionist',
    description: 'Score 100% on 10 quizzes',
    type: 'title',
    rarity: 'epic',
    unlockMethod: 'achievement',
    unlockRequirement: '10_perfect_quizzes',
  },

  // Titles - Legendary
  {
    id: 'title_master',
    name: 'Master',
    description: 'True mastery of knowledge',
    type: 'title',
    rarity: 'legendary',
    unlockMethod: 'level',
    unlockLevel: 50,
  },
  {
    id: 'title_legend',
    name: 'Legend',
    description: 'Reach Level 100',
    type: 'title',
    rarity: 'legendary',
    unlockMethod: 'level',
    unlockLevel: 100,
  },
  {
    id: 'title_centurion',
    name: 'Centurion',
    description: 'Maintain a 100-day streak',
    type: 'title',
    rarity: 'legendary',
    unlockMethod: 'streak',
    unlockRequirement: '100_day_streak',
  },

  // Profile Themes - Common
  {
    id: 'theme_default',
    name: 'Classic',
    description: 'The default clean look',
    type: 'profileTheme',
    rarity: 'common',
    unlockMethod: 'level',
    unlockLevel: 1,
    cssClass: 'bg-white',
  },
  {
    id: 'theme_dark',
    name: 'Dark Mode',
    description: 'Easy on the eyes',
    type: 'profileTheme',
    rarity: 'common',
    unlockMethod: 'level',
    unlockLevel: 5,
    cssClass: 'bg-neutral-900 text-white',
  },

  // Profile Themes - Rare
  {
    id: 'theme_ocean',
    name: 'Ocean Breeze',
    description: 'Cool blue gradient theme',
    type: 'profileTheme',
    rarity: 'rare',
    unlockMethod: 'level',
    unlockLevel: 15,
    gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    cssClass: 'bg-gradient-to-br from-sky-500 to-indigo-500',
  },
  {
    id: 'theme_forest',
    name: 'Forest Grove',
    description: 'Nature-inspired green theme',
    type: 'profileTheme',
    rarity: 'rare',
    unlockMethod: 'level',
    unlockLevel: 20,
    gradient: 'linear-gradient(135deg, #22c55e, #14b8a6)',
    cssClass: 'bg-gradient-to-br from-green-500 to-teal-500',
  },

  // Profile Themes - Epic
  {
    id: 'theme_aurora',
    name: 'Aurora Borealis',
    description: 'Magical northern lights',
    type: 'profileTheme',
    rarity: 'epic',
    unlockMethod: 'level',
    unlockLevel: 35,
    gradient: 'linear-gradient(135deg, #8b5cf6, #06b6d4, #22c55e)',
    cssClass: 'bg-gradient-to-br from-violet-500 via-cyan-500 to-green-500',
  },
  {
    id: 'theme_sunset',
    name: 'Golden Sunset',
    description: 'Warm sunset colors',
    type: 'profileTheme',
    rarity: 'epic',
    unlockMethod: 'achievement',
    unlockRequirement: 'sunset_achiever',
    gradient: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)',
    cssClass: 'bg-gradient-to-br from-orange-500 via-pink-500 to-violet-500',
  },

  // Profile Themes - Legendary
  {
    id: 'theme_cosmic',
    name: 'Cosmic Infinity',
    description: 'The infinite cosmos at your fingertips',
    type: 'profileTheme',
    rarity: 'legendary',
    unlockMethod: 'level',
    unlockLevel: 75,
    gradient: 'linear-gradient(135deg, #1e1b4b, #7c3aed, #c026d3)',
    cssClass: 'bg-gradient-to-br from-indigo-950 via-violet-600 to-fuchsia-600',
    animation: 'animate-gradient-slow',
  },

  // Badge Styles - Various
  {
    id: 'badge_classic',
    name: 'Classic Badge',
    description: 'Simple and elegant',
    type: 'badgeStyle',
    rarity: 'common',
    unlockMethod: 'level',
    unlockLevel: 1,
    cssClass: 'rounded-full',
  },
  {
    id: 'badge_hexagon',
    name: 'Hexagon Badge',
    description: 'Unique hexagonal shape',
    type: 'badgeStyle',
    rarity: 'rare',
    unlockMethod: 'level',
    unlockLevel: 15,
    cssClass: 'clip-hexagon',
  },
  {
    id: 'badge_star',
    name: 'Star Badge',
    description: 'Star-shaped badges',
    type: 'badgeStyle',
    rarity: 'epic',
    unlockMethod: 'achievement',
    unlockRequirement: 'star_collector',
    cssClass: 'clip-star',
  },
  {
    id: 'badge_diamond',
    name: 'Diamond Badge',
    description: 'Premium diamond-cut badges',
    type: 'badgeStyle',
    rarity: 'legendary',
    unlockMethod: 'level',
    unlockLevel: 80,
    cssClass: 'clip-diamond rotate-45',
  },

  // Name Effects
  {
    id: 'name_normal',
    name: 'Normal',
    description: 'Standard name display',
    type: 'nameEffect',
    rarity: 'common',
    unlockMethod: 'level',
    unlockLevel: 1,
    cssClass: 'text-neutral-900',
  },
  {
    id: 'name_gradient_blue',
    name: 'Blue Gradient',
    description: 'Gradient blue text',
    type: 'nameEffect',
    rarity: 'rare',
    unlockMethod: 'level',
    unlockLevel: 20,
    cssClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent',
  },
  {
    id: 'name_gradient_fire',
    name: 'Fire Gradient',
    description: 'Hot fiery gradient',
    type: 'nameEffect',
    rarity: 'epic',
    unlockMethod: 'streak',
    unlockRequirement: '30_day_streak',
    cssClass: 'bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent',
  },
  {
    id: 'name_rainbow',
    name: 'Rainbow',
    description: 'Full rainbow spectrum',
    type: 'nameEffect',
    rarity: 'legendary',
    unlockMethod: 'level',
    unlockLevel: 60,
    cssClass: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent',
    animation: 'animate-rainbow',
  },
  {
    id: 'name_shimmer',
    name: 'Shimmer',
    description: 'Animated shimmering text',
    type: 'nameEffect',
    rarity: 'legendary',
    unlockMethod: 'achievement',
    unlockRequirement: 'ultimate_achiever',
    cssClass: 'text-amber-500',
    animation: 'animate-shimmer',
  },
];

// Rarity colors for UI
export const rarityConfig: Record<CosmeticRarity, { bg: string; border: string; text: string; glow: string }> = {
  common: {
    bg: 'bg-neutral-100',
    border: 'border-neutral-300',
    text: 'text-neutral-600',
    glow: '',
  },
  rare: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-600',
    glow: 'shadow-blue-300/50',
  },
  epic: {
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    text: 'text-purple-600',
    glow: 'shadow-purple-400/50 shadow-lg',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-500',
    text: 'text-amber-600',
    glow: 'shadow-amber-400/60 shadow-xl animate-pulse',
  },
};

export const useCosmeticsStore = create<CosmeticsState>()(
  persist(
    (set, get) => ({
      ownedCosmetics: [
        // Default cosmetics everyone starts with
        { cosmeticId: 'frame_basic_blue', acquiredAt: new Date().toISOString(), source: 'level' },
        { cosmeticId: 'title_learner', acquiredAt: new Date().toISOString(), source: 'level' },
        { cosmeticId: 'theme_default', acquiredAt: new Date().toISOString(), source: 'level' },
        { cosmeticId: 'badge_classic', acquiredAt: new Date().toISOString(), source: 'level' },
        { cosmeticId: 'name_normal', acquiredAt: new Date().toISOString(), source: 'level' },
      ],
      equippedCosmetics: {
        avatarFrame: 'frame_basic_blue',
        title: 'title_learner',
        profileTheme: 'theme_default',
        badgeStyle: 'badge_classic',
        nameEffect: 'name_normal',
      },
      availableCosmetics: allCosmetics,
      coins: 500, // Starting coins
      isLoading: false,
      error: null,

      fetchCosmetics: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get<{ cosmetics: OwnedCosmetic[]; coins: number }>('/cosmetics');

          if (response.success && response.data) {
            set({
              ownedCosmetics: response.data.cosmetics,
              coins: response.data.coins,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      equipCosmetic: async (cosmeticId, slot) => {
        const { hasCosmetic } = get();

        if (!hasCosmetic(cosmeticId)) {
          set({ error: 'You don\'t own this cosmetic' });
          return;
        }

        try {
          await api.post('/cosmetics/equip', { cosmeticId, slot });

          set((state) => ({
            equippedCosmetics: {
              ...state.equippedCosmetics,
              [slot]: cosmeticId,
            },
          }));
        } catch {
          set((state) => ({
            equippedCosmetics: {
              ...state.equippedCosmetics,
              [slot]: cosmeticId,
            },
          }));
        }
      },

      unequipCosmetic: async (slot) => {
        try {
          await api.post('/cosmetics/unequip', { slot });

          set((state) => ({
            equippedCosmetics: {
              ...state.equippedCosmetics,
              [slot]: undefined,
            },
          }));
        } catch {
          set((state) => ({
            equippedCosmetics: {
              ...state.equippedCosmetics,
              [slot]: undefined,
            },
          }));
        }
      },

      purchaseCosmetic: async (cosmeticId) => {
        const { coins, availableCosmetics, hasCosmetic } = get();
        const cosmetic = availableCosmetics.find((c) => c.id === cosmeticId);

        if (!cosmetic) {
          set({ error: 'Cosmetic not found' });
          return false;
        }

        if (hasCosmetic(cosmeticId)) {
          set({ error: 'You already own this cosmetic' });
          return false;
        }

        if (cosmetic.price && coins < cosmetic.price) {
          set({ error: 'Not enough coins' });
          return false;
        }

        try {
          const response = await api.post<{ success: boolean }>('/cosmetics/purchase', { cosmeticId });

          if (response.success) {
            set((state) => ({
              ownedCosmetics: [
                ...state.ownedCosmetics,
                { cosmeticId, acquiredAt: new Date().toISOString(), source: 'purchase' },
              ],
              coins: state.coins - (cosmetic.price || 0),
            }));
            return true;
          }
          return false;
        } catch {
          // Offline mode - still allow purchase
          set((state) => ({
            ownedCosmetics: [
              ...state.ownedCosmetics,
              { cosmeticId, acquiredAt: new Date().toISOString(), source: 'purchase' },
            ],
            coins: state.coins - (cosmetic.price || 0),
          }));
          return true;
        }
      },

      unlockCosmetic: (cosmeticId, source) => {
        const { hasCosmetic } = get();

        if (hasCosmetic(cosmeticId)) return;

        set((state) => ({
          ownedCosmetics: [
            ...state.ownedCosmetics,
            { cosmeticId, acquiredAt: new Date().toISOString(), source },
          ],
        }));
      },

      hasCosmetic: (cosmeticId) => {
        return get().ownedCosmetics.some((c) => c.cosmeticId === cosmeticId);
      },

      getEquippedCosmetic: (slot) => {
        const { equippedCosmetics, availableCosmetics } = get();
        const equippedId = equippedCosmetics[slot];
        if (!equippedId) return undefined;
        return availableCosmetics.find((c) => c.id === equippedId);
      },

      addCoins: (amount) => {
        set((state) => ({ coins: state.coins + amount }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-cosmetics',
      partialize: (state) => ({
        ownedCosmetics: state.ownedCosmetics,
        equippedCosmetics: state.equippedCosmetics,
        coins: state.coins,
      }),
    }
  )
);

// Helper to get cosmetic by ID
export function getCosmeticById(id: string): Cosmetic | undefined {
  return allCosmetics.find((c) => c.id === id);
}

// Helper to get cosmetics by type
export function getCosmeticsByType(type: CosmeticSlot): Cosmetic[] {
  return allCosmetics.filter((c) => c.type === type);
}

// Helper to get cosmetics by rarity
export function getCosmeticsByRarity(rarity: CosmeticRarity): Cosmetic[] {
  return allCosmetics.filter((c) => c.rarity === rarity);
}
