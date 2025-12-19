import { useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { cn, formatTime } from '@/utils';

interface TimerProps {
  duration: number;
  remaining: number;
  isRunning: boolean;
  onTick: () => void;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'circular';
  className?: string;
}

const sizeStyles = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export function Timer({
  duration,
  remaining,
  isRunning,
  onTick,
  onComplete,
  size = 'md',
  showIcon = true,
  variant = 'default',
  className,
}: TimerProps) {
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      onTick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTick]);

  useEffect(() => {
    if (remaining === 0 && onComplete) {
      onComplete();
    }
  }, [remaining, onComplete]);

  const percentage = (remaining / duration) * 100;
  const isWarning = percentage <= 25;
  const isDanger = percentage <= 10;

  const getColor = () => {
    if (isDanger) return 'text-red-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-primary';
  };

  if (variant === 'circular') {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            className="text-neutral-200"
            strokeWidth="6"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="48"
            cy="48"
          />
          <circle
            className={cn('transition-all duration-300', getColor())}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="48"
            cy="48"
          />
        </svg>
        <span
          className={cn(
            'absolute font-bold font-display',
            sizeStyles[size],
            getColor(),
            isDanger && isRunning && 'animate-pulse'
          )}
        >
          {remaining}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100',
        className
      )}
    >
      {showIcon && (
        <Clock
          className={cn(
            'w-5 h-5',
            getColor(),
            isDanger && isRunning && 'animate-pulse'
          )}
        />
      )}
      <span
        className={cn(
          'font-bold font-display tabular-nums',
          sizeStyles[size],
          getColor(),
          isDanger && isRunning && 'animate-pulse'
        )}
      >
        {formatTime(remaining)}
      </span>
    </div>
  );
}

// Countdown Timer Hook
export function useCountdown(
  initialTime: number,
  onComplete?: () => void
): {
  time: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setTime: (time: number) => void;
} {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || time <= 0) return;

    const interval = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, time, onComplete]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setTime(initialTime);
    setIsRunning(false);
  }, [initialTime]);

  return { time, isRunning, start, pause, reset, setTime };
}

// Need to import useState
import { useState } from 'react';
