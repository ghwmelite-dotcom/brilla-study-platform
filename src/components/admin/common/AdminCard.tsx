import { ReactNode } from 'react';
import { cn } from '@/utils';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function AdminCard({
  children,
  className,
  hover = false,
  glow = false,
  padding = 'md',
}: AdminCardProps) {
  return (
    <div
      className={cn(
        'admin-card',
        paddingStyles[padding],
        hover && 'admin-card-hover cursor-pointer',
        glow && 'admin-card-glow',
        className
      )}
    >
      {children}
    </div>
  );
}

interface AdminCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function AdminCardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: AdminCardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-admin-bg-tertiary flex items-center justify-center text-admin-accent-cyan">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-admin-text">{title}</h3>
          {subtitle && (
            <p className="text-sm text-admin-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
