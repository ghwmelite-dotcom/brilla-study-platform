import { Crown, Loader2, LogOut, Swords, Users } from 'lucide-react';
import { cn } from '@/utils';
import { getTeamColors, type TeamBattleData, type TeamBattleMember } from '@/stores/teamBattleStore';

interface TeamBattleLobbyProps {
  data: TeamBattleData;
  userId: string;
  isStarting: boolean;
  startError?: string | null;
  onStart: () => void;
  onLeave: () => void;
}

// Waiting room: both rosters, captain-only Start, leave, shareable code.
export function TeamBattleLobby({ data, userId, isStarting, startError, onStart, onLeave }: TeamBattleLobbyProps) {
  const { battle, team1, team2 } = data;
  const myTeamNumber = team1.some((m) => m.userId === userId) ? 1 : 2;
  const me = [...team1, ...team2].find((m) => m.userId === userId);
  const isCaptain = !!me?.isCaptain;
  const balanced = team1.length === team2.length && team1.length >= 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-card p-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-3">
          <Users className="w-5 h-5" />
          <span className="font-semibold">3v3 Team Battle</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-neutral-900">
          {battle.subjectName || 'General Knowledge'}
        </h2>
        <p className="text-neutral-500 mt-1">
          {battle.totalQuestions} questions · {battle.timePerQuestion}s per question · synchronized rounds
        </p>

        {/* Shareable battle code */}
        <div className="mt-4 inline-block p-4 bg-neutral-50 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Battle Code</p>
          <p className="text-2xl font-mono font-bold text-neutral-900">
            {battle.id.slice(-8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Rosters */}
      <div className="grid md:grid-cols-2 gap-4">
        <TeamRoster team={team1} teamIndex={1} userId={userId} />
        <TeamRoster team={team2} teamIndex={2} userId={userId} />
      </div>

      {startError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {startError}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-card p-6 space-y-3">
        {isCaptain ? (
          <button
            onClick={onStart}
            disabled={isStarting || !balanced}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
            {isStarting ? 'Starting...' : 'Start Battle'}
          </button>
        ) : (
          <p className="text-center text-neutral-500 text-sm">
            Waiting for the captain to start the battle...
          </p>
        )}
        {isCaptain && !balanced && (
          <p className="text-center text-sm text-neutral-500">
            Both teams need the same number of players (1-3 each). Currently {team1.length} vs {team2.length}.
          </p>
        )}
        <button
          onClick={onLeave}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {isCaptain ? 'Leave (deletes battle)' : 'Leave Battle'}
        </button>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg text-center">
        <p className="text-sm text-blue-800">
          Share the battle code — friends can join from the Team Battle lobby. You're on Team {myTeamNumber}.
        </p>
      </div>
    </div>
  );
}

function TeamRoster({ team, teamIndex, userId }: { team: TeamBattleMember[]; teamIndex: 1 | 2; userId: string }) {
  const colors = getTeamColors(teamIndex);
  const emptySlots = 3 - team.length;

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className={cn('p-4 text-white', colors.bg)}>
        <p className="text-sm text-white/70">Team {teamIndex}</p>
        <h3 className="font-bold text-lg">{team.length}/3 players</h3>
      </div>
      <div className="p-4 space-y-3">
        {team.map((member) => (
          <div
            key={member.userId}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              member.userId === userId ? colors.bgLight : 'bg-neutral-50',
            )}
          >
            <div className="relative">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm', colors.bg)}>
                {member.name?.charAt(0) || '?'}
              </div>
              {member.isCaptain && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <p className={cn('font-medium truncate', member.userId === userId && colors.text)}>
              {member.name}
              {member.userId === userId && ' (You)'}
            </p>
          </div>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-neutral-200"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-neutral-400">Open slot</p>
          </div>
        ))}
      </div>
    </div>
  );
}
