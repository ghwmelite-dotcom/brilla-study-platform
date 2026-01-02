import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  Flame,
  Star,
  CheckCircle,
  Award,
  Flag,
  Activity,
  RefreshCw,
  ChevronDown,
  Users,
  Globe,
} from 'lucide-react';
import { cn } from '@/utils';
import { Card, Button } from '@/components/common';
import {
  useActivityFeedStore,
  type ActivityItem,
  type ActivityType,
  getActivityMessage,
  getRelativeTime,
} from '@/stores/activityFeedStore';

// Icon mapping
const activityIcons: Record<ActivityType | string, React.ComponentType<{ className?: string }>> = {
  achievement: Trophy,
  level_up: TrendingUp,
  streak: Flame,
  battle_win: Trophy, // Swords fallback
  high_score: Star,
  quiz_complete: CheckCircle,
  subject_mastery: Award,
  milestone: Flag,
  default: Activity,
};

// Colors for activity types
const activityColors: Record<ActivityType, { bg: string; text: string; icon: string }> = {
  achievement: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
  level_up: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
  streak: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
  battle_win: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
  high_score: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
  quiz_complete: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
  subject_mastery: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-500' },
  milestone: { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-500' },
};

interface ActivityFeedProps {
  type?: 'all' | 'friends' | 'global';
  maxItems?: number;
  showHeader?: boolean;
  showLoadMore?: boolean;
  className?: string;
}

export function ActivityFeed({
  type = 'all',
  maxItems,
  showHeader = true,
  showLoadMore = true,
  className,
}: ActivityFeedProps) {
  const {
    feedItems,
    friendActivities,
    globalActivities,
    isLoading,
    hasMore,
    fetchFeed,
    fetchFriendActivities,
    fetchGlobalActivities,
    loadMore,
    refreshFeed,
  } = useActivityFeedStore();

  useEffect(() => {
    if (type === 'friends') {
      fetchFriendActivities();
    } else if (type === 'global') {
      fetchGlobalActivities();
    } else {
      fetchFeed();
    }
  }, [type, fetchFeed, fetchFriendActivities, fetchGlobalActivities]);

  const activities = type === 'friends'
    ? friendActivities
    : type === 'global'
    ? globalActivities
    : feedItems;

  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {showHeader && (
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                {type === 'friends' ? (
                  <Users className="w-5 h-5 text-primary" />
                ) : (
                  <Globe className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">
                  {type === 'friends' ? 'Friend Activity' : 'Activity Feed'}
                </h3>
                <p className="text-sm text-neutral-500">
                  {type === 'friends'
                    ? 'See what your friends are up to'
                    : 'Recent achievements & updates'}
                </p>
              </div>
            </div>

            <button
              onClick={refreshFeed}
              disabled={isLoading}
              className={cn(
                'p-2 rounded-lg hover:bg-neutral-100 transition-colors',
                isLoading && 'animate-spin'
              )}
            >
              <RefreshCw className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-neutral-50">
        <AnimatePresence mode="popLayout">
          {displayedActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <ActivityItemCard activity={activity} />
            </motion.div>
          ))}
        </AnimatePresence>

        {displayedActivities.length === 0 && !isLoading && (
          <div className="p-8 text-center text-neutral-400">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No activities yet</p>
          </div>
        )}

        {isLoading && displayedActivities.length === 0 && (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 text-neutral-300 animate-spin" />
            <p className="text-neutral-400">Loading activities...</p>
          </div>
        )}
      </div>

      {showLoadMore && hasMore && displayedActivities.length > 0 && (
        <div className="p-4 border-t border-neutral-100">
          <Button
            variant="outline"
            fullWidth
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

// Individual activity item
function ActivityItemCard({ activity }: { activity: ActivityItem }) {
  const colors = activityColors[activity.activityType];
  const Icon = activityIcons[activity.activityType] || activityIcons.default;
  const message = getActivityMessage(activity);
  const timeAgo = getRelativeTime(activity.createdAt);

  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {activity.userName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          {/* Activity type badge */}
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center',
              colors.bg,
              'border-2 border-white'
            )}
          >
            <Icon className={cn('w-3 h-3', colors.icon)} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-700">
            <span className="font-semibold">{activity.userName}</span>
            {' '}
            {message.replace(activity.userName, '').trim()}
          </p>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {activity.metadata.xpEarned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
                +{activity.metadata.xpEarned} XP
              </span>
            )}

            {activity.metadata.achievementRarity && (
              <RarityBadge rarity={activity.metadata.achievementRarity} />
            )}

            {activity.metadata.percentage && activity.metadata.percentage >= 90 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                <Star className="w-3 h-3" />
                Excellent!
              </span>
            )}
          </div>
        </div>

        {/* Time */}
        <span className="text-xs text-neutral-400 whitespace-nowrap">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}

// Rarity badge component
function RarityBadge({ rarity }: { rarity: 'common' | 'rare' | 'epic' | 'legendary' }) {
  const rarityStyles = {
    common: 'bg-neutral-100 text-neutral-600',
    rare: 'bg-blue-50 text-blue-600',
    epic: 'bg-purple-50 text-purple-600',
    legendary: 'bg-amber-50 text-amber-600',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
      rarityStyles[rarity]
    )}>
      {rarity}
    </span>
  );
}

// Compact feed for widgets
interface CompactActivityFeedProps {
  activities?: ActivityItem[];
  maxItems?: number;
  onViewAll?: () => void;
}

export function CompactActivityFeed({
  activities: propActivities,
  maxItems = 3,
  onViewAll,
}: CompactActivityFeedProps) {
  const { friendActivities, fetchFriendActivities } = useActivityFeedStore();

  useEffect(() => {
    if (!propActivities) {
      fetchFriendActivities();
    }
  }, [propActivities, fetchFriendActivities]);

  const activities = (propActivities || friendActivities).slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-400 text-sm">
        No recent activity from friends
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <CompactActivityItem key={activity.id} activity={activity} />
      ))}

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full text-center text-sm text-primary hover:text-primary-dark font-medium py-2"
        >
          View all activity →
        </button>
      )}
    </div>
  );
}

function CompactActivityItem({ activity }: { activity: ActivityItem }) {
  const colors = activityColors[activity.activityType];
  const Icon = activityIcons[activity.activityType] || activityIcons.default;
  const timeAgo = getRelativeTime(activity.createdAt);

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
        <Icon className={cn('w-4 h-4', colors.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-700 truncate">
          <span className="font-medium">{activity.userName}</span>
          {' '}
          {getActivityMessage(activity).replace(activity.userName, '').trim().slice(0, 30)}...
        </p>
        <p className="text-xs text-neutral-400">{timeAgo}</p>
      </div>
    </div>
  );
}
