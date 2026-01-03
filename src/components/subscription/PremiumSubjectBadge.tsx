/**
 * Premium Subject Badge
 * Shows a lock/premium indicator on subjects that require upgrade
 */

import { Lock, Crown } from 'lucide-react';
import { cn } from '@/utils';

interface PremiumSubjectBadgeProps {
  variant?: 'badge' | 'overlay' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function PremiumSubjectBadge({
  variant = 'badge',
  size = 'sm',
  className,
  showText = true,
}: PremiumSubjectBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (variant === 'icon') {
    return (
      <Lock
        className={cn(
          iconSizes[size],
          'text-neutral-400',
          className
        )}
      />
    );
  }

  if (variant === 'overlay') {
    return (
      <div
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl',
          className
        )}
      >
        <Lock className={cn(iconSizes[size === 'sm' ? 'md' : 'lg'], 'text-white mb-1')} />
        {showText && (
          <span className="text-white text-xs font-medium">Premium</span>
        )}
      </div>
    );
  }

  // Default badge variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 font-medium',
        sizeClasses[size],
        className
      )}
    >
      <Crown className={iconSizes[size]} />
      {showText && <span>Premium</span>}
    </div>
  );
}

/**
 * Wrapper component that adds premium overlay to children if locked
 */
interface PremiumSubjectWrapperProps {
  isLocked: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function PremiumSubjectWrapper({
  isLocked,
  children,
  className,
  onClick,
}: PremiumSubjectWrapperProps) {
  return (
    <div className={cn('relative', className)} onClick={onClick}>
      {children}
      {isLocked && <PremiumSubjectBadge variant="overlay" />}
    </div>
  );
}

export default PremiumSubjectBadge;
