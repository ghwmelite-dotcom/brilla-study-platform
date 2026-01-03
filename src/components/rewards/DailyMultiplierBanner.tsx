import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Clock, ChevronRight, X } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/common';
import { useRewardStore, type DailyMultiplier } from '@/stores/rewardStore';

interface DailyMultiplierBannerProps {
  className?: string;
  compact?: boolean;
  onClaim?: (multiplier: DailyMultiplier) => void;
}

export function DailyMultiplierBanner({
  className,
  compact = false,
  onClaim,
}: DailyMultiplierBannerProps) {
  const { dailyMultiplier, fetchDailyMultiplier, claimDailyMultiplier } = useRewardStore();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchDailyMultiplier();
  }, [fetchDailyMultiplier]);

  // Update countdown timer
  useEffect(() => {
    if (!dailyMultiplier) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(dailyMultiplier.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dailyMultiplier]);

  const handleClaim = async () => {
    const claimed = await claimDailyMultiplier();
    if (claimed) {
      onClaim?.(claimed);
    }
  };

  if (!dailyMultiplier || isDismissed) return null;

  const isClaimed = !!dailyMultiplier.claimedAt;
  const isExpired = new Date(dailyMultiplier.expiresAt) < new Date();

  if (isExpired) return null;

  const getMultiplierColor = (mult: number) => {
    if (mult >= 10) return 'from-amber-500 via-orange-500 to-red-500';
    if (mult >= 5) return 'from-purple-500 via-pink-500 to-red-500';
    if (mult >= 3) return 'from-blue-500 via-purple-500 to-pink-500';
    return 'from-emerald-500 via-teal-500 to-cyan-500';
  };

  const getAppliesText = () => {
    if (dailyMultiplier.appliesTo === 'all') return 'all activities';
    if (dailyMultiplier.appliesTo === 'subject') return dailyMultiplier.targetName || 'a subject';
    if (dailyMultiplier.appliesTo === 'battles') return 'battles';
    return 'quizzes';
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
          isClaimed
            ? 'bg-neutral-100 text-neutral-600'
            : `bg-gradient-to-r ${getMultiplierColor(dailyMultiplier.multiplier)} text-white`,
          className
        )}
      >
        <Zap className="w-4 h-4" />
        <span className="font-bold">{dailyMultiplier.multiplier}x</span>
        {!isClaimed && (
          <>
            <span className="text-white/80">•</span>
            <span className="text-white/80">{timeRemaining}</span>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'relative overflow-hidden rounded-xl',
          `bg-gradient-to-r ${getMultiplierColor(dailyMultiplier.multiplier)}`,
          className
        )}
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"
          />
        </div>

        <div className="relative p-4 sm:p-6">
          {/* Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 text-white/80 hover:bg-white/30"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Multiplier Badge */}
            <motion.div
              animate={!isClaimed ? { scale: [1, 1.1, 1] } : undefined}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-3xl font-black text-white">
                  {dailyMultiplier.multiplier}x
                </span>
              </div>
            </motion.div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">
                  {isClaimed ? 'Multiplier Active!' : 'Daily XP Multiplier'}
                </h3>
              </div>

              <p className="text-white/80 text-sm">
                {isClaimed
                  ? `Earning ${dailyMultiplier.multiplier}x XP on ${getAppliesText()}`
                  : `Get ${dailyMultiplier.multiplier}x XP on ${getAppliesText()} today!`}
              </p>

              {/* Timer */}
              <div className="flex items-center gap-1.5 mt-2 text-white/70 text-sm">
                <Clock className="w-4 h-4" />
                <span>Expires in {timeRemaining}</span>
              </div>
            </div>

            {/* Action */}
            {!isClaimed && (
              <Button
                onClick={handleClaim}
                variant="secondary"
                className="!bg-white !text-neutral-900 hover:!bg-white/90 shadow-lg"
              >
                Claim Now
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DailyMultiplierBanner;
