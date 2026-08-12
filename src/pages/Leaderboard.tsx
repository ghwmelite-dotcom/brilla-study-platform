import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Users,
  Flame,
  ArrowLeft,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Flag,
  Timer,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLeaderboardStore } from '@/stores/leaderboardStore';
import { useRaceStore } from '@/stores/raceStore';
import type { RaceCurrent } from '@/stores/raceStore';
import type { LeaderboardPeriod, LeaderboardEntry } from '@/types';
import { cn } from '@/utils';

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'all_time', label: 'All Time' },
];

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return null;
  }
}

function getRankBgColor(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300';
    case 2:
      return 'bg-gradient-to-r from-gray-100 to-slate-100 border-gray-300';
    case 3:
      return 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300';
    default:
      return 'bg-white border-neutral-200';
  }
}

function getHouseColor(house?: string): string {
  const colors: Record<string, string> = {
    'Phoenix': 'bg-red-500',
    'Dragon': 'bg-emerald-500',
    'Griffin': 'bg-blue-500',
    'Sphinx': 'bg-purple-500',
  };
  return colors[house || ''] || 'bg-neutral-400';
}

function formatScore(score: number): string {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toString();
}

// Race timestamps come from SQLite as 'YYYY-MM-DD HH:MM:SS' in UTC.
function parseRaceTime(value: string): Date {
  return new Date(value.replace(' ', 'T') + 'Z');
}

function formatCountdown(endsAt: string, now: number): string {
  const ms = parseRaceTime(endsAt).getTime() - now;
  if (ms <= 0) return 'Ending soon';
  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

// Podium component for top 3
function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);
  const [first, second, third] = [top3[0], top3[1], top3[2]];

  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {/* Second Place */}
      {second && (
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xl font-bold shadow-lg border-4 border-white">
              {second.userAvatar ? (
                <img src={second.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                second.userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              2
            </div>
          </div>
          <div className="mt-4 bg-gradient-to-t from-gray-300 to-gray-200 w-24 rounded-t-lg pt-4 pb-2 text-center shadow-inner">
            <p className="text-sm font-semibold text-gray-800 truncate px-2">{second.userName}</p>
            <p className="text-xs text-gray-600">{formatScore(second.score)} XP</p>
          </div>
          <div className="bg-gray-300 w-24 h-20 rounded-b-lg" />
        </div>
      )}

      {/* First Place */}
      {first && (
        <div className="flex flex-col items-center -mt-8">
          <Crown className="w-8 h-8 text-yellow-500 mb-2 animate-pulse" />
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl border-4 border-yellow-300 ring-4 ring-yellow-200">
              {first.userAvatar ? (
                <img src={first.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                first.userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              1
            </div>
          </div>
          <div className="mt-4 bg-gradient-to-t from-yellow-400 to-yellow-300 w-28 rounded-t-lg pt-4 pb-2 text-center shadow-inner">
            <p className="text-sm font-bold text-yellow-900 truncate px-2">{first.userName}</p>
            <p className="text-xs text-yellow-800">{formatScore(first.score)} XP</p>
          </div>
          <div className="bg-yellow-400 w-28 h-28 rounded-b-lg" />
        </div>
      )}

      {/* Third Place */}
      {third && (
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg border-4 border-white">
              {third.userAvatar ? (
                <img src={third.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                third.userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              3
            </div>
          </div>
          <div className="mt-4 bg-gradient-to-t from-amber-500 to-amber-400 w-24 rounded-t-lg pt-4 pb-2 text-center shadow-inner">
            <p className="text-sm font-semibold text-amber-900 truncate px-2">{third.userName}</p>
            <p className="text-xs text-amber-800">{formatScore(third.score)} XP</p>
          </div>
          <div className="bg-amber-500 w-24 h-16 rounded-b-lg" />
        </div>
      )}
    </div>
  );
}

// Leaderboard entry row
function LeaderboardRow({
  entry,
  isCurrentUser,
  previousRank,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  previousRank?: number;
}) {
  const rankChange = previousRank ? previousRank - entry.rank : 0;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all',
        getRankBgColor(entry.rank),
        isCurrentUser && 'ring-2 ring-indigo-500 ring-offset-2',
        entry.rank <= 3 && 'shadow-md'
      )}
    >
      {/* Rank */}
      <div className="w-12 flex items-center justify-center">
        {getRankIcon(entry.rank) || (
          <span className={cn(
            'text-lg font-bold',
            entry.rank <= 10 ? 'text-indigo-600' : 'text-neutral-500'
          )}>
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold',
            entry.userAvatar ? '' : getHouseColor(entry.house)
          )}
        >
          {entry.userAvatar ? (
            <img src={entry.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            entry.userName.charAt(0).toUpperCase()
          )}
        </div>
        {entry.house && (
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white',
              getHouseColor(entry.house)
            )}
            title={entry.house}
          />
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            'font-semibold truncate',
            isCurrentUser ? 'text-indigo-700' : 'text-neutral-900'
          )}>
            {entry.userName}
            {isCurrentUser && <span className="ml-2 text-xs text-indigo-500">(You)</span>}
          </p>
          {entry.rank === 1 && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
              Champion
            </span>
          )}
        </div>
        {entry.house && (
          <p className="text-sm text-neutral-500">{entry.house} House</p>
        )}
      </div>

      {/* Rank Change */}
      {rankChange !== 0 && (
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          rankChange > 0 ? 'text-emerald-600' : 'text-red-500'
        )}>
          {rankChange > 0 ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>+{rankChange}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>{rankChange}</span>
            </>
          )}
        </div>
      )}

      {/* Score */}
      <div className="text-right">
        <div className="flex items-center gap-1 text-lg font-bold text-indigo-600">
          <Star className="w-4 h-4 text-yellow-500" />
          <span>{formatScore(entry.score)}</span>
        </div>
        <p className="text-xs text-neutral-500">XP</p>
      </div>
    </div>
  );
}

// Weekly Race tab content
function RacePanel({
  current,
  isLoading,
  error,
}: {
  current: RaceCurrent | null;
  isLoading: boolean;
  error: string | null;
}) {
  const { user } = useAuthStore();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (isLoading && !current) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const cycle = current?.cycle ?? null;

  if (!cycle) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <Flag className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Active Race</h3>
        <p className="text-neutral-500">The next race starts Monday.</p>
      </div>
    );
  }

  const top = current?.top ?? [];
  const me = current?.me ?? null;
  const leaderScore = top[0]?.score ?? 0;
  const progressPct = Math.min((leaderScore / cycle.targetPoints) * 100, 100);
  const pointsToTarget = me ? Math.max(cycle.targetPoints - me.score, 0) : null;

  return (
    <div className="space-y-6">
      {/* Target Progress */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-neutral-900">
              First to {formatScore(cycle.targetPoints)} XP wins
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Timer className="w-4 h-4" />
            <span>{formatCountdown(cycle.endsAt, now)}</span>
          </div>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-sm text-neutral-500 mt-2">
          {leaderScore > 0
            ? `${top[0].name} leads with ${formatScore(leaderScore)} XP`
            : 'No scores yet — be the first to earn XP this week!'}
        </p>
      </div>

      {/* Your Rank Chip */}
      {me && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold">You're #{me.rank}</p>
                <p className="text-indigo-200 text-sm">
                  {pointsToTarget === 0
                    ? 'Target hit — hold your lead!'
                    : `${formatScore(pointsToTarget ?? 0)} points to the target`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatScore(me.score)}</p>
              <p className="text-indigo-200 text-sm">XP this week</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 20 */}
      {top.length > 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900">Race Standings</h2>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {top.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border transition-all',
                  getRankBgColor(entry.rank),
                  entry.userId === user?.id && 'ring-2 ring-indigo-500 ring-offset-2',
                  entry.rank <= 3 && 'shadow-md'
                )}
              >
                <div className="w-12 flex items-center justify-center">
                  {getRankIcon(entry.rank) || (
                    <span className={cn(
                      'text-lg font-bold',
                      entry.rank <= 10 ? 'text-indigo-600' : 'text-neutral-500'
                    )}>
                      #{entry.rank}
                    </span>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    entry.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-semibold truncate',
                    entry.userId === user?.id ? 'text-indigo-700' : 'text-neutral-900'
                  )}>
                    {entry.name}
                    {entry.userId === user?.id && (
                      <span className="ml-2 text-xs text-indigo-500">(You)</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold text-indigo-600">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{formatScore(entry.score)}</span>
                  </div>
                  <p className="text-xs text-neutral-500">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <Trophy className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Racers Yet</h3>
          <p className="text-neutral-500">Earn XP this week to take the lead!</p>
        </div>
      )}
    </div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    entries,
    period,
    currentUserRank,
    totalParticipants,
    isLoading,
    error,
    fetchLeaderboard,
    fetchUserRank,
    setPeriod,
  } = useLeaderboardStore();
  const [tab, setTab] = useState<'xp' | 'race'>('xp');
  const {
    current: race,
    isLoading: raceLoading,
    error: raceError,
    fetchCurrent: fetchRace,
  } = useRaceStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (tab === 'race') {
      fetchRace();
    }
  }, [tab, fetchRace]);

  useEffect(() => {
    if (user?.id) {
      fetchUserRank(user.id);
    }
  }, [user?.id, entries, fetchUserRank]);

  const isUserInTop100 = entries.some(e => e.userId === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                <Trophy className="w-7 h-7 text-yellow-500" />
                Leaderboard
              </h1>
              <p className="text-neutral-500">Top scholars ranked by XP</p>
            </div>
          </div>

          <button
            onClick={() => (tab === 'race' ? fetchRace() : fetchLeaderboard())}
            disabled={tab === 'race' ? raceLoading : isLoading}
            aria-label="Refresh leaderboard"
            className="p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-5 h-5', (tab === 'race' ? raceLoading : isLoading) && 'animate-spin')} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white rounded-xl p-1.5 mb-6 shadow-sm border border-neutral-200">
          <div className="flex">
            <button
              onClick={() => setTab('xp')}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                tab === 'xp'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              )}
            >
              <Trophy className="w-4 h-4" />
              XP Leaders
            </button>
            <button
              onClick={() => setTab('race')}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                tab === 'race'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              )}
            >
              <Flag className="w-4 h-4" />
              Weekly Race
            </button>
          </div>
        </div>

        {tab === 'race' ? (
          <RacePanel current={race} isLoading={raceLoading} error={raceError} />
        ) : (
          <>
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>Participants</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{totalParticipants}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Your Rank</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              {currentUserRank ? `#${currentUserRank}` : '-'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <Flame className="w-4 h-4" />
              <span>Top Score</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {entries[0] ? formatScore(entries[0].score) : '-'}
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-xl p-1.5 mb-6 shadow-sm border border-neutral-200">
          <div className="flex">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
                  period === value
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && entries.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        )}

        {/* Podium for Top 3 */}
        {!isLoading && entries.length > 0 && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
              <h2 className="text-white font-semibold text-center">Top Scholars</h2>
            </div>
            <Podium entries={entries} />
          </div>
        )}

        {/* Your Rank Card (if not in top 100) */}
        {!isUserInTop100 && currentUserRank && user && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 mb-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-indigo-200 text-sm">Your Position</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">#{currentUserRank}</p>
                <p className="text-indigo-200 text-sm">of {totalParticipants}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List (ranks 4+) */}
        {!isLoading && entries.length > 3 && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="font-semibold text-neutral-900">Rankings</h2>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {entries.slice(3).map((entry) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  isCurrentUser={entry.userId === user?.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && entries.length === 0 && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <Trophy className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Rankings Yet</h3>
            <p className="text-neutral-500 mb-6">
              Be the first to earn XP and claim the top spot!
            </p>
            <button
              onClick={() => navigate('/practice')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Practicing
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
