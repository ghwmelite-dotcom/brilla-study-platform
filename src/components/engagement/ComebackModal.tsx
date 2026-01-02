import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PartyPopper, Check, Clock, Star, ChevronRight, Gift } from 'lucide-react';
import { cn } from '@/utils';
import { Button, ProgressBar } from '@/components/common';
import { useEngagementStore, type ComebackChallenge } from '@/stores/engagementStore';
import { Link } from 'react-router-dom';

interface ComebackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComebackModal({ isOpen, onClose }: ComebackModalProps) {
  const {
    comebackChallenge,
    acceptComebackChallenge,
    claimComebackReward,
    markComebackModalSeen,
  } = useEngagementStore();

  const [showReward, setShowReward] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!comebackChallenge) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(comebackChallenge.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [comebackChallenge]);

  const handleAccept = async () => {
    await acceptComebackChallenge();
    onClose();
  };

  const handleSkip = () => {
    markComebackModalSeen();
    onClose();
  };

  const handleClaimReward = async () => {
    const xp = await claimComebackReward();
    setEarnedXp(xp);
    setShowReward(true);
  };

  if (!isOpen || !comebackChallenge) return null;

  const completedTasks = comebackChallenge.tasks.filter((t) => t.completed).length;
  const progress = (completedTasks / comebackChallenge.tasks.length) * 100;
  const allCompleted = completedTasks === comebackChallenge.tasks.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {showReward ? (
              // Reward claimed screen
              <RewardScreen xp={earnedXp} onClose={onClose} />
            ) : (
              // Main comeback modal
              <ComebackContent
                challenge={comebackChallenge}
                timeRemaining={timeRemaining}
                progress={progress}
                allCompleted={allCompleted}
                onAccept={handleAccept}
                onSkip={handleSkip}
                onClaim={handleClaimReward}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Main content component
interface ComebackContentProps {
  challenge: ComebackChallenge;
  timeRemaining: string;
  progress: number;
  allCompleted: boolean;
  onAccept: () => void;
  onSkip: () => void;
  onClaim: () => void;
}

function ComebackContent({
  challenge,
  timeRemaining,
  progress,
  allCompleted,
  onAccept,
  onSkip,
  onClaim,
}: ComebackContentProps) {
  return (
    <motion.div
      key="content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-6 text-white text-center">
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <PartyPopper className="w-16 h-16 mx-auto mb-3" />
        </motion.div>

        <h2 className="text-2xl font-bold">{challenge.title}</h2>
        <p className="text-white/80 text-sm mt-1">{challenge.description}</p>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 mt-3 text-white/90">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Expires in {timeRemaining}</span>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-neutral-900">Comeback Tasks</h4>
          <span className="text-sm text-neutral-500">
            {challenge.tasks.filter((t) => t.completed).length}/{challenge.tasks.length} complete
          </span>
        </div>

        <ProgressBar value={progress} className="h-2 mb-4" />

        <div className="space-y-3">
          {challenge.tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'p-4 rounded-xl border-2 transition-all',
                task.completed
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-neutral-50 border-neutral-200'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    task.completed ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-400'
                  )}
                >
                  {task.completed ? <Check className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      'font-medium',
                      task.completed ? 'text-emerald-700' : 'text-neutral-700'
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="text-sm text-neutral-500">{task.description}</p>
                </div>
                <div
                  className={cn(
                    'text-sm font-bold',
                    task.completed ? 'text-emerald-600' : 'text-amber-500'
                  )}
                >
                  +{task.xpReward} XP
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {allCompleted && !challenge.claimed ? (
            <Button fullWidth onClick={onClaim} className="bg-gradient-to-r from-amber-500 to-orange-500">
              <Gift className="w-5 h-5 mr-2" />
              Claim {challenge.xpReward} XP Reward!
            </Button>
          ) : (
            <Link to="/practice" onClick={onAccept}>
              <Button fullWidth>
                Start Learning
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}

          <button
            onClick={onSkip}
            className="w-full text-sm text-neutral-400 hover:text-neutral-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Reward screen component
interface RewardScreenProps {
  xp: number;
  onClose: () => void;
}

function RewardScreen({ xp, onClose }: RewardScreenProps) {
  return (
    <motion.div
      key="reward"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-8 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
        transition={{ duration: 0.8 }}
        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center mb-6"
      >
        <Gift className="w-12 h-12 text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold text-neutral-900 mb-2">Congratulations!</h2>
      <p className="text-neutral-500 mb-6">You've completed the comeback challenge!</p>

      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: 3 }}
        className="text-4xl font-bold text-amber-500 mb-6"
      >
        +{xp} XP
      </motion.div>

      <Button fullWidth onClick={onClose}>
        Continue Learning
      </Button>
    </motion.div>
  );
}

export default ComebackModal;
