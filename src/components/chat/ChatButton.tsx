import { MessageCircle } from 'lucide-react';
import { useChatStore, useAuthStore } from '@/stores';
import { cn } from '@/utils';

export function ChatButton() {
  const { isAuthenticated } = useAuthStore();
  const { isChatOpen, toggleChat, getUnreadCount } = useChatStore();
  const unreadCount = getUnreadCount();

  if (!isAuthenticated || isChatOpen) return null;

  return (
    <button
      onClick={toggleChat}
      className={cn(
        'fixed bottom-20 left-4 lg:bottom-6 lg:left-6 z-[60]',
        'w-14 h-14 rounded-full',
        'bg-gradient-to-br from-secondary to-accent',
        'shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'group'
      )}
      aria-label="Open community chat"
    >
      <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Tooltip */}
      <span className="absolute left-full ml-3 px-3 py-1.5 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Community Chat
      </span>

      {/* Pulse effect */}
      <span className="absolute inset-0 rounded-full bg-secondary animate-ping opacity-20" />
    </button>
  );
}
