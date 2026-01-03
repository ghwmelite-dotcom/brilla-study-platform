// Landing page configuration
// Centralized values for easy updates

export const SITE_CONFIG = {
  name: 'Brilla Prep',
  tagline: 'Prepare. Excel. Succeed.',
  supportEmail: 'support@brillaprep.org',
};

export const TRIAL_CONFIG = {
  days: 7,
  label: '7-Day Free Trial',
  shortLabel: '7 Days FREE!',
};

export const PRICING_CONFIG = {
  currency: 'GHS',
  plans: {
    free: {
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyDiscount: 0,
    },
    student: {
      name: 'Student',
      monthlyPrice: 50,
      yearlyPrice: 480,
      yearlyDiscount: 20, // percentage
    },
    teacher: {
      name: 'School',
      monthlyPrice: 75,
      yearlyPrice: 720,
      yearlyDiscount: 20, // percentage
    },
  },
};

export const AFFILIATE_CONFIG = {
  maxCommission: 50, // percentage
  tiers: [
    { rank: 'Scout', icon: '🔰', minRefs: 1, maxRefs: 5, rate: 25, color: 'from-emerald-500 to-green-600' },
    { rank: 'Champion', icon: '⚔️', minRefs: 6, maxRefs: 15, rate: 30, color: 'from-blue-500 to-indigo-600' },
    { rank: 'Ambassador', icon: '🛡️', minRefs: 16, maxRefs: 30, rate: 40, color: 'from-purple-500 to-violet-600' },
    { rank: 'Legend', icon: '👑', minRefs: 31, maxRefs: 50, rate: 50, color: 'from-amber-500 to-orange-600' },
    { rank: 'Elite', icon: '💎', minRefs: 51, maxRefs: Infinity, rate: 50, color: 'from-pink-500 to-rose-600', bonus: true },
  ],
};

// Helper function to format referral range
export function formatRefRange(minRefs: number, maxRefs: number): string {
  if (maxRefs === Infinity) return `${minRefs}+`;
  return `${minRefs}-${maxRefs}`;
}

// Helper function to format commission rate
export function formatCommissionRate(rate: number, bonus?: boolean): string {
  return bonus ? `${rate}%+` : `${rate}%`;
}

// Animation timing constants
export const ANIMATION_CONFIG = {
  typewriter: {
    typingSpeed: { min: 180, max: 260 }, // ms per character
    deletingSpeed: 100, // ms per character
    pauseAfterWord: 3000, // ms
    pauseBeforeNextWord: 600, // ms
  },
  parallax: {
    throttleMs: 16, // ~60fps
    intensity: 0.02,
  },
  particles: {
    count: 50,
    sizeRange: { min: 2, max: 6 },
    durationRange: { min: 10, max: 20 },
  },
};
