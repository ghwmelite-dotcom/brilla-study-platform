import { useEffect, useState } from 'react';
import { Zap, Clock, Sparkles } from 'lucide-react';
import { useXpEventStore } from '@/stores/xpEventStore';

function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function XpEventBanner() {
  const { activeEvents, currentMultiplier, fetchActiveEvents } = useXpEventStore();
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchActiveEvents();

    // Refresh every 5 minutes
    const interval = setInterval(fetchActiveEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchActiveEvents]);

  // Update countdown timer
  useEffect(() => {
    if (activeEvents.length === 0) return;

    const updateTimes = () => {
      const now = Date.now();
      const times: Record<string, number> = {};
      activeEvents.forEach((event) => {
        times[event.id] = Math.max(0, new Date(event.endTime).getTime() - now);
      });
      setTimeRemaining(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000);
    return () => clearInterval(interval);
  }, [activeEvents]);

  if (activeEvents.length === 0 || currentMultiplier <= 1) {
    return null;
  }

  const primaryEvent = activeEvents.find((e) => e.eventType === 'global') || activeEvents[0];

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
      {/* Animated sparkle background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" />
        <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping delay-300" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white/25 rounded-full animate-ping delay-700" />
      </div>

      <div className="relative flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
            <Zap className="w-7 h-7 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium opacity-90">{primaryEvent.name}</span>
            </div>
            <div className="text-2xl font-bold">{currentMultiplier}x XP Active!</div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-sm opacity-80">
            <Clock className="w-4 h-4" />
            <span>Ends in</span>
          </div>
          <div className="text-lg font-bold">
            {formatTimeRemaining(timeRemaining[primaryEvent.id] || 0)}
          </div>
        </div>
      </div>

      {/* Multiple events indicator */}
      {activeEvents.length > 1 && (
        <div className="relative border-t border-white/20 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-80">+{activeEvents.length - 1} more events active</span>
            {activeEvents.slice(1, 3).map((event) => (
              <span
                key={event.id}
                className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium"
              >
                {event.multiplier}x {event.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
