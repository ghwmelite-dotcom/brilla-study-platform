import { useEffect } from 'react';
import {
  Target,
  Clock,
  CheckCircle,
  Gift,
  Zap,
  Flame,
  Star,
  Trophy,
  BookOpen,
  Award,
  Swords,
  Crown,
} from 'lucide-react';
import { useQuestStore } from '@/stores/questStore';
import { useToastStore } from '@/stores/toastStore';
import { useGamification } from '@/hooks';
import type { UserQuest, QuestDifficulty } from '@/types';
import { cn } from '@/utils';

const QUEST_ICONS: Record<string, React.ReactNode> = {
  'book-open': <BookOpen className="w-5 h-5" />,
  'check-circle': <CheckCircle className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  swords: <Swords className="w-5 h-5" />,
  trophy: <Trophy className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />,
  crown: <Crown className="w-5 h-5" />,
};

const DIFFICULTY_COLORS: Record<QuestDifficulty, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
};

const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

interface QuestCardProps {
  quest: UserQuest;
  onClaim: (questId: string) => void;
}

function QuestCard({ quest, onClaim }: QuestCardProps) {
  const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
  const isCompleted = quest.status === 'completed';
  const isClaimed = quest.status === 'claimed';
  const isExpired = quest.status === 'expired';

  // Calculate time remaining
  const expiresAt = new Date(quest.expiresAt);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 transition-all duration-200',
        isClaimed && 'bg-gray-50 opacity-60',
        isExpired && 'bg-gray-50 opacity-50',
        !isClaimed && !isExpired && 'bg-white hover:shadow-md'
      )}
    >
      {/* Difficulty badge */}
      {quest.quest?.difficulty && (
        <span
          className={cn(
            'absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full border',
            DIFFICULTY_COLORS[quest.quest.difficulty]
          )}
        >
          {DIFFICULTY_LABELS[quest.quest.difficulty]}
        </span>
      )}

      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
            isCompleted || isClaimed
              ? 'bg-green-100 text-green-600'
              : 'bg-indigo-100 text-indigo-600'
          )}
        >
          {isCompleted || isClaimed ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            QUEST_ICONS[quest.quest?.icon || 'target'] || <Target className="w-6 h-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{quest.quest?.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{quest.quest?.description}</p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">
                {quest.progress} / {quest.target}
              </span>
              <span className="font-medium text-gray-700">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isCompleted || isClaimed
                    ? 'bg-green-500'
                    : progressPercent >= 75
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-3">
            {/* Reward */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{quest.quest?.xpReward} XP</span>
              </div>
              {!isClaimed && !isExpired && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">{hoursLeft}h left</span>
                </div>
              )}
            </div>

            {/* Claim button */}
            {isCompleted && !isClaimed && (
              <button
                onClick={() => onClaim(quest.id)}
                className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-colors animate-pulse"
              >
                <Gift className="w-4 h-4" />
                Claim
              </button>
            )}
            {isClaimed && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Claimed
              </span>
            )}
            {isExpired && (
              <span className="text-xs text-gray-400 font-medium">Expired</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuestsPanelProps {
  type?: 'daily' | 'weekly' | 'all';
  compact?: boolean;
}

export function QuestsPanel({ type = 'all', compact = false }: QuestsPanelProps) {
  const { dailyQuests, weeklyQuests, isLoading, fetchDailyQuests, fetchWeeklyQuests, claimReward } =
    useQuestStore();
  const toast = useToastStore();
  const { awardXP } = useGamification();

  useEffect(() => {
    if (type === 'daily' || type === 'all') {
      fetchDailyQuests();
    }
    if (type === 'weekly' || type === 'all') {
      fetchWeeklyQuests();
    }
  }, [type, fetchDailyQuests, fetchWeeklyQuests]);

  const handleClaim = async (questId: string) => {
    const result = await claimReward(questId);
    if (result) {
      awardXP(result.xp, 'Quest completed!');
      toast.showSuccess('Quest Complete!', `You earned ${result.xp} XP`);
    }
  };

  const activeDaily = dailyQuests.filter((q) => q.status !== 'expired' && q.status !== 'claimed');
  const activeWeekly = weeklyQuests.filter((q) => q.status !== 'expired' && q.status !== 'claimed');
  const claimedToday = dailyQuests.filter((q) => q.status === 'claimed').length;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Quests */}
      {(type === 'daily' || type === 'all') && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Daily Quests</h2>
                <p className="text-xs text-gray-500">
                  {claimedToday}/{dailyQuests.length} completed today
                </p>
              </div>
            </div>
            {!compact && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                Resets at midnight
              </div>
            )}
          </div>

          {activeDaily.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">All daily quests completed!</p>
              <p className="text-sm text-gray-400">Come back tomorrow for new quests</p>
            </div>
          ) : (
            <div className={cn('space-y-3', compact && 'space-y-2')}>
              {(compact ? activeDaily.slice(0, 3) : activeDaily).map((quest) => (
                <QuestCard key={quest.id} quest={quest} onClaim={handleClaim} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Quests */}
      {(type === 'weekly' || type === 'all') && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Weekly Quests</h2>
                <p className="text-xs text-gray-500">Bigger rewards for bigger goals</p>
              </div>
            </div>
          </div>

          {activeWeekly.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Trophy className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">All weekly quests completed!</p>
              <p className="text-sm text-gray-400">New quests arrive Monday</p>
            </div>
          ) : (
            <div className={cn('space-y-3', compact && 'space-y-2')}>
              {(compact ? activeWeekly.slice(0, 2) : activeWeekly).map((quest) => (
                <QuestCard key={quest.id} quest={quest} onClaim={handleClaim} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
