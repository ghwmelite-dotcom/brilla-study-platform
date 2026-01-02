import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Star, Crown, Award, Sparkles } from 'lucide-react';
import { cn } from '@/utils';
import { Card } from '@/components/common';
import { type Achievement, type AchievementRarity, RARITY_CONFIG, ACHIEVEMENTS } from '@/data/achievements';

interface AchievementShowcaseProps {
  unlockedAchievements: string[];
  featuredAchievementIds?: string[]; // Up to 3 featured achievements
  onViewAll?: () => void;
  onAchievementClick?: (achievement: Achievement) => void;
  className?: string;
}

export function AchievementShowcase({
  unlockedAchievements,
  featuredAchievementIds = [],
  onViewAll,
  onAchievementClick,
  className,
}: AchievementShowcaseProps) {
  const unlockedSet = new Set(unlockedAchievements);

  // Get featured achievements or top 3 rarest unlocked
  const featuredAchievements = featuredAchievementIds.length > 0
    ? featuredAchievementIds
        .map(id => ACHIEVEMENTS.find(a => a.id === id))
        .filter(Boolean) as Achievement[]
    : getTopAchievements(unlockedAchievements, 3);

  // Calculate stats
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  const rarityStats = getRarityStats(unlockedAchievements);

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Achievement Showcase</h3>
              <p className="text-white/70 text-sm">
                {unlockedCount}/{totalAchievements} unlocked
              </p>
            </div>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Rarity Progress */}
      <div className="p-4 border-b border-neutral-100">
        <div className="grid grid-cols-4 gap-3">
          {(['common', 'rare', 'epic', 'legendary'] as AchievementRarity[]).map((rarity) => {
            const config = RARITY_CONFIG[rarity];
            const stats = rarityStats[rarity];
            const percentage = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;

            return (
              <div key={rarity} className="text-center">
                <div
                  className={cn(
                    'w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2',
                    config.bg,
                    `border ${config.border}`
                  )}
                >
                  <RarityIcon rarity={rarity} className={cn('w-5 h-5', config.icon)} />
                </div>
                <p className="text-xs font-medium text-neutral-600">{config.label}</p>
                <p className={cn('text-sm font-bold', config.text)}>
                  {stats.unlocked}/{stats.total}
                </p>
                <div className="mt-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full bg-gradient-to-r', config.gradient)}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Achievements */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
          Featured Achievements
        </h4>

        {featuredAchievements.length > 0 ? (
          <div className="space-y-3">
            {featuredAchievements.map((achievement) => (
              <FeaturedAchievementRow
                key={achievement.id}
                achievement={achievement}
                isUnlocked={unlockedSet.has(achievement.id)}
                onClick={onAchievementClick ? () => onAchievementClick(achievement) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No achievements yet</p>
            <p className="text-sm">Complete activities to earn achievements!</p>
          </div>
        )}
      </div>

      {/* Recent Unlock */}
      {unlockedAchievements.length > 0 && (
        <RecentUnlockBanner
          achievement={ACHIEVEMENTS.find(a => a.id === unlockedAchievements[unlockedAchievements.length - 1])}
        />
      )}
    </Card>
  );
}

// Featured achievement row
function FeaturedAchievementRow({
  achievement,
  isUnlocked,
  onClick,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
  onClick?: () => void;
}) {
  const rarity = RARITY_CONFIG[achievement.rarity];

  return (
    <motion.div
      whileHover={onClick ? { x: 4 } : undefined}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
        onClick && 'cursor-pointer',
        isUnlocked ? `${rarity.bg} ${rarity.border} ${rarity.glow}` : 'bg-neutral-50 border-neutral-100'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          isUnlocked ? `bg-gradient-to-br ${rarity.gradient}` : 'bg-neutral-200'
        )}
      >
        <RarityIcon
          rarity={achievement.rarity}
          className={cn('w-6 h-6', isUnlocked ? 'text-white' : 'text-neutral-400')}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h5 className={cn('font-semibold truncate', isUnlocked ? 'text-neutral-900' : 'text-neutral-500')}>
            {achievement.name}
          </h5>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-xs font-medium capitalize',
              rarity.bg,
              rarity.text
            )}
          >
            {achievement.rarity}
          </span>
        </div>
        <p className={cn('text-sm truncate', isUnlocked ? 'text-neutral-600' : 'text-neutral-400')}>
          {achievement.description}
        </p>
      </div>

      <div className="text-right">
        <p className={cn('font-bold', isUnlocked ? 'text-amber-600' : 'text-neutral-400')}>
          +{achievement.xpReward}
        </p>
        <p className="text-xs text-neutral-400">XP</p>
      </div>
    </motion.div>
  );
}

// Recent unlock banner
function RecentUnlockBanner({ achievement }: { achievement?: Achievement }) {
  if (!achievement) return null;

  const rarity = RARITY_CONFIG[achievement.rarity];

  return (
    <div className={cn('p-3 border-t', rarity.bg, rarity.border)}>
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className={cn('w-4 h-4', rarity.icon)} />
        <span className="text-neutral-600">Recently unlocked:</span>
        <span className={cn('font-semibold', rarity.text)}>{achievement.name}</span>
      </div>
    </div>
  );
}

// Rarity icon component
function RarityIcon({ rarity, className }: { rarity: AchievementRarity; className?: string }) {
  switch (rarity) {
    case 'common':
      return <Award className={className} />;
    case 'rare':
      return <Star className={className} />;
    case 'epic':
      return <Trophy className={className} />;
    case 'legendary':
      return <Crown className={className} />;
  }
}

// Helper: Get top N achievements by rarity
function getTopAchievements(unlockedIds: string[], count: number): Achievement[] {
  const rarityOrder: Record<AchievementRarity, number> = {
    legendary: 4,
    epic: 3,
    rare: 2,
    common: 1,
  };

  return ACHIEVEMENTS
    .filter(a => unlockedIds.includes(a.id))
    .sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity])
    .slice(0, count);
}

// Helper: Get stats by rarity
function getRarityStats(unlockedIds: string[]): Record<AchievementRarity, { total: number; unlocked: number }> {
  const unlockedSet = new Set(unlockedIds);
  const stats: Record<AchievementRarity, { total: number; unlocked: number }> = {
    common: { total: 0, unlocked: 0 },
    rare: { total: 0, unlocked: 0 },
    epic: { total: 0, unlocked: 0 },
    legendary: { total: 0, unlocked: 0 },
  };

  ACHIEVEMENTS.forEach(achievement => {
    stats[achievement.rarity].total++;
    if (unlockedSet.has(achievement.id)) {
      stats[achievement.rarity].unlocked++;
    }
  });

  return stats;
}

// Compact showcase for widgets
interface CompactShowcaseProps {
  unlockedAchievements: string[];
  maxDisplay?: number;
  onViewAll?: () => void;
}

export function CompactAchievementShowcase({
  unlockedAchievements,
  maxDisplay = 5,
  onViewAll,
}: CompactShowcaseProps) {
  const topAchievements = getTopAchievements(unlockedAchievements, maxDisplay);

  return (
    <div className="flex items-center gap-2">
      {topAchievements.map((achievement, index) => {
        const rarity = RARITY_CONFIG[achievement.rarity];
        return (
          <motion.div
            key={achievement.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center border-2',
              rarity.bg,
              rarity.border,
              achievement.rarity === 'legendary' && 'animate-pulse'
            )}
            title={achievement.name}
          >
            <RarityIcon rarity={achievement.rarity} className={cn('w-5 h-5', rarity.icon)} />
          </motion.div>
        );
      })}

      {unlockedAchievements.length > maxDisplay && (
        <button
          onClick={onViewAll}
          className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-500 hover:bg-neutral-200 transition-colors"
        >
          +{unlockedAchievements.length - maxDisplay}
        </button>
      )}
    </div>
  );
}
