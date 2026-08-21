import { useEffect } from 'react';
import { Flame, Trophy, Calendar, Zap, CheckCircle, Circle } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/utils';

interface StreakPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StreakPopup({ isOpen, onClose }: StreakPopupProps) {
  const { streakData, isLoadingStreak, fetchStreakData } = useNotificationStore();

  useEffect(() => {
    if (isOpen && !streakData) {
      fetchStreakData();
    }
  }, [isOpen, streakData, fetchStreakData]);

  if (!isOpen) return null;

  // Generate last 7 days for calendar view
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const historyItem = streakData?.history.find((h) => h.date === dateStr);
      days.push({
        date: dateStr,
        dayName,
        isToday: i === 0,
        completed: !!historyItem,
        xpEarned: historyItem?.xpEarned || 0,
      });
    }
    return days;
  };

  const days = getLast7Days();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6" />
              <span className="font-bold text-lg">Streak</span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{streakData?.currentStreak || 0}</p>
              <p className="text-xs text-orange-100">days</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoadingStreak ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <Trophy className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-orange-600">
                    {streakData?.longestStreak || 0}
                  </p>
                  <p className="text-xs text-neutral-500">Longest Streak</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Zap className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-green-600">
                    {streakData?.todayXP || 0}
                  </p>
                  <p className="text-xs text-neutral-500">XP Today</p>
                </div>
              </div>

              {/* Weekly Calendar */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700">This Week</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day) => (
                    <div
                      key={day.date}
                      className={cn(
                        'flex flex-col items-center p-2 rounded-lg',
                        day.isToday && 'bg-orange-50 ring-2 ring-orange-300',
                        day.completed && !day.isToday && 'bg-green-50'
                      )}
                    >
                      <span className="text-xs text-neutral-500 mb-1">{day.dayName}</span>
                      {day.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : day.isToday ? (
                        <Circle className="w-5 h-5 text-orange-300" />
                      ) : (
                        <Circle className="w-5 h-5 text-neutral-200" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Today Status */}
              <div
                className={cn(
                  'rounded-lg p-3 text-center',
                  streakData?.todayCompleted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                )}
              >
                {streakData?.todayCompleted ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">You've completed today's streak!</span>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium mb-1">Keep your streak alive!</p>
                    <p className="text-sm">Complete a quiz or practice session today</p>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">
                  <span className="font-medium">Tip:</span> Complete at least one activity daily to maintain your streak and earn bonus XP!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
