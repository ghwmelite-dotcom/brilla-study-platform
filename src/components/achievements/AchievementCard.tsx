import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  Flame,
  Target,
  Zap,
  Users,
  Sparkles,
  Grid3x3,
  Star,
  GraduationCap,
  Crown,
  Trophy,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils';
import { type Achievement, RARITY_CONFIG } from '@/data/achievements';

// Icon mapping for achievements
const iconMap: Record<string, LucideIcon> = {
  Award,
  BookOpen,
  Flame,
  Target,
  Zap,
  Star,
  GraduationCap,
  Crown,
  Trophy,
  Moon,
  Sun,
  Sparkles,
  Swords: Trophy, // Fallback for Swords
};

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: number; // 0-100 for progress toward unlocking
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function AchievementCard({
  achievement,
  isUnlocked,
  progress = 0,
  showProgress = false,
  size = 'md',
  onClick,
}: AchievementCardProps) {
  const rarity = RARITY_CONFIG[achievement.rarity];
  const Icon = iconMap[achievement.icon] || Award;

  const sizeClasses = {
    sm: {
      card: 'p-3',
      icon: 'w-8 h-8',
      iconSize: 'w-4 h-4',
      title: 'text-sm',
      desc: 'text-xs',
      xp: 'text-xs',
    },
    md: {
      card: 'p-4',
      icon: 'w-12 h-12',
      iconSize: 'w-6 h-6',
      title: 'text-base',
      desc: 'text-sm',
      xp: 'text-sm',
    },
    lg: {
      card: 'p-5',
      icon: 'w-16 h-16',
      iconSize: 'w-8 h-8',
      title: 'text-lg',
      desc: 'text-base',
      xp: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 transition-all duration-300',
        sizes.card,
        onClick && 'cursor-pointer',
        isUnlocked ? `${rarity.bg} ${rarity.border} ${rarity.glow}` : 'bg-neutral-100 border-neutral-200 opacity-60'
      )}
    >
      {/* Rarity Badge */}
      <div className="absolute top-2 right-2">
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
            isUnlocked ? `${rarity.bg} ${rarity.text}` : 'bg-neutral-200 text-neutral-500'
          )}
        >
          {rarity.label}
        </span>
      </div>

      {/* Unlock Percentage */}
      {achievement.unlockPercentage !== undefined && (
        <div className="absolute bottom-2 right-2">
          <span className="text-xs text-neutral-400">
            {achievement.unlockPercentage}% have this
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 rounded-xl flex items-center justify-center',
            sizes.icon,
            isUnlocked
              ? `bg-gradient-to-br ${rarity.gradient}`
              : 'bg-neutral-200'
          )}
        >
          <Icon
            className={cn(
              sizes.iconSize,
              isUnlocked ? 'text-white' : 'text-neutral-400'
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'font-semibold truncate',
              sizes.title,
              isUnlocked ? 'text-neutral-900' : 'text-neutral-500'
            )}
          >
            {achievement.name}
          </h4>
          <p
            className={cn(
              'mt-1 line-clamp-2',
              sizes.desc,
              isUnlocked ? 'text-neutral-600' : 'text-neutral-400'
            )}
          >
            {achievement.description}
          </p>

          {/* XP Reward */}
          <div className={cn('mt-2 flex items-center gap-2', sizes.xp)}>
            <span
              className={cn(
                'font-semibold',
                isUnlocked ? 'text-amber-600' : 'text-neutral-400'
              )}
            >
              +{achievement.xpReward} XP
            </span>
          </div>

          {/* Progress Bar */}
          {showProgress && !isUnlocked && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full bg-gradient-to-r', rarity.gradient)}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Effects for Legendary */}
      {isUnlocked && achievement.visualEffect === 'particles' && (
        <ParticleEffect />
      )}

      {/* Glow Effect for Epic/Legendary */}
      {isUnlocked && (achievement.rarity === 'epic' || achievement.rarity === 'legendary') && (
        <div
          className={cn(
            'absolute inset-0 rounded-xl pointer-events-none',
            achievement.rarity === 'legendary' && 'animate-pulse'
          )}
          style={{
            background: `radial-gradient(circle at center, ${
              achievement.rarity === 'legendary' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(168, 85, 247, 0.1)'
            } 0%, transparent 70%)`,
          }}
        />
      )}
    </motion.div>
  );
}

// Particle effect for legendary achievements
function ParticleEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-400 rounded-full"
          initial={{
            x: '50%',
            y: '100%',
            opacity: 0,
          }}
          animate={{
            x: `${20 + Math.random() * 60}%`,
            y: `${-20 + Math.random() * 40}%`,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

// Grid of achievements
interface AchievementGridProps {
  achievements: Achievement[];
  unlockedIds: Set<string>;
  progressMap?: Record<string, number>;
  columns?: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg';
  onAchievementClick?: (achievement: Achievement) => void;
}

export function AchievementGrid({
  achievements,
  unlockedIds,
  progressMap = {},
  columns = 2,
  size = 'md',
  onAchievementClick,
}: AchievementGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          isUnlocked={unlockedIds.has(achievement.id)}
          progress={progressMap[achievement.id]}
          showProgress={!unlockedIds.has(achievement.id)}
          size={size}
          onClick={onAchievementClick ? () => onAchievementClick(achievement) : undefined}
        />
      ))}
    </div>
  );
}

// Category filter tabs
interface AchievementCategoryTabsProps {
  activeCategory: Achievement['category'] | 'all';
  onCategoryChange: (category: Achievement['category'] | 'all') => void;
  counts?: Record<string, { total: number; unlocked: number }>;
}

// Category icon mapping
const categoryIcons: Record<string, LucideIcon> = {
  all: Grid3x3,
  learning: BookOpen,
  streak: Flame,
  accuracy: Target,
  speed: Zap,
  social: Users,
  special: Sparkles,
};

export function AchievementCategoryTabs({
  activeCategory,
  onCategoryChange,
  counts = {},
}: AchievementCategoryTabsProps) {
  const categories: Array<{ id: Achievement['category'] | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'learning', label: 'Learning' },
    { id: 'streak', label: 'Streaks' },
    { id: 'accuracy', label: 'Accuracy' },
    { id: 'speed', label: 'Speed' },
    { id: 'social', label: 'Social' },
    { id: 'special', label: 'Special' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(({ id, label }) => {
        const IconComponent = categoryIcons[id];
        const count = counts[id];

        return (
          <button
            key={id}
            onClick={() => onCategoryChange(id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeCategory === id
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            <IconComponent className="w-4 h-4" />
            <span>{label}</span>
            {count && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeCategory === id
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-200 text-neutral-500'
              )}>
                {count.unlocked}/{count.total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
