import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Gift,
  CheckCircle,
  Trophy,
  Zap,
  Star,
  Target,
  Flame,
  Users,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button, ProgressBar } from '@/components/common';
import { useEventStore, type SeasonalEvent, type EventQuest } from '@/stores/eventStore';

interface EventModalProps {
  event: SeasonalEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventModal({ event, isOpen, onClose }: EventModalProps) {
  const { getTimeRemaining, claimEventReward } = useEventStore();

  if (!event) return null;

  const timeRemaining = getTimeRemaining(event.endDate);
  const completedQuests = event.quests.filter(q => q.isCompleted).length;
  const totalQuests = event.quests.length;
  const overallProgress = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div
              className="relative p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${event.accentColor} 0%, ${event.accentColor}dd 100%)`,
              }}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
              </div>

              <div className="relative">
                <button
                  onClick={onClose}
                  className="absolute top-0 right-0 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Event badge */}
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-sm font-medium mb-3">
                  <Zap className="w-4 h-4" />
                  {event.xpMultiplier}x XP Active
                </div>

                <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
                <p className="text-white/80 mb-4">{event.description}</p>

                {/* Time remaining */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                      {timeRemaining.hours}h {timeRemaining.minutes}m
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    <span>{completedQuests}/{totalQuests} quests</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-neutral-900">Event Progress</h4>
                  <span className="text-sm text-neutral-500">{Math.round(overallProgress)}%</span>
                </div>
                <ProgressBar value={overallProgress} />
              </div>

              {/* Quests */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">Event Quests</h4>
                <div className="space-y-3">
                  {event.quests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      accentColor={event.accentColor}
                    />
                  ))}
                </div>
              </div>

              {/* Rewards */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">Event Rewards</h4>
                <div className="grid grid-cols-2 gap-3">
                  {event.rewards.map((reward) => {
                    const isClaimed = event.userProgress?.rewardsClaimed.includes(reward.id);
                    const canClaim = overallProgress >= 100 && !isClaimed;

                    return (
                      <div
                        key={reward.id}
                        className={cn(
                          'p-3 rounded-xl border transition-all',
                          isClaimed
                            ? 'bg-neutral-50 border-neutral-200 opacity-60'
                            : 'bg-white border-neutral-200 hover:border-neutral-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              reward.rarity === 'legendary' && 'bg-amber-100',
                              reward.rarity === 'epic' && 'bg-purple-100',
                              reward.rarity === 'rare' && 'bg-blue-100',
                              !reward.rarity && 'bg-neutral-100'
                            )}
                          >
                            {reward.type === 'xp' && <Star className="w-5 h-5 text-amber-500" />}
                            {reward.type === 'badge' && <Trophy className="w-5 h-5 text-purple-500" />}
                            {reward.type === 'protection' && <Target className="w-5 h-5 text-blue-500" />}
                            {reward.type === 'cosmetic' && <Gift className="w-5 h-5 text-pink-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 text-sm truncate">
                              {reward.name}
                            </p>
                            {reward.rarity && (
                              <p className={cn(
                                'text-xs capitalize',
                                reward.rarity === 'legendary' && 'text-amber-600',
                                reward.rarity === 'epic' && 'text-purple-600',
                                reward.rarity === 'rare' && 'text-blue-600'
                              )}>
                                {reward.rarity}
                              </p>
                            )}
                          </div>
                          {isClaimed && (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>

                        {canClaim && (
                          <Button
                            size="sm"
                            fullWidth
                            className="mt-3"
                            onClick={() => claimEventReward(event.id, reward.id)}
                          >
                            Claim
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-100">
              <Button
                fullWidth
                onClick={onClose}
                style={{ backgroundColor: event.accentColor }}
              >
                Continue Quests
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Quest card component
function QuestCard({
  quest,
  accentColor,
}: {
  quest: EventQuest;
  accentColor: string;
}) {
  const questIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    questions_answered: Target,
    accuracy: Star,
    streak: Flame,
    battles_won: Trophy,
    time_spent: Clock,
    subjects_practiced: Users,
  };

  const Icon = questIcons[quest.requirement.type] || Target;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        quest.isCompleted
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-neutral-200'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            quest.isCompleted ? 'bg-emerald-100' : 'bg-neutral-100'
          )}
          style={!quest.isCompleted ? { backgroundColor: `${accentColor}20` } : undefined}
        >
          {quest.isCompleted ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <Icon className="w-5 h-5 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h5 className={cn(
              'font-medium',
              quest.isCompleted ? 'text-emerald-700' : 'text-neutral-900'
            )}>
              {quest.name}
            </h5>
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              quest.isCompleted
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-neutral-100 text-neutral-600'
            )}>
              +{quest.reward.type === 'xp' ? `${quest.reward.value} XP` : quest.reward.name}
            </span>
          </div>

          <p className="text-sm text-neutral-500 mb-2">{quest.description}</p>

          {!quest.isCompleted && (
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Progress</span>
                <span>{quest.progress}%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: accentColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${quest.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
