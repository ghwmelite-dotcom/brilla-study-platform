import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    trend: 'text-green-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    trend: 'text-yellow-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    trend: 'text-red-600',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}: StatsCardProps) {
  const colors = colorClasses[color];

  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
    ? TrendingDown
    : Minus;

  const trendColor = trend?.direction === 'up'
    ? 'text-green-600'
    : trend?.direction === 'down'
    ? 'text-red-600'
    : 'text-neutral-400';

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-neutral-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <div className={colors.icon}>{icon}</div>
          </div>
        )}
      </div>

      {trend && (
        <div className={`flex items-center gap-1 mt-3 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {trend.value}%
            {trend.label && <span className="text-neutral-500 ml-1">{trend.label}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
