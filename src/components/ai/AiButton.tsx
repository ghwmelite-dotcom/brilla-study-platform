import { Sparkles } from 'lucide-react';
import { useAiTutorStore, useAuthStore } from '@/stores';

interface AiButtonProps {
  context?: string;
}

export function AiButton({ context }: AiButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { isOpen, openChat } = useAiTutorStore();

  if (!isAuthenticated || isOpen) return null;

  return (
    <button
      onClick={() => openChat(context)}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-30 group"
      title="Ask AI Tutor"
    >
      <Sparkles className="w-6 h-6 text-white" />

      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Ask AI Tutor
      </span>

      {/* Pulse effect */}
      <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
    </button>
  );
}
