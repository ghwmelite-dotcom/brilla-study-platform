import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CompetitionSchool } from '@/types';
import { cn, formatNumber } from '@/utils';

interface ScoreboardProps {
  schools: CompetitionSchool[];
  currentRound: number;
  highlightSchoolId?: string;
  className?: string;
}

export function Scoreboard({
  schools,
  currentRound,
  highlightSchoolId,
  className,
}: ScoreboardProps) {
  // Sort schools by score (descending)
  const sortedSchools = [...schools].sort((a, b) => b.score - a.score);

  return (
    <div className={cn('bg-white rounded-xl shadow-card overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-ghana p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">Scoreboard</span>
          </div>
          <span className="text-sm opacity-90">Round {currentRound}</span>
        </div>
      </div>

      {/* Schools */}
      <div className="divide-y divide-neutral-100">
        {sortedSchools.map((school, index) => {
          const isLeading = index === 0;
          const isHighlighted = school.id === highlightSchoolId;

          return (
            <div
              key={school.id}
              className={cn(
                'flex items-center justify-between p-4 transition-colors',
                isHighlighted && 'bg-primary-50',
                isLeading && 'bg-yellow-50'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Position */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    index === 0 && 'bg-yellow-400 text-yellow-900',
                    index === 1 && 'bg-neutral-300 text-neutral-700',
                    index === 2 && 'bg-amber-600 text-white',
                    index > 2 && 'bg-neutral-100 text-neutral-600'
                  )}
                >
                  {index + 1}
                </div>

                {/* School color indicator */}
                <div
                  className="w-3 h-8 rounded"
                  style={{ backgroundColor: school.color }}
                />

                {/* School name */}
                <span className={cn(
                  'font-medium',
                  isHighlighted && 'text-primary'
                )}>
                  {school.name}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-2xl font-bold tabular-nums',
                  isLeading && 'text-yellow-600',
                  !isLeading && 'text-neutral-900'
                )}>
                  {school.score}
                </span>
                {isLeading && (
                  <Trophy className="w-5 h-5 text-yellow-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mini Scoreboard for inline display
interface MiniScoreboardProps {
  schools: CompetitionSchool[];
  className?: string;
}

export function MiniScoreboard({ schools, className }: MiniScoreboardProps) {
  const sortedSchools = [...schools].sort((a, b) => b.score - a.score);

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {sortedSchools.map((school, index) => (
        <div
          key={school.id}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            index === 0 && 'bg-yellow-100',
            index > 0 && 'bg-neutral-100'
          )}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: school.color }}
          />
          <span className="text-sm font-medium text-neutral-700">
            {school.name}
          </span>
          <span className={cn(
            'text-sm font-bold',
            index === 0 && 'text-yellow-700',
            index > 0 && 'text-neutral-900'
          )}>
            {school.score}
          </span>
        </div>
      ))}
    </div>
  );
}

// Score change animation
interface ScoreChangeProps {
  points: number;
  show: boolean;
  className?: string;
}

export function ScoreChange({ points, show, className }: ScoreChangeProps) {
  if (!show) return null;

  const isPositive = points > 0;
  const isNegative = points < 0;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold animate-bounce-slow',
        isPositive && 'bg-green-100 text-green-700',
        isNegative && 'bg-red-100 text-red-700',
        !isPositive && !isNegative && 'bg-neutral-100 text-neutral-600',
        className
      )}
    >
      {isPositive && <TrendingUp className="w-4 h-4" />}
      {isNegative && <TrendingDown className="w-4 h-4" />}
      {!isPositive && !isNegative && <Minus className="w-4 h-4" />}
      <span>{isPositive && '+'}{points}</span>
    </div>
  );
}
