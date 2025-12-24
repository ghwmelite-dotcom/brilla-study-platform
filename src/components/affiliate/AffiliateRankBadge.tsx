import type { AffiliateTier } from '@/types';

interface AffiliateRankBadgeProps {
  tier: AffiliateTier;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  showCommission?: boolean;
}

const TIER_STYLES: Record<string, { gradient: string; glow: string }> = {
  scout: {
    gradient: 'from-emerald-400 to-green-600',
    glow: 'shadow-emerald-500/30',
  },
  champion: {
    gradient: 'from-blue-400 to-indigo-600',
    glow: 'shadow-blue-500/30',
  },
  ambassador: {
    gradient: 'from-purple-400 to-violet-600',
    glow: 'shadow-purple-500/30',
  },
  legend: {
    gradient: 'from-amber-400 to-orange-600',
    glow: 'shadow-amber-500/30',
  },
  elite: {
    gradient: 'from-pink-400 to-rose-600',
    glow: 'shadow-pink-500/30',
  },
};

export function AffiliateRankBadge({
  tier,
  size = 'md',
  showTitle = true,
  showCommission = false,
}: AffiliateRankBadgeProps) {
  const styles = TIER_STYLES[tier.name] || TIER_STYLES.scout;

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${styles.gradient} ${styles.glow} shadow-lg flex items-center justify-center`}
      >
        <span className="drop-shadow">{tier.badgeIcon}</span>
      </div>
      {showTitle && (
        <div>
          <p className={`font-semibold text-neutral-900 ${textSizes[size]}`}>
            {tier.title}
          </p>
          {showCommission && (
            <p className={`text-neutral-500 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
              {(tier.commissionRate * 100).toFixed(0)}% commission
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function AffiliateTierProgress({
  currentTier,
  nextTier,
  referralsToNext,
  totalReferrals,
}: {
  currentTier: AffiliateTier;
  nextTier?: AffiliateTier;
  referralsToNext?: number;
  totalReferrals: number;
}) {
  if (!nextTier || !referralsToNext) {
    return (
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{currentTier.badgeIcon}</span>
          <div>
            <p className="font-bold text-lg">{currentTier.title}</p>
            <p className="text-white/80 text-sm">Maximum tier achieved!</p>
          </div>
        </div>
        <p className="text-sm text-white/90">
          You've reached the elite status. Enjoy {(currentTier.commissionRate * 100).toFixed(0)}% commission + exclusive bonuses!
        </p>
      </div>
    );
  }

  const currentStyles = TIER_STYLES[currentTier.name] || TIER_STYLES.scout;
  const nextStyles = TIER_STYLES[nextTier.name] || TIER_STYLES.scout;

  const referralsNeeded = nextTier.minReferrals - totalReferrals;
  const progress = ((totalReferrals - currentTier.minReferrals) / (nextTier.minReferrals - currentTier.minReferrals)) * 100;

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${currentStyles.gradient} flex items-center justify-center text-2xl`}>
            {currentTier.badgeIcon}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{currentTier.title}</p>
            <p className="text-sm text-neutral-500">
              {(currentTier.commissionRate * 100).toFixed(0)}% commission
            </p>
          </div>
        </div>

        <div className="text-neutral-300">→</div>

        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${nextStyles.gradient} opacity-60 flex items-center justify-center text-2xl`}>
            {nextTier.badgeIcon}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{nextTier.title}</p>
            <p className="text-sm text-neutral-500">
              {(nextTier.commissionRate * 100).toFixed(0)}% commission
            </p>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-neutral-500">Progress to next tier</span>
          <span className="font-medium text-neutral-900">
            {totalReferrals} / {nextTier.minReferrals} referrals
          </span>
        </div>
        <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${nextStyles.gradient} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-center text-neutral-600">
        <span className="font-semibold text-primary">{referralsNeeded}</span> more referral{referralsNeeded !== 1 ? 's' : ''} to reach{' '}
        <span className="font-semibold">{nextTier.title}</span>!
      </p>
    </div>
  );
}

export default AffiliateRankBadge;
