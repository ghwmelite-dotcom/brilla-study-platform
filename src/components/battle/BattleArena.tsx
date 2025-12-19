import { useState, useEffect, useCallback } from 'react';
import { Clock, Check, X, Loader2 } from 'lucide-react';
import { useBattleStore, useAuthStore } from '@/stores';
import { useTimer } from '@/hooks';
import type { Battle } from '@/types';
import { VoiceInput } from '@/components/common';

interface BattleArenaProps {
  battle: Battle;
  onComplete: (battle: Battle) => void;
}

export function BattleArena({ battle, onComplete }: BattleArenaProps) {
  const { user } = useAuthStore();
  const {
    currentQuestion,
    currentQuestionIndex,
    myScore,
    opponentScore,
    submitAnswer,
    nextQuestion,
    fetchBattle,
    startPolling,
    stopPolling,
  } = useBattleStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [voiceAnswer, setVoiceAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null>(null);
  const [answerStartTime] = useState(Date.now());

  // Timer for each question
  const { time, start, reset: resetTimer } = useTimer({
    initialTime: currentQuestion?.timeLimit || 30,
    countdown: true,
    onEnd: () => {
      if (!showResult && selectedAnswer === '') {
        handleSubmit('');
      }
    },
  });

  // Start polling for opponent's status
  useEffect(() => {
    startPolling(battle.id);
    return () => stopPolling();
  }, [battle.id, startPolling, stopPolling]);

  // Start timer when question changes
  useEffect(() => {
    if (currentQuestion) {
      resetTimer();
      start();
    }
  }, [currentQuestion, start, resetTimer]);

  // Check if battle is complete
  useEffect(() => {
    fetchBattle(battle.id);
    const checkInterval = setInterval(async () => {
      await fetchBattle(battle.id);
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [battle.id, fetchBattle]);

  const handleSubmit = useCallback(async (answer: string) => {
    if (!user || !currentQuestion || isSubmitting) return;

    const timeTaken = Math.round((Date.now() - answerStartTime) / 1000);
    setIsSubmitting(true);

    try {
      const result = await submitAnswer(
        battle.id,
        user.id,
        answer,
        currentQuestionIndex,
        timeTaken
      );

      setLastResult({
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
      });
      setShowResult(true);

      if (result.battleComplete) {
        // Wait a moment then show results
        setTimeout(() => {
          fetchBattle(battle.id).then(() => {
            onComplete(battle);
          });
        }, 2000);
      } else {
        // Move to next question after showing result
        setTimeout(() => {
          setShowResult(false);
          setSelectedAnswer('');
          setVoiceAnswer('');
          setLastResult(null);
          nextQuestion();
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, currentQuestion, isSubmitting, battle.id, currentQuestionIndex, submitAnswer, answerStartTime, fetchBattle, onComplete, nextQuestion]);

  const handleOptionSelect = (optionText: string) => {
    if (showResult || isSubmitting) return;
    setSelectedAnswer(optionText);
  };

  const handleVoiceSubmit = (text: string) => {
    handleSubmit(text);
  };

  const isChallenger = user?.id === battle.challengerId;
  const displayMyScore = isChallenger ? myScore || battle.challengerScore : myScore || battle.opponentScore;
  const displayOpponentScore = isChallenger ? opponentScore || battle.opponentScore : opponentScore || battle.challengerScore;
  const myName = isChallenger ? battle.challengerName : battle.opponentName;
  const opponentName = isChallenger ? battle.opponentName : battle.challengerName;

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex items-center justify-between">
          {/* My score */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {myName?.charAt(0) || 'Y'}
            </div>
            <div>
              <p className="text-sm text-neutral-500">You</p>
              <p className="text-2xl font-bold text-primary">{displayMyScore}</p>
            </div>
          </div>

          {/* VS */}
          <div className="text-center">
            <p className="text-xs text-neutral-400 uppercase">Question</p>
            <p className="text-lg font-bold text-neutral-900">
              {currentQuestionIndex + 1} / {battle.questionCount}
            </p>
          </div>

          {/* Opponent score */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-neutral-500">{opponentName || 'Opponent'}</p>
              <p className="text-2xl font-bold text-accent">{displayOpponentScore}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
              {opponentName?.charAt(0) || 'O'}
            </div>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center">
        <div className={`
          flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg
          ${time <= 10 ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-700'}
          ${time <= 5 ? 'animate-pulse' : ''}
        `}>
          <Clock className="w-5 h-5" />
          {time}s
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <p className="text-lg font-medium text-neutral-900 mb-6">
          {currentQuestion.questionText}
        </p>

        {/* Multiple choice options */}
        {currentQuestion.options && currentQuestion.options.length > 0 ? (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option.text;
              const isCorrectAnswer = showResult && option.text === lastResult?.correctAnswer;
              const isWrongAnswer = showResult && isSelected && !lastResult?.isCorrect;

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.text)}
                  disabled={showResult || isSubmitting}
                  className={`
                    w-full p-4 text-left rounded-lg border-2 transition-all
                    ${isCorrectAnswer
                      ? 'bg-green-50 border-green-500 text-green-800'
                      : isWrongAnswer
                      ? 'bg-red-50 border-red-500 text-red-800'
                      : isSelected
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }
                    disabled:cursor-default
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option.text}</span>
                    {isCorrectAnswer && <Check className="w-5 h-5 text-green-500" />}
                    {isWrongAnswer && <X className="w-5 h-5 text-red-500" />}
                  </div>
                </button>
              );
            })}

            {/* Submit button */}
            {!showResult && (
              <button
                onClick={() => handleSubmit(selectedAnswer)}
                disabled={!selectedAnswer || isSubmitting}
                className="w-full py-3 mt-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            )}
          </div>
        ) : (
          /* Direct answer / voice input */
          <div className="space-y-4">
            <VoiceInput
              onTranscript={setVoiceAnswer}
              onSubmit={handleVoiceSubmit}
              disabled={showResult || isSubmitting}
              placeholder="Speak or type your answer..."
            />

            {/* Result display for direct answers */}
            {showResult && lastResult && (
              <div className={`
                p-4 rounded-lg
                ${lastResult.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
              `}>
                <div className="flex items-center gap-2 mb-2">
                  {lastResult.isCorrect ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${lastResult.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {lastResult.isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                {!lastResult.isCorrect && (
                  <p className="text-sm text-neutral-700">
                    Correct answer: <strong>{lastResult.correctAnswer}</strong>
                  </p>
                )}
                {lastResult.explanation && (
                  <p className="text-sm text-neutral-600 mt-2">{lastResult.explanation}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result overlay for multiple choice */}
        {showResult && lastResult && currentQuestion.options && (
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
            {lastResult.explanation && (
              <p className="text-sm text-neutral-600">{lastResult.explanation}</p>
            )}
            <p className="text-sm text-neutral-500 mt-2">Next question in 2 seconds...</p>
          </div>
        )}
      </div>
    </div>
  );
}
