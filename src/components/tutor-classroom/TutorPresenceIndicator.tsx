import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Users,
  Headphones,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils';

interface TutorPresenceIndicatorProps {
  isConnected: boolean;
  tutorName?: string;
  tutorAvatarUrl?: string;
  mode: 'observe' | 'co_teach' | 'takeover' | null;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

const modeConfig = {
  observe: {
    label: 'Observing',
    icon: Eye,
    color: 'violet',
    description: 'A tutor is watching your session',
  },
  co_teach: {
    label: 'Helping',
    icon: Users,
    color: 'emerald',
    description: 'A tutor is helping alongside the AI',
  },
  takeover: {
    label: 'Teaching',
    icon: Headphones,
    color: 'blue',
    description: 'A tutor has taken over the session',
  },
};

export function TutorPresenceIndicator({
  isConnected,
  tutorName,
  tutorAvatarUrl,
  mode,
  onDismiss,
  className,
  compact = false,
}: TutorPresenceIndicatorProps) {
  if (!isConnected || !mode) return null;

  const config = modeConfig[mode];
  const Icon = config.icon;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          config.color === 'violet' && "bg-violet-100 dark:bg-violet-900/30",
          config.color === 'emerald' && "bg-emerald-100 dark:bg-emerald-900/30",
          config.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30",
          className
        )}
      >
        <div className="relative">
          {tutorAvatarUrl ? (
            <img
              src={tutorAvatarUrl}
              alt={tutorName}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold",
              config.color === 'violet' && "bg-violet-500",
              config.color === 'emerald' && "bg-emerald-500",
              config.color === 'blue' && "bg-blue-500",
            )}>
              {tutorName?.[0]?.toUpperCase() || 'T'}
            </div>
          )}
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900",
            "bg-green-500 animate-pulse"
          )} />
        </div>
        <span className={cn(
          "text-xs font-medium",
          config.color === 'violet' && "text-violet-700 dark:text-violet-300",
          config.color === 'emerald' && "text-emerald-700 dark:text-emerald-300",
          config.color === 'blue' && "text-blue-700 dark:text-blue-300",
        )}>
          {tutorName || 'Tutor'} {config.label.toLowerCase()}
        </span>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50",
          className
        )}
      >
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-xl",
          config.color === 'violet' && "bg-violet-50/90 dark:bg-violet-900/50 border-violet-200 dark:border-violet-800",
          config.color === 'emerald' && "bg-emerald-50/90 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800",
          config.color === 'blue' && "bg-blue-50/90 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800",
        )}>
          {/* Tutor avatar */}
          <div className="relative">
            {tutorAvatarUrl ? (
              <img
                src={tutorAvatarUrl}
                alt={tutorName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
              />
            ) : (
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold ring-2 ring-white dark:ring-slate-800",
                config.color === 'violet' && "bg-gradient-to-br from-violet-500 to-purple-600",
                config.color === 'emerald' && "bg-gradient-to-br from-emerald-500 to-teal-600",
                config.color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600",
              )}>
                {tutorName?.[0]?.toUpperCase() || 'T'}
              </div>
            )}
            {/* Online pulse */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"
            />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {tutorName || 'Expert Tutor'}
              </span>
              <span className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                config.color === 'violet' && "bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300",
                config.color === 'emerald' && "bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300",
                config.color === 'blue' && "bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300",
              )}>
                <Icon className="w-3 h-3" />
                {config.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {config.description}
            </p>
          </div>

          {/* Sparkle effect for co-teach mode */}
          {mode === 'co_teach' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="text-amber-500"
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
          )}

          {/* Dismiss button */}
          {onDismiss && mode === 'observe' && (
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TutorPresenceIndicator;
