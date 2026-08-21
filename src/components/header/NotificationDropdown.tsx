import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Trophy,
  Flame,
  Star,
  Swords,
  BookOpen,
  Settings,
  Users,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationType } from '@/stores/notificationStore';
import { cn } from '@/utils';
import { toSafeInternalPath } from '@/utils/navigation';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<NotificationType, React.ElementType> = {
  achievement: Trophy,
  streak: Flame,
  xp: Star,
  challenge: Swords,
  content: BookOpen,
  system: Settings,
  reminder: Bell,
  social: Users,
};

const typeColors: Record<NotificationType, string> = {
  achievement: 'text-yellow-500 bg-yellow-50',
  streak: 'text-orange-500 bg-orange-50',
  xp: 'text-amber-500 bg-amber-50',
  challenge: 'text-red-500 bg-red-50',
  content: 'text-blue-500 bg-blue-50',
  system: 'text-gray-500 bg-gray-50',
  reminder: 'text-purple-500 bg-purple-50',
  social: 'text-green-500 bg-green-50',
};

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  if (!isOpen) return null;

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(toSafeInternalPath(notification.link, '/notifications'));
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-neutral-700" />
            <h3 className="font-semibold text-neutral-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoadingNotifications ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                const colorClass = typeColors[notification.type] || typeColors.system;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 p-4 hover:bg-neutral-50 cursor-pointer relative group',
                      !notification.isRead && 'bg-blue-50/50'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                        colorClass.split(' ')[1]
                      )}
                    >
                      <Icon className={cn('w-5 h-5', colorClass.split(' ')[0])} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm',
                          notification.isRead ? 'text-neutral-700' : 'text-neutral-900 font-medium'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-neutral-500 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}

                    {/* Delete button (on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="absolute right-2 top-2 p-1.5 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Bell className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
              <p className="text-neutral-500">No notifications yet</p>
              <p className="text-sm text-neutral-400 mt-1">
                We'll notify you about important updates
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-neutral-100 bg-neutral-50">
            <button
              onClick={() => {
                navigate('/notifications');
                onClose();
              }}
              className="w-full text-center text-sm text-primary hover:text-primary-dark font-medium"
            >
              View all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}
