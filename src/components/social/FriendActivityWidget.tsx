import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  ChevronRight,
  Trophy,
  TrendingUp,
  Flame,
  Star,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils';
import { Card } from '@/components/common';
import {
  useActivityFeedStore,
  type ActivityItem,
  getActivityMessage,
  getRelativeTime,
} from '@/stores/activityFeedStore';

interface FriendActivityWidgetProps {
  onViewAll?: () => void;
  className?: string;
}

export function FriendActivityWidget({ onViewAll, className }: FriendActivityWidgetProps) {
  const { friendActivities, isLoading, fetchFriendActivities } = useActivityFeedStore();

  useEffect(() => {
    fetchFriendActivities();
  }, [fetchFriendActivities]);

  const topActivities = friendActivities.slice(0, 4);

  // Calculate friend stats
  const stats = calculateFriendStats(friendActivities);

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Friend Activity</h3>
              <p className="text-white/70 text-sm">See what your friends are up to</p>
            </div>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatPill
            icon={Trophy}
            label="Achievements"
            value={stats.achievements}
          />
          <StatPill
            icon={Flame}
            label="On Streak"
            value={stats.streaking}
          />
          <StatPill
            icon={TrendingUp}
            label="Leveled Up"
            value={stats.leveledUp}
          />
        </div>
      </div>

      {/* Activity List */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : topActivities.length > 0 ? (
          <div className="space-y-4">
            {topActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FriendActivityItem activity={activity} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* FOMO message */}
      {friendActivities.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-amber-700">
              Your friends earned{' '}
              <span className="font-bold">
                {stats.totalXP.toLocaleString()} XP
              </span>{' '}
              today!
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// Stat pill component
function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
      <Icon className="w-4 h-4 text-white/70" />
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-white/70">{label}</p>
      </div>
    </div>
  );
}

// Individual activity item
function FriendActivityItem({ activity }: { activity: ActivityItem }) {
  const message = getActivityMessage(activity);
  const timeAgo = getRelativeTime(activity.createdAt);

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    achievement: Trophy,
    level_up: TrendingUp,
    streak: Flame,
    battle_win: Trophy,
    high_score: Star,
    quiz_complete: Star,
    subject_mastery: Trophy,
    milestone: Star,
  };

  const colorMap: Record<string, string> = {
    achievement: 'bg-amber-100 text-amber-600',
    level_up: 'bg-emerald-100 text-emerald-600',
    streak: 'bg-orange-100 text-orange-600',
    battle_win: 'bg-red-100 text-red-600',
    high_score: 'bg-blue-100 text-blue-600',
    quiz_complete: 'bg-purple-100 text-purple-600',
    subject_mastery: 'bg-indigo-100 text-indigo-600',
    milestone: 'bg-pink-100 text-pink-600',
  };

  const Icon = iconMap[activity.activityType] || Star;
  const colors = colorMap[activity.activityType] || 'bg-neutral-100 text-neutral-600';

  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
          {activity.userName.split(' ').map(n => n[0]).join('')}
        </div>
        <div className={cn(
          'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white',
          colors
        )}>
          <Icon className="w-3 h-3" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-700">
          <span className="font-semibold text-neutral-900">{activity.userName}</span>
          {' '}
          {message.replace(activity.userName, '').trim()}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-neutral-400">{timeAgo}</span>
          {activity.metadata.xpEarned && (
            <>
              <span className="text-neutral-300">•</span>
              <span className="text-xs font-medium text-amber-600">
                +{activity.metadata.xpEarned} XP
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-3">
        <Users className="w-8 h-8 text-neutral-400" />
      </div>
      <h4 className="font-medium text-neutral-700">No friend activity yet</h4>
      <p className="text-sm text-neutral-400 mt-1">
        Add friends to see their achievements here!
      </p>
    </div>
  );
}

// Calculate stats from activities
function calculateFriendStats(activities: ActivityItem[]) {
  const today = new Date().toISOString().split('T')[0];
  const todayActivities = activities.filter(a =>
    a.createdAt.startsWith(today)
  );

  return {
    achievements: activities.filter(a => a.activityType === 'achievement').length,
    streaking: activities.filter(a => a.activityType === 'streak').length,
    leveledUp: activities.filter(a => a.activityType === 'level_up').length,
    totalXP: todayActivities.reduce((sum, a) => sum + (a.metadata.xpEarned || 0), 0),
  };
}
