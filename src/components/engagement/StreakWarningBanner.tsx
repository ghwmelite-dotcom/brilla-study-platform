import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, X, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/common';
import { useEngagementStore } from '@/stores/engagementStore';
import { Link } from 'react-router-dom';

interface StreakWarningBannerProps {
  className?: string;
  onDismiss?: () => void;
}

export function StreakWarningBanner({ className, onDismiss }: StreakWarningBannerProps) {
  const { engagementStatus } = useEngagementStore();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!engagementStatus?.streakAtRisk) return;

    const updateTimer = () => {
      const hours = engagementStatus.hoursUntilStreakLost;
      const totalSeconds = hours * 60 * 60;

      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);

      if (h > 0) {
        setTimeRemaining(`${h}h ${m}m`);
      } else {
        setTimeRemaining(`${m}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [engagementStatus]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!engagementStatus?.streakAtRisk || isDismissed) return null;

  const isUrgent = engagementStatus.hoursUntilStreakLost <= 2;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'relative overflow-hidden rounded-xl',
          isUrgent
            ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500'
            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500',
          className
        )}
      >
        {/* Animated flames background */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at bottom, rgba(255,255,255,0.3) 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative p-4 sm:p-5">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 text-white/80 hover:bg-white/30"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <motion.div
              animate={isUrgent ? { scale: [1, 1.2, 1] } : undefined}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                {isUrgent ? (
                  <AlertTriangle className="w-7 h-7 text-white" />
                ) : (
                  <Flame className="w-7 h-7 text-white" />
                )}
              </div>
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">
                  {isUrgent ? '🚨 Urgent: Streak Ending Soon!' : '🔥 Your Streak is at Risk!'}
                </h3>
              </div>

              <p className="text-white/90 text-sm">
                {isUrgent
                  ? 'Complete any activity right now to save your streak!'
                  : 'Don\'t lose your progress! Complete any activity to maintain your streak.'}
              </p>

              {/* Timer */}
              <div className="flex items-center gap-1.5 mt-2 text-white/80 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  {isUrgent ? 'Only ' : ''}{timeRemaining} remaining
                </span>
              </div>
            </div>

            {/* Action */}
            <Link to="/practice">
              <Button
                className={cn(
                  'whitespace-nowrap',
                  isUrgent
                    ? 'bg-white text-red-600 hover:bg-white/90'
                    : 'bg-white text-amber-600 hover:bg-white/90'
                )}
              >
                Save Streak
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Pulsing border for urgency */}
        {isUrgent && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-xl border-2 border-white pointer-events-none"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default StreakWarningBanner;
