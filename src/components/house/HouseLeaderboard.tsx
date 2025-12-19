import { useEffect, useState } from 'react';
import type { HouseStanding } from '@/types';

interface HouseLeaderboardProps {
  standings: HouseStanding[];
  period: string;
  onPeriodChange?: (period: string) => void;
}

export function HouseLeaderboard({ standings, period, onPeriodChange }: HouseLeaderboardProps) {
  const [animatedWidths, setAnimatedWidths] = useState<number[]>([]);

  // Find max points for percentage calculation
  const maxPoints = Math.max(...standings.map(s => s.totalPoints), 1);

  // Animate bars on mount/update
  useEffect(() => {
    setAnimatedWidths(standings.map(() => 0));
    const timer = setTimeout(() => {
      setAnimatedWidths(standings.map(s => (s.totalPoints / maxPoints) * 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [standings, maxPoints]);

  const periods = [
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'all_time', label: 'All Time' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-bold text-neutral-900">
          House Cup Standings
        </h2>

        {/* Period selector */}
        {onPeriodChange && (
          <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-all
                  ${period === p.value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                  }
                `}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Standings bars */}
      <div className="space-y-4">
        {standings.map((standing, index) => (
          <div key={standing.houseId} className="relative">
            {/* House info */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {/* Rank */}
                <span className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${standing.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    standing.rank === 2 ? 'bg-neutral-200 text-neutral-600' :
                    standing.rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-neutral-100 text-neutral-500'}
                `}>
                  {standing.rank}
                </span>

                {/* House color dot & name */}
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: standing.houseColor }}
                />
                <span className="font-medium text-neutral-900">
                  {standing.houseName}
                </span>
              </div>

              {/* Points */}
              <span className="font-bold text-neutral-700">
                {standing.totalPoints.toLocaleString()} pts
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-8 bg-neutral-100 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                style={{
                  width: `${animatedWidths[index] || 0}%`,
                  backgroundColor: standing.houseColor,
                  minWidth: standing.totalPoints > 0 ? '40px' : '0',
                }}
              >
                {animatedWidths[index] > 20 && (
                  <span className="text-white text-sm font-medium">
                    {standing.memberCount} members
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {standings.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            No standings data available
          </div>
        )}
      </div>

      {/* Trophy at the top */}
      {standings.length > 0 && standings[0].totalPoints > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-100">
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
            </svg>
            <span>
              <strong style={{ color: standings[0].houseColor }}>{standings[0].houseName}</strong>
              {' '}is leading the House Cup!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
