import { useEffect } from 'react';
import { Star, TrendingUp, Award, BookOpen, Swords, Flame, Gift, PenTool, Sparkles } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn, formatNumber } from '@/utils';

interface XPPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
  quiz: BookOpen,
  practice: PenTool,
  streak: Flame,
  achievement: Award,
  challenge: Swords,
  daily_bonus: Gift,
  library: BookOpen,
  essay: PenTool,
  other: Sparkles,
};

const typeColors: Record<string, string> = {
  quiz: 'text-blue-500 bg-blue-50',
  practice: 'text-purple-500 bg-purple-50',
  streak: 'text-orange-500 bg-orange-50',
  achievement: 'text-yellow-500 bg-yellow-50',
  challenge: 'text-red-500 bg-red-50',
  daily_bonus: 'text-green-500 bg-green-50',
  library: 'text-indigo-500 bg-indigo-50',
  essay: 'text-pink-500 bg-pink-50',
  other: 'text-gray-500 bg-gray-50',
};

export function XPPopup({ isOpen, onClose }: XPPopupProps) {
  const { xpData, isLoadingXP, fetchXPData } = useNotificationStore();

  useEffect(() => {
    if (isOpen && !xpData) {
      fetchXPData();
    }
  }, [isOpen, xpData, fetchXPData]);

  if (!isOpen) return null;

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6" />
              <span className="font-bold text-lg">Experience Points</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold">{formatNumber(xpData?.totalXP || 0)} XP</p>
            <p className="text-sm text-yellow-100">Level {xpData?.level || 1}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoadingXP ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
            </div>
          ) : (
            <>
              {/* Level Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-neutral-600">Level Progress</span>
                  <span className="font-medium text-neutral-900">
                    {xpData?.progressXP || 0} / {xpData?.neededXP || 1000} XP
                  </span>
                </div>
                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${xpData?.progressPercent || 0}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {xpData?.xpToNextLevel || 0} XP to Level {(xpData?.level || 1) + 1}
                </p>
              </div>

              {/* XP Breakdown */}
              {xpData?.breakdown && xpData.breakdown.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-700">Last 30 Days</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {xpData.breakdown.slice(0, 4).map((item) => {
                      const Icon = typeIcons[item.type] || Sparkles;
                      const colorClass = typeColors[item.type] || typeColors.other;
                      return (
                        <div
                          key={item.type}
                          className={cn('rounded-lg p-2 flex items-center gap-2', colorClass.split(' ')[1])}
                        >
                          <Icon className={cn('w-4 h-4', colorClass.split(' ')[0])} />
                          <div>
                            <p className="text-xs text-neutral-500 capitalize">{item.type.replace('_', ' ')}</p>
                            <p className="font-semibold text-sm">+{formatNumber(item.total)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700">Recent Activity</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {xpData?.transactions && xpData.transactions.length > 0 ? (
                    xpData.transactions.slice(0, 5).map((tx) => {
                      const Icon = typeIcons[tx.type] || Sparkles;
                      const colorClass = typeColors[tx.type] || typeColors.other;
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50"
                        >
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', colorClass.split(' ')[1])}>
                            <Icon className={cn('w-4 h-4', colorClass.split(' ')[0])} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {tx.description || tx.type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-neutral-500">{formatTimeAgo(tx.createdAt)}</p>
                          </div>
                          <span className="text-sm font-bold text-green-600">+{tx.amount}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      No recent activity. Start learning to earn XP!
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
