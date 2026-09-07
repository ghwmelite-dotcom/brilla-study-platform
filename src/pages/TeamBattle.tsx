import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, RefreshCw, Swords, Users } from 'lucide-react';
import { useTeamBattleStore, type TeamBattleData } from '@/stores/teamBattleStore';
import { useAuthStore } from '@/stores/authStore';
import { TeamBattleLobby, TeamBattleArena, TeamBattleResults } from '@/components/battle';

type TeamBattlePhase = 'lobby' | 'waiting' | 'battle' | 'results';

export function TeamBattlePage() {
  const { id: battleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    current,
    fetchBattle,
    reset,
    startPolling,
    stopPolling,
  } = useTeamBattleStore();

  const [phase, setPhase] = useState<TeamBattlePhase>('lobby');
  const [data, setData] = useState<TeamBattleData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Deep links: fetchBattle returns the fetched data — using the return value
  // avoids the stale-closure pattern that stranded 1v1 deep links (Phase A).
  useEffect(() => {
    if (!battleId) return;
    let cancelled = false;

    fetchBattle(battleId).then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        setLoadError(useTeamBattleStore.getState().error || 'Team battle not found');
        return;
      }
      setData(loaded);
      if (loaded.battle.status === 'waiting' || loaded.battle.status === 'ready') {
        setPhase('waiting');
      } else if (loaded.battle.status === 'active') {
        setPhase('battle');
      } else if (loaded.battle.status === 'completed') {
        setPhase('results');
      }
      // 'cancelled' renders the expired state below.
    });

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [battleId, fetchBattle, stopPolling]);

  // Poll while waiting for players / while the battle runs (single poller:
  // the store's — no component-local interval).
  const isLive = phase === 'waiting' || phase === 'battle';
  useEffect(() => {
    if (!isLive || !data || data.battle.status === 'cancelled') return;
    startPolling(data.battle.id);
    return () => stopPolling();
  }, [isLive, data, startPolling, stopPolling]);

  // React to polled store updates
  useEffect(() => {
    if (!isLive || !data || !current || current.battle.id !== data.battle.id) return;
    if (phase === 'waiting' && current.battle.status === 'active') {
      setData(current);
      setPhase('battle');
    } else if (phase === 'battle' && current.battle.status === 'completed') {
      setData(current);
      setPhase('results');
      stopPolling();
    } else if (current.battle.status === 'cancelled') {
      setData(current);
      stopPolling();
    } else {
      setData(current);
    }
  }, [current, isLive, phase, data, stopPolling]);

  const handleEntered = (entered: TeamBattleData) => {
    setLoadError(null);
    setData(entered);
    if (entered.battle.status === 'active') {
      setPhase('battle');
    } else {
      setPhase('waiting');
    }
    navigate(`/team-battle/${entered.battle.id}`);
  };

  const handleComplete = (completed: TeamBattleData) => {
    setData(completed);
    setPhase('results');
  };

  const handleReturnToLobby = () => {
    reset();
    setData(null);
    setLoadError(null);
    setPhase('lobby');
    navigate('/team-battle');
  };

  const handleExit = () => {
    reset();
    navigate('/dashboard');
  };

  if (!user) return null;

  // Expired / cancelled waiting room
  if (data?.battle.status === 'cancelled') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">Battle Expired</h2>
          <p className="text-neutral-500 mb-6">
            This team battle expired or was cancelled before it started.
          </p>
          <button
            onClick={handleReturnToLobby}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">Battle Unavailable</h2>
          <p className="text-neutral-500 mb-6">{loadError}</p>
          <button
            onClick={handleReturnToLobby}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'lobby') {
    return <TeamBattleLobbyHome onEntered={handleEntered} />;
  }

  if (phase === 'waiting' && data) {
    return <TeamBattleWaiting data={data} userId={user.id} onLeft={handleReturnToLobby} />;
  }

  if (phase === 'battle' && data) {
    return <TeamBattleArena data={data} userId={user.id} onComplete={handleComplete} />;
  }

  if (phase === 'results' && data) {
    return (
      <TeamBattleResults
        data={data}
        userId={user.id}
        onPlayAgain={handleReturnToLobby}
        onExit={handleExit}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Lobby: create form, available battles, join-with-code.
function TeamBattleLobbyHome({ onEntered }: { onEntered: (data: TeamBattleData) => void }) {
  const {
    availableBattles,
    isLoading,
    error,
    fetchAvailableBattles,
    createBattle,
    joinBattle,
    joinByCode,
  } = useTeamBattleStore();

  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableBattles();
  }, [fetchAvailableBattles]);

  const handleCreate = async () => {
    setIsCreating(true);
    setActionError(null);
    try {
      const battleId = await createBattle({ totalQuestions, timePerQuestion });
      const data = await useTeamBattleStore.getState().fetchBattle(battleId);
      if (data) onEntered(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create battle');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (battleId: string, teamNumber: 1 | 2) => {
    setIsJoining(battleId);
    setActionError(null);
    try {
      await joinBattle(battleId, teamNumber);
      const data = useTeamBattleStore.getState().current;
      if (data) onEntered(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to join battle');
    } finally {
      setIsJoining(null);
    }
  };

  const handleJoinByCode = async () => {
    const code = joinCode.trim();
    if (!code) return;
    setIsJoiningByCode(true);
    setActionError(null);
    try {
      const data = await joinByCode(code);
      onEntered(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No waiting team battle with that code');
    } finally {
      setIsJoiningByCode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8" />
          <h1 className="text-2xl font-display font-bold">Team Battle (3v3)</h1>
        </div>
        <p className="text-white/80">
          Synchronized rounds: both teams answer the same questions at the same time. Highest team score wins.
        </p>
      </div>

      {/* Create */}
      <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Create a Team Battle</h3>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Number of Questions</label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((count) => (
              <button
                key={count}
                onClick={() => setTotalQuestions(count)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  totalQuestions === count
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Seconds per Question</label>
          <div className="flex gap-2">
            {[15, 30, 45, 60].map((seconds) => (
              <button
                key={seconds}
                onClick={() => setTimePerQuestion(seconds)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  timePerQuestion === seconds
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Battle & Invite Your Team'}
        </button>
        <p className="text-sm text-neutral-500 text-center">
          You'll be Team 1's captain. The battle starts when you say so — both teams must be equal size (1-3 each).
        </p>
      </div>

      {/* Join with code */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-5 h-5 text-neutral-500" />
          <h3 className="text-lg font-semibold text-neutral-900">Have a battle code?</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase());
              setActionError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoinByCode();
            }}
            placeholder="e.g. A1B2C3D4"
            maxLength={8}
            className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-lg font-mono uppercase tracking-widest focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleJoinByCode}
            disabled={!joinCode.trim() || isJoiningByCode}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isJoiningByCode ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>

      {/* Errors */}
      {(actionError || error) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {actionError || error}
        </div>
      )}

      {/* Available battles */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Open Team Battles</h3>
          <button
            onClick={() => fetchAvailableBattles()}
            disabled={isLoading}
            className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {availableBattles.length > 0 ? (
          <div className="space-y-3">
            {availableBattles.map((battle) => (
              <div key={battle.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Swords className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{battle.subjectName || 'General Knowledge'}</p>
                    <p className="text-sm text-neutral-500">
                      {battle.team1Count}/3 vs {battle.team2Count}/3 · {battle.totalQuestions} questions · {battle.timePerQuestion}s each
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleJoin(battle.id, 1)}
                    disabled={isJoining === battle.id || battle.team1Count >= 3}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    Team 1
                  </button>
                  <button
                    onClick={() => handleJoin(battle.id, 2)}
                    disabled={isJoining === battle.id || battle.team2Count >= 3}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Team 2
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p>No open team battles right now.</p>
            <p className="text-sm">Create one and share the code with your friends!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Waiting room wrapper: wires start/leave to the store.
function TeamBattleWaiting({
  data,
  userId,
  onLeft,
}: {
  data: TeamBattleData;
  userId: string;
  onLeft: () => void;
}) {
  const { startBattle, leaveBattle } = useTeamBattleStore();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      await startBattle(data.battle.id);
      // The poller picks up status 'active' and the page transitions.
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Failed to start battle');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveBattle(data.battle.id);
    } catch {
      // Store surfaces the error; leaving locally either way.
    } finally {
      onLeft();
    }
  };

  return (
    <TeamBattleLobby
      data={data}
      userId={userId}
      isStarting={isStarting}
      startError={startError}
      onStart={handleStart}
      onLeave={handleLeave}
    />
  );
}
