import { Lightbulb, ArrowRight, Clock, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/utils';

interface Recommendation {
  id: string;
  type: 'weakness' | 'streak' | 'revision' | 'challenge';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;
  topicId?: string;
}

interface StudyRecommendationsProps {
  recommendations?: Recommendation[];
  onActionClick?: (recommendation: Recommendation) => void;
}

const defaultRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    type: 'weakness',
    title: 'Focus on Calculus',
    description: 'Your accuracy in Calculus is 45%. Practice more to improve.',
    action: 'Practice Calculus',
    priority: 'high',
    estimatedTime: '15 min',
    topicId: 'top_calc',
  },
  {
    id: 'rec-2',
    type: 'streak',
    title: 'Keep Your Streak Alive!',
    description: "You're on a 7-day streak. Study today to continue!",
    action: 'Start Quick Quiz',
    priority: 'high',
    estimatedTime: '5 min',
  },
  {
    id: 'rec-3',
    type: 'revision',
    title: 'Review Thermodynamics',
    description: "It's been 5 days since you practiced this topic.",
    action: 'Review Now',
    priority: 'medium',
    estimatedTime: '10 min',
    topicId: 'top_thermo',
  },
  {
    id: 'rec-4',
    type: 'challenge',
    title: 'Try a Speed Challenge',
    description: 'Test your quick-thinking with a timed quiz.',
    action: 'Start Challenge',
    priority: 'low',
    estimatedTime: '10 min',
  },
];

const typeStyles = {
  weakness: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: Target,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  streak: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: TrendingUp,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  revision: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Clock,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  challenge: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: Lightbulb,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
};

const priorityBadge = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export function StudyRecommendations({
  recommendations = defaultRecommendations,
  onActionClick,
}: StudyRecommendationsProps) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-neutral-900">
          Personalized Recommendations
        </h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const style = typeStyles[rec.type];
          const Icon = style.icon;

          return (
            <div
              key={rec.id}
              className={cn(
                'p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer',
                style.bg,
                style.border
              )}
              onClick={() => onActionClick?.(rec)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    style.iconBg
                  )}
                >
                  <Icon className={cn('w-5 h-5', style.iconColor)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-neutral-900">{rec.title}</h4>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        priorityBadge[rec.priority]
                      )}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">{rec.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {rec.estimatedTime && (
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Clock className="w-3 h-3" />
                          {rec.estimatedTime}
                        </span>
                      )}
                    </div>
                    <button
                      className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onActionClick?.(rec);
                      }}
                    >
                      {rec.action}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
