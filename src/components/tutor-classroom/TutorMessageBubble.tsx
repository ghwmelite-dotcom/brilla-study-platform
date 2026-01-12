import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/utils';

interface TutorMessageBubbleProps {
  tutorName?: string;
  tutorAvatarUrl?: string;
  message: string;
  timestamp?: string;
  isHighlighted?: boolean;
  className?: string;
}

export function TutorMessageBubble({
  tutorName,
  tutorAvatarUrl,
  message,
  timestamp,
  isHighlighted = false,
  className,
}: TutorMessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        "flex items-start gap-3 max-w-[85%]",
        className
      )}
    >
      {/* Tutor Avatar */}
      <div className="relative flex-shrink-0">
        {tutorAvatarUrl ? (
          <img
            src={tutorAvatarUrl}
            alt={tutorName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-200 dark:ring-emerald-800"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-2 ring-emerald-200 dark:ring-emerald-800">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
        )}
        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
      </div>

      {/* Message bubble */}
      <div className="flex-1 min-w-0">
        {/* Tutor name */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {tutorName || 'Expert Tutor'}
          </span>
          {isHighlighted && (
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-medium rounded">
              Important
            </span>
          )}
          {timestamp && (
            <span className="text-[10px] text-slate-400">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Message content */}
        <div className={cn(
          "px-4 py-3 rounded-2xl rounded-tl-md",
          isHighlighted
            ? "bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200 dark:border-emerald-800"
            : "bg-emerald-50 dark:bg-emerald-900/30"
        )}>
          <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default TutorMessageBubble;
