import { Target, TrendingUp, Calendar, Zap } from 'lucide-react';
import { cn } from '@/utils';

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly';
  icon: 'target' | 'questions' | 'streak' | 'xp';
  color: string;
}

interface GoalProgressProps {
  goals?: Goal[];
}

const defaultGoals: Goal[] = [
  {
    id: 'daily-questions',
    title: 'Daily Questions',
    current: 15,
    target: 25,
    unit: 'questions',
    period: 'daily',
    icon: 'questions',
    color: '#3B82F6',
  },
  {
    id: 'weekly-xp',
    title: 'Weekly XP',
    current: 1250,
    target: 2000,
    unit: 'XP',
    period: 'weekly',
    icon: 'xp',
    color: '#8B5CF6',
  },
  {
    id: 'streak-goal',
    title: 'Streak Goal',
    current: 7,
    target: 30,
    unit: 'days',
    period: 'monthly',
    icon: 'streak',
    color: '#F59E0B',
  },
  {
    id: 'accuracy-goal',
    title: 'Accuracy Target',
    current: 75,
    target: 85,
    unit: '%',
    period: 'weekly',
    icon: 'target',
    color: '#22C55E',
  },
];

const iconMap = {
  target: Target,
  questions: Calendar,
  streak: TrendingUp,
  xp: Zap,
};

export function GoalProgress({ goals = defaultGoals }: GoalProgressProps) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Study Goals</h3>
          <p className="text-sm text-neutral-500">Track your progress towards goals</p>
        </div>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const Icon = iconMap[goal.icon];
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          const isCompleted = goal.current >= goal.target;

          return (
            <div key={goal.id} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105',
                      isCompleted ? 'bg-green-100' : 'bg-opacity-10'
                    )}
                    style={{ backgroundColor: isCompleted ? undefined : `${goal.color}15` }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: isCompleted ? '#22C55E' : goal.color }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{goal.title}</p>
                    <p className="text-xs text-neutral-500 capitalize">{goal.period} goal</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-900">
                    {goal.current.toLocaleString()}
                    <span className="text-neutral-400 font-normal">
                      /{goal.target.toLocaleString()} {goal.unit}
                    </span>
                  </p>
                  <p
                    className={cn(
                      'text-xs font-medium',
                      isCompleted ? 'text-green-600' : 'text-neutral-500'
                    )}
                  >
                    {isCompleted ? 'Completed!' : `${Math.round(progress)}% complete`}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isCompleted && 'animate-pulse'
                  )}
                  style={{
                    width: `${progress}%`,
                    backgroundColor: isCompleted ? '#22C55E' : goal.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
