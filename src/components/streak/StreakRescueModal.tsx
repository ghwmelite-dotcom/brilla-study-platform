import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Shield,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/common';
import { useStreakStore } from '@/stores/streakStore';

interface StreakRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StreakRescueModal({ isOpen, onClose }: StreakRescueModalProps) {
  const {
    streakInfo,
    streakRescue,
    hoursUntilStreakEnds,
    useStreakRescue: rescueStreak,
  } = useStreakStore();

  const [isRescuing, setIsRescuing] = useState(false);
  const [rescued, setRescued] = useState(false);

  const handleRescue = async () => {
    setIsRescuing(true);
    const success = await rescueStreak();
    setIsRescuing(false);

    if (success) {
      setRescued(true);
      setTimeout(() => {
        setRescued(false);
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  const canRescue = streakRescue.available &&
    (!streakRescue.cooldownUntil || new Date(streakRescue.cooldownUntil) <= new Date()) &&
    streakRescue.rescuesUsedThisMonth < streakRescue.maxRescuesPerMonth;

  // Success state
  if (rescued) {
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
          <div className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <CheckCircle2 className="w-20 h-20 mx-auto" />
            </motion.div>
            <h2 className="text-2xl font-bold mt-4">Streak Rescued!</h2>
            <p className="text-white/80 mt-2">
              Your {streakInfo?.currentStreak}-day streak has been saved!
            </p>
          </div>

          <div className="p-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600"
            >
              <Flame className="w-5 h-5" />
              <span className="font-semibold">{streakInfo?.currentStreak} Day Streak</span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Streak at Risk!</h3>
                <p className="text-white/70 text-sm">
                  {hoursUntilStreakEnds?.toFixed(1)}h remaining
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Streak */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-100 mb-3">
              <Flame className="w-12 h-12 text-orange-500" />
            </div>
            <div className="text-4xl font-bold text-neutral-900">
              {streakInfo?.currentStreak || 0}
            </div>
            <div className="text-neutral-500">Day Streak</div>
          </div>

          {/* Warning Message */}
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">
                  Your streak will reset at midnight!
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Practice now or use a Streak Rescue to save your progress.
                </p>
              </div>
            </div>
          </div>

          {/* Rescue Option */}
          {canRescue ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-900">Streak Rescue</h4>
                  <p className="text-sm text-neutral-600 mt-1">
                    Use a rescue to save your streak without practicing today.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {streakRescue.maxRescuesPerMonth - streakRescue.rescuesUsedThisMonth} left this month
                    </span>
                    <span>•</span>
                    <span>7-day cooldown</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-3 text-neutral-500">
                <Shield className="w-5 h-5" />
                <span className="text-sm">
                  {streakRescue.cooldownUntil && new Date(streakRescue.cooldownUntil) > new Date()
                    ? `Rescue available in ${Math.ceil(
                        (new Date(streakRescue.cooldownUntil).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )} days`
                    : 'No rescues available this month'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-neutral-100 flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
          >
            Practice Instead
          </Button>
          <Button
            fullWidth
            onClick={handleRescue}
            disabled={!canRescue || isRescuing}
            className={cn(
              'bg-gradient-to-r from-purple-500 to-indigo-600',
              (!canRescue || isRescuing) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isRescuing ? 'Rescuing...' : 'Use Rescue'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
