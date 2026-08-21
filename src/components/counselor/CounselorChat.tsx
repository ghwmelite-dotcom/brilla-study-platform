import { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Heart,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { cn } from '@/utils';
import { useCounselorStore } from '@/stores/counselorStore';
import { useAuthStore } from '@/stores/authStore';
import type { CounselorType, CounselorMessage, SuggestedResource } from '@/types';
import { COUNSELOR_CONFIGS } from '@/types/counselor';

interface CounselorChatProps {
  className?: string;
}

const counselorIcons: Record<CounselorType, React.ElementType> = {
  academic: GraduationCap,
  career: Briefcase,
  wellbeing: Heart,
  general: MessageSquare,
};

export function CounselorChat({ className }: CounselorChatProps) {
  const { user } = useAuthStore();
  const {
    isOpen,
    messages,
    currentConversation,
    counselorType,
    isLoading,
    thinkingStage,
    error,
    closeCounselor,
    sendMessage,
    clearMessages,
    rateFeedback,
    setCounselorType,
  } = useCounselorStore();

  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const config = COUNSELOR_CONFIGS[counselorType];
  const Icon = counselorIcons[counselorType];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 lg:inset-auto lg:bottom-6 lg:right-6 lg:w-[420px] lg:h-[600px] lg:max-h-[80vh]',
        'bg-white lg:rounded-2xl lg:shadow-2xl lg:border lg:border-neutral-200',
        'flex flex-col z-50',
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200"
        style={{ backgroundColor: `${config.color}10` }}
      >
        <button
          onClick={closeCounselor}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: config.color }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900">{config.name}</h3>
          <p className="text-xs text-neutral-500">{config.description}</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-white/50"
          >
            <MoreVertical className="w-5 h-5 text-neutral-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[160px] z-10">
              <button
                onClick={() => {
                  clearMessages();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            </div>
          )}
        </div>

        <button
          onClick={closeCounselor}
          className="hidden lg:flex p-2 rounded-lg hover:bg-white/50"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      {/* Counselor Type Tabs */}
      {!currentConversation && (
        <div className="flex border-b border-neutral-200 px-2">
          {(Object.keys(COUNSELOR_CONFIGS) as CounselorType[]).map((type) => {
            const TypeIcon = counselorIcons[type];
            const isActive = counselorType === type;
            return (
              <button
                key={type}
                onClick={() => setCounselorType(type)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <TypeIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{COUNSELOR_CONFIGS[type].name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${config.color}15` }}
            >
              <Icon className="w-8 h-8" style={{ color: config.color }} />
            </div>
            <h4 className="font-semibold text-neutral-900 mb-2">
              {user?.name ? `Hi ${user.name.split(' ')[0]}!` : 'Hello!'}
            </h4>
            <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto">
              {config.description}. How can I help you today?
            </p>

            {/* Quick Actions */}
            <div className="space-y-2">
              {config.quickActions.slice(0, 3).map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="block w-full text-left px-4 py-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <span className="text-sm text-neutral-900">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              config={config}
              onRate={rateFeedback}
            />
          ))
        )}

        {/* Thinking Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: config.color }}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="bg-neutral-100 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm text-neutral-600">
                  {thinkingStage === 'thinking' && 'Thinking...'}
                  {thinkingStage === 'composing' && 'Composing response...'}
                  {thinkingStage === 'typing' && 'Typing...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-neutral-200 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent max-h-32"
            style={{ minHeight: '48px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
              input.trim() && !isLoading
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-neutral-100 text-neutral-400'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-2 text-center">
          This is AI-powered support. For serious concerns, please speak with a trusted adult.
        </p>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  config,
  onRate,
}: {
  message: CounselorMessage;
  config: typeof COUNSELOR_CONFIGS[CounselorType];
  onRate: (messageId: string, rating: number, type?: 'helpful' | 'not_helpful') => void;
}) {
  const isUser = message.role === 'user';
  const Icon = counselorIcons[config.type as CounselorType];

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.color }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={cn('max-w-[80%] space-y-2', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary text-white rounded-tr-none'
              : 'bg-neutral-100 text-neutral-900 rounded-tl-none'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Suggested Resources */}
        {message.suggestedResources && message.suggestedResources.length > 0 && (
          <div className="space-y-1">
            {message.suggestedResources.map((resource, i) => (
              <ResourceChip key={i} resource={resource} />
            ))}
          </div>
        )}

        {/* Feedback (for counselor messages) */}
        {!isUser && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Was this helpful?</span>
            <button
              onClick={() => onRate(message.id, 1, 'helpful')}
              className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-green-500"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRate(message.id, 1, 'not_helpful')}
              className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-red-500"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Resource Chip Component
function ResourceChip({ resource }: { resource: SuggestedResource }) {
  return (
    <a
      href={resource.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-xs hover:border-primary hover:text-primary transition-colors"
    >
      <span>{resource.title}</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
