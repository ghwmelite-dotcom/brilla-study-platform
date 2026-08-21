import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/utils';
import { Hash, Lock, User, Users } from 'lucide-react';
import type { ChatRoom, ChatRoomType } from '@/types';

interface ChatRoomListProps {
  type: ChatRoomType | 'all';
}

export function ChatRoomList({ type }: ChatRoomListProps) {
  const { getRoomsByType, setActiveRoom, isLoadingRooms } = useChatStore();
  const rooms = getRoomsByType(type);

  if (isLoadingRooms) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Users className="w-12 h-12 text-neutral-300 mb-3" />
        <p className="text-neutral-500 text-sm">
          {type === 'all'
            ? 'No conversations yet'
            : type === 'public'
            ? 'No public rooms found'
            : 'No rooms found'}
        </p>
        <p className="text-neutral-400 text-xs mt-1">
          Start a conversation or join a room
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100">
      {rooms.map((room) => (
        <ChatRoomItem key={room.id} room={room} onClick={() => setActiveRoom(room.id)} />
      ))}
    </div>
  );
}

interface ChatRoomItemProps {
  room: ChatRoom;
  onClick: () => void;
}

function ChatRoomItem({ room, onClick }: ChatRoomItemProps) {
  const getRoomIcon = () => {
    switch (room.type) {
      case 'dm':
        return <User className="w-5 h-5 text-neutral-500" />;
      case 'private':
        return <Lock className="w-5 h-5 text-neutral-500" />;
      case 'subject':
      case 'public':
      default:
        return <Hash className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getRoomName = () => {
    if (room.type === 'dm' && room.otherUser) {
      return room.otherUser.name;
    }
    return room.name || 'Unnamed Room';
  };

  const getSubtext = () => {
    if (room.lastMessage) {
      const senderName = room.lastMessage.sender?.name || 'Someone';
      const content = room.lastMessage.content;
      return `${senderName}: ${content.length > 30 ? content.slice(0, 30) + '...' : content}`;
    }
    if (room.memberCount) {
      return `${room.memberCount} members`;
    }
    return room.description?.slice(0, 40) || 'No messages yet';
  };

  const getAvatarContent = () => {
    if (room.type === 'dm' && room.otherUser) {
      if (room.otherUser.avatarUrl) {
        return (
          <img
            src={room.otherUser.avatarUrl}
            alt={room.otherUser.name}
            className="w-full h-full object-cover"
          />
        );
      }
      return (
        <span className="text-white font-semibold">
          {room.otherUser.name.charAt(0).toUpperCase()}
        </span>
      );
    }
    return getRoomIcon();
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left',
        room.unreadCount && room.unreadCount > 0 ? 'bg-primary/5' : ''
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
          room.type === 'dm' ? 'bg-primary' : 'bg-neutral-100'
        )}
      >
        {getAvatarContent()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn(
            'font-medium text-sm truncate',
            room.unreadCount && room.unreadCount > 0 ? 'text-neutral-900' : 'text-neutral-700'
          )}>
            {getRoomName()}
          </h4>
          {room.lastMessage && (
            <span className="text-xs text-neutral-400 shrink-0">
              {formatTime(room.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className={cn(
          'text-xs truncate mt-0.5',
          room.unreadCount && room.unreadCount > 0 ? 'text-neutral-600 font-medium' : 'text-neutral-500'
        )}>
          {getSubtext()}
        </p>
      </div>

      {/* Unread badge */}
      {room.unreadCount && room.unreadCount > 0 && (
        <span className="min-w-[20px] h-5 px-1.5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
          {room.unreadCount > 99 ? '99+' : room.unreadCount}
        </span>
      )}
    </button>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 24 hours
  if (diff < 86400000) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // Less than 7 days
  if (diff < 604800000) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // Older
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
