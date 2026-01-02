import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  Star,
  Target,
} from 'lucide-react';
import { cn } from '@/utils';
import { useQuickPlayStore, QUICK_PLAY_GAMES } from '@/stores/quickPlayStore';
import { useGamification } from '@/hooks/useGamification';

export function SpeedBlitz() {
  const {
    currentSession,
    submitAnswer,
    nextQuestion,
    updateTimeRemaining,
    endGame,
    lastResult,
    showResultModal,
    closeResultModal,
  } = useQuickPlayStore();

  const { awardXP } = useGamification();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const gameConfig = currentSession
    ? QUICK_PLAY_GAMES.find((g) => g.type === currentSession.gameType)
    : null;

  // Timer
  useEffect(() => {
    if (!currentSession?.isActive) return;

    const interval = setInterval(() => {
      updateTimeRemaining(currentSession.timeRemaining - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession?.isActive, currentSession?.timeRemaining, updateTimeRemaining]);

  // Award XP when game ends
  useEffect(() => {
    if (lastResult && showResultModal) {
      awardXP(lastResult.xpEarned, `${lastResult.gameType} completed!`);
    }
  }, [lastResult, showResultModal, awardXP]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (showFeedback || !currentSession?.isActive) return;

      setSelectedAnswer(answer);
      const result = submitAnswer(answer);

      if (result) {
        setLastAnswerCorrect(result.isCorrect);
        setShowFeedback(true);

        setTimeout(() => {
          setShowFeedback(false);
          setSelectedAnswer(null);
          setLastAnswerCorrect(null);
          nextQuestion();
        }, 800);
      }
    },
    [showFeedback, currentSession?.isActive, submitAnswer, nextQuestion]
  );

  if (!currentSession) return null;

  const currentQuestion = currentSession.questions[currentSession.currentIndex];
  const progress = ((currentSession.currentIndex + 1) / currentSession.questions.length) * 100;
  const timeProgress = (currentSession.timeRemaining / (gameConfig?.duration || 60)) * 100;
  const isLowTime = currentSession.timeRemaining <= 10;

  // Result Modal
  if (showResultModal && lastResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div
            className={cn(
              'p-6 text-white text-center',
              lastResult.perfectGame
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : lastResult.accuracy >= 80
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : lastResult.accuracy >= 60
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : 'bg-gradient-to-br from-neutral-600 to-neutral-700'
            )}
          >
            {lastResult.perfectGame && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mb-3"
              >
                <Trophy className="w-16 h-16 mx-auto text-yellow-200" />
              </motion.div>
            )}

            <h2 className="text-2xl font-bold">
              {lastResult.perfectGame
                ? 'Perfect Game!'
                : lastResult.accuracy >= 80
                ? 'Great Job!'
                : lastResult.accuracy >= 60
                ? 'Good Effort!'
                : 'Keep Practicing!'}
            </h2>

            {lastResult.newHighScore && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20"
              >
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">New High Score!</span>
              </motion.div>
            )}
          </div>

          {/* Stats */}
          <div className="p-6 space-y-4">
            {/* Score */}
            <div className="text-center">
              <div className="text-5xl font-bold text-neutral-900">{lastResult.accuracy}%</div>
              <div className="text-neutral-500 mt-1">Accuracy</div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-neutral-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">{lastResult.correctAnswers}</span>
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">Correct</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-neutral-600">
                  <Target className="w-4 h-4" />
                  <span className="font-semibold">{lastResult.totalQuestions}</span>
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">Total</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">{lastResult.timeTaken}s</span>
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">Time</div>
              </div>
            </div>

            {/* XP Earned */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-6 h-6 text-amber-500" />
                <span className="text-3xl font-bold text-amber-600">+{lastResult.xpEarned}</span>
                <span className="text-amber-600 font-medium">XP</span>
              </div>
              {lastResult.streakBonus > 0 && (
                <div className="text-sm text-amber-600/80 mt-1">
                  Includes {lastResult.streakBonus} bonus XP!
                </div>
              )}
            </motion.div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-neutral-100 flex gap-3">
            <button
              onClick={closeResultModal}
              className="flex-1 py-3 rounded-xl font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => {
                closeResultModal();
                useQuickPlayStore.getState().openQuickPlayModal();
              }}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              Play Again
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Game UI
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          {/* Timer */}
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              isLowTime ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
            )}
          >
            <Clock className={cn('w-5 h-5', isLowTime && 'animate-pulse')} />
            <span className="font-mono font-bold text-lg">{currentSession.timeRemaining}s</span>
          </div>

          {/* Score & Streak */}
          <div className="flex items-center gap-3">
            {currentSession.streak > 1 && (
              <motion.div
                key={currentSession.streak}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400"
              >
                <Flame className="w-4 h-4" />
                <span className="font-bold">{currentSession.streak}</span>
              </motion.div>
            )}
            <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/10 text-white">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="font-bold">{currentSession.score}</span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={endGame}
            className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bars */}
        <div className="mt-4 space-y-2">
          {/* Time Progress */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                isLowTime ? 'bg-red-500' : 'bg-emerald-500'
              )}
              initial={{ width: '100%' }}
              animate={{ width: `${timeProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Question Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-white/60 text-sm font-medium">
              {currentSession.currentIndex + 1}/{currentSession.questions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-32 pb-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              {/* Question Text */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <p className="text-white text-xl font-medium text-center leading-relaxed">
                  {currentQuestion.text}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options?.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.correctAnswer;
                  const showCorrectFeedback = showFeedback && isCorrect;
                  const showWrongFeedback = showFeedback && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={option}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleAnswer(option)}
                      disabled={showFeedback}
                      className={cn(
                        'w-full p-4 rounded-xl font-medium text-left transition-all',
                        'border-2',
                        showCorrectFeedback
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : showWrongFeedback
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : isSelected
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                            showCorrectFeedback
                              ? 'bg-emerald-500 text-white'
                              : showWrongFeedback
                              ? 'bg-red-500 text-white'
                              : 'bg-white/10'
                          )}
                        >
                          {showCorrectFeedback ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : showWrongFeedback ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </span>
                        <span className="flex-1">{option}</span>
                        {showCorrectFeedback && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-emerald-400"
                          >
                            +100
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Feedback Flash */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 pointer-events-none',
              lastAnswerCorrect
                ? 'bg-emerald-500/10'
                : 'bg-red-500/10'
            )}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
