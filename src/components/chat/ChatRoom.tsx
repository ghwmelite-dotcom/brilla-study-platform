import { ArrowLeft, MoreVertical, Hash, Lock, User } from 'lucide-react';
import { useChatStore, useAuthStore } from '@/stores';
import { cn } from '@/utils';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ChatTypingIndicator } from './ChatTypingIndicator';

export function ChatRoom() {
  const { user } = useAuthStore();
  const {
    rooms,
    activeRoomId,
    setActiveRoom,
    messagesByRoom,
    typingUsers,
    isLoadingMessages,
  } = useChatStore();

  const room = rooms.find((r) => r.id === activeRoomId);
  const messages = activeRoomId ? messagesByRoom[activeRoomId] || [] : [];

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        Room not found
      </div>
    );
  }

  const getRoomIcon = () => {
    switch (room.type) {
      case 'dm':
        return <User className="w-5 h-5" />;
      case 'private':
        return <Lock className="w-5 h-5" />;
      case 'subject':
      case 'public':
      default:
        return <Hash className="w-5 h-5" />;
    }
  };

  const getRoomName = () => {
    if (room.type === 'dm' && room.otherUser) {
      return room.otherUser.name;
    }
    return room.name || 'Unnamed Room';
  };

  const getSubtext = () => {
    if (room.type === 'dm' && room.otherUser) {
      return room.otherUser.isOnline ? 'Online' : 'Offline';
    }
    return `${room.memberCount || 0} members`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Room header */}
      <div className="flex items-center gap-3 p-3 border-b border-neutral-200 shrink-0">
        <button
          onClick={() => setActiveRoom(null)}
          className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>

        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            room.type === 'dm' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-500'
          )}
        >
          {room.type === 'dm' && room.otherUser ? (
            room.otherUser.avatarUrl ? (
              <img
                src={room.otherUser.avatarUrl}
                alt={room.otherUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="font-semibold">
                {room.otherUser.name.charAt(0).toUpperCase()}
              </span>
            )
          ) : (
            getRoomIcon()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-neutral-900 truncate">{getRoomName()}</h4>
          <p className="text-xs text-neutral-500">{getSubtext()}</p>
        </div>

        <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <ChatMessageList messages={messages} currentUserId={user?.id} />
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && <ChatTypingIndicator users={typingUsers} />}

      {/* Input */}
      <ChatInput />
    </div>
  );
}
