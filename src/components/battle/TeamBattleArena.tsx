import { useEffect, useRef, useState } from 'react';
import { Check, Clock, Crown, Loader2, Trophy, X } from 'lucide-react';
import { cn } from '@/utils';
import {
  getTeamColors,
  useTeamBattleStore,
  type TeamBattleData,
  type TeamBattleMember,
} from '@/stores/teamBattleStore';

interface TeamBattleArenaProps {
  data: TeamBattleData;
  userId: string;
  onComplete: (data: TeamBattleData) => void;
}

// Synchronized-round arena. The countdown ticks against the SERVER-returned
// round_ends_at — never local Date.now() alone — so client clock drift only
// affects display, not acceptance (the server re-validates the window).
export function TeamBattleArena({ data, userId, onComplete }: TeamBattleArenaProps) {
  const { battle, team1, team2 } = data;
  const { submitAnswer } = useTeamBattleStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answeredQuestionId, setAnsweredQuestionId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number; correctAnswer: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => secondsUntil(battle.roundEndsAt));
  const completedRef = useRef(false);

  const question = battle.question ?? null;
  const roundClosed = !battle.roundEndsAt || secondsLeft <= 0;
  const alreadyAnswered = question ? answeredQuestionId === question.id : false;

  // Reset per-round local state when the served question changes
  useEffect(() => {
    setSelectedAnswer('');
    setTextAnswer('');
    setLastResult(null);
    setSubmitError(null);
  }, [question?.id]);

  // Countdown against the server round clock
  useEffect(() => {
    const tick = () => setSecondsLeft(secondsUntil(battle.roundEndsAt));
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [battle.roundEndsAt]);

  // The poller keeps the store fresh; surface completion once.
  useEffect(() => {
    if (battle.status === 'completed' && !completedRef.current) {
      completedRef.current = true;
      onComplete(data);
    }
  }, [battle.status, data, onComplete]);

  const handleSubmit = async (value: string) => {
    if (!question || !value.trim() || isSubmitting || alreadyAnswered || roundClosed) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitAnswer(question.id, value.trim());
      setLastResult({ correct: result.correct, points: result.points, correctAnswer: result.correctAnswer });
      setAnsweredQuestionId(question.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit answer';
      // A duplicate means we already answered this round (e.g. after reconnect)
      if (message.toLowerCase().includes('already answered')) {
        setAnsweredQuestionId(question.id);
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Scoreboard */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="grid grid-cols-3 items-center gap-4">
          <TeamScore team={team1} teamIndex={1} score={battle.team1Score} isMine={team1.some((m) => m.userId === userId)} totalQuestions={battle.totalQuestions} />
          <div className="text-center">
            <p className="text-xs text-neutral-400 uppercase">Round</p>
            <p className="text-lg font-bold text-neutral-900">
              {Math.min(battle.currentQuestion + 1, battle.totalQuestions)} / {battle.totalQuestions}
            </p>
          </div>
          <TeamScore team={team2} teamIndex={2} score={battle.team2Score} isMine={team2.some((m) => m.userId === userId)} totalQuestions={battle.totalQuestions} alignRight />
        </div>
      </div>

      {/* Round countdown */}
      <div className="flex justify-center">
        <div className={cn(
          'flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg',
          roundClosed
            ? 'bg-neutral-200 text-neutral-500'
            : secondsLeft <= 5
            ? 'bg-red-100 text-red-600 animate-pulse'
            : 'bg-neutral-100 text-neutral-700',
        )}>
          <Clock className="w-5 h-5" />
          {roundClosed ? 'Round closed' : `${secondsLeft}s`}
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl shadow-card p-6">
        {roundClosed ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-neutral-500">
              Round closed — {battle.currentQuestion + 1 >= battle.totalQuestions ? 'finishing battle...' : 'next question loading...'}
            </p>
          </div>
        ) : !question ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-neutral-500">Loading question...</p>
          </div>
        ) : (
          <>
            <p className="text-lg font-medium text-neutral-900 mb-6">{question.questionText}</p>

            {question.options && question.options.length > 0 ? (
              <div className="space-y-3">
                {question.options.map((option) => {
                  const isSelected = selectedAnswer === option.id;
                  const showReveal = alreadyAnswered && lastResult;
                  // correct_answer may be a letter ("B"), letter-prefixed
                  // ("B. 3"), or a value ("True") — match all three shapes.
                  const ca = (lastResult?.correctAnswer ?? '').trim();
                  const isCorrectOption = !!showReveal && (
                    option.id === ca.toUpperCase() ||
                    ca.toUpperCase().startsWith(`${option.id}.`) ||
                    option.text.trim().toLowerCase() === ca.toLowerCase()
                  );
                  const isWrongPick = showReveal && isSelected && !lastResult.correct;

                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedAnswer(option.id)}
                      disabled={alreadyAnswered || isSubmitting}
                      className={cn(
                        'w-full p-4 text-left rounded-lg border-2 transition-all disabled:cursor-default',
                        isCorrectOption
                          ? 'bg-green-50 border-green-500 text-green-800'
                          : isWrongPick
                          ? 'bg-red-50 border-red-500 text-red-800'
                          : isSelected
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-white border-neutral-200 hover:border-neutral-300',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-medium">
                          {option.id}
                        </span>
                        <span className="flex-1">{option.text}</span>
                        {isCorrectOption && <Check className="w-5 h-5 text-green-500" />}
                        {isWrongPick && <X className="w-5 h-5 text-red-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={alreadyAnswered || isSubmitting}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-primary focus:outline-none disabled:opacity-60"
              />
            )}

            {submitError && (
              <p className="mt-3 text-sm text-red-600">{submitError}</p>
            )}

            {!alreadyAnswered ? (
              <button
                onClick={() => handleSubmit(question.options?.length ? selectedAnswer : textAnswer)}
                disabled={isSubmitting || !(question.options?.length ? selectedAnswer : textAnswer.trim())}
                className="w-full mt-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Locking in...' : 'Lock In Answer'}
              </button>
            ) : (
              <div className={cn(
                'mt-4 p-4 rounded-lg text-center',
                lastResult
                  ? lastResult.correct
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                  : 'bg-neutral-50',
              )}>
                {lastResult ? (
                  <>
                    <p className={cn('font-semibold', lastResult.correct ? 'text-green-700' : 'text-red-700')}>
                      {lastResult.correct ? `Correct! +${lastResult.points} pts` : 'Incorrect'}
                    </p>
                    {!lastResult.correct && (
                      <p className="text-sm text-neutral-700 mt-1">
                        Correct answer: <strong>{lastResult.correctAnswer}</strong>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-neutral-600">Answer locked in — waiting for the round to close.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function secondsUntil(roundEndsAt: string | null): number {
  if (!roundEndsAt) return 0;
  return Math.max(0, Math.ceil((Date.parse(roundEndsAt) - Date.now()) / 1000));
}

function TeamScore({
  team,
  teamIndex,
  score,
  isMine,
  totalQuestions,
  alignRight,
}: {
  team: TeamBattleMember[];
  teamIndex: 1 | 2;
  score: number;
  isMine: boolean;
  totalQuestions: number;
  alignRight?: boolean;
}) {
  const colors = getTeamColors(teamIndex);
  return (
    <div className={cn('p-3 rounded-lg border', colors.bgLight, colors.border, isMine && 'ring-2 ring-primary')}>
      <div className={cn('flex items-center gap-2', alignRight && 'justify-end')}>
        <p className={cn('font-bold', colors.text)}>Team {teamIndex}</p>
        {isMine && <span className="text-xs text-neutral-500">(You)</span>}
      </div>
      <p className={cn('text-3xl font-bold my-1', colors.text, alignRight && 'text-right')}>{score}</p>
      {/* Per-member progress dots: answered rounds out of total */}
      <div className={cn('space-y-1', alignRight && 'flex flex-col items-end')}>
        {team.map((member) => (
          <div key={member.userId} className="flex items-center gap-1" title={`${member.name}: ${member.answeredCount}/${totalQuestions} answered`}>
            <span className="text-xs text-neutral-500 w-16 truncate">{member.name}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <span
                  key={i}
                  className={cn('w-1.5 h-1.5 rounded-full', i < member.answeredCount ? colors.bg : 'bg-neutral-200')}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Results
interface TeamBattleResultsProps {
  data: TeamBattleData;
  userId: string;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function TeamBattleResults({ data, userId, onPlayAgain, onExit }: TeamBattleResultsProps) {
  const { battle, team1, team2 } = data;
  const myTeamNumber = team1.some((m) => m.userId === userId) ? 1 : 2;
  const isDraw = battle.winnerTeam === null;
  const isWinner = battle.winnerTeam === myTeamNumber;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className={cn(
        'text-center p-8 rounded-xl text-white',
        isDraw
          ? 'bg-gradient-to-br from-neutral-400 to-neutral-500'
          : isWinner
          ? 'bg-gradient-to-br from-yellow-400 to-yellow-500'
          : 'bg-gradient-to-br from-neutral-600 to-neutral-700',
      )}>
        <Trophy className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-display font-bold mb-2">
          {isDraw ? "It's a Draw!" : isWinner ? 'Victory!' : 'Defeat'}
        </h1>
        <p className="opacity-90">
          {isDraw
            ? 'Dead even on score and time.'
            : isWinner
            ? `Team ${battle.winnerTeam} takes it! +${battle.xpReward} XP for every winning member.`
            : `Team ${battle.winnerTeam} wins. Better luck next time!`}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between text-center">
          <div className="flex-1">
            <p className="text-sm text-neutral-500">Team 1{myTeamNumber === 1 ? ' (You)' : ''}</p>
            <p className="text-3xl font-bold text-blue-600">{battle.team1Score}</p>
          </div>
          <span className="text-2xl font-bold text-neutral-300 px-4">VS</span>
          <div className="flex-1">
            <p className="text-sm text-neutral-500">Team 2{myTeamNumber === 2 ? ' (You)' : ''}</p>
            <p className="text-3xl font-bold text-red-600">{battle.team2Score}</p>
          </div>
        </div>

        {/* Per-member scoreboard */}
        {[1, 2].map((teamIndex) => {
          const members = (teamIndex === 1 ? team1 : team2);
          const colors = getTeamColors(teamIndex as 1 | 2);
          return (
            <div key={teamIndex}>
              <p className={cn('text-sm font-semibold mb-2', colors.text)}>Team {teamIndex}</p>
              <div className="space-y-1">
                {[...members].sort((a, b) => b.score - a.score).map((member) => (
                  <div key={member.userId} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                    <span className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                      {member.isCaptain && <Crown className="w-4 h-4 text-amber-500" />}
                      {member.name}{member.userId === userId && ' (You)'}
                    </span>
                    <span className="text-sm text-neutral-600">
                      {member.correctAnswers} correct · <strong>{member.score} pts</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 border-2 border-neutral-200 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
