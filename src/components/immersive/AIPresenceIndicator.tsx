import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface AIPresenceIndicatorProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  className?: string;
}

export function AIPresenceIndicator({
  isThinking = false,
  isSpeaking = false,
  isListening = false,
  className,
}: AIPresenceIndicatorProps) {
  // Determine the current state
  const state = isThinking ? 'thinking' : isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle';

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Main orb */}
      <div className="relative">
        {/* Outer glow */}
        <motion.div
          animate={{
            scale: state === 'idle' ? [1, 1.1, 1] : state === 'thinking' ? [1, 1.3, 1] : [1, 1.2, 1],
            opacity: state === 'idle' ? [0.2, 0.3, 0.2] : [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: state === 'thinking' ? 0.8 : state === 'speaking' ? 0.3 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute inset-0 rounded-full blur-xl",
            state === 'thinking' && "bg-violet-500",
            state === 'speaking' && "bg-emerald-500",
            state === 'listening' && "bg-blue-500",
            state === 'idle' && "bg-violet-500/50"
          )}
          style={{ transform: 'scale(1.5)' }}
        />

        {/* Inner orb */}
        <motion.div
          animate={{
            scale: state === 'speaking' ? [1, 1.15, 1] : [1, 1.05, 1],
          }}
          transition={{
            duration: state === 'speaking' ? 0.15 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "relative w-16 h-16 rounded-full flex items-center justify-center",
            "bg-gradient-to-br shadow-lg",
            state === 'thinking' && "from-violet-500 to-purple-600",
            state === 'speaking' && "from-emerald-500 to-teal-600",
            state === 'listening' && "from-blue-500 to-cyan-600",
            state === 'idle' && "from-violet-500/70 to-purple-600/70"
          )}
        >
          {/* Inner highlight */}
          <div className="absolute inset-2 rounded-full bg-white/10" />

          {/* Center dot/wave indicator */}
          {state === 'thinking' ? (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                  className="w-1.5 h-1.5 rounded-full bg-white"
                />
              ))}
            </div>
          ) : state === 'speaking' ? (
            <div className="flex items-end gap-0.5 h-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [4, 16 + Math.random() * 8, 4],
                  }}
                  transition={{
                    duration: 0.2 + Math.random() * 0.2,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                  className="w-1 bg-white rounded-full"
                  style={{ height: 4 }}
                />
              ))}
            </div>
          ) : state === 'listening' ? (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-4 h-4 rounded-full border-2 border-white"
            />
          ) : (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-white/80"
            />
          )}
        </motion.div>
      </div>

      {/* Status text */}
      <motion.p
        key={state}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 0.6, y: 0 }}
        className="text-xs text-white/60 font-light tracking-wide"
      >
        {state === 'thinking' && 'Thinking...'}
        {state === 'speaking' && 'Speaking'}
        {state === 'listening' && 'Listening...'}
        {state === 'idle' && 'Ready'}
      </motion.p>
    </div>
  );
}

export default AIPresenceIndicator;
