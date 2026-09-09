import { useCallback, useEffect, useState } from 'react';
import { Brain, CalendarClock, Loader2, TrendingUp } from 'lucide-react';
import { Card } from '@/components/common';
import { api } from '@/lib/api';

export interface DeckRetention {
  deckId: string;
  deckName: string;
  reviews30d: number;
  insufficientData: boolean;
  retentionRate: number | null;
  matureReviews30d: number;
  matureRetentionRate: number | null;
}

export interface RetentionStats {
  windowDays: number;
  totalReviews30d: number;
  insufficientData: boolean;
  retentionRate: number | null;
  matureReviews30d: number;
  matureRetentionRate: number | null;
  dueNow: number;
  decks: DeckRetention[];
}

interface RetentionStatsCardProps {
  onLoaded?: (stats: RetentionStats | null) => void;
}

// Per-user flashcard retention stat card. Shows the real 30-day recall rate
// computed from the user's review history; hides the number entirely when
// there are too few reviews to be honest about it.
export function RetentionStatsCard({ onLoaded }: RetentionStatsCardProps) {
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<RetentionStats>('/flashcard-decks/retention');
      const data = res.success && res.data ? res.data : null;
      setStats(data);
      onLoaded?.(data);
    } catch {
      setStats(null);
      onLoaded?.(null);
    } finally {
      setLoading(false);
    }
  }, [onLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card className="p-4 mb-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="p-4 mb-4">
      {stats.insufficientData || stats.retentionRate === null ? (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 shrink-0">
            <Brain className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-neutral-900">Not enough data yet — keep reviewing</p>
            <p className="text-xs text-neutral-500">
              Your {stats.windowDays}-day recall rate appears after at least 10 reviews.
              {stats.totalReviews30d > 0 && ` (${stats.totalReviews30d}/10 so far)`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 shrink-0">
              <Brain className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Your {stats.windowDays}-day recall</p>
              <p className="text-xl font-semibold text-neutral-900">{stats.retentionRate}%</p>
            </div>
          </div>
          {stats.matureRetentionRate !== null && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 shrink-0">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Mature cards</p>
                <p className="text-xl font-semibold text-neutral-900">{stats.matureRetentionRate}%</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 shrink-0">
              <CalendarClock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Due today</p>
              <p className="text-xl font-semibold text-neutral-900">{stats.dueNow}</p>
            </div>
          </div>
          <p className="text-xs text-neutral-400 ml-auto">
            {stats.totalReviews30d} {stats.totalReviews30d === 1 ? 'review' : 'reviews'} in the last {stats.windowDays} days
          </p>
        </div>
      )}
    </Card>
  );
}
