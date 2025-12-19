import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-dark',
  secondary: 'bg-secondary-100 text-secondary-dark',
  accent: 'bg-accent-100 text-accent-dark',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  neutral: 'bg-neutral-100 text-neutral-700',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-base',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary-dark',
  accent: 'bg-accent',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  neutral: 'bg-neutral-500',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size = 'md', dot = false, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
            aria-hidden="true"
          />
        )}
        {icon && <span className="w-3.5 h-3.5">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Difficulty Badge
interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  size?: BadgeSize;
}

export function DifficultyBadge({ difficulty, size = 'sm' }: DifficultyBadgeProps) {
  const variants: Record<string, BadgeVariant> = {
    easy: 'success',
    medium: 'warning',
    hard: 'accent',
    expert: 'error',
  };

  return (
    <Badge variant={variants[difficulty]} size={size}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  );
}

// Subject Badge
interface SubjectBadgeProps {
  subject: string;
  size?: BadgeSize;
}

export function SubjectBadge({ subject, size = 'sm' }: SubjectBadgeProps) {
  const subjects: Record<string, BadgeVariant> = {
    mathematics: 'primary',
    physics: 'accent',
    chemistry: 'success',
    biology: 'warning',
  };

  const variant = subjects[subject.toLowerCase()] || 'neutral';

  return (
    <Badge variant={variant} size={size}>
      {subject}
    </Badge>
  );
}

// Score Badge
interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
  size?: BadgeSize;
}

export function ScoreBadge({ score, maxScore, size = 'md' }: ScoreBadgeProps) {
  let variant: BadgeVariant = 'neutral';

  if (maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) variant = 'success';
    else if (percentage >= 60) variant = 'warning';
    else variant = 'error';
  } else {
    if (score > 0) variant = 'success';
    else if (score < 0) variant = 'error';
  }

  return (
    <Badge variant={variant} size={size}>
      {score > 0 ? `+${score}` : score}
      {maxScore && ` / ${maxScore}`}
    </Badge>
  );
}

// Streak Badge
interface StreakBadgeProps {
  days: number;
  size?: BadgeSize;
}

export function StreakBadge({ days, size = 'md' }: StreakBadgeProps) {
  let variant: BadgeVariant = 'neutral';

  if (days >= 30) variant = 'accent';
  else if (days >= 7) variant = 'success';
  else if (days >= 3) variant = 'warning';

  return (
    <Badge variant={variant} size={size} dot>
      {days} day{days !== 1 ? 's' : ''} streak
    </Badge>
  );
}
