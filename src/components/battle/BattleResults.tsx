import { Trophy, Medal, RotateCcw, Home } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { Battle } from '@/types';

interface BattleResultsProps {
  battle: Battle;
  onRematch: () => void;
  onExit: () => void;
}

export function BattleResults({ battle, onRematch, onExit }: BattleResultsProps) {
  const { user } = useAuthStore();

  const isChallenger = user?.id === battle.challengerId;
  const myScore = isChallenger ? battle.challengerScore : battle.opponentScore;
  const opponentScore = isChallenger ? battle.opponentScore : battle.challengerScore;
  const myName = isChallenger ? battle.challengerName : battle.opponentName;
  const opponentName = isChallenger ? battle.opponentName : battle.challengerName;

  const isWinner = battle.winnerId === user?.id;
  const isTie = !battle.winnerId && battle.challengerScore === battle.opponentScore;
  const isLoser = !isWinner && !isTie;

  // Calculate XP earned
  const baseXP = myScore * 10;
  const winBonus = isWinner ? 50 : 0;
  const participationBonus = 20;
  const totalXP = baseXP + winBonus + participationBonus;

  return (
    <div className="max-w-lg mx-auto">
      {/* Result banner */}
      <div className={`
        text-center p-8 rounded-t-xl
        ${isWinner ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
          isTie ? 'bg-gradient-to-br from-neutral-400 to-neutral-500' :
          'bg-gradient-to-br from-neutral-600 to-neutral-700'}
        text-white
      `}>
        {isWinner && (
          <Trophy className="w-16 h-16 mx-auto mb-4 animate-bounce" />
        )}
        {isTie && (
          <div className="flex justify-center gap-2 mb-4">
            <Medal className="w-12 h-12" />
            <Medal className="w-12 h-12" />
          </div>
        )}
        {isLoser && (
          <Medal className="w-16 h-16 mx-auto mb-4 opacity-60" />
        )}

        <h1 className="text-3xl font-display font-bold mb-2">
          {isWinner ? 'Victory!' : isTie ? "It's a Tie!" : 'Defeat'}
        </h1>
        <p className="opacity-90">
          {isWinner ? 'Congratulations on your win!' :
           isTie ? 'A well-matched battle!' :
           'Better luck next time!'}
        </p>
      </div>

      {/* Score comparison */}
      <div className="bg-white shadow-card rounded-b-xl p-6 space-y-6">
        {/* Scores */}
        <div className="flex items-center justify-between">
          {/* My score */}
          <div className="text-center flex-1">
            <div className={`
              w-20 h-20 mx-auto rounded-full flex items-center justify-center
              ${isWinner ? 'bg-yellow-100 text-yellow-600' : 'bg-neutral-100 text-neutral-600'}
            `}>
              <span className="text-3xl font-bold">{myScore}</span>
            </div>
            <p className="mt-2 font-medium text-neutral-900">{myName || 'You'}</p>
            {isWinner && <p className="text-sm text-yellow-600">Winner!</p>}
          </div>

          {/* VS */}
          <div className="px-6">
            <span className="text-2xl font-bold text-neutral-300">VS</span>
          </div>

          {/* Opponent score */}
          <div className="text-center flex-1">
            <div className={`
              w-20 h-20 mx-auto rounded-full flex items-center justify-center
              ${!isWinner && !isTie ? 'bg-yellow-100 text-yellow-600' : 'bg-neutral-100 text-neutral-600'}
            `}>
              <span className="text-3xl font-bold">{opponentScore}</span>
            </div>
            <p className="mt-2 font-medium text-neutral-900">{opponentName || 'Opponent'}</p>
            {!isWinner && !isTie && <p className="text-sm text-yellow-600">Winner!</p>}
          </div>
        </div>

        {/* XP earned */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
          <h3 className="text-sm font-medium text-neutral-600 mb-3">Rewards Earned</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Base XP ({myScore} correct x 10)</span>
              <span className="font-medium text-neutral-900">+{baseXP} XP</span>
            </div>
            {isWinner && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Victory Bonus</span>
                <span className="font-medium text-yellow-600">+{winBonus} XP</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Participation</span>
              <span className="font-medium text-neutral-900">+{participationBonus} XP</span>
            </div>
            <div className="pt-2 border-t border-neutral-200 flex justify-between">
              <span className="font-medium text-neutral-900">Total</span>
              <span className="font-bold text-primary">+{totalXP} XP</span>
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-xl font-bold text-neutral-900">{battle.questionCount}</p>
            <p className="text-xs text-neutral-500">Questions</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-xl font-bold text-neutral-900">{myScore}</p>
            <p className="text-xs text-neutral-500">Correct</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-xl font-bold text-neutral-900">
              {Math.round((myScore / battle.questionCount) * 100)}%
            </p>
            <p className="text-xs text-neutral-500">Accuracy</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onRematch}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
          <button
            onClick={onExit}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-neutral-200 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Exit
          </button>
        </div>
      </div>

      {/* Motivational message */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
        <p className="text-sm text-blue-800">
          {isWinner
            ? "Great job! Keep challenging yourself to maintain your winning streak!"
            : isTie
            ? "So close! One more correct answer could have decided it."
            : "Every battle makes you stronger. Keep practicing!"}
        </p>
      </div>
    </div>
  );
}
