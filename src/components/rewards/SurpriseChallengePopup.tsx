import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Clock, Target, Trophy } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/common';
import { useRewardStore, type SurpriseChallenge } from '@/stores/rewardStore';

interface SurpriseChallengePopupProps {
  challenge: SurpriseChallenge;
  onAccept?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function SurpriseChallengePopup({
  challenge,
  onAccept,
  onDismiss,
  className,
}: SurpriseChallengePopupProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(challenge.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [challenge.expiresAt]);

  const getRequirementText = () => {
    switch (challenge.requirement.type) {
      case 'quiz':
        return `Complete ${challenge.requirement.target} quizzes`;
      case 'battle':
        return `Win ${challenge.requirement.target} battles`;
      case 'perfect_score':
        return `Get ${challenge.requirement.target} perfect scores`;
      case 'streak':
        return `Maintain your streak`;
      default:
        return 'Complete the challenge';
    }
  };

  if (isExpired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className={cn(
        'fixed bottom-4 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-4 text-white">
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          >
            <Zap className="w-8 h-8 text-yellow-300" />
          </motion.div>
          <div>
            <p className="text-xs text-white/80 font-medium">SURPRISE CHALLENGE!</p>
            <h3 className="font-bold text-lg">{challenge.title}</h3>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-neutral-600 text-sm mb-4">{challenge.description}</p>

        {/* Requirements */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
          <Target className="w-4 h-4" />
          <span>{getRequirementText()}</span>
        </div>

        {/* Reward */}
        <div className="flex items-center gap-2 text-sm text-amber-600 font-medium mb-4">
          <Trophy className="w-4 h-4" />
          <span>{challenge.xpMultiplier}x XP Reward</span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-500">
            Expires in {timeRemaining}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
          >
            Accept Challenge!
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for inline display
interface SurpriseChallengeBarProps {
  challenge: SurpriseChallenge;
  onComplete?: () => void;
  className?: string;
}

export function SurpriseChallengeBar({
  challenge,
  onComplete,
  className,
}: SurpriseChallengeBarProps) {
  const { completeSurpriseChallenge } = useRewardStore();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(challenge.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [challenge.expiresAt]);

  // Simulate progress (in real app, this would come from actual progress)
  useEffect(() => {
    const simulateProgress = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(simulateProgress);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 3000);

    return () => clearInterval(simulateProgress);
  }, []);

  const handleComplete = async () => {
    if (progress >= 100) {
      await completeSurpriseChallenge();
      onComplete?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap className="w-5 h-5 text-amber-500" />
          </motion.div>
          <span className="font-bold text-amber-700">{challenge.title}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-red-500" />
          <span className="font-medium text-red-500">{timeRemaining}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-amber-200 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-amber-600">
        <span>{Math.floor(progress)}% complete</span>
        <span>{challenge.xpMultiplier}x XP bonus</span>
      </div>

      {progress >= 100 && (
        <Button
          size="sm"
          fullWidth
          onClick={handleComplete}
          className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500"
        >
          <Trophy className="w-4 h-4 mr-1" />
          Claim Reward!
        </Button>
      )}
    </motion.div>
  );
}

export default SurpriseChallengePopup;
