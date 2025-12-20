import { useState } from 'react';
import { Reply, Smile, Trash2, Flag } from 'lucide-react';
import { useChatStore } from '@/stores';
import { cn } from '@/utils';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
  showAvatar: boolean;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function ChatMessage({ message, isOwnMessage, showAvatar }: ChatMessageProps) {
  const { setReplyingTo, addReaction, removeReaction, deleteMessage } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  if (message.isDeleted) {
    return (
      <div
        className={cn(
          'flex items-center gap-3',
          isOwnMessage ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {showAvatar && !isOwnMessage && <div className="w-8 h-8" />}
        <div className="px-4 py-2 bg-neutral-100 rounded-lg text-neutral-400 text-sm italic">
          This message was deleted
        </div>
      </div>
    );
  }

  const handleReaction = (emoji: string) => {
    const reaction = message.reactions?.find((r) => r.emoji === emoji);
    if (reaction?.hasReacted) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
    setShowReactions(false);
  };

  return (
    <div
      className={cn(
        'group flex gap-2',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        !showAvatar && !isOwnMessage && 'ml-10'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          {message.sender?.avatarUrl ? (
            <img
              src={message.sender.avatarUrl}
              alt={message.sender.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-semibold">
              {message.sender?.name?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={cn('max-w-[75%]', isOwnMessage && 'items-end')}>
        {/* Sender name */}
        {showAvatar && !isOwnMessage && (
          <p className="text-xs text-neutral-500 mb-1 ml-1">{message.sender?.name}</p>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={cn(
              'mb-1 px-3 py-1.5 rounded-lg text-xs border-l-2',
              isOwnMessage
                ? 'bg-white/20 border-white/50 text-white/80'
                : 'bg-neutral-100 border-neutral-300 text-neutral-600'
            )}
          >
            <p className="font-medium">{message.replyTo.senderName}</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'px-4 py-2 rounded-2xl relative',
            isOwnMessage
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-neutral-100 text-neutral-900 rounded-tl-sm'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Time and edited indicator */}
          <p
            className={cn(
              'text-[10px] mt-1',
              isOwnMessage ? 'text-white/70' : 'text-neutral-400'
            )}
          >
            {formatTime(message.createdAt)}
            {message.isEdited && ' (edited)'}
          </p>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                  reaction.hasReacted
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div
          className={cn(
            'flex items-center gap-0.5 self-center',
            isOwnMessage ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Quick reaction */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <Smile className="w-4 h-4 text-neutral-400" />
            </button>

            {showReactions && (
              <div
                className={cn(
                  'absolute bottom-full mb-1 flex gap-1 p-2 bg-white rounded-full shadow-lg border border-neutral-200',
                  isOwnMessage ? 'right-0' : 'left-0'
                )}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 rounded-full transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply */}
          <button
            onClick={() => setReplyingTo(message)}
            className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Reply className="w-4 h-4 text-neutral-400" />
          </button>

          {/* More actions */}
          {isOwnMessage && (
            <button
              onClick={() => deleteMessage(message.id)}
              className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <Trash2 className="w-4 h-4 text-neutral-400" />
            </button>
          )}

          {!isOwnMessage && (
            <button className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors">
              <Flag className="w-4 h-4 text-neutral-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
