import { Sparkles, User } from 'lucide-react';
import type { ChatMessage } from '@/stores';

interface AiMessageProps {
  message: ChatMessage;
}

export function AiMessage({ message }: AiMessageProps) {
  const isUser = message.role === 'user';

  // Simple markdown-like formatting
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        // Bold
        let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Code
        formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-neutral-100 px-1 rounded text-sm">$1</code>');

        // Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
          );
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s/, '') }} />
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
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isUser ? 'bg-primary' : 'bg-gradient-to-br from-primary to-accent'}
        `}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`
          max-w-[80%] p-3 rounded-xl space-y-2 text-sm
          ${isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
          }
        `}
      >
        {formatContent(message.content)}
      </div>
    </div>
  );
}
