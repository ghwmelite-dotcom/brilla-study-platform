import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Clock,
  Gift,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils';
import { useEventStore, type SeasonalEvent } from '@/stores/eventStore';

interface EventBannerProps {
  onEventClick?: (event: SeasonalEvent) => void;
  className?: string;
}

export function EventBanner({ onEventClick, className }: EventBannerProps) {
  const { activeEvents, fetchActiveEvents, getTimeRemaining, getCurrentXPMultiplier } = useEventStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchActiveEvents();
  }, [fetchActiveEvents]);

  // Auto-rotate events
  useEffect(() => {
    if (activeEvents.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeEvents.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeEvents.length]);

  if (isDismissed || activeEvents.length === 0) return null;

  const currentEvent = activeEvents[currentIndex];
  const timeRemaining = getTimeRemaining(currentEvent.endDate);
  const xpMultiplier = getCurrentXPMultiplier();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentEvent.id}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'relative overflow-hidden rounded-xl',
          className
        )}
        style={{
          background: `linear-gradient(135deg, ${currentEvent.accentColor}20 0%, ${currentEvent.accentColor}40 100%)`,
          borderColor: currentEvent.accentColor,
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
            style={{ backgroundColor: currentEvent.accentColor }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10"
            style={{ backgroundColor: currentEvent.accentColor }}
          />
        </div>

        <div className="relative p-4">
          <div className="flex items-start justify-between">
            {/* Content */}
            <div
              className="flex-1 cursor-pointer"
              onClick={() => onEventClick?.(currentEvent)}
            >
              <div className="flex items-center gap-2 mb-2">
                {/* Event badge */}
                <div
                  className="px-2 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1"
                  style={{ backgroundColor: currentEvent.accentColor }}
                >
                  <Sparkles className="w-3 h-3" />
                  LIVE EVENT
                </div>

                {/* XP Multiplier badge */}
                {xpMultiplier > 1 && (
                  <div className="px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {xpMultiplier}x XP
                  </div>
                )}
              </div>

              <h3 className="font-bold text-lg text-neutral-900 mb-1">
                {currentEvent.name}
              </h3>

              <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                {currentEvent.description}
              </p>

              {/* Time remaining */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Clock className="w-4 h-4" />
                  <span>
                    {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                    {timeRemaining.hours}h {timeRemaining.minutes}m left
                  </span>
                </div>

                {/* Rewards preview */}
                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Gift className="w-4 h-4" />
                  <span>{currentEvent.rewards.length} rewards</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>

              <button
                onClick={() => onEventClick?.(currentEvent)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: currentEvent.accentColor }}
              >
                View Event
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Event indicator dots */}
          {activeEvents.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {activeEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    index === currentIndex
                      ? 'w-6'
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  )}
                  style={{
                    backgroundColor: index === currentIndex ? currentEvent.accentColor : undefined,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact version for mobile or sidebar
export function CompactEventBanner({ onEventClick }: EventBannerProps) {
  const { activeEvents, fetchActiveEvents, getCurrentXPMultiplier } = useEventStore();

  useEffect(() => {
    fetchActiveEvents();
  }, [fetchActiveEvents]);

  if (activeEvents.length === 0) return null;

  const xpMultiplier = getCurrentXPMultiplier();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900 text-sm">
              {activeEvents.length} Active Event{activeEvents.length > 1 ? 's' : ''}
            </p>
            {xpMultiplier > 1 && (
              <p className="text-xs text-amber-600 font-medium">
                {xpMultiplier}x XP Active!
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => onEventClick?.(activeEvents[0])}
          className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
