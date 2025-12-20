import { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types';
import { ChatMessage } from './ChatMessage';

interface ChatMessageListProps {
  messages: ChatMessageType[];
  currentUserId?: string;
}

export function ChatMessageList({ messages, currentUserId }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="w-12 h-12 text-neutral-300 mb-3" />
        <p className="text-neutral-500 text-sm">No messages yet</p>
        <p className="text-neutral-400 text-xs mt-1">Be the first to send a message!</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date separator */}
          <div className="flex items-center justify-center mb-4">
            <span className="px-3 py-1 bg-neutral-100 text-neutral-500 text-xs rounded-full">
              {date}
            </span>
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {dateMessages.map((message, index) => {
              const prevMessage = index > 0 ? dateMessages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === currentUserId}
                  showAvatar={showAvatar}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

function groupMessagesByDate(messages: ChatMessageType[]): Record<string, ChatMessageType[]> {
  const groups: Record<string, ChatMessageType[]> = {};

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey: string;

    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });

  return groups;
}
