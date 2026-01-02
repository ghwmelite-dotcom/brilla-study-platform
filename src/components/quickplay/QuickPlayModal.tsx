import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Brain,
  Target,
  Trophy,
  Clock,
  Star,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { cn } from '@/utils';
import { useQuickPlayStore, QUICK_PLAY_GAMES, type QuickPlayGameType } from '@/stores/quickPlayStore';
import { subjects } from '@/data';

interface QuickPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export function QuickPlayModal({ isOpen, onClose }: QuickPlayModalProps) {
  const { stats, completedToday, startGame, isLoading } = useQuickPlayStore();
  const [selectedGame, setSelectedGame] = useState<QuickPlayGameType | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  const handleStartGame = async () => {
    if (!selectedGame) return;

    if (selectedGame === 'subject_dash' && !selectedSubject) {
      return; // Need subject selection
    }

    await startGame(selectedGame, selectedSubject || undefined);
    onClose();
  };

  const isGameCompletedToday = (gameType: QuickPlayGameType) => {
    return completedToday.includes(`${gameType}_${today}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Quick Play</h2>
                  <p className="text-white/80 text-sm">2-minute brain boosts</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm">{stats.gamesPlayed} games</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm">{stats.totalXpEarned} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span className="text-sm">{stats.bestStreak} streak</span>
                </div>
              </div>
            </div>

            {/* Game Selection */}
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                Choose a Game
              </h3>

              {QUICK_PLAY_GAMES.map((game) => {
                const Icon = gameIcons[game.icon] || Zap;
                const isCompleted = isGameCompletedToday(game.type);
                const isSelected = selectedGame === game.type;

                return (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.type)}
                    disabled={isCompleted && game.type === 'brain_teaser'}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-neutral-300',
                      isCompleted && game.type === 'brain_teaser' && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br text-white',
                          gameGradients[game.type]
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-neutral-900">{game.title}</h4>
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              Done today
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">{game.description}</p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {game.duration}s
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {game.questionCount} Q
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {game.xpReward.min}-{game.xpReward.max} XP
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        className={cn(
                          'w-5 h-5 transition-transform',
                          isSelected ? 'text-primary rotate-90' : 'text-neutral-300'
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Subject Selection for Subject Dash */}
            <AnimatePresence>
              {selectedGame === 'subject_dash' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-neutral-100"
                >
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">
                      Select Subject
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {subjects.slice(0, 4).map((subject) => (
                        <button
                          key={subject.id}
                          onClick={() => setSelectedSubject(subject.id)}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-all text-left',
                            selectedSubject === subject.id
                              ? 'border-primary bg-primary/5'
                              : 'border-neutral-200 hover:border-neutral-300'
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: subject.color }}
                          >
                            {subject.name[0]}
                          </div>
                          <p className="font-medium text-neutral-900 text-sm">{subject.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start Button */}
            <div className="p-4 border-t border-neutral-100">
              <button
                onClick={handleStartGame}
                disabled={
                  !selectedGame ||
                  isLoading ||
                  (selectedGame === 'subject_dash' && !selectedSubject)
                }
                className={cn(
                  'w-full py-3 rounded-xl font-semibold text-white transition-all',
                  'bg-gradient-to-r from-primary to-primary-dark',
                  'hover:shadow-lg hover:shadow-primary/30',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none'
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Starting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />
                    Start Game
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
