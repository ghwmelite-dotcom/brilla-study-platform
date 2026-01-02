import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils';

interface CountdownTimerProps {
  endDate: string;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  urgentThreshold?: number; // Hours before showing urgent styling
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isUrgent: boolean;
}

export function CountdownTimer({
  endDate,
  onComplete,
  size = 'md',
  showLabels = true,
  urgentThreshold = 24,
  className,
}: CountdownTimerProps) {
  const [time, setTime] = useState<TimeRemaining>(() => calculateTimeRemaining(endDate, urgentThreshold));

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = calculateTimeRemaining(endDate, urgentThreshold);
      setTime(newTime);

      if (newTime.isExpired) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, urgentThreshold, onComplete]);

  const sizeClasses = {
    sm: {
      container: 'gap-1',
      digit: 'w-8 h-8 text-sm',
      label: 'text-[10px]',
      separator: 'text-sm',
    },
    md: {
      container: 'gap-2',
      digit: 'w-12 h-12 text-lg',
      label: 'text-xs',
      separator: 'text-lg',
    },
    lg: {
      container: 'gap-3',
      digit: 'w-16 h-16 text-2xl',
      label: 'text-sm',
      separator: 'text-2xl',
    },
  };

  const sizes = sizeClasses[size];

  if (time.isExpired) {
    return (
      <div className={cn('flex items-center gap-2 text-neutral-500', className)}>
        <Clock className="w-4 h-4" />
        <span>Ended</span>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center', sizes.container, className)}>
      {time.isUrgent && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="mr-2"
        >
          <AlertTriangle className={cn(
            'text-red-500',
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-5 h-5',
            size === 'lg' && 'w-6 h-6'
          )} />
        </motion.div>
      )}

      {time.days > 0 && (
        <>
          <TimeDigit
            value={time.days}
            label="days"
            size={sizes}
            isUrgent={time.isUrgent}
            showLabel={showLabels}
          />
          <span className={cn('font-bold text-neutral-300', sizes.separator)}>:</span>
        </>
      )}

      <TimeDigit
        value={time.hours}
        label="hours"
        size={sizes}
        isUrgent={time.isUrgent}
        showLabel={showLabels}
      />
      <span className={cn('font-bold text-neutral-300', sizes.separator)}>:</span>

      <TimeDigit
        value={time.minutes}
        label="mins"
        size={sizes}
        isUrgent={time.isUrgent}
        showLabel={showLabels}
      />

      {time.days === 0 && (
        <>
          <span className={cn('font-bold text-neutral-300', sizes.separator)}>:</span>
          <TimeDigit
            value={time.seconds}
            label="secs"
            size={sizes}
            isUrgent={time.isUrgent}
            showLabel={showLabels}
          />
        </>
      )}
    </div>
  );
}

function TimeDigit({
  value,
  label,
  size,
  isUrgent,
  showLabel,
}: {
  value: number;
  label: string;
  size: { digit: string; label: string };
  isUrgent: boolean;
  showLabel: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'flex items-center justify-center rounded-lg font-bold',
          size.digit,
          isUrgent
            ? 'bg-red-100 text-red-600'
            : 'bg-neutral-100 text-neutral-700'
        )}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      {showLabel && (
        <span className={cn('mt-1 text-neutral-400 uppercase tracking-wide', size.label)}>
          {label}
        </span>
      )}
    </div>
  );
}

function calculateTimeRemaining(endDate: string, urgentThreshold: number): TimeRemaining {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);

  const isExpired = diff === 0;
  const totalHours = diff / (1000 * 60 * 60);
  const isUrgent = totalHours > 0 && totalHours < urgentThreshold;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired, isUrgent };
}

// Compact countdown for inline use
interface CompactCountdownProps {
  endDate: string;
  prefix?: string;
  className?: string;
}

export function CompactCountdown({ endDate, prefix, className }: CompactCountdownProps) {
  const [time, setTime] = useState<TimeRemaining>(() => calculateTimeRemaining(endDate, 24));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(calculateTimeRemaining(endDate, 24));
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (time.isExpired) {
    return <span className={cn('text-neutral-500', className)}>Ended</span>;
  }

  const timeString = time.days > 0
    ? `${time.days}d ${time.hours}h`
    : time.hours > 0
    ? `${time.hours}h ${time.minutes}m`
    : `${time.minutes}m ${time.seconds}s`;

  return (
    <span className={cn(
      'font-medium',
      time.isUrgent ? 'text-red-600' : 'text-neutral-600',
      className
    )}>
      {prefix}{timeString}
    </span>
  );
}
