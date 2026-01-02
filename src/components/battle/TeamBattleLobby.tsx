import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Crown,
  Check,
  Clock,
  UserPlus,
  X,
  Swords,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button, Card } from '@/components/common';
import {
  useTeamBattleStore,
  type TeamBattle,
  type BattleTeam,
  type TeamMember,
  getTeamColors,
} from '@/stores/teamBattleStore';

interface TeamBattleLobbyProps {
  battle: TeamBattle;
  onInvite?: () => void;
  onLeave?: () => void;
  onStart?: () => void;
  className?: string;
}

export function TeamBattleLobby({
  battle,
  onInvite,
  onLeave,
  onStart,
  className,
}: TeamBattleLobbyProps) {
  const { myTeamId, toggleReady } = useTeamBattleStore();

  const myTeam = myTeamId === battle.team1.id ? battle.team1 : battle.team2;
  const opponentTeam = myTeamId === battle.team1.id ? battle.team2 : battle.team1;
  const myTeamIndex = myTeamId === battle.team1.id ? 1 : 2;
  const allReady = myTeam.members.every((m) => m.isReady);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary mb-4">
          <Users className="w-5 h-5" />
          <span className="font-semibold">3v3 Team Battle</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">
          {battle.subjectName || 'General Knowledge'}
        </h2>
        <p className="text-neutral-500 mt-1">
          {battle.questionCount} questions • {battle.timePerQuestion}s per question
        </p>
      </div>

      {/* Teams Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* My Team */}
        <TeamCard
          team={myTeam}
          teamIndex={myTeamIndex as 1 | 2}
          isMyTeam={true}
          onToggleReady={toggleReady}
          onInvite={onInvite}
        />

        {/* VS Divider */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-xl">
            VS
          </div>
        </div>
        <div className="md:hidden flex justify-center">
          <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold">
            VS
          </div>
        </div>

        {/* Opponent Team */}
        <TeamCard
          team={opponentTeam}
          teamIndex={myTeamIndex === 1 ? 2 : 1}
          isMyTeam={false}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onLeave}>
          <X className="w-4 h-4 mr-2" />
          Leave Lobby
        </Button>

        {battle.status === 'forming' && (
          <Button onClick={onInvite}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Friends
          </Button>
        )}

        {battle.status === 'matched' && allReady && (
          <Button onClick={onStart} className="bg-emerald-500 hover:bg-emerald-600">
            <Swords className="w-4 h-4 mr-2" />
            Start Battle
          </Button>
        )}
      </div>

      {/* Waiting message */}
      {battle.status === 'waiting' && (
        <div className="text-center">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 text-neutral-500"
          >
            <Clock className="w-5 h-5" />
            <span>Waiting for opponent team...</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Team card component
interface TeamCardProps {
  team: BattleTeam;
  teamIndex: 1 | 2;
  isMyTeam: boolean;
  onToggleReady?: () => void;
  onInvite?: () => void;
}

function TeamCard({ team, teamIndex, isMyTeam, onToggleReady, onInvite }: TeamCardProps) {
  const colors = getTeamColors(teamIndex);
  const allReady = team.members.every((m) => m.isReady);
  const emptySlots = 3 - team.members.length;

  return (
    <Card className={cn('overflow-hidden', isMyTeam && 'ring-2 ring-primary')}>
      {/* Header */}
      <div className={cn('p-4 text-white', colors.bg)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Team {teamIndex}</p>
            <h3 className="font-bold text-lg">{team.name || `Team ${teamIndex}`}</h3>
          </div>
          {allReady && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-sm">
              <Check className="w-4 h-4" />
              Ready
            </div>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="p-4 space-y-3">
        {team.members.map((member) => (
          <TeamMemberRow
            key={member.id}
            member={member}
            isCaptain={member.id === team.captain}
            isMe={isMyTeam && member.id === 'current_user'}
            teamColors={colors}
          />
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-neutral-200"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="flex-1">
              <p className="text-neutral-400">Waiting for player...</p>
            </div>
            {isMyTeam && onInvite && (
              <button
                onClick={onInvite}
                className="p-2 rounded-lg bg-primary-50 text-primary hover:bg-primary-100 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Ready button for my team */}
      {isMyTeam && onToggleReady && (
        <div className="p-4 border-t border-neutral-100">
          <Button
            fullWidth
            onClick={onToggleReady}
            variant={team.members.find(m => m.id === 'current_user')?.isReady ? 'outline' : 'primary'}
          >
            {team.members.find(m => m.id === 'current_user')?.isReady ? 'Cancel Ready' : 'Ready Up'}
          </Button>
        </div>
      )}
    </Card>
  );
}

// Team member row
function TeamMemberRow({
  member,
  isCaptain,
  isMe,
  teamColors,
}: {
  member: TeamMember;
  isCaptain: boolean;
  isMe: boolean;
  teamColors: ReturnType<typeof getTeamColors>;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        isMe ? teamColors.bgLight : 'bg-neutral-50'
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm',
            teamColors.bg
          )}
        >
          {member.name.split(' ').map(n => n[0]).join('')}
        </div>
        {isCaptain && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
            <Crown className="w-3 h-3 text-white" />
          </div>
        )}
        {/* Online indicator */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
            member.isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('font-medium truncate', isMe && teamColors.text)}>
            {member.name}
            {isMe && ' (You)'}
          </p>
        </div>
        <p className="text-xs text-neutral-400">Level {member.level}</p>
      </div>

      {/* Ready status */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          member.isReady
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-neutral-100 text-neutral-400'
        )}
      >
        {member.isReady ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
      </div>
    </div>
  );
}

// Available team battles list
interface AvailableTeamBattlesProps {
  onJoin?: (battle: TeamBattle) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function AvailableTeamBattles({
  onJoin,
  onCreateNew,
  className,
}: AvailableTeamBattlesProps) {
  const { availableTeamBattles, fetchAvailableTeamBattles, isLoading } = useTeamBattleStore();

  useEffect(() => {
    fetchAvailableTeamBattles();
  }, [fetchAvailableTeamBattles]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Available Team Battles</h3>
        <Button size="sm" onClick={onCreateNew}>
          <Swords className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : availableTeamBattles.length > 0 ? (
        <div className="space-y-3">
          {availableTeamBattles.map((battle) => (
            <Card
              key={battle.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onJoin?.(battle)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Swords className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-900">
                      {battle.subjectName || 'General Knowledge'}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {battle.team1.members.length}/3 vs {battle.team2.members.length}/3
                      </span>
                      <span>{battle.questionCount} questions</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Swords className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <h4 className="font-medium text-neutral-700">No team battles available</h4>
          <p className="text-sm text-neutral-500 mt-1">
            Create a new team battle and invite your friends!
          </p>
          <Button className="mt-4" onClick={onCreateNew}>
            Create Team Battle
          </Button>
        </Card>
      )}
    </div>
  );
}
