import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Flame,
  Award,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Link as LinkIcon,
  UserMinus,
  Filter,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/common';
import { useParentStore, useAuthStore } from '@/stores';
import { cn } from '@/utils';
import type { ParentNotificationType } from '@/types';

// Notification data types
interface LowPerformanceData {
  accuracy: number;
  subject?: string;
}

interface StreakMilestoneData {
  days: number;
}

interface TopicMasteredData {
  topicName: string;
  mastery: number;
}

// Notification icon and color by type
const notificationConfig: Record<ParentNotificationType, { icon: typeof Bell; bgColor: string; iconColor: string }> = {
  achievement_unlocked: { icon: Award, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  streak_milestone: { icon: Flame, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
  topic_mastered: { icon: CheckCircle, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
  low_performance: { icon: AlertCircle, bgColor: 'bg-red-100', iconColor: 'text-red-600' },
  weekly_summary: { icon: BookOpen, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  link_request: { icon: LinkIcon, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  link_confirmed: { icon: LinkIcon, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
  student_opted_out: { icon: UserMinus, bgColor: 'bg-neutral-100', iconColor: 'text-neutral-600' },
};

export function ParentNotificationsPage() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useParentStore();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications(filter === 'unread');
  }, [filter]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    if (filter === 'unread') {
      fetchNotifications(true);
    }
  };

  if (!user || user.role !== 'parent') {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Access denied. Parent account required.</p>
      </div>
    );
  }

  const displayedNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/parent">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900">
              Notifications
            </h1>
            <p className="text-neutral-500">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={handleMarkAllRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-neutral-400" />
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full transition-colors',
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1',
            filter === 'unread'
              ? 'bg-primary text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
        >
          Unread
          {unreadCount > 0 && (
            <span className={cn(
              'px-1.5 py-0.5 text-xs rounded-full',
              filter === 'unread' ? 'bg-white/20' : 'bg-primary text-white'
            )}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {isLoadingNotifications ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : displayedNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications Yet'}
          </h2>
          <p className="text-neutral-500">
            {filter === 'unread'
              ? "You're all caught up! Check back later for new updates."
              : "You'll see notifications here when your ward makes progress."}
          </p>
          {filter === 'unread' && notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setFilter('all')}
            >
              View All Notifications
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => {
            const config = notificationConfig[notification.type] || {
              icon: Bell,
              bgColor: 'bg-neutral-100',
              iconColor: 'text-neutral-600',
            };
            const Icon = config.icon;

            return (
              <Card
                key={notification.id}
                className={cn(
                  'p-4 transition-all cursor-pointer hover:shadow-md',
                  !notification.isRead && 'border-l-4 border-l-primary bg-primary-50/30'
                )}
                onClick={() => {
                  if (!notification.isRead) {
                    markNotificationRead(notification.id);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-full flex-shrink-0', config.bgColor)}>
                    <Icon className={cn('w-5 h-5', config.iconColor)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {notification.title}
                        </h3>
                        {notification.student && (
                          <p className="text-sm text-primary font-medium">
                            {notification.student.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <Badge variant="primary" size="sm">New</Badge>
                        )}
                        <span className="text-xs text-neutral-400">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-1 text-neutral-600">
                      {notification.message}
                    </p>

                    {/* Additional data display based on type */}
                    {notification.type === 'low_performance' && notification.data && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600">
                          Accuracy dropped to {(notification.data as unknown as LowPerformanceData).accuracy}% in{' '}
                          {(notification.data as unknown as LowPerformanceData).subject || 'recent practice'}
                        </p>
                      </div>
                    )}

                    {notification.type === 'streak_milestone' && notification.data && (
                      <div className="mt-2 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-600 font-medium">
                          {(notification.data as unknown as StreakMilestoneData).days}-day streak achieved!
                        </span>
                      </div>
                    )}

                    {notification.type === 'topic_mastered' && notification.data && (
                      <div className="mt-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          Mastered {(notification.data as unknown as TopicMasteredData).topicName} with{' '}
                          {(notification.data as unknown as TopicMasteredData).mastery}% accuracy
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}
