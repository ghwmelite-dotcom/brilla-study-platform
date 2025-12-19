import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, BookOpen, Lightbulb, GraduationCap } from 'lucide-react';
import { useAiTutorStore, useAuthStore } from '@/stores';
import { AiMessage } from './AiMessage';

export function AiTutor() {
  const { user } = useAuthStore();
  const {
    isOpen,
    messages,
    isLoading,
    error,
    closeChat,
    sendMessage,
    clearMessages,
    clearError,
  } = useAiTutorStore();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
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
    if (!inputMessage.trim() || !user || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message, user.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Explain a concept', icon: BookOpen, prompt: 'Can you explain ' },
    { label: 'Study tips', icon: Lightbulb, prompt: 'What are some tips for ' },
    { label: 'Formula help', icon: GraduationCap, prompt: 'Help me understand the formula for ' },
  ];

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        onClick={closeChat}
      />

      {/* Chat panel */}
      <div className="fixed bottom-0 right-0 lg:bottom-4 lg:right-4 w-full lg:w-96 h-[80vh] lg:h-[600px] bg-white rounded-t-xl lg:rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-primary to-accent rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold">Brilla AI Tutor</h3>
              <p className="text-xs text-white/80">Powered by Claude</p>
            </div>
          </div>
          <button
            onClick={closeChat}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center pt-8">
              <Sparkles className="w-12 h-12 mx-auto text-primary/30 mb-4" />
              <h4 className="font-medium text-neutral-900 mb-2">
                Hi, I'm Brilla AI!
              </h4>
              <p className="text-sm text-neutral-500 mb-6">
                I'm here to help you prepare for NSMQ. Ask me anything about
                Maths, Physics, Chemistry, or Biology!
              </p>

              {/* Quick actions */}
              <div className="space-y-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-center gap-2 w-full p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors text-left"
                  >
                    <action.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-neutral-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <AiMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-500 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-200">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="w-full mt-2 text-xs text-neutral-400 hover:text-neutral-600"
            >
              Clear conversation
            </button>
          )}
        </div>
      </div>
    </>
  );
}
