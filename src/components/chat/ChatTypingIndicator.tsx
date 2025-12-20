import type { ChatTypingUser } from '@/types';

interface ChatTypingIndicatorProps {
  users: ChatTypingUser[];
}

export function ChatTypingIndicator({ users }: ChatTypingIndicatorProps) {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].name} is typing`;
    }
    if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing`;
    }
    return `${users[0].name} and ${users.length - 1} others are typing`;
  };

  return (
    <div className="px-4 py-2 border-t border-neutral-100">
      <div className="flex items-center gap-2">
        {/* Typing dots animation */}
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-neutral-500">{getTypingText()}</span>
      </div>
    </div>
  );
}
