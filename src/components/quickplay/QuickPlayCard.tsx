import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Brain,
  Target,
  Trophy,
  Flame,
  ChevronRight,
  Star,
  Clock,
} from 'lucide-react';
import { cn } from '@/utils';
import { useQuickPlayStore, QUICK_PLAY_GAMES, type QuickPlayGameType } from '@/stores/quickPlayStore';
import { Card } from '@/components/common';

const gameIcons: Record<string, React.ElementType> = {
  Zap: Zap,
  Brain: Brain,
  Target: Target,
};

const gameGradients: Record<QuickPlayGameType, string> = {
  speed_blitz: 'from-amber-500 to-orange-600',
  brain_teaser: 'from-purple-500 to-indigo-600',
  subject_dash: 'from-emerald-500 to-teal-600',
};

interface QuickPlayCardProps {
  onOpenModal: () => void;
  onOpenBrainTeaser: () => void;
  className?: string;
}

export function QuickPlayCard({ onOpenModal, onOpenBrainTeaser, className }: QuickPlayCardProps) {
  const { stats, dailyChallenge, completedToday, fetchDailyChallenge } = useQuickPlayStore();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchDailyChallenge();
  }, [fetchDailyChallenge]);

  const isDailyChallengeCompleted = dailyChallenge?.completed || completedToday.includes(`brain_teaser_${today}`);

  // Find today's quick stats
  const gamesPlayedToday = completedToday.filter(id => id.includes(today)).length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Quick Play</h3>
              <p className="text-white/70 text-sm">2-min brain boosts</p>
            </div>
          </div>

          <button
            onClick={onOpenModal}
            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium flex items-center gap-1"
          >
            Play Now
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/20 text-sm">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span>{stats.gamesPlayed} total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-300" />
            <span>{stats.totalXpEarned} XP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-300" />
            <span>{stats.bestStreak} streak</span>
          </div>
        </div>
      </div>

      {/* Daily Brain Teaser */}
      <div className="p-4 border-b border-neutral-100">
        <button
          onClick={onOpenBrainTeaser}
          className={cn(
            'w-full p-3 rounded-xl transition-all text-left',
            isDailyChallengeCompleted
              ? 'bg-neutral-50'
              : 'bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isDailyChallengeCompleted
                  ? 'bg-neutral-200 text-neutral-500'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
              )}
            >
              <Brain className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-neutral-900">Daily Brain Teaser</h4>
                {isDailyChallengeCompleted ? (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Completed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium animate-pulse">
                    New!
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">
                {isDailyChallengeCompleted
                  ? `Score: ${dailyChallenge?.score || 0}%`
                  : 'One challenging question. Use hints wisely!'}
              </p>
            </div>

            <ChevronRight
              className={cn(
                'w-5 h-5',
                isDailyChallengeCompleted ? 'text-neutral-300' : 'text-purple-400'
              )}
            />
          </div>
        </button>
      </div>

      {/* Quick Games */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
          Quick Games
        </h4>

        <div className="space-y-2">
          {QUICK_PLAY_GAMES.filter(g => g.type !== 'brain_teaser').map((game) => {
            const Icon = gameIcons[game.icon] || Zap;
            const isCompleted = completedToday.includes(`${game.type}_${today}`);

            return (
              <motion.button
                key={game.id}
                onClick={onOpenModal}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br text-white',
                      gameGradients[game.type]
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-neutral-900 text-sm">{game.title}</h5>
                      {isCompleted && (
                        <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {game.duration}s
                      </span>
                      <span>•</span>
                      <span>{game.questionCount} Q</span>
                      <span>•</span>
                      <span className="text-amber-500">{game.xpReward.min}-{game.xpReward.max} XP</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Today's Progress */}
      {gamesPlayedToday > 0 && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">
                {gamesPlayedToday} game{gamesPlayedToday > 1 ? 's' : ''} played today!
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
