import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useBattleStore } from '@/stores/battleStore';
import { BattleLobby, BattleArena, BattleResults } from '@/components/battle';
import type { Battle } from '@/types';

type BattlePhase = 'lobby' | 'waiting' | 'battle' | 'results';

export function BattlePage() {
  const { id: battleId } = useParams();
  const navigate = useNavigate();
  const { currentBattle, fetchBattle, resetBattle, startPolling, stopPolling } = useBattleStore();

  const [phase, setPhase] = useState<BattlePhase>('lobby');
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // If battleId is in URL, load that battle. fetchBattle returns the fetched
  // battle — using the return value avoids the stale-closure read of
  // currentBattle (null on first load) that stranded deep links on the spinner.
  useEffect(() => {
    if (!battleId) return;
    let cancelled = false;

    fetchBattle(battleId).then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        setLoadError(useBattleStore.getState().error || 'Battle not found');
        return;
      }
      setBattle(loaded);
      if (loaded.status === 'waiting') {
        setPhase('waiting');
      } else if (loaded.status === 'active') {
        setPhase('battle');
      } else if (loaded.status === 'completed') {
        setPhase('results');
      }
      // 'cancelled' battles render the expired state below.
    });

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [battleId, fetchBattle, stopPolling]);

  // Poll for opponent when waiting (single poller: the store's)
  useEffect(() => {
    if (phase !== 'waiting' || !battle || battle.status !== 'waiting') return;
    startPolling(battle.id);
    return () => stopPolling();
  }, [phase, battle, startPolling, stopPolling]);

  // React to polled store updates while waiting for an opponent
  useEffect(() => {
    if (phase !== 'waiting' || !battle || !currentBattle || currentBattle.id !== battle.id) return;
    if (currentBattle.status === 'active') {
      setBattle(currentBattle);
      setPhase('battle');
      stopPolling();
    } else if (currentBattle.status === 'cancelled') {
      setBattle(currentBattle);
      stopPolling();
    }
  }, [currentBattle, phase, battle, stopPolling]);

  const handleBattleStart = (newBattle: Battle) => {
    setLoadError(null);
    setBattle(newBattle);
    if (newBattle.status === 'waiting') {
      setPhase('waiting');
      navigate(`/battle/${newBattle.id}`);
    } else if (newBattle.status === 'active') {
      setPhase('battle');
      navigate(`/battle/${newBattle.id}`);
    }
  };

  const handleBattleComplete = (completedBattle: Battle) => {
    setBattle(completedBattle);
    setPhase('results');
  };

  const handleRematch = () => {
    resetBattle();
    setBattle(null);
    setLoadError(null);
    setPhase('lobby');
    navigate('/battle');
  };

  const handleExit = () => {
    resetBattle();
    navigate('/dashboard');
  };

  // Render based on phase
  // Expired / cancelled battle: the waiting room lapsed with no opponent.
  // Checked before the lobby render: a cancelled deep link keeps phase 'lobby'.
  if (battle?.status === 'cancelled') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            Battle Expired
          </h2>
          <p className="text-neutral-500 mb-6">
            This battle expired — no opponent joined in time.
          </p>
          <button
            onClick={handleRematch}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Deep-link load failure (unknown id, expired demo data, etc.)
  if (loadError) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            Battle Unavailable
          </h2>
          <p className="text-neutral-500 mb-6">{loadError}</p>
          <button
            onClick={handleRematch}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'lobby') {
    return <BattleLobby onBattleStart={handleBattleStart} />;
  }

  if (phase === 'waiting' && battle) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-6 text-primary animate-spin" />
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            Waiting for Opponent
          </h2>
          <p className="text-neutral-500 mb-6">
            Share this battle code or wait for someone to join...
          </p>

          {/* Battle code */}
          <div className="p-4 bg-neutral-50 rounded-lg mb-6">
            <p className="text-xs text-neutral-500 mb-1">Battle Code</p>
            <p className="text-2xl font-mono font-bold text-neutral-900">
              {battle.id.slice(-8).toUpperCase()}
            </p>
          </div>

          {/* Battle settings */}
          <div className="grid grid-cols-2 gap-4 text-left mb-6">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500">Difficulty</p>
              <p className="font-medium text-neutral-900 capitalize">{battle.difficulty}</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500">Questions</p>
              <p className="font-medium text-neutral-900">{battle.questionCount}</p>
            </div>
          </div>

          <button
            onClick={handleRematch}
            className="w-full py-3 border-2 border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
          >
            Cancel & Return to Lobby
          </button>
        </div>

        {/* Tip */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-sm text-blue-800">
            Tip: The battle will start automatically when an opponent joins!
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'battle' && battle) {
    return <BattleArena battle={battle} onComplete={handleBattleComplete} />;
  }

  if (phase === 'results' && battle) {
    return (
      <BattleResults
        battle={battle}
        onRematch={handleRematch}
        onExit={handleExit}
      />
    );
  }

  // Loading state
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
