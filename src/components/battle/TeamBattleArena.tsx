import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Check,
  X,
  Trophy,
  Crown,
  Star,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button, Card } from '@/components/common';
import {
  useTeamBattleStore,
  type TeamBattle,
  type BattleTeam,
  getTeamColors,
} from '@/stores/teamBattleStore';
import type { Question } from '@/types';

interface TeamBattleArenaProps {
  battle: TeamBattle;
  question: Question;
  onComplete?: (winnerId: string) => void; // Will be used when battle ends
  className?: string;
}

// Note: onComplete will be called when the battle ends

export function TeamBattleArena({
  battle,
  question,
  onComplete: _onComplete, // Reserved for future use
  className,
}: TeamBattleArenaProps) {
  const {
    myTeamId,
    selectedAnswer,
    isAnswerLocked,
    timeRemaining,
    setSelectedAnswer,
    updateTimeRemaining,
    submitTeamAnswer,
  } = useTeamBattleStore();

  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    pointsEarned: number;
  } | null>(null);

  // Timer countdown
  useEffect(() => {
    if (isAnswerLocked || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      updateTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isAnswerLocked, updateTimeRemaining]);

  const handleSubmit = useCallback(async () => {
    if (!selectedAnswer) return;

    const result = await submitTeamAnswer(selectedAnswer);
    setLastResult(result);
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
    }, 2000);
  }, [selectedAnswer, submitTeamAnswer]);

  // Auto-submit on timer end
  useEffect(() => {
    if (timeRemaining === 0 && !isAnswerLocked && selectedAnswer) {
      void handleSubmit();
    }
  }, [handleSubmit, isAnswerLocked, selectedAnswer, timeRemaining]);

  // Team info for potential future use (e.g., showing team-specific UI)
  // const myTeam = myTeamId === battle.team1.id ? battle.team1 : battle.team2;
  // const opponentTeam = myTeamId === battle.team1.id ? battle.team2 : battle.team1;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Scoreboard */}
      <TeamScoreboard
        team1={battle.team1}
        team2={battle.team2}
        myTeamId={myTeamId || ''}
        currentQuestion={battle.currentQuestionIndex + 1}
        totalQuestions={battle.questionCount}
      />

      {/* Timer */}
      <div className="flex justify-center">
        <motion.div
          animate={{
            scale: timeRemaining <= 5 ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.5, repeat: timeRemaining <= 5 ? Infinity : 0 }}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xl',
            timeRemaining <= 5
              ? 'bg-red-100 text-red-600'
              : timeRemaining <= 10
              ? 'bg-amber-100 text-amber-600'
              : 'bg-neutral-100 text-neutral-700'
          )}
        >
          <Clock className="w-6 h-6" />
          <span>{timeRemaining}s</span>
        </motion.div>
      </div>

      {/* Question */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <span className="text-sm text-neutral-500">
            Question {battle.currentQuestionIndex + 1} of {battle.questionCount}
          </span>
          <h2 className="text-xl font-semibold text-neutral-900 mt-2">
            {question.questionText}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options?.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = selectedAnswer === option.text;
            const isCorrect = showResult && option.text === lastResult?.correctAnswer;
            const isWrong = showResult && isSelected && !lastResult?.isCorrect;

            return (
              <motion.button
                key={option.id || index}
                whileHover={!isAnswerLocked ? { scale: 1.02 } : undefined}
                whileTap={!isAnswerLocked ? { scale: 0.98 } : undefined}
                onClick={() => !isAnswerLocked && setSelectedAnswer(option.text)}
                disabled={isAnswerLocked}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  isCorrect && 'bg-emerald-50 border-emerald-500',
                  isWrong && 'bg-red-50 border-red-500',
                  !showResult && isSelected && 'bg-primary-50 border-primary',
                  !showResult && !isSelected && 'bg-white border-neutral-200 hover:border-neutral-300',
                  isAnswerLocked && 'cursor-not-allowed opacity-75'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0',
                      isCorrect && 'bg-emerald-500 text-white',
                      isWrong && 'bg-red-500 text-white',
                      !showResult && isSelected && 'bg-primary text-white',
                      !showResult && !isSelected && 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    {isCorrect && <Check className="w-4 h-4" />}
                    {isWrong && <X className="w-4 h-4" />}
                    {!showResult && optionLetter}
                  </div>
                  <span className="font-medium text-neutral-700">{option.text}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Submit Button */}
        {!isAnswerLocked && (
          <div className="mt-6 text-center">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!selectedAnswer}
            >
              <Zap className="w-5 h-5 mr-2" />
              Lock In Answer
            </Button>
          </div>
        )}
      </Card>

      {/* Result Overlay */}
      <AnimatePresence>
        {showResult && lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <div
              className={cn(
                'p-8 rounded-2xl text-center',
                lastResult.isCorrect ? 'bg-emerald-500' : 'bg-red-500'
              )}
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4">
                {lastResult.isCorrect ? (
                  <Check className="w-10 h-10 text-white" />
                ) : (
                  <X className="w-10 h-10 text-white" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {lastResult.isCorrect ? 'Correct!' : 'Wrong!'}
              </h3>
              {lastResult.pointsEarned > 0 && (
                <p className="text-white/80">+{lastResult.pointsEarned} points</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Team Scoreboard
interface TeamScoreboardProps {
  team1: BattleTeam;
  team2: BattleTeam;
  myTeamId: string;
  currentQuestion: number;
  totalQuestions: number;
}

export function TeamScoreboard({
  team1,
  team2,
  myTeamId,
  currentQuestion,
  totalQuestions,
}: TeamScoreboardProps) {
  const team1Colors = getTeamColors(1);
  const team2Colors = getTeamColors(2);

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Team 1 */}
        <div
          className={cn(
            'p-4 rounded-xl',
            team1.id === myTeamId ? 'ring-2 ring-primary' : '',
            team1Colors.bgLight,
            team1Colors.border,
            'border'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', team1Colors.bg)}>
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className={cn('font-bold text-lg', team1Colors.text)}>
                {team1.name || 'Team 1'}
              </p>
              <div className="flex -space-x-2">
                {team1.members.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white',
                      team1Colors.bg
                    )}
                    title={m.name}
                  >
                    {m.name[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className={cn('text-4xl font-bold', team1Colors.text)}>
              {team1.totalScore}
            </span>
          </div>
        </div>

        {/* Center - Question Counter */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-xl">
              VS
            </div>
            <div className="mt-2 px-4 py-1 rounded-full bg-neutral-100 text-sm font-medium">
              Q{currentQuestion}/{totalQuestions}
            </div>
          </div>
        </div>

        {/* Team 2 */}
        <div
          className={cn(
            'p-4 rounded-xl',
            team2.id === myTeamId ? 'ring-2 ring-primary' : '',
            team2Colors.bgLight,
            team2Colors.border,
            'border'
          )}
        >
          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <p className={cn('font-bold text-lg', team2Colors.text)}>
                {team2.name || 'Team 2'}
              </p>
              <div className="flex -space-x-2 justify-end">
                {team2.members.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white',
                      team2Colors.bg
                    )}
                    title={m.name}
                  >
                    {m.name[0]}
                  </div>
                ))}
              </div>
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', team2Colors.bg)}>
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className={cn('text-4xl font-bold', team2Colors.text)}>
              {team2.totalScore}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Battle Results
interface TeamBattleResultsProps {
  battle: TeamBattle;
  onPlayAgain?: () => void;
  onExit?: () => void;
}

export function TeamBattleResults({
  battle,
  onPlayAgain,
  onExit,
}: TeamBattleResultsProps) {
  const { myTeamId } = useTeamBattleStore();
  const isWinner = battle.winnerId === myTeamId;
  const winningTeam = battle.winnerId === battle.team1.id ? battle.team1 : battle.team2;
  const losingTeam = battle.winnerId === battle.team1.id ? battle.team2 : battle.team1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8"
    >
      {/* Result Header */}
      <div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className={cn(
            'w-32 h-32 mx-auto rounded-full flex items-center justify-center',
            isWinner ? 'bg-amber-100' : 'bg-neutral-100'
          )}
        >
          {isWinner ? (
            <Crown className="w-16 h-16 text-amber-500" />
          ) : (
            <Star className="w-16 h-16 text-neutral-400" />
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn(
            'text-3xl font-bold mt-6',
            isWinner ? 'text-amber-600' : 'text-neutral-600'
          )}
        >
          {isWinner ? 'Victory!' : 'Defeat'}
        </motion.h2>
        <p className="text-neutral-500 mt-2">
          {isWinner
            ? 'Your team dominated the competition!'
            : 'Better luck next time!'}
        </p>
      </div>

      {/* Final Scores */}
      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
        <Card className={cn('p-6', isWinner && 'ring-2 ring-amber-400')}>
          <p className="text-sm text-neutral-500 mb-2">{winningTeam.name || 'Winners'}</p>
          <p className="text-4xl font-bold text-amber-600">{winningTeam.totalScore}</p>
          {isWinner && (
            <div className="mt-2 text-xs text-amber-600 font-medium">Your Team</div>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-sm text-neutral-500 mb-2">{losingTeam.name || 'Opponents'}</p>
          <p className="text-4xl font-bold text-neutral-600">{losingTeam.totalScore}</p>
          {!isWinner && (
            <div className="mt-2 text-xs text-neutral-500 font-medium">Your Team</div>
          )}
        </Card>
      </div>

      {/* Team MVP */}
      <Card className="p-6 max-w-md mx-auto">
        <h4 className="text-sm font-medium text-neutral-500 mb-4">Team MVP</h4>
        {/* Show top performer from winning team */}
        {winningTeam.members.sort((a, b) => b.score - a.score).slice(0, 1).map((mvp) => (
          <div key={mvp.id} className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xl">
                {mvp.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="absolute -top-1 -right-1">
                <Crown className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="text-left">
              <p className="font-bold text-neutral-900">{mvp.name}</p>
              <p className="text-neutral-500">
                {mvp.correctAnswers}/{mvp.questionsAnswered} correct • {mvp.score} pts
              </p>
            </div>
          </div>
        ))}
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onExit}>
          Exit
        </Button>
        <Button onClick={onPlayAgain}>
          Play Again
        </Button>
      </div>
    </motion.div>
  );
}
