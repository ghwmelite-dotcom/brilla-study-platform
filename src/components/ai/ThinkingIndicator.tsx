import { Sparkles } from 'lucide-react';

interface ThinkingIndicatorProps {
  stage: 'thinking' | 'composing' | 'typing';
}

const stageMessages = {
  thinking: 'Thinking...',
  composing: 'Composing response...',
  typing: 'Typing...',
};

export function ThinkingIndicator({ stage }: ThinkingIndicatorProps) {
  return (
    <div className="flex gap-3">
      {/* Avatar with pulse animation */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
      </div>

      {/* Thinking bubble */}
      <div className="bg-neutral-100 rounded-xl rounded-tl-none p-3 max-w-[80%]">
        <div className="flex items-center gap-2">
          {/* Animated dots */}
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '0.6s' }}
            />
            <span
              className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full animate-bounce"
              style={{ animationDelay: '150ms', animationDuration: '0.6s' }}
            />
            <span
              className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full animate-bounce"
              style={{ animationDelay: '300ms', animationDuration: '0.6s' }}
            />
          </div>

          {/* Stage text with fade animation */}
          <span className="text-sm text-neutral-500 animate-pulse">
            {stageMessages[stage]}
          </span>
        </div>

        {/* Subtle progress bar */}
        <div className="mt-2 h-0.5 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
            style={{
              width: '100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>

      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
