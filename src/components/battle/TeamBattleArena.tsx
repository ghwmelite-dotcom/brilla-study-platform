import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, Crown, Loader2, MessageSquare, Send, Trophy, X } from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  getTeamColors,
  useTeamBattleStore,
  type TeamBattleChatMessage,
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
    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 min-w-0 w-full space-y-6">
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

      {/* Team chat (spec 1.4c) — store polls it on the battle tick */}
      <TeamBattleChatPanel userId={userId} />
    </div>
  );
}

// Collapsible battle-scoped chat. Messages/polling come from the team battle
// store; this component owns only the draft, open state, and auto-scroll.
function TeamBattleChatPanel({ userId }: { userId: string }) {
  const chatMessages = useTeamBattleStore((s) => s.chatMessages);
  const chatError = useTeamBattleStore((s) => s.chatError);
  const sendChatMessage = useTeamBattleStore((s) => s.sendChatMessage);
  const fetchChat = useTeamBattleStore((s) => s.fetchChat);
  const battleId = useTeamBattleStore((s) => s.current?.battle.id);

  const [isOpen, setIsOpen] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // First paint shouldn't wait for the 2s battle poll.
  useEffect(() => {
    if (battleId) void fetchChat(battleId);
  }, [battleId, fetchChat]);

  // Auto-scroll to the latest message. jsdom lacks scrollIntoView, so the
  // optional call doubles as the test-environment guard.
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [chatMessages.length, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setSendError(null);
    try {
      await sendChatMessage(text);
      setDraft('');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="w-full lg:w-80 lg:sticky lg:top-4 bg-white rounded-xl shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
          <MessageSquare className="w-4 h-4 text-primary" />
          Team chat
          {chatMessages.length > 0 && (
            <span className="text-xs font-normal text-neutral-400">({chatMessages.length})</span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-neutral-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-neutral-100 flex flex-col">
          <div className="h-64 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">
                {chatError ?? 'No messages yet — coordinate with your team here.'}
              </p>
            ) : (
              chatMessages.map((message) => (
                <ChatBubble key={message.id} message={message} isMine={message.senderId === userId} />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-neutral-100">
            {sendError && <p className="mb-2 text-xs text-red-600">{sendError}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={1000}
                placeholder="Message your team..."
                aria-label="Message your team"
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSending || !draft.trim()}
                aria-label="Send message"
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}

function ChatBubble({ message, isMine }: { message: TeamBattleChatMessage; isMine: boolean }) {
  const time = formatChatTime(message.createdAt);
  return (
    <div className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
      <p className="text-xs text-neutral-400 mb-0.5">
        {isMine ? 'You' : message.senderName ?? 'Teammate'} · {time}
      </p>
      <p
        className={cn(
          'max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words',
          isMine ? 'bg-primary/10 text-primary-dark' : 'bg-neutral-100 text-neutral-800',
        )}
      >
        {message.content}
      </p>
    </div>
  );
}

function formatChatTime(createdAt: string): string {
  const ms = Date.parse(createdAt);
  if (Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Refresh the profile so the topbar XP reflects the battle award immediately
  const restoreSession = useAuthStore((s) => s.restoreSession);
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

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
        {isWinner && battle.myWinStreak != null && battle.myWinStreak > 0 && battle.myWinStreakBonus != null && battle.myWinStreakBonus > 0 && (
          <p className="mt-2 font-semibold text-white/95">
            Win streak ×{battle.myWinStreak} (+{battle.myWinStreakBonus} XP)
          </p>
        )}
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
