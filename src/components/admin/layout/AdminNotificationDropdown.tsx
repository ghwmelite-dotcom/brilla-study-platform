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
  AlertCircle,
} from 'lucide-react';
import { useNotificationStore } from '@/stores';
import type { NotificationType } from '@/stores/notificationStore';
import { cn } from '@/utils';

interface AdminNotificationDropdownProps {
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
  achievement: 'text-yellow-400 bg-yellow-500/20',
  streak: 'text-orange-400 bg-orange-500/20',
  xp: 'text-amber-400 bg-amber-500/20',
  challenge: 'text-red-400 bg-red-500/20',
  content: 'text-blue-400 bg-blue-500/20',
  system: 'text-gray-400 bg-gray-500/20',
  reminder: 'text-purple-400 bg-purple-500/20',
  social: 'text-green-400 bg-green-500/20',
};

export function AdminNotificationDropdown({ isOpen, onClose }: AdminNotificationDropdownProps) {
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
      navigate(notification.link);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-96 bg-admin-bg-secondary rounded-xl shadow-xl border border-admin-border z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-admin-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-admin-accent-cyan" />
            <h3 className="font-semibold text-admin-text">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-admin-accent-rose/20 text-admin-accent-rose rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-sm text-admin-accent-cyan hover:text-admin-accent-cyan/80"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto admin-scrollbar">
          {isLoadingNotifications ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent-cyan" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-admin-border">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                const colorClass = typeColors[notification.type] || typeColors.system;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 p-4 hover:bg-admin-bg-tertiary cursor-pointer relative group transition-colors',
                      !notification.isRead && 'bg-admin-accent-cyan/5'
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
                          notification.isRead ? 'text-admin-text-secondary' : 'text-admin-text font-medium'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-admin-text-muted line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-admin-text-muted mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-admin-accent-cyan rounded-full flex-shrink-0 mt-2" />
                    )}

                    {/* Delete button (on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="absolute right-2 top-2 p-1.5 rounded-full bg-admin-bg-tertiary shadow opacity-0 group-hover:opacity-100 hover:bg-admin-accent-rose/20 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-admin-accent-rose" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-admin-bg-tertiary flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-admin-text-muted" />
              </div>
              <p className="text-admin-text-secondary">No notifications yet</p>
              <p className="text-sm text-admin-text-muted mt-1">
                System alerts will appear here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-admin-border bg-admin-bg-tertiary">
            <button
              onClick={() => {
                navigate('/admin/notifications');
                onClose();
              }}
              className="w-full text-center text-sm text-admin-accent-cyan hover:text-admin-accent-cyan/80 font-medium"
            >
              View all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}
