import { useEffect, useState } from 'react';
import { Swords, Users, RefreshCw, Zap } from 'lucide-react';
import { useBattleStore } from '@/stores/battleStore';
import { useAuthStore } from '@/stores/authStore';
import { usePolling } from '@/hooks/usePolling';
import type { Battle, Difficulty } from '@/types';

interface BattleLobbyProps {
  onBattleStart: (battle: Battle) => void;
}

export function BattleLobby({ onBattleStart }: BattleLobbyProps) {
  const { user } = useAuthStore();
  const {
    availableBattles,
    isLoading,
    error,
    fetchAvailableBattles,
    createBattle,
    joinBattle,
  } = useBattleStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableBattles();
  }, [fetchAvailableBattles]);

  // Poll for new battles (pauses while the tab is hidden)
  usePolling(fetchAvailableBattles, 5000);

  const handleCreateBattle = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const battle = await createBattle(user.id, {
        difficulty: selectedDifficulty,
        questionCount,
      });
      onBattleStart(battle);
    } catch (err) {
      console.error('Failed to create battle:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinBattle = async (battleId: string) => {
    if (!user) return;

    setIsJoining(battleId);
    try {
      await joinBattle(battleId, user.id);
      const battle = availableBattles.find((b) => b.id === battleId);
      if (battle) {
        onBattleStart({ ...battle, status: 'active' });
      }
    } catch (err) {
      console.error('Failed to join battle:', err);
    } finally {
      setIsJoining(null);
    }
  };

  const handleQuickMatch = async () => {
    // Join the first available battle or create one
    if (availableBattles.length > 0) {
      await handleJoinBattle(availableBattles[0].id);
    } else {
      await handleCreateBattle();
    }
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hard: 'bg-orange-100 text-orange-700 border-orange-200',
    expert: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="w-8 h-8" />
          <h1 className="text-2xl font-display font-bold">Battle Arena</h1>
        </div>
        <p className="text-white/80">Challenge other students to a real-time quiz battle!</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick match */}
        <button
          onClick={handleQuickMatch}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 p-6 bg-secondary text-neutral-900 rounded-xl font-semibold hover:bg-secondary-dark transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Zap className="w-6 h-6" />
          Quick Match
        </button>

        {/* Create battle */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center justify-center gap-3 p-6 bg-white border-2 border-neutral-200 rounded-xl font-semibold hover:border-primary transition-all"
        >
          <Users className="w-6 h-6" />
          Create Battle
        </button>
      </div>

      {/* Create battle form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900">Create New Battle</h3>

          {/* Difficulty selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Difficulty
            </label>
            <div className="flex flex-wrap gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`
                    px-4 py-2 rounded-lg border-2 font-medium capitalize transition-all
                    ${selectedDifficulty === diff
                      ? difficultyColors[diff] + ' border-current'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }
                  `}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Number of Questions
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`
                    px-4 py-2 rounded-lg border-2 font-medium transition-all
                    ${questionCount === count
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }
                  `}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreateBattle}
            disabled={isCreating}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Battle & Wait for Opponent'}
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Available battles */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Available Battles</h3>
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
              <div
                key={battle.id}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {/* Challenger avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    {battle.challengerName?.charAt(0) || '?'}
                  </div>

                  <div>
                    <p className="font-medium text-neutral-900">
                      {battle.challengerName || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[battle.difficulty]}`}>
                        {battle.difficulty}
                      </span>
                      <span>{battle.questionCount} questions</span>
                      {battle.subjectName && (
                        <span>- {battle.subjectName}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinBattle(battle.id)}
                  disabled={isJoining === battle.id}
                  className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
                >
                  {isJoining === battle.id ? 'Joining...' : 'Join Battle'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p>No battles available right now.</p>
            <p className="text-sm">Create one and wait for an opponent!</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Answer faster for bonus points! Speed matters in battles.
        </p>
      </div>
    </div>
  );
}
