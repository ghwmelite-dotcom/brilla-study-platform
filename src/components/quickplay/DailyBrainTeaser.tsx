import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Lightbulb,
  XCircle,
  Trophy,
  Zap,
  HelpCircle,
  Clock,
  X,
} from 'lucide-react';
import { cn } from '@/utils';
import { useQuickPlayStore } from '@/stores/quickPlayStore';
import { useGamification } from '@/hooks/useGamification';

interface DailyBrainTeaserProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyBrainTeaser({ isOpen, onClose }: DailyBrainTeaserProps) {
  const {
    dailyChallenge,
    fetchDailyChallenge,
    useDailyHint: consumeDailyHint,
    submitDailyAnswer,
  } = useQuickPlayStore();

  const { awardXP } = useGamification();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; xpEarned: number } | null>(null);
  const handleSubmitRef = useRef<() => void>(() => undefined);
  const challengeCompleted = dailyChallenge?.completed ?? false;
  const [timeRemaining, setTimeRemaining] = useState(120);

  useEffect(() => {
    if (isOpen) {
      fetchDailyChallenge();
      setTimeRemaining(120);
      setShowResult(false);
      setResult(null);
      setSelectedAnswer(null);
      setCurrentHint(null);
    }
  }, [isOpen, fetchDailyChallenge]);

  // Timer
  useEffect(() => {
    if (!isOpen || !dailyChallenge || challengeCompleted || showResult) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit wrong answer
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [challengeCompleted, dailyChallenge, isOpen, showResult]);

  const handleUseHint = () => {
    const hint = consumeDailyHint();
    if (hint) {
      setCurrentHint(hint);
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer && !dailyChallenge?.completed) {
      // Submit with wrong answer if time ran out
      const submitResult = submitDailyAnswer('');
      if (submitResult) {
        setResult(submitResult);
        setShowResult(true);
      }
      return;
    }

    if (selectedAnswer) {
      const submitResult = submitDailyAnswer(selectedAnswer);
      if (submitResult) {
        setResult(submitResult);
        setShowResult(true);
        if (submitResult.xpEarned > 0) {
          awardXP(submitResult.xpEarned, 'Daily Brain Teaser!');
        }
      }
    }
  };

  if (!isOpen) return null;
  handleSubmitRef.current = handleSubmit;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Already completed today
  if (dailyChallenge?.completed && !showResult) {
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
          <div className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-center">
            <Brain className="w-16 h-16 mx-auto mb-3 opacity-80" />
            <h2 className="text-xl font-bold">Already Completed!</h2>
            <p className="text-white/80 mt-1">
              You&apos;ve already solved today&apos;s brain teaser
            </p>
          </div>

          <div className="p-6 text-center">
            <div className="text-4xl font-bold text-neutral-900 mb-2">
              {dailyChallenge.score}%
            </div>
            <div className="text-neutral-500">Your Score</div>

            {dailyChallenge.xpEarned && dailyChallenge.xpEarned > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">+{dailyChallenge.xpEarned} XP earned</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-neutral-100">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Result screen
  if (showResult && result) {
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
          <div
            className={cn(
              'p-6 text-white text-center',
              result.correct
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : 'bg-gradient-to-br from-neutral-600 to-neutral-700'
            )}
          >
            {result.correct ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Trophy className="w-16 h-16 mx-auto text-yellow-300" />
                </motion.div>
                <h2 className="text-2xl font-bold mt-3">Brilliant!</h2>
                <p className="text-white/80 mt-1">You solved the brain teaser!</p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 mx-auto opacity-80" />
                <h2 className="text-2xl font-bold mt-3">Not Quite</h2>
                <p className="text-white/80 mt-1">Better luck tomorrow!</p>
              </>
            )}
          </div>

          {/* Explanation */}
          <div className="p-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Explanation
              </h3>
              <p className="text-blue-800 text-sm">
                {dailyChallenge?.question.explanation}
              </p>
            </div>

            {result.xpEarned > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-6 h-6 text-amber-500" />
                  <span className="text-3xl font-bold text-amber-600">+{result.xpEarned}</span>
                  <span className="text-amber-600 font-medium">XP</span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-4 border-t border-neutral-100">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Question screen
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 z-50"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          {/* Timer */}
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              timeRemaining <= 30 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
            )}
          >
            <Clock className={cn('w-5 h-5', timeRemaining <= 30 && 'animate-pulse')} />
            <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
          </div>

          {/* Hints Used */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 text-white">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">
              {dailyChallenge?.hintsUsed || 0}/3 hints
            </span>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-24 pb-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Title */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 mb-4">
              <Brain className="w-5 h-5" />
              <span className="font-medium">Daily Brain Teaser</span>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-white text-xl font-medium text-center leading-relaxed">
              {dailyChallenge?.question.text}
            </p>
          </div>

          {/* Hint Display */}
          <AnimatePresence>
            {currentHint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-yellow-500/20 rounded-xl p-4 text-yellow-200"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{currentHint}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {dailyChallenge?.question.options?.map((option, index) => (
              <button
                key={option}
                onClick={() => setSelectedAnswer(option)}
                className={cn(
                  'w-full p-4 rounded-xl font-medium text-left transition-all',
                  'border-2',
                  selectedAnswer === option
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                      selectedAnswer === option
                        ? 'bg-primary text-white'
                        : 'bg-white/10'
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleUseHint}
              disabled={(dailyChallenge?.hintsUsed || 0) >= 3}
              className={cn(
                'flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                (dailyChallenge?.hintsUsed || 0) >= 3
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
              )}
            >
              <HelpCircle className="w-5 h-5" />
              Use Hint (-25 XP)
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className={cn(
                'flex-1 py-3 rounded-xl font-semibold transition-all',
                selectedAnswer
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/30'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              )}
            >
              Submit Answer
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
