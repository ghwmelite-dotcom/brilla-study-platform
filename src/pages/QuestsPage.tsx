import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  Trophy,
  Flame,
  Zap,
  Star,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useQuestStore } from '@/stores/questStore';
import { useProgressStore } from '@/stores/progressStore';
import { QuestsPanel } from '@/components/quests';
import { cn } from '@/utils';

export default function QuestsPage() {
  const navigate = useNavigate();
  const { weeklyChallenge, fetchWeeklyChallenge, refreshQuests, isLoading } = useQuestStore();
  const { currentStreak, longestStreak } = useProgressStore();

  useEffect(() => {
    fetchWeeklyChallenge();
  }, [fetchWeeklyChallenge]);

  const handleRefresh = () => {
    refreshQuests();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quests & Challenges</h1>
              <p className="text-gray-500">Complete quests to earn XP and rewards</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{currentStreak}</div>
              <div className="text-xs text-gray-500">Day Streak</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Trophy className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{longestStreak}</div>
              <div className="text-xs text-gray-500">Best Streak</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {useQuestStore.getState().dailyQuests.filter((q) => q.status === 'claimed').length}
              </div>
              <div className="text-xs text-gray-500">Today's Quests</div>
            </div>
          </div>
        </div>

        {/* Weekly Challenge Banner */}
        {weeklyChallenge && (
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-medium text-purple-200 uppercase tracking-wide">
                    Weekly Challenge
                  </span>
                </div>

                <h2 className="text-2xl font-bold mb-2">{weeklyChallenge.title}</h2>
                <p className="text-purple-100 mb-4">{weeklyChallenge.description}</p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>
                      {weeklyChallenge.userProgress || 0} / {weeklyChallenge.requirementValue}
                    </span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          ((weeklyChallenge.userProgress || 0) / weeklyChallenge.requirementValue) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Zap className="w-5 h-5 text-yellow-300" />
                      <span className="font-bold">{weeklyChallenge.xpReward} XP</span>
                    </div>
                    {weeklyChallenge.bonusReward && (
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-300" />
                        <span className="font-medium">{weeklyChallenge.bonusReward}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-purple-200">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Ends {new Date(weeklyChallenge.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quest Tabs */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <QuestsPanel type="all" />
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Flame className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Quest Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Daily quests reset at midnight - complete them before they expire!
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Hard quests give more XP - challenge yourself for bigger rewards
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Weekly challenges give bonus rewards - aim for the big prize!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
