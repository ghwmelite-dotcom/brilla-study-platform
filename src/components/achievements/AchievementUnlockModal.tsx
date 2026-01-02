import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Star,
  Share2,
  Award,
  BookOpen,
  Flame,
  Target,
  Zap,
  GraduationCap,
  Crown,
  Trophy,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/common';
import { type Achievement, type AchievementRarity, RARITY_CONFIG } from '@/data/achievements';

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

interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
}

export function AchievementUnlockModal({
  achievement,
  isOpen,
  onClose,
  onShare,
}: AchievementUnlockModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && achievement) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, achievement]);

  if (!achievement) return null;

  const rarity = RARITY_CONFIG[achievement.rarity];
  const Icon = iconMap[achievement.icon] || Award;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Confetti Effect */}
          {showConfetti && <ConfettiEffect rarity={achievement.rarity} />}

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with gradient */}
            <div
              className={cn(
                'relative pt-12 pb-16 px-6 text-center text-white overflow-hidden',
                `bg-gradient-to-br ${rarity.gradient}`
              )}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '20px 20px',
                }} />
              </div>

              {/* Glow effect */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Stars decoration */}
              <div className="absolute top-4 left-4">
                <Star className="w-4 h-4 text-white/50" />
              </div>
              <div className="absolute top-8 right-8">
                <Star className="w-3 h-3 text-white/50" />
              </div>
              <div className="absolute bottom-8 left-8">
                <Sparkles className="w-5 h-5 text-white/50" />
              </div>

              {/* Label */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-sm font-medium mb-4"
              >
                <Sparkles className="w-4 h-4" />
                Achievement Unlocked!
              </motion.div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.3, damping: 12 }}
                className="relative inline-flex"
              >
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Icon className="w-12 h-12 text-white" />
                </div>

                {/* Ring animation for legendary */}
                {achievement.rarity === 'legendary' && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-4 border-white/30"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            </div>

            {/* Content */}
            <div className="relative -mt-8 px-6 pb-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                {/* Rarity badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-3"
                  style={{
                    backgroundColor: getRarityBgColor(achievement.rarity),
                    color: getRarityTextColor(achievement.rarity),
                  }}
                >
                  <span className="text-sm font-semibold capitalize">{achievement.rarity}</span>
                </motion.div>

                {/* Name */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-neutral-900 mb-2"
                >
                  {achievement.name}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-neutral-600 mb-4"
                >
                  {achievement.description}
                </motion.p>

                {/* XP Reward */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.7 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200"
                >
                  <span className="text-2xl font-bold text-amber-600">+{achievement.xpReward}</span>
                  <span className="text-amber-600 font-medium">XP</span>
                </motion.div>

                {/* Unlock percentage */}
                {achievement.unlockPercentage !== undefined && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-4 text-sm text-neutral-400"
                  >
                    Only {achievement.unlockPercentage}% of students have this achievement
                  </motion.p>
                )}
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex gap-3 mt-4"
              >
                {onShare && (
                  <Button
                    variant="outline"
                    onClick={onShare}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  className={cn(
                    'flex-1',
                    `bg-gradient-to-r ${rarity.gradient} hover:opacity-90`
                  )}
                >
                  Awesome!
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Confetti effect component
function ConfettiEffect({ rarity }: { rarity: AchievementRarity }) {
  const colors = {
    common: ['#9CA3AF', '#D1D5DB', '#E5E7EB'],
    rare: ['#3B82F6', '#60A5FA', '#93C5FD'],
    epic: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
    legendary: ['#F59E0B', '#FBBF24', '#FCD34D', '#EF4444'],
  };

  const particleColors = colors[rarity];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: particleColors[Math.floor(Math.random() * particleColors.length)],
            left: `${Math.random() * 100}%`,
            top: '-20px',
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 50,
            x: (Math.random() - 0.5) * 200,
            rotate: Math.random() * 720 - 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: 'easeOut',
            delay: Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
}

// Helper functions
function getRarityBgColor(rarity: AchievementRarity): string {
  const colors = {
    common: '#F3F4F6',
    rare: '#DBEAFE',
    epic: '#EDE9FE',
    legendary: '#FEF3C7',
  };
  return colors[rarity];
}

function getRarityTextColor(rarity: AchievementRarity): string {
  const colors = {
    common: '#4B5563',
    rare: '#2563EB',
    epic: '#7C3AED',
    legendary: '#D97706',
  };
  return colors[rarity];
}

// Queue system for multiple achievements
interface AchievementQueueProps {
  achievements: Achievement[];
  onComplete: () => void;
}

export function AchievementUnlockQueue({ achievements, onComplete }: AchievementQueueProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleClose = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (achievements.length === 0) return null;

  return (
    <AchievementUnlockModal
      achievement={achievements[currentIndex]}
      isOpen={true}
      onClose={handleClose}
    />
  );
}

// Toast notification for achievements
interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
  onClick?: () => void;
}

export function AchievementToast({ achievement, onClose, onClick }: AchievementToastProps) {
  const rarity = RARITY_CONFIG[achievement.rarity];
  const Icon = iconMap[achievement.icon] || Award;

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border-2 shadow-lg cursor-pointer',
        rarity.bg,
        rarity.border,
        rarity.glow,
        onClick && 'hover:scale-102 transition-transform'
      )}
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br', rarity.gradient)}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Sparkles className={cn('w-4 h-4', rarity.icon)} />
          <span className="text-sm font-medium text-neutral-500">Achievement Unlocked!</span>
        </div>
        <p className="font-semibold text-neutral-900 truncate">{achievement.name}</p>
        <p className="text-sm text-amber-600 font-medium">+{achievement.xpReward} XP</p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1 rounded-full hover:bg-white/50 transition-colors"
      >
        <X className="w-4 h-4 text-neutral-400" />
      </button>
    </motion.div>
  );
}
