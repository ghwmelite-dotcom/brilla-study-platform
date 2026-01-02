import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Users,
  Clock,
  ChevronRight,
  Award,
  Star,
  Crown,
  Medal,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button, Card } from '@/components/common';
import { useEventStore, type Tournament, type Prize } from '@/stores/eventStore';

interface TournamentCardProps {
  tournament: Tournament;
  onJoin?: () => void;
  onView?: () => void;
  className?: string;
}

export function TournamentCard({
  tournament,
  onJoin,
  onView,
  className,
}: TournamentCardProps) {
  const { joinTournament, getTimeRemaining } = useEventStore();
  const [isJoining, setIsJoining] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(tournament.endDate));

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(tournament.endDate));
    }, 60000);

    return () => clearInterval(interval);
  }, [tournament.endDate, getTimeRemaining]);

  const handleJoin = async () => {
    setIsJoining(true);
    await joinTournament(tournament.id);
    setIsJoining(false);
    onJoin?.();
  };

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    registration: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-neutral-100 text-neutral-600',
  };

  const statusLabels = {
    upcoming: 'Upcoming',
    registration: 'Registration Open',
    active: 'In Progress',
    completed: 'Completed',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                statusColors[tournament.status]
              )}>
                {statusLabels[tournament.status]}
              </span>
              {tournament.type === 'bracket' && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                  Bracket
                </span>
              )}
              {tournament.type === 'leaderboard' && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                  Leaderboard
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg">{tournament.name}</h3>
            {tournament.subjectName && (
              <p className="text-white/70 text-sm">{tournament.subjectName}</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Time remaining */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-white/70" />
            <span>
              {timeRemaining.days > 0 && `${timeRemaining.days}d `}
              {timeRemaining.hours}h {timeRemaining.minutes}m
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-white/70" />
            <span>{tournament.currentParticipants}/{tournament.maxParticipants}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-neutral-600">{tournament.description}</p>

        {/* Top Prizes */}
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Top Prizes
          </h4>
          <div className="space-y-2">
            {tournament.prizes.slice(0, 3).map((prize, index) => (
              <PrizeRow key={index} prize={prize} rank={index + 1} />
            ))}
          </div>
        </div>

        {/* User Position (if registered) */}
        {tournament.userRegistered && tournament.userPosition && (
          <div className="p-3 rounded-xl bg-primary-50 border border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary-700">Your Position</p>
                  <p className="text-sm text-primary-600">Keep pushing!</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-primary">
                #{tournament.userPosition}
              </span>
            </div>
          </div>
        )}

        {/* Leaderboard Preview */}
        {tournament.leaderboard && tournament.leaderboard.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
              Leaderboard
            </h4>
            <div className="space-y-2">
              {tournament.leaderboard.slice(0, 3).map((participant, index) => (
                <LeaderboardRow
                  key={participant.id}
                  participant={participant}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-100">
        {tournament.userRegistered ? (
          <Button fullWidth onClick={onView}>
            View Tournament
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : tournament.status === 'registration' ? (
          <Button
            fullWidth
            onClick={handleJoin}
            disabled={isJoining || tournament.currentParticipants >= tournament.maxParticipants}
          >
            {isJoining ? 'Joining...' : 'Join Tournament'}
          </Button>
        ) : tournament.status === 'upcoming' ? (
          <Button fullWidth variant="outline" disabled>
            <Clock className="w-4 h-4 mr-2" />
            Registration Opens Soon
          </Button>
        ) : (
          <Button fullWidth variant="outline" onClick={onView}>
            View Results
          </Button>
        )}
      </div>
    </Card>
  );
}

// Prize row component
function PrizeRow({ prize, rank }: { prize: Prize; rank: number }) {
  const rankIcons = {
    1: Crown,
    2: Medal,
    3: Award,
  };

  const rankColors = {
    1: 'text-amber-500 bg-amber-50',
    2: 'text-neutral-400 bg-neutral-100',
    3: 'text-amber-700 bg-amber-50',
  };

  const Icon = rankIcons[rank as keyof typeof rankIcons] || Award;
  const colors = rankColors[rank as keyof typeof rankColors] || 'text-neutral-500 bg-neutral-50';

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-700">
          {typeof prize.rank === 'number' ? `${prize.rank}${getOrdinalSuffix(prize.rank)} Place` : `Rank ${prize.rank}`}
        </p>
        <p className="text-xs text-neutral-500">
          {prize.rewards.map(r => r.name).join(', ')}
        </p>
      </div>
    </div>
  );
}

// Leaderboard row component
function LeaderboardRow({
  participant,
  rank,
}: {
  participant: { id: string; name: string; wins: number; losses: number };
  rank: number;
}) {
  const rankBadge = {
    1: 'bg-amber-100 text-amber-700',
    2: 'bg-neutral-200 text-neutral-700',
    3: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
      <span className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
        rankBadge[rank as keyof typeof rankBadge] || 'bg-neutral-100 text-neutral-600'
      )}>
        {rank}
      </span>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold">
        {participant.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 text-sm truncate">{participant.name}</p>
        <p className="text-xs text-neutral-400">
          {participant.wins}W - {participant.losses}L
        </p>
      </div>
    </div>
  );
}

// Helper function
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Tournament list component
interface TournamentListProps {
  onTournamentClick?: (tournament: Tournament) => void;
  className?: string;
}

export function TournamentList({ onTournamentClick, className }: TournamentListProps) {
  const { availableTournaments, fetchTournaments, isLoading } = useEventStore();

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (availableTournaments.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <Trophy className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
        <h3 className="font-semibold text-neutral-700 mb-1">No Tournaments Available</h3>
        <p className="text-sm text-neutral-500">
          Check back later for upcoming competitions!
        </p>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {availableTournaments.map((tournament) => (
        <motion.div
          key={tournament.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TournamentCard
            tournament={tournament}
            onView={() => onTournamentClick?.(tournament)}
          />
        </motion.div>
      ))}
    </div>
  );
}
