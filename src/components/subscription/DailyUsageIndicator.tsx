/**
 * Daily Usage Indicator
 * Shows remaining questions for free users with visual progress
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Crown, Clock } from 'lucide-react';
import { useUsageStore } from '@/stores';
import { formatTimeUntilReset } from '@/config';
import { cn } from '@/utils';

interface DailyUsageIndicatorProps {
  variant?: 'compact' | 'full';
  className?: string;
  onUpgradeClick?: () => void;
}

export function DailyUsageIndicator({
  variant = 'compact',
  className,
  onUpgradeClick,
}: DailyUsageIndicatorProps) {
  const navigate = useNavigate();
  const { dailyUsage, isLoading, fetchDailyUsage } = useUsageStore();

  useEffect(() => {
    fetchDailyUsage();
  }, [fetchDailyUsage]);

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate('/pricing');
    }
  };

  // Don't show for premium users
  if (dailyUsage?.isUnlimited) {
    if (variant === 'full') {
      return (
        <div className={cn('flex items-center gap-2 text-sm text-amber-600', className)}>
          <Crown className="w-4 h-4" />
          <span className="font-medium">Unlimited Access</span>
        </div>
      );
    }
    return null;
  }

  if (isLoading || !dailyUsage) {
    return (
      <div className={cn('animate-pulse bg-neutral-200 rounded-full h-6 w-20', className)} />
    );
  }

  const { used, limit, remaining, resetsAt } = dailyUsage;
  const percentage = Math.round((used / limit) * 100);

  // Determine color based on remaining
  const getColor = () => {
    if (remaining > 5) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (remaining > 2) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProgressColor = () => {
    if (remaining > 5) return 'bg-emerald-500';
    if (remaining > 2) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleUpgradeClick}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:scale-105',
          getColor(),
          className
        )}
        title={`${remaining} questions remaining today. ${formatTimeUntilReset(resetsAt)}`}
      >
        <Zap className="w-3.5 h-3.5" />
        <span>{remaining}/{limit}</span>
      </button>
    );
  }

  // Full variant
  return (
    <div className={cn('p-4 rounded-xl border', getColor(), className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <span className="font-semibold">Daily Questions</span>
        </div>
        <span className="text-lg font-bold">{remaining}/{limit}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-full rounded-full transition-all', getProgressColor())}
          style={{ width: `${100 - percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-neutral-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimeUntilReset(resetsAt)}</span>
        </div>

        {remaining <= 3 && (
          <button
            onClick={handleUpgradeClick}
            className="flex items-center gap-1 text-primary font-medium hover:underline"
          >
            <Crown className="w-3.5 h-3.5" />
            Upgrade for unlimited
          </button>
        )}
      </div>
    </div>
  );
}

export default DailyUsageIndicator;
