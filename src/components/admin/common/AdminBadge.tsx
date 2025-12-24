import { ReactNode } from 'react';
import { cn } from '@/utils';

type BadgeVariant = 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'neutral';

interface AdminBadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  cyan: 'admin-badge-cyan',
  blue: 'admin-badge-blue',
  emerald: 'admin-badge-emerald',
  amber: 'admin-badge-amber',
  rose: 'admin-badge-rose',
  purple: 'admin-badge-purple',
  neutral: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

const dotColors: Record<BadgeVariant, string> = {
  cyan: 'bg-cyan-400',
  blue: 'bg-blue-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  purple: 'bg-purple-400',
  neutral: 'bg-slate-400',
};

export function AdminBadge({
  variant = 'cyan',
  children,
  className,
  dot = false,
  pulse = false,
}: AdminBadgeProps) {
  return (
    <span className={cn('admin-badge', variantStyles[variant], className)}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            dotColors[variant],
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
}

// Predefined status badges
export function StatusBadge({ status }: { status: 'active' | 'inactive' | 'pending' | 'error' }) {
  const config = {
    active: { variant: 'emerald' as const, label: 'Active', dot: true, pulse: false },
    inactive: { variant: 'neutral' as const, label: 'Inactive', dot: true, pulse: false },
    pending: { variant: 'amber' as const, label: 'Pending', dot: true, pulse: true },
    error: { variant: 'rose' as const, label: 'Error', dot: true, pulse: false },
  };

  const { variant, label, dot, pulse } = config[status];

  return (
    <AdminBadge variant={variant} dot={dot} pulse={pulse}>
      {label}
    </AdminBadge>
  );
}

// Role badges
export function RoleBadge({ role }: { role: 'admin' | 'teacher' | 'student' | 'parent' }) {
  const config = {
    admin: { variant: 'purple' as const, label: 'Admin' },
    teacher: { variant: 'emerald' as const, label: 'Teacher' },
    student: { variant: 'blue' as const, label: 'Student' },
    parent: { variant: 'amber' as const, label: 'Parent' },
  };

  const { variant, label } = config[role];

  return <AdminBadge variant={variant}>{label}</AdminBadge>;
}
