import { useState, useRef, useEffect } from 'react';
import { Send, X, Smile } from 'lucide-react';
import { useChatStore } from '@/stores';
import { cn } from '@/utils';

const EMOJI_LIST = ['😀', '😂', '❤️', '👍', '🙏', '🎉', '🔥', '💯', '✨', '🤔', '😊', '👏'];

export function ChatInput() {
  const { sendMessage, replyingTo, setReplyingTo, isSendingMessage } = useChatStore();
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  const handleSend = () => {
    if (!message.trim() || isSendingMessage) return;
    sendMessage(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  return (
    <div className="p-3 border-t border-neutral-200 shrink-0">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center justify-between gap-2 mb-2 p-2 bg-neutral-100 rounded-lg">
          <div className="min-w-0">
            <p className="text-xs text-primary font-medium">
              Replying to {replyingTo.sender?.name}
            </p>
            <p className="text-xs text-neutral-500 truncate">{replyingTo.content}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Emoji picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Smile className="w-5 h-5 text-neutral-500" />
          </button>

          {showEmoji && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-lg border border-neutral-200 grid grid-cols-6 gap-1">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 bg-neutral-100 rounded-2xl resize-none',
              'text-sm placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'max-h-32'
            )}
            style={{
              height: 'auto',
              minHeight: '40px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSendingMessage}
          className={cn(
            'p-2.5 rounded-full transition-all',
            message.trim()
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-neutral-100 text-neutral-400'
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
