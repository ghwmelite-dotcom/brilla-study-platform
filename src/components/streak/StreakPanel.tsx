import { useEffect } from 'react';
import { Flame, Shield, Zap, CheckCircle, Lock, Gift, Trophy, Star } from 'lucide-react';
import { useStreakStore } from '@/stores/streakStore';
import { useToastStore } from '@/stores/toastStore';
import { useGamification } from '@/hooks';
import type { StreakMilestone } from '@/types';
import { cn } from '@/utils';

interface MilestoneCardProps {
  milestone: StreakMilestone;
  currentStreak: number;
  onClaim: (id: string) => void;
}

function MilestoneCard({ milestone, currentStreak, onClaim }: MilestoneCardProps) {
  const isAchieved = currentStreak >= milestone.days;
  const canClaim = isAchieved && !milestone.isClaimed;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all duration-200',
        milestone.isClaimed && 'bg-gray-50 border-gray-200',
        canClaim && 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-md',
        !isAchieved && 'bg-white border-gray-200 opacity-60'
      )}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        {milestone.isClaimed ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : isAchieved ? (
          <Gift className="w-5 h-5 text-amber-500 animate-bounce" />
        ) : (
          <Lock className="w-5 h-5 text-gray-400" />
        )}
      </div>

      <div className="flex items-start gap-3">
        {/* Days badge */}
        <div
          className={cn(
            'flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center',
            isAchieved ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' : 'bg-gray-100 text-gray-500'
          )}
        >
          <Flame className="w-5 h-5" />
          <span className="text-xs font-bold">{milestone.days}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900">{milestone.name}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{milestone.description}</p>

          {/* Rewards */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <Zap className="w-4 h-4" />
              <span className="font-medium">{milestone.xpReward} XP</span>
            </div>
            {milestone.protectionReward > 0 && (
              <div className="flex items-center gap-1 text-indigo-600 text-sm">
                <Shield className="w-4 h-4" />
                <span className="font-medium">+{milestone.protectionReward} protection</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Claim button */}
      {canClaim && (
        <button
          onClick={() => onClaim(milestone.id)}
          className="mt-3 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-colors flex items-center justify-center gap-2"
        >
          <Gift className="w-4 h-4" />
          Claim Reward
        </button>
      )}

      {/* Progress bar for unclaimed milestones */}
      {!isAchieved && !milestone.isClaimed && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{currentStreak} / {milestone.days} days</span>
            <span>{Math.round((currentStreak / milestone.days) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (currentStreak / milestone.days) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function StreakPanel() {
  const { streakInfo, milestones, isLoading, fetchStreakInfo, useProtection: activateProtection, claimMilestone } =
    useStreakStore();
  const toast = useToastStore();
  const { awardXP } = useGamification();

  useEffect(() => {
    fetchStreakInfo();
  }, [fetchStreakInfo]);

  const handleUseProtection = async () => {
    const success = await activateProtection();
    if (success) {
      toast.showSuccess('Streak Protected!', 'Your streak is now frozen for today');
    } else {
      toast.showError('Failed', 'Could not activate streak protection');
    }
  };

  const handleClaimMilestone = async (milestoneId: string) => {
    const result = await claimMilestone(milestoneId);
    if (result) {
      awardXP(result.xp, 'Streak milestone!');
      toast.showSuccess(
        'Milestone Claimed!',
        `+${result.xp} XP${result.protections > 0 ? ` and +${result.protections} streak protection` : ''}`
      );
    }
  };

  if (isLoading || !streakInfo) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  const unclaimedMilestones = streakInfo.recentMilestones;

  return (
    <div className="space-y-6">
      {/* Current Streak Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-6 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-6 h-6 animate-pulse" />
              <span className="text-sm font-medium opacity-90">Current Streak</span>
            </div>
            <div className="text-5xl font-bold">{streakInfo.currentStreak}</div>
            <div className="text-sm opacity-80 mt-1">
              {streakInfo.currentStreak === 1 ? 'day' : 'days'} in a row
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 mb-2">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Best: {streakInfo.longestStreak}</span>
            </div>
            {streakInfo.nextMilestone && (
              <div className="text-sm opacity-80">
                <Star className="w-4 h-4 inline mr-1" />
                {streakInfo.nextMilestone.days - streakInfo.currentStreak} days to next reward
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Streak Protection Card */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              streakInfo.protection.isActive ? 'bg-indigo-100' : 'bg-gray-100'
            )}>
              <Shield className={cn(
                'w-6 h-6',
                streakInfo.protection.isActive ? 'text-indigo-600' : 'text-gray-500'
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Streak Protection</h3>
              <p className="text-sm text-gray-500">
                {streakInfo.protection.available} protection{streakInfo.protection.available !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {streakInfo.protection.isActive ? (
            <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Active Today
            </span>
          ) : streakInfo.protection.canUseToday ? (
            <button
              onClick={handleUseProtection}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Activate
            </button>
          ) : (
            <span className="text-sm text-gray-400">
              {streakInfo.protection.available === 0 ? 'Earn more from milestones' : 'Already used today'}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          {streakInfo.protection.isActive
            ? "Your streak is protected! You won't lose your streak if you miss studying today."
            : 'Use streak protection to freeze your streak for a day when you cannot study. Earn more by hitting streak milestones!'}
        </p>
      </div>

      {/* Unclaimed Milestones Alert */}
      {unclaimedMilestones.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">
              {unclaimedMilestones.length} Reward{unclaimedMilestones.length > 1 ? 's' : ''} Ready!
            </h3>
          </div>
          <div className="space-y-3">
            {unclaimedMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                currentStreak={streakInfo.currentStreak}
                onClaim={handleClaimMilestone}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Milestones */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Streak Milestones
        </h3>
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              currentStreak={streakInfo.currentStreak}
              onClaim={handleClaimMilestone}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
