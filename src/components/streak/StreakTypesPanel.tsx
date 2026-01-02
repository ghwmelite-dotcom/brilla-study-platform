import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Target,
  Star,
  BookOpen,
  Trophy,
  Shield,
  Clock,
} from 'lucide-react';
import { cn } from '@/utils';
import { Card } from '@/components/common';
import { useStreakStore, STREAK_MILESTONES, type SubjectStreak, type ExtendedStreakMilestone } from '@/stores/streakStore';

const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-600' },
  rare: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  epic: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-600' },
  legendary: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-600' },
};

interface StreakTypesPanelProps {
  className?: string;
  onRescueClick?: () => void;
}

export function StreakTypesPanel({ className, onRescueClick }: StreakTypesPanelProps) {
  const {
    streakInfo,
    subjectStreaks,
    accuracyStreak,
    perfectDayStreak,
    streakAtRisk,
    hoursUntilStreakEnds,
    streakRescue,
    fetchSubjectStreaks,
    checkStreakAtRisk,
    getMilestoneProgress,
    getNextMilestone,
  } = useStreakStore();

  useEffect(() => {
    fetchSubjectStreaks();
    checkStreakAtRisk();
  }, [fetchSubjectStreaks, checkStreakAtRisk]);

  const progress = getMilestoneProgress();
  const nextMilestone = getNextMilestone();

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with main streak */}
      <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{streakInfo?.currentStreak || 0}</span>
                <span className="text-white/70">day streak</span>
              </div>
              <p className="text-white/70 text-sm">
                Best: {streakInfo?.longestStreak || 0} days
              </p>
            </div>
          </div>

          {/* Protections */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20">
            <Shield className="w-4 h-4" />
            <span className="font-semibold">{streakInfo?.protection.available || 0}</span>
            <span className="text-white/70 text-sm">protections</span>
          </div>
        </div>

        {/* Streak at risk warning */}
        {streakAtRisk && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-red-600/40 border border-red-400/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 animate-pulse" />
                <span className="font-medium">
                  Streak expires in {hoursUntilStreakEnds?.toFixed(1)}h!
                </span>
              </div>
              {streakRescue.available && (
                <button
                  onClick={onRescueClick}
                  className="px-3 py-1 rounded-lg bg-white text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
                >
                  Rescue Streak
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Progress to next milestone */}
        {nextMilestone && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/70">Next: {nextMilestone.name}</span>
              <span className="font-semibold">{progress.current}/{nextMilestone.days} days</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Streak Types */}
      <div className="p-4 space-y-4">
        {/* Special Streaks */}
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
            Special Streaks
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <StreakCard
              icon={Target}
              label="Accuracy Streak"
              value={accuracyStreak}
              description="Days with 80%+ accuracy"
              color="emerald"
            />
            <StreakCard
              icon={Star}
              label="Perfect Day"
              value={perfectDayStreak}
              description="Days with 100% correct"
              color="amber"
            />
          </div>
        </div>

        {/* Subject Streaks */}
        {subjectStreaks.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
              Subject Streaks
            </h4>
            <div className="space-y-2">
              {subjectStreaks
                .sort((a, b) => b.currentStreak - a.currentStreak)
                .slice(0, 4)
                .map((streak) => (
                  <SubjectStreakRow key={streak.subjectId} streak={streak} />
                ))}
            </div>
          </div>
        )}

        {/* Milestone Rewards */}
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
            Milestone Rewards
          </h4>
          <div className="space-y-2">
            {STREAK_MILESTONES.slice(0, 4).map((milestone) => (
              <MilestoneRow
                key={milestone.id}
                milestone={milestone}
                currentStreak={streakInfo?.currentStreak || 0}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StreakCard({
  icon: Icon,
  label,
  value,
  description,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  description: string;
  color: 'emerald' | 'amber' | 'blue' | 'purple';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs opacity-70">days</span>
      </div>
      <p className="text-xs opacity-70 mt-1">{description}</p>
    </div>
  );
}

function SubjectStreakRow({ streak }: { streak: SubjectStreak }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-neutral-900 text-sm">{streak.subjectName}</p>
          <p className="text-xs text-neutral-400">Best: {streak.longestStreak} days</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-orange-500">
        <Flame className="w-4 h-4" />
        <span className="font-bold">{streak.currentStreak}</span>
      </div>
    </div>
  );
}

function MilestoneRow({
  milestone,
  currentStreak,
}: {
  milestone: ExtendedStreakMilestone;
  currentStreak: number;
}) {
  const isAchieved = currentStreak >= milestone.days;
  const rarity = rarityColors[milestone.rarity];

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-all',
        isAchieved ? rarity.bg : 'bg-neutral-50',
        isAchieved ? rarity.border : 'border-neutral-100',
        isAchieved && 'shadow-sm'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isAchieved ? rarity.bg : 'bg-neutral-100',
            isAchieved && `border ${rarity.border}`
          )}
        >
          <Trophy className={cn('w-5 h-5', isAchieved ? rarity.text : 'text-neutral-400')} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className={cn('font-medium', isAchieved ? 'text-neutral-900' : 'text-neutral-500')}>
              {milestone.name}
            </p>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-xs font-medium capitalize',
                rarity.bg,
                rarity.text
              )}
            >
              {milestone.rarity}
            </span>
          </div>
          <p className="text-xs text-neutral-400">{milestone.days} day streak</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn('font-semibold text-sm', isAchieved ? 'text-amber-600' : 'text-neutral-400')}>
          +{milestone.xpReward} XP
        </p>
        {milestone.protectionReward > 0 && (
          <p className="text-xs text-neutral-400">+{milestone.protectionReward} protection</p>
        )}
      </div>
    </div>
  );
}
