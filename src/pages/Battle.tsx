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

  // If battleId is in URL, load that battle
  useEffect(() => {
    if (battleId) {
      fetchBattle(battleId).then(() => {
        setBattle(currentBattle);
        if (currentBattle?.status === 'waiting') {
          setPhase('waiting');
        } else if (currentBattle?.status === 'active') {
          setPhase('battle');
        } else if (currentBattle?.status === 'completed') {
          setPhase('results');
        }
      });
    }

    return () => {
      stopPolling();
    };
  }, [battleId, fetchBattle, currentBattle, stopPolling]);

  // Poll for opponent when waiting
  useEffect(() => {
    if (phase === 'waiting' && battle) {
      startPolling(battle.id);

      const checkInterval = setInterval(async () => {
        await fetchBattle(battle.id);
        if (currentBattle?.status === 'active') {
          setPhase('battle');
          setBattle(currentBattle);
          stopPolling();
        }
      }, 2000);

      return () => {
        clearInterval(checkInterval);
        stopPolling();
      };
    }
  }, [phase, battle, startPolling, stopPolling, fetchBattle, currentBattle]);

  const handleBattleStart = (newBattle: Battle) => {
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
    setPhase('lobby');
    navigate('/battle');
  };

  const handleExit = () => {
    resetBattle();
    navigate('/dashboard');
  };

  // Render based on phase
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
