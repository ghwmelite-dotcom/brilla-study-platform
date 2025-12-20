import { useState, useEffect, useRef } from 'react';
import { Sparkles, User } from 'lucide-react';
import type { ChatMessage } from '@/stores/aiTutorStore';

interface AiMessageProps {
  message: ChatMessage;
  isNew?: boolean;
  onTypingComplete?: () => void;
}

export function AiMessage({ message, isNew = false, onTypingComplete }: AiMessageProps) {
  const isUser = message.role === 'user';
  const [displayedContent, setDisplayedContent] = useState(isUser || !isNew ? message.content : '');
  const [isTyping, setIsTyping] = useState(!isUser && isNew);
  const [showCursor, setShowCursor] = useState(!isUser && isNew);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const cursorRef = useRef<NodeJS.Timeout | null>(null);

  // Typing effect for AI messages
  useEffect(() => {
    if (!isUser && isNew && message.content) {
      setIsTyping(true);
      setShowCursor(true);
      setDisplayedContent('');

      let currentIndex = 0;
      const content = message.content;
      const baseSpeed = 15; // Base milliseconds per character

      const typeNextChunk = () => {
        if (currentIndex < content.length) {
          // Type multiple characters at once for speed, but vary the chunk size
          const chunkSize = Math.floor(Math.random() * 3) + 1; // 1-3 characters
          const nextIndex = Math.min(currentIndex + chunkSize, content.length);

          setDisplayedContent(content.slice(0, nextIndex));
          currentIndex = nextIndex;

          // Vary typing speed for natural feel
          let delay = baseSpeed;
          const lastChar = content[currentIndex - 1];

          // Pause longer at punctuation for natural reading
          if (['.', '!', '?'].includes(lastChar)) {
            delay = 150 + Math.random() * 100;
          } else if ([',', ';', ':'].includes(lastChar)) {
            delay = 80 + Math.random() * 50;
          } else if (lastChar === '\n') {
            delay = 100 + Math.random() * 50;
          } else {
            delay = baseSpeed + Math.random() * 10;
          }

          typingRef.current = setTimeout(typeNextChunk, delay);
        } else {
          // Typing complete
          setIsTyping(false);
          setTimeout(() => setShowCursor(false), 500);
          onTypingComplete?.();
        }
      };

      // Small delay before starting to type
      typingRef.current = setTimeout(typeNextChunk, 200);

      return () => {
        if (typingRef.current) {
          clearTimeout(typingRef.current);
        }
      };
    }
  }, [isUser, isNew, message.content, onTypingComplete]);

  // Blinking cursor effect
  useEffect(() => {
    if (showCursor) {
      cursorRef.current = setInterval(() => {
        // Cursor blink is handled by CSS animation
      }, 530);
    }
    return () => {
      if (cursorRef.current) {
        clearInterval(cursorRef.current);
      }
    };
  }, [showCursor]);

  // Simple markdown-like formatting
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        // Bold
        let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        // Code
        formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-neutral-200/50 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

        // Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
          );
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s/, '') }} />
          );
        }

        // Regular paragraph
        return line ? (
          <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
        ) : (
          <br key={i} />
        );
      });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fadeIn`}>
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
          ${isUser ? 'bg-primary' : 'bg-gradient-to-br from-primary to-accent'}
          ${isTyping ? 'animate-pulse' : ''}
        `}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Sparkles className={`w-4 h-4 text-white ${isTyping ? 'animate-spin-slow' : ''}`} />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`
          max-w-[80%] p-3 rounded-xl space-y-2 text-sm transition-all duration-300
          ${isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
          }
          ${!isUser && isNew ? 'shadow-sm' : ''}
        `}
      >
        <div className="leading-relaxed">
          {formatContent(displayedContent)}
          {/* Typing cursor */}
          {showCursor && (
            <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-blink align-middle" />
          )}
        </div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
